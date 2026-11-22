//! `dispatch recover`: the CAS-guarded recovery door of a standalone Run (one no coordination session owns).
//! Without `--action` it is a pure, ephemeral recommendation; with `--action` and the four expectations it
//! applies exactly that recommendation, re-verified under the run's own recovery lock. The only state it writes
//! is the run directory's `recovery-commands.jsonl`, and what the adopt door writes when it settles the attempt.
//! The judgement is the engine's recovery planner; the attempt is the run supervisor's adopt door.

use super::observe::{probe_attempt, read_json, read_run_snapshot, resolve_run_dir, ObserveError};
use super::{require, run_id_of, validation, Answer, Answered, Flags, SubRequest};
use fgos_execution_engine::planning::recovery::{
    check_apply, collect_evidence, plan, ApplyRequest, DEFAULT_TTL_MS,
};
use fgos_execution_engine::transport::visibility_session::classify_run_outcome;
use fgos_execution_engine::transport_round::inspection::find_coordination_session_owning_assignment;
use fgos_holder_lock::{lock_path, LockScope, Wait};
use fgos_host_runtime::CategorisedRefusal;
use fgos_run_supervisor::adopt::{adopt_one, AdoptArgs, Target};
use fgos_run_supervisor::controller::lease::{control_dirs, current_generation};
use serde_json::{json, Map, Value};
use std::collections::BTreeMap;
use std::io::Write;
use std::path::Path;

const DEFAULT_INTENT: &str = "resume";
const RECOVERY_LOG_FILE: &str = "recovery-commands.jsonl";
const ATTEMPT_CONTRACT_FILES: [&str; 3] = ["receipt.json", "gate-exit.json", "closed.json"];

/// A recovery refusal: the Node `RecoveryError`'s code decides its category.
fn refused(code: &str, message: impl Into<String>) -> CategorisedRefusal {
    let category = if matches!(code, "run-not-found" | "missing-run" | "run-ambiguous") {
        "precondition"
    } else {
        "validation"
    };
    CategorisedRefusal::new(category, message)
}

fn observe_refusal(error: ObserveError) -> CategorisedRefusal {
    refused(error.code, error.message)
}

/// The Run's real control epoch, off its control ledger (`control/generations/`), never the shadow copy in
/// `run.json`; a ledger with no generation is epoch 0.
fn real_control_epoch(run_dir: &Path) -> Value {
    current_generation(&control_dirs(run_dir).generations_dir)
        .ok()
        .flatten()
        .map_or(json!(0), |generation| json!(generation.epoch))
}

/// What the adopt probe says of the attempt, with the attempt id its envelope names.
fn attempt_of(run_dir: &Path, probe: &dyn Fn(&Path) -> Value) -> Value {
    let state = probe(run_dir).get("state").cloned().unwrap_or(Value::Null);
    let attempt_id = read_json(&run_dir.join("envelope.json"))
        .and_then(|envelope| envelope.get("attemptId").cloned())
        .filter(Value::is_string)
        .unwrap_or(Value::Null);
    json!({ "state": state, "attemptId": attempt_id })
}

/// The contract files the supervisor left in the attempt directory, named as evidence.
fn attempt_files(run_dir: &Path) -> Vec<Value> {
    let mut names: Vec<Value> = ATTEMPT_CONTRACT_FILES
        .iter()
        .filter(|name| run_dir.join(name).exists())
        .map(|name| json!(name))
        .collect();
    if let Ok(entries) = std::fs::read_dir(run_dir.join("steps")) {
        let mut steps: Vec<String> = entries
            .flatten()
            .map(|entry| entry.file_name().to_string_lossy().into_owned())
            .collect();
        steps.sort();
        names.extend(steps.into_iter().map(|step| json!(format!("steps/{step}"))));
    }
    names
}

/// The logical facts the planner reasons over: the run status, its visibility and outbox, the real control
/// epoch, the attempt the probe judged, the attempt's contract files and the settled-outcome signal (with the
/// result path relative to the run, so the hash never depends on where the run lives).
pub(crate) fn build_snapshot(
    run_dir: &Path,
    probe: &dyn Fn(&Path) -> Value,
) -> Result<Value, CategorisedRefusal> {
    let read = read_run_snapshot(run_dir).map_err(observe_refusal)?;
    let field = |key: &str, default: Value| read.get(key).cloned().unwrap_or(default);
    let settled = classify_run_outcome(run_dir, "unknown")
        .map_err(|error| refused(error.code, error.message))?;
    let result_path = settled.result_path.as_deref().map(|path| {
        let base = std::path::absolute(run_dir).unwrap_or_else(|_| run_dir.to_path_buf());
        path.strip_prefix(&base)
            .map(|rel| rel.to_string_lossy().into_owned())
            .unwrap_or_else(|_| path.to_string_lossy().into_owned())
    });
    Ok(json!({
        "run": field("run", Value::Null),
        "visibility": field("visibility", Value::Null),
        "outbox": field("outbox", json!([])),
        "controller": field("controller", json!([])),
        "visibilityError": field("visibilityError", Value::Null),
        "controlEpoch": real_control_epoch(run_dir),
        "attempt": attempt_of(run_dir, probe),
        "attemptFiles": attempt_files(run_dir),
        "settledSignal": { "outcome": settled.outcome.as_str(), "resultPath": result_path },
    }))
}

fn now_iso() -> String {
    fgos_identity::text::iso_utc_now()
}

/// `recover <runId>` without `--action`: read-only and ephemeral.
pub(crate) fn recover_observe(
    root: &Path,
    run_id: &str,
    intent: &str,
    now: &str,
    probe: &dyn Fn(&Path) -> Value,
) -> Answered {
    if run_id.trim().is_empty() {
        return Err(refused(
            "invalid-run-id",
            "dispatch recover requires a runId",
        ));
    }
    let run_dir = resolve_run_dir(root, run_id).map_err(observe_refusal)?;
    let snapshot = build_snapshot(&run_dir, probe)?;
    let evidence = collect_evidence(&snapshot);
    let recommendation = plan(&snapshot, &evidence, intent, now, DEFAULT_TTL_MS)
        .map_err(|error| refused(error.code.unwrap_or("validation"), error.message))?;
    let mut out = Map::new();
    out.insert("runId".into(), json!(run_id));
    out.insert("runDir".into(), json!(run_dir));
    if let Value::Object(fields) = recommendation {
        out.extend(fields);
    }
    Ok(Answer::Json(Value::Object(out)))
}

/// The expectations one apply carries, as the CLI read them.
pub(crate) struct ApplyParams {
    pub run_id: String,
    pub action: Value,
    pub expected_snapshot: String,
    pub expected_control_epoch: Value,
    pub expected_expires_at: String,
    pub action_key: String,
}

fn read_recovery_log(run_dir: &Path) -> Result<Vec<Value>, CategorisedRefusal> {
    let Ok(text) = std::fs::read_to_string(run_dir.join(RECOVERY_LOG_FILE)) else {
        return Ok(Vec::new());
    };
    text.split('\n')
        .filter(|line| !line.trim().is_empty())
        .map(|line| {
            serde_json::from_str(line)
                .map_err(|error| CategorisedRefusal::unexpected(error.to_string()))
        })
        .collect()
}

fn append_recovery_command(run_dir: &Path, record: &Value) -> Result<(), CategorisedRefusal> {
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(run_dir.join(RECOVERY_LOG_FILE))
        .map_err(|error| CategorisedRefusal::unexpected(error.to_string()))?;
    file.write_all(format!("{record}\n").as_bytes())
        .map_err(|error| CategorisedRefusal::unexpected(error.to_string()))
}

/// `adopt`: the run supervisor's adopt door settles the attempt (receipt, the steps after it, `closed.json`). It
/// starts no agent and no second supervisor, and leaves the control epoch alone.
fn apply_adopt(
    run_id: &str,
    run_dir: &Path,
    params: &ApplyParams,
    now: &str,
) -> Result<Value, CategorisedRefusal> {
    let verdict = adopt_one(
        run_dir,
        &AdoptArgs {
            target: Target::RunDir(run_dir.to_path_buf()),
            probe_only: false,
            kill_wait_ms: fgos_holder_lock::DEFAULT_KILL_WAIT_MS,
        },
    );
    if verdict.state != "adopted" && verdict.state != "closed" {
        let outcome = if verdict.state == "open" {
            "adopt-incomplete"
        } else {
            "held"
        };
        let pending = verdict
            .pending_step
            .as_deref()
            .map(|step| format!(" (step {step} is not done)"))
            .unwrap_or_default();
        let reason = verdict
            .reason
            .as_deref()
            .filter(|reason| !reason.is_empty())
            .map(|reason| format!(": {reason}"))
            .unwrap_or_default();
        return Ok(json!({
            "runId": run_id,
            "runDir": run_dir,
            "outcome": outcome,
            "reason": format!("adopt left the attempt {}{pending}{reason}", verdict.state),
        }));
    }
    let mut record = json!({
        "actionKey": params.action_key,
        "action": params.action,
        "appliedAt": now,
        "controlEpochBefore": params.expected_control_epoch,
        "controlEpochAfter": params.expected_control_epoch,
        "snapshotHash": params.expected_snapshot,
        "adoptState": verdict.state,
    });
    if let Some(outcome) = verdict.outcome.as_deref().filter(|o| !o.is_empty()) {
        record["adoptOutcome"] = json!(outcome);
    }
    append_recovery_command(run_dir, &record)?;
    let mut out = Map::new();
    out.insert("runId".into(), json!(run_id));
    out.insert("runDir".into(), json!(run_dir));
    out.insert("outcome".into(), json!("applied"));
    if let Value::Object(fields) = record {
        out.extend(fields);
    }
    Ok(Value::Object(out))
}

/// A short critical section on `<runDir>/locks/recovery.lock`, scoped to one run directory; a holder that
/// crashes releases the lock with its process.
fn with_run_lock<T>(
    run_dir: &Path,
    body: impl FnOnce() -> Result<T, CategorisedRefusal>,
) -> Result<T, CategorisedRefusal> {
    // Taking the lock creates its directory; never bring back a run that was deleted.
    if !run_dir.exists() {
        return Err(refused(
            "run-not-found",
            format!("run directory {} is gone", run_dir.display()),
        ));
    }
    let params = BTreeMap::from([("runDir".to_owned(), run_dir.to_string_lossy().into_owned())]);
    let mut scope = LockScope::seeded(Vec::new())
        .map_err(|error| CategorisedRefusal::unexpected(error.to_string()))?;
    if scope.acquire("recovery", &params, Wait::Ms(0)).is_err() {
        let path = lock_path("recovery", &params)
            .map(|path| path.display().to_string())
            .unwrap_or_default();
        return Err(refused(
            "lock-busy",
            format!("a recovery apply is already in progress for this run ({path})"),
        ));
    }
    let answered = body();
    drop(scope);
    answered
}

/// Apply a previously issued recommendation. A repeated call with a consumed action key returns the recorded
/// outcome without touching anything (checked before the CAS comparison).
pub(crate) fn recover_apply(
    root: &Path,
    params: &ApplyParams,
    now: &str,
    probe: &dyn Fn(&Path) -> Value,
) -> Answered {
    let run_id = params.run_id.as_str();
    if run_id.trim().is_empty() {
        return Err(refused(
            "invalid-run-id",
            "dispatch recover requires a runId",
        ));
    }
    let missing: Vec<&str> = [
        (
            "action",
            params.action.is_null() || params.action == json!(""),
        ),
        ("expectedSnapshot", params.expected_snapshot.is_empty()),
        (
            "expectedControlEpoch",
            params.expected_control_epoch.is_null() || params.expected_control_epoch == json!(""),
        ),
        ("expectedExpiresAt", params.expected_expires_at.is_empty()),
        ("actionKey", params.action_key.is_empty()),
    ]
    .into_iter()
    .filter_map(|(name, absent)| absent.then_some(name))
    .collect();
    if !missing.is_empty() {
        return Err(refused(
            "missing-expectation",
            format!("dispatch recover --action requires --action, --expected-snapshot, --expected-control-epoch, --expected-expires-at and --action-key; missing: {}", missing.join(", ")),
        ));
    }
    let run_dir = resolve_run_dir(root, run_id).map_err(observe_refusal)?;
    let assignment_id = read_run_snapshot(&run_dir)
        .map_err(observe_refusal)?
        .get("run")
        .and_then(|run| run.get("assignmentId"))
        .and_then(Value::as_str)
        .filter(|id| !id.is_empty())
        .map(str::to_owned);
    let action_type = params.action.get("type").and_then(Value::as_str);
    if let (Some("adopt"), Some(assignment_id)) = (action_type, assignment_id.as_deref()) {
        if let Some(owner) = find_coordination_session_owning_assignment(root, assignment_id) {
            let text = |key: &str| {
                owner
                    .get(key)
                    .map(|v| v.as_str().map_or_else(|| v.to_string(), str::to_owned))
                    .unwrap_or_default()
            };
            return Err(refused(
                "session-owned",
                format!("run \"{run_id}\" (assignment \"{assignment_id}\") is owned by CoordinationSession \"{}\" -- adopt recovery belongs to that session's own recovery door ({}), not dispatch recover", text("id"), text("observeCommand")),
            ));
        }
    }
    let answer = with_run_lock(&run_dir, || {
        let log = read_recovery_log(&run_dir)?;
        if let Some(already) = log.iter().find(|entry| {
            entry.get("actionKey").and_then(Value::as_str) == Some(&params.action_key)
        }) {
            let mut out = Map::new();
            out.insert("runId".into(), json!(run_id));
            out.insert("runDir".into(), json!(run_dir));
            out.insert("outcome".into(), json!("already-applied"));
            if let Value::Object(fields) = already {
                out.extend(fields.clone());
            }
            return Ok(Value::Object(out));
        }
        let snapshot = build_snapshot(&run_dir, probe)?;
        let evidence = collect_evidence(&snapshot);
        let now_value = json!(now);
        let check = check_apply(&ApplyRequest {
            snapshot: &snapshot,
            evidence: &evidence,
            action: &params.action,
            expected_snapshot: &params.expected_snapshot,
            expected_control_epoch: &params.expected_control_epoch,
            expected_expires_at: &params.expected_expires_at,
            action_key: &params.action_key,
            now: &now_value,
        })
        .map_err(|error| CategorisedRefusal::unexpected(error.message))?;
        if check.get("outcome").and_then(Value::as_str) != Some("ok") {
            return Ok(json!({
                "runId": run_id,
                "runDir": run_dir,
                "outcome": check.get("outcome").cloned().unwrap_or(Value::Null),
                "reason": check.get("reason").cloned().unwrap_or(Value::Null),
            }));
        }
        apply_adopt(run_id, &run_dir, params, now)
    })?;
    Ok(Answer::Json(answer))
}

/// `Number(text)` for the expected control epoch: an integer stays an integer, anything else that is not a
/// number has no JSON form (`null`).
fn epoch_number(text: &str) -> Value {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return json!(0);
    }
    if let Ok(n) = trimmed.parse::<i64>() {
        return json!(n);
    }
    match trimmed.parse::<f64>() {
        Ok(f) if f.is_finite() && f.fract() == 0.0 && f.abs() < 9.007_199_254_740_992e15 => {
            json!(f as i64)
        }
        Ok(f) if f.is_finite() => json!(f),
        _ => Value::Null,
    }
}

pub(crate) fn recover(request: &SubRequest, flags: &Flags) -> Answered {
    let run_id = run_id_of(flags, "recover")?;
    let root = &request.root;
    let Some(action_text) = flags.text("action").or_else(|| {
        flags
            .given("action")
            .then(|| flags.switch("action").then(String::new))
            .flatten()
    }) else {
        let intent = flags
            .text("intent")
            .unwrap_or_else(|| DEFAULT_INTENT.to_owned());
        return recover_observe(root, &run_id, &intent, &now_iso(), &probe_attempt);
    };
    let action: Value = serde_json::from_str(&action_text).map_err(|error| {
        validation(format!(
            "dispatch recover --action must be valid JSON: {error}"
        ))
    })?;
    let params = ApplyParams {
        run_id,
        action,
        expected_snapshot: require(
            flags.text("expected-snapshot"),
            "dispatch recover --action requires --expected-snapshot",
        )?,
        expected_control_epoch: epoch_number(&require(
            flags.text("expected-control-epoch"),
            "dispatch recover --action requires --expected-control-epoch",
        )?),
        expected_expires_at: require(
            flags.text("expected-expires-at"),
            "dispatch recover --action requires --expected-expires-at",
        )?,
        action_key: require(
            flags.text("action-key"),
            "dispatch recover --action requires --action-key",
        )?,
    };
    recover_apply(root, &params, &now_iso(), &probe_attempt)
}
