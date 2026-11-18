//! `fgos.plan.status` and `fgos.plan.activity`, projected from git history (through the Git component door) and from
//! the program board log. Nothing is stored: every query walks the history again.
//!
//! Commits are read from every branch tip (HEAD, local and remote branches). A merge commit is skipped: the commits
//! it brings in are walked on their own, so a transition is recorded once, at the commit that made it. A plan file
//! created by a commit has no earlier value and records no transition. Ids are deterministic (plan dir, change and
//! commit), so the same commit seen from two branches is one record.
//!
//! The walk is bounded (`WALK_LIMIT` commits). A repository with more history than that is read newest first and the
//! older part is not seen; the bound is a stated limit, not a silent one.

use super::plan_text::{log_line, plan_dir_names, plan_fields, PlanFields};
use super::{PLAN_ACTIVITY_KIND, PLAN_STATUS_KIND};
use fgos_git::{
    DiffScope, DiffSides, GitDriver, HeadFact, Inspect, Oid, PathValue, ReadObject, RefPrefix,
    RefValue, RepoHandle, ResolveRepo, WalkBounds,
};
use fgos_host_runtime::civil_time::{
    days_from_civil, format_unix_millis_rfc3339, parse_rfc3339_millis,
};
use fgos_observe::record::types::{AttrValue, Basis, Origin, Record, SubjectRef, RECORD_VERSION};
use fgos_observe::{RecordSource, SourceError, Window};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::io::BufRead;
use std::path::{Path, PathBuf};

const SOURCE_ID: &str = "plan-history";
const WALK_LIMIT: usize = 20_000;
const WALK_PAGE: usize = 250;
const WALK_BYTES: usize = 8 * 1024 * 1024;
/// The total of one batch of commit objects; a page holds `WALK_PAGE` commits of a few hundred bytes to a few KB.
const COMMIT_OBJECT_BYTES: usize = 8 * 1024 * 1024;
const PLAN_FILE_BYTES: usize = 256 * 1024;
const BOARD_LOG: &str = "plans/261017-1313-fgos-platform-program-board/log.md";
/// A page older than the window by more than this is the end of what can still hold a commit inside it: the walk
/// follows parents, and a branch can carry commits whose time runs a little behind its parent's.
const WINDOW_SLACK_MS: i64 = 3 * 24 * 3600 * 1000;

/// Reads the plan history of the repository at the project root. `state_root` is the Git door's state directory;
/// `None` is this process's own state root, the production choice.
#[derive(Debug, Default, Clone)]
pub struct PlanHistorySource {
    state_root: Option<PathBuf>,
}

impl PlanHistorySource {
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

impl RecordSource for PlanHistorySource {
    fn source_id(&self) -> &'static str {
        SOURCE_ID
    }

    fn kinds(&self) -> &[&str] {
        &[PLAN_STATUS_KIND, PLAN_ACTIVITY_KIND]
    }

    fn records(&self, root: &Path, w: &Window) -> Result<Vec<Record>, SourceError> {
        let bounds = (
            w.since.as_deref().and_then(parse_rfc3339_millis),
            w.until.as_deref().and_then(parse_rfc3339_millis),
        );
        let mut records = Vec::new();
        // Not a repository: no commits to read, the board log may still answer.
        if let Some((driver, repo)) = self.open(root).map_err(failed)? {
            records.extend(commit_records(&driver, &repo, bounds.0).map_err(failed)?);
        }
        records.extend(board_log_records(root, bounds.0));
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

fn origin() -> Origin {
    Origin {
        source: SOURCE_ID.to_owned(),
        component: Some("host".to_owned()),
        ..Origin::default()
    }
}

fn plan_subject(dir: &str) -> SubjectRef {
    SubjectRef {
        kind: "plan".to_owned(),
        id: dir.to_owned(),
    }
}

fn utc(ms: i64) -> Option<String> {
    format_unix_millis_rfc3339(ms, 0)
}

fn record(
    id: String,
    kind: &str,
    ts: String,
    dir: &str,
    attrs: BTreeMap<String, AttrValue>,
) -> Record {
    Record {
        v: RECORD_VERSION,
        id,
        kind: kind.to_owned(),
        ts,
        end_ts: None,
        subject: plan_subject(dir),
        refs: Vec::new(),
        attrs,
        measures: BTreeMap::new(),
        basis: Basis::Derived,
        origin: origin(),
        detail: None,
        redaction: None,
    }
}

fn text(value: &str) -> AttrValue {
    AttrValue::Str(value.to_owned())
}

/// The plan directory a repository path lies in (`plans/<dir>/...`), and whether the path is its `plan.md`.
fn plan_path(path: &[u8]) -> Option<(String, bool)> {
    let path = std::str::from_utf8(path).ok()?;
    let rest = path.strip_prefix("plans/")?;
    let (dir, file) = rest.split_once('/')?;
    (!dir.is_empty()).then(|| (dir.to_owned(), file == "plan.md"))
}

/// One record per changed field: `from` is what the parent held, `to` what the commit holds.
pub fn status_transitions(
    dir: &str,
    commit: &str,
    ts: &str,
    before: &PlanFields,
    after: &PlanFields,
) -> Vec<Record> {
    let mut out = Vec::new();
    for (change, from, to) in [
        ("status", &before.status, &after.status),
        ("priority", &before.priority, &after.priority),
    ] {
        let (Some(from), Some(to)) = (from, to) else {
            continue; // A field with no value on one side is not a transition: nothing is guessed.
        };
        if from == to {
            continue;
        }
        let attrs = BTreeMap::from([
            ("fgos.plan.change".to_owned(), text(change)),
            ("fgos.plan.from".to_owned(), text(from)),
            ("fgos.plan.to".to_owned(), text(to)),
            ("fgos.git.commit".to_owned(), text(commit)),
        ]);
        out.push(record(
            format!("plan-status:{dir}:{change}:{commit}"),
            PLAN_STATUS_KIND,
            ts.to_owned(),
            dir,
            attrs,
        ));
    }
    out
}

fn tips(driver: &GitDriver, repo: &RepoHandle) -> Result<Vec<Oid>, String> {
    let mut tips = Vec::new();
    if let HeadFact::Attached { commit, .. } | HeadFact::Detached { commit } =
        driver.resolve_head(repo).map_err(|e| e.cause)?
    {
        tips.push(commit);
    }
    let prefixes = ["refs/heads/", "refs/remotes/"]
        .iter()
        .filter_map(|p| RefPrefix::parse(p).ok())
        .collect::<Vec<_>>();
    let mut cursor = None;
    loop {
        let page = driver
            .list_refs(repo, &prefixes, cursor, 4096)
            .map_err(|e| e.cause)?;
        for entry in page.entries {
            if let RefValue::Direct(oid) = entry.value {
                if !tips.contains(&oid) {
                    tips.push(oid);
                }
            }
        }
        match page.next_cursor {
            Some(next) if !page.complete => cursor = Some(next),
            _ => break,
        }
    }
    Ok(tips)
}

fn blob(driver: &GitDriver, repo: &RepoHandle, commit: &Oid, path: &str) -> Option<String> {
    let reads = driver
        .read_paths_at(repo, commit, &[path.as_bytes().to_vec()], PLAN_FILE_BYTES)
        .ok()?;
    match reads.into_iter().next()?.value {
        PathValue::Blob(bytes) => String::from_utf8(bytes).ok(),
        _ => None,
    }
}

fn commit_records(
    driver: &GitDriver,
    repo: &RepoHandle,
    since: Option<i64>,
) -> Result<Vec<Record>, String> {
    let tips = tips(driver, repo)?;
    if tips.is_empty() {
        return Ok(Vec::new());
    }
    let mut out = Vec::new();
    let mut walked = 0usize;
    let mut cursor = None;
    loop {
        let page = driver
            .walk_commits(
                repo,
                &tips,
                &[],
                cursor,
                WalkBounds {
                    max_commits: WALK_PAGE,
                    max_bytes: WALK_BYTES,
                },
            )
            .map_err(|e| e.cause)?;
        let oids: Vec<Oid> = page.commits.iter().map(|c| c.oid.clone()).collect();
        let times = commit_times(driver, repo, &oids)?;
        // The walk interleaves every branch, so a page mixes old and new commits: only a page whose newest commit
        // is already older than the window ends the walk.
        let newest_in_page = times.iter().flatten().max().copied();
        for (commit, time) in page.commits.iter().zip(&times) {
            walked += 1;
            let Some(ms) = *time else { continue };
            if since.is_some_and(|s| ms < s) {
                continue; // Outside the window: no need to diff it.
            }
            let [parent] = commit.parents.as_slice() else {
                continue; // A root has nothing to compare with; a merge is its parents' commits.
            };
            let changed = changed_plan_paths(driver, repo, parent, &commit.oid)?;
            if changed.is_empty() {
                continue;
            }
            let Some(ts) = utc(ms) else { continue };
            let sha = commit.oid.as_str();
            let mut dirs: BTreeMap<String, bool> = BTreeMap::new();
            for (dir, is_plan_file) in changed {
                *dirs.entry(dir).or_default() |= is_plan_file;
            }
            for (dir, plan_file_changed) in dirs {
                out.push(record(
                    format!("plan-activity:commit:{dir}:{sha}"),
                    PLAN_ACTIVITY_KIND,
                    ts.clone(),
                    &dir,
                    BTreeMap::from([
                        ("fgos.plan.activity.source".to_owned(), text("commit")),
                        ("fgos.git.commit".to_owned(), text(sha)),
                    ]),
                ));
                if plan_file_changed {
                    let path = format!("plans/{dir}/plan.md");
                    let before = blob(driver, repo, parent, &path).map(|t| plan_fields(&t));
                    let after = blob(driver, repo, &commit.oid, &path).map(|t| plan_fields(&t));
                    if let (Some(before), Some(after)) = (before, after) {
                        out.extend(status_transitions(&dir, sha, &ts, &before, &after));
                    }
                }
            }
        }
        let past_window =
            since.is_some_and(|s| newest_in_page.is_some_and(|n| n < s - WINDOW_SLACK_MS));
        match page.next_cursor {
            Some(next) if !page.complete && !past_window && walked < WALK_LIMIT => {
                cursor = Some(next)
            }
            _ => break,
        }
    }
    Ok(out)
}

/// The committer time of each commit in milliseconds, read from the commit objects in one batch. A commit the
/// repository cannot show, or one with no readable committer line, is `None`.
fn commit_times(
    driver: &GitDriver,
    repo: &RepoHandle,
    ids: &[Oid],
) -> Result<Vec<Option<i64>>, String> {
    let objects = driver
        .read_objects(repo, ids, COMMIT_OBJECT_BYTES)
        .map_err(|e| e.cause)?;
    Ok(objects
        .into_iter()
        .map(|object| match object {
            ReadObject::Present { bytes, .. } => committer_seconds(&bytes).map(|s| s * 1000),
            ReadObject::Missing => None,
        })
        .collect())
}

/// `committer Name <mail> 1700000000 +0700` in the header of a raw commit object.
fn committer_seconds(commit: &[u8]) -> Option<i64> {
    let header = commit.split(|b| *b == b'\n').take_while(|l| !l.is_empty());
    let line = header.into_iter().find(|l| l.starts_with(b"committer "))?;
    let line = std::str::from_utf8(line).ok()?;
    let mut tail = line.rsplit(' ');
    let _zone = tail.next()?;
    tail.next()?.parse().ok()
}

fn changed_plan_paths(
    driver: &GitDriver,
    repo: &RepoHandle,
    parent: &Oid,
    commit: &Oid,
) -> Result<Vec<(String, bool)>, String> {
    let scope = DiffScope {
        prefix: Some("plans/"),
        renames: false,
    };
    let mut changed = Vec::new();
    let mut cursor = None;
    loop {
        let page = driver
            .diff(
                repo,
                DiffSides::Objects(parent, commit),
                &scope,
                cursor,
                4096,
            )
            .map_err(|e| e.cause)?;
        changed.extend(page.entries.iter().filter_map(|e| plan_path(&e.path)));
        match page.next_cursor {
            Some(next) if !page.complete => cursor = Some(next),
            _ => break,
        }
    }
    Ok(changed)
}

/// The machine's offset from UTC at `unix_secs`, in seconds. The board log carries local wall-clock stamps and no
/// zone; where the platform gives no local offset the stamp is read as UTC.
#[cfg(unix)]
fn local_offset_secs(unix_secs: i64) -> i32 {
    // SAFETY: `localtime_r` writes only into the zeroed `tm` it is given and reads the `time_t` by value.
    unsafe {
        let secs = unix_secs as libc::time_t;
        let mut tm: libc::tm = std::mem::zeroed();
        if libc::localtime_r(&secs, &mut tm).is_null() {
            0
        } else {
            tm.tm_gmtoff as i32
        }
    }
}

#[cfg(not(unix))]
fn local_offset_secs(_unix_secs: i64) -> i32 {
    0
}

/// Board log lines that name a plan directory that exists under `plans/`. The log is newest first, so reading stops
/// at the first line older than the window.
fn board_log_records(root: &Path, since: Option<i64>) -> Vec<Record> {
    let Ok(file) = std::fs::File::open(root.join(BOARD_LOG)) else {
        return Vec::new();
    };
    let mut out = Vec::new();
    for line in std::io::BufReader::new(file).lines().map_while(Result::ok) {
        let Some(entry) = log_line(&line) else {
            continue;
        };
        let (year, month, day) = entry.date;
        let Some(days) = days_from_civil(year, month, day) else {
            continue;
        };
        let wall = days * 86_400 + i64::from(entry.hour_minute.0 * 3600 + entry.hour_minute.1 * 60);
        let ms = (wall - i64::from(local_offset_secs(wall))) * 1000;
        if since.is_some_and(|s| ms < s - WINDOW_SLACK_MS) {
            break;
        }
        let Some(ts) = utc(ms) else { continue };
        for dir in plan_dir_names(entry.text) {
            if !root.join("plans").join(dir).is_dir() {
                continue;
            }
            let stamp = format!(
                "{year:04}{month:02}{day:02}T{:02}{:02}",
                entry.hour_minute.0, entry.hour_minute.1
            );
            let digest = Sha256::digest(line.as_bytes());
            let line_id: String = digest.iter().take(4).map(|b| format!("{b:02x}")).collect();
            out.push(record(
                format!("plan-activity:board-log:{dir}:{stamp}:{line_id}"),
                PLAN_ACTIVITY_KIND,
                ts.clone(),
                dir,
                BTreeMap::from([
                    ("fgos.plan.activity.source".to_owned(), text("board-log")),
                    ("fgos.board.lane".to_owned(), text(entry.lane)),
                ]),
            ));
        }
    }
    out
}
