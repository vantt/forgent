//! The worktree-admin hold, taken with the caller's wait.

use crate::{Error, ErrorKind, Result};
use fgos_git::RepoHandle;
use fgos_holder_lock::{BorrowedHandle, Wait};

/// How long a creator waits for the worktree-admin lock when the caller gives no wait.
pub const DEFAULT_ADMIN_WAIT_MS: u64 = 30_000;

/// Run `run` while this process holds worktree-admin, waiting at most `wait_ms` for it. The hold is released when
/// `run` returns. A hold another process keeps for the whole wait is `ErrorKind::LockHeld`, with its holders.
pub(crate) fn with_admin<T>(
    repo: &RepoHandle,
    wait_ms: u64,
    run: impl for<'a> FnOnce(Vec<BorrowedHandle<'a>>) -> Result<T>,
) -> Result<T> {
    let wait = if wait_ms == 0 {
        Wait::Try
    } else {
        Wait::Ms(wait_ms)
    };
    let scope = fgos_git::acquire_worktree_admin(repo, Vec::new(), wait)
        .map_err(|error| Error::git_or_lock_held(error, wait_ms))?;
    let hold = scope.handle("worktree-admin").ok_or_else(|| {
        Error::new(
            ErrorKind::Io,
            "worktree admin lock vanished after it was taken",
        )
    })?;
    let borrowed = BorrowedHandle::new(hold).map_err(|e| {
        Error::new(
            ErrorKind::Io,
            format!("borrowing the worktree admin lock failed: {e:?}"),
        )
    })?;
    run(vec![borrowed])
}
