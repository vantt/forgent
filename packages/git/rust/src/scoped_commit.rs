//! Exact, custody-backed commit transaction. Hooks run once, via Git.
use crate::{
    driver::{Output, Policy},
    refs::{failure, recovery, Authority},
    wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal},
    *,
};
use fgos_holder_lock::{BorrowedHandle, Handle, LockScope, Wait};
use serde::{Deserialize, Serialize};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    path::Path,
    time::Duration,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CutoverGrant {
    pub exact_paths: Vec<String>,
    pub legacy_ref_oid: String,
    pub seal_digest: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CommitRequest {
    pub writes: Vec<String>,
    pub message: String,
    pub cutover_grant: Option<CutoverGrant>,
}
/// Capture before producer launch. Keep this value for commit-only retry.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CommitBaseline {
    pub head: String,
    pub reference: String,
    pub worktree: String,
    pub authority: String,
    pub dirty: Vec<(String, String)>,
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitResult {
    pub status: ResultCode,
    pub oid: Option<Oid>,
    pub files: Vec<String>,
    pub operation_id: String,
    pub pre_existing_in_scope: Vec<String>,
}
pub(crate) fn paths(bytes: &[u8]) -> Result<Vec<String>> {
    bytes
        .split(|b| *b == 0)
        .filter(|p| !p.is_empty())
        .map(|p| {
            fgos_write_scope::path_text(p)
                .map(str::to_owned)
                .map_err(failure)
        })
        .collect()
}
pub(crate) fn root(repo: &RepoHandle) -> Result<&Path> {
    repo.work_tree
        .as_deref()
        .ok_or_else(|| failure("checkout-required"))
}
pub(crate) fn scope<'a>(repo: &RepoHandle, held: Vec<BorrowedHandle<'a>>) -> Result<LockScope<'a>> {
    require_lock_scope_platform()?;
    let mut scope = LockScope::seeded(held).map_err(failure)?;
    if scope
        .holding()
        .map_err(failure)?
        .iter()
        .any(|h| h.rank >= 55)
    {
        return Err(failure("lock-order-violation"));
    }
    if root(repo)? == repo.trusted_main_root() {
        if scope.handle("dispatch-cwd").is_some() {
            return Err(failure("git-dual-borrow-unavailable"));
        }
        if let Some(h) = scope.handle("main-checkout") {
            if h.path()
                != repo
                    .trusted_main_root()
                    .join(".fgos/locks/main-checkout.lock")
            {
                return Err(failure("main-checkout-authority-mismatch"));
            }
        } else {
            scope
                .acquire(
                    "main-checkout",
                    &BTreeMap::from([(
                        "fgosDir".into(),
                        repo.trusted_main_root()
                            .join(".fgos")
                            .to_string_lossy()
                            .into_owned(),
                    )]),
                    Wait::Ms(5000),
                )
                .map_err(failure)?;
        }
    } else {
        let lease = scope
            .handle("dispatch-cwd")
            .ok_or_else(|| failure("checkout-custody-required"))?;
        #[cfg(unix)]
        if lease.path() != crate::refs::custody_lock_path(repo, root(repo)?)? {
            return Err(failure("checkout-custody-stale"));
        }
    }
    Ok(scope)
}
pub(crate) fn handle<'a>(scope: &'a LockScope<'_>, repo: &RepoHandle) -> Result<&'a Handle> {
    scope.validate().map_err(failure)?;
    scope
        .handle(if root(repo)? == repo.trusted_main_root() {
            "main-checkout"
        } else {
            "dispatch-cwd"
        })
        .ok_or_else(|| failure("checkout-authority-required"))
}
pub(crate) fn binding(handle: &Handle) -> Result<String> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let m = fs::metadata(handle.path()).map_err(failure)?;
        Ok(format!("{}:{}", m.dev(), m.ino()))
    }
    #[cfg(not(unix))]
    {
        let _ = handle;
        Err(failure("git-lockscope-unavailable-windows"))
    }
}
impl GitDriver {
    /// Admission uses Publication's terminal ledger and never scans compacted
    /// history. Interrupted pre-attempt work has no ref effect to replay.
    pub(crate) fn admit_checkout(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        id: &str,
    ) -> Result<()> {
        let resources = vec![format!("worktree:{}", root(repo)?.display())];
        for mut chain in wal.retained(100_000).map_err(failure)? {
            if chain.last().operation_id == id
                || !chain
                    .intent()
                    .resource_set
                    .iter()
                    .any(|r| resources.contains(r))
            {
                continue;
            }
            if !matches!(
                chain.intent().kind,
                OperationKind::ScopedCommit(_) | OperationKind::Sync(_)
            ) {
                continue;
            }
            wal::PublicationAuthority::validate_publication_borrow(
                &Authority {
                    scope,
                    binding: binding(handle(scope, repo)?)?,
                },
                chain.intent(),
            )
            .map_err(failure)?;
            if chain.outcome().is_none()
                && matches!(chain.last().phase, Phase::Intent(_) | Phase::Prepared)
            {
                fgos_holder_lock::validate_quiescent(handle(scope, repo)?).map_err(failure)?;
                if let OperationKind::ScopedCommit(payload) = &chain.intent().kind {
                    let baseline: CommitBaseline =
                        serde_json::from_str(&payload.baseline).map_err(failure)?;
                    if self.checkout_text(repo, scope, &["rev-parse", "HEAD"])? == baseline.head
                        && self.staged(repo, scope)? == payload.paths
                    {
                        self.stage_paths(repo, scope, &["reset", "-q", "HEAD"], &payload.paths)?;
                    }
                }
                chain = wal
                    .append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                    .map_err(failure)?;
            }
            if chain.outcome().is_some() {
                self.compact_checkout(repo, scope, wal, &chain)?;
            }
        }
        crate::refs::admission(wal, id, &resources)
    }
    pub(crate) fn compact_checkout(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        chain: &wal::Chain,
    ) -> Result<()> {
        if chain.outcome().is_none() {
            return Ok(());
        }
        let mut terminal = wal.inspect(&chain.last().operation_id).map_err(failure)?;
        wal::PublicationAuthority::validate_publication_borrow(
            &Authority {
                scope,
                binding: binding(handle(scope, repo)?)?,
            },
            terminal.intent(),
        )
        .map_err(failure)?;
        if matches!(chain.intent().kind, OperationKind::Sync(_)) {
            // A rejected commit still owns the merge until abort.
            if self.merge_head(repo, scope)?.is_some() {
                return Err(recovery("sync-rejected-merge-recovery-required"));
            }
            crate::refs::release_pin(self, repo, handle(scope, repo)?, wal, &terminal)?;
            terminal = wal.inspect(&chain.last().operation_id).map_err(failure)?;
        }
        let authority = Authority {
            scope,
            binding: binding(handle(scope, repo)?)?,
        };
        wal.compact(&terminal, &WalReader { driver: self, repo }, &authority)
            .map_err(failure)?;
        Ok(())
    }
    /// Explicit observe-only recovery. Custody excludes a live cooperative
    /// performer; native index residue or ambiguous HEAD preserves the attempt.
    pub fn recover_scoped_commit(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        writer: &str,
        id: &str,
    ) -> Result<Outcome> {
        let scope = scope(repo, held)?;
        let wal = Wal::open(repo).map_err(failure)?;
        if let Some(compact) = wal.compacted(id).map_err(failure)? {
            let intent = Intent {
                kind: OperationKind::ScopedCommit(Box::new(wal::ScopedCommitIntent {
                    worktree: root(repo)?.to_string_lossy().into(),
                    baseline: String::new(),
                    request: String::new(),
                    paths: vec![],
                    tree: compact.expected.clone(),
                    cutover_grant: None,
                })),
                request_digest: compact.request.clone(),
                repo_identity: wal.repository_identity().into(),
                resource_set: vec![format!("worktree:{}", root(repo)?.display())],
                authority_binding: binding(handle(&scope, repo)?)?,
                writer_identity: writer.into(),
                object_format: repo.object_format(),
                expected: Tip::Oid(compact.expected.clone()),
                next: Tip::Oid(compact.next.clone()),
            };
            if !compact.matches(&intent).map_err(failure)? {
                return Err(failure("commit-authority-mismatch"));
            }
            return compact.outcome().map_err(failure);
        }
        let chain = wal.inspect(id).map_err(failure)?;
        let OperationKind::ScopedCommit(payload) = &chain.intent().kind else {
            return Err(failure("not-scoped-commit-operation"));
        };
        if payload.worktree != root(repo)?.to_string_lossy()
            || chain.intent().writer_identity != writer
            || chain.intent().authority_binding != binding(handle(&scope, repo)?)?
        {
            return Err(failure("commit-authority-mismatch"));
        }
        if let Some(outcome) = chain.outcome() {
            return Ok(outcome.clone());
        }
        fgos_holder_lock::validate_quiescent(handle(&scope, repo)?).map_err(failure)?;
        let outcome = if matches!(chain.last().phase, Phase::Intent(_) | Phase::Prepared) {
            self.stage_paths(repo, &scope, &["reset", "-q", "HEAD"], &payload.paths)?;
            Outcome::AbandonedBeforeAttempt
        } else {
            match fs::symlink_metadata(repo.git_dir.join("index.lock")) {
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                _ => return Err(recovery("commit-index-lock-present")),
            }
            let baseline: CommitBaseline =
                serde_json::from_str(&payload.baseline).map_err(failure)?;
            let now = self.checkout_text(repo, &scope, &["rev-parse", "HEAD"])?;
            if now == baseline.head {
                self.checkout_bytes(repo, &scope, &["reset", "-q", "HEAD"])?;
                Outcome::CommitRejected {
                    cause: "commit-effect-unknown".into(),
                }
            } else {
                let parents =
                    self.checkout_text(repo, &scope, &["rev-list", "--parents", "-n", "1", &now])?;
                let tree =
                    self.checkout_text(repo, &scope, &["rev-parse", &format!("{now}^{{tree}}")])?;
                if parents.split_whitespace().skip(1).collect::<Vec<_>>()
                    != vec![baseline.head.as_str()]
                    || tree != payload.tree
                {
                    return Err(recovery("commit-effect-unknown"));
                }
                let files = paths(&self.checkout_bytes(
                    repo,
                    &scope,
                    &[
                        "diff",
                        "--name-only",
                        "--no-renames",
                        "-z",
                        &baseline.head,
                        &now,
                    ],
                )?)?;
                crate::refs::sync_refs(
                    repo,
                    &RefName::parse(&baseline.reference).map_err(failure)?,
                )?;
                Outcome::Commit {
                    observed: now,
                    contract_violation: files != payload.paths,
                }
            }
        };
        let terminal = wal
            .append(&chain, Phase::Outcome(outcome.clone()))
            .map_err(failure)?;
        self.compact_checkout(repo, &scope, &wal, &terminal)?;
        Ok(outcome)
    }
    pub(crate) fn checkout_call(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        args: &[&str],
        input: &[u8],
        hooks: bool,
    ) -> Result<Output> {
        self.require_floor()?;
        self.preflight(repo)?;
        // Re-resolve topology, including reciprocal registration, before every child.
        let current = match self.resolve_repo(root(repo)?, repo.trusted_main_root())? {
            ResolveRepo::Repository(r) => r,
            _ => return Err(failure("untrusted-worktree")),
        };
        if current.git_dir != repo.git_dir || current.work_tree != repo.work_tree {
            return Err(failure("untrusted-worktree"));
        }
        let h = handle(scope, repo)?;
        #[cfg(unix)]
        if h.name() == "dispatch-cwd"
            && h.path() != crate::refs::custody_lock_path(repo, root(repo)?)?
        {
            return Err(failure("checkout-custody-stale"));
        }
        self.invoke_input(
            Some(repo),
            root(repo)?,
            args,
            if hooks {
                Policy::HookContext
            } else {
                Policy::Publication
            },
            Some(h),
            true,
            64 * 1024 * 1024,
            Duration::from_secs(120),
            input,
        )
    }
    pub(crate) fn checkout_bytes(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        args: &[&str],
    ) -> Result<Vec<u8>> {
        let out = self.checkout_call(repo, scope, args, &[], false)?;
        if out.success {
            Ok(out.stdout)
        } else {
            Err(out.error("checkout-command-failed"))
        }
    }
    pub(crate) fn checkout_text(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        args: &[&str],
    ) -> Result<String> {
        let bytes = self.checkout_bytes(repo, scope, args)?;
        Ok(std::str::from_utf8(&bytes)
            .map_err(failure)?
            .trim_end_matches('\n')
            .into())
    }
    pub(crate) fn stage_paths(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        verb: &[&str],
        selected: &[String],
    ) -> Result<()> {
        if selected.is_empty() {
            return Ok(());
        }
        let input: Vec<u8> = selected
            .iter()
            .flat_map(|p| p.as_bytes().iter().copied().chain([0]))
            .collect();
        let mut args = vec!["--literal-pathspecs"];
        args.extend_from_slice(verb);
        args.extend(["--pathspec-from-file=-", "--pathspec-file-nul"]);
        let out = self.checkout_call(repo, scope, &args, &input, false)?;
        if out.success {
            Ok(())
        } else {
            Err(out.error("literal-path-staging-failed"))
        }
    }
    pub(crate) fn staged(&self, repo: &RepoHandle, scope: &LockScope<'_>) -> Result<Vec<String>> {
        paths(&self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--cached",
                "--name-only",
                "--no-renames",
                "--no-relative",
                "-z",
            ],
        )?)
    }
    pub(crate) fn merge_head(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
    ) -> Result<Option<String>> {
        let out = self.checkout_call(
            repo,
            scope,
            &["rev-parse", "-q", "--verify", "MERGE_HEAD"],
            &[],
            false,
        )?;
        if out.success {
            Ok(Some(
                std::str::from_utf8(&out.stdout)
                    .map_err(failure)?
                    .trim_end_matches('\n')
                    .into(),
            ))
        } else if out.code == Some(1) {
            Ok(None)
        } else {
            Err(out.error("merge-head-unreadable"))
        }
    }
    fn dirty_paths(&self, repo: &RepoHandle, scope: &LockScope<'_>) -> Result<Vec<String>> {
        let mut result = paths(&self.checkout_bytes(
            repo,
            scope,
            &[
                "diff",
                "--name-only",
                "--no-renames",
                "--no-relative",
                "--ignore-submodules=dirty",
                "-z",
            ],
        )?)?;
        result.extend(paths(&self.checkout_bytes(
            repo,
            scope,
            &["ls-files", "--others", "--exclude-standard", "-z"],
        )?)?);
        result.sort();
        result.dedup();
        Ok(result)
    }
    pub fn preflight_commit(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
    ) -> Result<CommitBaseline> {
        let scope = scope(repo, held)?;
        if self.merge_head(repo, &scope)?.is_some() {
            return Err(failure("foreign-merge-head"));
        }
        if !self.staged(repo, &scope)?.is_empty() {
            return Err(failure("foreign-staged-index"));
        }
        let head = self.checkout_text(repo, &scope, &["rev-parse", "HEAD"])?;
        let reference = self.checkout_text(repo, &scope, &["symbolic-ref", "-q", "HEAD"])?;
        let dirty = self
            .dirty_paths(repo, &scope)?
            .into_iter()
            .map(|p| Ok((p.clone(), content_digest(root(repo)?, &p)?)))
            .collect::<Result<_>>()?;
        Ok(CommitBaseline {
            head,
            reference,
            worktree: root(repo)?.to_string_lossy().into_owned(),
            authority: binding(handle(&scope, repo)?)?,
            dirty,
        })
    }
    pub fn scoped_commit(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        baseline: &CommitBaseline,
        request: &CommitRequest,
        writer: &str,
        id: &str,
    ) -> Result<CommitResult> {
        let scope = scope(repo, held)?;
        self.commit_scoped(repo, &scope, baseline, request, writer, id)
    }
    fn commit_scoped(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        baseline: &CommitBaseline,
        request: &CommitRequest,
        writer: &str,
        id: &str,
    ) -> Result<CommitResult> {
        if request.message.is_empty()
            || request.message.contains('\0')
            || request.message.len() > 1024 * 1024
        {
            return Err(failure("invalid-commit-message"));
        }
        let writes = fgos_write_scope::canonicalize_all(&request.writes).map_err(failure)?;
        if baseline.worktree != root(repo)?.to_string_lossy()
            || baseline.authority != binding(handle(scope, repo)?)?
        {
            return Err(failure("checkout-custody-stale"));
        }
        let pre_existing = baseline
            .dirty
            .iter()
            .filter_map(
                |(p, digest)| match fgos_write_scope::matches(p.as_bytes(), &writes) {
                    Ok(true) => match content_digest(root(repo).ok()?, p) {
                        Ok(now) if &now != digest => Some(Ok(p.clone())),
                        Ok(_) => None,
                        Err(e) => Some(Err(e)),
                    },
                    Ok(false) => None,
                    Err(e) => Some(Err(failure(e))),
                },
            )
            .collect::<Result<Vec<_>>>()?;
        let wal = Wal::open(repo).map_err(failure)?;
        if let Some(compact) = wal.compacted(id).map_err(failure)? {
            let mut intent = Intent {
                kind: OperationKind::ScopedCommit(Box::new(wal::ScopedCommitIntent {
                    worktree: baseline.worktree.clone(),
                    baseline: String::new(),
                    request: String::new(),
                    paths: vec![],
                    tree: baseline.head.clone(),
                    cutover_grant: None,
                })),
                request_digest: wal::canonical_digest(&(baseline, request, writer))
                    .map_err(failure)?,
                repo_identity: wal.repository_identity().into(),
                resource_set: vec![format!("worktree:{}", baseline.worktree)],
                authority_binding: binding(handle(scope, repo)?)?,
                writer_identity: writer.into(),
                object_format: repo.object_format(),
                expected: Tip::Oid(baseline.head.clone()),
                next: Tip::Oid(baseline.head.clone()),
            };
            let ordinary = compact.matches(&intent).map_err(failure)?;
            intent.request_digest =
                wal::canonical_digest(&(baseline, request, writer, "no-op")).map_err(failure)?;
            let noop = compact.matches(&intent).map_err(failure)?;
            if !ordinary && !noop {
                return Err(failure("operation-id-reused"));
            }
            return match compact.outcome().map_err(failure)? {
                Outcome::Commit {
                    observed,
                    contract_violation,
                } => Ok(CommitResult {
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
                            &baseline.head,
                            &observed,
                        ],
                    )?)?,
                    oid: Some(Oid::parse(&observed, repo.object_format()).map_err(failure)?),
                    operation_id: id.into(),
                    pre_existing_in_scope: pre_existing,
                }),
                Outcome::AbandonedBeforeAttempt if noop => Ok(CommitResult {
                    status: ResultCode::Unchanged,
                    files: vec![],
                    oid: None,
                    operation_id: id.into(),
                    pre_existing_in_scope: pre_existing,
                }),
                _ => Err(failure("commit-rejected")),
            };
        }
        if wal.known_id(id).map_err(failure)? {
            let old = wal.inspect(id).map_err(failure)?;
            if matches!(old.outcome(), Some(Outcome::AbandonedBeforeAttempt)) {
                if let OperationKind::ScopedCommit(payload) = &old.intent().kind {
                    if payload.paths.is_empty()
                        && payload.baseline == serde_json::to_string(baseline).map_err(failure)?
                        && payload.request == serde_json::to_string(request).map_err(failure)?
                        && old.intent().writer_identity == writer
                    {
                        return Ok(CommitResult {
                            status: ResultCode::Unchanged,
                            oid: None,
                            files: vec![],
                            operation_id: id.into(),
                            pre_existing_in_scope: pre_existing.clone(),
                        });
                    }
                }
                return Err(failure("operation-id-reused"));
            }
            // A ref-moving attempt is never issued twice, even after ABA.
            if let Some(Outcome::Commit {
                observed,
                contract_violation,
            }) = old.outcome()
            {
                if let OperationKind::ScopedCommit(payload) = &old.intent().kind {
                    let wal::ScopedCommitIntent {
                        baseline: b,
                        request: r,
                        ..
                    } = payload.as_ref();
                    if b != &serde_json::to_string(baseline).map_err(failure)?
                        || r != &serde_json::to_string(request).map_err(failure)?
                        || old.intent().writer_identity != writer
                    {
                        return Err(failure("operation-id-reused"));
                    }
                    return Ok(CommitResult {
                        status: if *contract_violation {
                            ResultCode::CommittedButContractViolation
                        } else {
                            ResultCode::Committed
                        },
                        oid: Some(Oid::parse(observed, repo.object_format()).map_err(failure)?),
                        files: paths(&self.checkout_bytes(
                            repo,
                            scope,
                            &[
                                "diff",
                                "--name-only",
                                "--no-renames",
                                "-z",
                                &baseline.head,
                                observed,
                            ],
                        )?)?,
                        operation_id: id.into(),
                        pre_existing_in_scope: pre_existing.clone(),
                    });
                }
            }
            return Err(recovery("commit-attempt-recovery-required"));
        }
        self.admit_checkout(repo, scope, &wal, id)?;
        if self.merge_head(repo, scope)?.is_some() {
            return Err(failure("foreign-merge-head"));
        }
        if !self.staged(repo, scope)?.is_empty() {
            return Err(failure("foreign-staged-index"));
        }
        if self.checkout_text(repo, scope, &["rev-parse", "HEAD"])? != baseline.head
            || self.checkout_text(repo, scope, &["symbolic-ref", "-q", "HEAD"])?
                != baseline.reference
        {
            return Err(failure("source-baseline-stale"));
        }
        let excluded: BTreeSet<_> = baseline.dirty.iter().map(|(p, _)| p).collect();
        let mut selected = vec![];
        for path in self.dirty_paths(repo, scope)? {
            if !excluded.contains(&path)
                && fgos_write_scope::matches(path.as_bytes(), &writes).map_err(failure)?
            {
                selected.push(path);
            }
        }
        if let Some(grant) = &request.cutover_grant {
            if root(repo)? != repo.trusted_main_root() {
                return Err(failure("cutover-main-required"));
            }
            self.validate_cutover_seal(repo, scope, grant)?;
            for path in &grant.exact_paths {
                if !path.starts_with(".fgos/")
                    || fgos_write_scope::canonicalize(path).map_err(failure)? != *path
                    || path.contains('*')
                    || fs::symlink_metadata(root(repo)?.join(path)).is_ok()
                {
                    return Err(failure("cutover-exact-deletions-required"));
                }
                selected.push(path.clone());
            }
            // The fence marks every cutover, including a baseline-only repository
            // that never had an event directory to delete.
            if fs::symlink_metadata(root(repo)?.join(".fgos/events"))
                .is_ok_and(|m| m.is_file() && !m.file_type().is_symlink())
            {
                let fence = ".fgos/events".to_string();
                let tracked = paths(&self.checkout_bytes(repo, scope, &["ls-files", "-z"])?)?;
                if !tracked.contains(&fence) || self.dirty_paths(repo, scope)?.contains(&fence) {
                    selected.push(fence);
                }
            }
        }
        selected.sort();
        selected.dedup();
        for path in &selected {
            crate::fgos_scope_literal(path).map_err(|_| failure("unscopable-commit-path"))?;
        }
        if selected.is_empty() {
            let kind = OperationKind::ScopedCommit(Box::new(wal::ScopedCommitIntent {
                worktree: baseline.worktree.clone(),
                baseline: serde_json::to_string(baseline).map_err(failure)?,
                request: serde_json::to_string(request).map_err(failure)?,
                paths: vec![],
                tree: self.checkout_text(repo, scope, &["rev-parse", "HEAD^{tree}"])?,
                cutover_grant: None,
            }));
            let resources = vec![format!("worktree:{}", baseline.worktree)];
            crate::refs::admission(&wal, id, &resources)?;
            let binding = binding(handle(scope, repo)?)?;
            let intent = Intent {
                request_digest: wal::canonical_digest(&(baseline, request, writer, "no-op"))
                    .map_err(failure)?,
                kind,
                repo_identity: wal.repository_identity().into(),
                resource_set: resources,
                authority_binding: binding.clone(),
                writer_identity: writer.into(),
                object_format: repo.object_format(),
                expected: Tip::Oid(baseline.head.clone()),
                next: Tip::Oid(baseline.head.clone()),
            };
            let authority = Authority { scope, binding };
            let chain = match wal.begin(id, intent, &authority).map_err(failure)? {
                Begin::Created(c) => c,
                _ => return Err(recovery("commit-attempt-recovery-required")),
            };
            wal.append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                .map_err(failure)?;
            let terminal = wal.inspect(id).map_err(failure)?;
            self.compact_checkout(repo, scope, &wal, &terminal)?;
            return Ok(CommitResult {
                status: ResultCode::Unchanged,
                oid: None,
                files: vec![],
                operation_id: id.into(),
                pre_existing_in_scope: pre_existing.clone(),
            });
        }
        // Snapshot producer bytes before staging. Clean tracked paths retain
        // only a HEAD marker; dirty, ignored and absent paths retain their state.
        let checkout = root(repo)?;
        let dirty: BTreeSet<_> = self.dirty_paths(repo, scope)?.into_iter().collect();
        let tracked: BTreeSet<_> =
            paths(&self.checkout_bytes(repo, scope, &["ls-files", "-z"])?)?
                .into_iter()
                .collect();
        let mut saved_paths = BTreeSet::new();
        for p in dirty
            .iter()
            .cloned()
            .chain(tracked.iter().cloned())
            .chain(paths(&self.checkout_bytes(
                repo,
                scope,
                &[
                    "ls-files",
                    "--others",
                    "--ignored",
                    "--exclude-standard",
                    "-z",
                ],
            )?)?)
        {
            if fgos_write_scope::matches(p.as_bytes(), &writes).map_err(failure)? {
                saved_paths.insert(p);
            }
        }
        saved_paths.extend(selected.iter().cloned());
        saved_paths.extend(
            writes
                .iter()
                .filter(|p| !p.contains('*') && !checkout.join(p).is_dir())
                .cloned(),
        );
        let snapshot = saved_paths
            .into_iter()
            .map(|p| {
                let saved = if tracked.contains(&p) && !dirty.contains(&p) {
                    SavedPath::Head
                } else {
                    SavedPath::capture(&root(repo)?.join(&p))?
                };
                Ok((p, saved))
            })
            .collect::<Result<BTreeMap<_, _>>>()?;
        let prepared = (|| {
            self.stage_paths(repo, scope, &["add", "-A"], &selected)?;
            if self.staged(repo, scope)? != selected {
                return Err(failure("staged-set-mismatch"));
            }
            let tree = self.checkout_text(repo, scope, &["write-tree"])?;
            let kind = OperationKind::ScopedCommit(Box::new(wal::ScopedCommitIntent {
                worktree: baseline.worktree.clone(),
                baseline: serde_json::to_string(baseline).map_err(failure)?,
                request: serde_json::to_string(request).map_err(failure)?,
                paths: selected.clone(),
                tree: tree.clone(),
                cutover_grant: request.cutover_grant.clone(),
            }));
            let resources = vec![format!("worktree:{}", baseline.worktree)];
            crate::refs::admission(&wal, id, &resources)?;
            let authority_binding = binding(handle(scope, repo)?)?;
            let intent = Intent {
                request_digest: wal::canonical_digest(&(baseline, request, writer))
                    .map_err(failure)?,
                kind,
                repo_identity: wal.repository_identity().into(),
                resource_set: resources,
                authority_binding: authority_binding.clone(),
                writer_identity: writer.into(),
                object_format: repo.object_format(),
                expected: Tip::Oid(baseline.head.clone()),
                next: Tip::Oid(baseline.head.clone()),
            };
            let authority = Authority {
                scope,
                binding: authority_binding,
            };
            let chain = match wal.begin(id, intent, &authority).map_err(failure)? {
                Begin::Created(c) => c,
                _ => return Err(recovery("commit-attempt-recovery-required")),
            };
            let chain = wal.append(&chain, Phase::Prepared).map_err(failure)?;
            if self.checkout_text(repo, scope, &["rev-parse", "HEAD"])? != baseline.head
                || self.checkout_text(repo, scope, &["write-tree"])? != tree
            {
                wal.append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                    .map_err(failure)?;
                return Err(recovery("commit-prepared-state-changed"));
            }
            let attempted = wal
                .append(
                    &chain,
                    Phase::TargetAttempt {
                        prior_target_attempt: None,
                        expected: chain.intent().expected.clone(),
                        next: chain.intent().next.clone(),
                    },
                )
                .map_err(failure)?;
            // Config transports the selector to the Git-supplied hook environment.
            let context = format!("fgos.operationId={id}");
            let out = self.checkout_call(
                repo,
                scope,
                &[
                    "-c",
                    &context,
                    "-c",
                    "core.fsync=all",
                    "commit",
                    "-q",
                    "--cleanup=verbatim",
                    "-F",
                    "-",
                ],
                request.message.as_bytes(),
                true,
            )?;
            let observed = self.checkout_text(repo, scope, &["rev-parse", "HEAD"])?;
            if observed == baseline.head {
                // Keep the attempt durable. Retrying uses a new id after a fresh preflight.
                if !out.success {
                    wal.append(
                        &attempted,
                        Phase::Outcome(Outcome::CommitRejected {
                            cause: "commit-rejected".into(),
                        }),
                    )
                    .map_err(failure)?;
                    return Err(out.error("commit-rejected"));
                }
                return Err(recovery("commit-effect-unknown"));
            }
            let actual_tree = self.checkout_text(repo, scope, &["rev-parse", "HEAD^{tree}"])?;
            let actual = paths(&self.checkout_bytes(
                repo,
                scope,
                &[
                    "diff",
                    "--name-only",
                    "--no-renames",
                    "-z",
                    &baseline.head,
                    &observed,
                ],
            )?)?;
            let parents =
                self.checkout_text(repo, scope, &["rev-list", "--parents", "-n", "1", "HEAD"])?;
            let violation = !out.success
                || actual_tree != tree
                || actual != selected
                || parents.split_whitespace().skip(1).collect::<Vec<_>>()
                    != vec![baseline.head.as_str()];
            let oid = Oid::parse(&observed, repo.object_format()).map_err(failure)?;
            crate::refs::sync_refs(repo, &RefName::parse(&baseline.reference).map_err(failure)?)?;
            wal.append(
                &attempted,
                Phase::Outcome(Outcome::Commit {
                    observed,
                    contract_violation: violation,
                }),
            )
            .map_err(failure)?;
            Ok(CommitResult {
                status: if violation {
                    ResultCode::CommittedButContractViolation
                } else {
                    ResultCode::Committed
                },
                oid: Some(oid),
                files: actual,
                operation_id: id.into(),
                pre_existing_in_scope: pre_existing.clone(),
            })
        })();
        if prepared.is_err()
            && self
                .checkout_text(repo, scope, &["rev-parse", "HEAD"])
                .is_ok_and(|h| h == baseline.head)
        {
            self.checkout_bytes(repo, scope, &["reset", "-q", "HEAD"])
                .map_err(|_| recovery("commit-unstage-recovery-required"))?;
            // A hook may create another declared file that was absent from the
            // pre-commit inventory. Restore absence as well as content/mode.
            let mut restore = snapshot;
            for p in
                self.dirty_paths(repo, scope)?
                    .into_iter()
                    .chain(paths(&self.checkout_bytes(
                        repo,
                        scope,
                        &[
                            "ls-files",
                            "--others",
                            "--ignored",
                            "--exclude-standard",
                            "-z",
                        ],
                    )?)?)
            {
                if fgos_write_scope::matches(p.as_bytes(), &writes).map_err(failure)? {
                    restore.entry(p).or_insert(SavedPath::Absent);
                }
            }
            let clean: Vec<_> = restore
                .iter()
                .filter_map(|(p, saved)| matches!(saved, SavedPath::Head).then_some(p.clone()))
                .collect();
            self.stage_paths(
                repo,
                scope,
                &["restore", "--source=HEAD", "--worktree"],
                &clean,
            )?;
            for (p, saved) in &restore {
                if matches!(saved, SavedPath::Head) {
                    continue;
                }
                saved
                    .restore(&root(repo)?.join(p))
                    .map_err(|_| recovery("commit-worktree-restore-required"))?;
            }
        }
        if prepared.is_err() && wal.known_id(id).map_err(failure)? {
            let chain = wal.inspect(id).map_err(failure)?;
            if matches!(chain.last().phase, Phase::Intent(_) | Phase::Prepared) {
                wal.append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                    .map_err(failure)?;
            }
        }
        if wal.known_id(id).map_err(failure)? {
            let terminal = wal.inspect(id).map_err(failure)?;
            if terminal.outcome().is_some() {
                self.compact_checkout(repo, scope, &wal, &terminal)?;
            }
        }
        prepared
    }
    fn validate_cutover_seal(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        grant: &CutoverGrant,
    ) -> Result<()> {
        let current =
            self.checkout_text(repo, scope, &["rev-parse", "--verify", "refs/fgos/legacy"])?;
        if current != grant.legacy_ref_oid {
            return Err(failure("cutover-legacy-ref-mismatch"));
        }
        let bytes = self.checkout_bytes(
            repo,
            scope,
            &["show", &format!("{}:seal.json", grant.legacy_ref_oid)],
        )?;
        use sha2::{Digest, Sha256};
        if format!("{:x}", Sha256::digest(bytes)) != grant.seal_digest {
            return Err(failure("cutover-seal-digest-mismatch"));
        }
        Ok(())
    }
    /// Main-only non-event tracked payload. Event files never enter this adapter.
    pub fn checkpoint_tracked_files(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        files: Vec<String>,
        message: String,
        writer: &str,
        id: &str,
    ) -> Result<CommitResult> {
        if root(repo)? != repo.trusted_main_root()
            || files
                .iter()
                .any(|p| p == ".fgos" || p.starts_with(".fgos/"))
        {
            return Err(failure("checkpoint-non-event-main-required"));
        }
        let scope = scope(repo, held)?;
        let tracked = paths(&self.checkout_bytes(repo, &scope, &["ls-files", "-z"])?)?;
        if files
            .iter()
            .any(|p| p.contains('*') || !tracked.contains(p))
        {
            return Err(failure("checkpoint-tracked-literals-required"));
        }
        if !self.staged(repo, &scope)?.is_empty() || self.merge_head(repo, &scope)?.is_some() {
            return Err(failure("checkpoint-foreign-state"));
        }
        let baseline = CommitBaseline {
            head: self.checkout_text(repo, &scope, &["rev-parse", "HEAD"])?,
            reference: self.checkout_text(repo, &scope, &["symbolic-ref", "-q", "HEAD"])?,
            worktree: root(repo)?.to_string_lossy().into_owned(),
            authority: binding(handle(&scope, repo)?)?,
            dirty: vec![],
        };
        self.commit_scoped(
            repo,
            &scope,
            &baseline,
            &CommitRequest {
                writes: files,
                message,
                cutover_grant: None,
            },
            writer,
            id,
        )
    }
}
fn content_digest(root: &Path, path: &str) -> Result<String> {
    use sha2::{Digest, Sha256};
    match fs::symlink_metadata(root.join(path)) {
        Ok(m) if m.file_type().is_symlink() => Ok(format!(
            "symlink:{:?}",
            fs::read_link(root.join(path)).map_err(failure)?
        )),
        Ok(m) if m.is_file() => Ok(format!(
            "file:{:?}:{:x}",
            m.permissions(),
            Sha256::digest(fs::read(root.join(path)).map_err(failure)?)
        )),
        Ok(_) => Ok("non-regular".into()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok("absent".into()),
        Err(e) => Err(failure(e)),
    }
}

// Transaction-local snapshot: uncertain/crashed attempts retain their WAL and
// refuse replay; any inline failure with unchanged HEAD restores producer bytes.
enum SavedPath {
    Head,
    Absent,
    File(Vec<u8>, fs::Permissions),
    Link(std::path::PathBuf),
}
impl SavedPath {
    fn capture(path: &Path) -> Result<Self> {
        match fs::symlink_metadata(path) {
            Ok(m) if m.file_type().is_symlink() => {
                Ok(Self::Link(fs::read_link(path).map_err(failure)?))
            }
            Ok(m) if m.is_file() => Ok(Self::File(
                fs::read(path).map_err(failure)?,
                m.permissions(),
            )),
            Ok(_) => Err(failure("commit-snapshot-non-file")),
            Err(e)
                if matches!(
                    e.kind(),
                    std::io::ErrorKind::NotFound | std::io::ErrorKind::NotADirectory
                ) =>
            {
                Ok(Self::Absent)
            }
            Err(e) => Err(failure(e)),
        }
    }
    fn restore(&self, path: &Path) -> std::io::Result<()> {
        // Do not follow a hook-created parent symlink outside the checkout.
        for parent in path.ancestors().skip(1) {
            if fs::symlink_metadata(parent).is_ok_and(|m| m.file_type().is_symlink()) {
                return Err(std::io::Error::other("snapshot parent became a symlink"));
            }
        }
        match fs::remove_file(path) {
            Ok(()) => (),
            Err(e)
                if matches!(
                    e.kind(),
                    std::io::ErrorKind::NotFound | std::io::ErrorKind::NotADirectory
                ) => {}
            // This path was absent or a file/link in the snapshot, so a
            // directory here was introduced by the hook, never producer data.
            Err(_) if fs::symlink_metadata(path).is_ok_and(|m| m.is_dir()) => {
                fs::remove_dir_all(path)?;
            }
            Err(e) => return Err(e),
        }
        match self {
            Self::Head => unreachable!("clean tracked paths restore through Git"),
            Self::Absent => Ok(()),
            Self::File(bytes, mode) => {
                if let Some(parent) = path.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::write(path, bytes)?;
                fs::set_permissions(path, mode.clone())
            }
            Self::Link(target) => {
                if let Some(parent) = path.parent() {
                    fs::create_dir_all(parent)?;
                }
                #[cfg(unix)]
                {
                    std::os::unix::fs::symlink(target, path)
                }
                #[cfg(not(unix))]
                {
                    let _ = target;
                    Err(std::io::Error::other("snapshot symlink unsupported"))
                }
            }
        }
    }
}
