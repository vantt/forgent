//! Steps: the post-receipt steps of a supervised attempt (`settle-attempt`, `finalize-home`, `cleanup-trust`).
//!
//! The run supervisor runs them after an attempt's receipt (`steps/<stepId>.json` is the receipt the runner
//! publishes once a step finishes). Each is a function of the attempt's envelope and run directory, safe to run
//! again: no receipt means run again, a finished settlement is left alone, a half-done one is completed. The host
//! route calls [`run_attempt_step`] and prints its one line; the supervisor gains no dependency on the engine.

use std::collections::BTreeMap;
use std::path::Path;

use serde_json::{json, Value};

pub mod cleanup_trust;
pub mod finalize_home;
pub mod settle_attempt;
pub mod stray_writes;
pub mod worker_artifacts;

pub use cleanup_trust::cleanup_trust;
pub use finalize_home::{
    finalize_home, AttemptHomeFinalizer, ConfinementHomes, FinalizedHome, HomeState,
};
pub use settle_attempt::{
    provider_stop_of, settle_attempt, terminal_stop_message, PaneScreen, ProviderStop, StepPorts,
};
pub use stray_writes::{stray_write_warning, watch_writes_outside_workspace, StrayWatch};
pub use worker_artifacts::{find_worker_claim, resolve_worker_artifact_path};

pub const EXIT_DONE: i32 = 0;
pub const EXIT_ENVELOPE_INVALID: i32 = 65;
pub const EXIT_PAYLOAD_MISSING: i32 = 66;
pub const EXIT_ERROR: i32 = 70;
pub const EXIT_RETRY: i32 = 75;

/// The protocol of the host routes the run supervisor speaks.
pub const RUN_SUPERVISOR_PROTOCOL: u64 = 1;

/// Why a step stopped: `code` is the answer the host route reports, `exit` its process exit code.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{message}")]
pub struct StepError {
    pub code: &'static str,
    pub message: String,
    pub exit: i32,
}

impl StepError {
    pub fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            exit: EXIT_ERROR,
        }
    }

    pub fn envelope_invalid(message: impl Into<String>) -> Self {
        Self {
            code: "envelope-invalid",
            message: message.into(),
            exit: EXIT_ENVELOPE_INVALID,
        }
    }
}

/// What a step that did not fail answers.
#[derive(Debug, Clone, PartialEq)]
pub enum StepOutcome {
    Done(Value),
    /// No receipt is written; adopt runs the step again.
    Retry(String),
}

pub type StepResult = Result<StepOutcome, StepError>;

pub(crate) fn read_json(file: &Path) -> Option<Value> {
    serde_json::from_str(&std::fs::read_to_string(file).ok()?).ok()
}

/// The envelope of the attempt; the host route has already verified its digest.
pub fn read_envelope(run_dir: &Path) -> Result<Value, StepError> {
    let text = std::fs::read_to_string(run_dir.join("envelope.json")).map_err(|err| {
        StepError::envelope_invalid(format!(
            "envelope.json cannot be read: {}",
            match err.kind() {
                std::io::ErrorKind::NotFound => "ENOENT".to_string(),
                std::io::ErrorKind::PermissionDenied => "EACCES".to_string(),
                _ => err.to_string(),
            }
        ))
    })?;
    let envelope: Value = serde_json::from_str(&text).map_err(|err| {
        StepError::envelope_invalid(format!("envelope.json cannot be read: {err}"))
    })?;
    if envelope.get("v") != Some(&json!(3)) {
        return Err(StepError::envelope_invalid("envelope is not version 3"));
    }
    Ok(envelope)
}

/// The secret side file of the attempt, or `None` when it is gone.
pub fn read_side_file(envelope: &Value) -> Result<Option<Value>, StepError> {
    let Some(file) = envelope.get("sideFile").and_then(Value::as_str) else {
        return Ok(None);
    };
    let Some(side) = read_json(Path::new(file)) else {
        return Ok(None);
    };
    if side.get("v") != Some(&json!(1)) || side.get("attemptId") != envelope.get("attemptId") {
        return Err(StepError::envelope_invalid(
            "side file does not belong to this attempt",
        ));
    }
    Ok(Some(side))
}

/// Variables a step needs from `steps[].env`: the runner starts it with nothing else.
fn require_step_env(env: &BTreeMap<String, String>) -> Result<(), StepError> {
    let home = if cfg!(windows) { "USERPROFILE" } else { "HOME" };
    for name in ["FGOS_STATE_ROOT", home] {
        if env.get(name).is_none_or(String::is_empty) {
            return Err(StepError::envelope_invalid(format!(
                "step environment lacks {name}"
            )));
        }
    }
    Ok(())
}

fn line(body: Value) -> Value {
    let mut out = json!({"v": 1, "protocol": RUN_SUPERVISOR_PROTOCOL});
    if let (Some(out), Some(body)) = (out.as_object_mut(), body.as_object()) {
        out.extend(body.clone());
    }
    out
}

/// The one result line a step prints and the exit code of its process.
#[derive(Debug, Clone, PartialEq)]
pub struct StepRun {
    pub exit: i32,
    pub line: Value,
}

/// Run one step of the attempt in `run_dir`: the exit code and the one result line (step-receipt stepProcess):
/// done, retry or error.
pub fn run_attempt_step(
    step_id: &str,
    run_dir: &Path,
    env: &BTreeMap<String, String>,
    ports: &StepPorts<'_>,
) -> StepRun {
    let result = (|| -> StepResult {
        let envelope = read_envelope(run_dir)?;
        let known = matches!(
            step_id,
            "settle-attempt" | "finalize-home" | "cleanup-trust"
        );
        let listed = envelope
            .get("steps")
            .and_then(Value::as_array)
            .is_some_and(|steps| {
                steps
                    .iter()
                    .any(|s| s.get("stepId").and_then(Value::as_str) == Some(step_id))
            });
        if !known || !listed {
            return Err(StepError::envelope_invalid(format!(
                "the envelope has no step {step_id}"
            )));
        }
        require_step_env(env)?;
        match step_id {
            "settle-attempt" => settle_attempt(run_dir, &envelope, ports),
            "finalize-home" => finalize_home(&envelope, ports.finalizer),
            _ => cleanup_trust(run_dir),
        }
    })();
    match result {
        Ok(StepOutcome::Retry(reason)) => StepRun {
            exit: EXIT_RETRY,
            line: line(json!({"result": "retry", "reason": reason})),
        },
        Ok(StepOutcome::Done(detail)) => StepRun {
            exit: EXIT_DONE,
            line: line(json!({"result": "done", "detail": detail})),
        },
        Err(err) => StepRun {
            exit: err.exit,
            line: line(json!({
                "result": "error", "code": err.code,
                "message": err.message.chars().take(500).collect::<String>(),
            })),
        },
    }
}
