//! Where the body of a version 3 `mailbox.message-sent` lives on the receiving machine: one blob,
//! named by the body's sha256, in the tree of the tip of the sender machine's mail-body ref as this
//! clone mirrors it (`refs/fgos/remotes/<remote>/mail-bodies/<machine>`). The read goes through the
//! Git driver's ref and path reads, the same door the Event Store reads through; the mirror is
//! never part of the Event Store.
//!
//! The mirror is filled by [`fetch`], which the sync child runs after the Event Store sync and
//! before ingest: events first, then bodies, so a header never waits on a body that the same sync
//! could have brought.
use fgos_event_store::locks::{APPEND_WAIT_MS, SEAL_NAME};
use fgos_git::{
    granted_fetch_mappings, publication_fetch_mappings, HolderAuthority, Inspect, Oid, PathValue,
    Publication, PublicationPort, RefName, RemoteGrant,
};
use fgos_holder_lock::{Acquire, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::path::Path;

use super::event_store_clone::{self, EventStoreClone};
use super::mailbox_remote::WIRE_MAX_BODY_BYTES;

/// What the mirror holds for one message header.
#[derive(Debug, PartialEq, Eq)]
pub enum Resolved {
    /// The blob is there and its bytes are the body the header signed.
    Body(String),
    /// The ref or the blob is absent: only the header is left.
    Expired,
    /// A blob is there but is not the body the header names.
    Malformed,
}

/// The one writer id of the mail-body fetch. A transfer left half done is recovered only under the
/// writer that began it, so this never varies.
const FETCH_WRITER: &str = "mailbox-body-fetch";

/// Whether this sync brought the mail-body mirrors up to date after its event fetch. A header whose
/// body is absent is expired only after a [`BodyFetch::Fetched`]; otherwise nothing is known about
/// the body and the header is held.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BodyFetch {
    Fetched,
    /// Why the mirrors were not fetched.
    NotFetched(String),
}

/// Fetches the mail-body mirrors of `remote` into the clone `main` is in. Call it only after the
/// Event Store sync of the same run returned. The transfer runs under the machine's own
/// `event-seal` hold, bound to `refs/fgos/mail-bodies/<this machine>` and [`FETCH_WRITER`], the way
/// every outside caller of the publication port borrows the seal.
pub fn fetch(main: &Path, remote: &str) -> BodyFetch {
    match try_fetch(main, remote) {
        Ok(()) => BodyFetch::Fetched,
        Err(why) => BodyFetch::NotFetched(why),
    }
}

fn try_fetch(main: &Path, remote: &str) -> Result<(), String> {
    let clone = event_store_clone::open(main)
        .map_err(|f| format!("{}: {}", f.reason, f.detail))?
        .ok_or("not a repository")?;
    // The mapping the clone needs is the granted one the Event Store sync does not require; a clone
    // that has not run setup again lacks it, and nothing is fetched without it.
    let required = publication_fetch_mappings(remote).map_err(|e| format!("{e:?}"))?;
    let mut bodies = granted_fetch_mappings(remote).map_err(|e| format!("{e:?}"))?;
    bodies.retain(|mapping| !required.contains(mapping));
    let [mapping] = bodies.as_slice() else {
        return Err("no mail-body fetch mapping is granted".into());
    };
    let configured = clone
        .driver
        .configured_fetch_refspecs(&clone.repo, remote)
        .map_err(|e| format!("fetch mapping read: {e:?}"))?;
    if !configured
        .iter()
        .any(|fact| fact.value == mapping.as_bytes())
    {
        return Err("the mail-body fetch mapping is not installed; run doctor --fix".into());
    }
    if !fgos_identity::machine::valid_machine_id(&clone.machine) {
        return Err("this machine id is not a ref component".into());
    }
    let reference = RefName::parse(&format!("refs/fgos/mail-bodies/{}", clone.machine))
        .map_err(|e| e.to_string())?;
    let pinned_url = fgos_event_store::refspec::pinned_url(&clone.driver, &clone.repo, remote)
        .map_err(|e| e.to_string())?;
    let seal = clone.layout.seal_lock();
    let mut handle = match fgos_holder_lock::acquire(
        &Resource::new(SEAL_NAME, seal.clone()),
        Mode::Ex,
        Wait::Ms(APPEND_WAIT_MS),
        DEFAULT_KILL_WAIT_MS,
    ) {
        Acquire::Acquired(handle) => handle,
        other => return Err(format!("event-seal not taken: {other:?}")),
    };
    let fetched = (|| {
        let authority =
            HolderAuthority::new(&clone.repo, &mut handle, &seal, reference, FETCH_WRITER)
                .map_err(|e| format!("{e:?}"))?;
        let port = PublicationPort::new(&clone.driver, authority).with_remote(RemoteGrant {
            name: remote.to_owned(),
            pinned_url,
        });
        port.recover_own_transfers(&clone.repo)
            .map_err(|e| format!("body fetch recovery: {e:?}"))?;
        port.fetch_refs(&clone.repo, remote, std::slice::from_ref(mapping))
            .map(|_| ())
            .map_err(|e| format!("body fetch: {e:?}"))
    })();
    // A release that cannot be proven is reported, never ignored; the fetch result stands.
    let released = fgos_holder_lock::release(handle);
    match (fetched, released) {
        (Err(why), _) => Err(why),
        (Ok(()), fgos_holder_lock::Release::Released { .. }) => Ok(()),
        (Ok(()), stuck) => Err(format!("event-seal release: {stuck:?}")),
    }
}

/// The mirror of `machine`'s mail-body ref in this clone, for fetch remote `remote`.
pub fn mirror_ref(remote: &str, machine: &str) -> String {
    format!("refs/fgos/remotes/{remote}/mail-bodies/{machine}")
}

/// Reads bodies from the mirrors of one clone; opens the clone and resolves each machine's tip once.
pub struct BodyMirror<'a> {
    main: &'a Path,
    remote: &'a str,
    clone: Option<Option<EventStoreClone>>,
    tips: BTreeMap<String, Option<Oid>>,
}

impl<'a> BodyMirror<'a> {
    pub fn new(main: &'a Path, remote: &'a str) -> Self {
        Self {
            main,
            remote,
            clone: None,
            tips: BTreeMap::new(),
        }
    }

    /// The body `hash` names in `machine`'s mirror, checked against `hash` and `bytes`. An `Err`
    /// is a Git read that failed, never a verdict on the message.
    pub fn resolve(&mut self, machine: &str, hash: &str, bytes: u64) -> Result<Resolved, String> {
        if !fgos_identity::machine::valid_machine_id(machine) {
            return Ok(Resolved::Malformed);
        }
        if self.clone.is_none() {
            let opened = event_store_clone::open(self.main)
                .map_err(|f| format!("{}: {}", f.reason, f.detail))?;
            self.clone = Some(opened);
        }
        let clone = self.clone.as_ref().and_then(Option::as_ref);
        let Some(clone) = clone else {
            return Ok(Resolved::Expired);
        };
        if !self.tips.contains_key(machine) {
            let tip = clone
                .driver
                .resolve_commit_ref(&clone.repo, &mirror_ref(self.remote, machine))
                .map_err(|e| format!("mail body mirror of {machine}: {e:?}"))?;
            self.tips.insert(machine.to_owned(), tip);
        }
        let Some(tip) = &self.tips[machine] else {
            return Ok(Resolved::Expired);
        };
        let read = clone
            .driver
            .read_paths_at(
                &clone.repo,
                tip,
                &[hash.as_bytes().to_vec()],
                WIRE_MAX_BODY_BYTES as usize,
            )
            .map_err(|e| format!("mail body read of {machine}: {e:?}"))?
            .pop();
        Ok(match read.map(|r| r.value) {
            Some(PathValue::Blob(blob)) => check(&blob, hash, bytes),
            None | Some(PathValue::Absent) => Resolved::Expired,
            Some(PathValue::NotABlob(_)) => Resolved::Malformed,
            Some(PathValue::Error(e)) if e.cause == "blob-too-large" => Resolved::Malformed,
            Some(PathValue::Error(e)) => {
                return Err(format!("mail body read of {machine}: {}", e.cause))
            }
        })
    }
}

/// `blob` is the body of a header that signed `hash` and `bytes`: same digest, same length, text.
pub fn check(blob: &[u8], hash: &str, bytes: u64) -> Resolved {
    let digest: String = Sha256::digest(blob)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect();
    if digest != hash || blob.len() as u64 != bytes {
        return Resolved::Malformed;
    }
    match std::str::from_utf8(blob) {
        Ok(text) => Resolved::Body(text.to_owned()),
        Err(_) => Resolved::Malformed,
    }
}

#[cfg(test)]
mod tests {
    use super::{check, mirror_ref, BodyMirror, Resolved};
    use sha2::{Digest, Sha256};
    use std::path::Path;
    use std::process::Command;

    fn hex(bytes: &[u8]) -> String {
        Sha256::digest(bytes)
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect()
    }

    fn git(dir: &Path, args: &[&str], stdin: Option<&str>) -> String {
        use std::io::Write;
        let mut child = Command::new("git")
            .arg("-C")
            .arg(dir)
            .args(args)
            .env("GIT_AUTHOR_NAME", "t")
            .env("GIT_AUTHOR_EMAIL", "t@t")
            .env("GIT_COMMITTER_NAME", "t")
            .env("GIT_COMMITTER_EMAIL", "t@t")
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .spawn()
            .unwrap();
        child
            .stdin
            .take()
            .unwrap()
            .write_all(stdin.unwrap_or("").as_bytes())
            .unwrap();
        let out = child.wait_with_output().unwrap();
        assert!(out.status.success(), "git {args:?}");
        String::from_utf8(out.stdout).unwrap().trim().to_owned()
    }

    #[test]
    fn a_body_is_taken_only_when_its_digest_length_and_text_match_the_signed_header() {
        let body = "hello";
        let hash = hex(body.as_bytes());
        assert_eq!(
            check(body.as_bytes(), &hash, 5),
            Resolved::Body("hello".into())
        );
        assert_eq!(check(body.as_bytes(), &hash, 4), Resolved::Malformed);
        assert_eq!(check(b"hellO", &hash, 5), Resolved::Malformed);
        let binary = [0xff, 0xfe];
        assert_eq!(check(&binary, &hex(&binary), 2), Resolved::Malformed);
    }

    #[test]
    fn a_body_is_read_from_the_senders_mirror_and_a_missing_ref_or_blob_is_expired() {
        let dir = std::env::temp_dir().join(format!("fgos-body-mirror-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        git(&dir, &["init", "-q"], None);
        let held = "held body";
        let hash = hex(held.as_bytes());
        let blob = git(&dir, &["hash-object", "-w", "--stdin"], Some(held));
        // A tree entry whose name is another body's hash but whose bytes are not that body.
        let wrong_hash = hex(b"another body");
        let wrong = git(&dir, &["hash-object", "-w", "--stdin"], Some("not it"));
        let tree = git(
            &dir,
            &["mktree"],
            Some(&format!(
                "100644 blob {blob}\t{hash}\n100644 blob {wrong}\t{wrong_hash}\n"
            )),
        );
        let commit = git(&dir, &["commit-tree", &tree, "-m", "bodies"], None);
        let machine = "alpha-abcdef";
        git(
            &dir,
            &["update-ref", &mirror_ref("origin", machine), &commit],
            None,
        );

        let mut mirror = BodyMirror::new(&dir, "origin");
        assert_eq!(
            mirror.resolve(machine, &hash, held.len() as u64),
            Ok(Resolved::Body(held.into()))
        );
        assert_eq!(
            mirror.resolve(machine, &wrong_hash, 12),
            Ok(Resolved::Malformed)
        );
        assert_eq!(
            mirror.resolve(machine, &hex(b"gone"), 4),
            Ok(Resolved::Expired),
            "a blob the tip does not hold"
        );
        assert_eq!(
            mirror.resolve("beta-abcdef", &hash, held.len() as u64),
            Ok(Resolved::Expired),
            "a machine whose mirror was never fetched"
        );
        assert_eq!(
            mirror.resolve("../x", &hash, 1),
            Ok(Resolved::Malformed),
            "a machine id that is not a ref component"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }
}
