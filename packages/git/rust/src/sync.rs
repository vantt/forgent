//! Operation-owned sync of a pinned commit into a producer under continuous custody.
use crate::{
    refs::{failure, recovery, Authority},
    scoped_commit::{binding, handle, paths, root, scope},
    wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal},
    *,
};
use fgos_holder_lock::{BorrowedHandle, LockScope};
use serde::Serialize;
use std::fs;
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub state: String,
    pub operation_id: String,
    pub head: String,
    pub target: String,
    pub resolver_grant: Vec<String>,
    pub commit: Option<CommitResult>,
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
        if root(repo)? == repo.trusted_main_root() {
            return Err(failure("sync-linked-worktree-required"));
        }
        if message.is_empty() || message.contains('\0') || message.len() > 1024 * 1024 {
            return Err(failure("invalid-commit-message"));
        }
        let scope = scope(repo, held)?;
        let wal = Wal::open(repo).map_err(failure)?;
        if wal.known_id(id).map_err(failure)? {
            let previous = wal.inspect(id).map_err(failure)?;
            match &previous.intent().kind {
                OperationKind::Sync(payload)
                    if payload.target == target.as_str() && payload.message == message => {}
                _ => return Err(failure("operation-id-reused")),
            }
            return self.continue_sync_scoped(repo, &scope, &wal, writer, id, false);
        }
        if self.merge_head(repo, &scope)?.is_some() {
            return Err(failure("foreign-merge-head"));
        }
        if !self.staged(repo, &scope)?.is_empty() {
            return Err(failure("foreign-staged-index"));
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
            return Ok(info(id, &head, target.as_str(), "up-to-date", vec![], None));
        }
        let resources = vec![format!("worktree:{}", root(repo)?.display())];
        crate::refs::admission(&wal, id, &resources)?;
        let binding = binding(handle(&scope, repo)?)?;
        let kind = OperationKind::Sync(Box::new(wal::SyncIntent {
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
        crate::refs::install_pin(self, repo, handle(&scope, repo)?, id, target)?;
        let chain = wal.append(&chain, Phase::Prepared).map_err(failure)?;
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
            crate::refs::release_pin(self, repo, handle(&scope, repo)?, &wal, &terminal)?;
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
                    staged,
                },
            )
            .map_err(failure)?;
        if conflicts.is_empty() {
            self.finish_sync(repo, &scope, &wal, &state)
        } else {
            Ok(info(
                id,
                &head,
                target.as_str(),
                "conflicted-open",
                conflicts,
                None,
            ))
        }
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
        let scope = scope(repo, held)?;
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
        let scope = scope(repo, held)?;
        let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(failure)?;
        self.continue_sync_scoped(repo, &scope, &wal, writer, id, true)
    }
    fn continue_sync_scoped(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        writer: &str,
        id: &str,
        finish: bool,
    ) -> Result<SyncResult> {
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
        if *worktree != root(repo)?.to_string_lossy()
            || chain.intent().writer_identity != writer
            || chain.intent().authority_binding != binding(handle(scope, repo)?)?
        {
            return Err(failure("sync-authority-mismatch"));
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
                    status: if *contract_violation {
                        ResultCode::CommittedButContractViolation
                    } else {
                        ResultCode::Committed
                    },
                    oid: Some(Oid::parse(observed, repo.object_format()).map_err(failure)?),
                    files: paths(&self.checkout_bytes(repo, scope, &[
                        "diff", "--name-only", "--no-renames", "-z", head, observed,
                    ])?)?,
                    operation_id: id.into(),
                }),
            ));
        }
        if chain.outcome().is_some() {
            if merge.is_some() {
                // A rejected commit can leave our merge open. A terminal
                // refusal is not evidence that no checkout effect remains.
                return Err(recovery("sync-rejected-merge-recovery-required"));
            }
            return Ok(info(id, head, target, "not-started", vec![], None));
        }
        // A commit may have moved HEAD and then died before its receipt.
        // Never infer a safe retry from HEAD equality (including ABA).
        if matches!(chain.last().phase, Phase::SyncCommitAttempt { .. }) {
            return Err(recovery("sync-commit-attempt-recovery-required"));
        }
        if merge.is_none() {
            if self.ancestry(
                repo,
                &Oid::parse(target, repo.object_format()).map_err(failure)?,
                &Oid::parse(&now, repo.object_format()).map_err(failure)?,
            )? {
                return Ok(info(id, head, target, "done", vec![], None));
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
        let conflicts = match &chain.last().phase {
            Phase::SyncState { conflicts, .. } => conflicts.clone(),
            _ => return Err(recovery("sync-state-recovery-required")),
        };
        if finish {
            self.finish_sync(repo, scope, wal, &chain)
        } else {
            Ok(info(id, head, target, "in-progress", conflicts, None))
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
        } = &chain.last().phase
        else {
            return Err(recovery("sync-state-recovery-required"));
        };
        if self.sync_index_digest(repo, scope, conflicts)? != *index_digest {
            return Err(failure("sync-index-changed"));
        }
        for p in conflicts {
            let path = root(repo)?.join(p);
            match fs::symlink_metadata(&path) {
                Ok(m) if m.is_file() => {
                    let bytes = fs::read(path).map_err(failure)?;
                    if has_conflict_markers(&bytes) {
                        return Err(failure(format!("conflict-markers: {p}")));
                    }
                }
                Ok(_) => (),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                Err(e) => return Err(failure(e)),
            }
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
        self.stage_paths(repo, scope, &["add", "-A"], conflicts)?;
        if !self.unmerged(repo, scope)?.is_empty() {
            return Err(failure("staged-set-mismatch"));
        }
        let actual_staged = self.staged(repo, scope)?;
        if actual_staged.iter().any(|p| !allowed.contains(p)) {
            return Err(failure("staged-set-mismatch"));
        }
        let tree = self.checkout_text(repo, scope, &["write-tree"])?;
        let attempted = wal.append(chain, Phase::SyncCommitAttempt { tree: tree.clone() }).map_err(failure)?;
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
                // Keep the attempted chain and target pin while the merge is
                // open; a hook refusal does not erase its checkout effects.
                return Err(out.error("hook-rejected"));
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
        crate::refs::release_pin(self, repo, handle(scope, repo)?, wal, &terminal)?;
        Ok(info(
            &chain.last().operation_id,
            head,
            target,
            "done",
            vec![],
            Some(CommitResult {
                status: if violation {
                    ResultCode::CommittedButContractViolation
                } else {
                    ResultCode::Committed
                },
                oid: Some(Oid::parse(&observed, repo.object_format()).map_err(failure)?),
                files,
                operation_id: chain.last().operation_id.clone(),
            }),
        ))
    }
    pub fn abort_sync(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
    ) -> Result<SyncResult> {
        let scope = scope(repo, held)?;
        let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(failure)?;
        let state = self.continue_sync_scoped(repo, &scope, &wal, writer, id, false)?;
        if state.state == "done" || state.state == "not-started" {
            return Ok(state);
        }
        if state.state != "in-progress" {
            return Err(failure("sync-merge-lost"));
        }
        let chain = wal.inspect(id).map_err(failure)?;
        self.abort_sync_scoped(repo, &scope, &wal, &chain)?;
        Ok(info(
            id,
            &state.head,
            &state.target,
            "conflict-aborted",
            vec![],
            None,
        ))
    }
    fn abort_sync_scoped(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        chain: &wal::Chain,
    ) -> Result<()> {
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
        if let Phase::SyncState {
            conflicts, staged, ..
        } = &chain.last().phase
        {
            if owned
                .iter()
                .any(|p| !conflicts.contains(p) && !staged.contains(p))
            {
                return Err(failure("foreign-staged-index"));
            }
        }
        // Reset only index entries. Worktree bytes, including resolver edits, survive.
        self.stage_paths(repo, scope, &["reset", "-q"], &owned)?;
        self.checkout_bytes(repo, scope, &["merge", "--quit"])?;
        let terminal = wal
            .append(
                chain,
                Phase::Outcome(Outcome::CommitRejected {
                    cause: "conflict-aborted".into(),
                }),
            )
            .map_err(failure)?;
        crate::refs::release_pin(self, repo, handle(scope, repo)?, wal, &terminal)
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
