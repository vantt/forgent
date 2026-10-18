//! Git C5 admission owned by the activation controller, never a candidate.
use crate::init::{ActivationLockGuard, InitError};
use crate::manifest::ReleaseManifest;
use fgos_git::{
    wal::{OsFileSystem, Wal},
    GitDriver, ResolveRepo,
};
use std::path::Path;

fn refusal(code: &str, detail: impl std::fmt::Display) -> InitError {
    InitError::Custom(format!("{code}: {detail}"))
}

/// Scan only. A missing WAL is clean; a partially created or corrupt WAL is
/// unreadable. Incomplete enumeration can never authorize a rollback.
pub fn check_wal(common: &Path, supports_wal: bool) -> Result<(), InitError> {
    let root = common.join("fgos/git");
    match std::fs::symlink_metadata(&root) {
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(e) => return Err(refusal("git-wal-unreadable", e)),
        Ok(_) => (),
    }
    let wal =
        Wal::open_existing(common, OsFileSystem).map_err(|e| refusal("git-wal-unreadable", e))?;
    let scan = wal
        .scan(100_000)
        .map_err(|e| refusal("git-wal-unreadable", e))?;
    if !scan.complete || scan.entries.iter().any(|e| e.error.is_some()) {
        return Err(refusal(
            "git-wal-unreadable",
            "incomplete or corrupt operation scan",
        ));
    }
    if !supports_wal && scan.unresolved != 0 {
        return Err(refusal(
            "git-wal-pending",
            format!("{} unresolved operations", scan.unresolved),
        ));
    }
    Ok(())
}

fn has_wal(manifest: &ReleaseManifest) -> bool {
    manifest.capabilities.iter().any(|c| c == "git-wal-v1")
}

fn predecessor_scan(workspace: &Path) -> Result<(), InitError> {
    let output = std::process::Command::new(std::env::current_exe()?)
        .args(["internal", "quiesce-scan", "--protocol", "1", "--root"])
        .arg(workspace)
        .args(["--exclude-pid", &std::process::id().to_string()])
        .output()?;
    let scan: serde_json::Value = serde_json::from_slice(&output.stdout)
        .map_err(|e| refusal("git-predecessor-writer-live", e))?;
    if scan["v"] != 1
        || scan["protocol"] != 1
        || scan["result"] == "unavailable"
        || scan["unreadable"].as_u64() != Some(0)
        || !matches!(output.status.code(), Some(0 | 10))
    {
        return Err(refusal(
            "git-predecessor-writer-live",
            "process scan unavailable or incomplete",
        ));
    }
    let processes = scan["processes"]
        .as_array()
        .ok_or_else(|| refusal("git-predecessor-writer-live", "invalid process scan"))?;
    for process in processes {
        let cmdline = process["cmdline"].as_str().unwrap_or("");
        // quiesce-scan also reports ordinary shells in the workspace. Only
        // fgOS payloads can be predecessor writers at this capability split.
        let fgos = cmdline.split_whitespace().any(|arg| {
            let base = Path::new(arg)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("");
            matches!(
                base,
                "fgos" | "fgos-runner" | "fgos-gateway" | "fgos.mjs" | "fgos-runner.mjs"
            )
        });
        if !fgos {
            continue;
        }
        let compatible = cmdline
            .split_whitespace()
            .filter(|arg| Path::new(arg).is_absolute())
            .any(|arg| {
                Path::new(arg)
                    .ancestors()
                    .skip(1)
                    .find_map(|dir| {
                        std::fs::read(dir.join("manifest.json")).ok().map(|bytes| {
                            serde_json::from_slice::<ReleaseManifest>(&bytes)
                                .is_ok_and(|m| has_wal(&m))
                        })
                    })
                    .unwrap_or(false)
            });
        if !compatible {
            return Err(refusal(
                "git-predecessor-writer-live",
                format!("pid {} lacks proven git-wal-v1", process["pid"]),
            ));
        }
    }
    Ok(())
}

pub(crate) fn admit(
    workspace: &Path,
    state_root: &Path,
    manifest: &ReleaseManifest,
    lock: &ActivationLockGuard,
) -> Result<(), InitError> {
    let driver = GitDriver::new(state_root).map_err(|e| refusal("git-wal-unreadable", e.cause))?;
    let mut wal_exists = false;
    if let ResolveRepo::Repository(repo) = driver
        .resolve_repo(workspace, workspace)
        .map_err(|e| refusal("git-wal-unreadable", e.cause))?
    {
        wal_exists = repo
            .common_dir()
            .join("fgos/git")
            .symlink_metadata()
            .is_ok();
        check_wal(repo.common_dir(), has_wal(manifest))?;
    }
    let fence = workspace.join(".fgos/locks/activation.lock");
    if has_wal(manifest) || wal_exists {
        predecessor_scan(workspace)?;
    }
    if has_wal(manifest) {
        lock.fence_legacy(workspace)?;
    } else if (fence.is_dir() || wal_exists)
        && !fgos_holder_lock::tombstone::is_tombstone(&fence, "activation", "fgos git")
    {
        return Err(refusal("git-fence-missing", "invalid old-controller fence"));
    }
    Ok(())
}

#[cfg(all(test, target_os = "linux"))]
mod tests {
    use super::*;
    use fgos_git::wal::{
        Begin, Intent, OperationKind, Phase, PublicationAuthority, Tip, WalResult,
    };
    struct Seed;
    impl PublicationAuthority for Seed {
        fn validate_publication_borrow(&self, _: &Intent) -> WalResult<()> {
            Ok(())
        }
    }
    #[test]
    fn rollback_refuses_pending_or_corrupt_wal_and_accepts_terminal_records() {
        use std::os::unix::fs::PermissionsExt;
        let root = std::env::temp_dir().join(format!(
            "fgos-git-gate-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&root).unwrap();
        std::fs::set_permissions(&root, std::fs::Permissions::from_mode(0o700)).unwrap();
        assert!(check_wal(&root, false).is_ok());
        let wal = Wal::with_filesystem(&root, OsFileSystem).unwrap();
        let intent = Intent {
            kind: OperationKind::PublicationCas,
            request_digest: "1".repeat(64),
            repo_identity: wal.repository_identity().into(),
            resource_set: vec!["refs/fgos/events/test".into()],
            authority_binding: "seal".into(),
            writer_identity: "test".into(),
            object_format: fgos_git::ObjectFormat::Sha1,
            expected: Tip::Absent,
            next: Tip::Oid("1".repeat(40)),
        };
        let chain = match wal.begin("pending", intent, &Seed).unwrap() {
            Begin::Created(c) => c,
            _ => panic!(),
        };
        assert!(check_wal(&root, false)
            .unwrap_err()
            .to_string()
            .starts_with("git-wal-pending"));
        assert!(check_wal(&root, true).is_ok());
        wal.append(
            &chain,
            Phase::Outcome(fgos_git::wal::Outcome::AbandonedBeforeAttempt),
        )
        .unwrap();
        assert!(check_wal(&root, false).is_ok());
        let operation = root.join("fgos/git/operations/pending");
        let first = std::fs::read_dir(operation)
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path();
        std::fs::write(first, "corrupt").unwrap();
        assert!(check_wal(&root, true)
            .unwrap_err()
            .to_string()
            .starts_with("git-wal-unreadable"));
        std::fs::remove_dir_all(root).unwrap();
    }
}
