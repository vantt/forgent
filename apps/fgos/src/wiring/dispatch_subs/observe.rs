//! `dispatch show-run` and `dispatch watch`: one Run read off disk, and followed while somebody else drives it.
//! Read-only by construction: the one thing asked beyond the files is the run supervisor's adopt probe, which
//! writes nothing and takes no lock. Also the attempt view (`attemptState`, `unitState`) the inspection and the
//! attention view add to what they read.

use super::{fgos_dir, run_id_of, validation, Answer, Answered, Flags, SubRequest};
use fgos_execution::unit_record::{
    attempt_dir_name, derive_unit_state, record_owns_assignment, unit_control_dir,
    unit_run_id_of_assignment, AttemptState,
};
use fgos_execution_engine::assignment::layout::{
    assignment_dir, find_run_dir, list_assignment_runs, RunLookupError,
};
use fgos_execution_engine::run_result::reader::interpret_run_result_file;
use fgos_execution_engine::transport::visibility_session::read_visibility;
use fgos_host_runtime::CategorisedRefusal;
use fgos_run_supervisor::adopt::{adopt_one, AdoptArgs, Target};
use fgos_run_supervisor::controller::lease::{inspect_run_control, list_generations};
use serde_json::{json, Map, Value};
use std::path::{Path, PathBuf};
use std::time::{Duration, UNIX_EPOCH};

/// How often `watch` looks, when the caller does not say.
const DEFAULT_WATCH_INTERVAL_MS: f64 = 1000.0;

/// A run in any of these has stopped; there is nothing further to watch.
const TERMINAL_RUN_STATUSES: [&str; 3] = ["settled", "died", "unknown"];

pub(crate) fn read_json(file: &Path) -> Option<Value> {
    let text = std::fs::read_to_string(file).ok()?;
    serde_json::from_str(&text).ok()
}

/// Why a Run read refused: the Node observe error's code, message and category.
pub(crate) struct ObserveError {
    pub code: &'static str,
    pub message: String,
}

impl ObserveError {
    /// The refusal the caller prints: a lookup that found no run or too many is a precondition, every other code a
    /// validation error.
    pub(crate) fn refusal(&self) -> CategorisedRefusal {
        let category = if matches!(self.code, "run-not-found" | "missing-run" | "run-ambiguous") {
            "precondition"
        } else {
            "validation"
        };
        CategorisedRefusal::new(category, self.message.clone())
    }
}

/// The attempt directory of `run_id` under `root`, or why there is none.
pub(crate) fn resolve_run_dir(root: &Path, run_id: &str) -> Result<PathBuf, ObserveError> {
    match find_run_dir(&fgos_dir(root), run_id) {
        Err(error) => Err(ObserveError {
            code: RunLookupError::CODE,
            message: error.to_string(),
        }),
        Ok(None) => Err(ObserveError {
            code: "run-not-found",
            message: format!("no run \"{run_id}\" under {}", root.display()),
        }),
        Ok(Some(dir)) => Ok(dir),
    }
}

/// The files of one directory of the run: names, sizes and modification times, never contents.
fn list_files(dir: &Path) -> Vec<Value> {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut files: Vec<(String, Value)> = entries
        .flatten()
        .filter(|entry| entry.file_type().is_ok_and(|kind| kind.is_file()))
        .map(|entry| {
            let name = entry.file_name().to_string_lossy().into_owned();
            let stat = std::fs::metadata(entry.path()).ok();
            let modified = stat
                .as_ref()
                .and_then(|stat| stat.modified().ok())
                .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
                .map(|since| {
                    Value::String(fgos_identity::text::iso_utc(
                        since.as_secs(),
                        since.subsec_millis(),
                    ))
                });
            let line = json!({
                "name": name,
                "bytes": stat.as_ref().map_or(Value::Null, |stat| json!(stat.len())),
                "modifiedAt": modified.unwrap_or(Value::Null),
            });
            (name, line)
        })
        .collect();
    files.sort_by(|a, b| a.0.cmp(&b.0));
    files.into_iter().map(|(_, line)| line).collect()
}

/// One reading of a run: its record, whether it settled (with the interpreted result), where its worker is, and
/// what it and its controller wrote. A corrupt visibility file degrades to a stated error.
pub(crate) fn read_run_snapshot(run_dir: &Path) -> Result<Map<String, Value>, ObserveError> {
    let dir = std::path::absolute(run_dir).unwrap_or_else(|_| run_dir.to_path_buf());
    let Some(run) = read_json(&dir.join("run.json")).filter(|run| !run.is_null()) else {
        return Err(ObserveError {
            code: "missing-run",
            message: format!("no run.json in {}", dir.display()),
        });
    };
    let result_file = dir.join("result.json");
    let mut settled = false;
    let mut result_corrupt = false;
    let mut result = None;
    if result_file.exists() {
        match std::fs::symlink_metadata(&result_file) {
            Ok(stat) if stat.is_file() => {
                let expected = run.get("runId").and_then(Value::as_str);
                match interpret_run_result_file(&result_file, expected) {
                    Ok(read) => {
                        let contract_corrupt = read
                            .record
                            .get("classification")
                            .and_then(|c| c.get("provenance"))
                            .and_then(Value::as_str)
                            == Some("contract-corrupt");
                        let flagged = ["contractCorrupt", "resultCorrupt"].iter().any(|key| {
                            read.record.get(*key).and_then(Value::as_bool) == Some(true)
                        });
                        if read.corrupt || contract_corrupt || flagged {
                            result_corrupt = true;
                        } else {
                            settled = true;
                            result = Some(read.record);
                        }
                    }
                    Err(_) => result_corrupt = true,
                }
            }
            _ => result_corrupt = true,
        }
    }
    let (visibility, visibility_error) = match read_visibility(&dir) {
        Ok(visibility) => (visibility.unwrap_or(Value::Null), None),
        Err(error) => (Value::Null, Some(error.message)),
    };
    let mut snapshot = Map::new();
    snapshot.insert("runDir".into(), json!(dir));
    snapshot.insert("run".into(), run);
    snapshot.insert("settled".into(), json!(settled));
    if result_corrupt {
        snapshot.insert("resultCorrupt".into(), json!(true));
    }
    if let Some(result) = result {
        snapshot.insert("result".into(), result);
    }
    snapshot.insert("visibility".into(), visibility);
    if let Some(error) = visibility_error {
        snapshot.insert("visibilityError".into(), json!(error));
    }
    snapshot.insert(
        "outbox".into(),
        Value::Array(list_files(&dir.join("outbox"))),
    );
    snapshot.insert(
        "controller".into(),
        Value::Array(list_files(&dir.join("controller"))),
    );
    Ok(snapshot)
}

/// The run supervisor's read-only adopt judgement of one attempt directory (its answer line).
pub(crate) fn probe_attempt(attempt_dir: &Path) -> Value {
    let args = AdoptArgs {
        target: Target::RunDir(attempt_dir.to_path_buf()),
        probe_only: true,
        kill_wait_ms: fgos_holder_lock::DEFAULT_KILL_WAIT_MS,
    };
    adopt_one(attempt_dir, &args).line(attempt_dir)
}

fn state_of(line: &Value) -> String {
    line.get("state")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_owned()
}

/// The run id of the attempt a later `--resume` launched in place of this one (its run record names this run in
/// `supersedesRunId`).
fn superseded_by(fgos: &Path, run_id: &str) -> Option<Value> {
    list_assignment_runs(fgos).into_iter().find_map(|entry| {
        let other = read_json(&entry.run_dir.join("run.json"))?;
        (other.get("supersedesRunId").and_then(Value::as_str) == Some(run_id))
            .then(|| other.get("runId").cloned().unwrap_or(Value::Null))
    })
}

/// The unit directory that owns an assignment: the unit run its id starts with, when its `unit.json` names the
/// assignment among its last attempts.
fn unit_dir_of_assignment(fgos: &Path, assignment_id: &str) -> Option<PathBuf> {
    let unit_dir = assignment_dir(fgos, unit_run_id_of_assignment(assignment_id))?;
    let record = read_json(&unit_dir.join("unit.json"))?;
    record_owns_assignment(&record, assignment_id).then_some(unit_dir)
}

/// What a unit run is doing, with the adopt probe asked of each attempt the admission ledger committed.
fn unit_state(unit_dir: &Path, probe: &dyn Fn(&Path) -> Value) -> Value {
    let unit_run_id = unit_dir
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_default();
    let summary = read_json(&unit_dir.join("unit-summary.json"));
    let record = read_json(&unit_dir.join("unit.json"));
    let assignments = unit_dir.parent().unwrap_or(unit_dir).to_path_buf();
    derive_unit_state(
        &unit_run_id,
        summary.as_ref(),
        || inspect_run_control(&unit_control_dir(unit_dir)).is_ok_and(|state| state.held),
        record.as_ref(),
        |assignment_id| {
            let assignment = assignments.join(assignment_id);
            let generations = list_generations(&assignment.join("admission").join("generations"))
                .unwrap_or_default();
            let Some(name) = generations.last().and_then(|g| attempt_dir_name(&g.record)) else {
                return AttemptState::NotAdmitted;
            };
            let dir = assignment.join("runs").join(name);
            if !dir.exists() {
                return AttemptState::NotAdmitted;
            }
            let legacy = read_json(&dir.join("run.json"))
                .and_then(|run| run.get("settlement").cloned())
                .and_then(|s| s.as_str().map(str::to_owned));
            if legacy.as_deref() == Some("abandoned-legacy") {
                return AttemptState::AbandonedLegacy;
            }
            if state_of(&probe(&dir)) == "closed" {
                AttemptState::Closed
            } else {
                AttemptState::Open
            }
        },
    )
}

/// What the run supervisor and the unit say about one attempt directory: `attemptState` (the probe's word, the
/// receipt outcome of a closed attempt that never ran its agent, `abandoned-legacy` for a run the legacy sweep
/// settled, or `superseded` once a resume replaced it) and, when a unit run owns the attempt, `unitState` with
/// the command that resumes it.
pub(crate) fn read_attempt_view(
    run_dir: &Path,
    fgos: &Path,
    probe: &dyn Fn(&Path) -> Value,
) -> Map<String, Value> {
    let run = read_json(&run_dir.join("run.json"));
    let field = |key: &str| {
        run.as_ref()
            .and_then(|run| run.get(key))
            .and_then(Value::as_str)
            .map(str::to_owned)
    };
    let mut attempt_reason = None;
    let mut attempt_state;
    if field("settlement").as_deref() == Some("abandoned-legacy") {
        attempt_state = "abandoned-legacy".to_owned();
    } else {
        let verdict = probe(run_dir);
        attempt_state = state_of(&verdict);
        attempt_reason = verdict
            .get("reason")
            .and_then(Value::as_str)
            .filter(|reason| !reason.is_empty())
            .map(str::to_owned);
        if attempt_state == "closed" {
            let outcome = read_json(&run_dir.join("receipt.json"))
                .and_then(|receipt| receipt.get("outcome").cloned())
                .map(|outcome| match outcome {
                    Value::String(text) => text,
                    Value::Null => String::new(),
                    other => other.to_string(),
                })
                .unwrap_or_default();
            if outcome.starts_with("abandoned") {
                attempt_state = outcome;
            }
        }
    }
    let replacement = (attempt_state == "closed" || attempt_state.starts_with("abandoned"))
        .then(|| field("runId").and_then(|id| superseded_by(fgos, &id)))
        .flatten();
    let mut view = Map::new();
    match replacement {
        Some(replacement) => {
            view.insert("attemptState".into(), json!("superseded"));
            view.insert("supersededBy".into(), replacement);
            view.insert("attemptOutcome".into(), json!(attempt_state));
        }
        None => {
            view.insert("attemptState".into(), json!(attempt_state));
            if let Some(reason) = attempt_reason {
                view.insert("attemptReason".into(), json!(reason));
            }
        }
    }
    let Some(unit_dir) = field("assignmentId").and_then(|id| unit_dir_of_assignment(fgos, &id))
    else {
        return view;
    };
    let unit = unit_state(&unit_dir, probe);
    for key in ["unitRunId", "unitState", "resumeCommand"] {
        if let Some(value) = unit.get(key) {
            view.insert(key.into(), value.clone());
        }
    }
    view
}

/// `show-run <runId>`: the run's snapshot and its attempt view, read with the live adopt probe.
pub(crate) fn show_run_at(root: &Path, run_id: &str, probe: &dyn Fn(&Path) -> Value) -> Answered {
    if run_id.trim().is_empty() {
        return Err(validation("dispatch show-run requires a runId"));
    }
    let run_dir = resolve_run_dir(root, run_id).map_err(|e| e.refusal())?;
    let snapshot = read_run_snapshot(&run_dir).map_err(|e| e.refusal())?;
    let mut out = Map::new();
    out.insert("runId".into(), json!(run_id));
    out.extend(snapshot);
    out.extend(read_attempt_view(&run_dir, &fgos_dir(root), probe));
    Ok(Answer::Json(Value::Object(out)))
}

pub(crate) fn show_run(request: &SubRequest, flags: &Flags) -> Answered {
    let run_id = run_id_of(flags, "show-run")?;
    show_run_at(&request.root, &run_id, &probe_attempt)
}

/// The last few lines the worker's own log reached; a log that does not exist yet is not a problem.
fn tail_log(run_dir: &Path, lines: usize) -> Vec<Value> {
    let Ok(text) = std::fs::read_to_string(run_dir.join("stdout.log")) else {
        return Vec::new();
    };
    let all: Vec<&str> = text
        .split('\n')
        .map(|line| line.strip_suffix('\r').unwrap_or(line))
        .filter(|line| !line.is_empty())
        .collect();
    all[all.len().saturating_sub(lines)..]
        .iter()
        .map(|line| json!(line))
        .collect()
}

/// `Number(text)` as the Node CLI reads a numeric flag: NaN when it does not parse.
fn number(text: &str) -> f64 {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return 0.0;
    }
    trimmed.parse::<f64>().unwrap_or(f64::NAN)
}

/// How a watch ended and its last reading.
pub(crate) struct Watched {
    pub ticks: u64,
    pub stopped_because: &'static str,
    pub snapshot: Map<String, Value>,
}

/// Reads the run until it stops or `max_ticks` readings were taken, calling `on_tick` with each reading and
/// `sleep` between readings.
pub(crate) fn watch_run(
    run_dir: &Path,
    max_ticks: f64,
    on_tick: &mut dyn FnMut(&Map<String, Value>),
    sleep: &mut dyn FnMut(),
) -> Result<Watched, ObserveError> {
    let mut ticks = 0u64;
    loop {
        let mut snapshot = read_run_snapshot(run_dir)?;
        snapshot.insert("tail".into(), Value::Array(tail_log(run_dir, 5)));
        ticks += 1;
        on_tick(&snapshot);
        let status = snapshot
            .get("run")
            .and_then(|run| run.get("status"))
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_owned();
        let stopped = if snapshot.get("settled") == Some(&json!(true)) {
            Some("terminal")
        } else if snapshot.contains_key("resultCorrupt") {
            Some("corrupt-evidence")
        } else if TERMINAL_RUN_STATUSES.contains(&status.as_str()) {
            Some("terminal")
        } else if ticks as f64 >= max_ticks {
            Some("tick-budget")
        } else {
            None
        };
        if let Some(stopped_because) = stopped {
            return Ok(Watched {
                ticks,
                stopped_because,
                snapshot,
            });
        }
        sleep();
    }
}

/// The one line each reading writes to stderr.
fn tick_line(run_id: &str, tick: &Map<String, Value>) -> String {
    let visibility = tick.get("visibility").filter(|v| !v.is_null());
    let pane = visibility
        .and_then(|v| v.get("paneId"))
        .filter(|pane| !pane.is_null() && pane.as_str() != Some(""))
        .map(|pane| format!(" pane={}", js_text(pane)))
        .unwrap_or_default();
    let status = tick
        .get("run")
        .and_then(|run| run.get("status"))
        .map_or_else(|| "undefined".to_owned(), js_text);
    let visibility_status = visibility
        .and_then(|v| v.get("status"))
        .filter(|s| !s.is_null())
        .map_or_else(|| "none".to_owned(), js_text);
    let outbox = tick
        .get("outbox")
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    format!(
        "fgos: run={run_id} status={status}{pane} visibility={visibility_status} outbox={outbox}"
    )
}

/// A value as a template literal prints it.
fn js_text(value: &Value) -> String {
    match value {
        Value::String(text) => text.clone(),
        other => other.to_string(),
    }
}

pub(crate) fn watch(request: &SubRequest, flags: &Flags) -> Answered {
    let run_id = run_id_of(flags, "watch")?;
    if run_id.trim().is_empty() {
        return Err(validation("dispatch watch requires a runId"));
    }
    let run_dir = resolve_run_dir(&request.root, &run_id).map_err(|e| e.refusal())?;
    let interval = flags
        .text("interval")
        .map_or(DEFAULT_WATCH_INTERVAL_MS, |text| number(&text));
    let max_ticks = flags
        .text("ticks")
        .map_or(f64::INFINITY, |text| number(&text));
    // A timer given NaN or a negative delay fires after one millisecond.
    let wait = if interval.is_finite() && interval >= 1.0 {
        Duration::from_millis(interval as u64)
    } else {
        Duration::from_millis(1)
    };
    let watched = watch_run(
        &run_dir,
        max_ticks,
        &mut |tick| eprintln!("{}", tick_line(&run_id, tick)),
        &mut || std::thread::sleep(wait),
    )
    .map_err(|e| e.refusal())?;
    let mut out = Map::new();
    out.insert("runId".into(), json!(run_id));
    out.insert("ticks".into(), json!(watched.ticks));
    out.insert("stoppedBecause".into(), json!(watched.stopped_because));
    out.extend(watched.snapshot);
    Ok(Answer::Json(Value::Object(out)))
}
