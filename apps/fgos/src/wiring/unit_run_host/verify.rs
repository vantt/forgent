//! The verify command of a unit run, run as a borrower of the custody the run holds over its worktree
//! (`runVerify`, `src/runner/execution/custody-door.mjs:79`, over `runCommand`, `src/runner/goal-check.mjs:51`).
//! The verdict is the engine's ([`classify`]); this module only runs the command: through the holder-lock borrow
//! when the run holds custody, through the engine's bounded shell otherwise.

use std::path::Path;
use std::time::{Duration, Instant};

use fgos_execution_engine::unit_run::verify::{classify, run_verify, Ran, Verified};
use fgos_holder_lock::Handle;

/// The most output a verify command keeps (`maxBuffer`, 10 MiB).
const MAX_OUTPUT_BYTES: usize = 10 * 1024 * 1024;

/// How long a verify with no timeout may run: Node set no timer at all; a bound this far out only keeps the
/// deadline arithmetic finite.
const NO_TIMEOUT: Duration = Duration::from_secs(7 * 24 * 3600);

/// Run `command` in `cwd`, bounded by `timeout_ms`, as a borrower of `custody` when given, and classify it: exit 0
/// is a pass, any other exit findings, a timeout or a command that could not run reaches no verdict.
pub fn verify(
    command: &str,
    cwd: &Path,
    timeout_ms: Option<u64>,
    custody: Option<&Handle>,
) -> Verified {
    let timeout = timeout_ms.map_or(NO_TIMEOUT, Duration::from_millis);
    let Some(custody) = custody else {
        return run_verify(command, cwd, timeout);
    };
    let started = Instant::now();
    let ran = borrowed(command, cwd, timeout, custody);
    classify(
        &ran,
        timeout_ms,
        u64::try_from(started.elapsed().as_millis()).unwrap_or(u64::MAX),
    )
}

#[cfg(unix)]
fn borrowed(command: &str, cwd: &Path, timeout: Duration, custody: &Handle) -> Ran {
    use fgos_holder_lock::{run_borrowed_io, BorrowError, BorrowIo, BorrowSpec, BorrowStdio};
    let spec = BorrowSpec {
        argv: vec!["sh".into(), "-c".into(), command.into()],
        cwd: Some(cwd.to_path_buf()),
        env: Default::default(),
        clear_env: false,
        stdio: BorrowStdio::Null,
    };
    let io = BorrowIo {
        stdin: Vec::new(),
        stdout_limit: MAX_OUTPUT_BYTES,
        stderr_limit: MAX_OUTPUT_BYTES,
        deadline: Instant::now()
            .checked_add(timeout)
            .unwrap_or_else(Instant::now),
    };
    match run_borrowed_io(custody, &spec, &io) {
        Ok(done) => {
            let output = format!(
                "{}{}",
                String::from_utf8_lossy(&done.stdout),
                String::from_utf8_lossy(&done.stderr)
            );
            Ran {
                passed: done.outcome.exit == Some(0),
                status: done.outcome.exit,
                timed_out: false,
                output,
            }
        }
        Err(BorrowError::Deadline { .. }) => Ran {
            passed: false,
            status: None,
            timed_out: true,
            output: String::new(),
        },
        // A custody that cannot be proven alone again after the run is an authority failure: it proved nothing.
        Err(other) => Ran {
            passed: false,
            status: None,
            timed_out: false,
            output: format!("{other:?}"),
        },
    }
}

/// A writing run is refused on Windows before it holds custody, so no verify borrows one there.
#[cfg(not(unix))]
fn borrowed(_command: &str, _cwd: &Path, _timeout: Duration, _custody: &Handle) -> Ran {
    Ran {
        passed: false,
        status: None,
        timed_out: false,
        output: "windows-cwd-lease-holder-missing: a verify under custody runs on the Node route on Windows".into(),
    }
}
