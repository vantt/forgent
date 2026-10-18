//! Post-receipt steps (`steps/<stepId>.json` receipts), run by supervise and adopt.
//! Contract: `packages/run-supervisor/contracts/step-receipt.v1.json`.
//!
//! A step runs as a child with an empty descriptor map (it never receives a
//! lock description), the environment named in the envelope and nothing
//! inherited. The runner, not the step, publishes the receipt, and only after
//! the step exited 0. Every step is idempotent: no receipt means run again.

use std::collections::BTreeMap;
use std::path::Path;
use std::time::Duration;

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
///
/// A builtin item (`release-slot`) is run by the runner itself after every
/// process step, whether those succeeded or not: it decides from their outcome
/// whether the terminal slot closes or stays for a person.
pub fn run_steps(envelope: &Value, run_dir: &Path) -> StepsOutcome {
    let attempt_id = envelope["attemptId"].as_str().unwrap_or_default();
    let items = envelope["steps"].as_array().map(Vec::as_slice).unwrap_or_default();
    let step_id_of = |step: &Value| step["stepId"].as_str().unwrap_or_default().to_string();
    let has_receipt = |step_id: &str| run_dir.join("steps").join(format!("{step_id}.json")).exists();
    let is_builtin = |step: &Value| step["builtin"] == true;

    let mut failure: Option<StepsOutcome> = None;
    for step in items.iter().filter(|step| !is_builtin(step)) {
        let step_id = step_id_of(step);
        if has_receipt(&step_id) {
            continue;
        }
        match os::run_step(step, run_dir) {
            Ok(detail) => {
                if let Err(why) = publish_receipt(run_dir, attempt_id, &step_id, detail) {
                    failure = Some(StepsOutcome::Failed { step_id, reason: format!("receipt not published: {why}") });
                    break;
                }
            }
            Err(StepFailure::Retry(reason)) => {
                failure = Some(StepsOutcome::Retry { step_id, reason });
                break;
            }
            Err(StepFailure::Failed(reason)) => {
                failure = Some(StepsOutcome::Failed { step_id, reason });
                break;
            }
        }
    }

    // A step that asked for a retry may pass next time; deciding the slot now would fix it as "kept".
    let retrying = matches!(failure, Some(StepsOutcome::Retry { .. }));
    let earlier_done = failure.is_none();
    for step in items.iter().filter(|step| is_builtin(step) && !retrying) {
        let step_id = step_id_of(step);
        if has_receipt(&step_id) {
            continue;
        }
        let result = match step_id.as_str() {
            "release-slot" => release_slot(envelope, run_dir, earlier_done),
            other => Err(StepFailure::Failed(format!("unknown builtin step {other}"))),
        };
        let failed = match result {
            Ok(detail) => publish_receipt(run_dir, attempt_id, &step_id, detail).err().map(|why| StepFailure::Failed(format!("receipt not published: {why}"))),
            Err(failed) => Some(failed),
        };
        if let Some(failed) = failed {
            // An earlier step's failure is the one that is reported first.
            failure.get_or_insert(match failed {
                StepFailure::Retry(reason) => StepsOutcome::Retry { step_id, reason },
                StepFailure::Failed(reason) => StepsOutcome::Failed { step_id, reason },
            });
        }
    }
    failure.unwrap_or_else(|| StepsOutcome::Done(items.iter().map(step_id_of).collect()))
}

/// The `release-slot` builtin: `terminal-control.release(key, close | retain)`.
/// `kept-unknown` leaves the step without a receipt, so adopt tries again.
fn release_slot(envelope: &Value, run_dir: &Path, earlier_steps_done: bool) -> Result<Option<Value>, StepFailure> {
    use crate::terminal_slot::{disposition_for, release, Backend, ReleaseFailure};
    let key = envelope["slot"]["key"].as_str().ok_or_else(|| StepFailure::Failed("release-slot needs envelope.slot.key".into()))?;
    let receipt: Option<Value> = std::fs::read_to_string(run_dir.join("receipt.json")).ok().and_then(|text| serde_json::from_str(&text).ok());
    let disposition = disposition_for(receipt.as_ref(), earlier_steps_done);
    match release(&Backend::from_env(run_dir), key, disposition) {
        Ok(detail) => Ok(Some(detail)),
        Err(ReleaseFailure::Retry(reason)) => Err(StepFailure::Retry(reason)),
        Err(ReleaseFailure::Unsupported(reason)) => Err(StepFailure::Failed(format!("terminal-mode-unsupported: {reason}"))),
    }
}

/// Why a step has no receipt.
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

/// What the envelope says about one step.
struct StepSpec {
    host_bin: String,
    argv: Vec<String>,
    cwd: String,
    timeout: Duration,
    /// The step's whole environment: nothing else is inherited.
    env: BTreeMap<String, String>,
}

impl StepSpec {
    fn parse(step: &Value) -> Result<StepSpec, StepFailure> {
        let fail = |why: &str| StepFailure::Failed(why.into());
        Ok(StepSpec {
            host_bin: step["hostBin"].as_str().ok_or_else(|| fail("step has no hostBin"))?.to_string(),
            argv: step["argv"].as_array().map(|a| a.iter().filter_map(Value::as_str).map(String::from).collect()).unwrap_or_default(),
            cwd: step["cwd"].as_str().ok_or_else(|| fail("step has no cwd"))?.to_string(),
            timeout: Duration::from_millis(step["stepTimeoutMs"].as_u64().ok_or_else(|| fail("step has no stepTimeoutMs"))?),
            env: step["env"].as_object().map(|m| m.iter().filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string()))).collect()).unwrap_or_default(),
        })
    }
}

/// How a step that did not time out ended.
enum StepExit {
    Code(i32),
    /// Ended by a signal (Unix only).
    #[cfg_attr(windows, allow(dead_code))]
    Signal(i32),
}

/// What a step that ran to its end means: `Ok(detail)` publishes the receipt.
/// `text` is what the step printed on stdout; its last JSON object line is its report.
fn interpret(exit: StepExit, text: &str) -> Result<Option<Value>, StepFailure> {
    let reported = text.lines().rev().find_map(|line| serde_json::from_str::<Value>(line.trim()).ok().filter(Value::is_object));
    match exit {
        StepExit::Code(0) => {
            if let Some(report) = &reported {
                match report["result"].as_str() {
                    Some("retry") => return Err(StepFailure::Retry(report["reason"].as_str().unwrap_or("retry").to_string())),
                    Some("error") => return Err(StepFailure::Failed(format!("step reported {}", report["code"].as_str().unwrap_or("error")))),
                    _ => {}
                }
            }
            Ok(reported.and_then(|r| r.get("detail").cloned()))
        }
        StepExit::Code(EXIT_RETRY) => Err(StepFailure::Retry(reported.and_then(|r| r["reason"].as_str().map(String::from)).unwrap_or_else(|| "retry".into()))),
        StepExit::Code(code) => Err(StepFailure::Failed(format!("step exited {code}"))),
        StepExit::Signal(signal) => Err(StepFailure::Failed(format!("step died by signal {signal}"))),
    }
}

#[cfg(unix)]
use unix as os;
#[cfg(windows)]
use windows as os;

#[cfg(unix)]
mod unix {
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

    use super::{interpret, StepExit, StepFailure, StepSpec};

    /// Most of a step's stdout the runner keeps; the contract says one JSON line.
    const STDOUT_LIMIT: u64 = 65_536;

    /// Run one step. `Ok(detail)`: exited 0, publish the receipt.
    pub(super) fn run_step(step: &Value, run_dir: &Path) -> Result<Option<Value>, StepFailure> {
        let fail = |why: String| StepFailure::Failed(why);
        let spec = StepSpec::parse(step)?;
        let timeout = spec.timeout;

        let log = OpenOptions::new().create(true).append(true).mode(0o600).custom_flags(libc::O_CLOEXEC).open(run_dir.join("supervisor.log")).map_err(|e| fail(format!("supervisor.log: {e}")))?;
        let mut cmd = Command::new(&spec.host_bin);
        cmd.args(&spec.argv).env_clear().envs(&spec.env).current_dir(&spec.cwd).stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::from(log));
        // SAFETY: setsid is async-signal-safe; the step leads its own group so a timeout ends its descendants too.
        unsafe {
            cmd.pre_exec(|| if libc::setsid() < 0 { Err(std::io::Error::last_os_error()) } else { Ok(()) });
        }
        // The step receives no lock description: the map is empty.
        let mut child = spawn_with_fds(cmd, &[]).map_err(|e| fail(format!("step did not start: {e}")))?;
        let identity = facts::identity_of(ProcId(child.id()));
        let pid = child.id() as libc::pid_t;
        let mut stdout = child.stdout.take().map(|s| s.take(STDOUT_LIMIT));
        let (text_tx, text_rx) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
            let mut text = String::new();
            if let Some(out) = stdout.as_mut() {
                let _ = out.read_to_string(&mut text);
            }
            let _ = text_tx.send(text);
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
                    return Err(fail(format!("step exceeded stepTimeoutMs ({} ms)", timeout.as_millis())));
                }
                Ok(None) => std::thread::sleep(Duration::from_millis(20)),
                Err(e) => return Err(fail(format!("step wait failed: {e}"))),
            }
        };
        // A descendant that outlived the step must not outlive the chain.
        // SAFETY: the pid was reaped just now, but a group with this id can only be this step's own.
        unsafe { libc::killpg(pid, libc::SIGKILL) };
        // A descendant outside the step's group may still hold the pipe: wait a bounded time, never forever.
        let text = text_rx.recv_timeout(Duration::from_secs(2)).unwrap_or_default();
        let exit = match status.code() {
            Some(code) => StepExit::Code(code),
            None => StepExit::Signal(status.signal().unwrap_or(0)),
        };
        interpret(exit, &text)
    }
}

/// A step on Windows: started through the handle-list spawn (it inherits its
/// three standard streams and nothing else, so no lock handle can reach it),
/// with exactly the environment the envelope names, inside a job of its own so
/// a timeout ends its descendants too.
#[cfg(windows)]
mod windows {
    use std::ffi::OsString;
    use std::fs::OpenOptions;
    use std::io::Read;
    use std::path::Path;
    use std::time::{Duration, Instant};

    use fgos_process::platform::windows_job::create_kill_job;
    use fgos_process::platform::windows_spawn::{spawn, ChildStdio, SpawnSpec};
    use serde_json::Value;
    use windows_sys::Win32::System::Threading::CREATE_SUSPENDED;

    use super::{interpret, StepExit, StepFailure, StepSpec};

    /// Most of a step's stdout the runner keeps; the contract says one JSON line.
    const STDOUT_LIMIT: u64 = 65_536;

    pub(super) fn run_step(step: &Value, run_dir: &Path) -> Result<Option<Value>, StepFailure> {
        let fail = |why: String| StepFailure::Failed(why);
        let step_spec = StepSpec::parse(step)?;
        let log = OpenOptions::new().create(true).append(true).open(run_dir.join("supervisor.log")).map_err(|e| fail(format!("supervisor.log: {e}")))?;
        let spec = SpawnSpec {
            program: OsString::from(&step_spec.host_bin),
            args: step_spec.argv.iter().map(OsString::from).collect(),
            cwd: Some(step_spec.cwd.clone().into()),
            env: Some(step_spec.env.iter().map(|(k, v)| (OsString::from(k), OsString::from(v))).collect()),
            // Suspended so the step runs its first instruction inside its job.
            creation_flags: CREATE_SUSPENDED,
            stdin: ChildStdio::Null,
            stdout: ChildStdio::Piped,
            stderr: ChildStdio::File(log),
        };
        let mut child = spawn(spec).map_err(|e| fail(format!("step did not start: {e}")))?;
        let job = create_kill_job(&format!("Local\\fgos-step-{}-{}", std::process::id(), child.id())).map_err(|e| {
            let _ = child.kill();
            fail(format!("step job: {e}"))
        })?;
        child.assign_and_resume(&job).map_err(|e| fail(format!("step could not enter its job: {e}")))?;

        let mut stdout = child.stdout.take().map(|s| s.take(STDOUT_LIMIT));
        let (text_tx, text_rx) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
            let mut text = String::new();
            if let Some(out) = stdout.as_mut() {
                let _ = out.read_to_string(&mut text);
            }
            let _ = text_tx.send(text);
        });

        let started = Instant::now();
        let code = loop {
            match child.try_wait() {
                Ok(Some(code)) => break code,
                Ok(None) if started.elapsed() >= step_spec.timeout => {
                    let _ = job.terminate();
                    let _ = child.wait();
                    return Err(fail(format!("step exceeded stepTimeoutMs ({} ms)", step_spec.timeout.as_millis())));
                }
                Ok(None) => std::thread::sleep(Duration::from_millis(20)),
                Err(e) => return Err(fail(format!("step wait failed: {e}"))),
            }
        };
        // A descendant that outlived the step must not outlive the chain.
        let _ = job.terminate();
        let text = text_rx.recv_timeout(Duration::from_secs(2)).unwrap_or_default();
        interpret(StepExit::Code(code as i32), &text)
    }
}
