//! Publication backend. Every Git child, including observations and transport,
//! passes through the driver's bounded borrowed door. No checkout or index.
use crate::driver::Output;
use crate::wal::{
    self, AuthorityAdmission, Begin, FileSystem, Intent, ObservedRef, Outcome, Phase,
    PublicationAuthority, Recovery, RecoveryReader, Tip, Wal, WalError,
};
use crate::*;
use fgos_holder_lock::Handle;
use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

fn err(cause: impl Into<String>) -> OperationError {
    OperationError {
        code: ResultCode::Refused,
        cause: cause.into(),
        retryable: false,
        operation_id: None,
        receipt: None,
        exit_code: None,
        signal: None,
        stderr: vec![],
        detail: None,
    }
}
fn werr(e: WalError) -> OperationError {
    let mut e = err(format!("publication-wal: {e}"));
    e.code = ResultCode::RecoveryRequired;
    e
}
fn text(bytes: &[u8]) -> Result<&str> {
    std::str::from_utf8(bytes).map_err(|_| err("git-protocol-invalid-utf8"))
}
fn tip(t: &ExpectedTip) -> Tip {
    match t {
        ExpectedTip::Absent => Tip::Absent,
        ExpectedTip::Oid(o) => Tip::Oid(o.as_str().into()),
    }
}
fn expected(t: &Tip, format: ObjectFormat) -> Result<ExpectedTip> {
    Ok(match t {
        Tip::Absent => ExpectedTip::Absent,
        Tip::Oid(s) => ExpectedTip::Oid(Oid::parse(s, format).map_err(|_| err("invalid-oid"))?),
    })
}
fn own_ref(name: &RefName) -> bool {
    [
        "refs/fgos/events/",
        "refs/fgos/local-events/",
        "refs/fgos/branch-events/",
    ]
    .iter()
    .any(|p| name.as_str().starts_with(p))
}

/// Trusted caller binds its acquired event-seal to one stream/ref and writer.
/// `resource_path` is the Event Store's resolved seal resource, never a worker
/// request path. No fd or boolean can construct this authority.
pub struct HolderAuthority<'a> {
    handle: &'a mut Handle,
    common: PathBuf,
    repo_identity: String,
    reference: RefName,
    writer: String,
    binding: String,
    not_sync: std::marker::PhantomData<std::cell::Cell<()>>,
}
impl<'a> HolderAuthority<'a> {
    pub fn new(
        repo: &RepoHandle,
        handle: &'a mut Handle,
        resource_path: &Path,
        reference: RefName,
        writer: &str,
    ) -> Result<Self> {
        Self::bind(repo, handle, resource_path, reference, writer, false)
    }
    /// Explicit trusted one-time legacy import grant. It does not grant any
    /// mirror, branch or machine ref besides refs/fgos/legacy.
    pub fn legacy_import(
        repo: &RepoHandle,
        handle: &'a mut Handle,
        resource_path: &Path,
        writer: &str,
    ) -> Result<Self> {
        Self::bind(
            repo,
            handle,
            resource_path,
            RefName::parse("refs/fgos/legacy").expect("literal ref"),
            writer,
            true,
        )
    }
    fn bind(
        repo: &RepoHandle,
        handle: &'a mut Handle,
        resource_path: &Path,
        reference: RefName,
        writer: &str,
        legacy: bool,
    ) -> Result<Self> {
        fgos_holder_lock::validate(handle)
            .map_err(|e| err(format!("publication-borrow-unavailable: {e}")))?;
        if !cfg!(target_os = "linux")
            || handle.name() != "event-seal"
            || writer.is_empty()
            || !(own_ref(&reference) || (legacy && reference.as_str() == "refs/fgos/legacy"))
            || fs::canonicalize(resource_path).map_err(|_| err("publication-borrow-unavailable"))?
                != fs::canonicalize(handle.path())
                    .map_err(|_| err("publication-borrow-unavailable"))?
        {
            return Err(err("publication-borrow-unavailable"));
        }
        let wal = Wal::open(repo).map_err(werr)?;
        let binding = wal::canonical_digest(&(
            wal.repository_identity(),
            handle.name(),
            fs::canonicalize(resource_path).map_err(|_| err("publication-borrow-unavailable"))?,
            reference.as_str(),
            writer,
        ))
        .map_err(werr)?;
        Ok(Self {
            handle,
            common: repo.common_dir().into(),
            repo_identity: wal.repository_identity().into(),
            reference,
            writer: writer.into(),
            binding,
            not_sync: std::marker::PhantomData,
        })
    }
    fn validate(&self, repo: &RepoHandle) -> Result<()> {
        fgos_holder_lock::validate(self.handle)
            .map_err(|e| err(format!("publication-borrow-unavailable: {e}")))?;
        if repo.common_dir() != self.common
            || Wal::open_existing(&self.common, wal::OsFileSystem)
                .map_err(werr)?
                .repository_identity()
                != self.repo_identity
        {
            return Err(err("repository-identity-changed"));
        }
        Ok(())
    }
}
impl PublicationAuthority for HolderAuthority<'_> {
    fn validate_publication_borrow(&self, i: &Intent) -> wal::WalResult<()> {
        // Wait for unrelated pre-exec children to close their transient
        // copies, without ever signalling a process during admission.
        fgos_holder_lock::validate_quiescent(self.handle)
            .map_err(|_| WalError::PublicationBorrowUnavailable)?;
        if i.repo_identity != self.repo_identity
            || i.authority_binding != self.binding
            || i.writer_identity != self.writer
            || i.resource_set.first().map(String::as_str) != Some(self.reference.as_str())
        {
            return Err(WalError::PublicationBorrowUnavailable);
        }
        match &i.kind {
            wal::OperationKind::PublicationCas if i.resource_set.len() != 1 => {
                return Err(WalError::PublicationBorrowUnavailable)
            }
            wal::OperationKind::RemoteFetch { .. }
                if i.resource_set
                    .iter()
                    .skip(1)
                    .any(|r| !r.starts_with("refs/fgos/remotes/")) =>
            {
                return Err(WalError::PublicationBorrowUnavailable)
            }
            wal::OperationKind::RemotePush { .. } if i.resource_set.len() != 1 => {
                return Err(WalError::PublicationBorrowUnavailable)
            }
            _ => (),
        }
        if Wal::open_existing(&self.common, wal::OsFileSystem)?.repository_identity()
            != self.repo_identity
        {
            return Err(WalError::Untrusted);
        }
        Ok(())
    }
}
impl AuthorityAdmission for HolderAuthority<'_> {
    fn old_performer_gone(&self, i: &Intent) -> wal::WalResult<bool> {
        // Only acquire constructs Handle; it completed predecessor admission.
        // Every operation child is synchronously borrowed, with hooks disabled.
        self.validate_publication_borrow(i)?;
        Ok(true)
    }
}

#[derive(Debug, Clone)]
pub struct RemoteGrant {
    pub name: String,
    pub pinned_url: String,
}

/// Terminal chains of a ref kept whole by admission before compaction.
const RECENT_TERMINAL: usize = 4;

pub struct PublicationPort<'a, F = wal::OsFileSystem> {
    driver: &'a GitDriver,
    authority: HolderAuthority<'a>,
    filesystem: F,
    remote: Option<RemoteGrant>,
    transport_timeout: std::time::Duration,
}
impl<'a> PublicationPort<'a> {
    pub fn new(driver: &'a GitDriver, authority: HolderAuthority<'a>) -> Self {
        Self {
            driver,
            authority,
            filesystem: wal::OsFileSystem,
            remote: None,
            transport_timeout: std::time::Duration::from_secs(300),
        }
    }
}
impl<'a, F: FileSystem> PublicationPort<'a, F> {
    pub fn with_filesystem(
        driver: &'a GitDriver,
        authority: HolderAuthority<'a>,
        filesystem: F,
    ) -> Self {
        Self {
            driver,
            authority,
            filesystem,
            remote: None,
            transport_timeout: std::time::Duration::from_secs(300),
        }
    }
    pub fn with_remote(mut self, remote: RemoteGrant) -> Self {
        self.remote = Some(remote);
        self
    }
    /// Caller-owned transport budget, independent of local plumbing deadlines.
    pub fn with_transport_timeout(mut self, timeout: std::time::Duration) -> Self {
        self.transport_timeout = timeout;
        self
    }
    fn point(&self, name: &'static str) -> Result<()> {
        self.filesystem
            .checkpoint(name)
            .map_err(|e| err(format!("publication-checkpoint {name}: {e}")))
    }
    fn wal(&self, repo: &RepoHandle) -> Result<Wal<&F>> {
        self.authority.validate(repo)?;
        wal::require_activation_fence(repo).map_err(werr)?;
        Wal::with_filesystem(repo.common_dir(), &self.filesystem).map_err(werr)
    }
    /// Admission of `id` on the bound ref. Unresolved chains of the same ref
    /// are closed or block as before. Terminal chains of the same ref, left
    /// by earlier calls, are compacted here (pin released, id binding and
    /// receipt kept in the ledger) except the most recently changed few,
    /// which stay whole so `recover` of a just-finished id still returns its
    /// full receipt. Retained chains stay bounded, so admission never
    /// re-reads a growing history. A compaction that cannot finish keeps its
    /// evidence and is retried by a later call.
    fn admit_pending(&self, repo: &RepoHandle, wal: &Wal<&F>, id: &str) -> Result<()> {
        let mut terminal = Vec::new();
        for chain in wal.retained(100_000).map_err(|e| {
            let mut error = werr(e);
            error.cause = format!("publication-backlog-unreadable: {}", error.cause);
            error
        })? {
            let blocking = &chain.last().operation_id;
            if blocking == id
                || !chain
                    .intent()
                    .resource_set
                    .iter()
                    .any(|r| r == self.authority.reference.as_str())
            {
                continue;
            }
            if let Err(cause) = self.authority.validate_publication_borrow(chain.intent()) {
                let mut e = werr(cause);
                e.operation_id = Some(blocking.clone());
                e.cause = format!("blocking operation {blocking}: {}", e.cause);
                return Err(e);
            }
            if chain.outcome().is_some() {
                terminal.push((wal.last_change(blocking), blocking.clone()));
                continue;
            }
            if matches!(chain.last_state(), Phase::Intent(_) | Phase::Prepared) {
                let terminal = wal
                    .append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                    .map_err(werr)?;
                if let Err(e) = self.release_pin_and_compact(repo, &terminal.last().operation_id) { eprintln!("git compaction deferred: {}: {}", terminal.last().operation_id, e.cause); }
            } else if chain.intent().kind != wal::OperationKind::PublicationCas {
                let mut e = werr(WalError::RecoveryRequired);
                e.operation_id = Some(blocking.clone());
                e.cause = format!("blocking operation {blocking}: {}", e.cause);
                return Err(e);
            }
        }
        // Newest first; an unreadable change time sorts oldest.
        terminal.sort_by_key(|t| std::cmp::Reverse(t.0));
        for (_, old) in terminal.into_iter().skip(RECENT_TERMINAL) {
            if let Err(e) = self.release_pin_and_compact(repo, &old) { eprintln!("git compaction deferred: {old}: {}", e.cause); }
        }
        Ok(())
    }

    fn raw(&self, repo: &RepoHandle, args: &[&str], input: &[u8], remote: bool) -> Result<Output> {
        self.authority.validate(repo)?;
        self.driver.publication_call(
            repo,
            self.authority.handle,
            args,
            input,
            remote,
            self.transport_timeout,
        )
    }
    fn call(&self, repo: &RepoHandle, args: &[&str], input: &[u8]) -> Result<Vec<u8>> {
        let out = self.raw(repo, args, input, false)?;
        if out.success {
            Ok(out.stdout)
        } else {
            Err(out.error(if repo.layout.promisor {
                "promisor-object-unavailable"
            } else if repo.layout.alternates {
                "alternate-object-unavailable"
            } else {
                "git-command-failed"
            }))
        }
    }
    fn oid(&self, repo: &RepoHandle, bytes: &[u8]) -> Result<Oid> {
        Oid::parse(text(bytes)?.trim_end_matches('\n'), repo.object_format())
            .map_err(|_| err("git-protocol-invalid-oid"))
    }
    fn check_oid(&self, repo: &RepoHandle, oid: &Oid) -> Result<()> {
        Oid::parse(oid.as_str(), repo.object_format())
            .map_err(|_| err("object-format-mismatch"))?;
        Ok(())
    }
    fn sync_dir(&self, path: &Path) -> Result<()> {
        let meta = fs::symlink_metadata(path).map_err(|e| err(e.to_string()))?;
        if !meta.is_dir() || meta.file_type().is_symlink() {
            return Err(err("untrusted-publication-directory"));
        }
        fgos_durable_file::sync_directory(path)
            .map_err(|e| err(format!("directory-fsync: {e}")))?;
        self.point("publication-directory-fsync")
    }
    /// Make the object's loose file and its directory entries durable, unless
    /// this process already did for the same loose file.
    fn sync_object(&self, repo: &RepoHandle, oid: &Oid) -> Result<()> {
        let synced = crate::objects::sync_loose_objects(repo.common_dir(), std::slice::from_ref(oid), false)
            .map_err(|e| err(format!("directory-fsync: {e}")))?;
        for _ in &synced {
            self.point("publication-directory-fsync")?;
        }
        self.point("object-durable")
    }
    /// Every existing directory from the ref's parent up to the common dir
    /// (and `reftable/` for that backend): the directory chain of a ref
    /// created, changed or deleted.
    fn ref_dirs(&self, repo: &RepoHandle, reference: &str) -> Result<Vec<PathBuf>> {
        let mut dirs = Vec::new();
        let mut path = repo
            .common_dir()
            .join(reference)
            .parent()
            .unwrap()
            .to_path_buf();
        loop {
            match fs::symlink_metadata(&path) {
                Ok(meta) if meta.is_dir() && !meta.file_type().is_symlink() => dirs.push(path.clone()),
                Ok(_) => return Err(err("untrusted-publication-directory")),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                Err(e) => return Err(err(e.to_string())),
            }
            if path == repo.common_dir() {
                break;
            }
            path = path
                .parent()
                .ok_or_else(|| err("ref-directory-outside-repository"))?
                .into();
        }
        if repo.layout.refs == RefStorage::Reftable {
            dirs.push(repo.common_dir().join("reftable"));
        }
        Ok(dirs)
    }
    /// One existence probe first (`show-ref --exists` reads the ref itself,
    /// so a dangling symbolic ref exists): a missing ref costs one Git child
    /// instead of the listing plus the symbolic probe of `read_ref`. Any ref
    /// that exists is read in full by `read_ref`.
    fn read_ref_absent_first(&self, repo: &RepoHandle, name: &RefName) -> Result<RefValue> {
        let exists = self.raw(
            repo,
            &["show-ref", "--exists", "--", name.as_str()],
            &[],
            false,
        )?;
        match exists.code {
            Some(2) => Ok(RefValue::Absent),
            Some(0) => self.read_ref(repo, name),
            _ => Err(exists.error("read-ref-failed")),
        }
    }
    fn sync_refs(&self, repo: &RepoHandle, reference: &str) -> Result<()> {
        let dirs = self.ref_dirs(repo, reference)?;
        sync_ref_chain(&dirs).map_err(|e| err(e.to_string()))?;
        for _ in &dirs {
            self.point("publication-directory-fsync")?;
        }
        self.point("ref-durable")
    }
    /// Append `phase` to `chain` once `reference`'s directory chain is
    /// durable. The chain's directories are synced while the record's own
    /// bytes are synced, so both can share one journal commit; the record's
    /// name is installed only after both finished, so the record never
    /// exists before the ref is durable.
    fn append_after_ref_durable(
        &self,
        repo: &RepoHandle,
        wal: &Wal<&F>,
        chain: &wal::Chain,
        phase: Phase,
        reference: &str,
    ) -> Result<wal::Chain> {
        let dirs = self.ref_dirs(repo, reference)?;
        let sync = || sync_ref_chain(&dirs);
        let mut refused: Option<OperationError> = None;
        let mut points = || -> std::io::Result<()> {
            let mut done = Ok(());
            for _ in &dirs {
                done = done.and_then(|()| self.point("publication-directory-fsync"));
            }
            done.and_then(|()| self.point("ref-durable")).map_err(|e| {
                let io = std::io::Error::other(e.cause.clone());
                refused = Some(e);
                io
            })
        };
        match wal.append_ordered(chain, phase, Some(&sync), &mut points) {
            Ok(chain) => Ok(chain),
            Err(_) if refused.is_some() => Err(refused.take().expect("checked")),
            Err(WalError::Io(e)) if e.to_string().starts_with("directory-fsync") => Err(err(e.to_string())),
            Err(e) => Err(werr(e)),
        }
    }
    fn object_write(&self, repo: &RepoHandle, kind: &str, bytes: &[u8]) -> Result<Oid> {
        let out = self.call(
            repo,
            &[
                "-c",
                "core.fsync=all",
                "hash-object",
                "-w",
                "--stdin",
                "-t",
                kind,
            ],
            bytes,
        )?;
        let oid = self.oid(repo, &out)?;
        self.sync_object(repo, &oid)?;
        Ok(oid)
    }
    fn ref_tip(&self, repo: &RepoHandle, reference: &str) -> Result<ExpectedTip> {
        Self::tip_of(self.read_ref(
            repo,
            &RefName::parse(reference).map_err(|_| err("invalid-ref"))?,
        )?)
    }
    /// [`Self::ref_tip`] for a ref that is usually absent at this point (an
    /// operation pin before it is created or after it is deleted).
    fn absent_tip(&self, repo: &RepoHandle, reference: &str) -> Result<ExpectedTip> {
        Self::tip_of(self.read_ref_absent_first(
            repo,
            &RefName::parse(reference).map_err(|_| err("invalid-ref"))?,
        )?)
    }
    fn tip_of(value: RefValue) -> Result<ExpectedTip> {
        match value {
            RefValue::Absent => Ok(ExpectedTip::Absent),
            RefValue::Direct(o) => Ok(ExpectedTip::Oid(o)),
            RefValue::Symbolic(_) => Err(err("symbolic-publication-ref")),
        }
    }
    fn cas_raw(
        &self,
        repo: &RepoHandle,
        name: &str,
        old: &ExpectedTip,
        next: &ExpectedTip,
    ) -> Result<Output> {
        // Best-effort symbolic preflight; a create expects nothing there.
        match old {
            ExpectedTip::Absent => self.absent_tip(repo, name)?,
            ExpectedTip::Oid(_) => self.ref_tip(repo, name)?,
        };
        self.cas_preflighted(repo, name, old, next)
    }
    /// The exact-old no-deref update alone, for a caller whose own read of
    /// the ref (a symbolic-or-direct fact) immediately precedes it.
    fn cas_preflighted(
        &self,
        repo: &RepoHandle,
        name: &str,
        old: &ExpectedTip,
        next: &ExpectedTip,
    ) -> Result<Output> {
        let zero = "0".repeat(match repo.object_format() {
            ObjectFormat::Sha1 => 40,
            ObjectFormat::Sha256 => 64,
        });
        let old = match old {
            ExpectedTip::Absent => &zero,
            ExpectedTip::Oid(o) => o.as_str(),
        };
        match next {
            ExpectedTip::Absent => self.raw(
                repo,
                &[
                    "-c",
                    "core.fsync=all",
                    "update-ref",
                    "--no-deref",
                    "-d",
                    name,
                    old,
                ],
                &[],
                false,
            ),
            ExpectedTip::Oid(o) => self.raw(
                repo,
                &[
                    "-c",
                    "core.fsync=all",
                    "update-ref",
                    "--no-deref",
                    name,
                    o.as_str(),
                    old,
                ],
                &[],
                false,
            ),
        }
    }
    fn materialize(
        &self,
        repo: &RepoHandle,
        id: &str,
        i: &Intent,
        outcome: &Outcome,
    ) -> Result<Receipt> {
        // Only outcomes without an observed tip of their own report the
        // current one; the others never read the ref again.
        let current = match outcome {
            Outcome::ConfigApproved
            | Outcome::AbandonedBeforeAttempt
            | Outcome::Transfer { .. }
            | Outcome::Superseded { .. } => {
                tip(&self.ref_tip(repo, &i.resource_set[0])?)
            }
            Outcome::Restore { .. } | Outcome::Land { .. } | Outcome::Commit { .. } | Outcome::CommitRejected { .. } | Outcome::Worktree { .. } | Outcome::Success { .. } | Outcome::Loss { .. } => Tip::Absent,
        };
        let (observed, state, attribution) = match outcome {
            Outcome::Restore { .. } | Outcome::Land { .. } | Outcome::Commit { .. } | Outcome::CommitRejected { .. } | Outcome::Worktree { .. } | Outcome::ConfigApproved
            | Outcome::AbandonedBeforeAttempt
            | Outcome::Transfer { .. } => (
                &current,
                PublicationState::NotPublished,
                Attribution::Uncertain,
            ),
            Outcome::Success {
                observed,
                attribution: wal::Attribution::ThisInvocationWonCas,
            } => (
                observed,
                PublicationState::CasObservedSuccessful,
                Attribution::ThisInvocationWonCas,
            ),
            Outcome::Success { observed, .. } => (
                observed,
                PublicationState::CurrentlyAtCandidate,
                Attribution::EffectObservedOnly,
            ),
            Outcome::Loss { observed } => (
                observed,
                PublicationState::NotPublished,
                Attribution::Uncertain,
            ),
            Outcome::Superseded { attribution, .. } => (
                &current,
                PublicationState::Unknown,
                if *attribution == wal::Attribution::EffectObservedOnly {
                    Attribution::EffectObservedOnly
                } else {
                    Attribution::Uncertain
                },
            ),
        };
        Ok(Receipt {
            operation_id: id.into(),
            request_digest: i.request_digest.clone(),
            local_effect: LocalEffect {
                expected: expected(&i.expected, repo.object_format())?,
                published_oid: match (&i.next, outcome) {
                    (Tip::Oid(o), Outcome::Success { .. }) => {
                        Some(Oid::parse(o, repo.object_format()).map_err(|_| err("invalid-oid"))?)
                    }
                    _ => None,
                },
                observed_tip: expected(observed, repo.object_format())?,
                publication_state: state,
            },
            checkout: Checkout::NotApplicable,
            durability: Durability {
                level: DurabilityLevel::ProcessCrash,
                capability_evidence: vec![
                    "objects/ref/WAL directory fsync; stable-media profile unproved".into(),
                ],
            },
            remote: Remote::NotRequested,
            consumer_settlement: ConsumerSettlement::NotOwnedByGit,
            attribution,
        })
    }
    fn finish(&self, repo: &RepoHandle, chain: &wal::Chain) -> Result<Receipt> {
        self.finish_outcome(repo, &chain.last().operation_id, chain.intent(), chain.outcome().ok_or_else(|| err("missing-terminal-outcome"))?)
    }
    fn finish_outcome(&self, repo: &RepoHandle, id: &str, intent: &Intent, outcome: &Outcome) -> Result<Receipt> {
        let receipt = self.materialize(repo, id, intent, outcome)?;
        if matches!(
            outcome,
            Outcome::Loss { .. } | Outcome::Superseded { .. } | Outcome::AbandonedBeforeAttempt
        ) {
            let mut e = err(match outcome {
                Outcome::Superseded { .. } => "operation-superseded",
                Outcome::AbandonedBeforeAttempt => "abandoned-before-attempt",
                _ => "compare-and-swap-stale",
            });
            e.code = match outcome {
                Outcome::Superseded { .. } => ResultCode::Superseded,
                Outcome::AbandonedBeforeAttempt => ResultCode::Refused,
                _ => ResultCode::Stale,
            };
            e.operation_id = Some(receipt.operation_id.clone());
            e.receipt = Some(Box::new(receipt));
            return Err(e);
        }
        let mut receipt = receipt;
        if let Outcome::Transfer {
            acknowledged,
            unknown,
            ..
        } = outcome
        {
            receipt.remote = if *acknowledged {
                Remote::Acknowledged
            } else if *unknown {
                Remote::Unknown
            } else {
                Remote::Rejected
            };
        }
        Ok(receipt)
    }
    fn pending_error(
        &self,
        repo: &RepoHandle,
        id: &str,
        i: &Intent,
        mut error: OperationError,
    ) -> OperationError {
        error.code = ResultCode::RecoveryRequired;
        error.operation_id = Some(id.into());
        if let Ok(observed) = self.ref_tip(repo, &i.resource_set[0]) {
            let outcome = if i.kind != wal::OperationKind::PublicationCas {
                Outcome::Transfer {
                    acknowledged: false,
                    unknown: true,
                    observations: vec![],
                    details: vec![error.cause.clone()],
                }
            } else if tip(&observed) == i.next {
                Outcome::Success {
                    observed: tip(&observed),
                    attribution: wal::Attribution::EffectObservedOnly,
                }
            } else {
                Outcome::Loss {
                    observed: tip(&observed),
                }
            };
            if let Ok(mut receipt) = self.materialize(repo, id, i, &outcome) {
                receipt.durability.capability_evidence =
                    vec!["pending ref/WAL durability; preserve attempt and pin".into()];
                if tip(&observed) != i.next {
                    receipt.local_effect.publication_state = PublicationState::Unknown;
                }
                error.receipt = Some(Box::new(receipt));
            }
        }
        error
    }
    fn attempt(&self, repo: &RepoHandle, wal: &Wal<&F>, chain: &wal::Chain) -> Result<Receipt> {
        self.attempt_inner(repo, wal, chain).map_err(|e| {
            if matches!(e.code, ResultCode::Stale | ResultCode::Superseded) {
                e
            } else {
                self.pending_error(repo, &chain.last().operation_id, chain.intent(), e)
            }
        })
    }
    fn attempt_inner(
        &self,
        repo: &RepoHandle,
        wal: &Wal<&F>,
        chain: &wal::Chain,
    ) -> Result<Receipt> {
        let i = chain.intent();
        let id = &chain.last().operation_id;
        let attempted = wal
            .append(
                chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: i.expected.clone(),
                    next: i.next.clone(),
                },
            )
            .map_err(werr)?;
        let before = self
            .ref_tip(repo, &i.resource_set[0])
            .map_err(|e| self.pending_error(repo, id, i, e))?;
        if tip(&before) != i.expected {
            let terminal = wal
                .append(
                    &attempted,
                    Phase::Outcome(Outcome::Loss {
                        observed: tip(&before),
                    }),
                )
                .map_err(|e| self.pending_error(repo, id, i, werr(e)))?;
            return self.finish(repo, &terminal);
        }
        self.point("before-target-cas")
            .map_err(|e| self.pending_error(repo, id, i, e))?;
        // `before` is the symbolic preflight of this update.
        let effect = self.cas_preflighted(
            repo,
            &i.resource_set[0],
            &expected(&i.expected, repo.object_format())?,
            &expected(&i.next, repo.object_format())?,
        );
        self.point("after-target-cas")
            .map_err(|e| self.pending_error(repo, id, i, e))?;
        let observed = self
            .ref_tip(repo, &i.resource_set[0])
            .map_err(|e| self.pending_error(repo, id, i, e))?;
        self.point("target-read-back")
            .map_err(|e| self.pending_error(repo, id, i, e))?;
        let outcome = match effect {
            Ok(out) if out.success && tip(&observed) == i.next => Outcome::Success {
                observed: tip(&observed),
                attribution: wal::Attribution::ThisInvocationWonCas,
            },
            Ok(out)
                if !out.success
                    && (text(&out.stderr).unwrap_or("").contains("but expected")
                        || text(&out.stderr)
                            .unwrap_or("")
                            .contains("reference already exists")) =>
            {
                Outcome::Loss {
                    observed: tip(&observed),
                }
            }

            _ => {
                self.sync_refs(repo, &i.resource_set[0])
                    .map_err(|e| self.pending_error(repo, id, i, e))?;
                let mut e = err("publication-outcome-unknown");
                e.code = ResultCode::RecoveryRequired;
                e.operation_id = Some(id.clone());
                return Err(e);
            }
        };
        let terminal = self
            .append_after_ref_durable(
                repo,
                wal,
                &attempted,
                Phase::Outcome(outcome),
                &i.resource_set[0],
            )
            .map_err(|e| self.pending_error(repo, id, i, e))?;
        self.finish(repo, &terminal)
    }
    /// Recover retained PublicationCas records for this bound ref. Unknown
    /// attempts remain pending for a fresh-id successor; no CAS is replayed.
    pub fn recover_publications(&self, repo: &RepoHandle) -> Result<Vec<String>> {
        let wal = self.wal(repo)?;
        // No valid operation id is empty. Admission closes only records that
        // have not reached TargetAttempt; it never reissues an old CAS.
        self.admit_pending(repo, &wal, "")?;
        let mut pending = Vec::new();
        for chain in wal.retained(100_000).map_err(werr)? {
            if chain.intent().kind != wal::OperationKind::PublicationCas
                || chain.intent().resource_set != vec![self.authority.reference.as_str().to_owned()]
            {
                continue;
            }
            self.authority
                .validate_publication_borrow(chain.intent())
                .map_err(werr)?;
            let id = &chain.last().operation_id;
            // A chain whose pin release cannot finish (for example a native
            // lock held on the ref store) stays retained and is reported by
            // id; it never stops recovery of the other chains.
            let settled = if chain.outcome().is_some() {
                true
            } else {
                match self.recover(repo, id) {
                    Ok(_) => true,
                    Err(e) if e.code == ResultCode::RecoveryRequired => {
                        pending.push(id.clone());
                        false
                    }
                    Err(e) if e.code == ResultCode::Stale || e.code == ResultCode::Superseded => {
                        true
                    }
                    Err(e) => return Err(e),
                }
            };
            if settled && self.release_pin_and_compact(repo, id).is_err() {
                pending.push(id.clone());
            }
        }
        Ok(pending)
    }

    /// Observe/recover this id; an attempted CAS is never reissued.
    pub fn recover(&self, repo: &RepoHandle, id: &str) -> Result<Receipt> {
        // event-seal is the resource authority for writers and recoverers.
        // A peer operation's recovery leaf must not delay live publications.
        let wal = self.wal(repo)?;
        if let Some(c) = wal.compacted(id).map_err(werr)? {
            if c.v == 1 {
                let mut e = werr(WalError::RecoveryRequired);
                e.cause = "legacy-compact-receipt-incomplete: expected and next were not recorded; exact-request replay remains available".into();
                e.operation_id = Some(id.into());
                return Err(e);
            }
            let decode_tip = |s: &str| if s == "-" { Tip::Absent } else { Tip::Oid(s.into()) };
            let intent = Intent {
                kind: wal::OperationKind::PublicationCas,
                request_digest: c.request.clone(),
                repo_identity: self.authority.repo_identity.clone(),
                resource_set: vec![self.authority.reference.as_str().into()],
                authority_binding: self.authority.binding.clone(),
                writer_identity: self.authority.writer.clone(),
                object_format: repo.object_format(),
                expected: decode_tip(&c.expected),
                next: decode_tip(&c.next),
            };
            if !c.matches(&intent).map_err(werr)? { return Err(err("publication-borrow-unavailable")); }
            self.authority.validate_publication_borrow(&intent).map_err(werr)?;
            return self.finish_outcome(repo, id, &intent, &c.outcome().map_err(werr)?);
        }
        let chain = wal.inspect(id).map_err(werr)?;
        self.authority
            .validate_publication_borrow(chain.intent())
            .map_err(werr)?;
        if matches!(chain.last_state(), Phase::Intent(_)) {
            let terminal = wal
                .append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                .map_err(werr)?;
            return self.finish(repo, &terminal);
        }
        if chain.intent().kind != wal::OperationKind::PublicationCas
            && matches!(chain.last_state(), Phase::TargetAttempt { .. })
        {
            let mut observations = Vec::new();
            self.sync_all_objects(repo)?;
            for reference in &chain.intent().resource_set {
                let observed = self.ref_tip(repo, reference)?;
                self.sync_refs(repo, reference)?;
                observations.push((reference.clone(), tip(&observed)));
            }
            let terminal = wal
                .append(
                    &chain,
                    Phase::Outcome(Outcome::Transfer {
                        acknowledged: false,
                        unknown: true,
                        observations,
                        details: vec![
                            "recovery observations only; transport was never replayed".into()
                        ],
                    }),
                )
                .map_err(werr)?;
            let receipt = self.finish(repo, &terminal)?;
            wal.compact(
                &terminal,
                &BoundReader { port: self, repo },
                &self.authority,
            )
            .map_err(werr)?;
            return Ok(receipt);
        }
        match wal
            .recover(id, &BoundReader { port: self, repo })
            .map_err(werr)?
        {
            Recovery::Terminal(_) => self.finish(repo, &chain),
            Recovery::FirstAttemptEligible => self.attempt(repo, &wal, &chain),
            Recovery::PinReconciliationRequired
                if !wal.native_lock_present(chain.intent()).map_err(werr)? =>
            {
                let i = chain.intent();
                if !matches!(
                    chain.last_state(),
                    Phase::Prepared | Phase::TargetAttempt { .. }
                ) {
                    return Err(werr(WalError::RecoveryRequired));
                }
                let pin = format!("refs/fgos/git-operations/{id}/candidate");
                let old = self.ref_tip(repo, &pin)?;
                if tip(&old) != i.expected {
                    return Err(werr(WalError::RecoveryRequired));
                }
                let out = self.cas_raw(
                    repo,
                    &pin,
                    &old,
                    &expected(i.candidate(), repo.object_format())?,
                )?;
                if !out.success || tip(&self.ref_tip(repo, &pin)?) != *i.candidate() {
                    return Err(werr(WalError::RecoveryRequired));
                }
                self.sync_refs(repo, &pin)?;
                self.sync_refs(repo, &i.resource_set[0])?;
                let c = wal
                    .append(
                        &chain,
                        Phase::Outcome(Outcome::Success {
                            observed: i.next.clone(),
                            attribution: wal::Attribution::EffectObservedOnly,
                        }),
                    )
                    .map_err(werr)?;
                self.finish(repo, &c)
            }
            Recovery::EffectObservedOnly if !matches!(chain.last_state(), Phase::Intent(_)) => {
                self.sync_refs(repo, &chain.intent().resource_set[0])?;
                let c = wal
                    .append(
                        &chain,
                        Phase::Outcome(Outcome::Success {
                            observed: chain.intent().next.clone(),
                            attribution: wal::Attribution::EffectObservedOnly,
                        }),
                    )
                    .map_err(werr)?;
                self.finish(repo, &c)
            }
            _ => Err(werr(WalError::RecoveryRequired)),
        }
    }
    /// Rule 4a is record-only and delegates every predicate to the WAL.
    pub fn supersede(&self, repo: &RepoHandle, old_id: &str, later_id: &str) -> Result<Receipt> {
        let wal = self.wal(repo)?;
        let old = wal.inspect(old_id).map_err(werr)?;
        self.authority
            .validate_publication_borrow(old.intent())
            .map_err(werr)?;
        let terminal = wal
            .supersede(&old, later_id, &self.authority)
            .map_err(werr)?;
        self.finish(repo, &terminal)
    }
}

struct BoundReader<'a, 'b, F> {
    port: &'a PublicationPort<'b, F>,
    repo: &'a RepoHandle,
}
impl<F: FileSystem> RecoveryReader for BoundReader<'_, '_, F> {
    fn read_ref(&self, reference: &str) -> wal::WalResult<ObservedRef> {
        let name = RefName::parse(reference).map_err(|_| WalError::RecoveryRequired)?;
        // Operation pins are usually gone when recovery or compaction reads them.
        let value = if reference.starts_with("refs/fgos/git-operations/") {
            self.port.read_ref_absent_first(self.repo, &name)
        } else {
            self.port.read_ref(self.repo, &name)
        };
        match value.map_err(|_| WalError::RecoveryRequired)? {
            RefValue::Absent => Ok(ObservedRef::Direct(Tip::Absent)),
            RefValue::Direct(o) => Ok(ObservedRef::Direct(Tip::Oid(o.as_str().into()))),
            RefValue::Symbolic(_) => Ok(ObservedRef::Symbolic),
        }
    }
    fn candidate_intact(&self, i: &Intent) -> wal::WalResult<bool> {
        if self.repo.layout.shallow {
            return Ok(false);
        }
        match i.candidate() {
            Tip::Absent => Ok(true),
            Tip::Oid(o) => {
                let oid = Oid::parse(o, self.repo.object_format())
                    .map_err(|_| WalError::RecoveryRequired)?;
                // One walk proves both facts when the candidate is intact:
                // `<oid>^{commit}` resolves to the oid itself only for a
                // commit (a tag peels to another oid, a tree or blob fails),
                // and the walk fails on any missing object. Anything else is
                // decided by the separate type read and walk below, so every
                // refusal keeps its own answer. History already published at
                // the expected tip passed this check when it was published and
                // is held by that ref: the walk stops at it (as Git's own
                // connectivity check does), so its cost follows the new
                // objects, not the length of the stream.
                let peeled = format!("{o}^{{commit}}");
                let mut args = vec![
                    "rev-list",
                    "--objects",
                    "--missing=error",
                    "--end-of-options",
                    &peeled,
                ];
                let excluded;
                if let Tip::Oid(expected) = &i.expected {
                    excluded = format!("^{expected}");
                    args.push(&excluded);
                }
                if let Ok(out) = self.port.call(self.repo, &args, &[]) {
                    if out.split(|b| *b == b'\n').next() == Some(o.as_bytes()) {
                        self.port.point("candidate-fast-path").map_err(|e| WalError::Io(std::io::Error::other(e.cause)))?;
                        return Ok(true);
                    }
                }
                let obj = self
                    .port
                    .read_object(self.repo, &oid, ObjectType::Commit)
                    .map_err(|_| WalError::RecoveryRequired)?;
                if !matches!(obj, ReadObject::Present { .. }) {
                    return Ok(false);
                }
                Ok(self
                    .port
                    .call(
                        self.repo,
                        &[
                            "rev-list",
                            "--objects",
                            "--missing=error",
                            "--end-of-options",
                            o,
                        ],
                        &[],
                    )
                    .is_ok())
            }
        }
    }
}

/// Fsync a ref's directory chain (see `ref_dirs`), concurrently. A
/// directory that a concurrent ref deletion pruned in the meantime has no
/// entry left to make durable, and its removal is made durable by its parent,
/// which is in the chain: it is skipped, never an error.
fn sync_ref_chain(dirs: &[PathBuf]) -> std::io::Result<()> {
    let paths: Vec<&Path> = dirs.iter().map(PathBuf::as_path).collect();
    let synced = match fgos_durable_file::sync_directories(&paths) {
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => paths.iter().try_for_each(|dir| {
            match fgos_durable_file::sync_directory(dir) {
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
                other => other,
            }
        }),
        other => other,
    };
    synced.map_err(|e| std::io::Error::new(e.kind(), format!("directory-fsync: {e}")))
}

fn kind_name(kind: ObjectType) -> &'static str {
    match kind {
        ObjectType::Blob => "blob",
        ObjectType::Tree => "tree",
        ObjectType::Commit => "commit",
        ObjectType::Tag => "tag",
    }
}
fn identity(i: &Identity, date: &str) -> Result<String> {
    if i.name.is_empty()
        || i.email.is_empty()
        || i.name.contains(['\n', '\r', '\0', '<', '>'])
        || i.email.contains(['\n', '\r', '\0', '<', '>'])
    {
        return Err(err("invalid-commit-identity"));
    }
    let date = date.strip_prefix('@').unwrap_or(date);
    let parts: Vec<_> = date.split(' ').collect();
    if parts.len() != 2
        || parts[0].parse::<u64>().is_err()
        || parts[1].len() != 5
        || !matches!(parts[1].as_bytes()[0], b'+' | b'-')
        || !parts[1].as_bytes()[1..].iter().all(u8::is_ascii_digit)
        || parts[1][1..3].parse::<u32>().unwrap_or(99) > 23
        || parts[1][3..].parse::<u32>().unwrap_or(99) > 59
    {
        return Err(err(
            "explicit-commit-date-required: use <unix-seconds> <+/-HHMM>",
        ));
    }
    Ok(format!("{} <{}> {date}", i.name, i.email))
}
/// The binary object id a tree entry stores (the hex id decoded).
fn raw_oid(oid: &Oid) -> Result<Vec<u8>> {
    let hex = oid.as_str().as_bytes();
    let nibble = |b: u8| match b {
        b'0'..=b'9' => Ok(b - b'0'),
        b'a'..=b'f' => Ok(b - b'a' + 10),
        _ => Err(err("invalid-object-id")),
    };
    hex.chunks(2)
        .map(|pair| Ok(nibble(pair[0])? << 4 | nibble(pair[1])?))
        .collect()
}
impl<F: FileSystem> Publication for PublicationPort<'_, F> {
    fn write_blob(&self, repo: &RepoHandle, bytes: &[u8]) -> Result<Oid> {
        self.object_write(repo, "blob", bytes)
    }
    fn write_tree(&self, repo: &RepoHandle, entries: &[TreeEntry]) -> Result<Oid> {
        let mut seen = BTreeSet::new();
        for e in entries {
            self.check_oid(repo, &e.oid)?;
            if e.name.is_empty()
                || e.name.contains(&0)
                || e.name.contains(&b'/')
                || e.name == b"."
                || e.name == b".."
                || !seen.insert(e.name.clone())
            {
                return Err(err("invalid-literal-tree-entry"));
            }
            if !matches!(e.mode, 0o100644 | 0o100755 | 0o120000 | 0o40000 | 0o160000) {
                return Err(err("invalid-tree-mode"));
            }
        }
        // The canonical tree bytes go through the same fsynced object write as blobs and commits:
        // `git mktree` does not fsync the loose object it writes (git 2.53, even with
        // core.fsync=all), so a power cut after the ref moved could leave the tree empty.
        // Git orders entries by name bytes, a tree compared as if its name ended in '/'.
        let order = |e: &TreeEntry| {
            let mut key = e.name.clone();
            if e.mode == 0o40000 {
                key.push(b'/');
            }
            key
        };
        let mut sorted: Vec<&TreeEntry> = entries.iter().collect();
        sorted.sort_by_key(|e| order(e));
        let mut bytes = Vec::new();
        for e in sorted {
            bytes.extend_from_slice(format!("{:o} ", e.mode).as_bytes());
            bytes.extend_from_slice(&e.name);
            bytes.push(0);
            bytes.extend_from_slice(&raw_oid(&e.oid)?);
        }
        self.object_write(repo, "tree", &bytes)
    }
    fn write_commit(&self, repo: &RepoHandle, input: &CommitInput) -> Result<Oid> {
        self.check_oid(repo, &input.tree)?;
        if !matches!(
            self.read_object(repo, &input.tree, ObjectType::Tree)?,
            ReadObject::Present { .. }
        ) {
            return Err(err("commit-tree-missing"));
        }
        let mut bytes = format!("tree {}\n", input.tree.as_str()).into_bytes();
        for p in &input.parents {
            self.check_oid(repo, p)?;
            if !matches!(
                self.read_object(repo, p, ObjectType::Commit)?,
                ReadObject::Present { .. }
            ) {
                return Err(err("commit-parent-missing"));
            }
            bytes.extend_from_slice(format!("parent {}\n", p.as_str()).as_bytes());
        }
        bytes.extend_from_slice(
            format!(
                "author {}\ncommitter {}\n\n",
                identity(&input.author, &input.author_date)?,
                identity(&input.committer, &input.committer_date)?
            )
            .as_bytes(),
        );
        bytes.extend_from_slice(&input.message);
        self.object_write(repo, "commit", &bytes)
    }
    fn read_ref(&self, repo: &RepoHandle, name: &RefName) -> Result<RefValue> {
        // One listing answers for a direct ref and for a symbolic ref whose
        // target exists. Only an unlisted name needs the symbolic probe: a
        // dangling symbolic ref is never listed, and it must not read as absent.
        let out = self.call(
            repo,
            &[
                "for-each-ref",
                "--format=%(refname)%00%(objectname)%00%(symref)",
                "--",
                name.as_str(),
            ],
            &[],
        )?;
        for l in out.split(|b| *b == b'\n').filter(|l| !l.is_empty()) {
            let fields: Vec<_> = l.split(|b| *b == 0).collect();
            if fields.len() != 3 {
                return Err(err("invalid-ref-observation"));
            }
            if fields[0] != name.as_str().as_bytes() {
                continue;
            }
            return if fields[2].is_empty() {
                Ok(RefValue::Direct(self.oid(repo, fields[1])?))
            } else {
                Ok(RefValue::Symbolic(
                    RefName::parse(text(fields[2])?).map_err(|_| err("invalid-symbolic-target"))?,
                ))
            };
        }
        let symbolic = self.raw(
            repo,
            &["symbolic-ref", "--quiet", "--", name.as_str()],
            &[],
            false,
        )?;
        if symbolic.success {
            return Ok(RefValue::Symbolic(
                RefName::parse(text(&symbolic.stdout)?.trim_end_matches('\n'))
                    .map_err(|_| err("invalid-symbolic-target"))?,
            ));
        }
        if symbolic.code != Some(1) {
            return Err(symbolic.error("read-ref-failed"));
        }
        Ok(RefValue::Absent)
    }
    fn read_object(
        &self,
        repo: &RepoHandle,
        oid: &Oid,
        expected_type: ObjectType,
    ) -> Result<ReadObject> {
        self.check_oid(repo, oid)?;
        let input = format!("{}\n", oid.as_str());
        let bytes = self.call(repo, &["cat-file", "--batch"], input.as_bytes())?;
        let end = bytes
            .iter()
            .position(|b| *b == b'\n')
            .ok_or_else(|| err("invalid-object-header"))?;
        let fields: Vec<_> = text(&bytes[..end])?.split(' ').collect();
        if fields == [oid.as_str(), "missing"] {
            if repo.layout.promisor || repo.layout.alternates {
                return Err(err(if repo.layout.promisor {
                    "promisor-object-unavailable"
                } else {
                    "alternate-object-unavailable"
                }));
            }
            return Ok(ReadObject::Missing);
        }
        if fields.len() != 3 || fields[0] != oid.as_str() {
            return Err(err("invalid-object-header"));
        }
        if fields[1] != kind_name(expected_type) {
            return Err(err("object-type-mismatch"));
        }
        let size = fields[2]
            .parse::<usize>()
            .map_err(|_| err("invalid-object-size"))?;
        if size != bytes.len().saturating_sub(end + 2) || bytes.last() != Some(&b'\n') {
            return Err(err("invalid-object-size"));
        }
        Ok(ReadObject::Present {
            kind: expected_type,
            bytes: bytes[end + 1..bytes.len() - 1].to_vec(),
        })
    }
    fn compare_and_swap(
        &self,
        repo: &RepoHandle,
        name: &RefName,
        old: &ExpectedTip,
        next: &ExpectedTip,
        id: &str,
    ) -> Result<Receipt> {
        if matches!((old, next), (ExpectedTip::Absent, ExpectedTip::Absent)) {
            return Err(err("delete-requires-exact-old-oid"));
        }
        if name != &self.authority.reference
            || (matches!(next, ExpectedTip::Absent)
                && !name.as_str().starts_with("refs/fgos/branch-events/"))
        {
            return Err(err("publication-namespace-not-granted"));
        }
        for t in [old, next] {
            if let ExpectedTip::Oid(o) = t {
                self.check_oid(repo, o)?;
            }
        }
        self.ref_tip(repo, name.as_str())?;
        let wal = self.wal(repo)?;
        self.admit_pending(repo, &wal, id)?;
        let request_digest =
            wal::canonical_digest(&(name.as_str(), old, next, &self.authority.binding))
                .map_err(werr)?;
        let i = Intent {
            kind: wal::OperationKind::PublicationCas,
            request_digest,
            repo_identity: wal.repository_identity().into(),
            resource_set: vec![name.as_str().into()],
            authority_binding: self.authority.binding.clone(),
            writer_identity: self.authority.writer.clone(),
            object_format: repo.object_format(),
            expected: tip(old),
            next: tip(next),
        };
        if !wal.known_id(id).map_err(werr)? {
            let reader = BoundReader { port: self, repo };
            if !reader.candidate_intact(&i).map_err(werr)? {
                return Err(err("publication-candidate-incomplete"));
            }
            if let Tip::Oid(o) = i.candidate() {
                let oid = Oid::parse(o, repo.object_format()).map_err(|_| err("invalid-oid"))?;
                self.sync_object(repo, &oid)?;
            }
        }
        self.authority
            .validate_publication_borrow(&i)
            .map_err(werr)?;
        let chain = match wal.begin(id, i.clone(), &self.authority).map_err(werr)? {
            Begin::Created(c) => c,
            Begin::Existing(_) => return self.recover(repo, id),
            Begin::Compacted(c) => return self.finish_outcome(repo, id, &i, &c.outcome().map_err(werr)?),
        };
        let i = chain.intent();
        let pin = format!("refs/fgos/git-operations/{id}/candidate");
        self.point("before-pin-cas")?;
        let out = self.cas_raw(
            repo,
            &pin,
            &ExpectedTip::Absent,
            &expected(i.candidate(), repo.object_format())?,
        )?;
        if !out.success {
            return Err(out.error("publication-pin-cas-failed"));
        }
        self.point("after-pin-cas")?;
        if tip(&self.ref_tip(repo, &pin)?) != *i.candidate() {
            return Err(err("publication-pin-read-back-mismatch"));
        }
        self.point("pin-read-back")?;
        let prepared = self.append_after_ref_durable(repo, &wal, &chain, Phase::Prepared, &pin)?;
        let receipt = self.attempt(repo, &wal, &prepared)?;
        if matches!(receipt.attribution, Attribution::ThisInvocationWonCas) {
            for pending in wal.active(100_000).unwrap_or_default() {
                if pending.intent().kind == wal::OperationKind::PublicationCas
                    && pending.intent().resource_set == i.resource_set
                    && pending.last().operation_id != id
                {
                    let old_id = &pending.last().operation_id;
                    let _ = self
                        .supersede(repo, old_id, id)
                        .or_else(|_| self.recover(repo, old_id));
                }
            }
        }
        Ok(receipt)
    }
    fn fetch_refs(&self, repo: &RepoHandle, remote: &str, refspecs: &[String]) -> Result<Receipt> {
        self.fetch(repo, remote, refspecs)
    }
    fn push_refs(
        &self,
        repo: &RepoHandle,
        remote: &str,
        refs: &[(RefName, RefName)],
    ) -> Result<PushResult> {
        self.push(repo, remote, refs)
    }
}

static TRANSFER_ID: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
impl<F: FileSystem> PublicationPort<'_, F> {
    fn remote_url(&self, repo: &RepoHandle, remote: &str) -> Result<(String, &'static str)> {
        let grant = self
            .remote
            .as_ref()
            .ok_or_else(|| err("remote-authority-required"))?;
        if remote != grant.name {
            return Err(err("remote-not-granted"));
        }
        self.authority.validate(repo)?;
        self.driver.remote_target(repo, grant)
    }
    fn remote_call(&self, repo: &RepoHandle, scheme: &str, args: &[String]) -> Result<Output> {
        let argv = crate::remote::transfer_argv(scheme, args);
        self.raw(
            repo,
            &argv.iter().map(String::as_str).collect::<Vec<_>>(),
            &[],
            true,
        )
    }
    fn transfer_intent(
        &self,
        repo: &RepoHandle,
        kind: wal::OperationKind,
        resources: Vec<String>,
    ) -> Result<(String, Intent)> {
        let id = format!(
            "remote-{}-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|_| err("clock-before-epoch"))?
                .as_nanos(),
            TRANSFER_ID.fetch_add(1, std::sync::atomic::Ordering::Relaxed)
        );
        let request_digest =
            wal::canonical_digest(&(&kind, &resources, &self.authority.binding)).map_err(werr)?;
        // One read: a transfer records the bound ref's tip as both values.
        let current = tip(&self.ref_tip(repo, &resources[0])?);
        Ok((
            id,
            Intent {
                kind,
                request_digest,
                repo_identity: self.authority.repo_identity.clone(),
                resource_set: resources.clone(),
                authority_binding: self.authority.binding.clone(),
                writer_identity: self.authority.writer.clone(),
                object_format: repo.object_format(),
                expected: current.clone(),
                next: current,
            },
        ))
    }
    fn transfer_start(
        &self,
        repo: &RepoHandle,
        wal: &Wal<&F>,
        id: &str,
        intent: Intent,
    ) -> Result<wal::Chain> {
        self.admit_pending(repo, wal, id)?;
        let chain = match wal.begin(id, intent, &self.authority).map_err(werr)? {
            Begin::Created(c) => c,
            _ => return Err(err("remote-operation-id-conflict")),
        };
        let chain = wal.append(&chain, Phase::Prepared).map_err(werr)?;
        wal.append(
            &chain,
            Phase::TargetAttempt {
                prior_target_attempt: None,
                expected: chain.intent().expected.clone(),
                next: chain.intent().next.clone(),
            },
        )
        .map_err(werr)
    }
    fn transfer_finish(
        &self,
        repo: &RepoHandle,
        wal: &Wal<&F>,
        chain: &wal::Chain,
        outcome: Outcome,
    ) -> Result<Receipt> {
        let remote = match &outcome {
            Outcome::Transfer {
                acknowledged: true, ..
            } => Remote::Acknowledged,
            Outcome::Transfer { unknown: true, .. } => Remote::Unknown,
            _ => Remote::Rejected,
        };
        let c = wal.append(chain, Phase::Outcome(outcome)).map_err(werr)?;
        let mut receipt = self.finish(repo, &c)?;
        receipt.remote = remote;
        wal.compact(&c, &BoundReader { port: self, repo }, &self.authority)
            .map_err(werr)?;
        Ok(receipt)
    }
    fn sync_all_objects(&self, repo: &RepoHandle) -> Result<()> {
        // Includes loose fanouts and pack indexes after fetch. Never traverse
        // a symlink. The file fsync profile comes from core.fsync=all.
        let objects = repo.common_dir().join("objects");
        for e in fs::read_dir(&objects).map_err(|e| err(e.to_string()))? {
            let e = e.map_err(|e| err(e.to_string()))?;
            if e.file_type().map_err(|e| err(e.to_string()))?.is_symlink() {
                return Err(err("untrusted-object-directory"));
            }
            if e.file_type().map_err(|e| err(e.to_string()))?.is_dir() {
                self.sync_dir(&e.path())?;
            }
        }
        self.sync_dir(&objects)
    }
    fn fetch(&self, repo: &RepoHandle, remote: &str, refspecs: &[String]) -> Result<Receipt> {
        let (url, scheme) = self.remote_url(repo, remote)?;
        if refspecs.is_empty() || refspecs.len() > 2 {
            return Err(err("invalid-publication-fetch-mapping"));
        }
        let allowed = crate::publication_fetch_mappings(remote)?;
        if refspecs.iter().any(|r| !allowed.contains(r)) {
            return Err(err("fetch-destination-not-granted"));
        }
        let advertised = self.remote_call(
            repo,
            scheme,
            &[
                "ls-remote".into(),
                "--refs".into(),
                "--".into(),
                url.clone(),
                "refs/fgos/events/*".into(),
                "refs/fgos/legacy".into(),
            ],
        )?;
        if !advertised.success {
            return Err(advertised.error("remote-advertisement-failed"));
        }
        let mut mappings = vec![];
        for line in text(&advertised.stdout)?.lines() {
            let (oid, source) = line
                .split_once('\t')
                .ok_or_else(|| err("invalid-remote-advertisement"))?;
            let oid = Oid::parse(oid, repo.object_format())
                .map_err(|_| err("remote-object-format-mismatch"))?;
            RefName::parse(source).map_err(|_| err("invalid-remote-ref"))?;
            let target = if source.starts_with("refs/fgos/events/") && refspecs.iter().any(|r| r.starts_with("+refs/fgos/events/")) {
                format!(
                    "refs/fgos/remotes/{remote}/events/{}",
                    &source["refs/fgos/events/".len()..]
                )
            } else if source == "refs/fgos/legacy" && refspecs.iter().any(|r| r.starts_with("+refs/fgos/legacy*:")) {
                format!("refs/fgos/remotes/{remote}/legacy")
            } else {
                continue;
            };
            RefName::parse(&target).map_err(|_| err("invalid-mirror-ref"))?;
            let old = self.ref_tip(repo, &target)?;
            mappings.push((target, oid, old));
        }
        mappings.sort_by(|a, b| a.0.cmp(&b.0));
        let mut resources = vec![self.authority.reference.as_str().into()];
        resources.extend(mappings.iter().map(|m| m.0.clone()));
        let (id, intent) = self.transfer_intent(
            repo,
            wal::OperationKind::RemoteFetch {
                url: url.clone(),
                refspecs: refspecs.to_vec(),
                targets: mappings
                    .iter()
                    .map(|(name, next, old)| {
                        (name.clone(), tip(old), wal::Tip::Oid(next.as_str().into()))
                    })
                    .collect(),
            },
            resources,
        )?;
        let wal = self.wal(repo)?;
        let chain = self.transfer_start(repo, &wal, &id, intent)?;
        let result = (|| {
            self.point("before-fetch")?;
            // Download exact advertised objects without a ref destination. Mirror
            // installation below uses single-ref no-dereference exact-old CAS.
            let mut args: Vec<String> = [
                "-c",
                "core.fsync=all",
                "fetch",
                "--no-write-fetch-head",
                "--no-tags",
                "--no-recurse-submodules",
                "--no-auto-maintenance",
                "--",
            ]
            .map(str::to_owned)
            .to_vec();
            args.push(url);
            args.extend(mappings.iter().map(|m| m.1.as_str().into()));
            if !mappings.is_empty() {
                let out = self.remote_call(repo, scheme, &args)?;
                if !out.success {
                    return Err(out.error("remote-fetch-failed-outcome-recorded-pending"));
                }
            }
            self.point("after-fetch")?;
            self.sync_all_objects(repo)?;
            let mut observations = vec![];
            for (target, oid, old) in mappings {
                let next = ExpectedTip::Oid(oid);
                let out = self.cas_raw(repo, &target, &old, &next)?;
                if !out.success {
                    return Err(out.error("mirror-cas-failed-recovery-required"));
                }
                let observed = self.ref_tip(repo, &target)?;
                if observed != next {
                    return Err(err("mirror-read-back-mismatch"));
                }
                self.sync_refs(repo, &target)?;
                observations.push((target, tip(&observed)));
            }
            self.transfer_finish(
                repo,
                &wal,
                &chain,
                Outcome::Transfer {
                    acknowledged: true,
                    unknown: false,
                    observations,
                    details: vec![],
                },
            )
        })();
        result.map_err(|e| self.pending_error(repo, &id, chain.intent(), e))
    }
    fn push(
        &self,
        repo: &RepoHandle,
        remote: &str,
        refs: &[(RefName, RefName)],
    ) -> Result<PushResult> {
        let (url, scheme) = self.remote_url(repo, remote)?;
        if refs.len() != 1
            || refs[0].0 != self.authority.reference
            || refs[0].1 != self.authority.reference
            || !(refs[0].0.as_str().starts_with("refs/fgos/events/")
                || refs[0].0.as_str() == "refs/fgos/legacy")
        {
            return Err(err("push-ref-not-granted"));
        }
        let local = &refs[0].0;
        // transfer_intent reads the local ref (refusing a symbolic one).
        let spec = format!("{}:{}", local.as_str(), refs[0].1.as_str());
        let advertised = self.remote_call(
            repo,
            scheme,
            &[
                "ls-remote".into(),
                "--refs".into(),
                "--".into(),
                url.clone(),
                refs[0].1.as_str().into(),
            ],
        )?;
        if !advertised.success {
            return Err(advertised.error("remote-advertisement-failed"));
        }
        let mut remote_old = ExpectedTip::Absent;
        for line in text(&advertised.stdout)?.lines() {
            let (oid, name) = line
                .split_once('\t')
                .ok_or_else(|| err("invalid-remote-advertisement"))?;
            if name != refs[0].1.as_str() {
                return Err(err("unexpected-remote-ref"));
            }
            remote_old = ExpectedTip::Oid(
                Oid::parse(oid, repo.object_format()).map_err(|_| err("invalid-remote-oid"))?,
            );
        }

        let (id, intent) = self.transfer_intent(
            repo,
            wal::OperationKind::RemotePush {
                url: url.clone(),
                refspecs: vec![spec.clone()],
                targets: vec![(
                    local.as_str().into(),
                    tip(&remote_old),
                    tip(&self.ref_tip(repo, local.as_str())?),
                )],
            },
            vec![local.as_str().into()],
        )?;
        let wal = self.wal(repo)?;
        let chain = self.transfer_start(repo, &wal, &id, intent)?;
        let result = (|| {
            self.point("before-push")?;
            let output = self.remote_call(
                repo,
                scheme,
                &[
                    "push".into(),
                    "--atomic".into(),
                    "--porcelain".into(),
                    "--no-verify".into(),
                    "--recurse-submodules=no".into(),
                    "--".into(),
                    url,
                    spec,
                ],
            );
            self.point("after-push")?;
            let mut details = vec![];
            let outcome = match output {
                Ok(out) => {
                    // Git porcelain ref result is tab-delimited; diagnostics never
                    // establish a winner or an acknowledgement on their own.
                    let lines = text(&out.stdout)?;
                    let line = lines.lines().find(|l| l.as_bytes().get(1) == Some(&b'\t'));
                    match line {
                        Some(l)
                            if l.starts_with("!\t")
                                && (l.contains("[rejected] (non-fast-forward)")
                                    || l.contains("[rejected] (fetch first)")) =>
                        {
                            details.push(l.into());
                            PushOutcome::RejectedNonFastForward {
                                advertised_tip: None,
                            }
                        }
                        Some(l) if l.starts_with("!\t") => {
                            details.push(l.into());
                            PushOutcome::RejectedOther { reason: l.into() }
                        }
                        Some(l) if out.success && matches!(l.as_bytes()[0], b' ' | b'=' | b'*') => {
                            details.push(l.into());
                            PushOutcome::Accepted
                        }
                        _ => PushOutcome::RemoteOutcomeUnknown,
                    }
                }
                Err(_) => PushOutcome::RemoteOutcomeUnknown,
            };
            let receipt = self.transfer_finish(
                repo,
                &wal,
                &chain,
                Outcome::Transfer {
                    acknowledged: matches!(outcome, PushOutcome::Accepted),
                    unknown: matches!(outcome, PushOutcome::RemoteOutcomeUnknown),
                    observations: vec![],
                    details,
                },
            )?;
            Ok(PushResult {
                receipt,
                refs: vec![(local.clone(), outcome)],
            })
        })();
        result.map_err(|e| self.pending_error(repo, &id, chain.intent(), e))
    }
}

impl<F: FileSystem> PublicationPort<'_, F> {
    /// Release only this operation's exact pin, then retain its immutable id
    /// binding/terminal evidence through WAL compaction. Never delete evidence
    /// of an unresolved attempt or a native Git lock artifact.
    pub fn release_pin_and_compact(
        &self,
        repo: &RepoHandle,
        id: &str,
    ) -> Result<wal::CompactReceipt> {
        let wal = self.wal(repo)?;
        let mut chain = match wal.inspect(id) {
            Ok(chain) => chain,
            // Already compacted (for example by a later publication's
            // admission): the ledger entry is the result.
            Err(WalError::Io(e)) if e.kind() == std::io::ErrorKind::NotFound => {
                return wal.compacted(id).map_err(werr)?.ok_or_else(|| werr(WalError::Io(e)));
            }
            Err(e) => return Err(werr(e)),
        };
        self.authority
            .validate_publication_borrow(chain.intent())
            .map_err(werr)?;
        if chain.outcome().is_none() {
            return Err(werr(WalError::RecoveryRequired));
        }
        if chain.intent().kind != wal::OperationKind::PublicationCas {
            return wal
                .compact(&chain, &BoundReader { port: self, repo }, &self.authority)
                .map_err(werr);
        }
        let pin = format!("refs/fgos/git-operations/{id}/candidate");
        if matches!(chain.last_state(), Phase::Outcome(_)) {
            chain = wal
                .append(
                    &chain,
                    Phase::PinReleaseAttempt {
                        prior_target_attempt: None,
                        expected: chain.intent().candidate().clone(),
                        next: Tip::Absent,
                    },
                )
                .map_err(werr)?;
        }
        // The pin name is unique to this operation id, written once before
        // Prepared, and nothing but this release touches it after the
        // operation is terminal. So a pin still equal to the recorded
        // candidate proves the earlier delete did not take effect (no ABA is
        // possible), and the same exact-old delete is re-issued. Absence is
        // the terminal observation; any other value preserves the evidence.
        // A native lock blocks the delete, is never removed here, and a later
        // call completes once it is gone.
        if matches!(chain.last_state(), Phase::PinReleaseAttempt { .. }) {
            let candidate = expected(chain.intent().candidate(), repo.object_format())?;
            let now = self.absent_tip(repo, &pin)?;
            if now == candidate {
                let out = self.cas_raw(repo, &pin, &candidate, &ExpectedTip::Absent)?;
                if !out.success && self.ref_tip(repo, &pin)? != ExpectedTip::Absent {
                    return Err(out.error("pin-release-failed"));
                }
            } else if now != ExpectedTip::Absent {
                return Err(werr(WalError::RecoveryRequired));
            }
            chain = self.append_after_ref_durable(repo, &wal, &chain, Phase::PinReleased, &pin)?;
        }
        wal.compact(&chain, &BoundReader { port: self, repo }, &self.authority)
            .map_err(werr)
    }
}

impl<F: FileSystem> Inspect for PublicationPort<'_, F> {
    fn resolve_head(&self, repo: &RepoHandle) -> Result<HeadFact> {
        Inspect::resolve_head(self.driver, repo)
    }
    fn list_tree(
        &self,
        repo: &RepoHandle,
        revision: &Oid,
        prefix: &[u8],
        cursor: Option<TreeCursor>,
        max_entries: usize,
    ) -> Result<TreePage> {
        Inspect::list_tree(self.driver, repo, revision, prefix, cursor, max_entries)
    }
    fn list_refs(
        &self,
        repo: &RepoHandle,
        prefixes: &[RefPrefix],
        cursor: Option<RefCursor>,
        max_entries: usize,
    ) -> Result<RefPage> {
        Inspect::list_refs(self.driver, repo, prefixes, cursor, max_entries)
    }
    fn read_paths_at(
        &self,
        repo: &RepoHandle,
        revision: &Oid,
        paths: &[Vec<u8>],
        max_blob_bytes: usize,
    ) -> Result<Vec<PathRead>> {
        Inspect::read_paths_at(self.driver, repo, revision, paths, max_blob_bytes)
    }

    fn walk_commits(
        &self,
        repo: &RepoHandle,
        tips: &[Oid],
        stop: &[Oid],
        cursor: Option<WalkCursor>,
        bounds: WalkBounds,
    ) -> Result<WalkPage> {
        Inspect::walk_commits(self.driver, repo, tips, stop, cursor, bounds)
    }
    fn configured_fetch_refspecs(&self, r: &RepoHandle, remote: &str) -> Result<Vec<ConfigFact>> {
        Inspect::configured_fetch_refspecs(self.driver, r, remote)
    }
    fn push_refspecs(&self, r: &RepoHandle, remote: &str) -> Result<Vec<ConfigFact>> {
        Inspect::push_refspecs(self.driver, r, remote)
    }
    fn remote_url(&self, r: &RepoHandle, remote: &str) -> Result<String> {
        Inspect::remote_url(self.driver, r, remote)
    }
    fn machine_id(&self, r: &RepoHandle) -> Result<Option<ConfigFact>> {
        Inspect::machine_id(self.driver, r)
    }
    fn git_floor_verdict(&self) -> Result<GitFloorVerdict> {
        Inspect::git_floor_verdict(self.driver)
    }
    fn fetch_mapping_provenance(
        &self,
        r: &RepoHandle,
        remote: &str,
    ) -> Result<Option<FetchMappingProvenance>> {
        Inspect::fetch_mapping_provenance(self.driver, r, remote)
    }
    fn resolve_repo(&self, path: &Path) -> Result<ResolveRepo> {
        Inspect::resolve_repo(self.driver, path)
    }
}
