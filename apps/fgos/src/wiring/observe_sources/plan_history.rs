//! `fgos.plan.status` and `fgos.plan.activity`, projected from git history (through the Git component door) and from
//! the program board log. Nothing is stored: every query walks the history again.
//!
//! Commits are read from every branch tip (HEAD, local and remote branches). A merge commit is skipped: the commits
//! it brings in are walked on their own, so a transition is recorded once, at the commit that made it. A root commit
//! has nothing to compare with and records nothing.
//!
//! A record's subject is the plan, `plan:plans/<dir>`, the id a run attempt's plan ref carries.
//!
//! `fgos.plan.status` covers only plans under the plan contract (`contract: plan-v1` in the commit's front matter),
//! and only the contract's values (`status` draft|ready|running|done|withdrawn, `priority` P0..P3). A plan created
//! at a status, or brought under the contract by the commit, records a transition from none: attr `fgos.plan.from`
//! is absent. The id is `(plan dir, change, from, to, author time)`, so a rebased copy of the same transition on a
//! stale branch is one record; of the copies, the one committed first (then the smaller sha) is kept.
//!
//! The walk is bounded (`WALK_LIMIT` commits). Every commit record carries `fgos.plan.history`: `complete` when the
//! walk reached the window's start or the root, `truncated` when the bound stopped it first, so older transitions
//! missing from the answer are a stated gap, not a silent one.

use super::plan_text::{log_line, plan_dir_names, plan_fields, PlanFields};
use super::{PLAN_ACTIVITY_KIND, PLAN_STATUS_KIND};
use fgos_git::{
    DiffScope, DiffSides, GitDriver, HeadFact, Inspect, Oid, PathRead, PathValue, ReadObject,
    RefPrefix, RefValue, RepoHandle, ResolveRepo, WalkBounds,
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
/// `None` is this process's own state root, the production choice. `walk_limit` is the bound on commits walked.
#[derive(Debug, Clone)]
pub struct PlanHistorySource {
    state_root: Option<PathBuf>,
    walk_limit: usize,
}

impl Default for PlanHistorySource {
    fn default() -> Self {
        Self {
            state_root: None,
            walk_limit: WALK_LIMIT,
        }
    }
}

impl PlanHistorySource {
    pub fn new() -> Self {
        Self::default()
    }

    #[cfg(test)]
    pub fn with_state_root(state_root: PathBuf) -> Self {
        Self {
            state_root: Some(state_root),
            ..Self::default()
        }
    }

    #[cfg(test)]
    pub fn with_walk_limit(mut self, walk_limit: usize) -> Self {
        self.walk_limit = walk_limit;
        self
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
            records
                .extend(commit_records(&driver, &repo, bounds.0, self.walk_limit).map_err(failed)?);
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

/// A plan's id is its repository directory, `plans/<dir>`: the form a run attempt's plan ref carries, so one plan is
/// one id on every kind.
fn plan_id(dir: &str) -> String {
    format!("plans/{dir}")
}

fn plan_subject(dir: &str) -> SubjectRef {
    SubjectRef {
        kind: "plan".to_owned(),
        id: plan_id(dir),
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

const PLAN_CONTRACT: &str = "plan-v1";
const STATUS_VALUES: [&str; 5] = ["draft", "ready", "running", "done", "withdrawn"];
const PRIORITY_VALUES: [&str; 4] = ["P0", "P1", "P2", "P3"];

/// The two instants a commit carries, in milliseconds.
#[derive(Debug, Clone, Copy)]
pub struct CommitTimes {
    pub author: i64,
    pub committer: i64,
}

/// One record per changed contract field: `from` is what the parent held under the contract (absent when the parent
/// held no contract plan), `to` what the commit holds. A commit whose plan is not under the contract records none.
pub fn status_transitions(
    dir: &str,
    commit: &str,
    ts: &str,
    author_ms: i64,
    before: Option<&PlanFields>,
    after: &PlanFields,
) -> Vec<Record> {
    let under_contract = |f: &&PlanFields| f.contract.as_deref() == Some(PLAN_CONTRACT);
    if !under_contract(&after) {
        return Vec::new();
    }
    let before = before.filter(under_contract);
    let mut out = Vec::new();
    for (change, allowed, from, to) in [
        (
            "status",
            &STATUS_VALUES[..],
            before.and_then(|b| b.status.as_deref()),
            after.status.as_deref(),
        ),
        (
            "priority",
            &PRIORITY_VALUES[..],
            before.and_then(|b| b.priority.as_deref()),
            after.priority.as_deref(),
        ),
    ] {
        let Some(to) = to.filter(|t| allowed.contains(t)) else {
            continue; // No contract value now: nothing is guessed.
        };
        let from = from.filter(|f| allowed.contains(f));
        if from == Some(to) {
            continue;
        }
        let mut attrs = BTreeMap::from([
            ("fgos.plan.change".to_owned(), text(change)),
            ("fgos.plan.to".to_owned(), text(to)),
            ("fgos.git.commit".to_owned(), text(commit)),
        ]);
        if let Some(from) = from {
            attrs.insert("fgos.plan.from".to_owned(), text(from));
        }
        out.push(record(
            format!(
                "plan-status:plans/{dir}:{change}:{}:{to}:{author_ms}",
                from.unwrap_or("")
            ),
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

fn blob_text(read: Option<&PathRead>) -> Option<String> {
    match &read?.value {
        PathValue::Blob(bytes) => String::from_utf8(bytes.clone()).ok(),
        _ => None,
    }
}

/// A commit of the current page whose `plan.md` of `dir` changed: its two sides are read in one batch per page.
struct PlanFileChange {
    dir: String,
    parent: Oid,
    commit: Oid,
    ts: String,
    times: CommitTimes,
}

fn commit_records(
    driver: &GitDriver,
    repo: &RepoHandle,
    since: Option<i64>,
    walk_limit: usize,
) -> Result<Vec<Record>, String> {
    let tips = tips(driver, repo)?;
    if tips.is_empty() {
        return Ok(Vec::new());
    }
    let mut out = Vec::new();
    // Transition id → (committer time, sha, record): a rebased copy keeps the copy committed first.
    let mut transitions: BTreeMap<String, (i64, String, Record)> = BTreeMap::new();
    let mut walked = 0usize;
    let mut truncated = false;
    let mut cursor = None;
    loop {
        let page = driver
            .walk_commits(
                repo,
                &tips,
                &[],
                cursor,
                WalkBounds {
                    max_commits: WALK_PAGE.min(walk_limit).max(1),
                    max_bytes: WALK_BYTES,
                },
            )
            .map_err(|e| e.cause)?;
        let oids: Vec<Oid> = page.commits.iter().map(|c| c.oid.clone()).collect();
        let times = commit_times(driver, repo, &oids)?;
        // The walk interleaves every branch, so a page mixes old and new commits: only a page whose newest commit
        // is already older than the window ends the walk.
        let newest_in_page = times.iter().flatten().map(|t| t.committer).max();
        let mut plan_files = Vec::new();
        for (commit, time) in page.commits.iter().zip(&times) {
            walked += 1;
            let Some(time) = *time else { continue };
            if since.is_some_and(|s| time.committer < s) {
                continue; // Outside the window: no need to diff it.
            }
            let [parent] = commit.parents.as_slice() else {
                continue; // A root has nothing to compare with; a merge is its parents' commits.
            };
            let changed = changed_plan_paths(driver, repo, parent, &commit.oid)?;
            if changed.is_empty() {
                continue;
            }
            let Some(ts) = utc(time.committer) else {
                continue;
            };
            let sha = commit.oid.as_str();
            let mut dirs: BTreeMap<String, bool> = BTreeMap::new();
            for (dir, is_plan_file) in changed {
                *dirs.entry(dir).or_default() |= is_plan_file;
            }
            for (dir, plan_file_changed) in dirs {
                out.push(record(
                    format!("plan-activity:commit:plans/{dir}:{sha}"),
                    PLAN_ACTIVITY_KIND,
                    ts.clone(),
                    &dir,
                    BTreeMap::from([
                        ("fgos.plan.activity.source".to_owned(), text("commit")),
                        ("fgos.git.commit".to_owned(), text(sha)),
                    ]),
                ));
                if plan_file_changed {
                    plan_files.push(PlanFileChange {
                        dir,
                        parent: parent.clone(),
                        commit: commit.oid.clone(),
                        ts: ts.clone(),
                        times: time,
                    });
                }
            }
        }
        if !plan_files.is_empty() {
            let reads: Vec<(Oid, Vec<Vec<u8>>)> = plan_files
                .iter()
                .flat_map(|c| {
                    let path = format!("plans/{}/plan.md", c.dir).into_bytes();
                    [
                        (c.parent.clone(), vec![path.clone()]),
                        (c.commit.clone(), vec![path]),
                    ]
                })
                .collect();
            let answers = driver
                .read_paths_at_many(repo, &reads, PLAN_FILE_BYTES)
                .map_err(|e| e.cause)?;
            for (change, sides) in plan_files.iter().zip(answers.chunks(2)) {
                let [before, after] = sides else { continue };
                let before = blob_text(before.first()).map(|t| plan_fields(&t));
                let Some(after) = blob_text(after.first()).map(|t| plan_fields(&t)) else {
                    continue; // The plan file was deleted: no value to record.
                };
                let sha = change.commit.as_str();
                for found in status_transitions(
                    &change.dir,
                    sha,
                    &change.ts,
                    change.times.author,
                    before.as_ref(),
                    &after,
                ) {
                    let key = (change.times.committer, sha.to_owned());
                    match transitions.get(&found.id) {
                        Some((ms, kept, _)) if (*ms, kept.as_str()) <= (key.0, key.1.as_str()) => {}
                        _ => {
                            transitions.insert(found.id.clone(), (key.0, key.1, found));
                        }
                    }
                }
            }
        }
        let past_window =
            since.is_some_and(|s| newest_in_page.is_some_and(|n| n < s - WINDOW_SLACK_MS));
        match page.next_cursor {
            Some(next) if !page.complete && !past_window => {
                if walked >= walk_limit {
                    truncated = true;
                    break;
                }
                cursor = Some(next);
            }
            _ => break,
        }
    }
    out.extend(transitions.into_values().map(|(_, _, r)| r));
    let history = text(if truncated { "truncated" } else { "complete" });
    for r in &mut out {
        r.attrs
            .insert("fgos.plan.history".to_owned(), history.clone());
    }
    Ok(out)
}

/// The author and committer times of each commit, read from the commit objects in one batch. A commit the
/// repository cannot show, or one without both readable lines, is `None`.
fn commit_times(
    driver: &GitDriver,
    repo: &RepoHandle,
    ids: &[Oid],
) -> Result<Vec<Option<CommitTimes>>, String> {
    let objects = driver
        .read_objects(repo, ids, COMMIT_OBJECT_BYTES)
        .map_err(|e| e.cause)?;
    Ok(objects
        .into_iter()
        .map(|object| match object {
            ReadObject::Present { bytes, .. } => Some(CommitTimes {
                author: header_seconds(&bytes, b"author ")? * 1000,
                committer: header_seconds(&bytes, b"committer ")? * 1000,
            }),
            ReadObject::Missing => None,
        })
        .collect())
}

/// `<field> Name <mail> 1700000000 +0700` in the header of a raw commit object.
fn header_seconds(commit: &[u8], field: &[u8]) -> Option<i64> {
    let mut header = commit.split(|b| *b == b'\n').take_while(|l| !l.is_empty());
    let line = header.find(|l| l.starts_with(field))?;
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
                format!("plan-activity:board-log:plans/{dir}:{stamp}:{line_id}"),
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
