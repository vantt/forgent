//! Machine release store management and release staging.
//!
//! Matches `runtime-identity-and-activation.md` §3, §5, §15.2.

use crate::canonical::canonicalize_manifest_files;
use crate::extract::{extract_tar_gz, resolve_extracted_release_root, ExtractError};
use crate::manifest::{read_manifest_from_path, ManifestReadError};
use crate::verify::{recompute_artifact_digest, verify_release_files, VerificationError};
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, thiserror::Error)]
pub enum LockError {
    #[error("stage already in progress")]
    AlreadyInProgress,
    #[error("io error acquiring lock: {0}")]
    Io(#[from] std::io::Error),
}

/// RAII lock guard for `install.lock` create-exclusive file.
pub struct InstallLockGuard {
    lock_path: PathBuf,
}

impl InstallLockGuard {
    pub fn acquire(store_root: &Path) -> Result<Self, LockError> {
        let lock_path = store_root.join("install.lock");
        if let Some(parent) = lock_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        match OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&lock_path)
        {
            Ok(file) => {
                drop(file);
                Ok(Self { lock_path })
            }
            Err(err) if err.kind() == std::io::ErrorKind::AlreadyExists => {
                Err(LockError::AlreadyInProgress)
            }
            Err(err) => Err(LockError::Io(err)),
        }
    }
}

impl Drop for InstallLockGuard {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.lock_path);
    }
}

/// Resolves the machine release store root per R5:
/// `${FGOS_STATE_HOME:-${XDG_STATE_HOME:-$HOME/.local/state}/fgos}/`
pub fn resolve_machine_release_store_root() -> PathBuf {
    if let Ok(val) = std::env::var("FGOS_STATE_HOME") {
        if !val.trim().is_empty() {
            return PathBuf::from(val);
        }
    }
    if let Ok(val) = std::env::var("XDG_STATE_HOME") {
        if !val.trim().is_empty() {
            return PathBuf::from(val).join("fgos");
        }
    }
    if let Ok(home) = std::env::var("HOME") {
        return PathBuf::from(home).join(".local/state/fgos");
    }
    PathBuf::from(".local/state/fgos")
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StageOutcome {
    Staged { artifact_digest: String },
    NoOp { artifact_digest: String },
}

#[derive(Debug, thiserror::Error)]
pub enum StageError {
    #[error("stage already in progress")]
    Lock(#[from] LockError),
    #[error("candidate release quarantined at {quarantine_path}: {error}")]
    Quarantined {
        digest: String,
        quarantine_path: PathBuf,
        error: Box<VerificationError>,
    },
    #[error("verification error: {0}")]
    Verification(#[from] VerificationError),
    #[error("manifest read error: {0}")]
    Manifest(#[from] ManifestReadError),
    #[error("extraction error: {0}")]
    Extract(#[from] ExtractError),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("source path does not exist: {0}")]
    SourceNotFound(PathBuf),
}

fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if ty.is_dir() {
            copy_dir_all(&src_path, &dst_path)?;
        } else if ty.is_file() {
            std::fs::copy(&src_path, &dst_path)?;
            if let Ok(metadata) = entry.metadata() {
                let permissions = metadata.permissions();
                let _ = std::fs::set_permissions(&dst_path, permissions);
            }
        }
    }
    Ok(())
}

pub fn now_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

/// Stages a candidate release into the machine release store.
///
/// Implements R6 and R7:
/// - Acquires create-exclusive `install.lock` (never retries).
/// - If `.tar.gz`, extracts to a temp directory with pure Rust flate2+tar.
/// - Verifies manifest (R2-R4).
/// - If `releases/<digest>/` already exists, treats as no-op success.
/// - Otherwise writes candidate into temp sibling under store root and renames into place
///   ONLY after manifest digest and every file digest verify.
/// - On any mismatch, moves temp directory to `quarantine/<digest>-<timestamp>/` and returns quarantined error.
/// - Releases lock on every path.
pub fn stage_release(store_root: &Path, from_path: &Path) -> Result<StageOutcome, StageError> {
    if !from_path.exists() {
        return Err(StageError::SourceNotFound(from_path.to_path_buf()));
    }

    std::fs::create_dir_all(store_root)?;

    // 1. Acquire create-exclusive install.lock
    let _lock = InstallLockGuard::acquire(store_root)?;

    let timestamp = now_millis();
    let temp_sibling = store_root.join(format!(".stage_tmp_{}_{}", std::process::id(), timestamp));

    // 2. Prepare temp sibling from source input (extract or copy). Any failure in
    // this phase (including a refused archive entry) must not leave a partial
    // temp directory behind under the store root.
    let is_tar_gz = from_path.is_file()
        || from_path
            .file_name()
            .and_then(|s| s.to_str())
            .map(|s| s.ends_with(".tar.gz") || s.ends_with(".tgz"))
            .unwrap_or(false);

    let prepare_result: Result<(), StageError> = (|| {
        if is_tar_gz {
            std::fs::create_dir_all(&temp_sibling)?;
            extract_tar_gz(from_path, &temp_sibling)?;

            if !temp_sibling.join("manifest.json").exists() {
                let resolved = resolve_extracted_release_root(&temp_sibling);
                if resolved != temp_sibling {
                    let temp_mv =
                        store_root.join(format!(".stage_mv_{}_{}", std::process::id(), timestamp));
                    std::fs::rename(&resolved, &temp_mv)?;
                    let _ = std::fs::remove_dir_all(&temp_sibling);
                    std::fs::rename(&temp_mv, &temp_sibling)?;
                }
            }
        } else {
            copy_dir_all(from_path, &temp_sibling)?;
        }
        Ok(())
    })();

    if let Err(err) = prepare_result {
        let _ = std::fs::remove_dir_all(&temp_sibling);
        return Err(err);
    }

    // 3. Read manifest from temp sibling
    let manifest_path = temp_sibling.join("manifest.json");
    let manifest = match read_manifest_from_path(&manifest_path) {
        Ok(m) => m,
        Err(e) => {
            let _ = std::fs::remove_dir_all(&temp_sibling);
            return Err(StageError::Manifest(e));
        }
    };

    let digest = manifest.artifact_digest.clone();
    let release_dir = store_root.join("releases").join(&digest);

    // 4. If releases/<digest>/ already exists, treats as no-op success
    if release_dir.exists() {
        let _ = std::fs::remove_dir_all(&temp_sibling);
        return Ok(StageOutcome::NoOp {
            artifact_digest: digest,
        });
    }

    // 5. Verification inside temp sibling (R2-R4)
    let verify_result = (|| -> Result<(), VerificationError> {
        recompute_artifact_digest(&manifest_path)?;
        canonicalize_manifest_files(&manifest)?;
        verify_release_files(&temp_sibling, &manifest)?;
        Ok(())
    })();

    match verify_result {
        Ok(()) => {
            // Success: atomically rename into releases/<digest>
            std::fs::create_dir_all(store_root.join("releases"))?;
            std::fs::rename(&temp_sibling, &release_dir)?;
            Ok(StageOutcome::Staged {
                artifact_digest: digest,
            })
        }
        Err(verify_err) => {
            // Mismatch: move temp directory to quarantine/<digest>-<timestamp>/
            let quarantine_dir = store_root
                .join("quarantine")
                .join(format!("{}-{}", digest, timestamp));
            std::fs::create_dir_all(store_root.join("quarantine"))?;
            let _ = std::fs::rename(&temp_sibling, &quarantine_dir);
            Err(StageError::Quarantined {
                digest,
                quarantine_path: quarantine_dir,
                error: Box::new(verify_err),
            })
        }
    }
}

/// Release status summary entry for `fgctl status --json` (R8).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseStatusEntry {
    pub artifact_digest: String,
    pub release_version: Option<String>,
    pub created_at: Option<String>,
}

/// Lists all releases under `releases/` as `{artifactDigest, releaseVersion, createdAt}`
/// read from each release's own `manifest.json`, sorted by `createdAt` descending.
/// An empty store reports an empty array, not an error.
pub fn list_releases(store_root: &Path) -> Result<Vec<ReleaseStatusEntry>, std::io::Error> {
    let releases_dir = store_root.join("releases");
    if !releases_dir.exists() {
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();
    for entry in std::fs::read_dir(releases_dir)? {
        let entry = entry?;
        if entry.file_type()?.is_dir() {
            let manifest_path = entry.path().join("manifest.json");
            if manifest_path.exists() {
                if let Ok(manifest) = read_manifest_from_path(&manifest_path) {
                    entries.push(ReleaseStatusEntry {
                        artifact_digest: manifest.artifact_digest,
                        release_version: manifest.release_version,
                        created_at: manifest.created_at,
                    });
                }
            }
        }
    }

    // Sort by createdAt descending
    entries.sort_by(|a, b| match (&b.created_at, &a.created_at) {
        (Some(b_date), Some(a_date)) => b_date.cmp(a_date),
        (Some(_), None) => std::cmp::Ordering::Less,
        (None, Some(_)) => std::cmp::Ordering::Greater,
        (None, None) => b.artifact_digest.cmp(&a.artifact_digest),
    });

    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lock_exclusive_and_release() {
        let temp_dir = std::env::temp_dir().join(format!("fgos_test_lock_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&temp_dir);

        {
            let lock1 =
                InstallLockGuard::acquire(&temp_dir).expect("first lock acquire must succeed");
            let lock2 = InstallLockGuard::acquire(&temp_dir);
            assert!(matches!(lock2, Err(LockError::AlreadyInProgress)));
            drop(lock1);
        }

        // After dropping lock1, acquiring should succeed again
        let lock3 = InstallLockGuard::acquire(&temp_dir);
        assert!(lock3.is_ok());

        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_resolve_store_root_precedence() {
        std::env::set_var("FGOS_STATE_HOME", "/custom/fgos/state");
        std::env::set_var("XDG_STATE_HOME", "/custom/xdg/state");
        let resolved = resolve_machine_release_store_root();
        assert_eq!(resolved, PathBuf::from("/custom/fgos/state"));
        std::env::remove_var("FGOS_STATE_HOME");
        std::env::remove_var("XDG_STATE_HOME");
    }
}
