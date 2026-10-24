//! The two config lock rows of `packages/holder-lock/contracts/lock-registry.v1.json`, and the one
//! way every writer (the write transaction, the migration, the machine files) takes either.
use std::collections::BTreeMap;
use std::path::Path;

#[cfg(unix)]
use {
    crate::{snapshot::SnapshotError, ConfigRefusal},
    fgos_holder_lock::{Acquire, LockScope, ScopeError, Wait},
};

pub const PROJECT_CONFIG: &str = "project-config";
pub const GLOBAL_CONFIG: &str = "global-config";
/// Both are leaves: a write may sit inside any lower-ranked lock and takes nothing beneath it.
pub const RANK: u64 = 80;

/// Parameters for the registry templates `<fgosDir>/...` (project) and `<lockRoot>/...` (global).
pub fn scope_params(fgos_dir: &Path, lock_root: &Path) -> BTreeMap<String, String> {
    BTreeMap::from([
        ("fgosDir".into(), fgos_dir.to_string_lossy().into_owned()),
        ("lockRoot".into(), lock_root.to_string_lossy().into_owned()),
    ])
}

/// Takes `lock` for the caller's scope. A lock that stays held or times out is
/// `config-write-conflict` (`lock-held`): the loser writes nothing.
#[cfg(unix)]
pub(crate) fn hold(
    lock: &str,
    fgos_dir: &Path,
    lock_root: &Path,
    wait_ms: u64,
) -> Result<LockScope<'static>, SnapshotError> {
    let other = |e: &dyn ToString| SnapshotError::Io(std::io::Error::other(e.to_string()));
    let mut scope = LockScope::seeded(Vec::new()).map_err(|e| other(&e))?;
    match scope.acquire(lock, &scope_params(fgos_dir, lock_root), Wait::Ms(wait_ms)) {
        Ok(_) => Ok(scope),
        Err(ScopeError::Acquire(why))
            if matches!(*why, Acquire::Held { .. } | Acquire::Timeout { .. }) =>
        {
            let mut refusal = ConfigRefusal::new("config-write-conflict");
            refusal.detail_mut().keyword = Some("lock-held".into());
            Err(refusal.into())
        }
        Err(e) => Err(other(&e)),
    }
}
