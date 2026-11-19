//! One door onto a run directory's lifecycle truth.
//!
//! Two files, two jobs, and the line between them is the point:
//!
//! - `visibility.json`: where the worker currently IS (pane, agent session, when it was last seen). Volatile,
//!   rewritten often, and never evidence of anything.
//! - `run.json` `status`: whether the run is still going. Rewritten twice at most: when it starts, when it ends.
//!
//! Neither says what the work produced; that is `result.json`, written by the collector, and nothing here
//! touches it. Reconciliation answers one of three things for a run whose dispatch process is gone: `settled`
//! (the worker's own result is on disk), `died` (the worker is provably gone and left nothing) or `unknown`
//! (nobody can tell: not a success, and not an automatic retry).

use std::fs;
use std::path::{Path, PathBuf};

use fgos_holder_lock::port::{probe, Probe, Resource};
use serde_json::{json, Value};

use super::pretty_line;

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{message}")]
pub struct VisibilityError {
    pub code: &'static str,
    pub message: String,
}

fn fail(code: &'static str, message: String) -> VisibilityError {
    VisibilityError { code, message }
}

/// Where a worker is in its life: roughly as they occur, but not a state machine anyone enforces.
pub const VISIBILITY_STATES: [&str; 10] = [
    "requested",
    "pane-created",
    "agent-ready",
    "briefed",
    "working",
    "detached",
    "settling",
    "reconciled",
    "died",
    "blocked",
];

/// What `run.json` `status` may say. `died` and `unknown` are reachable only through reconciliation.
pub const RUN_STATUSES: [&str; 4] = ["running", "settled", "died", "unknown"];

const VISIBILITY_FILE: &str = "visibility.json";
const RUN_FILE: &str = "run.json";

fn read_json(file: &Path) -> Result<Option<Value>, VisibilityError> {
    if !file.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(file).map_err(|e| {
        fail(
            "unreadable",
            format!("could not read {}: {e}", file.display()),
        )
    })?;
    // Never fall back to an empty object: that would let a corrupt file be quietly overwritten with a fresh
    // one, losing whatever binding it still held.
    serde_json::from_str(&raw).map(Some).map_err(|e| {
        fail(
            "corrupt",
            format!("{} is not valid JSON: {e}", file.display()),
        )
    })
}

/// Replace the file durably. A reader polling this file must never catch it half-written.
fn write_json_atomic(file: &Path, value: &Value) -> Result<(), VisibilityError> {
    let write = || -> Result<(), String> {
        let dir = file.parent().ok_or("no parent directory")?;
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
        let name = file
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or("no file name")?;
        fgos_durable_file::replace_durably_with_mode(
            dir,
            name,
            pretty_line(value).as_bytes(),
            0o644,
        )
        .map(|_| ())
        .map_err(|e| e.to_string())
    };
    write().map_err(|e| {
        fail(
            "write-failed",
            format!("could not write {}: {e}", file.display()),
        )
    })
}

fn absolute(path: &Path) -> PathBuf {
    std::path::absolute(path).unwrap_or_else(|_| path.to_path_buf())
}

pub fn visibility_path(run_dir: &Path) -> PathBuf {
    absolute(run_dir).join(VISIBILITY_FILE)
}

pub fn read_visibility(run_dir: &Path) -> Result<Option<Value>, VisibilityError> {
    read_json(&visibility_path(run_dir))
}

/// `YYYY-MM-DDTHH:MM:SS.mmmZ`, the clock every stamp of this module reads.
pub fn iso_now() -> String {
    fgos_host_runtime::civil_time::format_system_time_utc(std::time::SystemTime::now())
}

/// Merge `patch` into the run's visibility record and stamp `lastSeenAt` with `now()`.
///
/// Merge rather than replace: bindings are learned at different moments (the pane id right after the split,
/// the agent session right after the agent starts), and a later write must never erase an earlier one just
/// because it did not repeat it.
pub fn write_visibility(
    run_dir: &Path,
    patch: &Value,
    now: &dyn Fn() -> String,
) -> Result<Value, VisibilityError> {
    if let Some(status) = patch.get("status").filter(|s| !s.is_null()) {
        if !status
            .as_str()
            .is_some_and(|s| VISIBILITY_STATES.contains(&s))
        {
            return Err(fail(
                "unknown-state",
                format!(
                    "visibility status must be one of {}, got: {status}",
                    VISIBILITY_STATES.join("/")
                ),
            ));
        }
    }
    let file = visibility_path(run_dir);
    let mut record = read_json(&file)?
        .and_then(|v| v.as_object().cloned())
        .unwrap_or_default();
    for (key, value) in patch.as_object().into_iter().flatten() {
        record.insert(key.clone(), value.clone());
    }
    record.insert("lastSeenAt".into(), json!(now()));
    let record = Value::Object(record);
    write_json_atomic(&file, &record)?;
    Ok(record)
}

/// Losing the gateway, or the person watching, is not the worker dying: this moves the visibility record only.
pub fn mark_detached(run_dir: &Path, now: &dyn Fn() -> String) -> Result<Value, VisibilityError> {
    write_visibility(run_dir, &json!({ "status": "detached" }), now)
}

/// The numbered claim of a worker, `result-<n>.json` with the highest `n` (a plain decimal, no sign and no
/// leading zero), in the first of the three places a worker writes it that holds one; a directory that holds
/// only the legacy `agent-result.json` yields that name. The legacy flat path when no directory holds anything.
fn worker_claim_path(run_dir: &Path) -> PathBuf {
    const LEGACY: &str = "agent-result.json";
    for dir in [
        run_dir.join("worker-output").join("outbox"),
        run_dir.join("worker-output"),
        run_dir.join("outbox"),
    ] {
        let Ok(entries) = fs::read_dir(&dir) else {
            continue;
        };
        let entries: Vec<_> = entries.flatten().collect();
        let latest = entries
            .iter()
            // A link planted among the results is never the newest result.
            .filter(|entry| entry.file_type().is_ok_and(|t| t.is_file()))
            .filter_map(|entry| {
                let name = entry.file_name().into_string().ok()?;
                let digits = name.strip_prefix("result-")?.strip_suffix(".json")?;
                let plain = digits == "0" || (!digits.starts_with('0') && !digits.is_empty());
                let round = digits.parse::<f64>().unwrap_or(f64::MAX);
                (plain && digits.bytes().all(|b| b.is_ascii_digit())).then_some((round, name))
            })
            .max_by(|a, b| a.0.total_cmp(&b.0));
        if let Some((_, name)) = latest {
            return dir.join(name);
        }
        if entries.iter().any(|entry| entry.file_name() == LEGACY) {
            return dir.join(LEGACY);
        }
    }
    run_dir.join(LEGACY)
}

/// Did the worker leave a result behind? The worker's own claim first, under either name it may have been
/// written with; the collector's `result.json` is the last resort and means something weaker but still real:
/// that the collector ran to completion, which it only does once the round has ended.
pub fn find_worker_result(run_dir: &Path) -> Option<PathBuf> {
    let dir = absolute(run_dir);
    let claim = worker_claim_path(&dir);
    // Present means something is there, a link or a pipe included: the reader refuses what it cannot trust.
    if fs::symlink_metadata(&claim).is_ok() {
        return Some(claim);
    }
    let collected = dir.join("result.json");
    collected.exists().then_some(collected)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RunOutcome {
    Settled,
    Died,
    Unknown,
}

impl RunOutcome {
    pub fn as_str(self) -> &'static str {
        match self {
            RunOutcome::Settled => "settled",
            RunOutcome::Died => "died",
            RunOutcome::Unknown => "unknown",
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Classified {
    pub outcome: RunOutcome,
    pub result_path: Option<PathBuf>,
    pub run_meta: Value,
    /// Whether the record's `status` differs from `outcome`.
    pub changed: bool,
}

/// What became of this run, deciding nothing and writing nothing. A reader that cannot probe liveness passes
/// `unknown` and gets `unknown` back: saying so is the honest answer, and it is specifically NOT `died`, which
/// would be an assertion about a process nobody looked at. `liveness` is `absent` only when the worker is gone.
pub fn classify_run_outcome(run_dir: &Path, liveness: &str) -> Result<Classified, VisibilityError> {
    let dir = absolute(run_dir);
    let run_meta = read_json(&dir.join(RUN_FILE))?
        .filter(|meta| !meta.is_null())
        .ok_or_else(|| fail("missing-run", format!("no {RUN_FILE} in {}", dir.display())))?;
    let result_path = find_worker_result(&dir);
    let outcome = if result_path.is_some() {
        RunOutcome::Settled
    } else if liveness == "absent" {
        RunOutcome::Died
    } else {
        RunOutcome::Unknown
    };
    let changed = run_meta.get("status").and_then(Value::as_str) != Some(outcome.as_str());
    Ok(Classified {
        outcome,
        result_path,
        run_meta,
        changed,
    })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LockState {
    Held,
    Free,
    Unknown,
}

/// Whether the supervisor of an attempt holds its attempt lock: `Held` while the attempt lives, `Free` when
/// nobody does (also an attempt from before the supervisor, which has no lock file), `Unknown` when the lock
/// cannot be read. Reads only; a lock file that was never made is not made here.
pub fn attempt_lock_state(attempt_dir: &Path) -> LockState {
    let dir = absolute(attempt_dir);
    let lock = dir.join("attempt.lock");
    if !lock.exists() {
        return LockState::Free;
    }
    if dir
        .parent()
        .and_then(Path::file_name)
        .is_none_or(|name| name != "runs")
    {
        return LockState::Unknown;
    }
    match probe(&Resource::new("attempt", lock)) {
        Ok(Probe::Held) => LockState::Held,
        Ok(Probe::Free) => LockState::Free,
        Err(_) => LockState::Unknown,
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct RunningRun {
    pub run_dir: PathBuf,
    pub run_id: Option<String>,
    pub started_at: Option<String>,
    pub assignment_id: Option<String>,
}

fn sub_dirs(dir: &Path) -> Vec<(String, PathBuf)> {
    let mut found: Vec<(String, PathBuf)> = fs::read_dir(dir)
        .into_iter()
        .flatten()
        .flatten()
        .filter(|e| e.file_type().is_ok_and(|t| t.is_dir()))
        .filter_map(|e| Some((e.file_name().into_string().ok()?, e.path())))
        .collect();
    // Byte order of the names, the order every reader of the layout agrees on.
    found.sort_by(|a, b| a.0.as_bytes().cmp(b.0.as_bytes()));
    found
}

const LAYOUT_MAX_DEPTH: usize = 16;

/// The attempt directories under `assignments/` (a `runs/<attempt>` below any assignment id), symlinks and
/// depth stopped at: worker-owned descendants are not repositories.
fn assignment_runs(fgos_dir: &Path) -> Vec<(String, PathBuf)> {
    fn walk(base: &Path, dir: &Path, depth: usize, out: &mut Vec<(String, PathBuf)>) {
        for (name, child) in sub_dirs(dir) {
            if name == "runs" {
                let id = dir
                    .strip_prefix(base)
                    .map(|p| p.to_string_lossy().replace('\\', "/"))
                    .unwrap_or_default();
                out.extend(
                    sub_dirs(&child)
                        .into_iter()
                        .map(|(_, run)| (id.clone(), run)),
                );
            } else if depth < LAYOUT_MAX_DEPTH {
                walk(base, &child, depth + 1, out);
            }
        }
    }
    let base = absolute(&fgos_dir.join("assignments"));
    let mut out = Vec::new();
    if fs::symlink_metadata(&base).is_ok_and(|m| m.is_dir()) {
        walk(&base, &base, 0, &mut out);
    }
    out
}

/// Runs whose record says running although nobody holds their attempt lock: the orphans a reconcile may settle.
pub fn find_running_runs(fgos_dir: &Path) -> Vec<RunningRun> {
    let mut candidates: Vec<(Option<String>, PathBuf)> = assignment_runs(fgos_dir)
        .into_iter()
        .map(|(id, dir)| (Some(id), dir))
        .collect();
    // The retired dispatch-runs writer used <workId>/<timestamp>, not runs/: kept readable, never as assignments.
    for (_, work) in sub_dirs(&fgos_dir.join("dispatch-runs")) {
        candidates.extend(sub_dirs(&work).into_iter().map(|(_, stamp)| (None, stamp)));
    }
    let mut found = Vec::new();
    for (assignment_id, dir) in candidates {
        let Ok(Some(meta)) = read_json(&dir.join(RUN_FILE)) else {
            continue;
        };
        if meta.get("status").and_then(Value::as_str) != Some("running")
            || attempt_lock_state(&dir) != LockState::Free
        {
            continue;
        }
        let text = |key: &str| meta.get(key).and_then(Value::as_str).map(String::from);
        found.push(RunningRun {
            run_dir: dir,
            run_id: text("runId"),
            started_at: text("startedAt"),
            assignment_id,
        });
    }
    found
}

#[derive(Debug, Clone, PartialEq)]
pub struct Reconciled {
    pub outcome: RunOutcome,
    pub changed: bool,
    pub result_path: Option<PathBuf>,
}

/// Decide what became of a run whose dispatch process is gone, and write that decision into `run.json`.
/// A run still marked `running` whose liveness cannot be read stays honest by becoming `unknown`, never by
/// staying `running` (which would claim it works) and never by becoming `died` (the opposite claim on the same
/// missing evidence).
pub fn reconcile_run(
    run_dir: &Path,
    liveness: &str,
    now: &dyn Fn() -> String,
) -> Result<Reconciled, VisibilityError> {
    let dir = absolute(run_dir);
    let Classified {
        outcome,
        result_path,
        run_meta,
        changed,
    } = classify_run_outcome(&dir, liveness)?;
    if changed {
        let mut next = run_meta.as_object().cloned().unwrap_or_default();
        next.insert("status".into(), json!(outcome.as_str()));
        next.insert("reconciledAt".into(), json!(now()));
        if let Some(path) = &result_path {
            let relative = path.strip_prefix(&dir).unwrap_or(path);
            next.insert("workerResultPath".into(), json!(relative.to_string_lossy()));
        }
        write_json_atomic(&dir.join(RUN_FILE), &Value::Object(next))?;
    }
    let status = if outcome == RunOutcome::Died {
        "died"
    } else {
        "reconciled"
    };
    // A visibility stamp is a courtesy: reconciling run.json is the point.
    let _ = write_visibility(&dir, &json!({ "status": status }), now);
    Ok(Reconciled {
        outcome,
        changed,
        result_path,
    })
}

/// Mark a run finished by the normal path: the dispatch returned and its RunResult was written. Says nothing
/// about whether the work succeeded. Whether the record changed.
pub fn mark_run_settled(
    run_dir: &Path,
    status: &str,
    now: &dyn Fn() -> String,
) -> Result<bool, VisibilityError> {
    if !RUN_STATUSES.contains(&status) {
        return Err(fail(
            "unknown-state",
            format!(
                "run status must be one of {}, got: \"{status}\"",
                RUN_STATUSES.join("/")
            ),
        ));
    }
    let run_file = absolute(run_dir).join(RUN_FILE);
    let Some(meta) = read_json(&run_file)?.filter(|meta| !meta.is_null()) else {
        return Ok(false);
    };
    if meta.get("status").and_then(Value::as_str) == Some(status) {
        return Ok(false);
    }
    let mut next = meta.as_object().cloned().unwrap_or_default();
    next.insert("status".into(), json!(status));
    next.insert("settledAt".into(), json!(now()));
    write_json_atomic(&run_file, &Value::Object(next))?;
    Ok(true)
}
