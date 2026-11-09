//! Keeps the machine's `fgctl` the one the active release ships.
//!
//! `fgctl` is a machine binary outside any release, so activating a release
//! never touched it. A release now names its own `fgctl` (`entries.fgctl`, the
//! digest in `files[]`); after `fgctl upgrade` activates, the running binary is
//! compared with it and, when they differ, replaced by the release's bytes. The
//! replaced bytes stay next to it as `<path>.prev`.
//!
//! Nothing is written unless the release's manifest matches the activated
//! artifact digest and the bytes about to be installed match the manifest's
//! digest for `fgctl`.

use crate::manifest::read_manifest_from_dir;
use crate::verify::{recompute_artifact_digest, verify_release_files};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};

/// Suffix of the kept previous binary, next to the installed one.
pub const FGCTL_PREVIOUS_SUFFIX: &str = ".prev";

/// What a refresh did.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FgctlRefresh {
    /// The release ships no `fgctl` (built before it shipped); nothing was written.
    NotShipped,
    /// The installed bytes already are the release's `fgctl`; nothing was written.
    UpToDate { digest: String },
    /// The installed binary now holds the release's bytes; the old bytes are at `previous`.
    Replaced { previous: PathBuf, digest: String },
}

/// Why a refresh refused. Each variant leaves the installed binary untouched,
/// except `ReplaceFailed`, whose message says what was written.
#[derive(Debug, thiserror::Error)]
pub enum FgctlRefreshError {
    #[error("fgctl-release-unverified: {0}; the installed fgctl was left unchanged")]
    Unverified(String),
    #[error("fgctl-not-writable: cannot write next to {installed} ({detail}); replace it by hand: {manual}")]
    NotWritable {
        installed: PathBuf,
        detail: String,
        manual: String,
    },
    #[error("fgctl-replace-failed: {detail}; replace it by hand: {manual}")]
    ReplaceFailed { detail: String, manual: String },
    #[error("fgctl-unreadable: {path}: {source}")]
    Unreadable {
        path: PathBuf,
        source: std::io::Error,
    },
}

fn sha256_hex(bytes: &[u8]) -> String {
    format!("sha256:{:x}", Sha256::digest(bytes))
}

/// The command a person runs to do this replacement by hand.
fn manual_command(source: &Path, installed: &Path) -> String {
    if cfg!(windows) {
        format!(
            "copy /Y \"{}\" \"{}\" (from a shell not running fgctl)",
            source.display(),
            installed.display()
        )
    } else {
        format!(
            "install -m 755 '{}' '{}'",
            source.display(),
            installed.display()
        )
    }
}

/// Replaces `installed` with the `fgctl` the release at `release_dir` ships,
/// when they differ. `artifact_digest` is the activated release identity the
/// manifest must still hash to.
pub fn refresh_fgctl(
    installed: &Path,
    release_dir: &Path,
    artifact_digest: &str,
) -> Result<FgctlRefresh, FgctlRefreshError> {
    let unverified = FgctlRefreshError::Unverified;

    let recomputed = recompute_artifact_digest(&release_dir.join("manifest.json"))
        .map_err(|e| unverified(format!("release manifest: {e}")))?;
    if recomputed != artifact_digest {
        return Err(unverified(format!(
            "release manifest hashes to {recomputed}, the activated release is {artifact_digest}"
        )));
    }
    let manifest = read_manifest_from_dir(release_dir)
        .map_err(|e| unverified(format!("release manifest: {e}")))?;
    let Some(entry) = manifest
        .fgctl_file()
        .map_err(|e| unverified(e.to_string()))?
    else {
        return Ok(FgctlRefresh::NotShipped);
    };

    // The existing file door refuses symlinks and escapes and checks the digest;
    // the bytes read afterwards are checked again, since they are what gets installed.
    let mut only_fgctl = manifest.clone();
    only_fgctl.files.retain(|file| file.path == entry.path);
    verify_release_files(release_dir, &only_fgctl)
        .map_err(|e| unverified(format!("release fgctl: {e}")))?;
    let source = release_dir.join(&entry.path);
    let new_bytes = std::fs::read(&source).map_err(|source_err| FgctlRefreshError::Unreadable {
        path: source.clone(),
        source: source_err,
    })?;
    if sha256_hex(&new_bytes) != entry.digest {
        return Err(unverified(format!(
            "release fgctl changed while it was read: {}",
            source.display()
        )));
    }

    let old_bytes = std::fs::read(installed).map_err(|e| FgctlRefreshError::Unreadable {
        path: installed.to_path_buf(),
        source: e,
    })?;
    if sha256_hex(&old_bytes) == entry.digest {
        return Ok(FgctlRefresh::UpToDate {
            digest: entry.digest.clone(),
        });
    }

    let manual = manual_command(&source, installed);
    let (Some(dir), Some(name)) = (
        installed.parent(),
        installed.file_name().and_then(|n| n.to_str()),
    ) else {
        return Err(FgctlRefreshError::ReplaceFailed {
            detail: format!("{} names no file in a directory", installed.display()),
            manual,
        });
    };
    let previous_name = format!("{name}{FGCTL_PREVIOUS_SUFFIX}");
    let previous = dir.join(&previous_name);

    keep_previous(installed, dir, &previous_name, &old_bytes).map_err(|e| {
        if is_write_refusal(&e) {
            FgctlRefreshError::NotWritable {
                installed: installed.to_path_buf(),
                detail: e.to_string(),
                manual: manual.clone(),
            }
        } else {
            FgctlRefreshError::ReplaceFailed {
                detail: format!(
                    "{} is unchanged; keeping its bytes at {} failed: {e}",
                    installed.display(),
                    previous.display()
                ),
                manual: manual.clone(),
            }
        }
    })?;

    if let Err(e) = fgos_durable_file::replace_durably_with_mode(dir, name, &new_bytes, 0o755) {
        let detail = if e.installed.is_some() {
            format!("the release fgctl is installed but not confirmed durable: {e}")
        } else {
            match restore_previous(&previous, installed) {
                Ok(()) => format!("{} is unchanged: {e}", installed.display()),
                Err(restore) => format!(
                    "{e}; moving the old fgctl back from {} also failed ({restore}), rename it back to {}",
                    previous.display(),
                    installed.display()
                ),
            }
        };
        return Err(FgctlRefreshError::ReplaceFailed { detail, manual });
    }
    Ok(FgctlRefresh::Replaced {
        previous,
        digest: entry.digest.clone(),
    })
}

/// [`refresh_fgctl`] against the release the workspace above `start_dir` has
/// active, as `fgctl upgrade` leaves it.
pub fn refresh_fgctl_for_workspace(
    start_dir: &Path,
    installed: &Path,
) -> Result<FgctlRefresh, FgctlRefreshError> {
    let activation = crate::workspace::resolve_workspace_root(start_dir)
        .map_err(|e| e.to_string())
        .and_then(|root| {
            let path = root.join(".fgos/installation/activation.json");
            let raw =
                std::fs::read_to_string(&path).map_err(|e| format!("{}: {e}", path.display()))?;
            serde_json::from_str::<crate::init::WorkspaceActivationBinding>(&raw)
                .map_err(|e| format!("{}: {e}", path.display()))
        })
        .map_err(|e| FgctlRefreshError::Unverified(format!("active release: {e}")))?;
    if activation.status != "ready" {
        return Err(FgctlRefreshError::Unverified(format!(
            "the workspace activation is {}, not ready",
            activation.status
        )));
    }
    refresh_fgctl(
        installed,
        Path::new(&activation.release_path),
        &activation.artifact_digest,
    )
}

fn is_write_refusal(error: &std::io::Error) -> bool {
    if error.kind() == std::io::ErrorKind::PermissionDenied {
        return true;
    }
    #[cfg(unix)]
    if error.raw_os_error() == Some(libc::EROFS) {
        return true;
    }
    false
}

/// Keeps the installed bytes as `<name>.prev`. On Unix the bytes are copied
/// there durably, so `installed` is replaced later by one atomic rename and is
/// never missing. Windows cannot rename over a running executable but can
/// rename it away, so there the running binary itself moves to `<name>.prev`.
#[cfg(not(windows))]
fn keep_previous(
    _installed: &Path,
    dir: &Path,
    previous_name: &str,
    old_bytes: &[u8],
) -> std::io::Result<()> {
    fgos_durable_file::replace_durably_with_mode(dir, previous_name, old_bytes, 0o755)
        .map(|_| ())
        .map_err(|e| e.source)
}

#[cfg(windows)]
fn keep_previous(
    installed: &Path,
    dir: &Path,
    previous_name: &str,
    _old_bytes: &[u8],
) -> std::io::Result<()> {
    std::fs::rename(installed, dir.join(previous_name))
}

/// Undoes the Windows rename-away after a failed install; on Unix `installed`
/// was never moved, so there is nothing to undo.
#[cfg(not(windows))]
fn restore_previous(_previous: &Path, _installed: &Path) -> std::io::Result<()> {
    Ok(())
}

#[cfg(windows)]
fn restore_previous(previous: &Path, installed: &Path) -> std::io::Result<()> {
    std::fs::rename(previous, installed)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::verify::to_canonical_json;

    struct Scratch(PathBuf);
    impl Scratch {
        fn new(tag: &str) -> Self {
            let dir = std::env::temp_dir()
                .join(format!("fgos_fgctl_refresh_{tag}_{}", std::process::id()));
            let _ = std::fs::remove_dir_all(&dir);
            std::fs::create_dir_all(dir.join("release/bin")).unwrap();
            std::fs::create_dir_all(dir.join("machine")).unwrap();
            Scratch(dir)
        }
    }
    impl Drop for Scratch {
        fn drop(&mut self) {
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let _ = std::fs::set_permissions(
                    self.0.join("machine"),
                    std::fs::Permissions::from_mode(0o755),
                );
            }
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    /// A staged release whose manifest names `fgctl` with the digest of
    /// `fgctl_bytes`, and the artifact digest that manifest hashes to.
    fn stage_release(dir: &Path, fgctl_bytes: &[u8]) -> (PathBuf, String) {
        let release = dir.join("release");
        std::fs::write(release.join("bin/fgctl"), fgctl_bytes).unwrap();
        let mut manifest = serde_json::json!({
            "schemaVersion": 1,
            "target": { "os": "linux", "arch": "x64" },
            "entries": { "fgos": "bin/fgos", "fgctl": "bin/fgctl" },
            "components": {
                "legacyNode": { "root": "libexec/legacy-node", "entry": "bin/fgos.mjs", "digest": "sha256:0" }
            },
            "requires": {},
            "files": [{
                "path": "bin/fgctl", "kind": "file", "digest": sha256_hex(fgctl_bytes),
                "mode": "755", "class": "immutable-entry"
            }]
        });
        let digest = sha256_hex(to_canonical_json(&manifest).as_bytes());
        manifest["artifactDigest"] = serde_json::Value::String(digest.clone());
        std::fs::write(release.join("manifest.json"), manifest.to_string()).unwrap();
        (release, digest)
    }

    fn install(dir: &Path, bytes: &[u8]) -> PathBuf {
        let installed = dir.join("machine/fgctl");
        std::fs::write(&installed, bytes).unwrap();
        installed
    }

    fn previous_of(installed: &Path) -> PathBuf {
        let mut name = installed.file_name().unwrap().to_os_string();
        name.push(FGCTL_PREVIOUS_SUFFIX);
        installed.with_file_name(name)
    }

    fn machine_listing(dir: &Path) -> Vec<String> {
        let mut names: Vec<String> = std::fs::read_dir(dir.join("machine"))
            .unwrap()
            .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
            .collect();
        names.sort();
        names
    }

    #[test]
    fn a_stale_fgctl_is_replaced_by_the_release_one_and_the_old_bytes_kept_as_prev() {
        let scratch = Scratch::new("stale");
        let (release, digest) = stage_release(&scratch.0, b"fgctl from the new release");
        let installed = install(&scratch.0, b"fgctl from an older release");

        let outcome = refresh_fgctl(&installed, &release, &digest).unwrap();

        let previous = previous_of(&installed);
        assert_eq!(
            outcome,
            FgctlRefresh::Replaced {
                previous: previous.clone(),
                digest: sha256_hex(b"fgctl from the new release"),
            }
        );
        assert_eq!(
            std::fs::read(&installed).unwrap(),
            b"fgctl from the new release"
        );
        assert_eq!(
            std::fs::read(&previous).unwrap(),
            b"fgctl from an older release"
        );
        assert_eq!(machine_listing(&scratch.0), ["fgctl", "fgctl.prev"]);
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mode = std::fs::metadata(&installed).unwrap().permissions().mode();
            assert_ne!(mode & 0o100, 0, "the replaced fgctl stays executable");
        }
    }

    #[test]
    fn a_tampered_release_fgctl_is_refused_and_the_installed_one_untouched() {
        let scratch = Scratch::new("tampered");
        let (release, digest) = stage_release(&scratch.0, b"fgctl from the new release");
        std::fs::write(release.join("bin/fgctl"), b"planted bytes").unwrap();
        let installed = install(&scratch.0, b"fgctl from an older release");

        let err = refresh_fgctl(&installed, &release, &digest).unwrap_err();

        assert!(matches!(err, FgctlRefreshError::Unverified(_)), "got {err}");
        assert!(err.to_string().starts_with("fgctl-release-unverified: "));
        assert_eq!(
            std::fs::read(&installed).unwrap(),
            b"fgctl from an older release"
        );
        assert_eq!(machine_listing(&scratch.0), ["fgctl"]);
    }

    #[test]
    fn a_manifest_that_no_longer_hashes_to_the_activated_release_is_refused() {
        let scratch = Scratch::new("manifest");
        let (release, _) = stage_release(&scratch.0, b"fgctl from the new release");
        let installed = install(&scratch.0, b"fgctl from an older release");

        let err = refresh_fgctl(&installed, &release, "sha256:another-release").unwrap_err();

        assert!(matches!(err, FgctlRefreshError::Unverified(_)), "got {err}");
        assert_eq!(machine_listing(&scratch.0), ["fgctl"]);
    }

    #[test]
    fn matching_digests_write_nothing() {
        let scratch = Scratch::new("same");
        let (release, digest) = stage_release(&scratch.0, b"the same fgctl");
        let installed = install(&scratch.0, b"the same fgctl");
        let modified = std::fs::metadata(&installed).unwrap().modified().unwrap();

        let outcome = refresh_fgctl(&installed, &release, &digest).unwrap();

        assert_eq!(
            outcome,
            FgctlRefresh::UpToDate {
                digest: sha256_hex(b"the same fgctl")
            }
        );
        assert_eq!(machine_listing(&scratch.0), ["fgctl"]);
        assert_eq!(
            std::fs::metadata(&installed).unwrap().modified().unwrap(),
            modified
        );
    }

    #[cfg(unix)]
    #[test]
    fn an_unwritable_install_directory_is_refused_by_name_with_the_manual_command() {
        use std::os::unix::fs::PermissionsExt;
        // Root writes through a read-only mode, so the refusal is unobservable as root.
        if unsafe { libc::geteuid() } == 0 {
            return;
        }
        let scratch = Scratch::new("readonly");
        let (release, digest) = stage_release(&scratch.0, b"fgctl from the new release");
        let installed = install(&scratch.0, b"fgctl from an older release");
        std::fs::set_permissions(
            scratch.0.join("machine"),
            std::fs::Permissions::from_mode(0o555),
        )
        .unwrap();

        let err = refresh_fgctl(&installed, &release, &digest).unwrap_err();

        let message = err.to_string();
        assert!(message.starts_with("fgctl-not-writable: "), "got {message}");
        assert!(
            message.contains(&format!(
                "install -m 755 '{}' '{}'",
                release.join("bin/fgctl").display(),
                installed.display()
            )),
            "got {message}"
        );
        assert_eq!(
            std::fs::read(&installed).unwrap(),
            b"fgctl from an older release"
        );
        assert_eq!(machine_listing(&scratch.0), ["fgctl"]);
    }
}
