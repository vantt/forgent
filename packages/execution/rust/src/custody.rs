//! A worktree's custody as the unit-run readers see it: the per-worktree dispatch lease belongs to
//! `fgos-run-supervisor` (`controller::cwd_lock`, its `lease` part); these are the reads over it that the engine and
//! the Node addon share.

use std::path::Path;

use fgos_run_supervisor::controller::cwd_lock::{cwd_dev_ino, dispatch_cwd_holder};

/// The lock scope under which a worktree is added to or removed from a repository.
pub const WORKTREE_ADMIN_SCOPE: &str = "workflow-worktree";

/// Whether a dispatch holds custody of `worktree` right now (a directory that is gone is held by nobody).
pub fn custody_held(fgos_dir: &Path, worktree: &Path) -> bool {
    dispatch_cwd_holder(fgos_dir, worktree).is_some()
}

/// The identity key of a worktree, the same for every spelling of its path; `None` when it does not exist.
pub fn worktree_key(worktree: &Path) -> Option<String> {
    cwd_dev_ino(worktree)
}
