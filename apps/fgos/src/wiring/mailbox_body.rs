//! Where the body of a version 3 `mailbox.message-sent` lives on the receiving machine: one blob,
//! named by the body's sha256, in the tree of the tip of the sender machine's mail-body ref as this
//! clone mirrors it (`refs/fgos/remotes/<remote>/mail-bodies/<machine>`). The read goes through the
//! Git driver's ref and path reads, the same door the Event Store reads through; the mirror is
//! never part of the Event Store.
use fgos_git::{Inspect, Oid, PathValue};
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
