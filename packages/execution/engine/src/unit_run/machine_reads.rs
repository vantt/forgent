//! The two machine reads every door of a unit run shares (the host's routes and the Node addon): whether this
//! process runs inside a live herdr session, and the sweep of attempts a dead supervisor left.

use std::path::Path;

/// `detectHerdrPresent`: herdr exports `HERDR_ENV=1` and its socket path into every pane; the session is live while
/// that socket exists.
pub fn herdr_present() -> bool {
    std::env::var("HERDR_ENV").is_ok_and(|env| env == "1")
        && std::env::var_os("HERDR_SOCKET_PATH")
            .filter(|socket| !socket.is_empty())
            .is_some_and(|socket| Path::new(&socket).exists())
}

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

/// Whether `plan_dir` is a real directory under the main checkout `main_root` (never through a link): the one disk
/// fact the plan check asks.
pub fn is_plan_directory(main_root: &str, plan_dir: &str) -> bool {
    std::fs::symlink_metadata(Path::new(main_root).join(plan_dir)).is_ok_and(|m| m.is_dir())
}
