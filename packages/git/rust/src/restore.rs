//! Dormant destructive checkout port. Snapshot and WAL always precede reset.
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
    paths: BTreeMap<String, SavedPath>,
    index: SavedPath,
    staged_patch: Vec<u8>,
    worktree_patch: Vec<u8>,
    local_paths: Vec<String>,
    mode_changes: Vec<String>,
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
        let reference = self.checkout_text(repo, scope, &["symbolic-ref", "-q", "HEAD"])?;
        RefName::parse(&reference).map_err(failure)?;
        if !self.ancestry(repo, &head, &target)? {
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
        if flags.iter().any(|p| !p.starts_with("H ")) {
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
        if tracked
            .iter()
            .chain(target_paths.iter())
            .any(|p| !data_path(p))
        {
            return Err(failure("restore-protected-fgos-path"));
        }
        let target_entries =
            self.checkout_bytes(repo, scope, &["ls-tree", "-r", "-z", target.as_str()])?;
        if target_entries
            .split(|b| *b == 0)
            .any(|e| e.starts_with(b"160000 "))
        {
            return Err(failure("restore-submodule-unsupported"));
        }
        if request.reapply_local_delta
            && target_paths.iter().any(|p| {
                !tracked.contains(p)
                    && fs::symlink_metadata(checkout::root(repo).unwrap().join(p)).is_ok()
            })
        {
            return Err(failure("restore-untracked-target-collision"));
        }
        let mut paths = tracked;
        paths.extend(target_paths);
        paths.extend(
            checkout::paths(&self.checkout_bytes(
                repo,
                scope,
                &["ls-files", "--others", "--exclude-standard", "-z"],
            )?)?
            .into_iter()
            .filter(|p| data_path(p)),
        );
        for p in &paths {
            safe_path(checkout::root(repo)?, p)?;
        }
        Ok(RestorePreview {
            head: head.as_str().into(),
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
    ) -> Result<Snapshot> {
        let mut remaining = 32 * 1024 * 1024;
        let paths = preview
            .paths
            .iter()
            .map(|p| {
                safe_path(checkout::root(repo)?, p)?;
                Ok((
                    p.clone(),
                    capture(&checkout::root(repo)?.join(p), &mut remaining)?,
                ))
            })
            .collect::<Result<_>>()?;
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
            ],
        )?;
        let mut local_paths = self.dirty_paths(repo, scope)?;
        local_paths.extend(self.staged(repo, scope)?);
        local_paths.sort();
        local_paths.dedup();
        let raw = self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--raw",
                "--no-renames",
                "-z",
                &preview.head,
                &preview.target,
            ],
        )?;
        let fields: Vec<_> = raw.split(|b| *b == 0).filter(|b| !b.is_empty()).collect();
        let mut mode_changes = vec![];
        let (pairs, remainder) = fields.as_chunks::<2>();
        if !remainder.is_empty() {
            return Err(failure("restore-mode-diff-invalid"));
        }
        for pair in pairs {
            let header = std::str::from_utf8(pair[0]).map_err(failure)?;
            let modes: Vec<_> = header.trim_start_matches(':').split_whitespace().collect();
            if modes.len() < 2 {
                return Err(failure("restore-mode-diff-invalid"));
            }
            if modes[0] != modes[1] {
                mode_changes.push(std::str::from_utf8(pair[1]).map_err(failure)?.to_owned());
            }
        }
        Ok(Snapshot {
            paths,
            index,
            staged_patch,
            worktree_patch,
            local_paths,
            mode_changes,
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
            let chain = wal.inspect(id).map_err(failure)?;
            let OperationKind::Restore(p) = &chain.intent().kind else {
                return Err(failure("operation-id-conflict"));
            };
            if p.request != *request || chain.intent().writer_identity != writer {
                return Err(failure("operation-id-conflict"));
            }
            return self.restore_observe(&repo, &scope, &wal, &chain, writer);
        }
        crate::refs::admission(&wal, id, &checkout::checkout_resources(&repo)?)?;
        let preview = self.restore_checks(&repo, &scope, request)?;
        let snapshot = self.restore_capture(&repo, &scope, &preview)?;
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
        chain = wal.append(&chain, Phase::Prepared).map_err(failure)?;
        filesystem.checkpoint("restore-prepared").map_err(failure)?;
        // Re-read full facts and snapshot through the same config/custody door.
        let now = self.restore_checks(&repo, &scope, request)?;
        if now.status != preview.status
            || now.reference != preview.reference
            || wal::canonical_digest(&self.restore_capture(&repo, &scope, &now)?)
                .map_err(failure)?
                != digest
        {
            return Err(recovery("restore-snapshot-drift"));
        }
        let _: Snapshot = wal.read_restore_snapshot(&digest).map_err(failure)?;
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
            // Git patches encode executable bits; retain the complete local mode.
            for (p, saved) in &snapshot.paths {
                if snapshot.mode_changes.contains(p) && !snapshot.local_paths.contains(p) {
                    continue;
                }
                if let SavedPath::File(_, mode) = saved {
                    safe_path(checkout::root(&repo)?, p)?;
                    let path = checkout::root(&repo)?.join(p);
                    if fs::symlink_metadata(&path).is_ok_and(|m| m.is_file()) {
                        fs::set_permissions(path, mode.clone()).map_err(failure)?;
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
            .store_restore_snapshot(&self.restore_capture(&repo, &scope, &after)?)
            .map_err(failure)?;
        chain = wal
            .append(&chain, Phase::RestoreApplied { snapshot: post })
            .map_err(failure)?;
        filesystem.checkpoint("restore-applied").map_err(failure)?;
        let outcome = Outcome::Restore {
            state: "restored".into(),
        };
        wal.append(&chain, Phase::Outcome(outcome.clone()))
            .map_err(failure)?;
        filesystem.checkpoint("restore-receipt").map_err(failure)?;
        Ok(RestoreResult {
            operation_id: id.into(),
            snapshot: digest,
            outcome,
            warnings: vec![],
        })
    }
    pub fn recover_restore(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
    ) -> Result<RestoreResult> {
        let repo = self.checkout_repository(repo)?;
        let scope = checkout::scope(&repo, held)?;
        let wal = Wal::open(&repo).map_err(failure)?;
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
        let OperationKind::Restore(p) = &chain.intent().kind else {
            return Err(failure("not-restore-operation"));
        };
        if p.worktree != checkout::root(repo)?.to_string_lossy()
            || chain.intent().resource_set != checkout::checkout_resources(repo)?
            || chain.intent().writer_identity != writer
            || chain.intent().authority_binding
                != checkout::binding(checkout::handle(scope, repo)?)?
        {
            return Err(failure("restore-authority-mismatch"));
        }
        let authority = Authority {
            scope,
            binding: chain.intent().authority_binding.clone(),
        };
        wal::PublicationAuthority::validate_publication_borrow(&authority, chain.intent())
            .map_err(failure)?;
        let _: Snapshot = wal.read_restore_snapshot(&p.snapshot).map_err(failure)?;
        let outcome = if let Some(o) = chain.outcome() {
            o.clone()
        } else if matches!(chain.last().phase, Phase::Intent(_) | Phase::Prepared) {
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
            let reference = self.checkout_text(repo, scope, &["symbolic-ref", "-q", "HEAD"])?;
            let mut state = "recoveryRequired";
            if let Phase::RestoreApplied { snapshot } = &chain.last().phase {
                let post: Snapshot = wal.read_restore_snapshot(snapshot).map_err(failure)?;
                let preview = RestorePreview {
                    head: p.request.target.clone(),
                    reference: reference.clone(),
                    target: p.request.target.clone(),
                    status: vec![],
                    paths: post.paths.keys().cloned().collect(),
                };
                if head == p.request.target && reference == p.reference {
                    if let Ok(current) = self.restore_capture(repo, scope, &preview) {
                        if wal::canonical_digest(&current).map_err(failure)? == *snapshot {
                            state = "effectObservedOnly";
                        }
                    }
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
            warnings: if matches!(&outcome, Outcome::Restore { state } if state == "recoveryRequired")
            {
                vec!["restore-state-uncertain: snapshot and current bytes retained; inspect before a new restore".into()]
            } else {
                vec![]
            },
        })
    }
}
