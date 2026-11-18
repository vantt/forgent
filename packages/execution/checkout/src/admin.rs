//! The worktree-admin hold, taken with the caller's wait and a refusal that names its holders.

use crate::{Error, ErrorKind, Result};
use fgos_git::RepoHandle;
use fgos_holder_lock::{
    holders, Acquire, BorrowedHandle, HoldersList, LockScope, Resource, ScopeError, Wait,
};
use std::collections::BTreeMap;

/// How long a creator waits for the worktree-admin lock when the caller gives no wait.
pub const DEFAULT_ADMIN_WAIT_MS: u64 = 30_000;

/// Run `run` while this process holds worktree-admin, waiting at most `wait_ms` for it. The hold is released when
/// `run` returns. A hold another process keeps for the whole wait is `ErrorKind::LockHeld`, with its holders.
pub(crate) fn with_admin<T>(
    repo: &RepoHandle,
    wait_ms: u64,
    run: impl for<'a> FnOnce(Vec<BorrowedHandle<'a>>) -> Result<T>,
) -> Result<T> {
    let fgos_dir = repo.trusted_main_root().join(".fgos");
    let params = BTreeMap::from([(
        "fgosDir".to_owned(),
        fgos_dir.to_string_lossy().into_owned(),
    )]);
    let mut scope = LockScope::seeded(Vec::new()).map_err(scope_error)?;
    let wait = if wait_ms == 0 {
        Wait::Try
    } else {
        Wait::Ms(wait_ms)
    };
    if let Err(error) = scope.acquire("worktree-admin", &params, wait) {
        return Err(match error {
            ScopeError::Acquire(acquire) => match *acquire {
                Acquire::Held { .. } | Acquire::Timeout { .. } => lock_held(&fgos_dir, wait_ms),
                other => Error::new(
                    ErrorKind::Io,
                    format!("worktree admin lock unavailable: {other:?}"),
                ),
            },
            other => scope_error(other),
        });
    }
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

fn scope_error(error: ScopeError) -> Error {
    Error::new(ErrorKind::Invalid, error.to_string())
}

fn lock_held(fgos_dir: &std::path::Path, wait_ms: u64) -> Error {
    let resource = Resource::new("worktree-admin", fgos_dir.join("locks/worktree-admin.lock"));
    let pids: Vec<u32> = match holders(&resource) {
        Ok(HoldersList::List(tuples)) => tuples.iter().map(|t| t.pid.0).collect(),
        _ => Vec::new(),
    };
    let named = if pids.is_empty() {
        String::new()
    } else {
        format!(
            " (pid {})",
            pids.iter()
                .map(u32::to_string)
                .collect::<Vec<_>>()
                .join(", ")
        )
    };
    let waited = if wait_ms > 0 {
        format!(" after waiting {wait_ms} ms")
    } else {
        String::new()
    };
    Error::new(
        ErrorKind::LockHeld,
        format!("worktree admin is held by another process{named}{waited}"),
    )
    .detail("lock", "worktree-admin")
    .detail("label", "worktree admin")
    .detail("holders", pids)
    .detail("timedOut", wait_ms > 0)
}
