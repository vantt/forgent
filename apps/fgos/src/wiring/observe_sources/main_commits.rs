//! `fgos.main.commit`, projected from the trunk branch's first-parent history through the Git component door.
//! Nothing is stored: every query walks the window again.
//!
//! The trunk is the one `land` merges into: an explicit or remote-default trunk, never the main checkout's attached
//! branch (which can be a side branch). With no known trunk, or outside a repository, the source has no records.
//!
//! One record per first-parent commit inside the window; a merge commit is sorted by its diff against its first
//! parent. A commit that touched several kinds counts once, under the first match in this order (most durable first):
//! `code` (any path outside `plans/`), `plan-status` (a `plans/<dir>/plan.md` whose front matter `status` changed),
//! `backlog`, `discussion`, `report`, `plan-note` (anything else under `plans/`).
//!
//! A record's subject is the trunk branch, `branch:<name>`, and its id `main-commit:<sha>`. Every record carries all
//! six kind measures (`fgos.main.commit.<kind>`: `1` on the commit's own kind, `0` on the others, so an hour with
//! none of a kind still sums to 0) and `fgos.main.commit.note` is `1` for the kinds that are notes
//! about work rather than work (`plan-note`, `report`, `discussion`), so a definition can `sum:` each count.

use super::plan_text::plan_fields;
use super::MAIN_COMMIT_KIND;
use fgos_git::{
    ChangedCommit, GitDriver, Inspect, Oid, PathRead, PathValue, RefName, RefValue, RepoHandle,
    ResolveRepo, Since, TrunkFact, TrunkSource, WalkChanges,
};
use fgos_host_runtime::civil_time::{format_unix_millis_rfc3339, parse_rfc3339_millis};
use fgos_observe::record::types::{AttrValue, Basis, Origin, Record, SubjectRef, RECORD_VERSION};
use fgos_observe::{RecordSource, SourceError, Window};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

const SOURCE_ID: &str = "main-commits";
/// The most trunk commits one query walks; the window is hours, so this is far above any real count.
const WALK_LIMIT: usize = 2000;
const WALK_BYTES: usize = 16 * 1024 * 1024;
const PLAN_FILE_BYTES: usize = 256 * 1024;

/// The kinds, most durable first: the order decides which one a mixed commit counts under.
pub const KINDS: [&str; 6] = [
    "code",
    "plan-status",
    "backlog",
    "discussion",
    "report",
    "plan-note",
];
const NOTE_KINDS: [&str; 3] = ["plan-note", "report", "discussion"];

/// Reads the trunk history of the repository at the project root. `state_root` is the Git door's state directory;
/// `None` is this process's own state root, the production choice.
#[derive(Debug, Clone, Default)]
pub struct MainCommitsSource {
    state_root: Option<PathBuf>,
}

impl MainCommitsSource {
    pub fn new() -> Self {
        Self::default()
    }

    #[cfg(test)]
    pub fn with_state_root(state_root: PathBuf) -> Self {
        Self {
            state_root: Some(state_root),
        }
    }

    fn open(&self, root: &Path) -> Result<Option<(GitDriver, RepoHandle)>, String> {
        let Some(state_root) = &self.state_root else {
            return GitDriver::open_at(root).map_err(|e| e.cause);
        };
        let driver = GitDriver::new(state_root).map_err(|e| e.cause)?;
        match driver.resolve_repo(root, root).map_err(|e| e.cause)? {
            ResolveRepo::Repository(repo) => Ok(Some((driver, repo))),
            ResolveRepo::NotARepository => Ok(None),
        }
    }
}

impl RecordSource for MainCommitsSource {
    fn source_id(&self) -> &'static str {
        SOURCE_ID
    }

    fn kinds(&self) -> &[&str] {
        &[MAIN_COMMIT_KIND]
    }

    fn records(&self, root: &Path, w: &Window) -> Result<Vec<Record>, SourceError> {
        let bounds = (
            w.since.as_deref().and_then(parse_rfc3339_millis),
            w.until.as_deref().and_then(parse_rfc3339_millis),
        );
        let Some((driver, repo)) = self.open(root).map_err(failed)? else {
            return Ok(Vec::new());
        };
        let mut records = commit_records(&driver, &repo, bounds.0).map_err(failed)?;
        records.retain(|r| inside(&r.ts, bounds));
        Ok(records)
    }
}

fn failed(message: String) -> SourceError {
    SourceError::ReadFailed {
        source_id: SOURCE_ID,
        message,
    }
}

fn inside(ts: &str, (since, until): (Option<i64>, Option<i64>)) -> bool {
    let Some(ms) = parse_rfc3339_millis(ts) else {
        return false;
    };
    since.is_none_or(|s| ms >= s) && until.is_none_or(|u| ms < u)
}

/// The trunk's branch name and the tip to walk: the local branch when it exists, else the trunk ref itself.
fn trunk_tip(driver: &GitDriver, repo: &RepoHandle) -> Result<Option<(String, Oid)>, String> {
    let (trunk, source) = match driver.resolve_trunk(repo, None).map_err(|e| e.cause)? {
        TrunkFact::Known { trunk, source } => (trunk, source),
        TrunkFact::Unknown(_) => return Ok(None),
    };
    if source == TrunkSource::AttachedHead {
        return Ok(None);
    }
    let full = trunk.as_str();
    let name = match full.strip_prefix("refs/heads/") {
        Some(name) => name,
        None => match full
            .strip_prefix("refs/remotes/")
            .and_then(|rest| rest.split_once('/'))
        {
            Some((_, name)) => name,
            None => return Ok(None),
        },
    };
    let local = RefName::parse(&format!("refs/heads/{name}")).map_err(|e| e.to_string())?;
    for candidate in [&local, &trunk] {
        if let RefValue::Direct(oid) = driver.resolve_ref(repo, candidate).map_err(|e| e.cause)? {
            return Ok(Some((name.to_owned(), oid)));
        }
    }
    Ok(None)
}

fn blob_text(read: Option<&PathRead>) -> Option<String> {
    match &read?.value {
        PathValue::Blob(bytes) => String::from_utf8(bytes.clone()).ok(),
        _ => None,
    }
}

/// The kind a path under `plans/` counts under. A `plan.md` is `plan-note` here; whether its status changed is a
/// read the caller makes.
fn plans_path_kind(path: &str) -> &'static str {
    let rest = path.strip_prefix("plans/").unwrap_or(path);
    if rest == "backlog.md" || rest.starts_with("backlog/") {
        "backlog"
    } else if rest.starts_with("discussions/") {
        "discussion"
    } else if rest.starts_with("reports/")
        || rest.starts_with("handoffs/")
        || rest.split('/').nth(1) == Some("reports")
    {
        "report"
    } else {
        "plan-note"
    }
}

/// `plans/<dir>/plan.md`: the path whose status flip makes a `plan-status` commit.
fn is_plan_file(path: &str) -> bool {
    path.strip_prefix("plans/")
        .and_then(|rest| rest.split_once('/'))
        .is_some_and(|(dir, file)| !dir.is_empty() && file == "plan.md")
}

/// A commit sorted by its paths alone: its kind, or the plan files whose status must be compared first. `Open`
/// holds the kind among the other paths (`plan-note` when only plan files changed) for when no status changed.
enum Sorted {
    Kind(&'static str),
    Open {
        plan_files: Vec<String>,
        rest: &'static str,
    },
}

fn sort_paths(commit: &ChangedCommit) -> Sorted {
    let mut plan_files = Vec::new();
    let mut best = KINDS.len() - 1;
    for change in &commit.changes {
        let Some(path) = std::str::from_utf8(&change.path)
            .ok()
            .filter(|p| p.starts_with("plans/"))
        else {
            return Sorted::Kind("code");
        };
        if is_plan_file(path) {
            plan_files.push(path.to_owned());
        }
        let rank = KINDS
            .iter()
            .position(|k| *k == plans_path_kind(path))
            .unwrap_or(KINDS.len() - 1);
        best = best.min(rank);
    }
    if plan_files.is_empty() {
        Sorted::Kind(KINDS[best])
    } else {
        Sorted::Open {
            plan_files,
            rest: KINDS[best],
        }
    }
}

fn record(sha: &str, ts: String, branch: &str, kind: &str) -> Record {
    let mut measures = BTreeMap::new();
    for k in KINDS {
        measures.insert(
            format!("{MAIN_COMMIT_KIND}.{k}"),
            serde_json::Number::from(u64::from(k == kind)),
        );
    }
    measures.insert(
        format!("{MAIN_COMMIT_KIND}.note"),
        serde_json::Number::from(u64::from(NOTE_KINDS.contains(&kind))),
    );
    Record {
        v: RECORD_VERSION,
        id: format!("main-commit:{sha}"),
        kind: MAIN_COMMIT_KIND.to_owned(),
        ts,
        end_ts: None,
        subject: SubjectRef {
            kind: "branch".to_owned(),
            id: branch.to_owned(),
        },
        refs: Vec::new(),
        attrs: BTreeMap::from([
            (
                format!("{MAIN_COMMIT_KIND}.kind"),
                AttrValue::Str(kind.to_owned()),
            ),
            ("fgos.git.commit".to_owned(), AttrValue::Str(sha.to_owned())),
        ]),
        measures,
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

fn commit_records(
    driver: &GitDriver,
    repo: &RepoHandle,
    since: Option<i64>,
) -> Result<Vec<Record>, String> {
    let Some((branch, tip)) = trunk_tip(driver, repo)? else {
        return Ok(Vec::new());
    };
    // The door takes whole seconds: the first second whose millisecond start is inside the window.
    let since_seconds = since.map(|ms| (ms + 999).div_euclid(1000));
    // The door takes literal prefixes, never "every path": the tip's top-level entries cover the whole tree.
    let mut top = std::collections::BTreeSet::new();
    let mut cursor = None;
    loop {
        let page = driver
            .list_tree(repo, &tip, b"", cursor, 100_000)
            .map_err(|e| e.cause)?;
        for entry in page.entries {
            let first = entry.path.split(|b| *b == b'/').next().unwrap_or_default();
            if let Ok(name) = std::str::from_utf8(first) {
                top.insert(name.to_owned());
            }
        }
        match page.next_cursor {
            Some(next) if !page.complete => cursor = Some(next),
            _ => break,
        }
    }
    let top_paths: Vec<&str> = top.iter().map(String::as_str).collect();
    let tips = [tip];
    let found = driver
        .walk_changes(
            repo,
            &WalkChanges {
                tips: &tips,
                first_parent: true,
                since: since_seconds.map(Since::Instant),
                paths: &top_paths,
                renames: false,
                max_commits: WALK_LIMIT,
                max_bytes: WALK_BYTES,
            },
        )
        .map_err(|e| e.cause)?;

    let mut sorted = Vec::with_capacity(found.commits.len());
    // Commits whose kind hangs on a plan.md status flip: their parent and commit sides are read in one batch.
    let mut reads: Vec<(Oid, Vec<Vec<u8>>)> = Vec::new();
    let mut open: Vec<usize> = Vec::new();
    for (i, commit) in found.commits.iter().enumerate() {
        let entry = sort_paths(commit);
        if let Sorted::Open { plan_files, .. } = &entry {
            let paths: Vec<Vec<u8>> = plan_files.iter().map(|p| p.clone().into_bytes()).collect();
            // A root commit has no parent: both sides read the commit, so a created plan counts as unchanged.
            let parent = commit.parent.clone().unwrap_or_else(|| commit.oid.clone());
            reads.push((parent, paths.clone()));
            reads.push((commit.oid.clone(), paths));
            open.push(i);
        }
        sorted.push(entry);
    }
    let answers = if reads.is_empty() {
        Vec::new()
    } else {
        driver
            .read_paths_at_many(repo, &reads, PLAN_FILE_BYTES)
            .map_err(|e| e.cause)?
    };
    let mut status_changed: BTreeMap<usize, bool> = BTreeMap::new();
    for (i, sides) in open.iter().zip(answers.chunks(2)) {
        let [before, after] = sides else { continue };
        let changed = before.iter().zip(after).any(|(b, a)| {
            let Some(after) = blob_text(Some(a)).map(|t| plan_fields(&t)) else {
                return false; // The plan file was deleted: no status to compare.
            };
            let before = blob_text(Some(b)).map(|t| plan_fields(&t));
            before.and_then(|f| f.status) != after.status
        });
        status_changed.insert(*i, changed);
    }

    let mut out = Vec::with_capacity(sorted.len());
    for (i, (commit, entry)) in found.commits.iter().zip(sorted).enumerate() {
        let Some(ts) = format_unix_millis_rfc3339(commit.commit_time * 1000, 0) else {
            continue;
        };
        let kind = match entry {
            Sorted::Kind(kind) => kind,
            // plan-status outranks every plans/ kind: `code` already returned in sort_paths.
            Sorted::Open { .. } if status_changed.get(&i) == Some(&true) => "plan-status",
            Sorted::Open { rest, .. } => rest,
        };
        out.push(record(commit.oid.as_str(), ts, &branch, kind));
    }
    Ok(out)
}
