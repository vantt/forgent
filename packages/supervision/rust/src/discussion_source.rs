//! `fgos.discussion.status`: one record each time a discussion's `discussion: <state>` marker flips on the trunk.
//!
//! The trunk's history is read through the Git component door (`DiscussionHistory`, satisfied by
//! `GitDiscussionHistory`); nothing is stored, every query walks the history again. The trunk is the one the Git
//! door's `resolve_trunk` names; a trunk it found only as the main checkout's attached branch is not trusted, and then
//! nothing is emitted. Of the trunk branch and its remote-tracking twin, the one ahead is read (the watcher fetches
//! before a full tick). A branch that has not landed has no discussion state.
//!
//! The trunk is followed along first parents through `GitDriver::walk_changes`, the one history read door, so a merge
//! shows the flips it brought in, at the merge, and a root commit is read like any other: a discussion first committed
//! there goes from `none` to its state.
//!
//! Per path the state starts as `none`. A commit that changes the path and carries a readable marker whose value
//! differs from the state emits one record and moves the state. A commit that leaves the marker alone, drops it, or
//! cannot be read keeps the state: no flip is invented. A deleted file emits nothing. A rename emits nothing either:
//! the file is the same discussion under a new name, so its state moves with it (taking the marker the renamed file
//! carries, so a later edit is compared with what the file said when it moved).

use fgos_git::{
    GitDriver, Inspect, Oid, PathRead, PathValue, RefName, RefValue, RepoHandle, ResolveRepo,
    TrunkFact, TrunkSource, WalkChanges,
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
const WALK_COMMITS: usize = 1_000_000;
const WALK_BYTES: usize = 64 * 1024 * 1024;
const FILE_BYTES: usize = 256 * 1024;

/// A path a trunk commit changed (not deleted). `from` is the old path when the change is a rename.
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

/// The one history the source reads.
pub trait DiscussionHistory {
    /// Trunk commits, oldest first, root included, each with the paths under one of the literal `prefixes` that
    /// changed. A commit that changes none of them may be left out.
    fn commits(&self, prefixes: &[&str]) -> Result<Vec<HistoryCommit>, String>;
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
        let commits = self
            .history
            .commits(&["docs/discussions", "plans/reports"])?;
        let mut states: HashMap<String, String> = HashMap::new();
        let mut out = Vec::new();
        for commit in &commits {
            for change in &commit.changes {
                let Some(subject) = subject_of(&change.path) else {
                    continue;
                };
                let marker = self
                    .history
                    .blob(&commit.sha, &change.path)?
                    .and_then(|text| marker_of(&text));
                if let Some(source) = &change.from {
                    // A rename is the same discussion under a new name: no flip, the state moves with it.
                    if let Some(state) = marker.or_else(|| states.get(source).cloned()) {
                        states.insert(change.path.clone(), state);
                    }
                    continue;
                }
                let previous = states.get(&change.path).cloned();
                let Some(state) = marker else {
                    continue; // Absent or unreadable marker: the previous state stands.
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

    /// The trunk read through the Git door, with its local and remote-tracking twins in preference order. A trunk
    /// the door found only as the main checkout's attached branch is not trusted (it can be a side branch): no tips.
    fn trunk_candidates(&self) -> Result<Vec<Oid>, String> {
        let trunk = match self
            .driver
            .resolve_trunk(&self.repo, None)
            .map_err(|e| e.cause)?
        {
            TrunkFact::Known { trunk, source } if source != TrunkSource::AttachedHead => trunk,
            _ => return Ok(Vec::new()),
        };
        let trunk = trunk.as_str();
        let names = match trunk.strip_prefix("refs/remotes/") {
            Some(rest) => match rest.split_once('/') {
                Some((_, branch)) => vec![format!("refs/heads/{branch}"), trunk.to_owned()],
                None => vec![trunk.to_owned()],
            },
            None => vec![trunk.to_owned()],
        };
        let mut tips: Vec<Oid> = Vec::new();
        for name in names {
            if let Some(oid) = self.resolve(&name)? {
                if !tips.iter().any(|t| t.as_str() == oid.as_str()) {
                    tips.push(oid);
                }
            }
        }
        Ok(tips)
    }

    /// The trunk tip: the local trunk branch unless a later candidate carries it (is ahead of it).
    fn trunk_tip(&self) -> Result<Option<Oid>, String> {
        let tips = self.trunk_candidates()?;
        let Some((first, rest)) = tips.split_first() else {
            return Ok(None);
        };
        let mut best = first.clone();
        for tip in rest {
            let ahead = |a: &Oid, b: &Oid| -> Result<bool, String> {
                Ok(self
                    .driver
                    .count_commits(&self.repo, a, Some(b))
                    .map_err(|e| e.cause)?
                    > 0)
            };
            if ahead(tip, &best)? && !ahead(&best, tip)? {
                best = tip.clone();
            }
        }
        Ok(Some(best))
    }
}

impl DiscussionHistory for GitDiscussionHistory {
    fn commits(&self, prefixes: &[&str]) -> Result<Vec<HistoryCommit>, String> {
        let Some(tip) = self.trunk_tip()? else {
            return Ok(Vec::new());
        };
        let walked = self
            .driver
            .walk_changes(
                &self.repo,
                &WalkChanges {
                    tips: &[tip],
                    first_parent: true,
                    since: None,
                    paths: prefixes,
                    renames: true,
                    max_commits: WALK_COMMITS,
                    max_bytes: WALK_BYTES,
                },
            )
            .map_err(|e| e.cause)?;
        if walked.truncated {
            return Err("discussion-history-truncated".to_owned());
        }
        Ok(walked
            .commits
            .iter()
            .rev()
            .map(|commit| HistoryCommit {
                sha: commit.oid.as_str().to_owned(),
                ts_ms: commit.commit_time * 1000,
                changes: commit
                    .changes
                    .iter()
                    .filter(|change| change.status != b'D')
                    .filter_map(|change| {
                        Some(PathChange {
                            path: String::from_utf8(change.path.clone()).ok()?,
                            from: change
                                .from
                                .as_ref()
                                .and_then(|from| String::from_utf8(from.clone()).ok()),
                        })
                    })
                    .collect(),
            })
            .collect())
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
