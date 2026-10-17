//! Shared store lock for `.fgos/locks/observe.lock`.
//!
//! A kernel lock on an open file description taken through `fgos-holder-lock`:
//! a killed holder frees it at once, so there is no expiry and nothing to
//! reclaim. `Drop` closes the description and never unlocks explicitly.

use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};

pub const ACQUIRE_TIMEOUT: Duration = Duration::from_secs(5);

#[derive(Debug, thiserror::Error)]
pub enum ObserveLockError {
    #[error("observe-lock-timeout: timed out after 5s acquiring lock at {0}")]
    Timeout(PathBuf),
    #[error("lock-driver-unavailable: observe lock at {path}: {note}")]
    DriverUnavailable { path: PathBuf, note: String },
    #[error("io error acquiring lock at {path}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
}

/// Holds the observe store lock until released or dropped.
pub struct StoreLockGuard {
    _handle: fgos_holder_lock::Handle,
}

impl StoreLockGuard {
    pub fn release(self) {}
}

pub fn format_iso_now() -> String {
    if let Ok(fixed) = std::env::var("FGOS_NOW") {
        let trimmed = fixed.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }
    fgos_host_runtime::civil_time::format_system_time_utc(SystemTime::now())
}

/// `<root>/.fgos/locks/observe.lock`, the one path of the observe lock.
pub fn observe_lock_path(root: &Path) -> PathBuf {
    root.join(".fgos").join("locks").join("observe.lock")
}

/// Acquires the exclusive store lock, waiting up to [`ACQUIRE_TIMEOUT`].
pub fn acquire_store_lock(root: &Path) -> Result<StoreLockGuard, ObserveLockError> {
    acquire_store_lock_within(root, ACQUIRE_TIMEOUT)
}

/// Acquires the exclusive store lock, waiting up to `wait` for the kernel.
pub fn acquire_store_lock_within(root: &Path, wait: Duration) -> Result<StoreLockGuard, ObserveLockError> {
    let lock_path = observe_lock_path(root);
    if let Some(parent) = lock_path.parent() {
        std::fs::create_dir_all(parent).map_err(|source| ObserveLockError::Io {
            path: parent.to_path_buf(),
            source,
        })?;
    }
    let resource = fgos_holder_lock::Resource::new("observe", lock_path.clone());
    let wait_ms = u64::try_from(wait.as_millis()).unwrap_or(u64::MAX);
    match fgos_holder_lock::acquire(
        &resource,
        fgos_holder_lock::Mode::Ex,
        fgos_holder_lock::Wait::Ms(wait_ms),
        fgos_holder_lock::DEFAULT_KILL_WAIT_MS,
    ) {
        fgos_holder_lock::Acquire::Acquired(handle) => Ok(StoreLockGuard { _handle: handle }),
        fgos_holder_lock::Acquire::Held { .. } | fgos_holder_lock::Acquire::Timeout { .. } => {
            Err(ObserveLockError::Timeout(lock_path))
        }
        fgos_holder_lock::Acquire::Unavailable { reason, detail } => Err(ObserveLockError::DriverUnavailable {
            path: lock_path,
            note: format!("{}: {detail}", reason.as_str()),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_root(tag: &str) -> PathBuf {
        let tmp = std::env::temp_dir().join(format!("fgos-test-lock-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&tmp);
        std::fs::create_dir_all(&tmp).unwrap();
        tmp
    }

    #[test]
    fn acquire_excludes_a_second_taker_and_release_frees_it() {
        let tmp = temp_root("excl");
        let guard = acquire_store_lock(&tmp).expect("acquire lock");
        assert!(observe_lock_path(&tmp).exists());
        match acquire_store_lock_within(&tmp, Duration::from_millis(100)) {
            Err(ObserveLockError::Timeout(_)) => {}
            other => panic!("second taker must time out: {:?}", other.err()),
        }
        guard.release();
        acquire_store_lock_within(&tmp, Duration::from_millis(100)).expect("free after release");
        let _ = std::fs::remove_dir_all(&tmp);
    }
}
