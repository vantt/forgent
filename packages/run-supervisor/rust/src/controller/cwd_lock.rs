//! The per-working-directory dispatch lock: one writing dispatch at a time per working directory, because two
//! writers in one tree race. The lock is the registry's `dispatch-cwd` lease at
//! `<fgosDir>/locks/dispatch-cwd--<dev>-<ino>-<birthtimeNs>.lock`, keyed by the directory's identity after
//! realpath, so a worktree reached through a symlink is the same lock. No TTL and no heartbeat: a holder that
//! dies releases it at once. Port of `cwd-lock.mjs`.

use super::error::DispatchError;
pub use fgos_holder_lock::cwd_dev_ino;
use fgos_holder_lock::{
    acquire, holders, probe, Acquire, Handle, HeldReason, HoldersList, LockScope, Mode, Probe,
    Resource, Wait, DEFAULT_KILL_WAIT_MS,
};
use serde_json::{json, Value};
use std::fs;
use std::path::{Path, PathBuf};

const LOCK_NAME: &str = "dispatch-cwd";

/// The lock file of `cwd` under `fgos_dir`; an error naming the missing key when `cwd` does not exist.
pub fn lock_path(fgos_dir: &Path, cwd: &Path) -> Result<PathBuf, DispatchError> {
    let key = cwd_dev_ino(cwd).ok_or_else(|| {
        DispatchError::holder_lock(
            "lock-path-param-missing",
            format!("lock {LOCK_NAME} needs cwdDevIno to resolve <fgosDir>/locks/dispatch-cwd--<cwdDevIno>.lock"),
        )
    })?;
    Ok(fgos_dir
        .join("locks")
        .join(format!("{LOCK_NAME}--{key}.lock")))
}

fn missing_cwd(cwd: &Path) -> DispatchError {
    DispatchError::new(
        "worker-spawn-fail",
        format!("dispatch cwd \"{}\" does not exist.", cwd.display()),
    )
    .with("cwd", json!(cwd.display().to_string()))
}

/// The first pid the kernel lists as holding the lock, None where holders cannot be listed.
fn holder_pid_of(lock: &Path) -> Option<u32> {
    match holders(&Resource::new(LOCK_NAME, lock)) {
        Ok(HoldersList::List(list)) => list.first().map(|holder| holder.pid.0),
        _ => None,
    }
}

/// Take the lock for `cwd` with one try. Returns the handle (drop it to release); `dispatch-in-flight` naming
/// the holder when another dispatch has it, `worker-spawn-fail` when `cwd` does not exist.
pub fn acquire_dispatch_cwd_lock(fgos_dir: &Path, cwd: &Path) -> Result<Handle, DispatchError> {
    let scope = LockScope::seeded(Vec::new())
        .map_err(|e| DispatchError::holder_lock("lock-registry-invalid", e))?;
    acquire_dispatch_cwd_lock_in(&scope, fgos_dir, cwd, &[])
}

/// Admit a custody successor. A free lease never proves a best-effort domain empty.
pub fn admit_successor(
    scope: &LockScope,
    fgos_dir: &Path,
    cwd: &Path,
) -> Result<Handle, DispatchError> {
    if !cwd.exists() {
        return Err(missing_cwd(cwd));
    }
    let lock = lock_path(fgos_dir, cwd)?;
    let kinds = ["linux-gate".to_string(), "windows-job".to_string()];
    acquire_dispatch_cwd_lock_in(scope, fgos_dir, cwd, &kinds).map_err(|error| {
        if error.code == "lock-predecessor-domain-not-empty" {
            DispatchError::new(
                "custody-predecessor-unknown",
                format!("preserve cwd \"{}\": the predecessor domain is not proven empty", cwd.display()),
            )
            .with("cwd", json!(cwd.display().to_string()))
            .with("lockPath", json!(lock.display().to_string()))
            .with("recovery", json!({ "check": "fgos git status", "disposition": "preserve", "next": "new-worktree" }))
        } else {
            error
        }
    })
}

/// The same acquire inside a scope the caller already holds locks in, so the order check (attempt before
/// dispatch-cwd) covers it. `predecessor_kinds` is the admission policy checked under the kernel lock.
pub fn acquire_dispatch_cwd_lock_in(
    scope: &LockScope,
    fgos_dir: &Path,
    cwd: &Path,
    predecessor_kinds: &[String],
) -> Result<Handle, DispatchError> {
    // The lock is keyed by the directory itself, so a directory that is not there cannot be dispatched into.
    if !cwd.exists() {
        return Err(missing_cwd(cwd));
    }
    scope
        .assert_can_acquire(LOCK_NAME)
        .map_err(|e| DispatchError::holder_lock("lock-order-violation", e))?;
    let lock = lock_path(fgos_dir, cwd)?;
    if let Some(parent) = lock.parent() {
        fs::create_dir_all(parent).map_err(|e| {
            DispatchError::holder_lock("lock-driver-unavailable", format!("{LOCK_NAME}: {e}"))
        })?;
    }
    let mut resource = Resource::new(LOCK_NAME, lock.clone());
    resource.predecessor_kinds = predecessor_kinds.to_vec();
    match acquire(&resource, Mode::Ex, Wait::Try, DEFAULT_KILL_WAIT_MS) {
        Acquire::Acquired(handle) => Ok(handle),
        Acquire::Held { reason: HeldReason::PredecessorDomainNotEmpty, domain } => Err(DispatchError::holder_lock(
            "lock-predecessor-domain-not-empty",
            format!(
                "{LOCK_NAME}: the previous holder's domain is still not empty after the kill wait ({})",
                domain.clone().unwrap_or(Value::Null)
            ),
        )
        .with("domain", domain.unwrap_or(Value::Null))),
        Acquire::Held { .. } | Acquire::Timeout { .. } => {
            Err(dispatch_in_flight_error(cwd, holder_pid_of(&lock), &lock))
        }
        Acquire::Unavailable { reason, detail } => {
            Err(DispatchError::holder_lock("lock-driver-unavailable", format!("{LOCK_NAME}: {detail}"))
                .with("reason", json!(reason.as_str())))
        }
    }
}

/// The shared live-holder refusal for dispatch and resume (without taking custody).
pub fn dispatch_in_flight_error(
    cwd: &Path,
    holder_pid: Option<u32>,
    lock_path: &Path,
) -> DispatchError {
    let holder = holder_pid
        .map(|pid| format!(" by process {pid}"))
        .unwrap_or_default();
    DispatchError::new(
        "dispatch-in-flight",
        format!(
            "dispatch for cwd \"{}\" is already in flight (held{holder}).",
            cwd.display()
        ),
    )
    .with("cwd", json!(cwd.display().to_string()))
    .with(
        "holderPid",
        holder_pid.map_or(Value::Null, |pid| json!(pid)),
    )
    .with("lockPath", json!(lock_path.display().to_string()))
}

/// The dispatch holding `cwd`'s lock.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CwdHolder {
    /// None where the kernel cannot list holders.
    pub pid: Option<u32>,
    pub lock_path: PathBuf,
}

/// Who holds `cwd`'s lock, or None when nothing does. Reads the kernel holder list, which takes no lock, so a
/// check never makes a concurrent dispatch see the lock held; the probe is only for a platform that cannot list.
pub fn dispatch_cwd_holder(fgos_dir: &Path, cwd: &Path) -> Option<CwdHolder> {
    // A directory that does not exist has no dispatch running in it.
    if !cwd.exists() {
        return None;
    }
    let lock = lock_path(fgos_dir, cwd).ok()?;
    // A lock file never created was never taken: nothing to look at.
    if !lock.exists() {
        return None;
    }
    let resource = Resource::new(LOCK_NAME, lock.clone());
    if let Ok(HoldersList::List(list)) = holders(&resource) {
        return list.first().map(|holder| CwdHolder {
            pid: Some(holder.pid.0),
            lock_path: lock.clone(),
        });
    }
    match probe(&resource) {
        Ok(Probe::Free) => None,
        _ => Some(CwdHolder {
            pid: None,
            lock_path: lock,
        }),
    }
}

/// A failed handoff leaves predecessor evidence intact and preserves the settled result: the warning to add
/// to the result when the custody's domain could not be cleared.
pub fn record_custody_handoff(custody: Option<&Handle>) -> Option<Value> {
    let handle = custody?;
    handle
        .clear_domain()
        .err()
        .map(|error| json!({ "code": "custody-handoff-not-recorded", "detail": error.to_string() }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeMap;

    /// The controller's lock file is the registry's `dispatch-cwd` path filled with the one-door key, the same file
    /// Git's custody probe names for the directory.
    #[test]
    fn lock_path_is_the_dispatch_cwd_registry_path_of_the_directory() {
        let cwd = fs::canonicalize(std::env::temp_dir()).unwrap();
        let fgos_dir = cwd.join(".fgos");
        let params = BTreeMap::from([
            ("fgosDir".to_owned(), fgos_dir.display().to_string()),
            ("cwdDevIno".to_owned(), cwd_dev_ino(&cwd).unwrap()),
        ]);
        let registry = fgos_holder_lock::lock_path(LOCK_NAME, &params).unwrap();
        assert_eq!(lock_path(&fgos_dir, &cwd).unwrap(), registry);
    }
}
