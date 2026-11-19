//! The handover: start the supervisor for an immutable envelope, wait only for its binding, then read the answer
//! its settle step writes. Whatever the outcome, only the attempt copy of the locks closes here; the controller
//! keeps cwd custody.
//!
//! The attempt lock goes to the supervisor as a descriptor, so the supervisor holds it for the attempt's life and
//! the controller keeps no copy. Where a lock does not pass to a child with its handle (Windows), the controller
//! stays the attempt lock holder until the supervisor is spawned and bound: it releases its copy right after the
//! spawn, as the supervisor declares its job on the same lease without reacquiring it, so nothing in the
//! controller waits on the child.

use std::path::Path;
use std::process::Child;

use fgos_run_supervisor::adopt::{adopt_one, AdoptArgs, Target};
use fgos_run_supervisor::controller::cancel::{begin_launch, end_launch, register, unregister};
use fgos_run_supervisor::controller::launch::{
    await_settled_result, binding_wait_ms, settlement_ceiling_ms, start_supervisor,
    wait_for_binding, Binding, StartedSupervisor,
};
use serde_json::{Map, Value};

use super::attempt::{control_is_current, Attempt};
use super::RunnerConfigError;
use crate::run_result::reader::{read_settled_result, InterpretedRunResult};

fn absolute(path: &Path) -> std::path::PathBuf {
    std::path::absolute(path).unwrap_or_else(|_| path.to_path_buf())
}

fn launch_failed(message: String) -> RunnerConfigError {
    RunnerConfigError::new(message)
}

/// The first half of `await_binding`, callable alone: hand the attempt to the supervisor and wait only for its
/// binding. A Ctrl-C from the handover until the binding is known waits for the binding and then cancels the
/// attempt; one that came earlier refuses the launch. Only the attempt copy of the locks closes here.
pub fn start_and_bind(
    attempt: &mut Attempt,
    envelope: &Value,
    extra_env: &Map<String, Value>,
) -> Result<(Binding, StartedSupervisor), RunnerConfigError> {
    let run_dir = absolute(&attempt.run_dir);
    begin_launch(&run_dir).map_err(|e| RunnerConfigError::coded(e.to_string(), "run-cancelled"))?;
    let outcome = (|| {
        #[cfg(unix)]
        let mut started = {
            let handle = attempt
                .locks
                .as_mut()
                .and_then(|locks| locks.attempt.take())
                .ok_or_else(|| {
                    launch_failed(
                        "executeAssignment: the attempt holds no attempt lock to hand over".into(),
                    )
                })?;
            let descriptor = handle.hand_over().map_err(|e| {
                launch_failed(format!(
                    "executeAssignment: the attempt lock could not be handed over ({e})"
                ))
            })?;
            let started = start_supervisor(envelope, &[&descriptor], &attempt.step_env, extra_env)
                .map_err(|e| {
                    launch_failed(format!(
                        "executeAssignment: the supervisor did not start ({e})"
                    ))
                })?;
            // The supervisor's copy is the last one from here on.
            drop(descriptor);
            started
        };
        #[cfg(not(unix))]
        let mut started = {
            let started =
                start_supervisor(envelope, &[], &attempt.step_env, extra_env).map_err(|e| {
                    launch_failed(format!(
                        "executeAssignment: the supervisor did not start ({e})"
                    ))
                })?;
            if let Some(locks) = attempt.locks.as_mut() {
                locks.release_attempt();
            }
            started
        };
        attempt.handed_over = true;
        let bound = wait_for_binding(&run_dir, &mut started.child, binding_wait_ms(envelope));
        if bound == Binding::Bound {
            register(&run_dir);
        }
        Ok((bound, started))
    })();
    if let Some(locks) = attempt.locks.as_mut() {
        locks.release_attempt();
    }
    end_launch(&run_dir);
    outcome
}

/// What the wait for the settled answer is given.
pub struct AwaitInput<'a> {
    pub envelope: &'a Value,
    pub timeout_ms: u64,
    pub gate_kill_grace_ms: u64,
    pub on_chunk: &'a mut dyn FnMut(&str, &str),
    /// Stops the pane screen a person watching this controller sees, once the answer is read.
    pub stop_screen: Option<Box<dyn FnOnce() + 'a>>,
}

fn adopt_run(run_dir: &Path) -> Result<String, String> {
    Ok(adopt_one(
        run_dir,
        &AdoptArgs {
            target: Target::RunDir(run_dir.to_path_buf()),
            probe_only: false,
            kill_wait_ms: fgos_holder_lock::DEFAULT_KILL_WAIT_MS,
        },
    )
    .state
    .to_string())
}

fn settled_by(attempt: &mut Attempt, settled: InterpretedRunResult) -> InterpretedRunResult {
    attempt.settled = true;
    attempt.result = Some(settled.record.clone());
    settled
}

/// Hand the attempt to the supervisor and wait only for its binding, then read the answer the settle step writes.
pub fn await_binding(
    attempt: &mut Attempt,
    input: AwaitInput<'_>,
) -> Result<InterpretedRunResult, RunnerConfigError> {
    let run_dir = absolute(&attempt.run_dir);
    let run_id = attempt.run_id.clone();
    let (bound, mut started) = start_and_bind(attempt, input.envelope, &Map::new())?;
    await_settled(attempt, &run_dir, &run_id, bound, &mut started.child, input)
}

/// The second half of [`await_binding`]: after the binding, read progress and wait for the settled result.
pub fn await_settled(
    attempt: &mut Attempt,
    run_dir: &Path,
    run_id: &str,
    bound: Binding,
    child: &mut Child,
    input: AwaitInput<'_>,
) -> Result<InterpretedRunResult, RunnerConfigError> {
    if bound != Binding::Bound {
        // The supervisor may have finished the attempt (or refused it) in the same breath: adopt judges what is on
        // disk. Without a settled answer the launch is unknown, never "not started".
        let (state, exit) = match &bound {
            Binding::Exited { exit, .. } => ("exited", *exit),
            _ => ("unknown", None),
        };
        if state == "exited" {
            let _ = adopt_run(run_dir);
            if let Some(early) = read_settled_result(run_dir, run_id) {
                return Ok(settled_by(attempt, early));
            }
        }
        return Err(RunnerConfigError::post_admission(
            format!(
                "executeAssignment: Run \"{run_id}\" supervisor did not bind the attempt ({state}{}) -- the launch is unknown; see supervisor.log in the run directory",
                exit.map(|e| format!(", exit {e}")).unwrap_or_default()
            ),
            "launch-unknown",
        )
        .with("launchState", serde_json::json!(state)));
    }

    // From here the controller only reads: live output from the capture files, the answer from result.json that the
    // settle step writes after the receipt. A Ctrl-C until the answer is read asks the supervisor to cancel
    // (registered with the binding).
    let ceiling = settlement_ceiling_ms(input.envelope, input.timeout_ms, input.gate_kill_grace_ms);
    let attempt_id = attempt.attempt_id.clone();
    let settled = await_settled_result(
        run_dir,
        &attempt_id,
        child,
        ceiling,
        input.on_chunk,
        &|dir| read_settled_result(dir, run_id).map(|r| r.record),
        &adopt_run,
    );
    unregister(run_dir);
    if let Some(stop) = input.stop_screen {
        stop();
    }
    if settled.is_none() {
        // A fresher controller took the run control over while the agent ran: the settle step refused to append (it
        // preserves its work product as result.superseded.json), and this controller says so by name.
        if !control_is_current(attempt) {
            return Err(RunnerConfigError::post_admission(
                format!("executeAssignment: control of Run \"{run_id}\" was superseded while its attempt ran -- no settlement was appended"),
                "run-control-superseded",
            ));
        }
        return Err(RunnerConfigError::post_admission(
            format!("executeAssignment: Run \"{run_id}\" has no settled result after its supervisor ended -- the adopt door owns it now"),
            "run-unreconciled",
        ));
    }
    match read_settled_result(run_dir, run_id) {
        Some(interpreted) => Ok(settled_by(attempt, interpreted)),
        None => Err(RunnerConfigError::post_admission(
            format!("executeAssignment: Run \"{run_id}\" has no settled result after its supervisor ended -- the adopt door owns it now"),
            "run-unreconciled",
        )),
    }
}
