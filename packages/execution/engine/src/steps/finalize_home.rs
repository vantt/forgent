//! finalize-home: give the credential back, keep the session of the seat and remove the private homes of the
//! attempt. The step runs only while the supervisor or adopt holds the attempt lock and the process domain is
//! empty. A home whose marker is not this attempt's is an error (its message starts with the code) and stays.
//!
//! What a home holds, and how a renewed login is staged back, is the Confinement Authority's cleanup and
//! credential renewal's staging; the step asks them through [`AttemptHomeFinalizer`] and decides only what the
//! supervisor does next.

use std::path::Path;

use serde_json::{json, Value};

use super::{StepError, StepOutcome, StepResult};

/// How [`AttemptHomeFinalizer::finalize`] left the attempt's homes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HomeState {
    Cleaned,
    /// A home whose credential staging failed stays for a retry of this step.
    CredentialHomeKept,
    /// The staging budget is used up: the home stays for the owner.
    CredentialHomeHeld,
}

/// What finalizing the homes of one attempt reports.
#[derive(Debug, Clone, PartialEq)]
pub struct FinalizedHome {
    pub state: HomeState,
    pub homes: u64,
    /// Relative to the run directory: where the seat's session was kept, `None` when none was.
    pub transcript_path: Option<String>,
    /// What each home held, never content.
    pub home_layout: Vec<Value>,
    pub warnings: Vec<Value>,
}

/// The Confinement Authority's finalization of an attempt's homes.
pub trait AttemptHomeFinalizer {
    fn finalize(&self, run_dir: &Path, attempt_id: &str) -> Result<FinalizedHome, StepError>;
}

pub fn finalize_home(envelope: &Value, finalizer: &dyn AttemptHomeFinalizer) -> StepResult {
    let text = |key: &str| envelope.get(key).and_then(Value::as_str);
    let (Some(run_dir), Some(attempt_id)) = (text("runDir"), text("attemptId")) else {
        return Err(StepError::envelope_invalid(
            "envelope names no runDir or attemptId",
        ));
    };
    let finalized = finalizer.finalize(Path::new(run_dir), attempt_id)?;
    if finalized.state == HomeState::CredentialHomeKept {
        return Ok(StepOutcome::Retry("credential-home-kept".into()));
    }
    // The step order puts settle-attempt (the only reader of the side file) before this one, so its receipt is
    // already written; the secrets have no reader left once the home is finalized.
    if let Some(side) = text("sideFile") {
        match std::fs::remove_file(side) {
            Ok(()) => {}
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => {}
            Err(err) => {
                return Err(StepError::new(
                    "io",
                    format!("side file cannot be removed: {err}"),
                ))
            }
        }
    }
    let mut detail = json!({
        "homes": finalized.homes,
        "transcriptPath": finalized.transcript_path,
        "homeLayout": finalized.home_layout,
        "warnings": finalized.warnings,
    });
    if finalized.state == HomeState::CredentialHomeHeld {
        detail["outcome"] = json!("credential-home-held");
    }
    Ok(StepOutcome::Done(detail))
}
