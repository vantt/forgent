//! Operation-owned sync of a pinned commit into a producer under continuous custody.
use crate::{
    refs::{failure, recovery, Authority},
    scoped_commit::{binding, checkout_resources, compact_matches, handle, paths, root, scope},
    wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal},
    *,
};
use fgos_holder_lock::{BorrowedHandle, LockScope};
use serde::Serialize;
use std::fs;
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub warnings: Vec<String>,
    pub state: String,
    pub operation_id: String,
    pub head: String,
    pub target: String,
    pub resolver_grant: Vec<String>,
    pub commit: Option<CommitResult>,
    pub staged: Vec<String>,
    pub unexpected: Vec<String>,
    pub missing: Vec<String>,
}
fn info(
    id: &str,
    head: &str,
    target: &str,
    state: &str,
    resolver_grant: Vec<String>,
    commit: Option<CommitResult>,
) -> SyncResult {
    SyncResult {
        warnings: vec![],
        staged: vec![], unexpected: vec![], missing: vec![],
        operation_id: id.into(),
        head: head.into(),
        target: target.into(),
        state: state.into(),
        resolver_grant,
        commit,
    }
}
impl GitDriver {
    pub fn start_sync(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        target: &Oid,
        message: &str,
        writer: &str,
        id: &str,
    ) -> Result<SyncResult> {
        self.start_sync_inner(repo, held, target, message, writer, id, false)
    }
    /// Prepare the same Sync operation, leaving its owned merge open so the
    /// consumer can verify before committing under continuous custody.
    pub fn prepare_sync(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        target: &Oid,
        message: &str,
        writer: &str,
        id: &str,
    ) -> Result<SyncResult> {
        self.start_sync_inner(repo, held, target, message, writer, id, true)
    }
    #[allow(clippy::too_many_arguments)]
    fn start_sync_inner(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        target: &Oid,
        message: &str,
        writer: &str,
        id: &str,
        prepare_only: bool,
    ) -> Result<SyncResult> {
        if root(repo)? == repo.trusted_main_root() {
            return Err(failure("sync-linked-worktree-required"));
        }
        if message.is_empty() || message.contains('\0') || message.len() > 1024 * 1024 {
            return Err(failure("invalid-commit-message"));
        }
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let scope = scope(repo, held)?;
        let wal = Wal::open(repo).map_err(failure)?;
        if let Some(compact) = wal.compacted(id).map_err(failure)? {
            let kind = OperationKind::Sync(Box::new(wal::SyncIntent {
                reference: compact.reference.clone(),
                worktree: root(repo)?.to_string_lossy().into(),
                head: compact.expected.clone(),
                target: target.as_str().into(),
                message: message.into(),
            }));
            if compact.request != wal::canonical_digest(&(&kind, writer)).map_err(failure)? {
                return Err(failure("operation-id-reused"));
            }
            return self.continue_sync_scoped(repo, &scope, &wal, writer, id, false);
        }
        if wal.known_id(id).map_err(failure)? {
            let previous = wal.inspect(id).map_err(failure)?;
            match &previous.intent().kind {
                OperationKind::Sync(payload)
                    if payload.target == target.as_str() && payload.message == message => {}
                _ => return Err(failure("operation-id-reused")),
            }
            return self.continue_sync_scoped(repo, &scope, &wal, writer, id, false);
        }
        let symbolic =
            self.checkout_call(repo, &scope, &["symbolic-ref", "-q", "HEAD"], &[], false)?;
        if !symbolic.success {
            return Err(symbolic.error("sync-detached-head-refused"));
        }
        let reference = String::from_utf8(symbolic.stdout)
            .map_err(failure)?
            .trim()
            .to_owned();
        let admission_warnings = self.admit_checkout(repo, &scope, &wal, id)?;
        if self.merge_head(repo, &scope)?.is_some() {
            return Err(failure("foreign-merge-head"));
        }
        let staged_before = self.staged(repo, &scope)?;
        if !staged_before.is_empty() {
            let mut error = failure("foreign-staged-index");
            error.detail = Some(Box::new(serde_json::json!({"stagedPaths": staged_before})));
            return Err(error);
        }
        let resolved = self.checkout_text(
            repo,
            &scope,
            &[
                "rev-parse",
                "--verify",
                &format!("{}^{{commit}}", target.as_str()),
            ],
        )?;
        if resolved != target.as_str() {
            return Err(failure("target-not-commit"));
        }
        let head = self.checkout_text(repo, &scope, &["rev-parse", "HEAD"])?;
        let head_oid = Oid::parse(&head, repo.object_format()).map_err(failure)?;
        if self.ancestry(repo, target, &head_oid)? {
            let mut receipt = info(id, &head, target.as_str(), "up-to-date", vec![], None);
            receipt.warnings = admission_warnings;
            return Ok(receipt);
        }
        let resources = checkout_resources(repo)?;
        crate::refs::admission(&wal, id, &resources)?;
        let binding = binding(handle(&scope, repo)?)?;
        let kind = OperationKind::Sync(Box::new(wal::SyncIntent {
            reference: Some(reference),
            worktree: root(repo)?.to_string_lossy().into_owned(),
            head: head.clone(),
            target: target.as_str().into(),
            message: message.into(),
        }));
        let intent = Intent {
            request_digest: wal::canonical_digest(&(&kind, writer)).map_err(failure)?,
            kind,
            repo_identity: wal.repository_identity().into(),
            resource_set: resources,
            authority_binding: binding.clone(),
            writer_identity: writer.into(),
            object_format: repo.object_format(),
            expected: Tip::Oid(head.clone()),
            next: Tip::Oid(target.as_str().into()),
        };
        let authority = Authority {
            scope: &scope,
            binding,
        };
        let chain = match wal.begin(id, intent, &authority).map_err(failure)? {
            Begin::Created(c) => c,
            _ => return Err(recovery("sync-recovery-required")),
        };
        let preparation = (|| {
            crate::refs::install_pin(self, repo, handle(&scope, repo)?, id, target)?;
            wal.append(&chain, Phase::Prepared).map_err(failure)
        })();
        let chain = match preparation {
            Ok(chain) => chain,
            Err(error) => {
                let pending = wal.inspect(id).map_err(failure)?;
                if matches!(*pending.last_state(), Phase::Intent(_) | Phase::Prepared) {
                    let terminal = wal
                        .append(&pending, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                        .map_err(failure)?;
                    self.compact_checkout(repo, &scope, &wal, &terminal)?;
                }
                return Err(error);
            }
        };
        let chain = wal
            .append(
                &chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: chain.intent().expected.clone(),
                    next: chain.intent().next.clone(),
                },
            )
            .map_err(failure)?;
        // Metadata only: preserve permission bits Git does not represent for
        // clean paths that a later hook may touch before abort.
        let mut clean_modes = std::collections::BTreeMap::new();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            for entry in paths(&self.checkout_bytes(repo, &scope, &["ls-files", "-v", "-z"])?)? {
                if entry.starts_with("S ") || entry.starts_with("s ") {
                    continue;
                }
                let path = entry[2..].to_owned();
                match fs::symlink_metadata(root(repo)?.join(&path)) {
                    Ok(m) if m.is_file() && !m.file_type().is_symlink() => {
                        clean_modes.insert(path, m.permissions().mode());
                    }
                    Ok(_) => (),
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                    Err(e) => return Err(failure(e)),
                }
            }
        }
        let out = self.checkout_call(
            repo,
            &scope,
            &[
                "merge",
                "--no-commit",
                "--no-ff",
                "--no-edit",
                "-q",
                target.as_str(),
            ],
            &[],
            false,
        )?;
        if self.merge_head(repo, &scope)?.as_deref() != Some(target.as_str()) {
            if self.merge_head(repo, &scope)?.is_some() {
                return Err(recovery("foreign-merge-head"));
            }
            let terminal = wal
                .append(
                    &chain,
                    Phase::Outcome(Outcome::CommitRejected {
                        cause: "merge-refused".into(),
                    }),
                )
                .map_err(failure)?;
            self.compact_checkout(repo, &scope, &wal, &terminal)?;
            return Err(out.error("merge-refused"));
        }
        // Store paths stay on the producer's HEAD, never in a resolver grant.
        let mut touched = self.staged(repo, &scope)?;
        touched.extend(self.unmerged(repo, &scope)?);
        touched.sort();
        touched.dedup();
        let store: Vec<_> = touched
            .into_iter()
            .filter(|p| p == ".fgos" || p.starts_with(".fgos/"))
            .collect();
        if !store.is_empty() {
            self.stage_paths(
                repo,
                &scope,
                &["restore", "--source=HEAD", "--staged", "--worktree"],
                &store,
            )?;
        }
        let conflicts = self.unmerged(repo, &scope)?;
        for p in &conflicts {
            if fgos_scope_literal(p).is_err()
                || p == ".git"
                || p.starts_with(".git/")
                || p == ".fgos"
                || p.starts_with(".fgos/")
            {
                self.abort_sync_scoped(repo, &scope, &wal, &chain)?;
                return Err(failure("unscopable-conflict-path"));
            }
        }
        let staged = self.staged(repo, &scope)?;
        let state = wal
            .append(
                &chain,
                Phase::SyncState {
                    conflicts: conflicts.clone(),
                    index_digest: self.sync_index_digest(repo, &scope, &conflicts)?,
                    clean_modes: clean_modes
                        .into_iter()
                        .filter(|(p, _)| staged.contains(p) && !conflicts.contains(p))
                        .collect(),
                    staged: staged.clone(),
                },
            )
            .map_err(failure)?;
        let mut receipt = if conflicts.is_empty() && !prepare_only {
            self.finish_sync(repo, &scope, &wal, &state)
        } else {
            Ok(info(
                id,
                &head,
                target.as_str(),
                if conflicts.is_empty() { "prepared" } else { "conflicted-open" },
                conflicts,
                None,
            ))
        }?;
        receipt.staged = staged;
        receipt.warnings.extend(admission_warnings);
        Ok(receipt)
    }
    fn sync_index_digest(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        conflicts: &[String],
    ) -> Result<String> {
        let bytes = self.checkout_bytes(repo, scope, &["ls-files", "--stage", "-z"])?;
        let mut entries = vec![];
        for record in bytes.split(|b| *b == 0).filter(|r| !r.is_empty()) {
            let tab = record
                .iter()
                .position(|b| *b == b'\t')
                .ok_or_else(|| failure("index-record-invalid"))?;
            let path = fgos_write_scope::path_text(&record[tab + 1..]).map_err(failure)?;
            if !conflicts.iter().any(|p| p == path) {
                entries.push(record.to_vec());
            }
        }
        wal::canonical_digest(&entries).map_err(failure)
    }
    pub(crate) fn unmerged(&self, repo: &RepoHandle, scope: &LockScope<'_>) -> Result<Vec<String>> {
        paths(&self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--name-only",
                "--no-relative",
                "--diff-filter=U",
                "-z",
            ],
        )?)
    }
    pub fn inspect_sync(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
    ) -> Result<SyncResult> {
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let mut scope = scope(repo, held)?;
        crate::recovery::leaf(&mut scope, repo)?;
        let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(failure)?;
        self.continue_sync_scoped(repo, &scope, &wal, writer, id, false)
    }
    pub fn continue_sync(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
    ) -> Result<SyncResult> {
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let scope = scope(repo, held)?;
        let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(failure)?;
        self.continue_sync_scoped(repo, &scope, &wal, writer, id, true)
    }
    /// Explicit commit-only retry of an observed rejection uses a new WAL id.
    /// Never replay an unknown attempt or merge again over resolver bytes.
    pub fn retry_sync_commit(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
        next_id: &str,
    ) -> Result<SyncResult> {
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let scope = scope(repo, held)?;
        let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(failure)?;
        let prior_compact = wal.compacted(id).map_err(failure)?;
        let prior_chain = if prior_compact.is_none() {
            Some(wal.inspect(id).map_err(failure)?)
        } else {
            None
        };
        let prior_request = prior_compact
            .as_ref()
            .map(|p| p.request.as_str())
            .unwrap_or_else(|| {
                prior_chain
                    .as_ref()
                    .unwrap()
                    .intent()
                    .request_digest
                    .as_str()
            });
        if let Some(next) = wal.compacted(next_id).map_err(failure)? {
            if next.request != prior_request {
                return Err(failure("operation-id-reused"));
            }
            return self.continue_sync_scoped(repo, &scope, &wal, writer, next_id, true);
        }
        if wal.known_id(next_id).map_err(failure)? {
            let next = wal.inspect(next_id).map_err(failure)?;
            if next.intent().request_digest != prior_request {
                return Err(failure("operation-id-reused"));
            }
            if !matches!(
                next.last_state(),
                Phase::Intent(_) | Phase::Prepared | Phase::TargetAttempt { .. }
            ) {
                return self
                    .continue_sync_scoped(repo, &scope, &wal, writer, next_id, true)
                    .map_err(|mut e| {
                        e.operation_id = Some(next_id.into());
                        e
                    });
            }
        }
        let state = self.continue_sync_scoped(repo, &scope, &wal, writer, id, false)?;
        if state.state != "rejected-open" {
            return Err(failure("sync-observed-rejection-required"));
        }
        let prior = prior_chain.ok_or_else(|| failure("sync-observed-rejection-required"))?;
        if !matches!(prior.outcome(), Some(Outcome::CommitRejected { cause }) if ["commit-rejected", "hook-refused", "hook-rejected"].contains(&cause.as_str()))
        {
            return Err(recovery("sync-commit-effect-unknown"));
        }
        let recorded = prior
            .records()
            .iter()
            .find_map(|r| match &r.phase {
                state @ Phase::SyncState { .. } => Some(state.clone()),
                _ => None,
            })
            .ok_or_else(|| recovery("sync-state-recovery-required"))?;
        let authority = Authority {
            scope: &scope,
            binding: binding(handle(&scope, repo)?)?,
        };
        let mut next = if wal.known_id(next_id).map_err(failure)? {
            let next = wal.inspect(next_id).map_err(failure)?;
            if next.intent() != prior.intent() {
                return Err(failure("operation-id-reused"));
            }
            if !matches!(
                next.last_state(),
                Phase::Intent(_) | Phase::Prepared | Phase::TargetAttempt { .. }
            ) {
                return self
                    .continue_sync_scoped(repo, &scope, &wal, writer, next_id, true)
                    .map_err(|mut e| {
                        e.operation_id = Some(next_id.into());
                        e
                    });
            }
            next
        } else {
            match wal
                .begin(next_id, prior.intent().clone(), &authority)
                .map_err(failure)?
            {
                Begin::Created(c) => c,
                _ => return Err(recovery("sync-recovery-required")),
            }
        };
        if matches!(next.last_state(), Phase::Intent(_)) {
            crate::refs::install_pin(
                self,
                repo,
                handle(&scope, repo)?,
                next_id,
                &Oid::parse(&state.target, repo.object_format()).map_err(failure)?,
            )?;
            next = wal.append(&next, Phase::Prepared).map_err(failure)?;
        }
        if matches!(next.last_state(), Phase::Prepared) {
            next = wal
                .append(
                    &next,
                    Phase::TargetAttempt {
                        prior_target_attempt: None,
                        expected: next.intent().expected.clone(),
                        next: next.intent().next.clone(),
                    },
                )
                .map_err(failure)?;
        }
        next = wal.append(&next, recorded).map_err(failure)?;
        self.finish_sync(repo, &scope, &wal, &next)
            .map_err(|mut e| {
                e.operation_id = Some(next_id.into());
                e
            })
    }
    pub(crate) fn continue_sync_scoped(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        writer: &str,
        id: &str,
        finish: bool,
    ) -> Result<SyncResult> {
        if let Some(compact) = wal.compacted(id).map_err(failure)? {
            let intent = Intent {
                kind: OperationKind::Sync(Box::new(wal::SyncIntent {
                    reference: compact.reference.clone(),
                    worktree: root(repo)?.to_string_lossy().into(),
                    head: compact.expected.clone(),
                    target: compact.next.clone(),
                    message: String::new(),
                })),
                request_digest: compact.request.clone(),
                repo_identity: wal.repository_identity().into(),
                resource_set: checkout_resources(repo)?,
                authority_binding: binding(handle(scope, repo)?)?,
                writer_identity: writer.into(),
                object_format: repo.object_format(),
                expected: Tip::Oid(compact.expected.clone()),
                next: Tip::Oid(compact.next.clone()),
            };
            if !compact_matches(&compact, &intent, repo)? {
                return Err(failure("sync-authority-mismatch"));
            }
            let outcome = compact.outcome().map_err(failure)?;
            if let Outcome::CommitRejected { cause } = &outcome {
                if cause == "foreign-checkout-effect-unknown" {
                    return Err(recovery(cause));
                }
            }
            let state = match &outcome {
                Outcome::Commit { .. } => "done",
                Outcome::CommitRejected { cause } if cause == "merged-outside" => "done",
                Outcome::CommitRejected { cause } => cause.as_str(),
                Outcome::AbandonedBeforeAttempt => "not-started",
                _ => "lost",
            }
            .to_owned();
            let commit = match outcome {
                Outcome::Commit {
                    observed,
                    contract_violation,
                } => Some(CommitResult {
                    warnings: vec![],
                    status: if contract_violation {
                        ResultCode::CommittedButContractViolation
                    } else {
                        ResultCode::Committed
                    },
                    files: paths(&self.checkout_bytes(
                        repo,
                        scope,
                        &[
                            "diff",
                            "--name-only",
                            "--no-renames",
                            "-z",
                            &compact.expected,
                            &observed,
                        ],
                    )?)?,
                    oid: Some(Oid::parse(&observed, repo.object_format()).map_err(failure)?),
                    operation_id: id.into(),
                    pre_existing_in_scope: vec![],
                }),
                _ => None,
            };
            return Ok(info(
                id,
                &compact.expected,
                &compact.next,
                &state,
                vec![],
                commit,
            ));
        }
        let chain = wal.inspect(id).map_err(failure)?;
        let OperationKind::Sync(payload) = &chain.intent().kind else {
            return Err(failure("not-sync-operation"));
        };
        let wal::SyncIntent {
            worktree,
            head,
            target,
            ..
        } = payload.as_ref();
        if (chain.intent().resource_set != checkout_resources(repo)?
            && chain.intent().resource_set != vec![format!("worktree:{}", root(repo)?.display())])
            || *worktree != root(repo)?.to_string_lossy()
            || chain.intent().writer_identity != writer
            || chain.intent().authority_binding != binding(handle(scope, repo)?)?
        {
            return Err(failure("sync-authority-mismatch"));
        }
        if let Some(Outcome::CommitRejected { cause }) = chain.outcome() {
            if cause == "foreign-checkout-effect-unknown" {
                return Err(recovery(cause));
            }
        }
        let now = self.checkout_text(repo, scope, &["rev-parse", "HEAD"])?;
        let merge = self.merge_head(repo, scope)?;
        if let Some(Outcome::Commit {
            observed,
            contract_violation,
        }) = chain.outcome()
        {
            return Ok(info(
                id,
                head,
                target,
                "done",
                vec![],
                Some(CommitResult {
                    warnings: vec![],
                    status: if *contract_violation {
                        ResultCode::CommittedButContractViolation
                    } else {
                        ResultCode::Committed
                    },
                    oid: Some(Oid::parse(observed, repo.object_format()).map_err(failure)?),
                    files: paths(&self.checkout_bytes(
                        repo,
                        scope,
                        &["diff", "--name-only", "--no-renames", "-z", head, observed],
                    )?)?,
                    operation_id: id.into(),
                    pre_existing_in_scope: vec![],
                }),
            ));
        }
        if chain.outcome().is_some() {
            if merge.is_some() {
                // A rejected commit can leave our merge open. A terminal
                // refusal is not evidence that no checkout effect remains.
                if let Some(Outcome::CommitRejected { cause }) = chain.outcome() {
                    if (["hook-rejected", "hook-refused", "commit-rejected", "sync-commit-effect-unknown"].contains(&cause.as_str()))
                        && merge.as_ref() == Some(target)
                        && &now == head
                    {
                        let conflicts = chain
                            .records()
                            .iter()
                            .find_map(|r| match &r.phase {
                                Phase::SyncState { conflicts, .. } => Some(conflicts.clone()),
                                _ => None,
                            })
                            .unwrap_or_default();
                        return Ok(info(id, head, target, "rejected-open", conflicts, None));
                    }
                }
                return Err(recovery("sync-rejected-merge-recovery-required"));
            }
            let state = match chain.outcome() {
                Some(Outcome::CommitRejected { cause }) if cause == "merged-outside" => "done",
                Some(Outcome::CommitRejected { cause }) => cause.as_str(),
                Some(Outcome::AbandonedBeforeAttempt) => "not-started",
                _ => "lost",
            };
            return Ok(info(id, head, target, state, vec![], None));
        }
        // A commit may have moved HEAD and then died before its receipt.
        // Never infer a safe retry from HEAD equality (including ABA).
        if let Phase::SyncCommitAttempt { .. } = chain.last_state() {
            let current_reference =
                self.checkout_text(repo, scope, &["symbolic-ref", "-q", "HEAD"])?;
            let reference = payload
                .reference
                .as_ref()
                .ok_or_else(|| recovery("sync-reference-unrecorded"))?;
            if reference != &current_reference {
                return Err(recovery("checkout-reference-changed"));
            }
            fgos_holder_lock::validate_quiescent(handle(scope, repo)?).map_err(failure)?;
            match fs::symlink_metadata(repo.git_dir.join("index.lock")) {
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                Ok(_) => return Err(recovery(crate::native_lock::UNOWNED_INDEX_LOCK)),
                Err(e) => return Err(failure(e)),
            }
            let reference = self.checkout_text(repo, scope, &["symbolic-ref", "-q", "HEAD"])?;
            let outcome = if let Some((observed, contract_violation)) =
                self.observe_checkout_commit(repo, scope, wal, &chain)?
            {
                crate::refs::sync_refs(repo, &RefName::parse(&reference).map_err(failure)?)?;
                Outcome::Commit {
                    observed,
                    contract_violation,
                }
            } else if &now == head {
                Outcome::CommitRejected {
                    cause: "sync-commit-effect-unknown".into(),
                }
            } else {
                return Err(recovery("sync-commit-attempt-recovery-required"));
            };
            let terminal = wal
                .append(&chain, Phase::Outcome(outcome))
                .map_err(failure)?;
            let warnings = if merge.is_none() {
                self.compact_checkout_warning(repo, scope, wal, &terminal)
            } else {
                vec![]
            };
            let mut receipt = self.continue_sync_scoped(repo, scope, wal, writer, id, false)?;
            receipt.warnings.extend(warnings);
            return Ok(receipt);
        }
        if merge.is_none() {
            fgos_holder_lock::validate_quiescent(handle(scope, repo)?).map_err(failure)?;
            if matches!(chain.last_state(), Phase::TargetAttempt { .. })
                && &now == head
                && self.staged(repo, scope)?.is_empty()
                && self.unmerged(repo, scope)?.is_empty()
            {
                match fs::symlink_metadata(repo.git_dir.join("index.lock")) {
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                    Ok(_) => return Err(recovery(crate::native_lock::UNOWNED_INDEX_LOCK)),
                    Err(e) => return Err(failure(e)),
                }
                let terminal = wal
                    .append(
                        &chain,
                        Phase::Outcome(Outcome::CommitRejected {
                            cause: "merge-effect-unknown".into(),
                        }),
                    )
                    .map_err(failure)?;
                let mut receipt = info(id, head, target, "merge-effect-unknown", vec![], None);
                receipt.warnings = self.compact_checkout_warning(repo, scope, wal, &terminal);
                return Ok(receipt);
            }
            if matches!(chain.last_state(), Phase::Intent(_) | Phase::Prepared) {
                let terminal = wal
                    .append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                    .map_err(failure)?;
                let mut receipt = info(id, head, target, "not-started", vec![], None);
                receipt.warnings = self.compact_checkout_warning(repo, scope, wal, &terminal);
                return Ok(receipt);
            }
            if self.ancestry(
                repo,
                &Oid::parse(target, repo.object_format()).map_err(failure)?,
                &Oid::parse(&now, repo.object_format()).map_err(failure)?,
            )? {
                let terminal = wal.append(&chain, Phase::Outcome(Outcome::CommitRejected {cause:"merged-outside".into()})).map_err(failure)?;
                let mut receipt = info(id, head, target, "done", vec![], None);
                receipt.warnings = self.compact_checkout_warning(repo, scope, wal, &terminal);
                return Ok(receipt);
            }
            if &now == head {
                let terminal = wal.append(&chain, Phase::Outcome(Outcome::CommitRejected {cause:"conflict-aborted".into()})).map_err(failure)?;
                let mut receipt = info(id, head, target, "not-started", vec![], None);
                receipt.warnings = self.compact_checkout_warning(repo, scope, wal, &terminal);
                return Ok(receipt);
            }
            return Ok(info(
                id,
                head,
                target,
                if &now == head { "not-started" } else { "lost" },
                vec![],
                None,
            ));
        }
        if merge.as_ref() != Some(target) || &now != head {
            return Err(failure("foreign-merge-head"));
        }
        let conflicts = match chain.last_state() {
            Phase::SyncState { conflicts, .. } => conflicts.clone(),
            Phase::TargetAttempt { .. } if !finish => {
                return Ok(info(
                    id,
                    head,
                    target,
                    "in-progress",
                    self.unmerged(repo, scope)?,
                    None,
                ))
            }
            _ => return Err(recovery("sync-state-recovery-required")),
        };
        if finish {
            self.finish_sync(repo, scope, wal, &chain)
        } else {
            let mut receipt = info(id, head, target, "in-progress", conflicts, None);
            receipt.staged = self.staged(repo, scope)?;
            Ok(receipt)
        }
    }
    fn finish_sync(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        chain: &wal::Chain,
    ) -> Result<SyncResult> {
        let OperationKind::Sync(payload) = &chain.intent().kind else {
            return Err(failure("not-sync-operation"));
        };
        let wal::SyncIntent {
            head,
            target,
            message,
            ..
        } = payload.as_ref();
        let Phase::SyncState {
            conflicts,
            staged,
            index_digest,
            ..
        } = chain.last_state()
        else {
            return Err(recovery("sync-state-recovery-required"));
        };
        if self.sync_index_digest(repo, scope, conflicts)? != *index_digest {
            let mut error = failure("sync-index-changed");
            let unexpected: Vec<_> = self.staged(repo, scope)?.into_iter().filter(|p| !staged.contains(p) && !conflicts.contains(p)).collect();
            error.detail = Some(Box::new(serde_json::json!({"unexpected":unexpected})));
            return Err(error);
        }
        let mut marked = vec![];
        for p in conflicts {
            let path = root(repo)?.join(p);
            match fs::symlink_metadata(&path) {
                Ok(m) if m.is_file() => {
                    if has_conflict_markers(&fs::read(path).map_err(failure)?) { marked.push(p.clone()); }
                }
                Ok(_) => (),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                Err(e) => return Err(failure(e)),
            }
        }
        if !marked.is_empty() {
            let mut error = failure("conflict-markers");
            error.detail = Some(Box::new(serde_json::json!({"paths": marked})));
            return Err(error);
        }
        let mut allowed = staged.clone();
        allowed.extend(conflicts.clone());
        allowed.sort();
        allowed.dedup();
        if self
            .staged(repo, scope)?
            .iter()
            .any(|p| !allowed.contains(p))
        {
            return Err(failure("foreign-staged-index"));
        }
        let before = self.staged(repo, scope)?;
        self.stage_paths(repo, scope, &["add", "-A"], conflicts)?;
        if !self.unmerged(repo, scope)?.is_empty() {
            return Err(failure("staged-set-mismatch"));
        }
        let actual_staged = self.staged(repo, scope)?;
        let unexpected: Vec<_> = actual_staged.iter().filter(|p| !allowed.contains(p)).cloned().collect();
        if !unexpected.is_empty() {
            let own: Vec<_> = unexpected.iter().filter(|p| !before.contains(p)).cloned().collect();
            self.stage_paths(repo, scope, &["reset", "-q", "HEAD"], &own)?;
            let mut error = failure("staged-set-mismatch");
            error.detail = Some(Box::new(serde_json::json!({"unexpected": unexpected})));
            return Err(error);
        }
        let tree = self.checkout_text(repo, scope, &["write-tree"])?;
        let attempted = wal
            .append(chain, Phase::SyncCommitAttempt { tree: tree.clone() })
            .map_err(failure)?;
        let out = self.checkout_call(
            repo,
            scope,
            &[
                "-c",
                "core.fsync=all",
                "commit",
                "-q",
                "--cleanup=verbatim",
                "-F",
                "-",
            ],
            message.as_bytes(),
            true,
        )?;
        let observed = self.checkout_text(repo, scope, &["rev-parse", "HEAD"])?;
        if &observed == head {
            if !out.success {
                let error = self.checkout_commit_failure(repo, scope, out)?;
                wal.append(&attempted, Phase::Outcome(Outcome::CommitRejected { cause: error.cause.clone() }))
                    .map_err(failure)?;
                return Err(error);
            }
            return Err(recovery("sync-commit-effect-unknown"));
        }
        let parents =
            self.checkout_text(repo, scope, &["rev-list", "--parents", "-n", "1", "HEAD"])?;
        let files = paths(&self.checkout_bytes(
            repo,
            scope,
            &["diff", "--name-only", "--no-renames", "-z", head, &observed],
        )?)?;
        let violation = !out.success
            || parents.split_whitespace().skip(1).collect::<Vec<_>>()
                != vec![head.as_str(), target.as_str()]
            || self.checkout_text(repo, scope, &["rev-parse", "HEAD^{tree}"])? != tree
            || files != actual_staged;
        let reference = self.checkout_text(repo, scope, &["symbolic-ref", "-q", "HEAD"])?;
        crate::refs::sync_refs(repo, &RefName::parse(&reference).map_err(failure)?)?;
        let terminal = wal
            .append(
                &attempted,
                Phase::Outcome(Outcome::Commit {
                    observed: observed.clone(),
                    contract_violation: violation,
                }),
            )
            .map_err(failure)?;
        let warnings = self.compact_checkout_warning(repo, scope, wal, &terminal);
        let mut receipt = info(
            &chain.last().operation_id,
            head,
            target,
            "done",
            vec![],
            Some(CommitResult {
                warnings: vec![],
                status: if violation {
                    ResultCode::CommittedButContractViolation
                } else {
                    ResultCode::Committed
                },
                oid: Some(Oid::parse(&observed, repo.object_format()).map_err(failure)?),
                files,
                operation_id: chain.last().operation_id.clone(),
                pre_existing_in_scope: vec![],
            }),
        );
        receipt.warnings = warnings;
        receipt.staged = actual_staged.clone();
        receipt.unexpected = receipt.commit.as_ref().unwrap().files.iter().filter(|p| !actual_staged.contains(p)).cloned().collect();
        receipt.missing = actual_staged.iter().filter(|p| !receipt.commit.as_ref().unwrap().files.contains(p)).cloned().collect();
        Ok(receipt)
    }
    pub fn abort_sync(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
    ) -> Result<SyncResult> {
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let scope = scope(repo, held)?;
        let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(failure)?;
        let state = self.continue_sync_scoped(repo, &scope, &wal, writer, id, false)?;
        if state.state == "done"
            || state.state == "not-started"
            || state.state == "conflict-aborted"
        {
            return Ok(state);
        }
        if state.state != "in-progress" && state.state != "rejected-open" {
            return Err(failure("sync-merge-lost"));
        }
        let chain = wal.inspect(id).map_err(failure)?;
        let warnings = self.abort_sync_scoped(repo, &scope, &wal, &chain)?;
        let mut receipt = info(
            id,
            &state.head,
            &state.target,
            "conflict-aborted",
            vec![],
            None,
        );
        receipt.warnings = warnings;
        Ok(receipt)
    }
    fn abort_sync_scoped(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        chain: &wal::Chain,
    ) -> Result<Vec<String>> {
        let OperationKind::Sync(payload) = &chain.intent().kind else {
            return Err(failure("not-sync-operation"));
        };
        let wal::SyncIntent { head, target, .. } = payload.as_ref();
        if self.merge_head(repo, scope)?.as_ref() != Some(target)
            || self.checkout_text(repo, scope, &["rev-parse", "HEAD"])? != *head
        {
            return Err(failure("foreign-merge-head"));
        }
        let mut owned = self.staged(repo, scope)?;
        owned.extend(self.unmerged(repo, scope)?);
        owned.sort();
        owned.dedup();
        let recorded = chain.records().iter().find_map(|r| match &r.phase {
            Phase::SyncState {
                conflicts, staged, ..
            } => Some((conflicts, staged)),
            _ => None,
        });
        if let Some((conflicts, staged)) = recorded {
            if owned
                .iter()
                .any(|p| !conflicts.contains(p) && !staged.contains(p))
            {
                return Err(failure("foreign-staged-index"));
            }
        }
        // Preserve resolver bytes only on recorded conflict paths. All clean
        // merge paths came from the target; Git refused to overwrite local dirt.
        let conflicts = recorded.map(|(c, _)| c.clone()).unwrap_or_default();
        let clean: Vec<_> = owned
            .iter()
            .filter(|p| !conflicts.contains(p))
            .cloned()
            .collect();
        let modes = chain.records().iter().find_map(|r| match &r.phase {
            Phase::SyncState { clean_modes, .. } => Some(clean_modes),
            _ => None,
        });
        let mut failed = false;
        for p in &clean {
            failed |= self
                .stage_paths(
                    repo,
                    scope,
                    &["restore", "--source=HEAD", "--staged", "--worktree"],
                    std::slice::from_ref(p),
                )
                .is_err();
        }
        #[cfg(unix)]
        if let Some(modes) = modes {
            use std::os::unix::fs::PermissionsExt;
            for (p, mode) in modes {
                let path = root(repo)?.join(p);
                if fs::symlink_metadata(&path)
                    .is_ok_and(|m| m.is_file() && !m.file_type().is_symlink())
                {
                    failed |= fs::set_permissions(path, fs::Permissions::from_mode(*mode)).is_err();
                } else {
                    failed = true;
                }
            }
        }
        #[cfg(not(unix))]
        let _ = modes;
        failed |= self
            .stage_paths(repo, scope, &["reset", "-q", "HEAD"], &conflicts)
            .is_err();
        if failed {
            return Err(recovery("commit-worktree-restore-required"));
        }
        self.checkout_bytes(repo, scope, &["merge", "--quit"])?;
        let terminal = if chain.outcome().is_some() {
            chain.clone()
        } else {
            wal.append(
                chain,
                Phase::Outcome(Outcome::CommitRejected {
                    cause: "conflict-aborted".into(),
                }),
            )
            .map_err(failure)?
        };
        Ok(self.compact_checkout_warning(repo, scope, wal, &terminal))
    }
}
pub fn has_conflict_markers(bytes: &[u8]) -> bool {
    if bytes.contains(&0) {
        return false;
    }
    bytes.split(|b| *b == b'\n').any(|line| {
        let Some(first @ (b'<' | b'>' | b'|')) = line.first() else {
            return false;
        };
        let n = line.iter().take_while(|b| *b == first).count();
        n >= 7 && line.get(n).is_none_or(u8::is_ascii_whitespace)
    })
}
