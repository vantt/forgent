//! The one door that cleans up after attempts nobody finished: adopt judges every attempt directory that
//! is not closed and finishes the steps a dead supervisor left, then the attempt sockets no supervisor
//! holds any more are removed. Nothing here throws. (Node: `sweepAttempts` of `client.mjs`.)

use super::adopt_scan::adopt_scan;
use crate::adopt::Verdict;
use std::path::{Path, PathBuf};

/// What a sweep did: the verdicts (None when no root was named) and why adopt failed, if it did.
#[derive(Debug, Default)]
pub struct Swept {
    pub adopt: Option<Vec<(PathBuf, Verdict)>>,
    pub adopt_error: Option<String>,
}

/// Adopt-scan `assignments_root` (when named), then run `remove_sockets` (the caller binds
/// `runtime_dir::remove_orphan_attempt_sockets` to its environment and uid). An adopt panic or socket failure
/// never propagates; a socket that cannot be removed is harmless until an attempt reuses its name.
pub fn sweep_attempts(
    assignments_root: Option<&Path>,
    probe_only: bool,
    kill_wait_ms: Option<u64>,
    remove_sockets: impl FnOnce(),
) -> Swept {
    let mut swept = Swept::default();
    if let Some(root) = assignments_root {
        match std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            adopt_scan(root, probe_only, kill_wait_ms)
        })) {
            Ok(verdicts) => swept.adopt = Some(verdicts),
            Err(panic) => {
                swept.adopt_error = Some(
                    panic
                        .downcast_ref::<String>()
                        .cloned()
                        .or_else(|| panic.downcast_ref::<&str>().map(|s| s.to_string()))
                        .unwrap_or_else(|| "adopt-failed".into()),
                );
            }
        }
    }
    let _ = std::panic::catch_unwind(std::panic::AssertUnwindSafe(remove_sockets));
    swept
}
