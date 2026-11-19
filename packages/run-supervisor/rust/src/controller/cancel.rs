//! What a controller does when a person presses Ctrl-C: ask the supervisor of every attempt it handed over
//! to stop that attempt, wait a bounded time for the receipt, say how to continue, and leave. The controller
//! never signals an agent itself; it only publishes `cancel-requested.json`, which the supervisor polls.
//! An attempt being handed over (`begin_launch` until its binding is known, or the launch fails) is asked at
//! once, like a delivered one. After the first signal no new launch and no new step starts
//! (`assert_not_cancelled`). Handlers are installed only by a process that asked for it
//! (`enable_cancel_on_signal`, the CLI entry). (Node: `cancel-registry.mjs`, `cancel-opt-in.mjs`.)

use fgos_identity::text::iso_utc_now;
use serde_json::{json, Value};
use std::collections::BTreeSet;
use std::fmt;
use std::io::Write;
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};

const POLL_MS: u64 = 50;

/// Exit code of a controller that was cancelled by `signal` (130 for SIGINT, 143 for SIGTERM).
pub fn exit_code_of(signal: &str) -> Option<i32> {
    match signal {
        "SIGINT" => Some(130),
        "SIGTERM" => Some(143),
        _ => None,
    }
}

#[derive(Default)]
struct Registry {
    /// Attempt directories delivered to a supervisor whose answer is not read yet.
    delivered: BTreeSet<PathBuf>,
    /// Attempt directories handed to a supervisor with no binding yet.
    launching: BTreeSet<PathBuf>,
    /// Set by the first signal and never cleared by a running process: the controller is on its way out.
    cancel_signal: Option<String>,
}

static REGISTRY: Mutex<Registry> = Mutex::new(Registry {
    delivered: BTreeSet::new(),
    launching: BTreeSet::new(),
    cancel_signal: None,
});

static ENABLED: AtomicBool = AtomicBool::new(false);

fn registry() -> std::sync::MutexGuard<'static, Registry> {
    REGISTRY
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// This process wants Ctrl-C and SIGTERM to cancel the attempts it started (called once, by the CLI entry).
pub fn enable_cancel_on_signal() {
    ENABLED.store(true, Ordering::SeqCst);
}

pub fn cancel_on_signal_enabled() -> bool {
    ENABLED.load(Ordering::SeqCst)
}

/// `path.resolve`: absolute, with `.` and `..` folded away lexically.
fn resolve(dir: &Path) -> PathBuf {
    let absolute = if dir.is_absolute() {
        dir.to_path_buf()
    } else {
        std::env::current_dir().unwrap_or_default().join(dir)
    };
    let mut out = PathBuf::new();
    for part in absolute.components() {
        match part {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// Forget a cancel request (a host that outlives its controller, such as a test).
pub fn reset_cancel_request() {
    registry().cancel_signal = None;
}

/// A cancel was requested by `signal`: no new step starts, the attempts in flight are stopped and the unit can be resumed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RunCancelledError {
    pub signal: String,
}

impl RunCancelledError {
    pub const CODE: &'static str = "run-cancelled";
}

impl fmt::Display for RunCancelledError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "cancelled by {}: no new step starts; the attempts in flight are stopped and the unit can be resumed",
            self.signal
        )
    }
}

impl std::error::Error for RunCancelledError {}

/// Errs once a signal asked this process to cancel.
pub fn assert_not_cancelled() -> Result<(), RunCancelledError> {
    match &registry().cancel_signal {
        Some(signal) => Err(RunCancelledError {
            signal: signal.clone(),
        }),
        None => Ok(()),
    }
}

/// Mark `run_dir` as handed to a supervisor; refuses once a cancel was requested.
pub fn begin_launch(run_dir: &Path) -> Result<(), RunCancelledError> {
    let mut registry = registry();
    if let Some(signal) = &registry.cancel_signal {
        return Err(RunCancelledError {
            signal: signal.clone(),
        });
    }
    registry.launching.insert(resolve(run_dir));
    Ok(())
}

/// The binding of `run_dir` is known (or the launch failed): it is registered or gone.
pub fn end_launch(run_dir: &Path) {
    registry().launching.remove(&resolve(run_dir));
}

/// Remember `run_dir` once its supervisor has bound the attempt.
pub fn register(run_dir: &Path) {
    registry().delivered.insert(resolve(run_dir));
}

/// Forget `run_dir` once its result was read.
pub fn unregister(run_dir: &Path) {
    registry().delivered.remove(&resolve(run_dir));
}

/// The delivered attempt directories, sorted.
pub fn registered_runs() -> Vec<PathBuf> {
    registry().delivered.iter().cloned().collect()
}

fn read_envelope(run_dir: &Path) -> Option<Value> {
    serde_json::from_slice(&std::fs::read(run_dir.join("envelope.json")).ok()?).ok()
}

/// The body of `cancel-requested.json` (contract `cancel-requested.v1.json`).
pub fn cancel_request_body(
    attempt_id: &str,
    signal: &str,
    requester: Value,
    at: &str,
    pid: u32,
) -> Value {
    json!({
        "v": 1,
        "attemptId": attempt_id,
        "requestedBy": format!("controller pid {pid}"),
        "by": format!("signal:{signal}"),
        "requester": requester,
        "at": at,
    })
}

/// Publish `cancel-requested.json` for one attempt (once; a file already there stands).
/// Returns true when a request is on disk afterwards.
pub fn request_cancel(run_dir: &Path, signal: &str) -> bool {
    let Some(attempt_id) = read_envelope(run_dir)
        .and_then(|e| e.get("attemptId").and_then(Value::as_str).map(String::from))
    else {
        return false;
    };
    let requester = fgos_process::facts::self_identity()
        .map(|tuple| tuple.to_record().to_json())
        .unwrap_or(Value::Null);
    let body = cancel_request_body(
        &attempt_id,
        signal,
        requester,
        &iso_utc_now(),
        std::process::id(),
    );
    let Ok(bytes) = serde_json::to_vec(&body) else {
        return false;
    };
    fgos_durable_file::install_once(run_dir, "cancel-requested.json", &bytes).is_ok()
}

/// What `cancel_flow` needs from its caller: how long to wait, and where "exit" and stderr go.
pub struct CancelFlow<'a> {
    pub cancel_wait_ms: u64,
    pub exit: &'a mut dyn FnMut(i32),
    pub stderr: &'a mut dyn Write,
}

/// The first signal: write the cancel request of every attempt delivered or being handed over, wait for
/// the receipts (at most `cancel_wait_ms`), print the resume line of each unit and exit with the signal's code.
pub fn cancel_flow(signal: &str, flow: CancelFlow<'_>) {
    let code = exit_code_of(signal).unwrap_or(1);
    registry().cancel_signal = Some(signal.to_string());
    let mut seen: BTreeSet<PathBuf> = BTreeSet::new();
    let mut asked: BTreeSet<PathBuf> = BTreeSet::new();
    let open = || -> Vec<PathBuf> {
        let registry = registry();
        registry
            .delivered
            .iter()
            .chain(registry.launching.iter())
            .cloned()
            .collect()
    };
    let deadline = Instant::now() + Duration::from_millis(flow.cancel_wait_ms);
    loop {
        for dir in open() {
            seen.insert(dir.clone());
            if !asked.contains(&dir) && request_cancel(&dir, signal) {
                asked.insert(dir);
            }
        }
        let pending = open().iter().any(|dir| !dir.join("receipt.json").exists());
        if !pending || Instant::now() >= deadline {
            break;
        }
        std::thread::sleep(Duration::from_millis(POLL_MS));
    }
    let units: BTreeSet<String> = seen
        .iter()
        .filter_map(|dir| {
            read_envelope(dir)?
                .get("unitRunId")?
                .as_str()
                .map(String::from)
        })
        .collect();
    for unit in units {
        let _ = writeln!(
            flow.stderr,
            "unit {unit} chờ resume: fgos run --resume {unit}"
        );
    }
    (flow.exit)(code);
}

#[cfg(unix)]
mod handlers {
    use super::*;
    use std::sync::atomic::AtomicI32;

    static PENDING: AtomicI32 = AtomicI32::new(0);

    extern "C" fn on_signal(signal: libc::c_int) {
        PENDING.store(signal, Ordering::SeqCst);
    }

    /// Removes the handlers (and stops the watcher) when dropped.
    pub struct CancelHandlers {
        stop: std::sync::Arc<AtomicBool>,
    }

    impl Drop for CancelHandlers {
        fn drop(&mut self) {
            self.stop.store(true, Ordering::SeqCst);
            for signal in [libc::SIGINT, libc::SIGTERM] {
                unsafe { libc::signal(signal, libc::SIG_DFL) };
            }
        }
    }

    /// Handle SIGINT and SIGTERM: the first runs `cancel_flow` and exits 130 or 143; the second exits at once.
    pub fn install_cancel_on_signal(cancel_wait_ms: u64) -> CancelHandlers {
        let stop = std::sync::Arc::new(AtomicBool::new(false));
        PENDING.store(0, Ordering::SeqCst);
        for signal in [libc::SIGINT, libc::SIGTERM] {
            unsafe {
                libc::signal(
                    signal,
                    on_signal as extern "C" fn(libc::c_int) as libc::sighandler_t,
                )
            };
        }
        let watcher_stop = stop.clone();
        std::thread::spawn(move || {
            let mut first: Option<i32> = None;
            while !watcher_stop.load(Ordering::SeqCst) {
                let signal = PENDING.swap(0, Ordering::SeqCst);
                if signal != 0 {
                    if let Some(code) = first {
                        std::process::exit(code);
                    }
                    let name = if signal == libc::SIGINT {
                        "SIGINT"
                    } else {
                        "SIGTERM"
                    };
                    first = exit_code_of(name);
                    // The flow runs on its own thread so a second signal is still seen while it waits.
                    let name = name.to_string();
                    std::thread::spawn(move || {
                        let mut exit = |code: i32| std::process::exit(code);
                        let mut stderr = std::io::stderr();
                        cancel_flow(
                            &name,
                            CancelFlow {
                                cancel_wait_ms,
                                exit: &mut exit,
                                stderr: &mut stderr,
                            },
                        );
                    });
                }
                std::thread::sleep(Duration::from_millis(10));
            }
        });
        CancelHandlers { stop }
    }
}

#[cfg(unix)]
pub use handlers::{install_cancel_on_signal, CancelHandlers};
