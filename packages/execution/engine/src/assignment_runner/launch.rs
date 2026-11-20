//! The handover: start the supervisor for an immutable envelope, wait only for its binding, then read the answer
//! its settle step writes. Whatever the outcome, only the attempt copy of the locks closes here; the controller
//! keeps cwd custody.
//!
//! The attempt lock and, for an attempt that writes, the cwd lease are lent to the supervisor as descriptors 3 and 4
//! (`Handle::lend`): the supervisor holds them for the attempt's life, and the controller's lent handles only close,
//! never waiting on the child. Where a lock does not pass to a child with its handle (Windows), the controller
//! releases its attempt copy right after the spawn and the supervisor takes the attempt lock itself; the cwd lease
//! stays here, and until the binding a thread of the controller serves the lease's request channel the envelope
//! names (`cwdLeaseOwner`), on which the supervisor declares its domain ([`serving_lease_owner`]).

use std::path::{Path, PathBuf};
use std::process::Child;
use std::sync::atomic::{AtomicBool, Ordering};

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
/// attempt; one that came earlier refuses the launch. Only the attempt copy of the locks closes here. `custody` is
/// the caller's cwd lease the attempt runs under, lent when the locks were taken: like the attempt's own locks, it
/// records the supervisor it went to right after the spawn.
pub fn start_and_bind(
    attempt: &mut Attempt,
    envelope: &Value,
    extra_env: &Map<String, Value>,
    custody: Option<&fgos_holder_lock::Handle>,
) -> Result<(Binding, StartedSupervisor), RunnerConfigError> {
    let run_dir = absolute(&attempt.run_dir);
    begin_launch(&run_dir).map_err(|e| RunnerConfigError::coded(e.to_string(), "run-cancelled"))?;
    let outcome = (|| {
        #[cfg(unix)]
        let (started, bound) = {
            // Node's `spawnWithLocks([attempt, cwdLease])`: the supervisor gets a copy of the attempt lock as descriptor
            // 3 and, for an attempt that writes, of the cwd lease as descriptor 4. Both handles stay here, lent: the
            // attempt copy closes once the binding is known, the cwd lease stays until the attempt is closed (its
            // custody record), and closing a lent copy never waits on the supervisor or ends it.
            let locks = attempt.locks.as_ref().ok_or_else(|| {
                launch_failed(
                    "executeAssignment: the attempt holds no attempt lock to hand over".into(),
                )
            })?;
            let lent = |handle: &fgos_holder_lock::Handle| {
                handle.lend().map_err(|e| {
                    launch_failed(format!(
                        "executeAssignment: the {} lock could not be lent to the supervisor ({e})",
                        handle.name()
                    ))
                })
            };
            let attempt_lock = locks.attempt.as_ref().ok_or_else(|| {
                launch_failed(
                    "executeAssignment: the attempt holds no attempt lock to hand over".into(),
                )
            })?;
            let mut descriptors = vec![lent(attempt_lock)?];
            if let Some(lease) = locks.cwd_lease.as_ref() {
                descriptors.push(lent(lease)?);
            } else if let Some(copy) = locks.custody_copy.as_ref() {
                // Under custody the caller's lease goes over through the copy lent when the locks were taken.
                descriptors.push(copy.try_clone().map_err(|e| {
                    launch_failed(format!(
                        "executeAssignment: the custody lease could not be handed to the supervisor ({e})"
                    ))
                })?);
            }
            let handover: Vec<&std::fs::File> = descriptors.iter().collect();
            let mut started = start_supervisor(envelope, &handover, &attempt.step_env, extra_env)
                .map_err(|e| {
                launch_failed(format!(
                    "executeAssignment: the supervisor did not start ({e})"
                ))
            })?;
            drop(descriptors);
            // The supervisor now holds every lent copy: each lent handle records it, so a later borrow of the
            // custody lets it keep its copy and drains any other holder.
            if let Some(child) =
                fgos_process::facts::identity_of_child(fgos_process::ProcId(started.child.id()))
            {
                let lent = std::iter::once(attempt_lock)
                    .chain(locks.cwd_lease.as_ref())
                    .chain(custody.filter(|_| locks.custody_copy.is_some()));
                for handle in lent {
                    handle.lent_to(child.clone());
                }
            }
            attempt.handed_over = true;
            let bound = wait_for_binding(&run_dir, &mut started.child, binding_wait_ms(envelope));
            (started, bound)
        };
        #[cfg(not(unix))]
        let (started, bound) = {
            // The lease stays in this process (a lock is held only by the process that took it): until the binding
            // is known, the channel the envelope names answers the supervisor's declaration of its domain on it.
            let (attempt_lock, own_lease) = match attempt.locks.as_mut() {
                Some(locks) => (Some(&mut locks.attempt), locks.cwd_lease.as_ref()),
                None => (None, None),
            };
            let step_env = &attempt.step_env;
            let handed_over = &mut attempt.handed_over;
            serving_lease_owner(
                envelope["cwdLeaseOwner"].as_str(),
                own_lease.or(custody),
                || {
                    let mut started = start_supervisor(envelope, &[], step_env, extra_env)
                        .map_err(|e| {
                            launch_failed(format!(
                                "executeAssignment: the supervisor did not start ({e})"
                            ))
                        })?;
                    if let Some(lock) = attempt_lock {
                        *lock = None;
                    }
                    *handed_over = true;
                    let bound =
                        wait_for_binding(&run_dir, &mut started.child, binding_wait_ms(envelope));
                    Ok::<_, RunnerConfigError>((started, bound))
                },
            )??
        };
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

/// Where the controller serves the request channel of the cwd lease it holds to the supervisor of one attempt that
/// writes (the envelope's `cwdLeaseOwner`): a directory of that attempt.
pub fn cwd_lease_owner_dir(run_dir: &Path) -> PathBuf {
    run_dir.join("cwd-lease-owner")
}

/// Run `body` while a thread of this process serves the request channel of `lease` at `owner`
/// (`fgos_holder_lock::route::serve_requests`), the lock-hold helper's own loop: the supervisor declares its domain
/// there on the lease this process holds. No owner named, `body` runs alone. The channel stops when `body` ends,
/// however it ends.
pub fn serving_lease_owner<T>(
    owner: Option<&str>,
    lease: Option<&fgos_holder_lock::Handle>,
    body: impl FnOnce() -> T,
) -> Result<T, RunnerConfigError> {
    let Some(owner) = owner else {
        return Ok(body());
    };
    let lease = lease.ok_or_else(|| {
        launch_failed(
            "executeAssignment: the envelope names a cwd lease owner but this controller holds no cwd lease".into(),
        )
    })?;
    let dir = Path::new(owner);
    std::fs::create_dir_all(dir).map_err(|e| {
        launch_failed(format!(
            "executeAssignment: the cwd lease owner channel {} could not be made ({e})",
            dir.display()
        ))
    })?;
    struct Stop<'a>(&'a AtomicBool);
    impl Drop for Stop<'_> {
        fn drop(&mut self) {
            self.0.store(true, Ordering::SeqCst);
        }
    }
    let stop = AtomicBool::new(false);
    Ok(std::thread::scope(|scope| {
        scope.spawn(|| {
            fgos_holder_lock::route::serve_requests(dir, lease, &mut |tick| {
                std::thread::sleep(tick);
                stop.load(Ordering::SeqCst)
            })
        });
        let _stop = Stop(&stop);
        body()
    }))
}

/// What the wait for the settled answer is given.
pub struct AwaitInput<'a> {
    pub envelope: &'a Value,
    pub timeout_ms: u64,
    pub gate_kill_grace_ms: u64,
    pub on_chunk: &'a mut dyn FnMut(&str, &str),
    /// Stops the pane screen a person watching this controller sees, once the answer is read.
    pub stop_screen: Option<Box<dyn FnOnce() + 'a>>,
    /// The caller's cwd lease the attempt runs under (its custody), lent to the supervisor with the locks.
    pub custody: Option<&'a fgos_holder_lock::Handle>,
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
    let (bound, mut started) = start_and_bind(attempt, input.envelope, &Map::new(), input.custody)?;
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
