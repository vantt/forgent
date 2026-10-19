//! Non-event branch mutations. One rank-40 hold covers membership, CAS and read-back.
use crate::{
    driver::Policy,
    wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal},
    *,
};
use fgos_holder_lock::{BorrowedHandle, LockScope, Wait};
use std::{
    collections::BTreeMap,
    fs,
    path::{Path, PathBuf},
    time::Duration,
};

pub(crate) fn failure(cause: impl std::fmt::Display) -> OperationError {
    let cause = cause.to_string();
    OperationError {
        code: ResultCode::Refused,
        cause,
        retryable: false,
        operation_id: None,
        receipt: None,
        exit_code: None,
        signal: None,
        stderr: vec![],
    }
}
pub(crate) fn classified(code: ResultCode, cause: impl std::fmt::Display) -> OperationError {
    OperationError {
        code,
        ..failure(cause)
    }
}
pub(crate) fn recovery(cause: impl std::fmt::Display) -> OperationError {
    classified(ResultCode::RecoveryRequired, cause)
}
pub(crate) fn stale(cause: impl std::fmt::Display) -> OperationError {
    classified(ResultCode::Stale, cause)
}
pub(crate) fn tip(value: &ExpectedTip) -> Tip {
    match value {
        ExpectedTip::Absent => Tip::Absent,
        ExpectedTip::Oid(o) => Tip::Oid(o.as_str().into()),
    }
}
pub(crate) fn expected(value: &Tip, repo: &RepoHandle) -> Result<ExpectedTip> {
    Ok(match value {
        Tip::Absent => ExpectedTip::Absent,
        Tip::Oid(s) => ExpectedTip::Oid(Oid::parse(s, repo.object_format()).map_err(failure)?),
    })
}
pub(crate) fn direct(driver: &GitDriver, repo: &RepoHandle, name: &RefName) -> Result<ExpectedTip> {
    match driver.resolve_ref(repo, name)? {
        RefValue::Absent => Ok(ExpectedTip::Absent),
        RefValue::Direct(o) => Ok(ExpectedTip::Oid(o)),
        RefValue::Symbolic(_) => Err(failure("symbolic-ref-refused")),
    }
}
pub(crate) struct Authority<'a> {
    pub scope: &'a LockScope<'a>,
    pub binding: String,
}
impl wal::PublicationAuthority for Authority<'_> {
    fn validate_publication_borrow(&self, i: &Intent) -> wal::WalResult<()> {
        self.scope
            .validate()
            .map_err(|_| wal::WalError::PublicationBorrowUnavailable)?;
        if self.binding != i.authority_binding {
            return Err(wal::WalError::PublicationBorrowUnavailable);
        }
        Ok(())
    }
}
pub(crate) fn admission<F: wal::FileSystem>(
    wal: &Wal<F>,
    id: &str,
    resources: &[String],
) -> Result<()> {
    let scan = wal.scan(100_000).map_err(failure)?;
    if !scan.complete || scan.entries.iter().any(|e| e.error.is_some()) {
        return Err(recovery("git-wal-unreadable"));
    }
    for chain in wal.active(100_000).map_err(failure)? {
        if chain.last().operation_id != id
            && chain.intent().resource_set.iter().any(|r| {
                resources.contains(r)
                    || matches!(
                        chain.intent().kind,
                        OperationKind::WorktreeCreate { .. }
                            | OperationKind::WorktreeRemove { .. }
                            | OperationKind::WorktreeMove { .. }
                    ) && resources.iter().any(|checkout| {
                        checkout
                            .strip_prefix(r)
                            .is_some_and(|tail| tail.starts_with(":custody:"))
                    })
            })
        {
            return Err(recovery("resource-recovery-required"));
        }
    }
    Ok(())
}
pub(crate) fn receipt(
    id: &str,
    i: &Intent,
    observed: ExpectedTip,
    won: bool,
    checkout: Checkout,
    remote: Remote,
) -> Result<Receipt> {
    let at_candidate = tip(&observed) == i.next
        && !matches!(
            i.kind,
            OperationKind::RemoteFetch { .. } | OperationKind::RemotePush { .. }
        );
    Ok(Receipt {
        operation_id: id.into(),
        request_digest: i.request_digest.clone(),
        local_effect: LocalEffect {
            expected: match &i.expected {
                Tip::Absent => ExpectedTip::Absent,
                Tip::Oid(s) => ExpectedTip::Oid(Oid::parse(s, i.object_format).map_err(failure)?),
            },
            published_oid: if won {
                match &i.next {
                    Tip::Oid(s) => Some(Oid::parse(s, i.object_format).map_err(failure)?),
                    _ => None,
                }
            } else {
                None
            },
            observed_tip: observed,
            publication_state: if won {
                PublicationState::CasObservedSuccessful
            } else if at_candidate {
                PublicationState::CurrentlyAtCandidate
            } else {
                PublicationState::Unknown
            },
        },
        checkout,
        durability: Durability {
            level: DurabilityLevel::ProcessCrash,
            capability_evidence: vec![
                "WAL and ref directory sync; stable media not certified".into()
            ],
        },
        remote,
        consumer_settlement: ConsumerSettlement::NotOwnedByGit,
        attribution: if won {
            Attribution::ThisInvocationWonCas
        } else if at_candidate {
            Attribution::EffectObservedOnly
        } else {
            Attribution::Uncertain
        },
    })
}
pub(crate) fn sync_refs(repo: &RepoHandle, reference: &RefName) -> Result<()> {
    if repo.layout().refs == RefStorage::Reftable {
        fgos_durable_file::sync_directory(&repo.common_dir().join("reftable")).map_err(failure)?;
        return fgos_durable_file::sync_directory(repo.common_dir()).map_err(failure);
    }
    let mut parent = repo
        .common_dir()
        .join(reference.as_str())
        .parent()
        .unwrap()
        .to_owned();
    loop {
        match fs::symlink_metadata(&parent) {
            Ok(m) if m.is_dir() && !m.file_type().is_symlink() => {
                fgos_durable_file::sync_directory(&parent).map_err(failure)?
            }
            Ok(_) => return Err(failure("untrusted-ref-directory")),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
            Err(e) => return Err(failure(e)),
        }
        if parent == repo.common_dir() {
            break;
        }
        parent = parent
            .parent()
            .ok_or_else(|| failure("untrusted-ref-directory"))?
            .to_owned();
    }
    if repo.layout().refs == RefStorage::Reftable {
        fgos_durable_file::sync_directory(&repo.common_dir().join("reftable")).map_err(failure)?;
    }
    Ok(())
}
pub(crate) fn pending(mut e: OperationError, id: &str) -> OperationError {
    e.code = ResultCode::RecoveryRequired;
    e.operation_id = Some(id.into());
    e
}
fn path(bytes: &[u8]) -> Result<PathBuf> {
    #[cfg(unix)]
    {
        use std::os::unix::ffi::OsStrExt;
        Ok(Path::new(std::ffi::OsStr::from_bytes(bytes)).into())
    }
    #[cfg(not(unix))]
    {
        Ok(PathBuf::from(std::str::from_utf8(bytes).map_err(failure)?))
    }
}
pub(crate) fn install_pin(
    driver: &GitDriver,
    repo: &RepoHandle,
    admin: &fgos_holder_lock::Handle,
    id: &str,
    candidate: &Oid,
) -> Result<()> {
    let pin =
        RefName::parse(&format!("refs/fgos/git-operations/{id}/candidate")).map_err(failure)?;
    let zero = "0".repeat(if repo.object_format() == ObjectFormat::Sha1 {
        40
    } else {
        64
    });
    let pinned = driver.publication_call(
        repo,
        admin,
        &[
            "-c",
            "core.fsync=all",
            "update-ref",
            "--no-deref",
            pin.as_str(),
            candidate.as_str(),
            &zero,
        ],
        &[],
        false,
        Duration::from_secs(30),
    )?;
    if !pinned.success || direct(driver, repo, &pin)? != ExpectedTip::Oid(candidate.clone()) {
        return Err(recovery("pin-recovery-required"));
    }
    sync_refs(repo, &pin)?;
    let objects = repo.common_dir().join("objects");
    let fanout = objects.join(&candidate.as_str()[..2]);
    if fanout.is_dir() {
        fgos_durable_file::sync_directory(&fanout).map_err(failure)?;
    }
    fgos_durable_file::sync_directory(&objects).map_err(failure)?;
    Ok(())
}
pub(crate) fn release_pin<F: wal::FileSystem>(
    driver: &GitDriver,
    repo: &RepoHandle,
    admin: &fgos_holder_lock::Handle,
    wal: &Wal<F>,
    terminal: &wal::Chain,
) -> Result<()> {
    if matches!(terminal.last().phase, Phase::PinReleased) {
        return Ok(());
    }
    let candidate = match terminal.intent().candidate() {
        Tip::Oid(s) => s,
        _ => return Err(failure("pin-candidate-missing")),
    };
    let pin = RefName::parse(&format!(
        "refs/fgos/git-operations/{}/candidate",
        terminal.last().operation_id
    ))
    .map_err(failure)?;
    let release = if matches!(terminal.last().phase, Phase::PinReleaseAttempt { .. }) {
        terminal.clone()
    } else {
        wal.append(
            terminal,
            Phase::PinReleaseAttempt {
                prior_target_attempt: None,
                expected: Tip::Oid(candidate.clone()),
                next: Tip::Absent,
            },
        )
        .map_err(failure)?
    };
    match direct(driver, repo, &pin)? {
        ExpectedTip::Absent => (),
        ExpectedTip::Oid(oid) if oid.as_str() == candidate => {
            let out = driver.publication_call(
                repo,
                admin,
                &[
                    "-c",
                    "core.fsync=all",
                    "update-ref",
                    "--no-deref",
                    "-d",
                    pin.as_str(),
                    candidate,
                ],
                &[],
                false,
                Duration::from_secs(30),
            )?;
            if !out.success || direct(driver, repo, &pin)? != ExpectedTip::Absent {
                return Err(recovery("pin-release-recovery-required"));
            }
        }
        _ => return Err(recovery("pin-release-recovery-required")),
    }
    sync_refs(repo, &pin)?;
    wal.append(&release, Phase::PinReleased).map_err(failure)?;
    Ok(())
}
impl GitDriver {
    pub(crate) fn ignored_checkout_collisions(
        &self,
        repo: &RepoHandle,
        candidate: &str,
    ) -> Result<Vec<Vec<u8>>> {
        let ignored = self.checked(
            repo,
            &[
                "ls-files",
                "--full-name",
                "--others",
                "--ignored",
                "--exclude-standard",
                "-z",
            ],
            Policy::Inspect,
        )?;
        let incoming = self.checked(
            repo,
            &["ls-tree", "-r", "--name-only", "-z", candidate],
            Policy::Inspect,
        )?;
        let incoming: std::collections::BTreeSet<&[u8]> = incoming
            .split(|b| *b == 0)
            .filter(|p| !p.is_empty())
            .collect();
        Ok(ignored
            .split(|b| *b == 0)
            .filter(|p| !p.is_empty())
            .filter(|p| {
                incoming.contains(*p)
                    || p.iter()
                        .enumerate()
                        .any(|(i, b)| *b == b'/' && incoming.contains(&p[..i]))
                    || incoming.range(*p..).next().is_some_and(|q| {
                        q.strip_prefix(*p)
                            .is_some_and(|rest| rest.starts_with(b"/"))
                    })
            })
            .map(<[u8]>::to_vec)
            .collect())
    }

    pub(crate) fn checkouts(
        &self,
        repo: &RepoHandle,
    ) -> Result<Vec<(WorktreeFact, Option<RepoHandle>)>> {
        let mut cursor = None;
        let mut result = vec![];
        loop {
            let page = self.list_worktrees(repo, cursor, 4096)?;
            for fact in page.entries {
                if fact.prunable.is_some() || fact.locked.as_deref() == Some(b"initializing") {
                    return Err(failure("worktree-registration-uncertain"));
                }
                let resolved = if fact.bare {
                    None
                } else {
                    match self.resolve_repo(&path(&fact.path)?, repo.trusted_main_root())? {
                        ResolveRepo::Repository(r) => Some(r),
                        _ => return Err(failure("worktree-registration-uncertain")),
                    }
                };
                // Resolve registered admin HEAD, never a worker gitfile.
                if let Some(r) = &resolved {
                    self.preflight(r)?;
                    let head = self.invoke(
                        Some(r),
                        r.trusted_main_root(),
                        &["symbolic-ref", "-q", "HEAD"],
                        Policy::Inspect,
                        None,
                        true,
                        4096,
                        Duration::from_secs(30),
                    )?;
                    let branch = if head.success {
                        Some(head.stdout.strip_suffix(b"\n").unwrap_or(&head.stdout))
                    } else if head.code == Some(1) {
                        None
                    } else {
                        return Err(head.error("worktree-head-unreadable"));
                    };
                    if branch != fact.branch.as_ref().map(|b| b.as_str().as_bytes()) {
                        return Err(failure("worktree-head-uncertain"));
                    }
                }
                result.push((fact, resolved));
            }
            if page.complete {
                break;
            }
            cursor = page.next_cursor;
        }
        Ok(result)
    }
    /// `ensureBranch` means exact expected absence, not blind branch overwrite.
    pub fn ensure_branch(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        name: &RefName,
        next: &Oid,
        writer: &str,
        id: &str,
    ) -> Result<Receipt> {
        self.change_ref(
            repo,
            held,
            name,
            &ExpectedTip::Absent,
            &ExpectedTip::Oid(next.clone()),
            false,
            writer,
            id,
            &wal::OsFileSystem,
        )
    }
    #[allow(clippy::too_many_arguments)]
    pub fn advance_ref(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        name: &RefName,
        old: &Oid,
        next: &Oid,
        writer: &str,
        id: &str,
    ) -> Result<Receipt> {
        self.change_ref(
            repo,
            held,
            name,
            &ExpectedTip::Oid(old.clone()),
            &ExpectedTip::Oid(next.clone()),
            false,
            writer,
            id,
            &wal::OsFileSystem,
        )
    }
    pub fn delete_ref(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        name: &RefName,
        old: &Oid,
        writer: &str,
        id: &str,
    ) -> Result<Receipt> {
        self.change_ref(
            repo,
            held,
            name,
            &ExpectedTip::Oid(old.clone()),
            &ExpectedTip::Absent,
            false,
            writer,
            id,
            &wal::OsFileSystem,
        )
    }
    #[allow(clippy::too_many_arguments)]
    pub fn fast_forward_checked_out(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        name: &RefName,
        old: &Oid,
        next: &Oid,
        writer: &str,
        id: &str,
    ) -> Result<Receipt> {
        self.change_ref(
            repo,
            held,
            name,
            &ExpectedTip::Oid(old.clone()),
            &ExpectedTip::Oid(next.clone()),
            true,
            writer,
            id,
            &wal::OsFileSystem,
        )
    }
    #[allow(clippy::too_many_arguments)]
    pub fn change_ref<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        name: &RefName,
        old: &ExpectedTip,
        next: &ExpectedTip,
        checkout: bool,
        writer: &str,
        id: &str,
        filesystem: &F,
    ) -> Result<Receipt> {
        require_lock_scope_platform()?;
        if !name.as_str().starts_with("refs/heads/") || writer.is_empty() || old == next {
            return Err(failure("invalid-refs-request"));
        }
        #[cfg(unix)]
        let custody_path = held
            .iter()
            .find(|h| h.as_ref().name() == "dispatch-cwd")
            .map(|h| h.as_ref().path().to_owned());
        let scope = acquire_worktree_admin(repo, held)?;
        let admin = scope.handle("worktree-admin").expect("acquired");
        let before = self.checkouts(repo)?;
        let mut used = vec![];
        for row in &before {
            let in_use = branch_in_use(&row.0, row.1.as_ref(), name)?;
            if in_use {
                used.push(row);
            }
        }
        let tree = if checkout {
            if used.len() != 1 {
                return Err(failure("checkout-custody-required"));
            }
            let target = used[0]
                .1
                .as_ref()
                .ok_or_else(|| failure("checkout-custody-required"))?;
            if target.work_tree.as_deref() == Some(repo.trusted_main_root()) {
                return Err(failure("main-checkout-fast-forward-refused"));
            }
            if used[0].0.branch.as_ref() != Some(name) {
                return Err(failure("branch-in-use"));
            }
            #[cfg(unix)]
            {
                let root = target
                    .work_tree
                    .as_ref()
                    .ok_or_else(|| failure("checkout-custody-required"))?;
                let lock = custody_lock_path(repo, root)?;
                if custody_path.as_ref() != Some(&lock) {
                    return Err(failure("checkout-custody-required"));
                }
            }
            if !self
                .status(target, Untracked::All, None, 1)?
                .entries
                .is_empty()
            {
                return Err(failure("checkout-dirty"));
            }
            if let (ExpectedTip::Oid(a), ExpectedTip::Oid(b)) = (old, next) {
                if !self.ancestry(repo, a, b)? {
                    return Err(failure("not-fast-forward"));
                }
            } else {
                return Err(failure("invalid-fast-forward"));
            }
            Some(target)
        } else {
            if !used.is_empty() {
                return Err(failure("branch-in-use"));
            }
            None
        };
        if let ExpectedTip::Oid(oid) = next {
            self.checked(
                repo,
                &["cat-file", "-e", &format!("{}^{{commit}}", oid.as_str())],
                Policy::Inspect,
            )?;
        }
        let kind = if *next == ExpectedTip::Absent {
            OperationKind::RefDelete
        } else {
            OperationKind::RefUpdate {
                worktree: tree
                    .and_then(|r| r.work_tree.as_ref())
                    .map(|p| p.to_string_lossy().into_owned()),
            }
        };
        wal::require_activation_fence(repo).map_err(failure)?;
        let wal = Wal::with_filesystem(repo.common_dir(), filesystem).map_err(recovery)?;
        let resources = vec![name.as_str().into()];
        admission(&wal, id, &resources)?;
        let binding =
            wal::canonical_digest(&(wal.repository_identity(), "refs", repo.trusted_main_root()))
                .map_err(failure)?;
        let authority = Authority {
            scope: &scope,
            binding: binding.clone(),
        };
        let intent = Intent {
            request_digest: wal::canonical_digest(&(&kind, &resources, old, next, writer))
                .map_err(failure)?,
            kind,
            repo_identity: wal.repository_identity().into(),
            resource_set: resources,
            authority_binding: binding,
            writer_identity: writer.into(),
            object_format: repo.object_format(),
            expected: tip(old),
            next: tip(next),
        };
        let chain = match wal.begin(id, intent, &authority).map_err(failure)? {
            Begin::Created(c) => c,
            Begin::Existing(c) => {
                if matches!(
                    c.outcome(),
                    Some(Outcome::Success { .. } | Outcome::Loss { .. })
                ) {
                    release_pin(self, repo, admin, &wal, &c)?;
                }
                return match c.outcome() {
                    Some(Outcome::Success {
                        observed,
                        attribution,
                    }) => receipt(
                        id,
                        c.intent(),
                        expected(observed, repo)?,
                        *attribution == wal::Attribution::ThisInvocationWonCas,
                        if checkout {
                            Checkout::Reconciled
                        } else {
                            Checkout::NotApplicable
                        },
                        Remote::NotRequested,
                    ),
                    Some(Outcome::Loss { .. }) => Err(stale("compare-and-swap-stale")),
                    _ => Err(recovery("operation-recovery-required")),
                };
            }
            Begin::Compacted(_) => return Err(recovery("operation-recovery-required")),
        };
        if direct(self, repo, name)? != *old {
            wal.append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                .map_err(failure)?;
            return Err(stale("compare-and-swap-stale"));
        }
        // Reachability pin precedes prepared and the only target attempt.
        let candidate = match next {
            ExpectedTip::Oid(o) => o,
            ExpectedTip::Absent => match old {
                ExpectedTip::Oid(o) => o,
                _ => return Err(failure("invalid-ref-delete")),
            },
        };
        install_pin(self, repo, admin, id, candidate)?;
        let chain = wal.append(&chain, Phase::Prepared).map_err(failure)?;
        scope.validate().map_err(failure)?;
        if let Some(target) = tree {
            let lease = scope
                .handle("dispatch-cwd")
                .ok_or_else(|| failure("checkout-custody-required"))?;
            let (ExpectedTip::Oid(old), ExpectedTip::Oid(next)) = (old, next) else {
                unreachable!()
            };
            // read-tree's dry-run does not consistently reject ignored-file
            // replacement. Preserve ignored content by checking its byte paths
            // against the incoming tree, including file/directory collisions.
            let collision = !self.ignored_checkout_collisions(target, next.as_str())?.is_empty();
            if collision {
                let terminal = wal
                    .append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                    .map_err(recovery)?;
                release_pin(self, repo, admin, &wal, &terminal)?;
                return Err(failure("checkout-preflight-failed"));
            }
            for args in [
                vec!["-c", "core.fsync=all", "update-index", "--refresh"],
                vec!["read-tree", "-m", "-n", "-u", old.as_str(), next.as_str()],
            ] {
                let result = self.publication_call(
                    target,
                    lease,
                    &args,
                    &[],
                    false,
                    Duration::from_secs(30),
                )?;
                if !result.success {
                    let terminal = wal
                        .append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                        .map_err(failure)?;
                    release_pin(self, repo, admin, &wal, &terminal)?;
                    return Err(result.error("checkout-preflight-failed"));
                }
            }
        }
        let attempted = wal
            .append(
                &chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: tip(old),
                    next: tip(next),
                },
            )
            .map_err(failure)?;
        let effect = (|| {
            filesystem
                .checkpoint("before-target-cas")
                .map_err(failure)?;
            scope.validate().map_err(failure)?;
            if let Some(target) = tree {
                if !self
                    .status(target, Untracked::All, None, 1)?
                    .entries
                    .is_empty()
                {
                    return Err(recovery("checkout-dirty-recovery-required"));
                }
            }
            let zero = "0".repeat(if repo.object_format() == ObjectFormat::Sha1 {
                40
            } else {
                64
            });
            let old_text = match old {
                ExpectedTip::Absent => zero.as_str(),
                ExpectedTip::Oid(o) => o.as_str(),
            };
            let args = match next {
                ExpectedTip::Absent => {
                    vec![
                        "-c",
                        "core.fsync=all",
                        "update-ref",
                        "--no-deref",
                        "-d",
                        name.as_str(),
                        old_text,
                    ]
                }
                ExpectedTip::Oid(o) => vec![
                    "-c",
                    "core.fsync=all",
                    "update-ref",
                    "--no-deref",
                    name.as_str(),
                    o.as_str(),
                    old_text,
                ],
            };
            let out =
                self.publication_call(repo, admin, &args, &[], false, Duration::from_secs(30))?;
            filesystem.checkpoint("after-target-cas").map_err(failure)?;
            let observed = direct(self, repo, name)?;
            let after = self.checkouts(repo)?;
            let facts = |rows: &Vec<(WorktreeFact, Option<RepoHandle>)>| {
                rows.iter()
                    .map(|(f, _)| (f.path.clone(), f.branch.clone()))
                    .collect::<Vec<_>>()
            };
            if facts(&before) != facts(&after) {
                return Err(recovery("checkout-switch-recovery-required"));
            }
            if !out.success {
                if observed == *old {
                    return Err(out.error("ref-write-failed-recovery-required"));
                }
                let terminal = wal
                    .append(
                        &attempted,
                        Phase::Outcome(Outcome::Loss {
                            observed: tip(&observed),
                        }),
                    )
                    .map_err(failure)?;
                release_pin(self, repo, admin, &wal, &terminal)?;
                return Err(stale("compare-and-swap-stale"));
            }
            if observed != *next {
                return Err(recovery("ref-read-back-recovery-required"));
            }
            if let Some(target) = tree {
                scope.validate().map_err(failure)?;
                let old = match old {
                    ExpectedTip::Oid(o) => o.as_str(),
                    _ => unreachable!(),
                };
                let next = match next {
                    ExpectedTip::Oid(o) => o.as_str(),
                    _ => unreachable!(),
                };
                let lease = scope
                    .handle("dispatch-cwd")
                    .ok_or_else(|| failure("checkout-custody-required"))?;
                let result = self.publication_call(
                    target,
                    lease,
                    &["-c", "core.fsync=all", "read-tree", "-m", "-u", old, next],
                    &[],
                    false,
                    Duration::from_secs(30),
                )?;
                if !result.success {
                    return Err(result.error("checkout-recovery-required"));
                }
                if !self
                    .status(target, Untracked::All, None, 1)?
                    .entries
                    .is_empty()
                {
                    return Err(recovery("checkout-recovery-required"));
                }
            }
            let final_checkouts = self.checkouts(repo)?;
            if facts(&before) != facts(&final_checkouts) || direct(self, repo, name)? != *next {
                return Err(recovery("checkout-read-back-recovery-required"));
            }
            sync_refs(repo, name)?;
            let terminal = wal
                .append(
                    &attempted,
                    Phase::Outcome(Outcome::Success {
                        observed: tip(&observed),
                        attribution: wal::Attribution::ThisInvocationWonCas,
                    }),
                )
                .map_err(failure)?;
            release_pin(self, repo, admin, &wal, &terminal)?;
            receipt(
                id,
                attempted.intent(),
                observed,
                true,
                if checkout {
                    Checkout::Reconciled
                } else {
                    Checkout::NotApplicable
                },
                Remote::NotRequested,
            )
        })();
        effect.map_err(|e| {
            if e.code == ResultCode::Stale {
                e
            } else {
                let mut e = pending(e, id);
                if let Ok(observed) = direct(self, repo, name) {
                    e.receipt = receipt(
                        id,
                        attempted.intent(),
                        observed,
                        false,
                        if checkout {
                            Checkout::RecoveryRequired
                        } else {
                            Checkout::NotApplicable
                        },
                        Remote::NotRequested,
                    )
                    .ok()
                    .map(Box::new);
                }
                e
            }
        })
    }
}

pub(crate) fn acquire_worktree_admin<'a>(
    repo: &RepoHandle,
    held: Vec<BorrowedHandle<'a>>,
) -> Result<LockScope<'a>> {
    require_lock_scope_platform()?;
    let mut scope = LockScope::seeded(held).map_err(failure)?;
    scope
        .assert_can_acquire("worktree-admin")
        .map_err(failure)?;
    let params = BTreeMap::from([(
        "fgosDir".into(),
        repo.trusted_main_root()
            .join(".fgos")
            .to_string_lossy()
            .into_owned(),
    )]);
    scope
        .acquire("worktree-admin", &params, Wait::Ms(5000))
        .map_err(failure)?;
    Ok(scope)
}
#[cfg(unix)]
/// The `dispatch-cwd` lease file of a checkout, keyed exactly as the lock registry's
/// `<cwdDevIno>` (`src/holder-lock/registry.mjs`): `<dev>-<ino>-<birthtimeNs>` of the
/// directory after realpath. A different key would probe a lease nobody holds.
pub(crate) fn custody_lock_path(repo: &RepoHandle, root: &Path) -> Result<PathBuf> {
    use std::os::unix::fs::MetadataExt;
    let m = fs::metadata(fs::canonicalize(root).map_err(failure)?).map_err(failure)?;
    let birth = m
        .created()
        .map_err(failure)?
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(failure)?
        .as_nanos();
    Ok(repo.trusted_main_root().join(format!(
        ".fgos/locks/dispatch-cwd--{}-{}-{}.lock",
        m.dev(),
        m.ino(),
        birth
    )))
}
pub(crate) fn branch_in_use(
    fact: &WorktreeFact,
    repo: Option<&RepoHandle>,
    name: &RefName,
) -> Result<bool> {
    let mut in_use = fact.branch.as_ref() == Some(name);
    if let Some(r) = repo {
        for state in [
            "rebase-merge/head-name",
            "rebase-apply/head-name",
            "BISECT_START",
        ] {
            match fs::read(r.git_dir.join(state)) {
                Ok(bytes) => {
                    let branch = std::str::from_utf8(&bytes).map_err(failure)?.trim();
                    in_use |= branch == name.as_str()
                        || (state == "BISECT_START"
                            && format!("refs/heads/{branch}") == name.as_str());
                }
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                Err(e) => return Err(failure(e)),
            }
        }
    }
    Ok(in_use)
}
