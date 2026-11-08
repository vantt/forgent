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
    granted_fetch_mappings, publication_fetch_mappings, CommitInput, ExpectedTip, HolderAuthority,
    Identity, Inspect, ObjectType, Oid, PathValue, Publication, PublicationPort, PushOutcome,
    RefName, RefValue, RemoteGrant, TreeEntry,
};
use fgos_holder_lock::{Acquire, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::path::Path;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

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

/// The one writer id of every transfer on this machine's mail-body ref, fetch and push alike. A
/// transfer left half done is recovered only under the writer that began it, so it is named for the
/// ref, never for the operation, and never varies.
pub(crate) const BODY_WRITER: &str = "mailbox-body";

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
/// `event-seal` hold, bound to `refs/fgos/mail-bodies/<this machine>` and [`BODY_WRITER`], the way
/// every outside caller of the publication port borrows the seal.
pub fn fetch(main: &Path, remote: &str) -> BodyFetch {
    match try_fetch(main, remote) {
        Ok(()) => BodyFetch::Fetched,
        Err(why) => BodyFetch::NotFetched(why),
    }
}

fn try_fetch(main: &Path, remote: &str) -> Result<(), String> {
    let clone = open_clone(main)?;
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
    on_body_ref(&clone, remote, None, |port, _| {
        port.fetch_refs(&clone.repo, remote, std::slice::from_ref(mapping))
            .map(|_| ())
            .map_err(|e| format!("body fetch: {e:?}"))
    })
}

fn open_clone(main: &Path) -> Result<EventStoreClone, String> {
    event_store_clone::open(main)
        .map_err(|f| format!("{}: {}", f.reason, f.detail))?
        .ok_or_else(|| "not a repository".to_owned())
}

/// Runs `work` on a publication port bound to this machine's mail-body ref and [`BODY_WRITER`],
/// under the machine's own `event-seal` hold, after recovering a transfer an earlier run left half
/// done. Fetch and push share this one door, so both run under the same authority and writer.
fn on_body_ref<T>(
    clone: &EventStoreClone,
    remote: &str,
    timeout: Option<Duration>,
    work: impl FnOnce(&PublicationPort<'_>, &RefName) -> Result<T, String>,
) -> Result<T, String> {
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
    let done = (|| {
        let authority = HolderAuthority::new(
            &clone.repo,
            &mut handle,
            &seal,
            reference.clone(),
            BODY_WRITER,
        )
        .map_err(|e| format!("{e:?}"))?;
        let mut port = PublicationPort::new(&clone.driver, authority).with_remote(RemoteGrant {
            name: remote.to_owned(),
            pinned_url,
        });
        if let Some(timeout) = timeout {
            port = port.with_transport_timeout(timeout);
        }
        port.recover_own_transfers(&clone.repo)
            .map_err(|e| format!("body transfer recovery: {e:?}"))?;
        work(&port, &reference)
    })();
    // A release that cannot be proven is reported, never ignored; the work's result stands.
    let released = fgos_holder_lock::release(handle);
    match (done, released) {
        (Err(why), _) => Err(why),
        (Ok(value), fgos_holder_lock::Release::Released { .. }) => Ok(value),
        (Ok(_), stuck) => Err(format!("event-seal release: {stuck:?}")),
    }
}

/// What a body push may take. A send waits on it, so it is bounded well under the publication
/// port's default; an acknowledgement that did not arrive in time refuses the send.
const PUSH_TIMEOUT: Duration = Duration::from_secs(30);

/// Stores `body` as one blob, named by its sha256, in the tree of this machine's mail-body ref and
/// pushes the ref to `remote`; `Ok` only after the remote acknowledged the push. `machine` is the
/// id the event will name as its sender: a receiver looks the blob up under that id, so a store
/// that names its refs otherwise is refused.
///
/// The new commit holds the tip's tree plus the blob (an absent ref starts empty; a ref this clone
/// has not written yet continues from its own mirror, so a fresh clone of the machine does not
/// cut the bodies the remote still holds). A body already in the tree adds nothing but is pushed
/// again, so a push that failed earlier is made up by the next send of the same text.
pub fn publish(main: &Path, remote: &str, machine: &str, body: &str) -> Result<(), String> {
    let clone = open_clone(main)?;
    if clone.machine != machine {
        return Err(format!(
            "the store names this machine {}, not {machine}",
            clone.machine
        ));
    }
    on_body_ref(&clone, remote, Some(PUSH_TIMEOUT), |port, reference| {
        let repo = &clone.repo;
        let failed = |what: &str, e: &dyn std::fmt::Debug| format!("{what}: {e:?}");
        let own = port
            .read_ref(repo, reference)
            .map_err(|e| failed("mail body ref read", &e))?;
        let (tip, expected) = match own {
            RefValue::Direct(tip) => (Some(tip.clone()), ExpectedTip::Oid(tip)),
            RefValue::Absent => {
                let mirrored = clone
                    .driver
                    .resolve_commit_ref(repo, &mirror_ref(remote, machine))
                    .map_err(|e| failed("mail body mirror read", &e))?;
                (mirrored, ExpectedTip::Absent)
            }
            RefValue::Symbolic(_) => return Err("the mail-body ref is symbolic".into()),
        };
        let mut entries = Vec::new();
        if let Some(tip) = &tip {
            let mut cursor = None;
            loop {
                let page = clone
                    .driver
                    .list_tree(repo, tip, b"", cursor, 10_000)
                    .map_err(|e| failed("mail body tree read", &e))?;
                for listed in page.entries {
                    if listed.kind != ObjectType::Blob || listed.path.contains(&b'/') {
                        return Err("the mail-body ref holds an entry that is not a blob".into());
                    }
                    entries.push(TreeEntry {
                        name: listed.path,
                        mode: listed.mode,
                        oid: listed.oid,
                    });
                }
                match page.next_cursor {
                    Some(next) if !page.complete => cursor = Some(next),
                    _ => break,
                }
            }
        }
        let name = sha256_hex(body.as_bytes()).into_bytes();
        if !entries.iter().any(|e| e.name == name) {
            let blob = port
                .write_blob(repo, body.as_bytes())
                .map_err(|e| failed("mail body write", &e))?;
            entries.push(TreeEntry {
                name,
                mode: 0o100644,
                oid: blob,
            });
            let tree = port
                .write_tree(repo, &entries)
                .map_err(|e| failed("mail body tree write", &e))?;
            let seconds = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map_or(0, |d| d.as_secs());
            let identity = || Identity {
                name: "fgOS Mailbox".into(),
                email: "mailbox@fgos.invalid".into(),
            };
            let date = format!("{seconds} +0000");
            let commit = port
                .write_commit(
                    repo,
                    &CommitInput {
                        tree,
                        parents: tip.into_iter().collect(),
                        author: identity(),
                        committer: identity(),
                        author_date: date.clone(),
                        committer_date: date,
                        message: b"mail bodies".to_vec(),
                    },
                )
                .map_err(|e| failed("mail body commit", &e))?;
            let operation = format!("mail-body-{}-{}", std::process::id(), commit.as_str());
            port.compare_and_swap(
                repo,
                reference,
                &expected,
                &ExpectedTip::Oid(commit),
                &operation,
            )
            .map_err(|e| failed("mail body ref update", &e))?;
        }
        let pushed = port
            .push_refs(repo, remote, &[(reference.clone(), reference.clone())])
            .map_err(|e| failed("mail body push", &e))?;
        match pushed.refs.first() {
            Some((_, PushOutcome::Accepted)) => Ok(()),
            other => Err(format!("mail body push not acknowledged: {other:?}")),
        }
    })
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

/// The sha256 of `bytes` as 64 lowercase hex digits: a body's `bodyHash` and the name of its blob.
pub fn sha256_hex(bytes: &[u8]) -> String {
    Sha256::digest(bytes)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

/// `blob` is the body of a header that signed `hash` and `bytes`: same digest, same length, text.
pub fn check(blob: &[u8], hash: &str, bytes: u64) -> Resolved {
    if sha256_hex(blob) != hash || blob.len() as u64 != bytes {
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
