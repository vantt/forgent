//! Exact, custody-backed commit transaction. Hooks run once, via Git.
use crate::{
    driver::Output,
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
    pub warnings: Vec<String>,
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
/// New chains bind the directory identity used by custody; legacy chains keep
/// their path-only resource and are accepted only under their original lease.
pub(crate) fn checkout_resources(repo: &RepoHandle) -> Result<Vec<String>> {
    #[cfg(unix)]
    let custody = crate::refs::custody_lock_path(repo, root(repo)?)?;
    #[cfg(not(unix))]
    let custody = std::path::PathBuf::new();
    Ok(vec![format!(
        "worktree:{}:custody:{}",
        root(repo)?.display(),
        custody.display()
    )])
}
pub(crate) fn compact_matches(
    compact: &wal::CompactReceipt,
    intent: &Intent,
    repo: &RepoHandle,
) -> Result<bool> {
    if compact.matches(intent).map_err(failure)? {
        return Ok(true);
    }
    let mut legacy = intent.clone();
    legacy.resource_set = vec![format!("worktree:{}", root(repo)?.display())];
    compact.matches(&legacy).map_err(failure)
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
    ) -> Result<Vec<String>> {
        let mut warnings = vec![];
        let resources = checkout_resources(repo)?;
        let legacy = format!("worktree:{}", root(repo)?.display());
        let current_binding = binding(handle(scope, repo)?)?;
        for mut chain in wal.retained(100_000).map_err(failure)? {
            let worktree = match &chain.intent().kind {
                OperationKind::ScopedCommit(p) => &p.worktree,
                OperationKind::Sync(p) => &p.worktree,
                _ => continue,
            };
            if worktree != &root(repo)?.to_string_lossy() {
                continue;
            }
            let foreign = if chain.intent().resource_set == vec![legacy.clone()] {
                chain.intent().authority_binding != current_binding
            } else {
                chain.intent().resource_set != resources
            };
            if foreign {
                // Current custody proves that this directory is a different
                // checkout. Close only its old WAL, never touch its index or
                // replay an effect. Existing terminal causes stay unchanged.
                if chain.outcome().is_none() {
                    chain = wal
                        .append(
                            &chain,
                            Phase::Outcome(Outcome::CommitRejected {
                                cause: if matches!(
                                    *chain.last_state(),
                                    Phase::Intent(_) | Phase::Prepared
                                ) {
                                    "foreign-checkout-abandoned"
                                } else {
                                    "foreign-checkout-effect-unknown"
                                }
                                .into(),
                            }),
                        )
                        .map_err(failure)?;
                }
                if let Err(error) = (|| -> Result<()> {
                    if matches!(chain.intent().kind, OperationKind::Sync(_)) {
                        crate::refs::release_pin(self, repo, handle(scope, repo)?, wal, &chain)?;
                        chain = wal.inspect(&chain.last().operation_id).map_err(failure)?;
                    }
                    wal.compact(
                        &chain,
                        &WalReader { driver: self, repo },
                        &Authority {
                            scope,
                            binding: chain.intent().authority_binding.clone(),
                        },
                    )
                    .map_err(failure)?;
                    Ok(())
                })() {
                    warnings.push(format!("checkout-compaction-deferred: {error:?}"));
                }
                continue;
            }
            if chain.last().operation_id == id {
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
                && matches!(chain.last_state(), Phase::Intent(_) | Phase::Prepared)
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
            } else {
                return Err(recovery("resource-recovery-required"));
            }
        }
        crate::refs::admission(wal, id, &resources)?;
        Ok(warnings)
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
    pub(crate) fn compact_checkout_warning(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        chain: &wal::Chain,
    ) -> Vec<String> {
        self.compact_checkout(repo, scope, wal, chain)
            .err()
            .map(|e| vec![format!("checkout-compaction-deferred: {e:?}")])
            .unwrap_or_default()
    }
    /// Observe immutable commits at HEAD and in the branch reflog. Never issue
    /// another commit, and never infer rejection from HEAD equality (ABA).
    pub(crate) fn observe_checkout_commit(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        wal: &Wal,
        chain: &wal::Chain,
    ) -> Result<Option<(String, bool)>> {
        let (reference, parents, tree, message) = match &chain.intent().kind {
            OperationKind::ScopedCommit(payload) => {
                let baseline: CommitBaseline =
                    serde_json::from_str(&payload.baseline).map_err(failure)?;
                let request: CommitRequest =
                    serde_json::from_str(&payload.request).map_err(failure)?;
                (
                    baseline.reference,
                    vec![baseline.head],
                    payload.tree.clone(),
                    request.message,
                )
            }
            OperationKind::Sync(payload) => {
                let Phase::SyncCommitAttempt { tree } = chain.last_state() else {
                    return Err(recovery("sync-state-recovery-required"));
                };
                (
                    payload
                        .reference
                        .clone()
                        .ok_or_else(|| recovery("sync-reference-unrecorded"))?,
                    vec![payload.head.clone(), payload.target.clone()],
                    tree.clone(),
                    payload.message.clone(),
                )
            }
            _ => return Err(failure("not-checkout-commit-operation")),
        };
        let now = self.checkout_text(repo, scope, &["rev-parse", "HEAD"])?;
        // Admission forbids a later checkout chain while an attempt is open.
        // Cross-check retained peers as well, without trusting record age or
        // directory timestamps. A peer at this baseline makes message-only
        // attribution ambiguous; a strictly older baseline does not.
        let mut newest = true;
        for peer in wal.retained(100_000).map_err(failure)? {
            let worktree = match &peer.intent().kind {
                OperationKind::ScopedCommit(p) => &p.worktree,
                OperationKind::Sync(p) => &p.worktree,
                _ => continue,
            };
            if peer.last().operation_id == chain.last().operation_id
                || worktree != &root(repo)?.to_string_lossy()
            {
                continue;
            }
            if peer.intent().authority_binding != chain.intent().authority_binding
                || (peer.intent().resource_set != checkout_resources(repo)?
                    && peer.intent().resource_set
                        != vec![format!("worktree:{}", root(repo)?.display())])
            {
                continue;
            }
            let Tip::Oid(prior) = &peer.intent().expected else {
                newest = false;
                break;
            };
            if *prior == parents[0]
                || !self.ancestry(
                    repo,
                    &Oid::parse(prior, repo.object_format()).map_err(failure)?,
                    &Oid::parse(&parents[0], repo.object_format()).map_err(failure)?,
                )?
            {
                newest = false;
                break;
            }
        }
        if self.checkout_text(repo, scope, &["symbolic-ref", "-q", "HEAD"])? != reference {
            return Err(recovery("checkout-reference-changed"));
        }
        // One bounded walk returns immutable headers and full verbatim messages.
        // Reflog-only evidence is never proof of an effect on the current ref.
        let raw = self.checkout_bytes(
            repo,
            scope,
            &[
                "log",
                "-g",
                "-n",
                "1024",
                "--format=%H%x00%P%x00%T%x00%B%x00",
                &reference,
            ],
        )?;
        let mut candidates = Vec::new();
        let fields: Vec<_> = raw.split(|b| *b == 0).collect();
        let mut seen = BTreeSet::new();
        let mut passed_tip = false;
        for row in fields.as_chunks::<4>().0 {
            let oid = std::str::from_utf8(row[0])
                .map_err(failure)?
                .trim_start_matches('\n')
                .to_owned();
            if oid == parents[0] {
                if passed_tip {
                    break;
                }
                continue;
            }
            passed_tip = true;
            if !seen.insert(oid.clone()) {
                continue;
            }
            let actual_parents: Vec<_> = std::str::from_utf8(row[1])
                .map_err(failure)?
                .split_whitespace()
                .map(str::to_owned)
                .collect();
            if actual_parents == parents {
                candidates.push((
                    oid,
                    std::str::from_utf8(row[2]).map_err(failure)?.to_owned(),
                    row[3].to_vec(),
                ));
            }
        }
        let expected_message = if message.ends_with('\n') {
            message
        } else {
            format!("{message}\n")
        };
        // Exhaust exact tree evidence before trying the weaker message proof.
        for exact in [true, false] {
            for (oid, actual_tree, actual_message) in &candidates {
                if if exact {
                    actual_tree == &tree
                } else {
                    newest && actual_message == expected_message.as_bytes()
                } {
                    if !self.ancestry(
                        repo,
                        &Oid::parse(oid, repo.object_format()).map_err(failure)?,
                        &Oid::parse(&now, repo.object_format()).map_err(failure)?,
                    )? {
                        return Err(recovery(format!(
                            "commit-effect-unknown: reflog-only-candidate:{oid}"
                        )));
                    }
                    return Ok(Some((oid.clone(), actual_tree != &tree)));
                }
            }
        }
        Ok(None)
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
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
        let mut scope = scope(repo, held)?;
        crate::recovery::leaf(&mut scope, repo)?;
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
                resource_set: checkout_resources(repo)?,
                authority_binding: binding(handle(&scope, repo)?)?,
                writer_identity: writer.into(),
                object_format: repo.object_format(),
                expected: Tip::Oid(compact.expected.clone()),
                next: Tip::Oid(compact.next.clone()),
            };
            if !compact_matches(&compact, &intent, repo)? {
                return Err(failure("commit-authority-mismatch"));
            }
            return compact.outcome().map_err(failure);
        }
        let chain = wal.inspect(id).map_err(failure)?;
        let OperationKind::ScopedCommit(payload) = &chain.intent().kind else {
            return Err(failure("not-scoped-commit-operation"));
        };
        if (chain.intent().resource_set != checkout_resources(repo)?
            && chain.intent().resource_set != vec![format!("worktree:{}", root(repo)?.display())])
            || payload.worktree != root(repo)?.to_string_lossy()
            || chain.intent().writer_identity != writer
            || chain.intent().authority_binding != binding(handle(&scope, repo)?)?
        {
            return Err(failure("commit-authority-mismatch"));
        }
        if let Some(outcome) = chain.outcome() {
            return Ok(outcome.clone());
        }
        fgos_holder_lock::validate_quiescent(handle(&scope, repo)?).map_err(failure)?;
        let outcome = if matches!(chain.last_state(), Phase::Intent(_) | Phase::Prepared) {
            let baseline: CommitBaseline =
                serde_json::from_str(&payload.baseline).map_err(failure)?;
            if self.checkout_text(repo, &scope, &["rev-parse", "HEAD"])? == baseline.head
                && self.staged(repo, &scope)? == payload.paths
            {
                self.stage_paths(repo, &scope, &["reset", "-q", "HEAD"], &payload.paths)?;
            }
            Outcome::AbandonedBeforeAttempt
        } else {
            match fs::symlink_metadata(repo.git_dir.join("index.lock")) {
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                _ => return Err(recovery(crate::native_lock::UNOWNED_INDEX_LOCK)),
            }
            let baseline: CommitBaseline =
                serde_json::from_str(&payload.baseline).map_err(failure)?;
            if let Some((observed, tree_changed)) =
                self.observe_checkout_commit(repo, &scope, &wal, &chain)?
            {
                let files = paths(&self.checkout_bytes(
                    repo,
                    &scope,
                    &[
                        "diff",
                        "--name-only",
                        "--no-renames",
                        "-z",
                        &baseline.head,
                        &observed,
                    ],
                )?)?;
                crate::refs::sync_refs(
                    repo,
                    &RefName::parse(&baseline.reference).map_err(failure)?,
                )?;
                Outcome::Commit {
                    observed,
                    contract_violation: tree_changed || files != payload.paths,
                }
            } else if self.checkout_text(repo, &scope, &["rev-parse", "HEAD"])? == baseline.head {
                self.stage_paths(repo, &scope, &["reset", "-q", "HEAD"], &payload.paths)?;
                Outcome::CommitRejected {
                    cause: "commit-effect-unknown".into(),
                }
            } else {
                return Err(recovery("commit-effect-unknown"));
            }
        };
        let terminal = wal
            .append(&chain, Phase::Outcome(outcome.clone()))
            .map_err(failure)?;
        let _ = self.compact_checkout_warning(repo, &scope, &wal, &terminal);
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
        let h = handle(scope, repo)?;
        #[cfg(unix)]
        if h.name() == "dispatch-cwd"
            && h.path() != crate::refs::custody_lock_path(repo, root(repo)?)?
        {
            return Err(failure("checkout-custody-stale"));
        }
        self.checkout_call_borrowed(repo, h, args, input, hooks)
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
    pub(crate) fn dirty_paths(&self, repo: &RepoHandle, scope: &LockScope<'_>) -> Result<Vec<String>> {
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
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
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
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
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
                resource_set: checkout_resources(repo)?,
                authority_binding: binding(handle(scope, repo)?)?,
                writer_identity: writer.into(),
                object_format: repo.object_format(),
                expected: Tip::Oid(baseline.head.clone()),
                next: Tip::Oid(baseline.head.clone()),
            };
            let ordinary = compact_matches(&compact, &intent, repo)?;
            intent.request_digest =
                wal::canonical_digest(&(baseline, request, writer, "no-op")).map_err(failure)?;
            let noop = compact_matches(&compact, &intent, repo)?;
            if !ordinary && !noop {
                return Err(failure("operation-id-reused"));
            }
            return match compact.outcome().map_err(failure)? {
                Outcome::Commit {
                    observed,
                    contract_violation,
                } => Ok(CommitResult {
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
                            &baseline.head,
                            &observed,
                        ],
                    )?)?,
                    oid: Some(Oid::parse(&observed, repo.object_format()).map_err(failure)?),
                    operation_id: id.into(),
                    pre_existing_in_scope: pre_existing,
                }),
                Outcome::AbandonedBeforeAttempt if noop => Ok(CommitResult {
                    warnings: vec![],
                    status: ResultCode::Unchanged,
                    files: vec![],
                    oid: None,
                    operation_id: id.into(),
                    pre_existing_in_scope: pre_existing,
                }),
                Outcome::CommitRejected { cause } => Err(if cause.ends_with("effect-unknown") {
                    recovery(cause)
                } else {
                    failure(cause)
                }),
                _ => Err(failure("commit-rejected")),
            };
        }
        if wal.known_id(id).map_err(failure)? {
            let old = wal.inspect(id).map_err(failure)?;
            if old.intent().authority_binding != binding(handle(scope, repo)?)?
                || (old.intent().resource_set != checkout_resources(repo)?
                    && old.intent().resource_set
                        != vec![format!("worktree:{}", root(repo)?.display())])
            {
                return Err(failure("commit-authority-mismatch"));
            }
            let OperationKind::ScopedCommit(payload) = &old.intent().kind else {
                return Err(failure("operation-id-reused"));
            };
            if payload.baseline != serde_json::to_string(baseline).map_err(failure)?
                || payload.request != serde_json::to_string(request).map_err(failure)?
                || old.intent().writer_identity != writer
            {
                return Err(failure("operation-id-reused"));
            }
            // A ref-moving attempt is never issued twice, even after ABA.
            return match old.outcome() {
                Some(Outcome::AbandonedBeforeAttempt) if payload.paths.is_empty() => {
                    Ok(CommitResult {
                        warnings: vec![],
                        status: ResultCode::Unchanged,
                        oid: None,
                        files: vec![],
                        operation_id: id.into(),
                        pre_existing_in_scope: pre_existing.clone(),
                    })
                }
                Some(Outcome::Commit {
                    observed,
                    contract_violation,
                }) => Ok(CommitResult {
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
                }),
                Some(Outcome::CommitRejected { cause }) => {
                    Err(if cause.ends_with("effect-unknown") {
                        recovery(cause)
                    } else {
                        failure(cause)
                    })
                }
                Some(Outcome::AbandonedBeforeAttempt) => Err(failure("operation-id-reused")),
                _ => Err(recovery("commit-attempt-recovery-required")),
            };
        }
        let admission_warnings = self.admit_checkout(repo, scope, &wal, id)?;
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
            let resources = checkout_resources(repo)?;
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
            let mut warnings = admission_warnings;
            warnings.extend(self.compact_checkout_warning(repo, scope, &wal, &terminal));
            return Ok(CommitResult {
                warnings,
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
        let inventory = paths(&self.checkout_bytes(repo, scope, &["ls-files", "-v", "-z"])?)?;
        let skipped: BTreeSet<_> = inventory
            .iter()
            .filter(|p| p.starts_with("S ") || p.starts_with("s "))
            .map(|p| p[2..].to_owned())
            .collect();
        let tracked: BTreeSet<_> = inventory
            .iter()
            .filter(|p| !p.starts_with("S ") && !p.starts_with("s "))
            .map(|p| p[2..].to_owned())
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
            .filter(|p| !skipped.contains(p))
            .map(|p| {
                let saved = if tracked.contains(&p) && !dirty.contains(&p) {
                    let metadata = fs::symlink_metadata(root(repo)?.join(&p)).map_err(failure)?;
                    SavedPath::Head(metadata.is_file().then(|| metadata.permissions()))
                } else {
                    SavedPath::capture(&root(repo)?.join(&p))?
                };
                Ok((p, saved))
            })
            .collect::<Result<BTreeMap<_, _>>>()?;
        let mut recorded_terminal = None;
        let mut prepared = (|| {
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
            let resources = checkout_resources(repo)?;
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
            recorded_terminal = Some(
                wal.append(
                    &attempted,
                    Phase::Outcome(Outcome::Commit {
                        observed,
                        contract_violation: violation,
                    }),
                )
                .map_err(failure)?,
            );
            Ok(CommitResult {
                warnings: vec![],
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
        if let (Ok(receipt), Some(terminal)) = (&mut prepared, recorded_terminal) {
            receipt.warnings = admission_warnings;
            receipt
                .warnings
                .extend(self.compact_checkout_warning(repo, scope, &wal, &terminal));
            return prepared;
        }
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
            // Attempt every restoration, even if one clean path cannot be
            // restored. Keep producer bytes on all independent paths.
            let mut failed = false;
            for (p, saved) in &restore {
                let path = root(repo)?.join(p);
                if let SavedPath::Head(mode) = saved {
                    if self
                        .stage_paths(
                            repo,
                            scope,
                            &["restore", "--source=HEAD", "--worktree"],
                            std::slice::from_ref(p),
                        )
                        .is_err()
                    {
                        failed = true;
                    }
                    if let Some(mode) = mode {
                        if fs::symlink_metadata(&path)
                            .is_ok_and(|m| m.is_file() && !m.file_type().is_symlink())
                        {
                            failed |= fs::set_permissions(&path, mode.clone()).is_err();
                        } else {
                            failed = true;
                        }
                    }
                } else {
                    failed |= saved.restore(&path).is_err();
                }
            }
            if failed {
                prepared = Err(recovery("commit-worktree-restore-required"));
            }
        }
        if prepared.is_err() && wal.known_id(id).map_err(failure)? {
            let chain = wal.inspect(id).map_err(failure)?;
            if matches!(chain.last_state(), Phase::Intent(_) | Phase::Prepared) {
                wal.append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                    .map_err(failure)?;
            }
        }
        if wal.known_id(id).map_err(failure)? {
            let terminal = wal.inspect(id).map_err(failure)?;
            if terminal.outcome().is_some() {
                let warnings = self.compact_checkout_warning(repo, scope, &wal, &terminal);
                if let Ok(receipt) = &mut prepared {
                    receipt.warnings.extend(warnings);
                }
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
        let operation_repo = self.checkout_repository(repo)?;
        let repo = &operation_repo;
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
#[derive(Serialize, Deserialize)]
pub(crate) enum SavedPath {
    #[serde(skip)]
    Head(Option<fs::Permissions>),
    Absent,
    File(Vec<u8>, #[serde(with = "saved_permissions")] fs::Permissions),
    Link(std::path::PathBuf),
}
impl SavedPath {
    pub(crate) fn capture(path: &Path) -> Result<Self> {
        Self::capture_bounded(path, u64::MAX - 1)
    }
    pub(crate) fn capture_bounded(path: &Path, limit: u64) -> Result<Self> {
        use std::io::Read;
        match fs::symlink_metadata(path) {
            Ok(m) if m.file_type().is_symlink() => {
                Ok(Self::Link(fs::read_link(path).map_err(failure)?))
            }
            Ok(m) if m.is_file() => {
                let mut options = fs::OpenOptions::new();
                options.read(true);
                #[cfg(unix)]
                {
                    use std::os::unix::fs::OpenOptionsExt;
                    options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
                }
                let file = options.open(path).map_err(failure)?;
                let actual = file.metadata().map_err(failure)?;
                if !actual.is_file() || actual.len() > limit {
                    return Err(failure("snapshot-file-capacity-or-type"));
                }
                let mut bytes = Vec::new();
                file.take(limit.saturating_add(1))
                    .read_to_end(&mut bytes)
                    .map_err(failure)?;
                if bytes.len() as u64 > limit {
                    return Err(failure("snapshot-file-capacity"));
                }
                Ok(Self::File(bytes, actual.permissions()))
            }
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
    pub(crate) fn restore(&self, path: &Path) -> std::io::Result<()> {
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
            Self::Head(_) => unreachable!("clean tracked paths restore through Git"),
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

mod saved_permissions {
    use super::*;
    pub fn serialize<S: serde::Serializer>(
        p: &fs::Permissions,
        s: S,
    ) -> std::result::Result<S::Ok, S::Error> {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            p.mode().serialize(s)
        }
        #[cfg(not(unix))]
        {
            p.readonly().serialize(s)
        }
    }
    pub fn deserialize<'de, D: serde::Deserializer<'de>>(
        d: D,
    ) -> std::result::Result<fs::Permissions, D::Error> {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            Ok(fs::Permissions::from_mode(u32::deserialize(d)?))
        }
        #[cfg(not(unix))]
        {
            let _ = d;
            Err(serde::de::Error::custom("snapshot-platform-unsupported"))
        }
    }
}
