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
    fn admit_pending(&self, repo: &RepoHandle, wal: &Wal<&F>, id: &str) -> Result<()> {
        for chain in wal.active(100_000).map_err(|e| {
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
            if matches!(chain.last().phase, Phase::Intent(_) | Phase::Prepared) {
                let terminal = wal
                    .append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                    .map_err(werr)?;
                let _ = self.release_pin_and_compact(repo, &terminal.last().operation_id);
            } else if chain.intent().kind != wal::OperationKind::PublicationCas {
                let mut e = werr(WalError::RecoveryRequired);
                e.operation_id = Some(blocking.clone());
                e.cause = format!("blocking operation {blocking}: {}", e.cause);
                return Err(e);
            }
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
    fn sync_object(&self, repo: &RepoHandle, oid: &Oid) -> Result<()> {
        let objects = repo.common_dir().join("objects");
        let fanout = objects.join(&oid.as_str()[..2]);
        if fanout.exists() {
            self.sync_dir(&fanout)?;
        }
        self.sync_dir(&objects)?;
        self.point("object-durable")
    }
    fn sync_refs(&self, repo: &RepoHandle, reference: &str) -> Result<()> {
        let mut path = repo
            .common_dir()
            .join(reference)
            .parent()
            .unwrap()
            .to_path_buf();
        loop {
            match fs::symlink_metadata(&path) {
                Ok(_) => self.sync_dir(&path)?,
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
            self.sync_dir(&repo.common_dir().join("reftable"))?;
        }
        self.point("ref-durable")
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
        match self.read_ref(
            repo,
            &RefName::parse(reference).map_err(|_| err("invalid-ref"))?,
        )? {
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
        self.ref_tip(repo, name)?; // best-effort symbolic preflight
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
        let current = tip(&self.ref_tip(repo, &i.resource_set[0])?);
        let (observed, state, attribution) = match outcome {
            Outcome::AbandonedBeforeAttempt | Outcome::Transfer { .. } => (
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
        let receipt = self.materialize(
            repo,
            &chain.last().operation_id,
            chain.intent(),
            chain
                .outcome()
                .ok_or_else(|| err("missing-terminal-outcome"))?,
        )?;
        if matches!(
            chain.outcome(),
            Some(
                Outcome::Loss { .. } | Outcome::Superseded { .. } | Outcome::AbandonedBeforeAttempt
            )
        ) {
            let mut e = err(match chain.outcome() {
                Some(Outcome::Superseded { .. }) => "operation-superseded",
                Some(Outcome::AbandonedBeforeAttempt) => "abandoned-before-attempt",
                _ => "compare-and-swap-stale",
            });
            e.code = match chain.outcome() {
                Some(Outcome::Superseded { .. }) => ResultCode::Superseded,
                Some(Outcome::AbandonedBeforeAttempt) => ResultCode::Refused,
                _ => ResultCode::Stale,
            };
            e.operation_id = Some(receipt.operation_id.clone());
            e.receipt = Some(Box::new(receipt));
            return Err(e);
        }
        let mut receipt = receipt;
        if let Some(Outcome::Transfer {
            acknowledged,
            unknown,
            ..
        }) = chain.outcome()
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
        let effect = self.cas_raw(
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
        self.sync_refs(repo, &i.resource_set[0])
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
                let mut e = err("publication-outcome-unknown");
                e.code = ResultCode::RecoveryRequired;
                e.operation_id = Some(id.clone());
                return Err(e);
            }
        };
        let terminal = wal
            .append(&attempted, Phase::Outcome(outcome))
            .map_err(|e| self.pending_error(repo, id, i, werr(e)))?;
        self.finish(repo, &terminal)
    }
    /// Recover retained PublicationCas records for this bound ref. Unknown
    /// attempts remain pending for a fresh-id successor; no CAS is replayed.
    pub fn recover_publications(&self, repo: &RepoHandle) -> Result<Vec<String>> {
        let wal = self.wal(repo)?;
        // An interrupted transport is observed and closed, never resent. It
        // must not wedge later local seals sharing this publication authority.
        for chain in wal.active(100_000).map_err(werr)? {
            if matches!(
                chain.intent().kind,
                wal::OperationKind::RemoteFetch { .. } | wal::OperationKind::RemotePush { .. }
            ) && matches!(chain.last().phase, Phase::TargetAttempt { .. })
                && chain.intent().resource_set.first().map(String::as_str)
                    == Some(self.authority.reference.as_str())
            {
                self.authority
                    .validate_publication_borrow(chain.intent())
                    .map_err(werr)?;
                let id = &chain.last().operation_id;
                self.recover(repo, id)?;
            }
        }
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
            if chain.outcome().is_some() {
                self.release_pin_and_compact(repo, id)?;
                continue;
            }
            match self.recover(repo, id) {
                Ok(_) => {
                    self.release_pin_and_compact(repo, id)?;
                }
                Err(e) if e.code == ResultCode::RecoveryRequired => pending.push(id.clone()),
                Err(e) if e.code == ResultCode::Stale || e.code == ResultCode::Superseded => {
                    self.release_pin_and_compact(repo, id)?;
                }
                Err(e) => return Err(e),
            }
        }
        Ok(pending)
    }

    /// Observe/recover this id; an attempted CAS is never reissued.
    pub fn recover(&self, repo: &RepoHandle, id: &str) -> Result<Receipt> {
        let wal = self.wal(repo)?;
        let chain = wal.inspect(id).map_err(werr)?;
        self.authority
            .validate_publication_borrow(chain.intent())
            .map_err(werr)?;
        if matches!(chain.last().phase, Phase::Intent(_)) {
            let terminal = wal
                .append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                .map_err(werr)?;
            return self.finish(repo, &terminal);
        }
        if chain.intent().kind != wal::OperationKind::PublicationCas
            && matches!(chain.last().phase, Phase::TargetAttempt { .. })
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
                    chain.last().phase,
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
            Recovery::EffectObservedOnly if !matches!(chain.last().phase, Phase::Intent(_)) => {
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
        match self
            .port
            .read_ref(
                self.repo,
                &RefName::parse(reference).map_err(|_| WalError::RecoveryRequired)?,
            )
            .map_err(|_| WalError::RecoveryRequired)?
        {
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
impl<F: FileSystem> Publication for PublicationPort<'_, F> {
    fn write_blob(&self, repo: &RepoHandle, bytes: &[u8]) -> Result<Oid> {
        self.object_write(repo, "blob", bytes)
    }
    fn write_tree(&self, repo: &RepoHandle, entries: &[TreeEntry]) -> Result<Oid> {
        let mut input = Vec::new();
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
            let kind = match e.mode {
                0o100644 | 0o100755 | 0o120000 => "blob",
                0o40000 => "tree",
                0o160000 => "commit",
                _ => return Err(err("invalid-tree-mode")),
            };
            input.extend_from_slice(format!("{:o} {kind} {}\t", e.mode, e.oid.as_str()).as_bytes());
            input.extend_from_slice(&e.name);
            input.push(0);
        }
        let out = self.call(repo, &["-c", "core.fsync=all", "mktree", "-z"], &input)?;
        let oid = self.oid(repo, &out)?;
        self.sync_object(repo, &oid)?;
        Ok(oid)
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
                self.sync_object(
                    repo,
                    &Oid::parse(o, repo.object_format()).map_err(|_| err("invalid-oid"))?,
                )?;
            }
        }
        self.authority
            .validate_publication_borrow(&i)
            .map_err(werr)?;
        let chain = match wal.begin(id, i.clone(), &self.authority).map_err(werr)? {
            Begin::Created(c) => c,
            Begin::Existing(_) => return self.recover(repo, id),
            Begin::Compacted(c) => {
                let outcome = c.outcome().map_err(werr)?;
                let receipt = self.materialize(repo, id, &i, &outcome)?;
                if matches!(
                    outcome,
                    Outcome::Loss { .. }
                        | Outcome::Superseded { .. }
                        | Outcome::AbandonedBeforeAttempt
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
                    e.operation_id = Some(id.into());
                    e.receipt = Some(Box::new(receipt));
                    return Err(e);
                }
                return Ok(receipt);
            }
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
        self.sync_refs(repo, &pin)?;
        let prepared = wal.append(&chain, Phase::Prepared).map_err(werr)?;
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
    fn remote_url(&self, repo: &RepoHandle, remote: &str) -> Result<(String, String)> {
        let grant = self
            .remote
            .as_ref()
            .ok_or_else(|| err("remote-authority-required"))?;
        if remote != grant.name
            || remote.is_empty()
            || !remote
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"_-".contains(&b))
        {
            return Err(err("remote-not-granted"));
        }
        let bytes = self.call(repo, &["remote", "get-url", "--", remote], &[])?;
        let url = text(&bytes)?.trim_end_matches('\n');
        if url != grant.pinned_url
            || url.contains(['\n', '\r', '\0'])
            || url.contains('@')
            || url.starts_with('-')
        {
            return Err(err("remote-url-not-pinned-or-credentials-present"));
        }
        let scheme = if url.starts_with('/') || url.starts_with("file://") {
            "file"
        } else if url.starts_with("https://") {
            "https"
        } else if url.starts_with("ssh://") {
            "ssh"
        } else {
            return Err(err("remote-protocol-not-supported"));
        };
        Ok((url.into(), scheme.into()))
    }
    fn remote_call(&self, repo: &RepoHandle, scheme: &str, args: &[String]) -> Result<Output> {
        let mut argv = vec![
            "-c".into(),
            "protocol.allow=never".into(),
            "-c".into(),
            format!("protocol.{scheme}.allow=always"),
            "-c".into(),
            "core.sshCommand=ssh -oBatchMode=yes".into(),
            "-c".into(),
            "core.askPass=".into(),
            "-c".into(),
            "credential.helper=".into(),
        ];
        argv.extend_from_slice(args);
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
                expected: tip(&self.ref_tip(repo, &resources[0])?),
                next: tip(&self.ref_tip(repo, &resources[0])?),
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
        let events = format!("+refs/fgos/events/*:refs/fgos/remotes/{remote}/events/*");
        let legacy = format!("+refs/fgos/legacy:refs/fgos/remotes/{remote}/legacy");
        if refspecs.iter().any(|r| r != &events && r != &legacy) {
            return Err(err("fetch-destination-not-granted"));
        }
        let advertised = self.remote_call(
            repo,
            &scheme,
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
            let target = if source.starts_with("refs/fgos/events/") && refspecs.contains(&events) {
                format!(
                    "refs/fgos/remotes/{remote}/events/{}",
                    &source["refs/fgos/events/".len()..]
                )
            } else if source == "refs/fgos/legacy" && refspecs.contains(&legacy) {
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
                let out = self.remote_call(repo, &scheme, &args)?;
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
        self.ref_tip(repo, local.as_str())?;
        let spec = format!("{}:{}", local.as_str(), refs[0].1.as_str());
        let (id, intent) = self.transfer_intent(
            repo,
            wal::OperationKind::RemotePush {
                url: url.clone(),
                refspecs: vec![spec.clone()],
            },
            vec![local.as_str().into()],
        )?;
        let wal = self.wal(repo)?;
        let chain = self.transfer_start(repo, &wal, &id, intent)?;
        let result = (|| {
            self.point("before-push")?;
            let output = self.remote_call(
                repo,
                &scheme,
                &[
                    "push".into(),
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
        let mut chain = wal.inspect(id).map_err(werr)?;
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
        if matches!(chain.last().phase, Phase::Outcome(_)) {
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
            let old = expected(chain.intent().candidate(), repo.object_format())?;
            let out = self.cas_raw(repo, &pin, &old, &ExpectedTip::Absent)?;
            if !out.success && self.ref_tip(repo, &pin)? != ExpectedTip::Absent {
                return Err(out.error("pin-release-failed"));
            }
        }
        // A resumed release never retries its irreversible deletion. Absence
        // is a terminal observation, any other value preserves the evidence.
        if matches!(chain.last().phase, Phase::PinReleaseAttempt { .. }) {
            if self.ref_tip(repo, &pin)? != ExpectedTip::Absent {
                return Err(werr(WalError::RecoveryRequired));
            }
            self.sync_refs(repo, &pin)?;
            chain = wal.append(&chain, Phase::PinReleased).map_err(werr)?;
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
