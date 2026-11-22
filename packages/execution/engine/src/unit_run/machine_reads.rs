//! The sweep of attempts a dead supervisor left, the host's machine read beside the shared ones of
//! `fgos-execution::machine_reads` (re-exported here).

use std::path::Path;

pub use fgos_execution::machine_reads::{herdr_present, is_plan_directory};

/// `sweepAttempts`: adopt judges every attempt directory under `assignments_root` that is not closed and finishes
/// what a dead supervisor left, then the attempt sockets no supervisor holds are removed. Best effort: what adopt
/// judged comes back.
pub fn sweep_attempts(assignments_root: &Path) -> fgos_run_supervisor::controller::sweep::Swept {
    use fgos_run_supervisor::controller::runtime_dir::{
        current_uid, process_env, remove_orphan_attempt_sockets,
    };
    let uid = cfg!(unix).then(current_uid);
    fgos_run_supervisor::controller::sweep::sweep_attempts(
        Some(assignments_root),
        false,
        None,
        || {
            remove_orphan_attempt_sockets(
                &process_env,
                uid,
                fgos_process::facts::bound_unix_socket_paths,
            );
        },
    )
}
