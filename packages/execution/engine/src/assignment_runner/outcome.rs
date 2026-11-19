//! What a resumed Run already has, so a resume never launches a second worker over it.

use std::path::Path;

use fgos_run_supervisor::adopt::{adopt_one, AdoptArgs, Target, Verdict};

use super::RunnerConfigError;
use crate::run_result::reader::{read_settled_result, InterpretedRunResult};

/// The adopt door, asked to judge the supervised attempt of a run directory (and adopt it when it can).
pub trait AdoptDoor {
    fn adopt(&self, run_dir: &Path) -> Verdict;
}

/// The adopt door of `fgos-run-supervisor`.
pub struct SupervisorAdoptDoor {
    pub kill_wait_ms: u64,
}

impl AdoptDoor for SupervisorAdoptDoor {
    fn adopt(&self, run_dir: &Path) -> Verdict {
        adopt_one(
            run_dir,
            &AdoptArgs {
                target: Target::RunDir(run_dir.to_path_buf()),
                probe_only: false,
                kill_wait_ms: self.kill_wait_ms,
            },
        )
    }
}

/// The settled result of a resumed Run, or a refusal by name when that result is unreadable, when the adopt door
/// judges its supervised attempt not settled, or when it carries a launch record from before the run supervisor.
/// `None` when nothing was launched.
pub fn resumed_run_outcome(
    run_dir: &Path,
    run_id: &str,
    adopt: &dyn AdoptDoor,
) -> Result<Option<InterpretedRunResult>, RunnerConfigError> {
    if run_dir.join("result.json").exists() {
        // A result that cannot be read soundly (torn write, failed validation, contract-corrupt) is not "no result
        // yet": a human or recovery door decides next.
        return match read_settled_result(run_dir, run_id) {
            Some(settled) => Ok(Some(settled)),
            None => Err(RunnerConfigError::post_admission(
                format!("executeAssignment: Run \"{run_id}\" resume found an existing result.json that failed validation, failed to parse or is contract-corrupt -- refusing to relaunch over corrupt settlement evidence"),
                "result-corrupt",
            )),
        };
    }
    if run_dir.join("envelope.json").exists() {
        let judged = adopt.adopt(run_dir);
        if let Some(settled) = read_settled_result(run_dir, run_id) {
            return Ok(Some(settled));
        }
        let live = matches!(judged.state, "running" | "being-adopted" | "held");
        let reason = judged.reason.as_deref();
        let mut error = RunnerConfigError::post_admission(
            format!(
                "executeAssignment: Run \"{run_id}\" resume found its attempt in state \"{}\"{} -- refusing to launch a second worker over it",
                judged.state,
                reason.map(|r| format!(" ({r})")).unwrap_or_default()
            ),
            if live { "run-in-flight" } else { "run-unreconciled" },
        )
        .with("reconcileStatus", serde_json::json!(judged.state));
        if let Some(reason) = reason {
            error = error.with("reconcileReason", serde_json::json!(reason));
        }
        return Err(error);
    }
    if run_dir.join("controller").join("commands").exists() {
        return Err(RunnerConfigError::post_admission(
            format!("executeAssignment: Run \"{run_id}\" resume found a launch record from before the run supervisor -- refusing to launch a second worker over it"),
            "run-unreconciled",
        )
        .with("reconcileReason", serde_json::json!("legacy-run")));
    }
    Ok(None)
}
