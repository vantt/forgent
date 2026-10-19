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
use std::{fs::OpenOptions, io::Read};
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
    /// Record an artifact already established as operation-owned by its producer.
    /// The producer must retain its exact creation descriptor shared with the child;
    /// merely discovering a pathname is never ownership. Not exposed to Node callers.
    pub fn record_owned_index_lock(
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
        inspection:
            "unknown external lock; preserved; inspect ownership before repairNativeIndexLock"
                .into(),
    };
    match fs::symlink_metadata(path) {
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            report.status = "absent".into();
            report.inspection = "no native lock artifact".into();
            return Ok(report);
        }
        Err(e) => {
            report.inspection = format!("artifact inspection unavailable; preserved: {e}");
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
    let directory = repo.common_dir().join("fgos/git/native-lock-quarantine");
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
    // Original WAL ownership remains the provenance after a crash at this rename.
    fs::rename(path, &quarantined).map_err(failure)?;
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
