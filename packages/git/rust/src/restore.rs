//! Snapshot-backed checkout restore. Retained bytes and WAL precede reset.
use crate::{
    refs::{failure, recovery, Authority},
    scoped_commit::{self as checkout, SavedPath},
    wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal},
    *,
};
use fgos_holder_lock::{BorrowedHandle, LockScope};
use serde::{Deserialize, Serialize};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    path::Path,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RestoreRequest {
    pub expected_head: String,
    pub target: String,
    pub reason: String,
    #[serde(default)]
    pub reapply_local_delta: bool,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub allowed_replacements: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checkout_baseline: Option<String>,
    #[serde(default)]
    pub discard_local_delta: bool,
    #[serde(default)]
    pub require_clean_baseline: bool,
    #[serde(default)]
    pub require_staged_only: bool,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RestoreIntent {
    pub worktree: String,
    pub reference: String,
    pub request: RestoreRequest,
    pub snapshot: String,
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RestorePreview {
    pub head: String,
    pub reference: String,
    pub target: String,
    pub status: Vec<u8>,
    pub paths: Vec<String>,
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreResult {
    pub operation_id: String,
    pub snapshot: String,
    pub outcome: Outcome,
    pub warnings: Vec<String>,
}
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Snapshot {
    #[serde(default)]
    operation_id: String,
    paths: BTreeMap<String, SavedPath>,
    index: SavedPath,
    staged_patch: Vec<u8>,
    worktree_patch: Vec<u8>,
    local_paths: Vec<String>,
    mode_changes: Vec<String>,
    #[serde(default)]
    content_changes: Vec<String>,
    #[serde(default)]
    intent_to_add: Vec<String>,
    #[serde(default)]
    clean_modes: BTreeMap<String, u32>,
}
fn safe_path(root: &Path, name: &str) -> Result<()> {
    fgos_scope_literal(name)?;
    for parent in root.join(name).ancestors().skip(1) {
        if fs::symlink_metadata(parent).is_ok_and(|m| m.file_type().is_symlink()) {
            return Err(failure("restore-snapshot-symlink-parent"));
        }
        if parent == root {
            break;
        }
    }
    Ok(())
}
fn capture(path: &Path, remaining: &mut u64) -> Result<SavedPath> {
    let size = match fs::symlink_metadata(path) {
        Ok(m) => m.len(),
        Err(e)
            if matches!(
                e.kind(),
                std::io::ErrorKind::NotFound | std::io::ErrorKind::NotADirectory
            ) =>
        {
            0
        }
        Err(e) => return Err(failure(e)),
    };
    *remaining = remaining.checked_sub(size).ok_or_else(|| {
        failure("restore-snapshot-capacity: 32 MiB; preserve files and reduce checkout size")
    })?;
    SavedPath::capture_bounded(path, size)
}
fn data_path(name: &str) -> bool {
    name != ".fgos" && !name.starts_with(".fgos/")
}
impl GitDriver {
    pub(crate) fn restore_patch_paths(&self, repo: &RepoHandle) -> Result<Vec<std::path::PathBuf>> {
        let HeadFact::Attached { target, .. } = self.resolve_head(repo)? else {
            return Ok(vec![]);
        };
        let prefix = format!(
            "{}-",
            target
                .as_str()
                .trim_start_matches("refs/heads/")
                .replace('/', "-")
        );
        let dir = repo.common_dir().join("fgos-resync-patches");
        match fs::symlink_metadata(&dir) {
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(vec![]),
            Ok(m) if m.is_dir() && !m.file_type().is_symlink() => (),
            _ => return Err(failure("restore-patch-directory-unsafe")),
        }
        let mut paths = vec![];
        for (i, entry) in fs::read_dir(dir).map_err(failure)?.enumerate() {
            if i >= 4096 {
                return Err(failure("restore-patch-list-capacity"));
            }
            let entry = entry.map_err(failure)?;
            let name = entry.file_name();
            if name
                .to_str()
                .is_some_and(|n| n.starts_with(&prefix) && n.ends_with(".patch"))
            {
                paths.push(entry.path());
            }
        }
        paths.sort();
        Ok(paths)
    }
    fn restore_patch_gate(&self, repo: &RepoHandle) -> Result<()> {
        let paths = self.restore_patch_paths(repo)?;
        if paths.is_empty() {
            return Ok(());
        }
        let mut error = failure("restore-orphaned-patch: inspect preserved patches before resync");
        error.detail = Some(Box::new(serde_json::json!({"orphanedPaths":paths})));
        Err(error)
    }
    fn restore_checks(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        request: &RestoreRequest,
    ) -> Result<RestorePreview> {
        if request.reason.trim().is_empty() {
            return Err(failure("restore-reason-required"));
        }
        let target = Oid::parse(&request.target, repo.object_format()).map_err(failure)?;
        let head = Oid::parse(&request.expected_head, repo.object_format()).map_err(failure)?;
        for oid in [&target, &head] {
            if self.checkout_text(repo, scope, &["cat-file", "-t", oid.as_str()])? != "commit" {
                return Err(failure("restore-target-not-commit"));
            }
        }
        if self.checkout_text(repo, scope, &["rev-parse", "HEAD"])? != head.as_str() {
            return Err(failure("restore-head-mismatch"));
        }
        let reference = match self.resolve_head(repo)? {
            HeadFact::Attached { target, .. } => target.as_str().to_owned(),
            HeadFact::Detached { .. } => "HEAD".into(),
            HeadFact::Unborn { .. } => return Err(failure("restore-unborn-head")),
        };
        if request.discard_local_delta && repo.work_tree() == Some(repo.trusted_main_root()) {
            return Err(failure("restore-discard-requires-producer"));
        }
        if request.discard_local_delta && request.reapply_local_delta {
            return Err(failure("restore-discard-reapply-conflict"));
        }
        let baseline = if let Some(baseline) = &request.checkout_baseline {
            let requested = Oid::parse(baseline, repo.object_format())
                .map_err(|_| failure("restore-baseline-mismatch"))?;
            if !self
                .ancestry(repo, &requested, &target)
                .map_err(|_| failure("restore-baseline-mismatch"))?
            {
                return Err(failure("restore-baseline-mismatch"));
            }
            let reflog = self.checkout_text(
                repo,
                scope,
                &["reflog", "show", "HEAD", "-n", "1", "--format=%H"],
            )?;
            if &reflog != baseline && reflog != request.target {
                return Err(failure("restore-baseline-mismatch"));
            }
            Oid::parse(&reflog, repo.object_format()).map_err(failure)?
        } else {
            head.clone()
        };
        if !self.ancestry(repo, &baseline, &target)?
            && !(request.discard_local_delta && self.ancestry(repo, &target, &head)?)
        {
            return Err(failure("restore-target-not-descendant"));
        }
        self.restore_native_gate(repo, scope)?;
        let status = self.checkout_bytes(
            repo,
            scope,
            &[
                "status",
                "--porcelain=v1",
                "-z",
                "--untracked-files=all",
                "--ignored=no",
            ],
        )?;
        let entries =
            checkout::paths(&self.checkout_bytes(repo, scope, &["ls-files", "--stage", "-z"])?)?;
        if entries.iter().any(|e| {
            e.starts_with("160000 ") || !e.split('\t').next().is_some_and(|h| h.ends_with(" 0"))
        }) {
            return Err(failure("restore-unsupported-index"));
        }
        let flags =
            checkout::paths(&self.checkout_bytes(repo, scope, &["ls-files", "-v", "-z"])?)?;
        let linked = repo.work_tree() != Some(repo.trusted_main_root());
        if linked && fs::symlink_metadata(checkout::root(repo)?.join(".fgos")).is_ok() {
            return Err(failure("restore-worker-state-preserved"));
        }
        if flags
            .iter()
            .any(|p| !p.starts_with("H ") && !(linked && p.starts_with("S .fgos/")))
        {
            return Err(failure("restore-index-flags-unsupported"));
        }
        let tracked: BTreeSet<_> =
            checkout::paths(&self.checkout_bytes(repo, scope, &["ls-files", "-z"])?)?
                .into_iter()
                .collect();
        let target_paths = checkout::paths(&self.checkout_bytes(
            repo,
            scope,
            &["ls-tree", "-r", "--name-only", "-z", target.as_str()],
        )?)?;
        if !linked
            && tracked
                .iter()
                .chain(target_paths.iter())
                .any(|p| !data_path(p))
        {
            return Err(failure("restore-protected-fgos-path"));
        }
        let tracked: BTreeSet<_> = tracked.into_iter().filter(|p| data_path(p)).collect();
        let target_paths: Vec<_> = target_paths.into_iter().filter(|p| data_path(p)).collect();
        let target_entries =
            self.checkout_bytes(repo, scope, &["ls-tree", "-r", "-z", target.as_str()])?;
        if target_entries
            .split(|b| *b == 0)
            .any(|e| e.starts_with(b"160000 "))
        {
            return Err(failure("restore-submodule-unsupported"));
        }
        let root = checkout::root(repo)?;
        for p in &request.allowed_replacements {
            safe_path(root, p)?;
        }
        let mut protected = BTreeSet::new();
        for p in &target_paths {
            safe_path(root, p)?;
            let mut current = Path::new(p).to_path_buf();
            while !current.as_os_str().is_empty() {
                protected.insert(current.to_string_lossy().into_owned());
                if !current.pop() {
                    break;
                }
            }
        }
        // Include ignored descendants where an incoming leaf replaces a directory.
        fn leaves(root: &Path, name: &str, out: &mut BTreeSet<String>) -> Result<()> {
            match fs::symlink_metadata(root.join(name)) {
                Ok(m) if m.is_dir() => {
                    for entry in fs::read_dir(root.join(name)).map_err(failure)? {
                        let entry = entry.map_err(failure)?;
                        let child = format!(
                            "{name}/{}",
                            entry
                                .file_name()
                                .to_str()
                                .ok_or_else(|| failure("restore-path-encoding"))?
                        );
                        leaves(root, &child, out)?;
                    }
                }
                Ok(_) => {
                    out.insert(name.into());
                }
                Err(e)
                    if matches!(
                        e.kind(),
                        std::io::ErrorKind::NotFound | std::io::ErrorKind::NotADirectory
                    ) => {}
                Err(e) => return Err(failure(e)),
            }
            Ok(())
        }
        let mut collision_paths = BTreeSet::new();
        for p in &protected {
            if target_paths.contains(p) {
                leaves(root, p, &mut collision_paths)?;
            } else if fs::symlink_metadata(root.join(p)).is_ok_and(|m| !m.is_dir()) {
                collision_paths.insert(p.clone());
            }
        }
        for p in &collision_paths {
            // A case-only alias is tracked only when it names the same index
            // entry on disk. Case folding alone would admit a distinct file on
            // case-sensitive filesystems (or an untracked hard link).
            let collision_metadata = fs::symlink_metadata(root.join(p));
            let folded = p.to_lowercase();
            let tracked_alias = tracked.iter().filter(|indexed| indexed.to_lowercase() == folded).any(|indexed| {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::MetadataExt;
                    match (fs::symlink_metadata(root.join(indexed)), collision_metadata.as_ref()) {
                        (Ok(a), Ok(b)) => a.dev() == b.dev() && a.ino() == b.ino()
                            && fs::read_dir(root.join(Path::new(p).parent().unwrap_or(Path::new(""))))
                                .is_ok_and(|mut entries| !entries.any(|e| e.is_ok_and(|e| e.file_name() == Path::new(p).file_name().unwrap_or_default()))),
                        _ => false,
                    }
                }
                #[cfg(not(unix))]
                { false }
            });
            if !tracked.contains(p) && !tracked_alias && !request.allowed_replacements.contains(p) {
                return Err(failure(format!("restore-untracked-target-collision: {p}; list in allowedReplacements to replace")));
            }
        }
        let mut paths = tracked;
        paths.extend(target_paths);
        paths.extend(collision_paths);
        paths.extend(
            checkout::paths(&self.checkout_bytes(
                repo,
                scope,
                &["ls-files", "--others", "--exclude-standard", "-z"],
            )?)?
            .into_iter()
            .filter(|p| data_path(p)),
        );
        // Directories have no independent bytes; their leaves are captured instead.
        paths.retain(|p| !fs::symlink_metadata(root.join(p)).is_ok_and(|m| m.is_dir()));
        for p in &paths {
            safe_path(checkout::root(repo)?, p)?;
        }
        Ok(RestorePreview {
            head: baseline.as_str().into(),
            reference,
            target: target.as_str().into(),
            status,
            paths: paths.into_iter().collect(),
        })
    }
    fn restore_native_gate(&self, repo: &RepoHandle, scope: &LockScope<'_>) -> Result<()> {
        fgos_holder_lock::validate_quiescent(checkout::handle(scope, repo)?).map_err(failure)?;
        for name in [
            "index.lock",
            "HEAD.lock",
            "MERGE_HEAD",
            "CHERRY_PICK_HEAD",
            "REVERT_HEAD",
            "rebase-merge",
            "rebase-apply",
            "sequencer",
        ] {
            match fs::symlink_metadata(repo.git_dir.join(name)) {
                Ok(_) if name == "index.lock" => return Err(recovery(crate::native_lock::UNOWNED_INDEX_LOCK)),
                Ok(_) => return Err(recovery(format!("restore-native-state: {name}"))),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                Err(e) => return Err(failure(e)),
            }
        }
        Ok(())
    }
    fn restore_capture(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        preview: &RestorePreview,
        operation_id: &str,
    ) -> Result<Snapshot> {
        let mut remaining = 32 * 1024 * 1024;
        let mut local_paths = checkout::paths(&self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--name-only",
                "--no-renames",
                "--no-ext-diff",
                "--no-textconv",
                "-z",
                &preview.head,
                "--",
                ":!.fgos",
            ],
        )?)?;
        local_paths.extend(checkout::paths(&self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--cached",
                "--name-only",
                "--no-renames",
                "--no-ext-diff",
                "--no-textconv",
                "-z",
                &preview.head,
                "--",
                ":!.fgos",
            ],
        )?)?);
        local_paths.extend(checkout::paths(&self.checkout_bytes(
            repo,
            scope,
            &[
                "ls-files",
                "--others",
                "--exclude-standard",
                "-z",
                "--",
                ":!.fgos",
            ],
        )?)?);
        local_paths.retain(|p| data_path(p));
        local_paths.sort();
        local_paths.dedup();
        let head_paths: BTreeSet<_> = checkout::paths(&self.checkout_bytes(
            repo,
            scope,
            &["ls-tree", "-r", "--name-only", "-z", &preview.head],
        )?)?
        .into_iter()
        .collect();
        let mut paths = BTreeMap::new();
        let mut clean_modes = BTreeMap::new();
        for p in &preview.paths {
            safe_path(checkout::root(repo)?, p)?;
            let path = checkout::root(repo)?.join(p);
            if head_paths.contains(p) && !local_paths.contains(p) {
                #[cfg(unix)]
                if let Ok(m) = fs::symlink_metadata(&path) {
                    use std::os::unix::fs::PermissionsExt;
                    if m.is_file() {
                        clean_modes.insert(p.clone(), m.permissions().mode());
                    }
                }
            } else {
                paths.insert(p.clone(), capture(&path, &mut remaining)?);
            }
        }
        // Intent-to-add is visible only when Git is asked to expose it as an index delta.
        let visible = checkout::paths(&self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--cached",
                "--name-only",
                "-z",
                "--ita-visible-in-index",
                &preview.head,
                "--",
                ":!.fgos",
            ],
        )?)?;
        let hidden = checkout::paths(&self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--cached",
                "--name-only",
                "-z",
                "--ita-invisible-in-index",
                &preview.head,
                "--",
                ":!.fgos",
            ],
        )?)?;
        let intent_to_add = visible
            .into_iter()
            .filter(|p| !hidden.contains(p))
            .collect();
        let index = capture(&repo.git_dir.join("index"), &mut remaining)?;
        let staged_patch = self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--cached",
                "--binary",
                "--full-index",
                "--no-ext-diff",
                "--no-textconv",
                &preview.head,
                "--",
                ":!.fgos",
            ],
        )?;
        let worktree_patch = self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--binary",
                "--full-index",
                "--no-ext-diff",
                "--no-textconv",
                "--",
                ":!.fgos",
            ],
        )?;
        let raw = self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--raw",
                "--no-abbrev",
                "--no-renames",
                "-z",
                &preview.head,
                &preview.target,
                "--",
                ":!.fgos",
            ],
        )?;
        let fields: Vec<_> = raw.split(|b| *b == 0).filter(|b| !b.is_empty()).collect();
        let mut mode_changes = vec![];
        let mut content_changes = vec![];
        let (pairs, remainder) = fields.as_chunks::<2>();
        if !remainder.is_empty() {
            return Err(failure("restore-mode-diff-invalid"));
        }
        for pair in pairs {
            let header = std::str::from_utf8(pair[0]).map_err(failure)?;
            let modes: Vec<_> = header.trim_start_matches(':').split_whitespace().collect();
            if modes.len() < 4 {
                return Err(failure("restore-mode-diff-invalid"));
            }
            if modes[2] != modes[3] {
                content_changes.push(std::str::from_utf8(pair[1]).map_err(failure)?.to_owned());
            }
            if modes[0] != modes[1] {
                mode_changes.push(std::str::from_utf8(pair[1]).map_err(failure)?.to_owned());
            }
        }
        Ok(Snapshot {
            operation_id: operation_id.into(),
            paths,
            index,
            staged_patch,
            worktree_patch,
            local_paths,
            mode_changes,
            content_changes,
            intent_to_add,
            clean_modes,
        })
    }
    pub fn preview_restore(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        request: &RestoreRequest,
    ) -> Result<RestorePreview> {
        let repo = self.checkout_repository(repo)?;
        let scope = checkout::scope(&repo, held)?;
        self.restore_patch_gate(&repo)?;
        self.restore_checks(&repo, &scope, request)
    }
    pub fn apply_restore(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        request: &RestoreRequest,
        writer: &str,
        id: &str,
    ) -> Result<RestoreResult> {
        self.apply_restore_with_filesystem(repo, held, request, writer, id, &wal::OsFileSystem)
    }
    pub fn apply_restore_with_filesystem(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        request: &RestoreRequest,
        writer: &str,
        id: &str,
        filesystem: &dyn wal::FileSystem,
    ) -> Result<RestoreResult> {
        if !wal::valid_id(id) {
            return Err(failure("invalid-operation-id"));
        }
        let repo = self.checkout_repository(repo)?;
        let scope = checkout::scope(&repo, held)?;
        wal::require_activation_fence(&repo).map_err(failure)?;
        let wal = Wal::with_filesystem(repo.common_dir(), filesystem).map_err(failure)?;
        if wal.known_id(id).map_err(failure)? {
            if wal.compacted(id).map_err(failure)?.is_some() {
                return Err(failure("restore-already-acknowledged"));
            }
            let chain = wal.inspect(id).map_err(failure)?;
            let OperationKind::Restore(p) = &chain.intent().kind else {
                return Err(failure("operation-id-conflict"));
            };
            if p.request != *request || chain.intent().writer_identity != writer {
                return Err(failure("operation-id-conflict"));
            }
            return self.restore_observe(&repo, &scope, &wal, &chain, writer);
        }
        self.restore_patch_gate(&repo)?;
        crate::refs::admission(&wal, id, &checkout::checkout_resources(&repo)?)?;
        let preview = self.restore_checks(&repo, &scope, request)?;
        let snapshot = self.restore_capture(&repo, &scope, &preview, id)?;
        if request.require_clean_baseline && !snapshot.local_paths.is_empty() {
            return Err(failure("restore-baseline-dirty"));
        }
        if request.require_staged_only
            && (!snapshot.worktree_patch.is_empty()
                || !self
                    .checkout_bytes(
                        &repo,
                        &scope,
                        &[
                            "ls-files",
                            "--others",
                            "--exclude-standard",
                            "-z",
                            "--",
                            ":!.fgos",
                        ],
                    )?
                    .is_empty())
        {
            return Err(failure("restore-stray-dirt"));
        }
        if request.reapply_local_delta {
            for p in &snapshot.local_paths {
                if snapshot.content_changes.contains(p) {
                    let digest = wal.store_restore_snapshot(&snapshot).map_err(failure)?;
                    let mut error = failure(format!("restore-reapply-required: restore-overlapping-content: {p}; snapshot:{digest}"));
                    let patch_path = if request.checkout_baseline.is_some() {
                        Some(
                            wal.store_restore_patch(&preview.reference, id, &snapshot.staged_patch)
                                .map_err(failure)?,
                        )
                    } else {
                        None
                    };
                    error.detail = Some(Box::new(
                        serde_json::json!({"snapshot":digest,"patchPath":patch_path}),
                    ));
                    return Err(error);
                }
                if snapshot.mode_changes.contains(p) {
                    let raw = self.checkout_bytes(
                        &repo,
                        &scope,
                        &["diff", "--raw", &preview.head, "--", p],
                    )?;
                    if raw.split(|b| *b == b'\n').any(|line| {
                        let parts: Vec<_> = line.split(|b| *b == b' ').collect();
                        parts.len() > 1 && parts[0].strip_prefix(b":") != Some(parts[1])
                    }) {
                        return Err(failure(format!("restore-local-mode-conflict: {p}")));
                    }
                }
            }
        }

        filesystem
            .checkpoint("restore-snapshot-captured")
            .map_err(failure)?;
        let digest = wal.store_restore_snapshot(&snapshot).map_err(failure)?;
        let intent = Intent {
            kind: OperationKind::Restore(Box::new(RestoreIntent {
                worktree: checkout::root(&repo)?.to_string_lossy().into(),
                reference: preview.reference.clone(),
                request: request.clone(),
                snapshot: digest.clone(),
            })),
            request_digest: wal::canonical_digest(request).map_err(failure)?,
            repo_identity: wal.repository_identity().into(),
            resource_set: checkout::checkout_resources(&repo)?,
            authority_binding: checkout::binding(checkout::handle(&scope, &repo)?)?,
            writer_identity: writer.into(),
            object_format: repo.object_format(),
            expected: Tip::Oid(request.expected_head.clone()),
            next: Tip::Oid(request.target.clone()),
        };
        let authority = Authority {
            scope: &scope,
            binding: intent.authority_binding.clone(),
        };
        let mut chain = match wal.begin(id, intent, &authority).map_err(failure)? {
            Begin::Created(c) => c,
            _ => return Err(recovery("restore-operation-already-started")),
        };
        filesystem.checkpoint("restore-intent").map_err(failure)?;
        if request.discard_local_delta {
            crate::refs::install_pin(
                self,
                &repo,
                checkout::handle(&scope, &repo)?,
                id,
                &Oid::parse(&request.expected_head, repo.object_format()).map_err(failure)?,
            )?;
        }
        chain = wal.append(&chain, Phase::Prepared).map_err(failure)?;
        filesystem.checkpoint("restore-prepared").map_err(failure)?;
        // Re-read full facts and snapshot through the same config/custody door.
        let now = self.restore_checks(&repo, &scope, request)?;
        if now.status != preview.status
            || now.reference != preview.reference
            || wal::canonical_digest(&self.restore_capture(&repo, &scope, &now, id)?)
                .map_err(failure)?
                != digest
        {
            return Err(recovery("restore-snapshot-drift"));
        }
        let _: Snapshot = wal.read_restore_snapshot(&digest).map_err(failure)?;
        let patch_path = if request.checkout_baseline.is_some()
            && request.reapply_local_delta
            && !snapshot.staged_patch.is_empty()
        {
            Some(
                wal.store_restore_patch(&preview.reference, id, &snapshot.staged_patch)
                    .map_err(failure)?,
            )
        } else {
            None
        };
        chain = wal
            .append(
                &chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: chain.intent().expected.clone(),
                    next: chain.intent().next.clone(),
                },
            )
            .map_err(failure)?;
        filesystem
            .checkpoint("restore-before-reset")
            .map_err(failure)?;
        self.checkout_bytes(&repo, &scope, &["reset", "--hard", &request.target])
            .map_err(|_| recovery(format!("restore-effect-unknown; snapshot:{digest}")))?;
        if repo.work_tree() != Some(repo.trusted_main_root()) {
            let paths = self.checkout_bytes(&repo, &scope, &["ls-files", "-z", "--", ".fgos"])?;
            for p in checkout::paths(&paths)? {
                self.checkout_bytes(
                    &repo,
                    &scope,
                    &["update-index", "--skip-worktree", "--", &p],
                )?;
            }
            let state = checkout::root(&repo)?.join(".fgos");
            match fs::symlink_metadata(&state) {
                Ok(m) if m.is_dir() && !m.file_type().is_symlink() => {
                    fs::remove_dir_all(state).map_err(failure)?
                }
                Ok(_) => fs::remove_file(state).map_err(failure)?,
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                Err(e) => return Err(failure(e)),
            }
        }
        if request.discard_local_delta {
            for (name, saved) in &snapshot.paths {
                if data_path(name) && !matches!(saved, SavedPath::Absent) {
                    safe_path(checkout::root(&repo)?, name)?;
                    let path = checkout::root(&repo)?.join(name);
                    // Reset already replaced tracked paths; remove only captured paths absent from target.
                    if !self
                        .paths_at_revision(
                            &repo,
                            &Oid::parse(&request.target, repo.object_format()).map_err(failure)?,
                            &[name.as_bytes().to_vec()],
                            1,
                        )?
                        .iter()
                        .any(|p| !matches!(p.value, PathValue::Absent))
                        && fs::symlink_metadata(&path).is_ok()
                    {
                        fs::remove_file(path).map_err(failure)?;
                    }
                }
            }
        }
        filesystem
            .checkpoint("restore-after-reset")
            .map_err(failure)?;
        if request.reapply_local_delta {
            for (patch, cached, checkpoint) in [
                (&snapshot.staged_patch, true, "restore-after-index-delta"),
                (
                    &snapshot.worktree_patch,
                    false,
                    "restore-after-worktree-delta",
                ),
            ] {
                if !patch.is_empty() {
                    let mut args = vec!["apply", "--binary", "--whitespace=nowarn"];
                    if cached {
                        args.push("--index");
                    }
                    let out = self.checkout_call(&repo, &scope, &args, patch, false)?;
                    if !out.success {
                        return Err(recovery(format!(
                            "restore-reapply-required; snapshot:{digest}"
                        )));
                    }
                }
                filesystem.checkpoint(checkpoint).map_err(failure)?;
            }
            for p in &snapshot.intent_to_add {
                self.checkout_bytes(&repo, &scope, &["add", "--intent-to-add", "--", p])?;
            }
            #[cfg(unix)]
            for (p, mode) in &snapshot.clean_modes {
                use std::os::unix::fs::PermissionsExt;
                if !snapshot.mode_changes.contains(p) {
                    let path = checkout::root(&repo)?.join(p);
                    if fs::symlink_metadata(&path).is_ok_and(|m| m.is_file()) {
                        fs::set_permissions(path, fs::Permissions::from_mode(*mode))
                            .map_err(failure)?;
                    }
                }
            }
            // Git patches encode executable bits; retain the complete local mode.
            for (p, saved) in &snapshot.paths {
                if let SavedPath::File(_, mode) = saved {
                    safe_path(checkout::root(&repo)?, p)?;
                    let path = checkout::root(&repo)?.join(p);
                    if fs::symlink_metadata(&path).is_ok_and(|m| m.is_file()) {
                        let mut mode = mode.clone();
                        #[cfg(unix)]
                        if snapshot.mode_changes.contains(p) {
                            use std::os::unix::fs::PermissionsExt;
                            let incoming =
                                fs::metadata(&path).map_err(failure)?.permissions().mode();
                            mode = fs::Permissions::from_mode(
                                (mode.mode() & !0o111) | (incoming & 0o111),
                            );
                        }
                        fs::set_permissions(path, mode).map_err(failure)?;
                        filesystem
                            .checkpoint("restore-after-path-mode")
                            .map_err(failure)?;
                    }
                }
            }
        }
        filesystem
            .checkpoint("restore-after-modes")
            .map_err(failure)?;
        let post_check = (|| -> Result<String> {
            if self.checkout_text(&repo, &scope, &["rev-parse", "HEAD"])? != request.target {
                return Err(recovery("restore-head-drift"));
            }
            let after = self.restore_checks(
                &repo,
                &scope,
                &RestoreRequest {
                    expected_head: request.target.clone(),
                    ..request.clone()
                },
            )?;
            let post = wal
                .store_restore_snapshot(&self.restore_capture(&repo, &scope, &after, id)?)
                .map_err(failure)?;
            Ok(post)
        })();
        let mut warnings = vec![];
        match post_check {
            Ok(post) => {
                chain = wal
                    .append(&chain, Phase::RestoreApplied { snapshot: post })
                    .map_err(failure)?;
            }
            Err(e) => warnings.push(format!("restore-post-check-failed: {}", e.cause)),
        }
        filesystem.checkpoint("restore-applied").map_err(failure)?;
        let outcome = Outcome::Restore {
            state: "restored".into(),
        };
        wal.append(&chain, Phase::Outcome(outcome.clone()))
            .map_err(failure)?;
        filesystem.checkpoint("restore-receipt").map_err(failure)?;
        if patch_path.is_some() {
            match wal.clear_restore_patch(&preview.reference, id, &snapshot.staged_patch) {
                Ok(true) => (),
                Ok(false) => warnings.push("restore-patch-changed-preserved".into()),
                Err(error) => warnings.push(format!("restore-patch-retained: {error}")),
            }
        }
        Ok(RestoreResult {
            operation_id: id.into(),
            snapshot: digest,
            outcome,
            warnings,
        })
    }
    /// List retained bytes without modifying either checkout or snapshot.
    pub fn list_restore_snapshot(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
    ) -> Result<Vec<String>> {
        let repo = self.checkout_repository(repo)?;
        let scope = checkout::scope(&repo, held)?;
        let wal = Wal::open(&repo).map_err(failure)?;
        if wal.compacted(id).map_err(failure)?.is_some() {
            return Err(failure("restore-already-acknowledged"));
        }
        let chain = wal.inspect(id).map_err(failure)?;
        let p = self.restore_evidence_authority(&repo, &scope, &chain, writer)?;
        let saved: Snapshot = wal.read_restore_snapshot(&p.snapshot).map_err(failure)?;
        Ok(saved.paths.keys().cloned().collect())
    }
    /// Extract one saved path to a new file in a caller-owned directory. Never overwrite.
    pub fn extract_restore_path(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
        name: &str,
        destination: &Path,
    ) -> Result<()> {
        use std::io::Write;
        let repo = self.checkout_repository(repo)?;
        let scope = checkout::scope(&repo, held)?;
        let wal = Wal::open(&repo).map_err(failure)?;
        if wal.compacted(id).map_err(failure)?.is_some() {
            return Err(failure("restore-already-acknowledged"));
        }
        let chain = wal.inspect(id).map_err(failure)?;
        let p = self.restore_evidence_authority(&repo, &scope, &chain, writer)?;
        let saved: Snapshot = wal.read_restore_snapshot(&p.snapshot).map_err(failure)?;
        fgos_scope_literal(name)?;
        let bytes = match saved.paths.get(name) {
            Some(SavedPath::File(bytes, _)) => bytes.clone(),
            Some(SavedPath::Link(target)) => target.as_os_str().as_encoded_bytes().to_vec(),
            _ => return Err(failure("restore-path-has-no-retained-bytes")),
        };
        if !fs::symlink_metadata(destination).map_err(failure)?.is_dir() {
            return Err(failure("restore-extract-directory-required"));
        }
        #[cfg(unix)]
        let extraction_directory = {
            use std::os::unix::fs::OpenOptionsExt;
            fs::OpenOptions::new().read(true)
                .custom_flags(libc::O_DIRECTORY | libc::O_NOFOLLOW | libc::O_CLOEXEC)
                .open(destination).map_err(failure)?
        };
        let destination = destination.canonicalize().map_err(failure)?;
        if destination.starts_with(checkout::root(&repo)?)
            || destination.starts_with(repo.trusted_main_root())
            || destination.starts_with(repo.common_dir())
            || destination.starts_with(self.state_root())
        {
            return Err(failure("restore-extract-outside-repository-required"));
        }
        let mut cursor = None;
        loop {
            let page = self.list_worktrees(&repo, cursor, 4096)?;
            for row in page.entries {
                let registered = Path::new(std::str::from_utf8(&row.path).map_err(failure)?);
                let registered = match registered.canonicalize() {
                    Ok(path) => path,
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => registered.to_path_buf(),
                    Err(e) => return Err(failure(e)),
                };
                if destination.starts_with(registered) {
                    return Err(failure("restore-extract-outside-repository-required"));
                }
            }
            if page.complete { break; }
            cursor = page.next_cursor;
        }
        let filename = Path::new(name).file_name().ok_or_else(|| failure("restore-extract-path"))?;
        #[cfg(unix)]
        {
            use std::{ffi::CString, os::{fd::{AsRawFd, FromRawFd}, unix::{ffi::OsStrExt, fs::MetadataExt}}};
            let checked = fs::metadata(&destination).map_err(failure)?;
            let dir = extraction_directory;
            // Bind the checked canonical directory to its held descriptor before
            // creation. A parent rename after this point cannot redirect openat.
            let held = dir.metadata().map_err(failure)?;
            if held.dev() != checked.dev() || held.ino() != checked.ino() {
                return Err(failure("restore-extract-directory-changed"));
            }
            let filename = CString::new(filename.as_bytes()).map_err(failure)?;
            // SAFETY: dir is held, filename is a single validated basename;
            // successful openat transfers ownership to File exactly once.
            let fd = unsafe { libc::openat(dir.as_raw_fd(), filename.as_ptr(),
                libc::O_WRONLY | libc::O_CREAT | libc::O_EXCL | libc::O_NOFOLLOW | libc::O_CLOEXEC, 0o600) };
            if fd < 0 { return Err(failure(std::io::Error::last_os_error())); }
            let mut output = unsafe { fs::File::from_raw_fd(fd) };
            output.write_all(&bytes).map_err(failure)?;
            output.sync_all().map_err(failure)?;
            dir.sync_all().map_err(failure)?;
        }
        #[cfg(not(unix))]
        return Err(failure("restore-extract-platform-unsupported"));
        Ok(())
    }
    fn restore_evidence_authority<'a>(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        chain: &'a wal::Chain,
        writer: &str,
    ) -> Result<&'a RestoreIntent> {
        let OperationKind::Restore(p) = &chain.intent().kind else {
            return Err(failure("not-restore-operation"));
        };
        if p.worktree != checkout::root(repo)?.to_string_lossy()
            || chain.intent().writer_identity != writer
            || chain.intent().resource_set != checkout::checkout_resources(repo)?
            || chain.intent().authority_binding
                != checkout::binding(checkout::handle(scope, repo)?)?
        {
            return Err(failure("restore-authority-mismatch"));
        }
        Ok(p)
    }
    /// Caller acknowledges it has recovered all needed bytes; compact and release evidence.
    pub fn acknowledge_restore(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
    ) -> Result<()> {
        self.acknowledge_restore_with_filesystem(repo, held, writer, id, &wal::OsFileSystem)
    }
    pub fn acknowledge_restore_with_filesystem<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
        filesystem: &F,
    ) -> Result<()> {
        let repo = self.checkout_repository(repo)?;
        let scope = checkout::scope(&repo, held)?;
        let wal = Wal::with_filesystem(repo.common_dir(), filesystem).map_err(failure)?;
        if wal.compacted(id).map_err(failure)?.is_some() {
            return Err(failure("restore-already-acknowledged"));
        }
        let chain = wal.inspect(id).map_err(failure)?;
        let p = self.restore_evidence_authority(&repo, &scope, &chain, writer)?;
        let mut digests = vec![p.snapshot.clone()];
        for record in chain.records() {
            if let Phase::RestoreApplied { snapshot } = &record.phase {
                digests.push(snapshot.clone());
            }
        }
        if chain.outcome().is_none() {
            return Err(failure("restore-acknowledgement-requires-terminal-outcome"));
        }
        let chain = if p.request.discard_local_delta
            && !matches!(chain.last_state(), Phase::RestoreAcknowledged)
        {
            crate::refs::release_pin(self, &repo, checkout::handle(&scope, &repo)?, &wal, &chain)?;
            wal.inspect(id).map_err(failure)?
        } else {
            chain
        };
        let chain = if matches!(chain.last_state(), Phase::RestoreAcknowledged) {
            chain
        } else {
            wal.append(&chain, Phase::RestoreAcknowledged)
                .map_err(failure)?
        };
        // Release bytes while the durable acknowledgement and complete binding still exist.
        // An interrupted cleanup can therefore be retried without losing its inventory.
        wal.release_restore_snapshots(&digests).map_err(failure)?;
        wal.compact_restore_ack(
            &chain,
            &crate::WalReader {
                driver: self,
                repo: &repo,
            },
            &Authority {
                scope: &scope,
                binding: chain.intent().authority_binding.clone(),
            },
        )
        .map_err(failure)?;
        Ok(())
    }
    pub fn recover_restore(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
    ) -> Result<RestoreResult> {
        let repo = self.checkout_repository(repo)?;
        let mut scope = checkout::scope(&repo, held)?;
        crate::recovery::leaf(&mut scope, &repo)?;
        let wal = Wal::open(&repo).map_err(failure)?;
        if wal.compacted(id).map_err(failure)?.is_some() {
            return Err(failure("restore-already-acknowledged"));
        }
        let chain = wal.inspect(id).map_err(failure)?;
        self.restore_observe(&repo, &scope, &wal, &chain, writer)
    }
    fn restore_observe<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal<F>,
        chain: &wal::Chain,
        writer: &str,
    ) -> Result<RestoreResult> {
        let p = self.restore_evidence_authority(repo, scope, chain, writer)?;
        let authority = Authority {
            scope,
            binding: chain.intent().authority_binding.clone(),
        };
        wal::PublicationAuthority::validate_publication_borrow(&authority, chain.intent())
            .map_err(failure)?;
        let snapshot_error = wal.read_restore_snapshot::<Snapshot>(&p.snapshot).err();
        if let Some(error) = snapshot_error {
            let outcome = chain.outcome().cloned().unwrap_or_else(|| {
                if matches!(chain.last_state(), Phase::Intent(_) | Phase::Prepared) {
                    Outcome::AbandonedBeforeAttempt
                } else {
                    Outcome::Restore {
                        state: "recoveryRequired".into(),
                    }
                }
            });
            if chain.outcome().is_none() {
                wal.append(chain, Phase::Outcome(outcome.clone()))
                    .map_err(failure)?;
            }
            return Ok(RestoreResult {
                operation_id: chain.last().operation_id.clone(),
                snapshot: p.snapshot.clone(),
                outcome,
                warnings: vec![format!(
                    "restore-snapshot-unreadable: {error}; closed-with-evidence-retained"
                )],
            });
        }
        let mut warnings = vec![];
        let outcome = if let Some(o) = chain.outcome() {
            o.clone()
        } else if matches!(chain.last_state(), Phase::Intent(_) | Phase::Prepared) {
            self.restore_native_gate(repo, scope)?;
            wal.append(chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                .map_err(failure)?
                .outcome()
                .unwrap()
                .clone()
        } else {
            // No replay, reset or rollback. Even expected HEAD can conceal ABA.
            self.restore_native_gate(repo, scope)?;
            let head = self.checkout_text(repo, scope, &["rev-parse", "HEAD"])?;
            let reference = match self.resolve_head(repo)? {
                HeadFact::Attached { target, .. } => target.as_str().to_owned(),
                HeadFact::Detached { .. } => "HEAD".into(),
                HeadFact::Unborn { .. } => return Err(recovery("restore-unborn-head")),
            };
            let mut state = "recoveryRequired";
            if let Phase::RestoreApplied { snapshot } = chain.last_state() {
                match wal.read_restore_snapshot::<Snapshot>(snapshot) {
                    Ok(_) if head == p.request.target && reference == p.reference => {
                        let request = RestoreRequest {
                            expected_head: p.request.target.clone(),
                            ..p.request.clone()
                        };
                        if let Ok(preview) = self.restore_checks(repo, scope, &request) {
                            if let Ok(current) = self.restore_capture(
                                repo,
                                scope,
                                &preview,
                                &chain.last().operation_id,
                            ) {
                                if wal::canonical_digest(&current).map_err(failure)? == *snapshot {
                                    state = "effectObservedOnly";
                                }
                            }
                        }
                    }
                    Err(error) => warnings.push(format!(
                        "restore-snapshot-unreadable: {error}; closed-with-evidence-retained"
                    )),
                    _ => (),
                }
            }
            let outcome = Outcome::Restore {
                state: state.into(),
            };
            wal.append(chain, Phase::Outcome(outcome.clone()))
                .map_err(failure)?;
            outcome
        };
        Ok(RestoreResult {
            operation_id: chain.last().operation_id.clone(),
            snapshot: p.snapshot.clone(),
            outcome: outcome.clone(),
            warnings: {
                if matches!(&outcome, Outcome::Restore { state } if state == "recoveryRequired") {
                    warnings.push("restore-state-uncertain: snapshot and current bytes retained; inspect before a new restore".into());
                }
                warnings
            },
        })
    }
}
