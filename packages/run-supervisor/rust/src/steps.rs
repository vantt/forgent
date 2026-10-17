//! Post-receipt steps (`steps/<stepId>.json` receipts), run by supervise and adopt.
//! Contract: `packages/run-supervisor/contracts/step-receipt.v1.json`.
//!
//! A step runs as a child with an empty descriptor map (it never receives a
//! lock description), the environment named in the envelope and nothing
//! inherited. The runner, not the step, publishes the receipt, and only after
//! the step exited 0. Every step is idempotent: no receipt means run again.

use std::path::Path;

use serde_json::Value;

/// `EX_TEMPFAIL`: the step wants to be retried later by adopt.
pub const EXIT_RETRY: i32 = 75;

/// How the chain ended.
#[derive(Debug, PartialEq, Eq)]
pub enum StepsOutcome {
    /// Every step has a receipt.
    Done(Vec<String>),
    /// A step asked for a retry (exit 75): no receipt, the chain stops.
    Retry { step_id: String, reason: String },
    /// A step failed, timed out or could not start: no receipt, the chain stops.
    Failed { step_id: String, reason: String },
}

impl StepsOutcome {
    /// The step that is still pending, if the chain did not finish.
    pub fn pending(&self) -> Option<&str> {
        match self {
            StepsOutcome::Done(_) => None,
            StepsOutcome::Retry { step_id, .. } | StepsOutcome::Failed { step_id, .. } => Some(step_id),
        }
    }
}

/// Run the envelope's steps in order, skipping those that already have a receipt.
pub fn run_steps(envelope: &Value, run_dir: &Path) -> StepsOutcome {
    let attempt_id = envelope["attemptId"].as_str().unwrap_or_default();
    let mut done = Vec::new();
    for step in envelope["steps"].as_array().map(Vec::as_slice).unwrap_or_default() {
        let step_id = step["stepId"].as_str().unwrap_or_default().to_string();
        if run_dir.join("steps").join(format!("{step_id}.json")).exists() {
            done.push(step_id);
            continue;
        }
        #[cfg(unix)]
        let result = unix::run_step(step, run_dir);
        #[cfg(not(unix))]
        let result: Result<Option<Value>, StepFailure> = Err(StepFailure::Failed("steps have no Windows implementation yet".into()));
        match result {
            Ok(detail) => {
                if let Err(why) = publish_receipt(run_dir, attempt_id, &step_id, detail) {
                    return StepsOutcome::Failed { step_id, reason: format!("receipt not published: {why}") };
                }
                done.push(step_id);
            }
            Err(StepFailure::Retry(reason)) => return StepsOutcome::Retry { step_id, reason },
            Err(StepFailure::Failed(reason)) => return StepsOutcome::Failed { step_id, reason },
        }
    }
    StepsOutcome::Done(done)
}

/// Why a step has no receipt.
#[cfg_attr(not(unix), allow(dead_code))]
enum StepFailure {
    Retry(String),
    Failed(String),
}

fn publish_receipt(run_dir: &Path, attempt_id: &str, step_id: &str, detail: Option<Value>) -> std::io::Result<()> {
    let steps_dir = run_dir.join("steps");
    std::fs::create_dir_all(&steps_dir)?;
    let mut receipt = serde_json::json!({
        "v": 1,
        "attemptId": attempt_id,
        "stepId": step_id,
        "status": "done",
        "at": crate::publish::iso_utc_now(),
    });
    if let Some(detail) = detail {
        receipt["detail"] = detail;
    }
    let bytes = serde_json::to_vec(&receipt).map_err(std::io::Error::other)?;
    crate::publish::publish_once(&steps_dir, &format!("{step_id}.json"), &bytes).map(|_| ())
}

#[cfg(unix)]
mod unix {
    use std::collections::BTreeMap;
    use std::fs::OpenOptions;
    use std::io::Read;
    use std::os::unix::fs::OpenOptionsExt;
    use std::os::unix::process::{CommandExt, ExitStatusExt};
    use std::path::Path;
    use std::process::{Command, Stdio};
    use std::time::{Duration, Instant};

    use fgos_process::control::{signal_by_identity, spawn_with_fds, Signal};
    use fgos_process::{facts, ProcId};
    use serde_json::Value;

    use super::{StepFailure, EXIT_RETRY};

    /// Most of a step's stdout the runner keeps; the contract says one JSON line.
    const STDOUT_LIMIT: u64 = 65_536;

    /// Run one step. `Ok(detail)`: exited 0, publish the receipt.
    pub(super) fn run_step(step: &Value, run_dir: &Path) -> Result<Option<Value>, StepFailure> {
        let fail = |why: String| StepFailure::Failed(why);
        let host_bin = step["hostBin"].as_str().ok_or_else(|| fail("step has no hostBin".into()))?;
        let argv: Vec<&str> = step["argv"].as_array().map(|a| a.iter().filter_map(Value::as_str).collect()).unwrap_or_default();
        let cwd = step["cwd"].as_str().ok_or_else(|| fail("step has no cwd".into()))?;
        let timeout = Duration::from_millis(step["stepTimeoutMs"].as_u64().ok_or_else(|| fail("step has no stepTimeoutMs".into()))?);
        let env: BTreeMap<String, String> = step["env"].as_object().map(|m| m.iter().filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string()))).collect()).unwrap_or_default();

        let log = OpenOptions::new().create(true).append(true).mode(0o600).custom_flags(libc::O_CLOEXEC).open(run_dir.join("supervisor.log")).map_err(|e| fail(format!("supervisor.log: {e}")))?;
        let mut cmd = Command::new(host_bin);
        cmd.args(&argv).env_clear().envs(&env).current_dir(cwd).stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::from(log));
        // SAFETY: setsid is async-signal-safe; the step leads its own group so a timeout ends its descendants too.
        unsafe {
            cmd.pre_exec(|| if libc::setsid() < 0 { Err(std::io::Error::last_os_error()) } else { Ok(()) });
        }
        // The step receives no lock description: the map is empty.
        let mut child = spawn_with_fds(cmd, &[]).map_err(|e| fail(format!("step did not start: {e}")))?;
        let identity = facts::identity_of(ProcId(child.id()));
        let pid = child.id() as libc::pid_t;
        let mut stdout = child.stdout.take().map(|s| s.take(STDOUT_LIMIT));
        let reader = std::thread::spawn(move || {
            let mut text = String::new();
            if let Some(out) = stdout.as_mut() {
                let _ = out.read_to_string(&mut text);
            }
            text
        });

        let started = Instant::now();
        let status = loop {
            match child.try_wait() {
                Ok(Some(status)) => break status,
                Ok(None) if started.elapsed() >= timeout => {
                    if let Some(tuple) = &identity {
                        let _ = signal_by_identity(tuple, Signal::Kill);
                    }
                    // SAFETY: the child is not reaped yet, so its pid still names its own group.
                    unsafe { libc::killpg(pid, libc::SIGKILL) };
                    let _ = child.wait();
                    let _ = reader.join();
                    return Err(fail(format!("step exceeded stepTimeoutMs ({} ms)", timeout.as_millis())));
                }
                Ok(None) => std::thread::sleep(Duration::from_millis(20)),
                Err(e) => return Err(fail(format!("step wait failed: {e}"))),
            }
        };
        // A descendant that outlived the step must not outlive the chain.
        // SAFETY: the pid was reaped just now, but a group with this id can only be this step's own.
        unsafe { libc::killpg(pid, libc::SIGKILL) };
        let text = reader.join().unwrap_or_default();
        let reported = text.lines().rev().find_map(|line| serde_json::from_str::<Value>(line.trim()).ok().filter(Value::is_object));

        match status.code() {
            Some(0) => {
                if let Some(report) = &reported {
                    match report["result"].as_str() {
                        Some("retry") => return Err(StepFailure::Retry(report["reason"].as_str().unwrap_or("retry").to_string())),
                        Some("error") => return Err(fail(format!("step reported {}", report["code"].as_str().unwrap_or("error")))),
                        _ => {}
                    }
                }
                Ok(reported.and_then(|r| r.get("detail").cloned()))
            }
            Some(EXIT_RETRY) => Err(StepFailure::Retry(reported.and_then(|r| r["reason"].as_str().map(String::from)).unwrap_or_else(|| "retry".into()))),
            Some(code) => Err(fail(format!("step exited {code}"))),
            None => Err(fail(format!("step died by signal {}", status.signal().unwrap_or(0)))),
        }
    }
}
