//! `fgos.discussion.status`: one record each time a discussion's `discussion: <state>` marker flips on the trunk.
//!
//! The trunk's history is read through the Git component door (`DiscussionHistory`, satisfied by
//! `GitDiscussionHistory`); nothing is stored, every query walks the history again. The trunk is the remote-tracking
//! `main` when it is ahead of local `main` (the watcher fetches before a full tick), else local `main`. A branch that
//! has not landed has no discussion state.
//!
//! The trunk is followed along first parents and each commit is compared with its first parent, so a merge shows the
//! flips it brought in, at the merge. A root commit has nothing to compare with and records nothing.
//!
//! Per path the state starts as `none`. A commit that changes the path and carries a readable marker whose value
//! differs from the state emits one record and moves the state. A commit that leaves the marker alone, drops it, or
//! cannot be read keeps the state: no flip is invented. A deleted file emits nothing; a pure rename carries the state
//! to the new path.

use fgos_git::{
    DiffScope, DiffSides, GitDriver, Inspect, Oid, PathRead, PathValue, ReadObject, RefName,
    RefValue, RepoHandle, ResolveRepo, TrunkFact, WalkBounds,
};
use fgos_observe::record::types::{AttrValue, Basis, Origin, Record, SubjectRef, RECORD_VERSION};
use fgos_observe::time::ParsedWindow;
use fgos_observe::{RecordSource, SourceError, Window};
use std::collections::{BTreeMap, HashMap};
use std::path::{Path, PathBuf};

pub const DISCUSSION_STATUS_KIND: &str = "fgos.discussion.status";

const SOURCE_ID: &str = "discussion-history";
const ATTR_FROM: &str = "fgos.discussion.from";
const ATTR_TO: &str = "fgos.discussion.to";
const ATTR_PATH: &str = "fgos.discussion.path";
const NONE_STATE: &str = "none";
const DISCUSSION_PREFIX: &str = "docs/discussions/";
const DISCUSSION_FILE: &str = "DISCUSSION.md";
const MARKER_LINES: usize = 12;
const WALK_PAGE: usize = 1000;
const WALK_BYTES: usize = 8 * 1024 * 1024;
const OBJECT_BYTES: usize = 8 * 1024 * 1024;
const FILE_BYTES: usize = 256 * 1024;

/// A path a trunk commit changed (not deleted). `from` is the old path of a detected rename.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PathChange {
    pub path: String,
    pub from: Option<String>,
}

/// One trunk commit: its committer time in milliseconds and the changed paths that match the asked globs.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HistoryCommit {
    pub sha: String,
    pub ts_ms: i64,
    pub changes: Vec<PathChange>,
}

/// The one history the source reads. A glob is a literal prefix, optionally followed by `*` (any rest of the
/// path), or `<prefix>*<suffix>` with one `*` standing for any run of characters.
pub trait DiscussionHistory {
    /// Trunk commits, oldest first, each with the paths that changed and match one of `globs`. A commit that
    /// changes none of them may be left out.
    fn commits(&self, globs: &[&str]) -> Result<Vec<HistoryCommit>, String>;
    /// The text of `path` at `commit`; `None` when the file is absent, not a blob, or not readable text.
    fn blob(&self, commit: &str, path: &str) -> Result<Option<String>, String>;
}

/// Reads the discussion states of one history.
pub struct DiscussionSource<H: DiscussionHistory> {
    history: H,
}

impl<H: DiscussionHistory> DiscussionSource<H> {
    pub fn new(history: H) -> Self {
        Self { history }
    }

    /// Every flip whose commit time lies in the window, oldest first. The whole history is walked: a flip's `from`
    /// is the state before it, so the window only filters what is returned.
    pub fn records(&self, window: &Window) -> Result<Vec<Record>, String> {
        let window = ParsedWindow::parse(window)?;
        let commits = self.history.commits(&[
            "docs/discussions/*/DISCUSSION.md",
            "plans/reports/shaping-*.md",
        ])?;
        let mut states: HashMap<String, String> = HashMap::new();
        let mut out = Vec::new();
        for commit in &commits {
            for change in &commit.changes {
                let Some(subject) = subject_of(&change.path) else {
                    continue;
                };
                let previous = states
                    .get(&change.path)
                    .or_else(|| change.from.as_ref().and_then(|from| states.get(from)))
                    .cloned();
                let marker = self
                    .history
                    .blob(&commit.sha, &change.path)?
                    .and_then(|text| marker_of(&text));
                let state = match marker {
                    Some(state) => state,
                    None => {
                        // Absent or unreadable marker: the previous state stands, a rename carries it along.
                        if let Some(previous) = previous {
                            states.insert(change.path.clone(), previous);
                        }
                        continue;
                    }
                };
                let from = previous.unwrap_or_else(|| NONE_STATE.to_owned());
                states.insert(change.path.clone(), state.clone());
                if from == state || !window.contains(commit.ts_ms) {
                    continue;
                }
                let Some(ts) = rfc3339_utc(commit.ts_ms) else {
                    continue;
                };
                out.push(record(&commit.sha, &change.path, subject, ts, &from, state));
            }
        }
        Ok(out)
    }
}

impl<H: DiscussionHistory + Send + Sync> RecordSource for DiscussionSource<H> {
    fn source_id(&self) -> &'static str {
        SOURCE_ID
    }

    fn kinds(&self) -> &[&str] {
        &[DISCUSSION_STATUS_KIND]
    }

    fn records(&self, _root: &Path, w: &Window) -> Result<Vec<Record>, SourceError> {
        DiscussionSource::records(self, w).map_err(|message| SourceError::ReadFailed {
            source_id: SOURCE_ID,
            message,
        })
    }
}

fn record(sha: &str, path: &str, subject: &str, ts: String, from: &str, to: String) -> Record {
    Record {
        v: RECORD_VERSION,
        id: format!("{path}@{sha}"),
        kind: DISCUSSION_STATUS_KIND.to_owned(),
        ts,
        end_ts: None,
        subject: SubjectRef {
            kind: "discussion".to_owned(),
            id: subject.to_owned(),
        },
        refs: Vec::new(),
        attrs: BTreeMap::from([
            (ATTR_FROM.to_owned(), AttrValue::Str(from.to_owned())),
            (ATTR_TO.to_owned(), AttrValue::Str(to)),
            (ATTR_PATH.to_owned(), AttrValue::Str(path.to_owned())),
        ]),
        measures: BTreeMap::new(),
        basis: Basis::Derived,
        origin: Origin {
            source: SOURCE_ID.to_owned(),
            component: Some("host".to_owned()),
            ..Origin::default()
        },
        detail: None,
        redaction: None,
    }
}

/// The discussion a path belongs to: its directory under `docs/discussions/`, or the stem of a shaping report.
fn subject_of(path: &str) -> Option<&str> {
    if let Some(rest) = path.strip_prefix(DISCUSSION_PREFIX) {
        let (dir, file) = rest.split_once('/')?;
        return (file == DISCUSSION_FILE && !dir.is_empty()).then_some(dir);
    }
    let rest = path.strip_prefix("plans/reports/")?;
    let stem = rest.strip_suffix(".md")?;
    (rest.starts_with("shaping-") && !stem.contains('/')).then_some(stem)
}

/// `discussion: <state>` alone on one of the first lines.
fn marker_of(text: &str) -> Option<String> {
    text.lines().take(MARKER_LINES).find_map(|line| {
        let value = line.strip_prefix("discussion:")?.trim();
        let word = !value.is_empty() && value.chars().all(|c| c.is_alphanumeric() || c == '_');
        word.then(|| value.to_owned())
    })
}

fn glob_matches(glob: &str, path: &str) -> bool {
    match glob.split_once('*') {
        None => path == glob,
        Some((prefix, suffix)) => {
            path.len() >= prefix.len() + suffix.len()
                && path.starts_with(prefix)
                && path.ends_with(suffix)
        }
    }
}

fn rfc3339_utc(ms: i64) -> Option<String> {
    let seconds = ms.div_euclid(1000);
    let millis = ms.rem_euclid(1000);
    let days = seconds.div_euclid(86_400);
    let in_day = seconds.rem_euclid(86_400);
    // Days since 1970-01-01 to a civil date (proleptic Gregorian).
    let z = days.checked_add(719_468)?;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = yoe + era * 400 + i64::from(month <= 2);
    Some(format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}.{millis:03}Z",
        in_day / 3600,
        in_day % 3600 / 60,
        in_day % 60
    ))
}

/// The trunk history of the repository holding the project root, read through the Git component door.
/// `state_root` is the Git door's state directory; `None` is this process's own state root, the production choice.
pub struct GitDiscussionHistory {
    driver: GitDriver,
    repo: RepoHandle,
}

impl GitDiscussionHistory {
    /// `None` outside a repository.
    pub fn open(root: &Path, state_root: Option<PathBuf>) -> Result<Option<Self>, String> {
        let Some(state_root) = state_root else {
            return Ok(GitDriver::open_at(root)
                .map_err(|e| e.cause)?
                .map(|(driver, repo)| Self { driver, repo }));
        };
        let driver = GitDriver::new(&state_root).map_err(|e| e.cause)?;
        Ok(
            match driver.resolve_repo(root, root).map_err(|e| e.cause)? {
                ResolveRepo::Repository(repo) => Some(Self { driver, repo }),
                ResolveRepo::NotARepository => None,
            },
        )
    }

    fn resolve(&self, name: &str) -> Result<Option<Oid>, String> {
        let Ok(name) = RefName::parse(name) else {
            return Ok(None);
        };
        Ok(
            match self
                .driver
                .resolve_ref(&self.repo, &name)
                .map_err(|e| e.cause)?
            {
                RefValue::Direct(oid) => Some(oid),
                _ => None,
            },
        )
    }

    /// Local `main`, the trunk the Git door names, and the remote-tracking `main`, in preference order.
    fn trunk_candidates(&self) -> Result<Vec<Oid>, String> {
        let mut names = vec!["refs/heads/main".to_owned()];
        if let TrunkFact::Known(name) = self
            .driver
            .resolve_trunk(&self.repo, None)
            .map_err(|e| e.cause)?
        {
            names.push(name.as_str().to_owned());
        }
        names.push("refs/remotes/origin/main".to_owned());
        let mut tips: Vec<Oid> = Vec::new();
        let mut seen = Vec::new();
        for name in names {
            if seen.contains(&name) {
                continue;
            }
            if let Some(oid) = self.resolve(&name)? {
                if !tips.iter().any(|t| t.as_str() == oid.as_str()) {
                    tips.push(oid);
                }
            }
            seen.push(name);
        }
        Ok(tips)
    }

    /// The first parent of every commit reachable from `tips`.
    fn first_parents(&self, tips: &[Oid]) -> Result<HashMap<String, Option<String>>, String> {
        let mut parents = HashMap::new();
        let mut cursor = None;
        loop {
            let page = self
                .driver
                .walk_commits(
                    &self.repo,
                    tips,
                    &[],
                    cursor,
                    WalkBounds {
                        max_commits: WALK_PAGE,
                        max_bytes: WALK_BYTES,
                    },
                )
                .map_err(|e| e.cause)?;
            for commit in &page.commits {
                parents.insert(
                    commit.oid.as_str().to_owned(),
                    commit.parents.first().map(|p| p.as_str().to_owned()),
                );
            }
            match page.next_cursor {
                Some(next) if !page.complete => cursor = Some(next),
                _ => return Ok(parents),
            }
        }
    }

    /// The trunk tip, first parents back to the root, oldest first.
    fn trunk_chain(&self) -> Result<Vec<Oid>, String> {
        let tips = self.trunk_candidates()?;
        if tips.is_empty() {
            return Ok(Vec::new());
        }
        let parents = self.first_parents(&tips)?;
        let chain_of = |tip: &Oid| {
            let mut chain = vec![tip.as_str().to_owned()];
            while let Some(Some(parent)) = chain.last().and_then(|c| parents.get(c)) {
                chain.push(parent.clone());
            }
            chain
        };
        // The first candidate wins unless a later one is ahead of it (carries it on its own first-parent line).
        let mut best = (chain_of(&tips[0]), &tips[0]);
        for tip in &tips[1..] {
            let chain = chain_of(tip);
            if chain.iter().any(|c| c == best.1.as_str()) {
                best = (chain, tip);
            }
        }
        let format = self.repo.object_format();
        let mut chain = best
            .0
            .iter()
            .map(|sha| Oid::parse(sha, format).map_err(|_| "invalid-oid".to_owned()))
            .collect::<Result<Vec<_>, _>>()?;
        chain.reverse();
        Ok(chain)
    }

    fn committer_times(&self, ids: &[Oid]) -> Result<Vec<Option<i64>>, String> {
        let mut times = Vec::with_capacity(ids.len());
        for group in ids.chunks(250) {
            let objects = self
                .driver
                .read_objects(&self.repo, group, OBJECT_BYTES)
                .map_err(|e| e.cause)?;
            times.extend(objects.into_iter().map(|object| match object {
                ReadObject::Present { bytes, .. } => {
                    committer_seconds(&bytes).map(|seconds| seconds * 1000)
                }
                ReadObject::Missing => None,
            }));
        }
        Ok(times)
    }

    fn changes(
        &self,
        parent: &Oid,
        commit: &Oid,
        globs: &[&str],
    ) -> Result<Vec<PathChange>, String> {
        let scope = DiffScope {
            prefix: None,
            renames: true,
        };
        let mut found = Vec::new();
        let mut cursor = None;
        loop {
            let page = self
                .driver
                .diff(
                    &self.repo,
                    DiffSides::Objects(parent, commit),
                    &scope,
                    cursor,
                    4096,
                )
                .map_err(|e| e.cause)?;
            for entry in &page.entries {
                if entry.change == b'D' {
                    continue;
                }
                let Ok(path) = String::from_utf8(entry.path.clone()) else {
                    continue;
                };
                if !globs.iter().any(|g| glob_matches(g, &path)) {
                    continue;
                }
                let from = entry
                    .from
                    .as_ref()
                    .and_then(|f| String::from_utf8(f.clone()).ok());
                found.push(PathChange { path, from });
            }
            match page.next_cursor {
                Some(next) if !page.complete => cursor = Some(next),
                _ => return Ok(found),
            }
        }
    }
}

impl DiscussionHistory for GitDiscussionHistory {
    fn commits(&self, globs: &[&str]) -> Result<Vec<HistoryCommit>, String> {
        let chain = self.trunk_chain()?;
        let times = self.committer_times(&chain)?;
        let mut out = Vec::new();
        for (index, (commit, time)) in chain.iter().zip(&times).enumerate() {
            let (Some(parent), Some(ts_ms)) = (index.checked_sub(1).map(|i| &chain[i]), *time)
            else {
                continue; // The root has nothing to compare with.
            };
            let changes = self.changes(parent, commit, globs)?;
            if !changes.is_empty() {
                out.push(HistoryCommit {
                    sha: commit.as_str().to_owned(),
                    ts_ms,
                    changes,
                });
            }
        }
        Ok(out)
    }

    fn blob(&self, commit: &str, path: &str) -> Result<Option<String>, String> {
        let oid = Oid::parse(commit, self.repo.object_format()).map_err(|_| "invalid-oid")?;
        let reads: Vec<PathRead> = self
            .driver
            .read_paths_at(&self.repo, &oid, &[path.as_bytes().to_vec()], FILE_BYTES)
            .map_err(|e| e.cause)?;
        Ok(match reads.into_iter().next().map(|r| r.value) {
            Some(PathValue::Blob(bytes)) => String::from_utf8(bytes).ok(),
            _ => None,
        })
    }
}

/// `committer Name <mail> 1700000000 +0700` in the header of a raw commit object.
fn committer_seconds(commit: &[u8]) -> Option<i64> {
    let mut header = commit.split(|b| *b == b'\n').take_while(|l| !l.is_empty());
    let line = std::str::from_utf8(header.find(|l| l.starts_with(b"committer "))?).ok()?;
    let mut tail = line.rsplit(' ');
    let _zone = tail.next()?;
    tail.next()?.parse().ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn marker_is_read_from_the_first_lines_only() {
        assert_eq!(
            marker_of("# t\n\ndiscussion: settled\n"),
            Some("settled".into())
        );
        assert_eq!(marker_of("discussion: settled extra\n"), None);
        let late = format!("{}discussion: draft\n", "x\n".repeat(MARKER_LINES));
        assert_eq!(marker_of(&late), None);
    }

    #[test]
    fn subject_is_the_discussion_dir_or_the_report_stem() {
        assert_eq!(subject_of("docs/discussions/a/DISCUSSION.md"), Some("a"));
        assert_eq!(subject_of("plans/reports/shaping-x.md"), Some("shaping-x"));
        assert_eq!(subject_of("docs/discussions/a/b/DISCUSSION.md"), None);
        assert_eq!(subject_of("plans/reports/other.md"), None);
    }

    #[test]
    fn timestamp_formats_utc_with_millis() {
        assert_eq!(
            rfc3339_utc(1_700_000_000_123).as_deref(),
            Some("2023-11-14T22:13:20.123Z")
        );
    }
}
