//! Git C5 admission owned by the activation controller, never a candidate.
use crate::init::{ActivationLockGuard, InitError};
use crate::manifest::ReleaseManifest;
use fgos_git::wal::{OsFileSystem, Wal};
use fgos_git::GitDriver;
use std::path::{Path, PathBuf};

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

/// Every worktree the workspace's repository registers, read through the Git
/// component's Inspect listing; empty outside a repository. Only a direct
/// `.git` directory makes the workspace a repository here, so an enclosing
/// repository never widens the scan. A refused listing fails closed: an
/// incomplete enumeration can never authorize activation.
fn linked_worktrees(workspace: &Path) -> Result<Vec<PathBuf>, InitError> {
    if !workspace.join(".git").is_dir() {
        return Ok(Vec::new());
    }
    let unlisted = |e: fgos_git::OperationError| {
        refusal(
            "git-predecessor-writer-live",
            format!("linked worktree listing unavailable: {}", e.cause),
        )
    };
    let Some((driver, repo)) = GitDriver::open_at(workspace).map_err(unlisted)? else {
        return Ok(Vec::new());
    };
    let mut dirs = Vec::new();
    let mut cursor = None;
    loop {
        let page = driver
            .list_worktrees(&repo, cursor, 4096)
            .map_err(unlisted)?;
        dirs.extend(
            page.entries
                .into_iter()
                .filter(|row| !row.bare)
                .map(|row| path_from_bytes(row.path)),
        );
        if page.complete {
            return Ok(dirs);
        }
        cursor = page.next_cursor;
    }
}

#[cfg(unix)]
fn path_from_bytes(bytes: Vec<u8>) -> PathBuf {
    use std::os::unix::ffi::OsStringExt;
    PathBuf::from(std::ffi::OsString::from_vec(bytes))
}

#[cfg(not(unix))]
fn path_from_bytes(bytes: Vec<u8>) -> PathBuf {
    PathBuf::from(String::from_utf8_lossy(&bytes).into_owned())
}

fn predecessor_scan(workspace: &Path) -> Result<(), InitError> {
    let mut command = std::process::Command::new(std::env::current_exe()?);
    command
        .args(["internal", "quiesce-scan", "--protocol", "1", "--root"])
        .arg(workspace);
    for dir in linked_worktrees(workspace)? {
        command.arg("--dir").arg(dir);
    }
    let output = command
        .args([
            "--workspace-only",
            "--exclude-pid",
            &std::process::id().to_string(),
        ])
        .output()?;
    validate_predecessor_scan(&output.stdout, output.status.code())
}

/// Whether the command line runs fgOS: `argv[0]` is a fgOS binary, or it is an
/// interpreter (node, bun, deno) whose arguments name a fgOS script. A shell
/// whose `-c` text merely mentions fgos runs neither.
fn runs_fgos(cmdline: &str) -> bool {
    let base = |arg: &str| {
        Path::new(arg)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string()
    };
    let mut words = cmdline.split_whitespace();
    let Some(program) = words.next().map(base) else {
        return false;
    };
    if matches!(program.as_str(), "fgos" | "fgos-runner" | "fgos-gateway") {
        return true;
    }
    let interpreter = matches!(program.as_str(), "bun" | "deno")
        || program.strip_prefix("node").is_some_and(|rest| {
            matches!(rest, "" | "js")
                || rest.starts_with(|c: char| c.is_ascii_digit() || c == '.' || c == '-')
        });
    interpreter
        && words.any(|arg| {
            matches!(
                base(arg).as_str(),
                "fgos" | "fgos-runner" | "fgos-gateway" | "fgos.mjs" | "fgos-runner.mjs"
            )
        })
}

fn validate_predecessor_scan(bytes: &[u8], exit_code: Option<i32>) -> Result<(), InitError> {
    let scan: serde_json::Value =
        serde_json::from_slice(bytes).map_err(|e| refusal("git-predecessor-writer-live", e))?;
    if scan["v"] != 1
        || scan["protocol"] != 1
        || scan["result"] == "unavailable"
        || scan["unreadable"].as_u64() != Some(0)
        || !matches!(exit_code, Some(0 | 10))
    {
        return Err(refusal(
            "git-predecessor-writer-live",
            format!("process scan unavailable or incomplete: {}", scan["detail"]),
        ));
    }
    let processes = scan["processes"]
        .as_array()
        .ok_or_else(|| refusal("git-predecessor-writer-live", "invalid process scan"))?;
    for process in processes {
        let cmdline = process["cmdline"].as_str().unwrap_or("");
        // quiesce-scan also reports ordinary shells in the workspace. Only a
        // process that runs fgOS can be a predecessor writer at this capability
        // split, so judge what it executes, never words in its arguments.
        if !runs_fgos(cmdline) {
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
                format!(
                    "pid {} argv {cmdline:?} lacks proven git-wal-v1",
                    process["pid"]
                ),
            ));
        }
    }
    Ok(())
}

pub(crate) fn admit(
    workspace: &Path,
    _state_root: &Path,
    manifest: &ReleaseManifest,
    lock: &ActivationLockGuard,
) -> Result<(), InitError> {
    crate::verify::require_git_addon(manifest).map_err(|e| refusal("git-addon-missing", e))?;
    if has_wal(manifest) && !cfg!(target_os = "linux") {
        return Err(refusal(
            "git-wal-unsupported-platform",
            "C5/fence support is Linux-only",
        ));
    }
    // C5 needs the journal, not Publication's Git floor, command policy or
    // hooks probe. Activation owns a main checkout; indirect gitdirs require
    // explicit resolution support rather than silently skipping their WAL.
    let common = workspace.join(".git");
    let wal_exists = match std::fs::symlink_metadata(&common) {
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => false,
        Err(e) => return Err(refusal("git-wal-unreadable", e)),
        Ok(meta) => {
            if !meta.is_dir() || meta.file_type().is_symlink() {
                return Err(refusal(
                    "git-wal-unreadable",
                    "activation requires a direct main-checkout git directory",
                ));
            }
            check_wal(&common, has_wal(manifest))?;
            common.join("fgos/git").symlink_metadata().is_ok()
        }
    };
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
    #[test]
    fn predecessor_scan_refuses_unavailable_incomplete_and_names_live_writer() {
        for (body, exit) in [
            (
                serde_json::json!({"v":1,"protocol":1,"result":"unavailable","unreadable":0,"processes":[]}),
                Some(0),
            ),
            (
                serde_json::json!({"v":1,"protocol":1,"result":"ok","unreadable":1,"processes":[]}),
                Some(0),
            ),
            (
                serde_json::json!({"v":1,"protocol":1,"result":"ok","unreadable":0,"processes":[]}),
                Some(2),
            ),
        ] {
            assert!(validate_predecessor_scan(&serde_json::to_vec(&body).unwrap(), exit).is_err());
        }
        let scan = serde_json::json!({"v":1,"protocol":1,"result":"ok","unreadable":0,"processes":[{"pid":424242,"cmdline":"node bin/fgos.mjs"}]});
        let error = validate_predecessor_scan(&serde_json::to_vec(&scan).unwrap(), Some(10))
            .unwrap_err()
            .to_string();
        assert!(error.contains("424242") && error.contains("node bin/fgos.mjs"));
        let shell = serde_json::json!({"v":1,"protocol":1,"result":"ok","unreadable":0,"processes":[{"pid":1,"cmdline":"zsh -c fgos run x; fgctl upgrade"}]});
        validate_predecessor_scan(&serde_json::to_vec(&shell).unwrap(), Some(10)).unwrap();
        let binary = serde_json::json!({"v":1,"protocol":1,"result":"ok","unreadable":0,"processes":[{"pid":2,"cmdline":"/opt/old/bin/fgos run x"}]});
        assert!(
            validate_predecessor_scan(&serde_json::to_vec(&binary).unwrap(), Some(10)).is_err()
        );
        let clean =
            serde_json::json!({"v":1,"protocol":1,"result":"ok","unreadable":0,"processes":[]});
        validate_predecessor_scan(&serde_json::to_vec(&clean).unwrap(), Some(0)).unwrap();
    }
    #[test]
    fn predecessor_scan_reads_the_program_from_the_exact_argv_not_the_joined_text() {
        let scan = |argv: serde_json::Value| {
            let cmdline = argv.as_array().unwrap().iter().map(|a| a.as_str().unwrap()).collect::<Vec<_>>().join(" ");
            serde_json::to_vec(&serde_json::json!({"v":1,"protocol":1,"result":"processes","unreadable":0,"processes":[{"pid":7,"cmdline":cmdline,"argv":argv}]})).unwrap()
        };
        assert!(
            validate_predecessor_scan(&scan(serde_json::json!(["/opt/my dir/fgos", "run"])), Some(10)).is_err(),
            "a fgOS binary under a path with a space is still a writer"
        );
        validate_predecessor_scan(&scan(serde_json::json!(["/usr/bin/zsh", "-c", "fgos run x; fgctl upgrade"])), Some(10)).unwrap();
        assert!(validate_predecessor_scan(&scan(serde_json::json!(["node", "/my dir/bin/fgos.mjs"])), Some(10)).is_err());
    }
    #[test]
    fn non_git_non_wal_admission_needs_no_git_or_state_root() {
        let root =
            std::env::temp_dir().join(format!("fgos-nongit-admission-{}", std::process::id()));
        std::fs::create_dir_all(&root).unwrap();
        let mut manifest: ReleaseManifest = serde_json::from_str(include_str!(
            "../tests/goldens/release-manifest-minimal.json"
        ))
        .unwrap();
        // M10 requires an addon only on linux-x64; this test proves the
        // non-WAL Windows admission remains independent of Git/state roots.
        manifest.target.os = "windows".into();
        let lock = ActivationLockGuard::acquire(&root).unwrap();
        admit(&root, &root.join("missing-state-root"), &manifest, &lock).unwrap();
        std::fs::create_dir(root.join(".git")).unwrap();
        admit(&root, &root.join("missing-state-root"), &manifest, &lock).unwrap();
        assert!(!root.join("missing-state-root").exists());
        drop(lock);
        std::fs::remove_dir_all(root).unwrap();
    }
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

#[cfg(all(test, target_os = "windows"))]
mod windows_tests {
    use super::*;
    #[test]
    fn windows_activation_without_wal_claim_needs_no_linux_scan_or_fence() {
        let root = std::env::temp_dir().join(format!("fgos-windows-no-wal-{}", std::process::id()));
        std::fs::create_dir_all(&root).unwrap();
        let mut manifest: ReleaseManifest = serde_json::from_str(include_str!(
            "../tests/goldens/release-manifest-minimal.json"
        ))
        .unwrap();
        manifest.target.os = "windows".into();
        std::fs::create_dir_all(root.join(".git")).unwrap();
        let lock = ActivationLockGuard::acquire(&root).unwrap();
        admit(&root, &root.join("state"), &manifest, &lock).unwrap();
        manifest.capabilities.push("git-wal-v1".into());
        assert!(admit(&root, &root.join("state"), &manifest, &lock)
            .unwrap_err()
            .to_string()
            .starts_with("git-wal-unsupported-platform"));
        drop(lock);
        std::fs::remove_dir_all(root).unwrap();
    }
}
