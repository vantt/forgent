//! `walk_changes`: the one history read door. It answers which commits changed a path set, since a point, with each
//! commit's times, first parent and changed paths (status, rename source). One bounded `git log` through the hardened
//! driver; a read, so no lock and no WAL entry.
use crate::{
    driver::Policy,
    inspect::{literal_prefix, records},
    *,
};
use std::time::Duration;

/// Margin before an instant for git's own age cut-off: git stops its walk after a few commits older than the cut-off,
/// and a branch can carry commits whose time runs behind its parent's. The door still returns only commits whose
/// committer time is at or after the instant.
const SKEW_SECONDS: i64 = 3 * 24 * 3600;
const MAX_COMMITS_CEILING: usize = 1_000_000;
const MAX_BYTES_CEILING: usize = 256 * 1024 * 1024;
const MAX_PATHS: usize = 1024;

/// Where the walk stops.
#[derive(Debug, Clone)]
pub enum Since {
    /// Commits reachable from the tips but not from this commit.
    Commit(Oid),
    /// Commits committed at or after this instant, in seconds since the epoch.
    Instant(i64),
}

/// A request for `GitDriver::walk_changes`. `paths` are literal repository-relative prefixes, at least one.
/// `max_commits` bounds the commits returned (the newest are kept and the answer says it was cut); `max_bytes`
/// bounds git's output, and exceeding it is the named error `walk-changes-output-bound`.
#[derive(Debug, Clone)]
pub struct WalkChanges<'a> {
    pub tips: &'a [Oid],
    /// Follow only first parents; a merge then reports its changes against its first parent. Otherwise every
    /// reachable commit is walked and a merge reports none, its parents' commits being walked on their own.
    pub first_parent: bool,
    pub since: Option<Since>,
    pub paths: &'a [&'a str],
    /// Report a rename once under its new path with its source in `from`; otherwise both paths appear alone.
    pub renames: bool,
    pub max_commits: usize,
    pub max_bytes: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PathChange {
    pub path: Vec<u8>,
    /// The status letter: one of `A C D M T U X B`, or `R` for a rename (only with `renames`).
    pub status: u8,
    pub from: Option<Vec<u8>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangedCommit {
    pub oid: Oid,
    /// The first parent; none for a root commit.
    pub parent: Option<Oid>,
    pub author_time: i64,
    pub commit_time: i64,
    /// Only the changes inside the requested paths; never empty.
    pub changes: Vec<PathChange>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangedCommits {
    /// Newest first.
    pub commits: Vec<ChangedCommit>,
    /// The commit bound stopped the walk before the since point: older matching commits exist.
    pub truncated: bool,
}

impl GitDriver {
    pub fn walk_changes(
        &self,
        repo: &RepoHandle,
        request: &WalkChanges<'_>,
    ) -> Result<ChangedCommits> {
        if request.tips.is_empty() {
            return Ok(ChangedCommits {
                commits: Vec::new(),
                truncated: false,
            });
        }
        if request.max_commits == 0
            || request.max_commits > MAX_COMMITS_CEILING
            || request.max_bytes == 0
            || request.max_bytes > MAX_BYTES_CEILING
            || request.paths.is_empty()
            || request.paths.len() > MAX_PATHS
        {
            return Err(failure("invalid-walk-changes-bounds"));
        }
        for oid in request.tips.iter().chain(match &request.since {
            Some(Since::Commit(oid)) => Some(oid),
            _ => None,
        }) {
            Oid::parse(oid.as_str(), repo.object_format())
                .map_err(|_| failure("object-format-mismatch"))?;
        }
        let mut args: Vec<String> = ["log", "--no-color", "--no-ext-diff", "--no-textconv"]
            .map(String::from)
            .into();
        args.push("-z".into());
        args.push("--root".into());
        args.push("--name-status".into());
        args.push(if request.renames {
            "--find-renames".into()
        } else {
            "--no-renames".into()
        });
        args.push(if request.first_parent {
            "--first-parent".into()
        } else {
            "--full-history".into()
        });
        args.push("--format=%x01%H%x00%P%x00%at%x00%ct".into());
        args.push(format!("--max-count={}", request.max_commits + 1));
        if let Some(Since::Instant(seconds)) = &request.since {
            args.push(format!("--since={}", seconds.saturating_sub(SKEW_SECONDS)));
        }
        args.extend(request.tips.iter().map(|t| t.as_str().to_owned()));
        if let Some(Since::Commit(oid)) = &request.since {
            args.push(format!("^{}", oid.as_str()));
        }
        args.push("--".into());
        for path in request.paths {
            args.push(format!(":(literal){}", literal_prefix(path)?));
        }
        let argv: Vec<&str> = args.iter().map(String::as_str).collect();
        self.require_floor()?;
        self.preflight(repo)?;
        let out = self.invoke(
            Some(repo),
            repo.trusted_main_root(),
            &argv,
            Policy::Inspect,
            None,
            true,
            request.max_bytes,
            Duration::from_secs(120),
        );
        let out = match out {
            Ok(out) => out,
            Err(e) if e.cause == "git-output-limit" => {
                return Err(failure("walk-changes-output-bound"))
            }
            Err(e) => return Err(e),
        };
        if !out.success {
            return Err(out.error("git-command-failed"));
        }
        let mut commits = parse(repo, &out.stdout)?;
        let floor = match &request.since {
            Some(Since::Instant(seconds)) => Some(*seconds),
            _ => None,
        };
        let truncated = commits.len() > request.max_commits;
        commits.truncate(request.max_commits);
        commits.retain(|c| floor.is_none_or(|f| c.commit_time >= f));
        Ok(ChangedCommits { commits, truncated })
    }
}

/// `\x01 oid NUL parents NUL author-time NUL committer-time NUL`, then `status NUL path NUL [path NUL]` entries
/// (the first status token carries the format's newline). A commit with no entries inside the paths is dropped.
fn parse(repo: &RepoHandle, bytes: &[u8]) -> Result<Vec<ChangedCommit>> {
    let bad = || failure("invalid-walk-changes-protocol");
    let tokens = records(bytes.strip_suffix(b"\n").unwrap_or(bytes))?;
    let mut rest = tokens.as_slice();
    let mut commits = Vec::new();
    while let Some((head, tail)) = rest.split_first() {
        let oid = head.strip_prefix(&[1u8]).ok_or_else(bad)?;
        let [parents, author, committer, tail @ ..] = tail else {
            return Err(bad());
        };
        rest = tail;
        let mut changes = Vec::new();
        while let Some((status, tail)) = rest.split_first() {
            if status.first() == Some(&1) {
                break;
            }
            let status = status.strip_prefix(b"\n").unwrap_or(status);
            let renamed = matches!(status.first(), Some(b'R') | Some(b'C'))
                && status.len() > 1
                && status[1..].iter().all(u8::is_ascii_digit);
            let arity = if renamed { 2 } else { 1 };
            if tail.len() < arity
                || tail[..arity].iter().any(|p| p.is_empty())
                || (!renamed && (status.len() != 1 || !b"ACDMTUXB".contains(&status[0])))
            {
                return Err(bad());
            }
            changes.push(PathChange {
                path: tail[arity - 1].to_vec(),
                status: status[0],
                from: renamed.then(|| tail[0].to_vec()),
            });
            rest = &tail[arity..];
        }
        if changes.is_empty() {
            continue;
        }
        let parse_oid = |raw: &[u8]| {
            std::str::from_utf8(raw)
                .ok()
                .and_then(|text| Oid::parse(text, repo.object_format()).ok())
                .ok_or_else(bad)
        };
        let seconds = |raw: &[u8]| {
            std::str::from_utf8(raw)
                .ok()
                .and_then(|text| text.parse::<i64>().ok())
                .ok_or_else(bad)
        };
        commits.push(ChangedCommit {
            oid: parse_oid(oid)?,
            parent: parents
                .split(|b| *b == b' ')
                .find(|p| !p.is_empty())
                .map(parse_oid)
                .transpose()?,
            author_time: seconds(author)?,
            commit_time: seconds(committer)?,
            changes,
        });
    }
    Ok(commits)
}
