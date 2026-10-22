//! Sequence counters: one ref per sequence kind, `refs/fgos/seq/<kind>`,
//! pointing at one parentless commit whose message is the last number
//! claimed. A claim replaces the commit with a new one through a
//! compare-and-swap (`--force-with-lease=<ref>:<old sha>` on a remote,
//! `update-ref <ref> <new> <old>` locally), so the forge or the ref store
//! accepts it only when nobody claimed in between. The loop that retries a
//! refused claim belongs to the caller (Identity); this module is the port.
use crate::{
    driver::{Output, Policy},
    remote::transfer_argv,
    *,
};
use std::time::Duration;

const NAMESPACE: &str = "refs/fgos/seq/";
const EMPTY_TREE_SHA1: &str = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
const EMPTY_TREE_SHA256: &str = "6ef19b41225c5369f1c104d45d8d85efa9b057b53b14b4b9b939dd74decc5321";
const LIMIT: usize = 64 * 1024;
const TIMEOUT: Duration = Duration::from_secs(60);
/// The remote the project's counters live on.
const REMOTE: &str = "origin";

/// The tip of one counter: the commit and the number in its message.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SequenceTip {
    pub oid: Oid,
    pub number: u64,
}

/// The answer of one claim attempt.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SequencePush {
    /// The counter now points at this commit.
    Claimed(Oid),
    /// Somebody moved the counter since it was read; read it again.
    Stale,
}

/// Where a counter lives: the project's remote, or this repository alone.
#[derive(Debug, Clone)]
pub enum SequenceHome {
    Remote(RemoteGrant),
    Local,
}

/// `refs/fgos/seq/<kind>`; a kind is lowercase letters, digits and hyphens.
pub fn sequence_ref(kind: &str) -> Result<RefName> {
    let valid = !kind.is_empty()
        && kind.len() <= 40
        && kind.starts_with(|c: char| c.is_ascii_lowercase())
        && !kind.ends_with('-')
        && kind
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-');
    if !valid {
        return Err(failure_text("invalid-sequence-kind"));
    }
    RefName::parse(&format!("{NAMESPACE}{kind}")).map_err(|e| failure_text(e.to_string()))
}

fn failure_text(cause: impl Into<String>) -> OperationError {
    crate::refs::failure(cause.into())
}

impl GitDriver {
    /// Where this repository's counters live: its `origin` when it has one,
    /// else the repository itself. An origin that cannot be read, or whose
    /// transport is not supported, is a refusal here, before any claim:
    /// it is never mistaken for "no origin".
    pub fn sequence_home(&self, repo: &RepoHandle) -> Result<SequenceHome> {
        let key = format!("remote.{REMOTE}.url");
        if crate::driver::config_facts(self, repo, &key)?.is_empty() {
            return Ok(SequenceHome::Local);
        }
        let grant = RemoteGrant {
            name: REMOTE.into(),
            pinned_url: Inspect::remote_url(self, repo, REMOTE)?,
        };
        self.remote_target(repo, &grant)?;
        Ok(SequenceHome::Remote(grant))
    }

    /// The counter of `kind`: `None` while nobody claimed a number.
    pub fn sequence_tip(
        &self,
        repo: &RepoHandle,
        home: &SequenceHome,
        kind: &str,
    ) -> Result<Option<SequenceTip>> {
        let name = sequence_ref(kind)?;
        let oid = match home {
            SequenceHome::Local => self.local_tip(repo, &name)?,
            SequenceHome::Remote(grant) => {
                let (url, scheme) = self.remote_target(repo, grant)?;
                self.remote_tip(repo, &url, scheme, &name)?
            }
        };
        let Some(oid) = oid else { return Ok(None) };
        if let SequenceHome::Remote(grant) = home {
            if self
                .checked(
                    repo,
                    &["cat-file", "-e", &format!("{}^{{commit}}", oid.as_str())],
                    Policy::Inspect,
                )
                .is_err()
            {
                let (url, scheme) = self.remote_target(repo, grant)?;
                self.fetch_commit(repo, &url, scheme, &oid)?;
            }
        }
        let commit = self.checked(repo, &["cat-file", "commit", oid.as_str()], Policy::Inspect)?;
        let number =
            commit_number(&commit).ok_or_else(|| failure_text("sequence-ref-malformed"))?;
        Ok(Some(SequenceTip { oid, number }))
    }

    /// Replaces the counter of `kind` by a parentless commit carrying
    /// `number`, only when it still points at `expected` (`None`: only when
    /// it does not exist yet). `claimant` names the author of the commit and
    /// must differ between two claims that may race: two claims of the same
    /// number made within one second would otherwise build the same commit,
    /// and the forge would accept both.
    pub fn sequence_push(
        &self,
        repo: &RepoHandle,
        home: &SequenceHome,
        kind: &str,
        expected: Option<&Oid>,
        number: u64,
        claimant: &str,
    ) -> Result<SequencePush> {
        let name = sequence_ref(kind)?;
        let commit = self.new_counter_commit(repo, number, claimant)?;
        match home {
            SequenceHome::Local => {
                let old = expected.map_or_else(
                    || "0".repeat(commit.as_str().len()),
                    |o| o.as_str().to_owned(),
                );
                let out = self.run_local(
                    repo,
                    &[
                        "update-ref",
                        "--no-deref",
                        name.as_str(),
                        commit.as_str(),
                        &old,
                    ],
                )?;
                if out.success {
                    return Ok(SequencePush::Claimed(commit));
                }
                // A refused swap is a counter that moved; anything else is a fault.
                match self.local_tip(repo, &name)? {
                    current if current.as_ref() != expected => Ok(SequencePush::Stale),
                    _ => Err(out.error("sequence-update-failed")),
                }
            }
            SequenceHome::Remote(grant) => {
                self.require_floor()?;
                let (url, scheme) = self.remote_target(repo, grant)?;
                let lease = format!(
                    "--force-with-lease={}:{}",
                    name.as_str(),
                    expected.map_or("", Oid::as_str)
                );
                let args: Vec<String> = [
                    "push",
                    "--porcelain",
                    "--no-verify",
                    "--no-follow-tags",
                    "--recurse-submodules=no",
                    &lease,
                    "--",
                    &url,
                    &format!("{}:{}", commit.as_str(), name.as_str()),
                ]
                .map(str::to_owned)
                .to_vec();
                let out = self.remote_run(repo, scheme, &args)?;
                if out.success {
                    return Ok(SequencePush::Claimed(commit));
                }
                // Only git's own lease verdict means the counter moved. Any other
                // refused ref (a receive hook, a protection rule) keeps its stderr.
                if out.stdout.split(|b| *b == b'\n').any(is_stale_lease_row) {
                    return Ok(SequencePush::Stale);
                }
                Err(out.error("sequence-push-failed"))
            }
        }
    }

    fn run_local(&self, repo: &RepoHandle, args: &[&str]) -> Result<Output> {
        self.require_floor()?;
        self.preflight(repo)?;
        self.invoke(
            Some(repo),
            repo.trusted_main_root(),
            args,
            Policy::LocalMutation,
            None,
            true,
            LIMIT,
            TIMEOUT,
        )
    }

    fn remote_run(&self, repo: &RepoHandle, scheme: &str, args: &[String]) -> Result<Output> {
        self.preflight(repo)?;
        let argv = transfer_argv(scheme, args);
        self.invoke(
            Some(repo),
            repo.trusted_main_root(),
            &argv.iter().map(String::as_str).collect::<Vec<_>>(),
            Policy::Remote,
            None,
            true,
            LIMIT,
            TIMEOUT,
        )
    }

    fn local_tip(&self, repo: &RepoHandle, name: &RefName) -> Result<Option<Oid>> {
        self.require_floor()?;
        self.preflight(repo)?;
        let out = self.invoke(
            Some(repo),
            repo.trusted_main_root(),
            &[
                "rev-parse",
                "--verify",
                "--quiet",
                &format!("{}^{{commit}}", name.as_str()),
            ],
            Policy::Inspect,
            None,
            true,
            LIMIT,
            TIMEOUT,
        )?;
        match (out.success, out.code) {
            (true, _) => Ok(Some(parse_oid(repo, &out.stdout)?)),
            (false, Some(1)) => Ok(None),
            _ => Err(out.error("sequence-read-failed")),
        }
    }

    fn remote_tip(
        &self,
        repo: &RepoHandle,
        url: &str,
        scheme: &str,
        name: &RefName,
    ) -> Result<Option<Oid>> {
        let args: Vec<String> = ["ls-remote", "--refs", "--", url, name.as_str()]
            .map(str::to_owned)
            .to_vec();
        let out = self.remote_run(repo, scheme, &args)?;
        if !out.success {
            return Err(out.error("sequence-read-failed"));
        }
        let text = std::str::from_utf8(&out.stdout)
            .map_err(|_| failure_text("git-protocol-invalid-utf8"))?;
        for line in text.lines() {
            if let Some((oid, advertised)) = line.split_once('\t') {
                if advertised == name.as_str() {
                    return Ok(Some(
                        Oid::parse(oid, repo.object_format())
                            .map_err(|e| failure_text(e.to_string()))?,
                    ));
                }
            }
        }
        Ok(None)
    }

    fn fetch_commit(&self, repo: &RepoHandle, url: &str, scheme: &str, oid: &Oid) -> Result<()> {
        let args: Vec<String> = [
            "fetch",
            "--no-write-fetch-head",
            "--no-tags",
            "--no-recurse-submodules",
            "--no-auto-maintenance",
            "--",
            url,
            oid.as_str(),
        ]
        .map(str::to_owned)
        .to_vec();
        let out = self.remote_run(repo, scheme, &args)?;
        if out.success {
            Ok(())
        } else {
            Err(out.error("sequence-fetch-failed"))
        }
    }

    /// A parentless commit on the empty tree whose message is `number`.
    fn new_counter_commit(&self, repo: &RepoHandle, number: u64, claimant: &str) -> Result<Oid> {
        let valid = !claimant.is_empty()
            && claimant.len() <= 64
            && claimant
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"-_.@".contains(&b));
        if !valid {
            return Err(failure_text("invalid-sequence-claimant"));
        }
        let tree = match repo.object_format() {
            ObjectFormat::Sha1 => EMPTY_TREE_SHA1,
            ObjectFormat::Sha256 => EMPTY_TREE_SHA256,
        };
        let message = number.to_string();
        let out = self.run_local(
            repo,
            &[
                "-c",
                &format!("user.name={claimant}"),
                "-c",
                "user.email=fgos@localhost",
                "-c",
                "commit.gpgsign=false",
                "commit-tree",
                tree,
                "-m",
                &message,
            ],
        )?;
        if !out.success {
            return Err(out.error("sequence-commit-failed"));
        }
        parse_oid(repo, &out.stdout)
    }
}

fn parse_oid(repo: &RepoHandle, bytes: &[u8]) -> Result<Oid> {
    let text = std::str::from_utf8(bytes).map_err(|_| failure_text("git-protocol-invalid-utf8"))?;
    Oid::parse(text.trim(), repo.object_format()).map_err(|e| failure_text(e.to_string()))
}

/// The number in the message of a raw commit: the text after the header's blank line.
fn commit_number(raw: &[u8]) -> Option<u64> {
    let text = std::str::from_utf8(raw).ok()?;
    let (_, message) = text.split_once("\n\n")?;
    let message = message.trim();
    (!message.is_empty() && message.bytes().all(|b| b.is_ascii_digit()))
        .then(|| message.parse().ok())
        .flatten()
}

/// A `push --porcelain` row `!\t<from>:<to>\t[rejected] (stale info)`: the
/// expected tip no longer matches the remote's.
fn is_stale_lease_row(line: &[u8]) -> bool {
    line.first() == Some(&b'!') && line.trim_ascii_end().ends_with(b"[rejected] (stale info)")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_counter_kind_is_a_lowercase_slug() {
        assert_eq!(
            sequence_ref("d-adr").unwrap().as_str(),
            "refs/fgos/seq/d-adr"
        );
        for bad in ["", "D-ADR", "d adr", "d/adr", "-d", "d-", "d..adr"] {
            assert!(sequence_ref(bad).is_err(), "{bad:?} must be refused");
        }
    }

    #[test]
    fn the_number_is_read_from_the_message_only() {
        let raw = b"tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904\nauthor a <a> 1 +0000\ncommitter a <a> 1 +0000\n\n0063\n";
        assert_eq!(commit_number(raw), Some(63));
        assert_eq!(commit_number(b"tree x\n\nnot a number\n"), None);
        assert_eq!(commit_number(b"tree x\n\n\n"), None);
    }

    #[test]
    fn only_git_s_stale_lease_row_is_a_lost_lease() {
        let row = |reason: &str| format!("!\tabc:refs/fgos/seq/d-adr\t{reason}\n").into_bytes();
        assert!(is_stale_lease_row(&row("[rejected] (stale info)")));
        for other in [
            "[remote rejected] (pre-receive hook declined)",
            "[remote rejected] (protected branch hook declined)",
            "[rejected] (fetch first)",
        ] {
            assert!(!is_stale_lease_row(&row(other)), "{other}");
        }
        assert!(!is_stale_lease_row(b"*\tabc:ref\t[new reference]"));
    }
}
