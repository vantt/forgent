//! One repair door for native index artifacts. Unknown evidence never authorizes a move.
use crate::{
    refs::{failure, recovery},
    wal::{self, Phase, Wal},
    *,
};
use fgos_holder_lock::BorrowedHandle;
use fgos_process::{facts, ProcId};
use serde::{Deserialize, Serialize};
#[cfg(unix)]
use std::{fs::OpenOptions, io::{Read, Seek}};
use std::{
    fs::{self, File},
    path::Path,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NativeLockArtifact {
    pub path: String,
    pub host: String,
    pub boot_id: Option<String>,
    pub pid_ns: String,
    pub pid: u32,
    pub start_time: String,
    pub device: u64,
    pub inode: u64,
    pub state: String,
}
impl NativeLockArtifact {
    pub(crate) fn valid(&self) -> bool {
        Path::new(&self.path).is_absolute()
            && !self.host.is_empty()
            && !self.pid_ns.is_empty()
            && self.pid > 0
            && !self.start_time.is_empty()
            && self.state.len() == 64
            && self
                .state
                .bytes()
                .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    }
    fn owner(&self) -> facts::Record {
        facts::Record {
            host: Some(self.host.clone()),
            boot_id: self.boot_id.clone(),
            pid_ns: Some(self.pid_ns.clone()),
            pid: Some(ProcId(self.pid)),
            start_time: Some(self.start_time.clone()),
            anchor: None,
        }
    }
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeLockReport {
    pub operation_id: String,
    pub status: String,
    pub path: String,
    pub quarantine_path: Option<String>,
    pub inspection: String,
    pub observed_device: Option<u64>,
    pub observed_inode: Option<u64>,
    pub observed_state: Option<String>,
}
pub(crate) const UNOWNED_INDEX_LOCK: &str = "native-index-lock-unowned: inspect with repairNativeIndexLock; follow Git spec §11 retained index.lock runbook";

pub(crate) const INDEX_LOCK_RUNBOOK: &str = r#"1. Confirm no process uses the index: the report lists visible holders; additionally
   `fuser -v <git-dir>/index.lock` or `ls -l /proc/*/fd 2>/dev/null | grep index.lock`.
   If any live Git/IDE process holds it, stop; wait or close that tool. Keep the fgOS hold
   (main 50 / worktree custody 30) so no fgOS writer starts meanwhile.
2. Resolve the real path: `git rev-parse --path-format=absolute --git-path index.lock`.
3. Move, never delete: `mv <that path> <git-dir>/fgos/git/native-lock-quarantine/manual-<UTC ts>/`
   (or an operator directory outside the gitdir). Record the move in the operation's evidence.
4. Re-run observe-only recovery for the operation id named in the refusal
   (`fgos ... recover <operationId>`), inspect the recorded effect, then start a fresh
   operation id. Never repeat the old attempt.
5. If the content of the moved file matters (it is Git's partially written next index), keep
   it until the operation is acknowledged; `index.lock` bytes are never needed to rebuild a
   worktree whose real `index` and `HEAD` are intact."#;

fn inspect_file(path: &Path) -> String {
    let mut text = String::from("native-index-lock-unowned; unknown external lock; preserved. Visible holders are a best-effort snapshot, not proof of abandonment.\n");
    match fs::symlink_metadata(path) {
        Ok(m) => {
            let modified = m.modified().ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok());
            let age = m.modified().ok().and_then(|t| t.elapsed().ok());
            text.push_str(&format!("size={} bytes; mtimeUnix={modified:?}; age={age:?}\n", m.len()));
            #[cfg(unix)]
            {
                use std::os::unix::fs::MetadataExt;
                match facts::file_users(m.dev(), m.ino()) {
                    Some(users) => {
                        text.push_str(&format!("visible holders={} (hidden/unreadable processes omitted)\n", users.len()));
                        for user in users {
                            text.push_str(&format!("pid={} exe={:?} startTime={}\n", user.identity.pid.0, user.exe, user.identity.start_time));
                        }
                    }
                    None => text.push_str("visible holders unavailable on this platform\n"),
                }
            }
        }
        Err(e) => text.push_str(&format!("metadata unavailable: {e}\n")),
    }
    // The optional Git pid sidecar is diagnostic text only. Reuse the bounded,
    // no-follow regular-file read door, so a foreign FIFO/symlink cannot hang us.
    #[cfg(unix)]
    {
        let sidecar = path.with_file_name("index~pid.lock");
        if let Ok((mut file, _, _, _)) = state(&sidecar) {
            let mut bytes = Vec::new();
            if file.rewind().is_ok() && file.by_ref().take(4096).read_to_end(&mut bytes).is_ok() {
                text.push_str(&format!("index~pid.lock (diagnostic only; first 4096 bytes): {:?}\n", String::from_utf8_lossy(&bytes)));
            }
        }
    }
    text.push_str(INDEX_LOCK_RUNBOOK);
    text
}

fn state(path: &Path) -> Result<(File, u64, u64, String)> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::{MetadataExt, OpenOptionsExt};
        let mut file = OpenOptions::new()
            .read(true)
            .custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK)
            .open(path)
            .map_err(failure)?;
        let m = file.metadata().map_err(failure)?;
        if !m.is_file() || m.len() > 16 * 1024 * 1024 {
            return Err(recovery(
                "native-lock-inspected-repair-required: unsupported artifact",
            ));
        }
        let mut bytes = Vec::new();
        file.by_ref()
            .take(16 * 1024 * 1024 + 1)
            .read_to_end(&mut bytes)
            .map_err(failure)?;
        if bytes.len() > 16 * 1024 * 1024 {
            return Err(recovery(
                "native-lock-inspected-repair-required: oversized artifact",
            ));
        }
        let digest = wal::canonical_digest(&(
            m.mode(),
            m.len(),
            m.mtime(),
            m.mtime_nsec(),
            m.ctime(),
            m.ctime_nsec(),
            bytes,
        ))
        .map_err(failure)?;
        Ok((file, m.dev(), m.ino(), digest))
    }
    #[cfg(not(unix))]
    {
        let _ = path;
        Err(recovery("native-lock-identity-unavailable"))
    }
}
impl GitDriver {
    /// Test fixture recorder; production index residue is inspection-only.
    /// This exercises the shared quarantine path, not spawn-time attribution. Never expose artifact adoption as a public API.
    /// Record an artifact already established as operation-owned by its producer.
    /// The producer must retain its exact creation descriptor shared with the child;
    /// merely discovering a pathname is never ownership. Not exposed to Node callers.
    #[cfg(test)]
    pub(crate) fn record_owned_index_lock(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        id: &str,
        child: &facts::ProcTuple,
        owned_file: &File,
    ) -> Result<()> {
        let scope = crate::scoped_commit::scope(repo, held)?;
        scope.validate().map_err(failure)?;
        let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(failure)?;
        let chain = wal.inspect(id).map_err(failure)?;
        self.index_lock_operation(repo, &chain)?;
        if facts::judge_here(&child.to_record()) != facts::Verdict::Alive {
            return Err(recovery("native-lock-owner-not-live-at-record"));
        }
        let path = repo.git_dir().join("index.lock");
        let artifact = NativeLockArtifact::capture(&path, child, owned_file)?;
        if let Some(recorded) = chain.records().iter().find_map(|r| match &r.phase {
            Phase::NativeLockOwned(a) => Some(a),
            _ => None,
        }) {
            return if recorded == &artifact {
                Ok(())
            } else {
                Err(recovery("native-lock-evidence-already-recorded"))
            };
        }
        wal.append(&chain, Phase::NativeLockOwned(artifact))
            .map_err(failure)?;
        Ok(())
    }
    fn index_lock_operation(&self, repo: &RepoHandle, chain: &wal::Chain) -> Result<()> {
        let root = crate::scoped_commit::root(repo)?.to_string_lossy();
        let valid = match &chain.intent().kind {
            wal::OperationKind::ScopedCommit(c) => c.worktree == root,
            wal::OperationKind::Sync(c) => c.worktree == root,
            wal::OperationKind::Restore(c) => c.worktree == root,
            wal::OperationKind::Land(_) => {
                repo.work_tree.as_deref() == Some(repo.trusted_main_root())
            }
            _ => false,
        };
        if !valid {
            return Err(recovery("native-lock-operation-resource-mismatch"));
        }
        Ok(())
    }
    pub fn repair_native_index_lock(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        id: &str,
    ) -> Result<NativeLockReport> {
        self.repair_native_index_lock_with_filesystem(repo, held, id, &wal::OsFileSystem)
    }
    pub fn repair_native_index_lock_with_filesystem<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        id: &str,
        filesystem: &F,
    ) -> Result<NativeLockReport> {
        let scope = crate::scoped_commit::scope(repo, held)?;
        let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(failure)?;
        let chain = wal.inspect(id).map_err(failure)?;
        self.index_lock_operation(repo, &chain)?;
        let path = repo.git_dir().join("index.lock");
        let owned = chain.records().iter().rev().find_map(|r| match &r.phase {
            Phase::NativeLockOwned(a) if Path::new(&a.path) == path => Some(a),
            _ => None,
        });
        quarantine_owned_artifact(repo, id, &path, owned, filesystem, || {
            scope.validate().map_err(failure)?;
            fgos_holder_lock::validate_quiescent(crate::scoped_commit::handle(&scope, repo)?)
                .map_err(failure)
        })
    }
}
pub(crate) fn quarantine_owned_artifact<F: wal::FileSystem>(
    repo: &RepoHandle,
    id: &str,
    path: &Path,
    owned: Option<&NativeLockArtifact>,
    filesystem: &F,
    validate: impl Fn() -> Result<()>,
) -> Result<NativeLockReport> {
    let mut report = NativeLockReport {
        operation_id: id.into(),
        status: "inspectedRepairRequired".into(),
        path: path.to_string_lossy().into(),
        quarantine_path: None,
        observed_device: None,
        observed_inode: None,
        observed_state: None,
        inspection: "artifact preserved pending ownership checks".into(),
    };
    match fs::symlink_metadata(path) {
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            report.status = "absent".into();
            report.inspection = "no native lock artifact".into();
            return Ok(report);
        }
        Err(e) => {
            report.inspection = inspect_file(path);
            report.inspection.push_str(&format!("\nartifact inspection unavailable; preserved: {e}"));
            return Ok(report);
        }
        Ok(_) => (),
    }
    if let Ok((_file, device, inode, digest)) = state(path) {
        report.observed_device = Some(device);
        report.observed_inode = Some(inode);
        report.observed_state = Some(digest);
    }
    let Some(owned) = owned else {
        report.inspection = inspect_file(path);
        return Ok(report);
    };
    if owned.path != report.path {
        return Err(recovery("native-lock-evidence-path-mismatch"));
    }
    if facts::judge_here(&owned.owner()) != facts::Verdict::Dead {
        report.status = "ownerLiveOrUnknown".into();
        report.inspection =
            "recorded child is live or its death cannot be proven; preserved".into();
        return Ok(report);
    }
    let directory = repo.common_dir().join("fgos/git/native-lock-quarantine");
    let destination = directory.join(format!("{id}-{}-{}", owned.device, owned.inode));
    let quarantined = destination.join(path.file_name().ok_or_else(|| failure("native-lock-basename-missing"))?);
    // The synced marker's name records the exact guard inode before exchange.
    // Only that empty directory can be removed when resuming an interrupted move.
    if fs::symlink_metadata(&destination).is_ok_and(|m| m.is_dir()) {
        for entry in fs::read_dir(&destination).map_err(failure)? {
            let entry = entry.map_err(failure)?;
            let name = entry.file_name();
            let Some((device, inode)) = name.to_str().and_then(|n| n.strip_prefix("guard-"))
                .and_then(|n| n.split_once('-'))
                .and_then(|(d, i)| Some((d.parse::<u64>().ok()?, i.parse::<u64>().ok()?))) else { continue; };
            let metadata = fs::symlink_metadata(entry.path()).map_err(failure)?;
            if !metadata.is_file() || metadata.len() != 0 { continue; }
            let guard_key = (device, inode);
            let empty_guard = |p: &Path| -> bool {
                fs::symlink_metadata(p).is_ok_and(|m| m.is_dir() && !m.file_type().is_symlink())
                    && File::open(p).and_then(|f| facts::file_key(&f)).ok() == Some(guard_key)
                    && fs::read_dir(p).is_ok_and(|mut entries| entries.next().is_none())
            };
            if empty_guard(path) {
                // Exchange changes ctime, which participates in the pre-move state hash.
                // Resume by the same moved inode, as the normal post-move check does.
                let (_, d, i, _) = state(&quarantined)?;
                if (d, i) != (owned.device, owned.inode) {
                    return Err(recovery("native-lock-quarantine-evidence-changed"));
                }
                validate()?;
                // Recheck just before removing; remove_dir never removes bytes.
                if !empty_guard(path) { return Err(recovery("native-lock-guard-changed")); }
                fs::remove_dir(path).map_err(failure)?;
                File::open(path.parent().unwrap()).and_then(|f| f.sync_all()).map_err(failure)?;
                report.status = "quarantined".into();
                report.quarantine_path = Some(quarantined.to_string_lossy().into());
                report.inspection = "completed interrupted exchange; exact recorded empty guard removed".into();
                return Ok(report);
            }
            // A stop after recording the guard but before exchange is retryable too.
            if empty_guard(&quarantined) {
                let (_, d, i, digest) = state(path)?;
                if (d, i, &digest) == (owned.device, owned.inode, &owned.state) {
                    validate()?;
                    fs::remove_dir(&quarantined).map_err(failure)?;
                    fs::remove_file(entry.path()).map_err(failure)?;
                    File::open(&destination).and_then(|f| f.sync_all()).map_err(failure)?;
                }
            }
        }
    }
    let (_file, dev, ino, digest) = match state(path) {
        Ok(s) => s,
        Err(e) => {
            report.inspection = format!(
                "recorded artifact cannot be inspected; preserved: {}",
                e.cause
            );
            return Ok(report);
        }
    };
    if (dev, ino, &digest) != (owned.device, owned.inode, &owned.state) {
        report.inspection = "recorded inode/state differs; preserved".into();
        return Ok(report);
    }
    let mut builder = fs::DirBuilder::new();
    builder.recursive(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        builder.mode(0o700);
    }
    builder.create(&directory).map_err(failure)?;
    // A private newly-created directory reserves a non-overwriting destination.
    let destination = directory.join(format!("{id}-{}-{}", owned.device, owned.inode));
    if let Err(e) = builder.recursive(false).create(&destination) {
        if e.kind() != std::io::ErrorKind::AlreadyExists
            || !fs::symlink_metadata(&destination)
                .map_err(failure)?
                .is_dir()
            || fs::read_dir(&destination)
                .map_err(failure)?
                .next()
                .is_some()
        {
            return Err(recovery("native-lock-quarantine-destination-preserved"));
        }
    }
    let quarantined = destination.join(
        path.file_name()
            .ok_or_else(|| failure("native-lock-basename-missing"))?,
    );
    filesystem
        .checkpoint("native-lock-before-move")
        .map_err(failure)?;
    match fs::symlink_metadata(&quarantined) {
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
        _ => return Err(recovery("native-lock-quarantine-destination-preserved")),
    }
    validate()?;
    let (_again, dev, ino, digest) = match state(path) {
        Ok(s) => s,
        Err(e) => {
            report.inspection = format!(
                "artifact changed immediately before move; preserved: {}",
                e.cause
            );
            return Ok(report);
        }
    };
    if (dev, ino, &digest) != (owned.device, owned.inode, &owned.state)
        || facts::judge_here(&owned.owner()) != facts::Verdict::Dead
    {
        fs::remove_dir(&destination).map_err(failure)?;
        report.inspection =
            "inode/state or owner changed immediately before move; preserved".into();
        return Ok(report);
    }
    filesystem.checkpoint("native-lock-rechecked").map_err(failure)?;
    // As with holder-lock's activation tombstone, exchange with a directory
    // guard: ordinary Git cannot create a foreign index.lock in the gap.
    #[cfg(target_os = "linux")]
    let guard = {
        use std::os::unix::ffi::OsStrExt;
        fs::create_dir(&quarantined).map_err(failure)?;
        let guard = File::open(&quarantined).map_err(failure)?;
        let (device, inode) = facts::file_key(&guard).map_err(failure)?;
        let marker = destination.join(format!("guard-{device}-{inode}"));
        fs::OpenOptions::new().write(true).create_new(true).open(&marker)
            .and_then(|f| f.sync_all()).map_err(failure)?;
        File::open(&destination).and_then(|f| f.sync_all()).map_err(failure)?;
        File::open(&directory).and_then(|f| f.sync_all()).map_err(failure)?;
        filesystem.checkpoint("native-lock-guard-recorded").map_err(failure)?;
        let old = std::ffi::CString::new(path.as_os_str().as_bytes()).map_err(failure)?;
        let new = std::ffi::CString::new(quarantined.as_os_str().as_bytes()).map_err(failure)?;
        let result = unsafe { libc::renameat2(libc::AT_FDCWD, old.as_ptr(), libc::AT_FDCWD, new.as_ptr(), libc::RENAME_EXCHANGE) };
        if result == 0 { Some(guard) } else {
            let e = std::io::Error::last_os_error();
            fs::remove_dir(&quarantined).map_err(failure)?;
            fs::remove_file(&marker).map_err(failure)?;
            if !matches!(e.raw_os_error(), Some(libc::ENOSYS | libc::EINVAL | libc::EOPNOTSUPP)) { return Err(failure(e)); }
            fs::rename(path, &quarantined).map_err(failure)?;
            None
        }
    };
    #[cfg(not(target_os = "linux"))]
    let guard: Option<File> = { fs::rename(path, &quarantined).map_err(failure)?; None };
    File::open(path.parent().ok_or_else(|| failure("native-lock-parent-missing"))?)
        .and_then(|f| f.sync_all()).map_err(failure)?;
    File::open(&destination).and_then(|f| f.sync_all()).map_err(failure)?;
    File::open(&directory).and_then(|f| f.sync_all()).map_err(failure)?;
    filesystem.checkpoint("native-lock-after-move").map_err(failure)?;
    // The pathname may have been replaced after the final observation. Never
    // report a substituted inode as repaired, and restore it without overwrite.
    let moved = File::open(&quarantined).map_err(failure)?;
    if facts::file_key(&moved).map_err(failure)? != (owned.device, owned.inode) {
        #[cfg(target_os = "linux")]
        if let Some(guard) = &guard {
            use std::os::unix::ffi::OsStrExt;
            if File::open(path).and_then(|f| facts::file_key(&f)).ok() == Some(facts::file_key(guard).map_err(failure)?) {
                let old = std::ffi::CString::new(path.as_os_str().as_bytes()).map_err(failure)?;
                let new = std::ffi::CString::new(quarantined.as_os_str().as_bytes()).map_err(failure)?;
                if unsafe { libc::renameat2(libc::AT_FDCWD, old.as_ptr(), libc::AT_FDCWD, new.as_ptr(), libc::RENAME_EXCHANGE) } == 0 {
                    fs::remove_dir(&quarantined).map_err(failure)?;
                    File::open(path.parent().unwrap()).and_then(|f| f.sync_all()).map_err(failure)?;
                    File::open(&destination).and_then(|f| f.sync_all()).map_err(failure)?;
                    report.inspection = "substituted inode restored without overwrite by atomic exchange; inspect again".into();
                    return Ok(report);
                }
            }
            report.quarantine_path = Some(quarantined.to_string_lossy().into());
            report.inspection = "substituted inode retained in quarantine; guard changed or exchange failed".into();
            return Ok(report);
        }
        match fs::hard_link(&quarantined, path) {
            Ok(()) => {
                fs::remove_file(&quarantined).map_err(failure)?;
                report.inspection = "substituted inode restored without overwrite; inspect again".into();
            }
            Err(e) => {
                report.quarantine_path = Some(quarantined.to_string_lossy().into());
                report.inspection = format!("substituted inode retained in quarantine; original path preserved: {e}");
            }
        }
        File::open(path.parent().ok_or_else(|| failure("native-lock-parent-missing"))?)
            .and_then(|f| f.sync_all()).map_err(failure)?;
        File::open(&destination).and_then(|f| f.sync_all()).map_err(failure)?;
        return Ok(report);
    }
    if let Some(guard) = &guard {
        if File::open(path).and_then(|f| facts::file_key(&f)).ok() != Some(facts::file_key(guard).map_err(failure)?) {
            report.quarantine_path = Some(quarantined.to_string_lossy().into());
            report.inspection = "owned artifact quarantined; native path guard changed, preserved".into();
            return Ok(report);
        }
        fs::remove_dir(path).map_err(failure)?;
    }
    File::open(&quarantined)
        .and_then(|f| f.sync_all())
        .map_err(failure)?;
    File::open(&destination)
        .and_then(|f| f.sync_all())
        .map_err(failure)?;
    File::open(&directory)
        .and_then(|f| f.sync_all())
        .map_err(failure)?;
    File::open(
        path.parent()
            .ok_or_else(|| failure("native-lock-parent-missing"))?,
    )
    .and_then(|f| f.sync_all())
    .map_err(failure)?;
    report.status = "quarantined".into();
    report.quarantine_path = Some(quarantined.to_string_lossy().into());
    report.inspection =
        "exact owned dead-child inode and state quarantined; retry operation recovery".into();
    Ok(report)
}

impl NativeLockArtifact {
    pub(crate) fn capture(path: &Path, owner: &facts::ProcTuple, file: &File) -> Result<Self> {
        let (_open, device, inode, digest) = state(path)?;
        if facts::file_key(file).map_err(failure)? != (device, inode) {
            return Err(recovery("native-lock-owned-descriptor-mismatch"));
        }
        Ok(Self {
            path: path.to_string_lossy().into(),
            host: owner.host.clone(),
            boot_id: owner.boot_id.clone(),
            pid_ns: owner.pid_ns.clone(),
            pid: owner.pid.0,
            start_time: owner.start_time.clone(),
            device,
            inode,
            state: digest,
        })
    }
}

#[cfg(all(test, unix))]
mod tests {
    use crate as fgos_git;
    use super::INDEX_LOCK_RUNBOOK;
    use std::fs::File;
    include!("../tests/support/land.rs");
    use fgos_git::wal::{FileSystem, Outcome, Wal};
    use std::io;
    use std::process::Stdio;

    struct StopAtIntent;
    impl FileSystem for StopAtIntent {
        fn checkpoint(&self, step: &'static str) -> io::Result<()> {
            if step == "record-install" {
                return Err(io::Error::other("lost coordinator"));
            }
            Ok(())
        }
    }
    fn pending(f: &Fixture) {
        let req = RestoreRequest {
            expected_head: f.request.target.clone(),
            target: f.request.source.clone(),
            reason: "repair test".into(),
            reapply_local_delta: false,
            allowed_replacements: vec![],
            checkout_baseline: None,
            discard_local_delta: false,
            require_clean_baseline: false,
            require_staged_only: false,
            confirmed_by: None,
        };
        f.driver
            .apply_restore_with_filesystem(
                &f.repo,
                vec![],
                &req,
                "fixture",
                "interrupted",
                &StopAtIntent,
            )
            .unwrap_err();
        assert!(Wal::open(&f.repo)
            .unwrap()
            .inspect("interrupted")
            .unwrap()
            .outcome()
            .is_none());
        let _ = evidence as fn(&LandSession) -> LandEvidence;
    }
    fn owned(f: &Fixture) -> (std::process::Child, fs::File) {
        let path = f.main.join(".git/index.lock");
        let mut file = fs::OpenOptions::new()
            .read(true)
            .write(true)
            .create_new(true)
            .open(&path)
            .unwrap();
        use io::Write;
        file.write_all(b"retained native lock bytes\0\xff").unwrap();
        file.sync_all().unwrap();
        // The operation creates the artifact exclusively and passes the exact fd to its child.
        let child = Command::new("sleep")
            .arg("60")
            .stdout(Stdio::from(file.try_clone().unwrap()))
            .spawn()
            .unwrap();
        let identity = fgos_process::facts::identity_of(fgos_process::ProcId(child.id())).unwrap();
        f.driver
            .record_owned_index_lock(&f.repo, vec![], "interrupted", &identity, &file)
            .unwrap();
        (child, file)
    }
    #[test]
    fn live_child_preserved_then_dead_exact_artifact_quarantined_and_recovery_proceeds() {
        let f = Fixture::new();
        pending(&f);
        let (mut child, _fd) = owned(&f);
        let report = f
            .driver
            .repair_native_index_lock(&f.repo, vec![], "interrupted")
            .unwrap();
        assert_eq!(report.status, "ownerLiveOrUnknown");
        assert!(f
            .driver
            .recover_restore(&f.repo, vec![], "fixture", "interrupted")
            .unwrap_err()
            .cause
            .contains("repairNativeIndexLock"));
        child.kill().unwrap();
        child.wait().unwrap();
        let report = f
            .driver
            .repair_native_index_lock(&f.repo, vec![], "interrupted")
            .unwrap();
        assert_eq!(report.status, "quarantined");
        assert_eq!(
            fs::read(report.quarantine_path.unwrap()).unwrap(),
            b"retained native lock bytes\0\xff"
        );
        assert_eq!(
            f.driver
                .recover_restore(&f.repo, vec![], "fixture", "interrupted")
                .unwrap()
                .outcome,
            Outcome::AbandonedBeforeAttempt
        );
        assert_eq!(
            f.driver
                .repair_native_index_lock(&f.repo, vec![], "interrupted")
                .unwrap()
                .status,
            "absent"
        );
    }
    #[test]
    fn unknown_external_lock_has_inspection_report_and_is_never_moved() {
        let f = Fixture::new();
        pending(&f);
        let path = f.main.join(".git/index.lock");
        fs::write(&path, b"external").unwrap();
        let _open_external = File::open(&path).unwrap();
        fs::write(path.with_file_name("index~pid.lock"), b"pid 1234\n").unwrap();
        let report = f
            .driver
            .repair_native_index_lock(&f.repo, vec![], "interrupted")
            .unwrap();
        assert_eq!(report.status, "inspectedRepairRequired");
        assert!(report.inspection.contains("unknown external"));
        assert!(report.inspection.contains("size=8 bytes"));
        assert!(report.inspection.contains("mtimeUnix="));
        assert!(report.inspection.contains("age="));
        assert!(report.inspection.contains("pid 1234"));
        assert!(report.inspection.contains(INDEX_LOCK_RUNBOOK));
        #[cfg(target_os = "linux")]
        {
            assert!(report.inspection.contains(&format!("pid={} exe=", std::process::id())));
            assert!(report.inspection.contains("startTime="));
        }
        assert_eq!(fs::read(path).unwrap(), b"external");
        assert!(f
            .driver
            .recover_restore(&f.repo, vec![], "fixture", "interrupted")
            .is_err());
    }
    struct Swap(PathBuf);
    impl FileSystem for Swap {
        fn checkpoint(&self, step: &'static str) -> io::Result<()> {
            if step == "native-lock-before-move" {
                fs::rename(&self.0, self.0.with_extension("original"))?;
                fs::write(&self.0, b"substituted inode")?;
            }
            Ok(())
        }
    }
    #[test]
    fn immediate_inode_swap_refuses_and_preserves_both_files() {
        let f = Fixture::new();
        pending(&f);
        let (mut child, _fd) = owned(&f);
        child.kill().unwrap();
        child.wait().unwrap();
        let path = f.main.join(".git/index.lock");
        let report = f
            .driver
            .repair_native_index_lock_with_filesystem(
                &f.repo,
                vec![],
                "interrupted",
                &Swap(path.clone()),
            )
            .unwrap();
        assert_eq!(report.status, "inspectedRepairRequired");
        assert!(report.inspection.contains("immediately before move"));
        assert_eq!(fs::read(&path).unwrap(), b"substituted inode");
        assert_eq!(
            fs::read(path.with_extension("original")).unwrap(),
            b"retained native lock bytes\0\xff"
        );
    }
    #[test]
    fn changed_contents_on_same_inode_are_preserved() {
        let f = Fixture::new();
        pending(&f);
        let (mut child, _fd) = owned(&f);
        child.kill().unwrap();
        child.wait().unwrap();
        let path = f.main.join(".git/index.lock");
        fs::write(&path, b"different state").unwrap();
        assert_eq!(
            f.driver
                .repair_native_index_lock(&f.repo, vec![], "interrupted")
                .unwrap()
                .status,
            "inspectedRepairRequired"
        );
        assert_eq!(fs::read(path).unwrap(), b"different state");
    }

    struct InterruptBeforeMove;
    impl FileSystem for InterruptBeforeMove {
        fn checkpoint(&self, step: &'static str) -> io::Result<()> {
            if step == "native-lock-before-move" {
                return Err(io::Error::other("lost repairer"));
            }
            Ok(())
        }
    }
    #[test]
    fn repair_retries_after_destination_reservation_without_overwriting_evidence() {
        let f = Fixture::new();
        pending(&f);
        let (mut child, _fd) = owned(&f);
        child.kill().unwrap();
        child.wait().unwrap();
        assert!(f
            .driver
            .repair_native_index_lock_with_filesystem(
                &f.repo,
                vec![],
                "interrupted",
                &InterruptBeforeMove
            )
            .is_err());
        let report = f
            .driver
            .repair_native_index_lock(&f.repo, vec![], "interrupted")
            .unwrap();
        assert_eq!(report.status, "quarantined");
        assert_eq!(
            fs::read(report.quarantine_path.unwrap()).unwrap(),
            b"retained native lock bytes\0\xff"
        );
    }

    struct InterruptExchange(&'static str);
    impl FileSystem for InterruptExchange {
        fn checkpoint(&self, step: &'static str) -> io::Result<()> {
            if step == self.0 { return Err(io::Error::other("interrupted exchange")); }
            Ok(())
        }
    }
    #[test]
    #[cfg(target_os = "linux")]
    fn recorded_exchange_guard_recovers_before_and_after_move() {
        for step in ["native-lock-guard-recorded", "native-lock-after-move"] {
            let f = Fixture::new();
            pending(&f);
            let (mut child, _fd) = owned(&f);
            child.kill().unwrap(); child.wait().unwrap();
            let error = f.driver.repair_native_index_lock_with_filesystem(
                &f.repo, vec![], "interrupted", &InterruptExchange(step),
            ).unwrap_err();
            assert!(error.cause.contains("interrupted exchange"));
            let report = f.driver.repair_native_index_lock(&f.repo, vec![], "interrupted").unwrap();
            assert_eq!(report.status, "quarantined");
            assert!(!f.main.join(".git/index.lock").exists());
            assert_eq!(fs::read(report.quarantine_path.unwrap()).unwrap(), b"retained native lock bytes\0\xff");
        }
    }
    #[test]
    #[cfg(target_os = "linux")]
    fn interrupted_exchange_preserves_replaced_or_nonempty_guard() {
        for replace in [false, true] {
            let f = Fixture::new();
            pending(&f);
            let (mut child, _fd) = owned(&f);
            child.kill().unwrap(); child.wait().unwrap();
            f.driver.repair_native_index_lock_with_filesystem(
                &f.repo, vec![], "interrupted", &InterruptExchange("native-lock-after-move"),
            ).unwrap_err();
            let path = f.main.join(".git/index.lock");
            if replace {
                fs::rename(&path, path.with_extension("held-guard")).unwrap();
                fs::create_dir(&path).unwrap();
            } else { fs::write(path.join("foreign"), "preserve").unwrap(); }
            let report = f.driver.repair_native_index_lock(&f.repo, vec![], "interrupted").unwrap();
            assert_eq!(report.status, "inspectedRepairRequired");
            assert!(path.is_dir());
            if !replace { assert_eq!(fs::read(path.join("foreign")).unwrap(), b"preserve"); }
        }
    }
    struct OccupyQuarantine(PathBuf);
    impl FileSystem for OccupyQuarantine {
        fn checkpoint(&self, step: &'static str) -> io::Result<()> {
            if step == "native-lock-before-move" {
                let destination = fs::read_dir(&self.0)?.next().unwrap()?.path();
                fs::write(
                    destination.join("index.lock"),
                    b"foreign quarantine evidence",
                )?;
            }
            Ok(())
        }
    }
    #[test]
    fn a_concurrent_quarantine_destination_is_preserved_without_moving_the_source() {
        let f = Fixture::new();
        pending(&f);
        let (mut child, _fd) = owned(&f);
        child.kill().unwrap();
        child.wait().unwrap();
        let directory = f.main.join(".git/fgos/git/native-lock-quarantine");
        let err = f
            .driver
            .repair_native_index_lock_with_filesystem(
                &f.repo,
                vec![],
                "interrupted",
                &OccupyQuarantine(directory.clone()),
            )
            .unwrap_err();
        assert!(err.cause.contains("destination-preserved"));
        assert_eq!(
            fs::read(f.main.join(".git/index.lock")).unwrap(),
            b"retained native lock bytes\0\xff"
        );
        let destination = fs::read_dir(directory)
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path();
        assert_eq!(
            fs::read(destination.join("index.lock")).unwrap(),
            b"foreign quarantine evidence"
        );
    }

    struct LateSwap(PathBuf);
    impl FileSystem for LateSwap {
        fn checkpoint(&self, step: &'static str) -> io::Result<()> {
            if step == "native-lock-rechecked" {
                fs::rename(&self.0, self.0.with_extension("original"))?;
                fs::write(&self.0, b"foreign replacement")?;
            }
            #[cfg(target_os = "linux")]
            if step == "native-lock-after-move" {
                assert!(self.0.is_dir(), "exchange must retain a native-path guard");
                assert!(fs::OpenOptions::new().write(true).create_new(true).open(&self.0).is_err());
            }
            Ok(())
        }
    }
    #[test]
    fn swap_after_final_recheck_restores_foreign_inode_without_overwrite() {
        let f = Fixture::new();
        pending(&f);
        let (mut child, _fd) = owned(&f);
        child.kill().unwrap();
        child.wait().unwrap();
        let path = f.main.join(".git/index.lock");
        let report = f.driver.repair_native_index_lock_with_filesystem(
            &f.repo, vec![], "interrupted", &LateSwap(path.clone()),
        ).unwrap();
        assert_eq!(report.status, "inspectedRepairRequired");
        assert!(report.inspection.contains("restored without overwrite"));
        assert_eq!(fs::read(&path).unwrap(), b"foreign replacement");
        assert_eq!(fs::read(path.with_extension("original")).unwrap(), b"retained native lock bytes\0\xff");
    }

}
