//! Publication WAL. Evidence ordering is not resource authority. Callers must
//! hold the stream's event-seal and borrow it into every effecting Git child.
//! No method here executes, retries, rolls back or deletes a Git ref.
use crate::{ObjectFormat, Oid, RefName, RepoHandle};
use fgos_durable_file::{install_ordered, Installed};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File, OpenOptions};
use std::io::{self, Read};
use std::path::{Path, PathBuf};

const MAX_RECORD: u64 = 64 * 1024;
const MAX_RECORDS: usize = 16;
pub type WalResult<T> = Result<T, WalError>;
#[derive(Debug)]
pub enum WalError {
    Io(io::Error),
    Corrupt(String),
    Untrusted,
    OperationIdConflict,
    PublicationBorrowUnavailable,
    Busy,
    RecoveryRequired,
    Unsupported,
    FenceMissing,
}
impl From<io::Error> for WalError {
    fn from(e: io::Error) -> Self {
        Self::Io(e)
    }
}
impl std::fmt::Display for WalError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if matches!(self, Self::FenceMissing) {
            return write!(f, "git-fence-missing");
        }
        write!(f, "{self:?}")
    }
}
impl std::error::Error for WalError {}
fn corrupt(s: &str) -> WalError {
    WalError::Corrupt(s.into())
}

/// An injected filesystem checkpoint is called after each acknowledged WAL
/// filesystem boundary. Returning an error simulates process loss, retaining
/// all evidence. Durable-file provides the lower-level write/fsync boundaries.
pub trait FileSystem: Send + Sync {
    fn checkpoint(&self, step: &'static str) -> io::Result<()>;
}
// A shared injected filesystem controls both WAL and operation boundaries.
impl<T: FileSystem + ?Sized> FileSystem for &T {
    fn checkpoint(&self, step: &'static str) -> std::io::Result<()> {
        (**self).checkpoint(step)
    }
}
struct FaultAdapter<'a>(&'a dyn FileSystem);
impl fgos_durable_file::FileSystem for FaultAdapter<'_> {
    fn checkpoint(&self, step: &'static str) -> io::Result<()> {
        self.0.checkpoint(step)
    }
}
pub struct OsFileSystem;
impl FileSystem for OsFileSystem {
    fn checkpoint(&self, _: &'static str) -> io::Result<()> {
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ConfigChange {
    pub remote: String,
    pub url: String,
    pub refspecs: Vec<String>,
    pub old_values: Vec<String>,
    pub old_config_digest: String,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct WorktreeDeliveryBinding {
    pub delivered_to: String,
    pub evidence_digest: String,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ScopedCommitIntent {
    pub worktree: String,
    pub baseline: String,
    pub request: String,
    pub paths: Vec<String>,
    pub tree: String,
    pub cutover_grant: Option<crate::CutoverGrant>,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct SyncIntent {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reference: Option<String>,
    pub worktree: String,
    pub head: String,
    pub target: String,
    pub message: String,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LandIntent { pub request: crate::LandRequest, pub candidate: crate::LandCandidate }
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum OperationKind {
    Land(Box<LandIntent>),
    Restore(Box<crate::restore::RestoreIntent>),
    ScopedCommit(Box<ScopedCommitIntent>),
    Sync(Box<SyncIntent>),
    PublicationCas,
    WorktreeCreate {
        path: Box<str>,
        registration: Box<str>,
        branch: Option<Box<str>>,
        session_id: Option<Box<str>>,
    },
    WorktreeMove {
        source: Box<str>,
        destination: Box<str>,
        registration: Box<str>,
        registration_identity: Box<str>,
    },
    WorktreeRemove {
        path: Box<str>,
        registration: Box<str>,
        registration_identity: Box<str>,
        delivery: Box<WorktreeDeliveryBinding>,
    },
    RefUpdate {
        worktree: Option<String>,
    },
    RefDelete,
    ConfigChange(Box<ConfigChange>),
    RemoteFetch {
        url: String,
        refspecs: Vec<String>,
        #[serde(default, skip_serializing_if = "Vec::is_empty")] // Preserve historical digests.
        targets: Vec<(String, Tip, Tip)>,
    },
    RemotePush {
        url: String,
        refspecs: Vec<String>,
        #[serde(default, skip_serializing_if = "Vec::is_empty")] // Preserve historical digests.
        targets: Vec<(String, Tip, Tip)>,
    },
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Intent {
    pub kind: OperationKind,
    pub request_digest: String,
    pub repo_identity: String,
    pub resource_set: Vec<String>,
    pub authority_binding: String,
    pub writer_identity: String,
    pub object_format: ObjectFormat,
    pub expected: Tip,
    pub next: Tip,
}
fn is_false(value: &bool) -> bool { !value }
/// Strings are validated against Intent.objectFormat before use, including on
/// reads; serde is never a way around Oid/RefName validation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", content = "oid", rename_all = "camelCase")]
pub enum Tip {
    Absent,
    Oid(String),
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Attribution {
    ThisInvocationWonCas,
    EffectObservedOnly,
    Uncertain,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub enum Outcome {
    Restore { state: String },
    Land { checkout: String, #[serde(default, rename = "observedOnly", skip_serializing_if = "is_false")] observed_only: bool },
    Commit {
        observed: String,
        contract_violation: bool,
    },
    CommitRejected {
        cause: String,
    },
    /// Effect-free approval; URL and mappings live in the ConfigChange intent.
    ConfigApproved,
    Worktree {
        completed: bool,
        details: Vec<String>,
    },
    AbandonedBeforeAttempt,
    Transfer {
        acknowledged: bool,
        unknown: bool,
        observations: Vec<(String, Tip)>,
        details: Vec<String>,
    },
    Success {
        observed: Tip,
        attribution: Attribution,
    },
    Loss {
        observed: Tip,
    },
    Superseded {
        later_operation_id: String,
        later_receipt_digest: String,
        attribution: Attribution,
    },
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(
    tag = "phase",
    content = "data",
    rename_all = "kebab-case",
    deny_unknown_fields
)]
pub enum Phase {
    RestoreApplied { snapshot: String },
    LandVerified { evidence: crate::LandEvidence, #[serde(default, skip_serializing_if = "Option::is_none")] checkout: Option<String> },
    Intent(Intent),
    Prepared,
    SyncState {
        conflicts: Vec<String>,
        staged: Vec<String>,
        index_digest: String,
        #[serde(default, skip_serializing_if = "Vec::is_empty")]
        clean_modes: Vec<(String, u32)>,
    },
    /// Durable one-shot barrier before Sync invokes its ref-moving commit.
    SyncCommitAttempt {
        tree: String,
    },
    TargetAttempt {
        prior_target_attempt: Option<()>,
        expected: Tip,
        next: Tip,
    },
    Outcome(Outcome),
    PinReleaseAttempt {
        prior_target_attempt: Option<()>,
        expected: Tip,
        next: Tip,
    },
    PinReleased,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Record {
    pub version: u32,
    pub operation_id: String,
    pub sequence: usize,
    pub previous_digest: Option<String>,
    pub phase: Phase,
    pub digest: String,
}
/// Canonical UTF-8 JSON: recursively sorted keys, no whitespace, no floats.
/// The digest field is omitted when computing an envelope's hash.
pub fn canonical_digest<T: Serialize>(value: &T) -> WalResult<String> {
    let v = serde_json::to_value(value).map_err(|_| corrupt("serialization"))?;
    fn check(v: &serde_json::Value) -> bool {
        match v {
            serde_json::Value::Number(n) => n.is_i64() || n.is_u64(),
            serde_json::Value::Array(a) => a.iter().all(check),
            serde_json::Value::Object(m) => m.values().all(check),
            _ => true,
        }
    }
    if !check(&v) {
        return Err(corrupt("floating point canonical value"));
    }
    // serde_json's default Map is a BTreeMap; explicitly sort regardless of
    // workspace feature unification (preserve_order may be enabled upstream).
    fn sorted(v: serde_json::Value) -> serde_json::Value {
        match v {
            serde_json::Value::Object(m) => {
                let mut entries: Vec<_> = m.into_iter().collect();
                entries.sort_by(|a, b| a.0.cmp(&b.0));
                serde_json::Value::Object(
                    entries.into_iter().map(|(k, v)| (k, sorted(v))).collect(),
                )
            }
            serde_json::Value::Array(a) => {
                serde_json::Value::Array(a.into_iter().map(sorted).collect())
            }
            v => v,
        }
    }
    let bytes = serde_json::to_vec(&sorted(v)).map_err(|_| corrupt("serialization"))?;
    Ok(format!("{:x}", Sha256::digest(bytes)))
}
fn record_digest(record: &Record) -> WalResult<String> {
    let mut v = serde_json::to_value(record).map_err(|_| corrupt("serialization"))?;
    v.as_object_mut()
        .ok_or_else(|| corrupt("envelope"))?
        .remove("digest");
    canonical_digest(&v)
}
pub(crate) fn valid_id(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 80
        && s.bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}
fn digest_valid(s: &str) -> bool {
    s.len() == 64
        && s.bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
fn validate_tip(tip: &Tip, format: ObjectFormat) -> WalResult<()> {
    if let Tip::Oid(s) = tip {
        Oid::parse(s, format).map_err(|_| corrupt("OID"))?;
    }
    Ok(())
}

pub(crate) fn worktree_resources(kind: &OperationKind) -> WalResult<Vec<String>> {
    let mut paths = match kind {
        OperationKind::WorktreeCreate { path, .. } | OperationKind::WorktreeRemove { path, .. } => {
            vec![format!("worktree:{path}")]
        }
        OperationKind::WorktreeMove {
            source,
            destination,
            ..
        } => vec![
            format!("worktree:{source}"),
            format!("worktree:{destination}"),
        ],
        _ => return Err(corrupt("not-a-worktree-operation")),
    };
    if let OperationKind::WorktreeCreate {
        branch: Some(branch),
        ..
    } = kind
    {
        paths.push(branch.to_string());
    }
    paths.sort();
    paths.dedup();
    Ok(paths)
}

impl Intent {
    /// Delete keeps the old object reachable until its terminal receipt.
    pub fn candidate(&self) -> &Tip {
        if self.next == Tip::Absent {
            &self.expected
        } else {
            &self.next
        }
    }
    fn validate(&self) -> WalResult<()> {
        if !digest_valid(&self.request_digest)
            || self.repo_identity.is_empty()
            || self.authority_binding.is_empty()
            || self.writer_identity.is_empty()
            || self.resource_set.is_empty()
        {
            return Err(corrupt("intent binding"));
        }
        if let OperationKind::Restore(p) = &self.kind {
            if !Path::new(&p.worktree).is_absolute() || !checkout_resource_valid(&self.resource_set, &p.worktree)
                || RefName::parse(&p.reference).is_err() || !digest_valid(&p.snapshot)
                || canonical_digest(&p.request)? != self.request_digest
                || self.expected != Tip::Oid(p.request.expected_head.clone()) || self.next != Tip::Oid(p.request.target.clone()) {
                return Err(corrupt("restore binding"));
            }
            Oid::parse(&p.request.expected_head, self.object_format).map_err(|_|corrupt("restore head"))?;
            Oid::parse(&p.request.target, self.object_format).map_err(|_|corrupt("restore target"))?;
            return Ok(());
        }
        if let OperationKind::Land(payload) = &self.kind {
            let c = &payload.candidate;
            let r = &payload.request;
            if !r.destination.starts_with("refs/heads/") || RefName::parse(&r.destination).is_err()
                || self.resource_set.first() != Some(&r.destination)
                || self.resource_set.len() != 2
                || !checkout_resource_valid(&self.resource_set[1..], &c.worktree.to_string_lossy())
                || !Path::new(&c.worktree).is_absolute()
                || c.source != r.source || c.target != r.target
                || self.expected != Tip::Oid(r.target.clone()) || self.next != Tip::Oid(c.candidate.clone())
                || canonical_digest(&c.tree)? != c.tree_digest {
                return Err(corrupt("land binding"));
            }
            for oid in [&r.source, &r.target, &c.candidate, &c.tree] { Oid::parse(oid,self.object_format).map_err(|_|corrupt("land oid"))?; }
            return Ok(());
        }
        if let OperationKind::ScopedCommit(payload) = &self.kind {
            let ScopedCommitIntent {
                worktree,
                paths,
                tree,
                ..
            } = payload.as_ref();
            if !Path::new(worktree).is_absolute()
                || !checkout_resource_valid(&self.resource_set, worktree)
            {
                return Err(corrupt("scoped commit binding"));
            }
            for path in paths {
                if crate::fgos_scope_literal(path).is_err() {
                    return Err(corrupt("scoped commit path"));
                }
            }
            Oid::parse(tree, self.object_format).map_err(|_| corrupt("commit tree"))?;
            validate_tip(&self.expected, self.object_format)?;
            return validate_tip(&self.next, self.object_format);
        }
        if let OperationKind::Sync(payload) = &self.kind {
            let SyncIntent {
                worktree,
                head,
                target,
                message,
                reference,
            } = payload.as_ref();
            if !Path::new(worktree).is_absolute()
                || !checkout_resource_valid(&self.resource_set, worktree)
                || message.is_empty()
                || message.contains('\0')
                || reference
                    .as_ref()
                    .is_some_and(|r| RefName::parse(r).is_err())
            {
                return Err(corrupt("sync binding"));
            }
            Oid::parse(head, self.object_format).map_err(|_| corrupt("sync head"))?;
            Oid::parse(target, self.object_format).map_err(|_| corrupt("sync target"))?;
            validate_tip(&self.expected, self.object_format)?;
            return validate_tip(&self.next, self.object_format);
        }
        let paths = match &self.kind {
            OperationKind::WorktreeCreate {
                path, registration, ..
            }
            | OperationKind::WorktreeRemove {
                path, registration, ..
            } => Some((vec![path], registration)),
            OperationKind::WorktreeMove {
                source,
                destination,
                registration,
                ..
            } => Some((vec![source, destination], registration)),
            _ => None,
        };
        if let Some((paths, registration)) = paths {
            let mut actual = self.resource_set.clone();
            let existing = match &self.kind {
                OperationKind::WorktreeRemove { path, .. } => Some(path.as_ref()),
                OperationKind::WorktreeMove { source, .. } => Some(source.as_ref()),
                _ => None,
            };
            if let Some(path) = existing {
                actual.retain(|r| {
                    !r.strip_prefix(&format!("worktree:{path}:custody:"))
                        .is_some_and(|lock| Path::new(lock).is_absolute())
                });
                if self.resource_set.len() > actual.len() + 1 {
                    return Err(corrupt("worktree custody binding"));
                }
            }
            let resources = worktree_resources(&self.kind)?;
            if paths.iter().any(|p| {
                !Path::new(&***p).is_absolute()
                    || Path::new(&***p).components().any(|c| {
                        matches!(
                            c,
                            std::path::Component::ParentDir | std::path::Component::CurDir
                        )
                    })
            }) || registration.is_empty()
                || registration.contains(['/', '\\'])
                || registration.as_ref() == "."
                || registration.as_ref() == ".."
                || actual != resources
            {
                return Err(corrupt("worktree binding"));
            }
            match &self.kind {
                OperationKind::WorktreeCreate {
                    branch, session_id, ..
                } => {
                    if self.expected != Tip::Absent
                        || self.next == Tip::Absent
                        || session_id.as_ref().is_some_and(|s| !valid_id(s))
                    {
                        return Err(corrupt("worktree create binding"));
                    }
                    if let Some(branch) = branch {
                        RefName::parse(branch).map_err(|_| corrupt("worktree branch"))?;
                        if !branch.starts_with("refs/heads/") {
                            return Err(corrupt("worktree branch"));
                        }
                    }
                }
                OperationKind::WorktreeMove {
                    source,
                    destination,
                    registration_identity,
                    ..
                } => {
                    if source == destination
                        || self.expected == Tip::Absent
                        || self.next != self.expected
                        || registration_identity.is_empty()
                    {
                        return Err(corrupt("worktree move binding"));
                    }
                }
                OperationKind::WorktreeRemove {
                    registration_identity,
                    delivery,
                    ..
                } => {
                    if self.expected == Tip::Absent
                        || self.next != Tip::Absent
                        || registration_identity.is_empty()
                        || !digest_valid(&delivery.evidence_digest)
                        || Oid::parse(&delivery.delivered_to, self.object_format).is_err()
                    {
                        return Err(corrupt("worktree remove binding"));
                    }
                }
                _ => unreachable!(),
            }
            validate_tip(&self.expected, self.object_format)?;
            return validate_tip(&self.next, self.object_format);
        }
        if let OperationKind::ConfigChange(change) = &self.kind {
            let ConfigChange {
                remote,
                url,
                refspecs,
                old_config_digest,
                ..
            } = change.as_ref();
            if remote.is_empty()
                || url.is_empty()
                || refspecs.is_empty()
                || !digest_valid(old_config_digest)
                || self.resource_set != ["config:local"]
                || self.expected != Tip::Absent
                || self.next != Tip::Absent
            {
                return Err(corrupt("config change binding"));
            }
            return Ok(());
        }
        if let OperationKind::RemoteFetch {
            url,
            refspecs,
            targets,
        }
        | OperationKind::RemotePush {
            url,
            refspecs,
            targets,
        } = &self.kind
        {
            if url.is_empty() || refspecs.is_empty() {
                return Err(corrupt("remote binding"));
            }
            let publication = self.resource_set[0].starts_with("refs/fgos/");
            let fetch = matches!(self.kind, OperationKind::RemoteFetch { .. });
            let mut seen = std::collections::BTreeSet::new();
            for (name, old, next) in targets {
                RefName::parse(name).map_err(|_| corrupt("remote target"))?;
                validate_tip(old, self.object_format)?;
                validate_tip(next, self.object_format)?;
                if !self.resource_set.contains(name)
                    || !seen.insert(name)
                    || *next == Tip::Absent
                    || (publication && fetch && !name.starts_with("refs/fgos/remotes/"))
                    || (publication && !fetch && name != &self.resource_set[0])
                    || (!publication && fetch && !name.starts_with("refs/remotes/"))
                    || (!publication && !fetch && !name.starts_with("refs/heads/"))
                {
                    return Err(corrupt("remote target resource"));
                }
            }
            if !publication {
                if targets.len() != self.resource_set.len()
                    || targets.len() != refspecs.len()
                    || self.expected != Tip::Absent
                    || self.next != Tip::Absent
                {
                    return Err(corrupt("remote targets"));
                }
                for spec in refspecs {
                    let (source, destination) = spec
                        .split_once(':')
                        .ok_or_else(|| corrupt("remote mapping"))?;
                    RefName::parse(source).map_err(|_| corrupt("remote source"))?;
                    RefName::parse(destination).map_err(|_| corrupt("remote destination"))?;
                    if source.starts_with("refs/fgos/") || !seen.contains(&destination.to_owned()) {
                        return Err(corrupt("remote mapping resource"));
                    }
                }
                for resource in &self.resource_set {
                    RefName::parse(resource).map_err(|_| corrupt("resource ref"))?;
                }
                if self
                    .resource_set
                    .iter()
                    .collect::<std::collections::BTreeSet<_>>()
                    .len()
                    != self.resource_set.len()
                {
                    return Err(corrupt("duplicate remote resource"));
                }
                return Ok(());
            }
        }
        if matches!(
            self.kind,
            OperationKind::RefUpdate { .. } | OperationKind::RefDelete
        ) {
            for resource in &self.resource_set {
                RefName::parse(resource).map_err(|_| corrupt("resource ref"))?;
                if resource.starts_with("refs/fgos/") {
                    return Err(corrupt("non-event resource"));
                }
            }
            match &self.kind {
                OperationKind::RefUpdate { .. } | OperationKind::RefDelete => {
                    if self.resource_set.len() != 1
                        || !self.resource_set[0].starts_with("refs/heads/")
                        || (matches!(self.kind, OperationKind::RefDelete)
                            && (self.next != Tip::Absent || self.expected == Tip::Absent))
                        || (matches!(self.kind, OperationKind::RefUpdate { .. })
                            && self.next == Tip::Absent)
                    {
                        return Err(corrupt("refs binding"));
                    }
                }
                _ => unreachable!(),
            }
            validate_tip(&self.expected, self.object_format)?;
            return validate_tip(&self.next, self.object_format);
        }
        for resource in &self.resource_set {
            RefName::parse(resource).map_err(|_| corrupt("resource ref"))?;
            if !resource.starts_with("refs/fgos/")
                || resource.starts_with("refs/fgos/git-operations/")
            {
                return Err(corrupt("publication resource"));
            }
        }
        match &self.kind {
            OperationKind::PublicationCas if self.resource_set.len() != 1 => {
                return Err(corrupt("CAS resource set"))
            }
            OperationKind::RemoteFetch { url, refspecs, .. }
            | OperationKind::RemotePush { url, refspecs, .. }
                if url.is_empty() || refspecs.is_empty() =>
            {
                return Err(corrupt("remote binding"))
            }
            _ => (),
        }
        validate_tip(&self.expected, self.object_format)?;
        validate_tip(&self.next, self.object_format)
    }
}

#[derive(Debug, Clone)]
pub struct Chain {
    records: Vec<Record>,
}
impl Chain {
    pub fn records(&self) -> &[Record] {
        &self.records
    }
    pub fn intent(&self) -> &Intent {
        match &self.records[0].phase {
            Phase::Intent(i) => i,
            _ => unreachable!("validated chain"),
        }
    }
    pub fn outcome(&self) -> Option<&Outcome> {
        self.records.iter().find_map(|r| {
            if let Phase::Outcome(o) = &r.phase {
                Some(o)
            } else {
                None
            }
        })
    }
    pub fn last(&self) -> &Record {
        self.records.last().expect("validated nonempty chain")
    }
    fn validate(&self, id: &str) -> WalResult<()> {
        if self.records.is_empty() {
            return Err(corrupt("empty operation directory"));
        }
        for (n, r) in self.records.iter().enumerate() {
            if r.version != 1
                || r.sequence != n
                || r.operation_id != id
                || r.digest != record_digest(r)?
                || r.previous_digest != n.checked_sub(1).map(|p| self.records[p].digest.clone())
            {
                return Err(corrupt("version/hash/chain"));
            }
            if n == 0 {
                if let Phase::Intent(i) = &r.phase {
                    i.validate()?;
                } else {
                    return Err(corrupt("missing intent"));
                }
            } else {
                validate_transition(&self.records[..n], &r.phase)?;
            }
        }
        Ok(())
    }
}
fn checkout_resource_valid(resources: &[String], worktree: &str) -> bool {
    resources == [format!("worktree:{worktree}")]
        || resources.len() == 1
            && resources[0]
                .strip_prefix(&format!("worktree:{worktree}:custody:"))
                .is_some_and(|p| Path::new(p).is_absolute())
}
fn validate_transition(records: &[Record], phase: &Phase) -> WalResult<()> {
    let i = match &records[0].phase {
        Phase::Intent(i) => i,
        _ => return Err(corrupt("intent")),
    };
    let prev = &records.last().ok_or_else(|| corrupt("empty"))?.phase;
    let valid = match (prev, phase) {
        (Phase::TargetAttempt { .. }, Phase::RestoreApplied { snapshot }) => matches!(i.kind, OperationKind::Restore(_)) && digest_valid(snapshot),
        (Phase::Intent(_) | Phase::Prepared, Phase::Outcome(Outcome::ConfigApproved)) => {
            matches!(i.kind, OperationKind::ConfigChange(_))
        }
        (Phase::Intent(_) | Phase::Prepared, Phase::Outcome(Outcome::CommitRejected { cause })) => {
            cause == "foreign-checkout-abandoned"
                && matches!(
                    i.kind,
                    OperationKind::ScopedCommit(_) | OperationKind::Sync(_)
                )
        }
        (
            Phase::TargetAttempt { .. } | Phase::SyncState { .. } | Phase::SyncCommitAttempt { .. },
            Phase::Outcome(Outcome::CommitRejected { cause }),
        ) if cause == "foreign-checkout-effect-unknown" => matches!(
            i.kind,
            OperationKind::ScopedCommit(_) | OperationKind::Sync(_)
        ),
        (Phase::Prepared, Phase::LandVerified { evidence, .. }) => {
            matches!(&i.kind, OperationKind::Land(p) if evidence.source == p.candidate.source && evidence.target == p.candidate.target && evidence.candidate == p.candidate.candidate && evidence.tree_digest == p.candidate.tree_digest && !evidence.evidence_digest.is_empty())
        }
        (Phase::LandVerified { .. }, Phase::TargetAttempt { prior_target_attempt: None, expected, next }) => matches!(i.kind,OperationKind::Land(_)) && expected == &i.expected && next == &i.next,
        (Phase::Intent(_), Phase::Prepared) => true,
        (Phase::Intent(_) | Phase::Prepared | Phase::LandVerified { .. }, Phase::Outcome(Outcome::AbandonedBeforeAttempt)) => {
            true
        }
        (
            Phase::Prepared,
            Phase::Outcome(Outcome::Success {
                observed,
                attribution: Attribution::EffectObservedOnly,
            }),
        ) => i.kind == OperationKind::PublicationCas && observed == &i.next,
        (
            Phase::Prepared,
            Phase::TargetAttempt {
                prior_target_attempt: None,
                expected,
                next,
            },
        ) => !matches!(i.kind,OperationKind::Land(_)) && expected == &i.expected && next == &i.next,
        (
            Phase::TargetAttempt { .. },
            Phase::SyncState {
                conflicts,
                staged,
                index_digest,
                clean_modes,
            },
        ) => {
            matches!(i.kind, OperationKind::Sync(_))
                && digest_valid(index_digest)
                && clean_modes.iter().all(|(p, mode)| {
                    staged.contains(p) && !conflicts.contains(p) && *mode <= 0o177777
                })
                && conflicts
                    .iter()
                    .chain(staged)
                    .all(|p| crate::fgos_scope_literal(p).is_ok())
        }
        (Phase::SyncState { .. }, Phase::SyncCommitAttempt { tree }) => {
            matches!(i.kind, OperationKind::Sync(_)) && Oid::parse(tree, i.object_format).is_ok()
        }
        (
            Phase::TargetAttempt { .. } | Phase::SyncState { .. } | Phase::SyncCommitAttempt { .. } | Phase::RestoreApplied { .. },
            Phase::Outcome(o),
        ) => match o {
            Outcome::Restore { state } => matches!(i.kind, OperationKind::Restore(_)) && ["restored", "effectObservedOnly", "recoveryRequired"].contains(&state.as_str()),
            Outcome::Land { checkout, .. } => matches!(i.kind, OperationKind::Land(_)) && ["reconciled","pending","pendingStoreCollision","notApplicable","recoveryRequired"].contains(&checkout.as_str()),
            Outcome::Commit { observed, .. } => {
                matches!(
                    i.kind,
                    OperationKind::ScopedCommit(_) | OperationKind::Sync(_)
                ) && Oid::parse(observed, i.object_format).is_ok()
                    && (!matches!(i.kind, OperationKind::Sync(_))
                        || matches!(prev, Phase::SyncCommitAttempt { .. }))
            }
            Outcome::CommitRejected { cause } => {
                matches!(
                    i.kind,
                    OperationKind::ScopedCommit(_) | OperationKind::Sync(_)
                ) && !cause.is_empty()
            }
            Outcome::Worktree { details, .. } => {
                matches!(
                    i.kind,
                    OperationKind::WorktreeCreate { .. }
                        | OperationKind::WorktreeMove { .. }
                        | OperationKind::WorktreeRemove { .. }
                ) && details.len() <= 64
            }
            Outcome::AbandonedBeforeAttempt | Outcome::ConfigApproved => false,
            Outcome::Transfer {
                acknowledged,
                unknown,
                observations,
                details,
            } => {
                if matches!(
                    i.kind,
                    OperationKind::PublicationCas
                        | OperationKind::RefUpdate { .. }
                        | OperationKind::RefDelete
                        | OperationKind::Land(_)
                ) || details.len() > 1024
                    || (*acknowledged && *unknown)
                {
                    return Err(corrupt("transfer outcome"));
                }
                for (reference, observed) in observations {
                    if !i.resource_set.contains(reference) {
                        return Err(corrupt("transfer observation resource"));
                    }
                    validate_tip(observed, i.object_format)?;
                }
                true
            }
            Outcome::Success {
                observed,
                attribution,
            } => {
                validate_tip(observed, i.object_format)?;
                matches!(
                    i.kind,
                    OperationKind::PublicationCas
                        | OperationKind::RefUpdate { .. }
                        | OperationKind::RefDelete
                ) && observed == &i.next
                    && *attribution != Attribution::Uncertain
            }
            Outcome::Loss { observed } => {
                validate_tip(observed, i.object_format)?;
                matches!(
                    i.kind,
                    OperationKind::PublicationCas
                        | OperationKind::RefUpdate { .. }
                        | OperationKind::RefDelete
                        | OperationKind::Land(_)
                )
            }
            Outcome::Superseded {
                later_operation_id,
                later_receipt_digest,
                attribution,
            } => {
                i.kind == OperationKind::PublicationCas
                    && valid_id(later_operation_id)
                    && digest_valid(later_receipt_digest)
                    && *attribution != Attribution::ThisInvocationWonCas
            }
        },
        (
            Phase::Outcome(_),
            Phase::PinReleaseAttempt {
                prior_target_attempt: None,
                expected,
                next: Tip::Absent,
            },
        ) => expected == i.candidate(),
        (Phase::PinReleaseAttempt { .. }, Phase::PinReleased) => true,
        _ => false,
    };
    if valid {
        Ok(())
    } else {
        Err(corrupt("illegal phase transition"))
    }
}

/// Directory descriptors remain open throughout each operation. All descendants
/// are resolved relative to those descriptors, never a re-resolved WAL path.
struct Directory {
    file: File,
}
impl Directory {
    fn path(&self) -> PathBuf {
        #[cfg(target_os = "linux")]
        {
            use std::os::fd::AsRawFd;
            PathBuf::from(format!("/proc/self/fd/{}", self.file.as_raw_fd()))
        }
        #[cfg(not(target_os = "linux"))]
        {
            PathBuf::new()
        }
    }
    fn open(path: &Path) -> WalResult<Self> {
        Self::open_trusted(path, false)
    }
    fn open_trusted(path: &Path, common: bool) -> WalResult<Self> {
        #[cfg(target_os = "linux")]
        {
            use std::os::unix::fs::{MetadataExt, OpenOptionsExt};
            let file = OpenOptions::new()
                .read(true)
                .custom_flags(libc::O_DIRECTORY | libc::O_NOFOLLOW | libc::O_CLOEXEC)
                .open(path)?;
            let m = file.metadata()?;
            if (m.uid() != unsafe { libc::geteuid() } && !(common && m.uid() == 0))
                || m.mode() & if common { 0o002 } else { 0o022 } != 0
            {
                return Err(WalError::Untrusted);
            }
            Ok(Self { file })
        }
        #[cfg(not(target_os = "linux"))]
        {
            let _ = path;
            Err(WalError::Unsupported)
        }
    }
    fn child(&self, name: &str, create: bool, fsys: &dyn FileSystem) -> WalResult<Self> {
        self.child_synced(name, create, create, fsys)
    }
    /// `sync`: make the child and its name durable now. An operation
    /// directory is created without it: its first record's install fsyncs
    /// the directory and its parent before that record is acknowledged.
    fn child_synced(
        &self,
        name: &str,
        create: bool,
        sync: bool,
        fsys: &dyn FileSystem,
    ) -> WalResult<Self> {
        let path = self.path().join(name);
        if create {
            #[cfg(unix)]
            {
                use std::os::unix::fs::DirBuilderExt;
                match fs::DirBuilder::new().mode(0o700).create(&path) {
                    Ok(()) => {
                        fsys.checkpoint("mkdir")?;
                    }
                    Err(e) if e.kind() == io::ErrorKind::AlreadyExists => (),
                    Err(e) => return Err(e.into()),
                }
            }
        }
        let child = Self::open(&path)?;
        // Also sync pre-existing dirs: a preceding failed creator may have
        // installed the name without ever syncing it. Once this process has
        // synced a directory and its name, both stay durable until that
        // directory is removed, so a later open of the same directory (same
        // device, inode and birth time) needs no second fsync.
        if sync {
            let key = durable_key(&child.file);
            if key.is_none()
                || !DURABLE_DIRECTORIES
                    .lock()
                    .is_ok_and(|seen| seen.contains(&key))
            {
                child.file.sync_all()?;
                fsys.checkpoint("directory-fsync")?;
                self.file.sync_all()?;
                fsys.checkpoint("parent-fsync")?;
                if key.is_some() {
                    if let Ok(mut seen) = DURABLE_DIRECTORIES.lock() {
                        seen.insert(key);
                    }
                }
            }
        }
        Ok(child)
    }
}

/// Directories this process has made durable, with their names, by
/// `(device, inode, birth time)`.
static DURABLE_DIRECTORIES: std::sync::Mutex<std::collections::BTreeSet<Option<(u64, u64, u128)>>> =
    std::sync::Mutex::new(std::collections::BTreeSet::new());

/// Identity of a directory that a removal and re-creation cannot reuse;
/// `None` when the filesystem reports no birth time.
fn durable_key(dir: &File) -> Option<(u64, u64, u128)> {
    durable_identity(&dir.metadata().ok()?)
}

pub(crate) fn durable_identity(m: &fs::Metadata) -> Option<(u64, u64, u128)> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let born = m
            .created()
            .ok()?
            .duration_since(std::time::UNIX_EPOCH)
            .ok()?
            .as_nanos();
        Some((m.dev(), m.ino(), born))
    }
    #[cfg(not(unix))]
    {
        let _ = m;
        None
    }
}

pub struct Wal<F = OsFileSystem> {
    common: Directory,
    root: Directory,
    ledger: Directory,
    fs: F,
    identity: String,
}
#[derive(Debug)]
pub enum Begin {
    Created(Chain),
    Existing(Chain),
    Compacted(CompactReceipt),
}
/// All WAL-writing doors require the controller's durable cutover fence.
pub fn require_activation_fence(repo: &RepoHandle) -> WalResult<()> {
    if !fgos_holder_lock::tombstone::is_tombstone(
        &repo.trusted_main_root().join(".fgos/locks/activation.lock"),
        "activation",
        "fgos git",
    ) {
        return Err(WalError::FenceMissing);
    }
    Ok(())
}
impl Wal<OsFileSystem> {
    pub fn open(repo: &RepoHandle) -> WalResult<Self> {
        require_activation_fence(repo)?;
        Self::with_filesystem(repo.common_dir(), OsFileSystem)
    }
}
impl<F: FileSystem> Wal<F> {
    pub fn with_filesystem(common: &Path, fsys: F) -> WalResult<Self> {
        let canonical = common.canonicalize()?;
        if canonical != common {
            return Err(WalError::Untrusted);
        }
        let common = Directory::open_trusted(common, true)?;
        let identity = repository_identity(&common)?;
        let fgos = common.child("fgos", true, &fsys)?;
        let git = fgos.child("git", true, &fsys)?;
        let root = git.child("operations", true, &fsys)?;
        let ledger = git.child("compacted", true, &fsys)?;
        Ok(Self {
            common,
            root,
            ledger,
            fs: fsys,
            identity,
        })
    }
    /// C5/doctor reader: opens existing descriptors without mkdir or fsync.
    /// NotFound means the WAL has never been initialized, not a corrupt chain.
    pub fn open_existing(common_path: &Path, fsys: F) -> WalResult<Self> {
        if common_path.canonicalize()? != common_path {
            return Err(WalError::Untrusted);
        }
        let common = Directory::open_trusted(common_path, true)?;
        let identity = repository_identity(&common)?;
        let fgos = common.child("fgos", false, &fsys)?;
        let git = fgos.child("git", false, &fsys)?;
        let root = git.child("operations", false, &fsys)?;
        let ledger = git.child("compacted", false, &fsys)?;
        Ok(Self {
            common,
            root,
            ledger,
            fs: fsys,
            identity,
        })
    }
    pub(crate) fn store_restore_snapshot<T: Serialize>(&self, value: &T) -> WalResult<String> {
        let bytes = serde_json::to_vec(value).map_err(|_| corrupt("snapshot serialize"))?;
        if bytes.len() > 128 * 1024 * 1024 {
            return Err(corrupt("restore snapshot capacity"));
        }
        let digest = canonical_digest(value)?;
        let git = self
            .common
            .child("fgos", false, &self.fs)?
            .child("git", false, &self.fs)?;
        let dir = git.child("restore-snapshots", true, &self.fs)?;
        install_ordered(
            &dir.path(),
            &digest,
            &bytes,
            &FaultAdapter(&self.fs),
            None,
            &mut || Ok(()),
            &[],
        )
        .map_err(|e| WalError::Io(e.source))?;
        self.fs.checkpoint("restore-snapshot-durable")?;
        let _: serde_json::Value = self.read_restore_snapshot(&digest)?;
        Ok(digest)
    }
    pub(crate) fn read_restore_snapshot<T: serde::de::DeserializeOwned>(
        &self,
        digest: &str,
    ) -> WalResult<T> {
        if !digest_valid(digest) {
            return Err(corrupt("snapshot digest"));
        }
        let dir = self
            .common
            .child("fgos", false, &self.fs)?
            .child("git", false, &self.fs)?
            .child("restore-snapshots", false, &self.fs)?;
        let value: serde_json::Value = read_json(&dir.path().join(digest), 128 * 1024 * 1024)?;
        if canonical_digest(&value)? != digest {
            return Err(corrupt("snapshot digest mismatch"));
        }
        serde_json::from_value(value).map_err(|_| corrupt("snapshot shape"))
    }
    pub fn repository_identity(&self) -> &str {
        &self.identity
    }
    fn operation(&self, id: &str, create: bool) -> WalResult<Directory> {
        if !valid_id(id) {
            return Err(corrupt("operation id"));
        }
        // Record zero's install makes a created operation directory durable.
        self.root.child_synced(id, create, false, &self.fs)
    }
    pub fn begin(
        &self,
        id: &str,
        intent: Intent,
        authority: &dyn PublicationAuthority,
    ) -> WalResult<Begin> {
        authority.validate_publication_borrow(&intent)?;
        intent.validate()?;
        if intent.repo_identity != self.identity {
            return Err(WalError::Untrusted);
        }
        if let Some(c) = self.compacted(id)? {
            if !c.matches(&intent)? {
                return Err(WalError::OperationIdConflict);
            }
            return Ok(Begin::Compacted(c));
        }
        let dir = self.operation(id, true)?;
        if let Some(c) = self.compacted(id)? {
            if !c.matches(&intent)? {
                return Err(WalError::OperationIdConflict);
            }
            return Ok(Begin::Compacted(c));
        }
        // An installed record zero already binds this id: the no-overwrite
        // install below could only lose to it, so answer as that loser
        // would, without writing (and syncing) a doomed temporary.
        if dir.path().join(record_name(0)).try_exists()? {
            fgos_durable_file::sync_directories(&[&dir.path(), &self.root.path()])?;
            self.fs.checkpoint("existing-intent-parent-fsync")?;
            return match self.existing(id, &intent) {
                // A compactor may have removed the chain since: its ledger
                // entry is then the binding, as after a lost install.
                Err(e) => match self.compacted(id)? {
                    Some(c) if c.matches(&intent)? => Ok(Begin::Compacted(c)),
                    Some(_) => Err(WalError::OperationIdConflict),
                    None => Err(e),
                },
                found => found,
            };
        }
        let r = make_record(id, 0, None, Phase::Intent(intent.clone()))?;
        let installed = self.install(&dir, &record_name(0), &r, true)?;
        // A concurrent compactor may have removed record zero after our first
        // ledger read. Its durable binding wins even if we installed a name
        // through a still-open operation directory descriptor.
        if let Some(c) = self.compacted(id)? {
            if !c.matches(&intent)? {
                return Err(WalError::OperationIdConflict);
            }
            return Ok(Begin::Compacted(c));
        }
        match installed {
            Installed::Created => Ok(Begin::Created(Chain { records: vec![r] })),
            Installed::AlreadyExists => self.existing(id, &intent),
        }
    }
    /// The established chain of `id`, when it binds the same request.
    fn existing(&self, id: &str, intent: &Intent) -> WalResult<Begin> {
        let c = self.inspect(id)?;
        if c.intent().request_digest != intent.request_digest
            || binding_digest(c.intent())? != binding_digest(intent)?
        {
            return Err(WalError::OperationIdConflict);
        }
        Ok(Begin::Existing(c))
    }
    /// Install one record: durable-file writes and fsyncs the file, installs
    /// the name without overwrite and fsyncs `dir`. `new_directory`: `dir`
    /// was created for this record (record zero), so its parent is fsynced
    /// too before the record is acknowledged; a later record's directory
    /// name is already durable.
    fn install<T: Serialize>(
        &self,
        dir: &Directory,
        name: &str,
        value: &T,
        new_directory: bool,
    ) -> WalResult<Installed> {
        self.install_ordered(dir, name, value, new_directory, None, &mut || Ok(()))
    }
    /// `alongside` runs while the record bytes are synced, `before_install`
    /// after both and before its name exists (see
    /// `fgos_durable_file::install_ordered`).
    fn install_ordered<T: Serialize>(
        &self,
        dir: &Directory,
        name: &str,
        value: &T,
        new_directory: bool,
        alongside: Option<&(dyn Fn() -> io::Result<()> + Sync)>,
        before_install: &mut dyn FnMut() -> io::Result<()>,
    ) -> WalResult<Installed> {
        let bytes = serde_json::to_vec(value).map_err(|_| corrupt("serialize"))?;
        if bytes.len() as u64 > MAX_RECORD {
            return Err(corrupt("record byte bound"));
        }
        let root = self.root.path();
        let parents: &[&Path] = if new_directory { &[&root] } else { &[] };
        let result = install_ordered(
            &dir.path(),
            name,
            &bytes,
            &FaultAdapter(&self.fs),
            alongside,
            before_install,
            parents,
        )
        .map_err(|e| WalError::Io(e.source))?;
        self.fs.checkpoint("record-install")?;
        Ok(result)
    }
    pub fn inspect(&self, id: &str) -> WalResult<Chain> {
        let dir = self.operation(id, false)?;
        let mut names = Vec::new();
        for (scanned, e) in fs::read_dir(dir.path())?.enumerate() {
            if scanned >= MAX_RECORDS * 2 {
                return Err(corrupt("directory scan bound"));
            }
            let e = e?;
            let name = e
                .file_name()
                .into_string()
                .map_err(|_| corrupt("non UTF-8 record name"))?;
            if is_durable_temporary(&name) {
                continue;
            }
            if names.len() >= MAX_RECORDS {
                return Err(corrupt("record bound"));
            }
            names.push(name);
        }
        names.sort();
        let mut records = Vec::new();
        for (n, name) in names.iter().enumerate() {
            if name != &record_name(n) {
                return Err(corrupt("record gap or unknown evidence"));
            }
            records.push(read_json(&dir.path().join(name), MAX_RECORD)?);
        }
        let chain = Chain { records };
        chain.validate(id)?;
        if chain.intent().repo_identity != self.identity {
            return Err(WalError::Untrusted);
        }
        Ok(chain)
    }
    /// The caller passes the exact chain it observed. A racing installer wins
    /// the next numbered name; the loser gets Busy and no effect permit.
    /// Supersession has a separate checked entry point.
    pub fn append(&self, chain: &Chain, phase: Phase) -> WalResult<Chain> {
        self.append_ordered(chain, phase, None, &mut || Ok(()))
    }
    /// [`Wal::append`] whose record is installed only after `alongside` (run
    /// on another thread while the record's bytes are synced) and then
    /// `before_install` returned `Ok`. A caller uses it to make another
    /// durable effect that must precede this record durable together with
    /// the record's own write.
    pub fn append_ordered(
        &self,
        chain: &Chain,
        phase: Phase,
        alongside: Option<&(dyn Fn() -> io::Result<()> + Sync)>,
        before_install: &mut dyn FnMut() -> io::Result<()>,
    ) -> WalResult<Chain> {
        if matches!(
            phase,
            Phase::Intent(_) | Phase::Outcome(Outcome::Superseded { .. })
        ) {
            return Err(WalError::RecoveryRequired);
        }
        self.append_checked(chain, phase, alongside, before_install)
    }
    fn append_checked(
        &self,
        chain: &Chain,
        phase: Phase,
        alongside: Option<&(dyn Fn() -> io::Result<()> + Sync)>,
        before_install: &mut dyn FnMut() -> io::Result<()>,
    ) -> WalResult<Chain> {
        let id = &chain.last().operation_id;
        chain.validate(id)?;
        let actual = self.inspect(id)?;
        if actual.last().digest != chain.last().digest {
            return Err(WalError::Busy);
        }
        validate_transition(&chain.records, &phase)?;
        let r = make_record(
            id,
            chain.records.len(),
            Some(chain.last().digest.clone()),
            phase,
        )?;
        let dir = self.operation(id, false)?;
        if self.install_ordered(
            &dir,
            &record_name(r.sequence),
            &r,
            false,
            alongside,
            before_install,
        )? != Installed::Created
        {
            return Err(WalError::Busy);
        }
        let mut records = chain.records.clone();
        records.push(r);
        Ok(Chain { records })
    }
    /// Validates durable later evidence and live authority admission. This only
    /// records an outcome; it cannot authorize any replay of the old effect.
    pub fn supersede(
        &self,
        old: &Chain,
        later_id: &str,
        admission: &dyn AuthorityAdmission,
    ) -> WalResult<Chain> {
        if !matches!(old.last().phase, Phase::TargetAttempt { .. })
            || old.last().operation_id == later_id
        {
            return Err(WalError::RecoveryRequired);
        }
        let later = self.inspect(later_id)?;
        let a = old.intent();
        let b = later.intent();
        if a.kind != OperationKind::PublicationCas
            || b.kind != OperationKind::PublicationCas
            || a.repo_identity != b.repo_identity
            || a.resource_set != b.resource_set
            || a.authority_binding != b.authority_binding
            || (b.expected != a.expected && b.expected != a.next)
            || !matches!(
                later.outcome(),
                Some(Outcome::Success {
                    attribution: Attribution::ThisInvocationWonCas,
                    ..
                })
            )
            || !admission.old_performer_gone(a)?
            || self.native_lock_present(a)?
        {
            return Err(WalError::RecoveryRequired);
        }
        let attribution = if b.expected == a.next {
            Attribution::EffectObservedOnly
        } else {
            Attribution::Uncertain
        };
        let receipt = later
            .records
            .iter()
            .find(|r| matches!(r.phase, Phase::Outcome(_)))
            .ok_or_else(|| corrupt("later receipt"))?;
        self.append_checked(
            old,
            Phase::Outcome(Outcome::Superseded {
                later_operation_id: later_id.into(),
                later_receipt_digest: receipt.digest.clone(),
                attribution,
            }),
            None,
            &mut || Ok(()),
        )
    }
    pub(crate) fn native_lock_present(&self, intent: &Intent) -> WalResult<bool> {
        // Never unlink any native lock. Probe files and reftable: an unknown
        // backend artifact conservatively blocks every attempted supersession.
        for p in [
            format!("{}.lock", intent.resource_set[0]),
            "reftable/tables.list.lock".into(),
            "packed-refs.lock".into(),
        ] {
            match fs::symlink_metadata(self.common.path().join(p)) {
                Ok(_) => return Ok(true),
                Err(e) if e.kind() == io::ErrorKind::NotFound => (),
                Err(e) => return Err(e.into()),
            }
        }
        Ok(false)
    }
}
fn compaction_suffix(dir: &Directory, id: &str) -> WalResult<Vec<Record>> {
    let mut records = Vec::new();
    for (count, entry) in fs::read_dir(dir.path())?.enumerate() {
        if count >= MAX_RECORDS {
            return Err(corrupt("compaction residue bound"));
        }
        let entry = entry?;
        let r: Record = read_json(&entry.path(), MAX_RECORD)?;
        if r.version != 1
            || r.operation_id != id
            || entry.file_name() != std::ffi::OsStr::new(&record_name(r.sequence))
            || r.digest != record_digest(&r)?
        {
            return Err(corrupt("unattributable compaction residue"));
        }
        records.push(r);
    }
    records.sort_by_key(|r| r.sequence);
    for pair in records.windows(2) {
        if pair[1].sequence != pair[0].sequence + 1
            || pair[1].previous_digest.as_ref() != Some(&pair[0].digest)
        {
            return Err(corrupt("compaction suffix"));
        }
    }
    if records.last().is_some_and(|r| {
        !matches!(
            r.phase,
            Phase::PinReleased
                | Phase::Outcome(Outcome::Worktree { .. })
                | Phase::Outcome(Outcome::Transfer { .. })
                | Phase::Outcome(Outcome::ConfigApproved)
                | Phase::Outcome(Outcome::AbandonedBeforeAttempt)
        )
    }) {
        return Err(corrupt("nonterminal compaction suffix"));
    }
    Ok(records)
}

fn repository_identity(dir: &Directory) -> WalResult<String> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let m = dir.file.metadata()?;
        Ok(format!("{}:{}", m.dev(), m.ino()))
    }
    #[cfg(not(unix))]
    {
        let _ = dir;
        Err(WalError::Unsupported)
    }
}
fn make_record(
    id: &str,
    sequence: usize,
    previous_digest: Option<String>,
    phase: Phase,
) -> WalResult<Record> {
    let mut r = Record {
        version: 1,
        operation_id: id.into(),
        sequence,
        previous_digest,
        phase,
        digest: String::new(),
    };
    r.digest = record_digest(&r)?;
    Ok(r)
}
fn record_name(n: usize) -> String {
    format!("{n:08}.json")
}
fn read_json<T: for<'de> Deserialize<'de>>(path: &Path, limit: u64) -> WalResult<T> {
    let mut options = OpenOptions::new();
    options.read(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
    }
    let file = options.open(path)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let m = file.metadata()?;
        if m.uid() != unsafe { libc::geteuid() } || m.mode() & 0o022 != 0 {
            return Err(WalError::Untrusted);
        }
    }
    if !file.metadata()?.is_file() || file.metadata()?.len() > limit {
        return Err(corrupt("record size/type"));
    }
    let mut bytes = Vec::new();
    file.take(limit + 1).read_to_end(&mut bytes)?;
    if bytes.len() as u64 > limit {
        return Err(corrupt("record size"));
    }
    serde_json::from_slice(&bytes).map_err(|_| corrupt("record parse"))
}
/// Implemented by the holder-lock adapter, never by deserializing request
/// fields. Must complete §8/8.1 predecessor admission and validate the live
/// event-seal binding, or prove the old containment domain Empty.
/// No default adapter: the operation layer must validate a live event-seal
/// borrow for this exact repository/resource/binding before even Intent is
/// installed. Implement with holder-lock, not a request-supplied boolean/fd.
pub trait PublicationAuthority {
    fn validate_publication_borrow(&self, intent: &Intent) -> WalResult<()>;
}
pub trait AuthorityAdmission {
    fn old_performer_gone(&self, intent: &Intent) -> WalResult<bool>;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ObservedRef {
    Direct(Tip),
    Symbolic,
    Unknown,
}
/// The operation layer implements these reads through the hardened Git driver.
/// The resource and pin are derived here, never supplied by a recorded path.
pub trait RecoveryReader {
    fn read_ref(&self, reference: &str) -> WalResult<ObservedRef>;
    fn candidate_intact(&self, intent: &Intent) -> WalResult<bool>;
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Recovery {
    Unprepared,
    FirstAttemptEligible,
    RecoveryRequired,
    EffectObservedOnly,
    PinReconciliationRequired,
    Terminal(Outcome),
}
impl<F: FileSystem> Wal<F> {
    pub fn recover(&self, id: &str, reader: &dyn RecoveryReader) -> WalResult<Recovery> {
        if let Some(c) = self.compacted(id)? {
            return Ok(Recovery::Terminal(c.outcome()?));
        }
        let c = self.inspect(id)?;
        // Terminal evidence never grants a new effect even if the ref moved.
        if let Some(o) = c.outcome() {
            return Ok(Recovery::Terminal(o.clone()));
        }
        let i = c.intent();
        if i.kind != OperationKind::PublicationCas {
            return Ok(Recovery::RecoveryRequired);
        }
        let target = reader.read_ref(&i.resource_set[0])?;
        let pin = reader.read_ref(&format!("refs/fgos/git-operations/{id}/candidate"))?;
        if matches!(c.last().phase, Phase::Intent(_)) {
            return Ok(Recovery::Unprepared);
        }
        if !reader.candidate_intact(i)? {
            return Ok(Recovery::RecoveryRequired);
        }
        if target == ObservedRef::Direct(i.next.clone()) {
            if pin != ObservedRef::Direct(i.candidate().clone()) || self.native_lock_present(i)? {
                return Ok(Recovery::PinReconciliationRequired);
            }
            return Ok(Recovery::EffectObservedOnly);
        }
        if self.native_lock_present(i)? {
            return Ok(Recovery::RecoveryRequired);
        }
        if target == ObservedRef::Direct(i.expected.clone())
            && pin == ObservedRef::Direct(i.candidate().clone())
            && matches!(c.last().phase, Phase::Prepared)
        {
            return Ok(Recovery::FirstAttemptEligible);
        }
        Ok(Recovery::RecoveryRequired)
    }
}

/// Compact terminal receipt. Keys are short to maintain the ≤512-byte bound
/// even for SHA-256 refs. Request/resource/authority bindings remain immutable.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CompactReceipt {
    pub v: u8,
    pub id: String,
    #[serde(rename = "q")]
    #[serde(with = "ledger_hex")]
    pub request: String,
    #[serde(rename = "b")]
    #[serde(with = "ledger_hex")]
    pub binding: String,
    #[serde(rename = "r")]
    #[serde(with = "ledger_hex_vec")]
    pub receipt: Vec<String>,
    #[serde(default, rename = "e", with = "ledger_hex")]
    pub expected: String,
    #[serde(default, rename = "n", with = "ledger_hex")]
    pub next: String,
    #[serde(default, skip_serializing_if = "Option::is_none", rename = "f")]
    pub reference: Option<String>,
    #[serde(with = "ledger_hex")]
    pub digest: String,
}
// Lossless base64url representation of hex hashes keeps full SHA-256 receipts
// below the signed 512-byte ledger bound, including maximum-length ids.
mod ledger_hex {
    use serde::{Deserialize, Deserializer, Serializer};
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    pub(super) fn encode(s: &str) -> String {
        if !matches!(s.len(), 40 | 64)
            || !s
                .bytes()
                .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
        {
            return s.into();
        }
        let mut out = String::from("~");
        let mut bits = 0u32;
        let mut n = 0;
        for byte in s.as_bytes().as_chunks::<2>().0 {
            let hex = |b: u8| if b <= b'9' { b - b'0' } else { b - b'a' + 10 };
            bits = (bits << 8) | u32::from(hex(byte[0]) * 16 + hex(byte[1]));
            n += 8;
            while n >= 6 {
                n -= 6;
                out.push(ALPHABET[((bits >> n) & 63) as usize] as char);
            }
        }
        if n > 0 {
            out.push(ALPHABET[((bits << (6 - n)) & 63) as usize] as char);
        }
        out
    }
    pub(super) fn decode(s: String) -> Result<String, String> {
        let Some(encoded) = s.strip_prefix('~') else {
            return Ok(s);
        };
        let mut out = String::new();
        let mut bits = 0u32;
        let mut n = 0;
        for c in encoded.bytes() {
            let v = ALPHABET
                .iter()
                .position(|b| *b == c)
                .ok_or("invalid ledger hash")?;
            bits = (bits << 6) | v as u32;
            n += 6;
            if n >= 8 {
                n -= 8;
                let b = ((bits >> n) & 255) as u8;
                use std::fmt::Write;
                write!(out, "{b:02x}").unwrap();
            }
        }
        if encode(&out) != s {
            return Err("noncanonical ledger hash".into());
        }
        Ok(out)
    }
    pub fn serialize<S: Serializer>(s: &str, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&encode(s))
    }
    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<String, D::Error> {
        decode(String::deserialize(d)?).map_err(serde::de::Error::custom)
    }
}
mod ledger_hex_vec {
    use serde::{Deserialize, Deserializer, Serialize, Serializer};
    pub fn serialize<S: Serializer>(values: &[String], serializer: S) -> Result<S::Ok, S::Error> {
        values
            .iter()
            .map(|s| super::ledger_hex::encode(s))
            .collect::<Vec<_>>()
            .serialize(serializer)
    }
    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Vec<String>, D::Error> {
        Vec::<String>::deserialize(d)?
            .into_iter()
            .map(|s| super::ledger_hex::decode(s).map_err(serde::de::Error::custom))
            .collect()
    }
}
fn compact_outcome(o: &Outcome) -> Vec<String> {
    match o {
        Outcome::Restore { state } => vec!["z".into(), state.clone()],
        Outcome::Land { checkout, observed_only } => vec!["d".into(), checkout.clone(), observed_only.to_string()],
        Outcome::Commit {
            observed,
            contract_violation,
        } => vec!["k".into(), observed.clone(), contract_violation.to_string()],
        Outcome::CommitRejected { cause } => vec!["r".into(), cause.clone()],
        Outcome::Worktree { completed, .. } => vec!["w".into(), completed.to_string()],
        Outcome::ConfigApproved => vec!["c".into()],
        Outcome::AbandonedBeforeAttempt => vec!["a".into()],
        Outcome::Transfer {
            acknowledged,
            unknown,
            ..
        } => vec![
            "t".into(),
            acknowledged.to_string(),
            unknown.to_string(),
            canonical_digest(o).expect("serializable outcome"),
        ],
        Outcome::Success {
            observed,
            attribution,
        } => vec![
            "s".into(),
            compact_tip(observed),
            if *attribution == Attribution::ThisInvocationWonCas {
                "w"
            } else {
                "e"
            }
            .into(),
        ],
        Outcome::Loss { observed } => vec!["l".into(), compact_tip(observed)],
        Outcome::Superseded {
            later_operation_id,
            later_receipt_digest,
            attribution,
        } => vec![
            "x".into(),
            later_operation_id.clone(),
            later_receipt_digest.clone(),
            if *attribution == Attribution::EffectObservedOnly {
                "e"
            } else {
                "u"
            }
            .into(),
        ],
    }
}
fn compact_tip(t: &Tip) -> String {
    match t {
        Tip::Absent => "-".into(),
        Tip::Oid(o) => o.clone(),
    }
}
fn valid_compact_outcome(o: &[String]) -> bool {
    let tip = |s: &str| {
        s == "-"
            || Oid::parse(s, ObjectFormat::Sha1).is_ok()
            || Oid::parse(s, ObjectFormat::Sha256).is_ok()
    };
    match o.first().map(String::as_str) {
        Some("z") => o.len() == 2 && ["restored", "effectObservedOnly", "recoveryRequired"].contains(&o[1].as_str()),
        Some("d") => (o.len() == 2 || (o.len() == 3 && ["true", "false"].contains(&o[2].as_str()))) && ["reconciled","pending","pendingStoreCollision","notApplicable","recoveryRequired"].contains(&o[1].as_str()),
        Some("k") => o.len() == 3 && tip(&o[1]) && matches!(o[2].as_str(), "true" | "false"),
        Some("r") => o.len() == 2 && !o[1].is_empty(),
        Some("w") => o.len() == 2 && matches!(o[1].as_str(), "true" | "false"),
        Some("a" | "c") => o.len() == 1,
        Some("t") => {
            o.len() == 4
                && matches!(o[1].as_str(), "true" | "false")
                && matches!(o[2].as_str(), "true" | "false")
                && !(o[1] == "true" && o[2] == "true")
                && digest_valid(&o[3])
        }
        Some("s") => o.len() == 3 && tip(&o[1]) && matches!(o[2].as_str(), "w" | "e"),
        Some("l") => o.len() == 2 && tip(&o[1]),
        Some("x") => {
            o.len() == 4
                && valid_id(&o[1])
                && digest_valid(&o[2])
                && matches!(o[3].as_str(), "e" | "u")
        }
        _ => false,
    }
}
impl CompactReceipt {
    /// Decode the durable terminal observation; request-specific expected/next
    /// and the processCrash-only receipt envelope are supplied by Publication.
    pub fn outcome(&self) -> WalResult<Outcome> {
        if !valid_compact_outcome(&self.receipt) {
            return Err(corrupt("compact outcome"));
        }
        let r = &self.receipt;
        let tip = |s: &str| {
            if s == "-" {
                Tip::Absent
            } else {
                Tip::Oid(s.into())
            }
        };
        Ok(match r[0].as_str() {
            "z" => Outcome::Restore { state: r[1].clone() },
            "k" => Outcome::Commit {
                observed: r[1].clone(),
                contract_violation: r[2] == "true",
            },
            "r" => Outcome::CommitRejected {
                cause: r[1].clone(),
            },
            "d" => Outcome::Land { checkout: r[1].clone(), observed_only: r.get(2).is_some_and(|s| s == "true") },
            "w" => Outcome::Worktree {
                completed: r[1] == "true",
                details: vec![],
            },
            "c" => Outcome::ConfigApproved,
            "a" => Outcome::AbandonedBeforeAttempt,
            "t" => Outcome::Transfer {
                acknowledged: r[1] == "true",
                unknown: r[2] == "true",
                observations: vec![],
                details: vec![format!("compacted transfer digest: {}", r[3])],
            },
            "s" => Outcome::Success {
                observed: tip(&r[1]),
                attribution: if r[2] == "w" {
                    Attribution::ThisInvocationWonCas
                } else {
                    Attribution::EffectObservedOnly
                },
            },
            "l" => Outcome::Loss {
                observed: tip(&r[1]),
            },
            _ => Outcome::Superseded {
                later_operation_id: r[1].clone(),
                later_receipt_digest: r[2].clone(),
                attribution: if r[3] == "e" {
                    Attribution::EffectObservedOnly
                } else {
                    Attribution::Uncertain
                },
            },
        })
    }
    pub(crate) fn matches(&self, i: &Intent) -> WalResult<bool> {
        Ok(self.request == i.request_digest && self.binding == binding_digest(i)?)
    }
}
fn binding_digest(i: &Intent) -> WalResult<String> {
    if matches!(i.kind, OperationKind::Land(_)) {
        return canonical_digest(&("land", &i.repo_identity, i.resource_set.first(), &i.authority_binding, &i.writer_identity, &i.expected, &i.next, i.object_format));
    }
    canonical_digest(&(
        &i.repo_identity,
        &i.resource_set,
        &i.authority_binding,
        &i.expected,
        &i.next,
        i.object_format,
    ))
}
impl<F: FileSystem> Wal<F> {
    /// Finish deletion interrupted after durable ledger installation. Remaining
    /// records must form the exact valid suffix of a terminal chain. Unknown
    /// artifacts are retained. Caller holds the original publication authority.
    pub fn resume_compaction(
        &self,
        id: &str,
        reader: &dyn RecoveryReader,
        intent: &Intent,
        authority: &dyn PublicationAuthority,
    ) -> WalResult<()> {
        authority.validate_publication_borrow(intent)?;
        if !self
            .compacted(id)?
            .ok_or(WalError::RecoveryRequired)?
            .matches(intent)?
        {
            return Err(WalError::OperationIdConflict);
        }
        if reader.read_ref(&format!("refs/fgos/git-operations/{id}/candidate"))?
            != ObservedRef::Direct(Tip::Absent)
        {
            return Err(WalError::RecoveryRequired);
        }
        let dir = match self.operation(id, false) {
            Ok(d) => d,
            Err(WalError::Io(e)) if e.kind() == io::ErrorKind::NotFound => return Ok(()),
            Err(e) => return Err(e),
        };
        let records = compaction_suffix(&dir, id)?;
        for r in records {
            fs::remove_file(dir.path().join(record_name(r.sequence)))?;
            self.fs.checkpoint("remove-record")?;
        }
        dir.file.sync_all()?;
        self.fs.checkpoint("removed-records-fsync")?;
        fs::remove_dir(self.root.path().join(id))?;
        self.fs.checkpoint("remove-operation")?;
        self.root.file.sync_all()?;
        self.fs.checkpoint("removed-operation-parent-fsync")?;
        Ok(())
    }
    pub fn compacted(&self, id: &str) -> WalResult<Option<CompactReceipt>> {
        if !valid_id(id) {
            return Err(corrupt("operation id"));
        }
        let path = self.ledger.path().join(id);
        let c: CompactReceipt = match read_json(&path, 512) {
            Ok(c) => c,
            Err(WalError::Io(e)) if e.kind() == io::ErrorKind::NotFound => return Ok(None),
            Err(e) => return Err(e),
        };
        // Version 1 omitted expected/next. Keep its immutable binding and
        // exact-request replay readable; missing facts must never be guessed.
        let d = if c.v == 1 {
            canonical_digest(&(c.v, &c.id, &c.request, &c.binding, &c.receipt))?
        } else if c.v == 3 {
            canonical_digest(&(
                c.v,
                &c.id,
                &c.request,
                &c.binding,
                &c.receipt,
                &c.expected,
                &c.next,
                &c.reference,
            ))?
        } else {
            canonical_digest(&(
                c.v,
                &c.id,
                &c.request,
                &c.binding,
                &c.receipt,
                &c.expected,
                &c.next,
            ))?
        };
        let tips_valid = if c.v == 1 {
            c.expected.is_empty() && c.next.is_empty()
        } else {
            [&c.expected, &c.next].iter().all(|s| {
                *s == "-" || matches!(s.len(), 40 | 64) && s.bytes().all(|b| b.is_ascii_hexdigit())
            })
        };
        if !matches!(c.v, 1..=3)
            || (c.v < 3 && c.reference.is_some())
            || c.reference
                .as_ref()
                .is_some_and(|r| RefName::parse(r).is_err())
            || c.id != id
            || c.digest != d
            || !digest_valid(&c.request)
            || !digest_valid(&c.binding)
            || !tips_valid
            || !valid_compact_outcome(&c.receipt)
        {
            return Err(corrupt("ledger hash/version/id"));
        }
        Ok(Some(c))
    }
    /// Call only under the same live event-seal, after a PinReleaseAttempt,
    /// exact-old pin delete, read-back and pin-directory durability. Unknown
    /// evidence and unresolved chains are never removed. A failed deletion
    /// leaves the immutable ledger as the id-binding authority.
    pub fn compact(
        &self,
        chain: &Chain,
        reader: &dyn RecoveryReader,
        authority: &dyn PublicationAuthority,
    ) -> WalResult<CompactReceipt> {
        authority.validate_publication_borrow(chain.intent())?;
        let id = &chain.last().operation_id;
        let actual = self.inspect(id)?;
        if actual.last().digest != chain.last().digest
            // Restore retains its snapshot binding until explicit repair/retention
            // is implemented; never turn a full receipt into an unusable id.
            || matches!(actual.intent().kind, OperationKind::Restore(_))
            || !(matches!(actual.last().phase, Phase::PinReleased)
                || (actual.intent().kind != OperationKind::PublicationCas
                    && actual.outcome().is_some()))
            || reader.read_ref(&format!("refs/fgos/git-operations/{id}/candidate"))?
                != ObservedRef::Direct(Tip::Absent)
        {
            return Err(WalError::RecoveryRequired);
        }
        let operation = self.operation(id, false)?;
        // Preserve every orphan/unknown artifact; do not partially compact an
        // operation which contains evidence outside the validated chain.
        for entry in fs::read_dir(operation.path())? {
            let entry = entry?;
            if !actual
                .records
                .iter()
                .any(|r| entry.file_name() == std::ffi::OsStr::new(&record_name(r.sequence)))
            {
                return Err(WalError::RecoveryRequired);
            }
        }
        let i = actual.intent();
        let mut c = CompactReceipt {
            v: if matches!(i.kind, OperationKind::Land(_)) || matches!(&i.kind, OperationKind::Sync(p) if p.reference.is_some()) {
                3
            } else {
                2
            },
            id: id.clone(),
            request: i.request_digest.clone(),
            binding: binding_digest(i)?,
            expected: compact_tip(&i.expected),
            next: compact_tip(&i.next),
            receipt: compact_outcome(actual.outcome().ok_or(WalError::RecoveryRequired)?),
            reference: match &i.kind {
                OperationKind::Sync(p) => p.reference.clone(),
                OperationKind::Land(p) => Some(p.request.destination.clone()),
                _ => None,
            },
            digest: String::new(),
        };
        c.digest = if c.v == 3 {
            canonical_digest(&(
                c.v,
                &c.id,
                &c.request,
                &c.binding,
                &c.receipt,
                &c.expected,
                &c.next,
                &c.reference,
            ))?
        } else {
            canonical_digest(&(
                c.v,
                &c.id,
                &c.request,
                &c.binding,
                &c.receipt,
                &c.expected,
                &c.next,
            ))?
        };
        if serde_json::to_vec(&c)
            .map_err(|_| corrupt("ledger serialize"))?
            .len()
            + 1
            > 512
        {
            return Err(corrupt("ledger entry exceeds 512 bytes"));
        }
        if self.install(&self.ledger, id, &c, false)? == Installed::AlreadyExists {
            let existing = self
                .compacted(id)?
                .ok_or_else(|| corrupt("missing ledger"))?;
            if existing.digest != c.digest {
                return Err(WalError::OperationIdConflict);
            }
        }
        // The install fsynced the ledger directory after the name.
        let dir = self.operation(id, false)?;
        // No recursive remove: unexpected files (including failed-write temps)
        // are evidence. Leave them attributable by the durable ledger.
        for r in &actual.records {
            fs::remove_file(dir.path().join(record_name(r.sequence)))?;
            self.fs.checkpoint("remove-record")?;
        }
        dir.file.sync_all()?;
        self.fs.checkpoint("removed-records-fsync")?;
        fs::remove_dir(self.root.path().join(id))?;
        self.fs.checkpoint("remove-operation")?;
        self.root.file.sync_all()?;
        self.fs.checkpoint("removed-operation-parent-fsync")?;
        Ok(c)
    }
}
#[derive(Debug)]
pub struct ScanEntry {
    pub operation_id: String,
    pub terminal: bool,
    pub error: Option<String>,
}
#[derive(Debug)]
pub struct Backlog {
    pub entries: Vec<ScanEntry>,
    pub complete: bool,
    pub unresolved: usize,
    pub ledger_bytes: u64,
    /// Retained id bindings are linear, even though the active working set drains.
    pub ledger_entries: usize,
    /// Doctor consumers should surface this as capacity debt, never delete ids.
    pub ledger_capacity_warning: bool,
    pub retained_bytes: u64,
    pub oldest_unresolved: Option<(String, std::time::SystemTime)>,
}
impl<F: FileSystem> Wal<F> {
    /// When the operation's directory last changed (its last record was
    /// installed). Scheduling only: it never decides a protocol outcome.
    pub(crate) fn last_change(&self, id: &str) -> Option<std::time::SystemTime> {
        fs::metadata(self.root.path().join(id))
            .ok()?
            .modified()
            .ok()
    }
    pub(crate) fn known_id(&self, id: &str) -> WalResult<bool> {
        if self.compacted(id)?.is_some() {
            return Ok(true);
        }
        match self.operation(id, false) {
            Ok(dir) => self.has_intent(&dir),
            Err(WalError::Io(e)) if e.kind() == io::ErrorKind::NotFound => Ok(false),
            Err(e) => Err(e),
        }
    }
    fn has_intent(&self, dir: &Directory) -> WalResult<bool> {
        if dir.path().join(record_name(0)).try_exists()? {
            return Ok(true);
        }
        for (n, entry) in fs::read_dir(dir.path())?.enumerate() {
            if n >= MAX_RECORDS * 2 {
                return Err(corrupt("pre-intent scan bound"));
            }
            let name = entry?.file_name().to_string_lossy().into_owned();
            if !is_durable_temporary(&name) {
                return Err(corrupt("unknown pre-intent artifact"));
            }
        }
        Ok(false)
    }
    /// Admission never traverses historical ledger entries. A directory without
    /// record zero is not an Intent and cannot block an unrelated operation.
    pub fn active(&self, bound: usize) -> WalResult<Vec<Chain>> {
        Ok(self
            .retained(bound)?
            .into_iter()
            .filter(|c| c.outcome().is_none())
            .collect())
    }
    /// Retained operation directories, including terminal records awaiting
    /// compaction. Historical compacted ids are never traversed.
    pub fn retained(&self, bound: usize) -> WalResult<Vec<Chain>> {
        let mut chains = Vec::new();
        for (n, entry) in fs::read_dir(self.root.path())?.enumerate() {
            if n >= bound {
                return Err(WalError::RecoveryRequired);
            }
            let id = entry?.file_name().to_string_lossy().into_owned();
            if self.compacted(&id)?.is_some() {
                continue;
            }
            let dir = self.operation(&id, false)?;
            if !self.has_intent(&dir)? {
                continue;
            }
            let chain = self.inspect(&id)?;
            chains.push(chain);
        }
        Ok(chains)
    }
    /// Bound covers both operation directories and immutable ledger entries;
    /// reaching it always reports incomplete, never clearance for C5.
    pub fn scan(&self, bound: usize) -> WalResult<Backlog> {
        let mut result = Backlog {
            entries: vec![],
            complete: true,
            unresolved: 0,
            ledger_bytes: 0,
            ledger_entries: 0,
            ledger_capacity_warning: false,
            retained_bytes: 0,
            oldest_unresolved: None,
        };
        let mut seen = 0;
        for (dir, ledger) in [(&self.root, false), (&self.ledger, true)] {
            for entry in fs::read_dir(dir.path())? {
                let entry = entry?;
                let id = entry.file_name().to_string_lossy().into_owned();
                if is_durable_temporary(&id) {
                    continue;
                }
                if seen == bound {
                    result.complete = false;
                    return Ok(result);
                }
                seen += 1;
                // The ledger is installed durably before any chain deletion.
                // Re-read it after every failed observation of a root entry.
                let inspect_entry =
                    || -> WalResult<(bool, u64, Option<std::time::SystemTime>, bool)> {
                        let metadata = entry.metadata()?;
                        if ledger {
                            self.compacted(&id)?
                                .ok_or_else(|| corrupt("missing ledger"))?;
                            return Ok((true, metadata.len(), metadata.modified().ok(), false));
                        }
                        if self.compacted(&id)?.is_some() {
                            return Ok((true, 0, None, false));
                        }
                        let operation = self.operation(&id, false)?;
                        let terminal =
                            !self.has_intent(&operation)? || self.inspect(&id)?.outcome().is_some();
                        let mut bytes = metadata.len();
                        let mut incomplete = false;
                        for (n, file) in fs::read_dir(operation.path())?.enumerate() {
                            if n >= MAX_RECORDS * 2 {
                                incomplete = true;
                                break;
                            }
                            bytes += file?.metadata()?.len();
                        }
                        Ok((terminal, bytes, metadata.modified().ok(), incomplete))
                    };
                let (terminal, bytes, modified, incomplete, error) = match inspect_entry() {
                    Ok((t, bytes, modified, incomplete)) => (t, bytes, modified, incomplete, None),
                    Err(e) if !ledger => match self.compacted(&id) {
                        Ok(Some(_)) => (true, 0, None, false, None),
                        _ => (false, 0, None, false, Some(e.to_string())),
                    },
                    Err(e) => (
                        false,
                        entry.metadata().map(|m| m.len()).unwrap_or(0),
                        None,
                        false,
                        Some(e.to_string()),
                    ),
                };
                if ledger {
                    result.ledger_bytes += bytes;
                    result.ledger_entries += 1;
                    result.ledger_capacity_warning =
                        result.ledger_entries >= 100_000 || result.ledger_bytes >= 64 * 1024 * 1024;
                } else {
                    result.retained_bytes += bytes;
                }
                result.complete &= !incomplete;
                if !terminal {
                    result.unresolved += 1;
                    if let Some(time) = modified {
                        if result
                            .oldest_unresolved
                            .as_ref()
                            .is_none_or(|(_, old)| time < *old)
                        {
                            result.oldest_unresolved = Some((id.clone(), time));
                        }
                    }
                }
                result.entries.push(ScanEntry {
                    operation_id: id,
                    terminal,
                    error,
                });
            }
        }
        Ok(result)
    }
}

// Same temporary-name rule for every WAL directory reader.
fn is_durable_temporary(name: &str) -> bool {
    name.starts_with(".durable-file-") && name.ends_with(".tmp")
}

#[cfg(all(test, target_os = "linux"))]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};
    static SERIAL: AtomicUsize = AtomicUsize::new(0);
    struct Authority;
    impl PublicationAuthority for Authority {
        fn validate_publication_borrow(&self, _: &Intent) -> WalResult<()> {
            Ok(())
        }
    }
    struct Temp(PathBuf);
    impl Temp {
        fn new() -> Self {
            let p = std::env::temp_dir().join(format!(
                "fgos-wal-{}-{}",
                std::process::id(),
                SERIAL.fetch_add(1, Ordering::Relaxed)
            ));
            {
                use std::os::unix::fs::DirBuilderExt;
                fs::DirBuilder::new().mode(0o700).create(&p).unwrap();
            }
            Self(p)
        }
    }
    impl Drop for Temp {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    fn intent<F: FileSystem>(wal: &Wal<F>) -> Intent {
        Intent {
            kind: OperationKind::PublicationCas,
            request_digest: "a".repeat(64),
            repo_identity: wal.identity.clone(),
            resource_set: vec!["refs/fgos/events/machine".into()],
            authority_binding: "event-seal:machine".into(),
            writer_identity: "performer-1".into(),
            object_format: ObjectFormat::Sha1,
            expected: Tip::Absent,
            next: Tip::Oid("b".repeat(40)),
        }
    }
    fn begun<F: FileSystem>(w: &Wal<F>, id: &str) -> Chain {
        match w.begin(id, intent(w), &Authority).unwrap() {
            Begin::Created(c) => c,
            _ => panic!(),
        }
    }
    fn attempted<F: FileSystem>(w: &Wal<F>, id: &str) -> Chain {
        let c = w.append(&begun(w, id), Phase::Prepared).unwrap();
        w.append(
            &c,
            Phase::TargetAttempt {
                prior_target_attempt: None,
                expected: c.intent().expected.clone(),
                next: c.intent().next.clone(),
            },
        )
        .unwrap()
    }
    fn success<F: FileSystem>(w: &Wal<F>, c: &Chain) -> Chain {
        w.append(
            c,
            Phase::Outcome(Outcome::Success {
                observed: c.intent().next.clone(),
                attribution: Attribution::ThisInvocationWonCas,
            }),
        )
        .unwrap()
    }
    struct Reader {
        target: ObservedRef,
        pin: ObservedRef,
        intact: bool,
    }
    impl RecoveryReader for Reader {
        fn read_ref(&self, name: &str) -> WalResult<ObservedRef> {
            Ok(if name.contains("git-operations") {
                self.pin.clone()
            } else {
                self.target.clone()
            })
        }
        fn candidate_intact(&self, _: &Intent) -> WalResult<bool> {
            Ok(self.intact)
        }
    }
    fn reader(i: &Intent) -> Reader {
        Reader {
            target: ObservedRef::Direct(i.expected.clone()),
            pin: ObservedRef::Direct(i.next.clone()),
            intact: true,
        }
    }
    #[test]
    fn immutable_binding_and_transition_loser_stop() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let c = begun(&w, "one");
        assert!(matches!(
            w.begin("one", intent(&w), &Authority).unwrap(),
            Begin::Existing(_)
        ));
        for mutate in 0..3 {
            let mut i = intent(&w);
            match mutate {
                0 => i.request_digest = "c".repeat(64),
                1 => i.resource_set = vec!["refs/fgos/events/other".into()],
                _ => i.authority_binding = "other".into(),
            }
            assert!(matches!(
                w.begin("one", i, &Authority),
                Err(WalError::OperationIdConflict)
            ));
        }
        w.append(&c, Phase::Prepared).unwrap();
        assert!(matches!(w.append(&c, Phase::Prepared), Err(WalError::Busy)));
        assert_eq!(w.inspect("one").unwrap().records.len(), 2);
    }
    #[test]
    fn concurrent_record_zero_and_attempt_have_one_winner() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let barrier = std::sync::Barrier::new(3);
        std::thread::scope(|s| {
            let handles: Vec<_> = (0..3)
                .map(|_| {
                    s.spawn(|| {
                        barrier.wait();
                        matches!(
                            w.begin("race", intent(&w), &Authority).unwrap(),
                            Begin::Created(_)
                        )
                    })
                })
                .collect();
            assert_eq!(
                handles
                    .into_iter()
                    .map(|h| usize::from(h.join().unwrap()))
                    .sum::<usize>(),
                1
            );
        });
        let c = w
            .append(&w.inspect("race").unwrap(), Phase::Prepared)
            .unwrap();
        std::thread::scope(|s| {
            let handles: Vec<_> = (0..3)
                .map(|_| {
                    s.spawn(|| {
                        barrier.wait();
                        w.append(
                            &c,
                            Phase::TargetAttempt {
                                prior_target_attempt: None,
                                expected: c.intent().expected.clone(),
                                next: c.intent().next.clone(),
                            },
                        )
                        .is_ok()
                    })
                })
                .collect();
            assert_eq!(
                handles
                    .into_iter()
                    .map(|h| usize::from(h.join().unwrap()))
                    .sum::<usize>(),
                1
            );
        });
    }
    #[test]
    fn recovery_table_never_reissues_attempt_even_after_aba() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let c = begun(&w, "one");
        let mut r = reader(c.intent());
        assert_eq!(w.recover("one", &r).unwrap(), Recovery::Unprepared);
        let c = w.append(&c, Phase::Prepared).unwrap();
        assert_eq!(
            w.recover("one", &r).unwrap(),
            Recovery::FirstAttemptEligible
        );
        w.append(
            &c,
            Phase::TargetAttempt {
                prior_target_attempt: None,
                expected: c.intent().expected.clone(),
                next: c.intent().next.clone(),
            },
        )
        .unwrap();
        assert_eq!(w.recover("one", &r).unwrap(), Recovery::RecoveryRequired);
        r.target = ObservedRef::Direct(c.intent().next.clone());
        assert_eq!(w.recover("one", &r).unwrap(), Recovery::EffectObservedOnly);
        r.pin = ObservedRef::Direct(Tip::Absent);
        assert_eq!(
            w.recover("one", &r).unwrap(),
            Recovery::PinReconciliationRequired
        );
        r.intact = false;
        assert_eq!(w.recover("one", &r).unwrap(), Recovery::RecoveryRequired);
    }
    #[test]
    fn corrupt_version_hash_gap_unknown_and_symlink_are_not_empty() {
        use std::os::unix::fs::symlink;
        for case in 0..5 {
            let t = Temp::new();
            let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
            begun(&w, "one");
            let dir = w.root.path().join("one");
            let p = dir.join(record_name(0));
            match case {
                0 => fs::write(&p, b"{").unwrap(),
                1 => {
                    let mut v: serde_json::Value = read_json(&p, MAX_RECORD).unwrap();
                    v["version"] = 2.into();
                    fs::write(&p, serde_json::to_vec(&v).unwrap()).unwrap();
                }
                2 => fs::rename(&p, dir.join(record_name(1))).unwrap(),
                3 => fs::write(dir.join("unknown"), b"evidence").unwrap(),
                _ => {
                    fs::remove_file(&p).unwrap();
                    symlink("/etc/passwd", &p).unwrap();
                }
            }
            assert!(w.inspect("one").is_err());
            let scan = w.scan(100).unwrap();
            assert_eq!(scan.unresolved, 1);
            assert!(scan.entries[0].error.is_some());
        }
    }
    #[test]
    fn trust_root_refuses_writable_or_symlink_directory() {
        use std::os::unix::fs::{symlink, PermissionsExt};
        let t = Temp::new();
        fs::create_dir(t.0.join("fgos")).unwrap();
        fs::set_permissions(t.0.join("fgos"), fs::Permissions::from_mode(0o777)).unwrap();
        assert!(Wal::with_filesystem(&t.0, OsFileSystem).is_err());
        fs::remove_dir(t.0.join("fgos")).unwrap();
        let other = Temp::new();
        symlink(&other.0, t.0.join("fgos")).unwrap();
        assert!(Wal::with_filesystem(&t.0, OsFileSystem).is_err());
    }
    struct Admission(bool);
    impl AuthorityAdmission for Admission {
        fn old_performer_gone(&self, _: &Intent) -> WalResult<bool> {
            Ok(self.0)
        }
    }
    #[test]
    fn supersession_requires_winner_binding_domain_and_no_native_lock() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let old = attempted(&w, "old");
        let later = attempted(&w, "later");
        assert!(w.supersede(&old, "later", &Admission(true)).is_err());
        success(&w, &later);
        assert!(w.supersede(&old, "later", &Admission(false)).is_err());
        fs::create_dir_all(t.0.join("refs/fgos/events")).unwrap();
        let lock = t.0.join("refs/fgos/events/machine.lock");
        fs::write(&lock, b"native evidence").unwrap();
        assert!(w.supersede(&old, "later", &Admission(true)).is_err());
        assert_eq!(fs::read(&lock).unwrap(), b"native evidence");
        fs::remove_file(&lock).unwrap();
        let c = w.supersede(&old, "later", &Admission(true)).unwrap();
        assert!(matches!(
            c.outcome(),
            Some(Outcome::Superseded {
                attribution: Attribution::Uncertain,
                ..
            })
        ));
        assert_eq!(w.scan(100).unwrap().unresolved, 0);
        assert!(!w.scan(0).unwrap().complete);
    }
    struct Fault {
        fail: AtomicUsize,
        count: AtomicUsize,
    }
    impl FileSystem for Fault {
        fn checkpoint(&self, _: &'static str) -> io::Result<()> {
            let n = self.count.fetch_add(1, Ordering::SeqCst) + 1;
            if n == self.fail.load(Ordering::SeqCst) {
                Err(io::Error::other("injected crash"))
            } else {
                Ok(())
            }
        }
    }
    /// Records every checkpoint name it sees.
    struct Steps(std::sync::Mutex<Vec<&'static str>>);
    impl FileSystem for Steps {
        fn checkpoint(&self, step: &'static str) -> io::Result<()> {
            self.0.lock().unwrap().push(step);
            Ok(())
        }
    }
    #[test]
    fn begin_replay_syncs_both_directories_after_creator_stopped_before_parent_fsync() {
        struct StopBeforeSync;
        impl FileSystem for StopBeforeSync {
            fn checkpoint(&self, step: &'static str) -> io::Result<()> {
                if step == "temp-removed" {
                    Err(io::Error::other("creator stopped before directory sync"))
                } else {
                    Ok(())
                }
            }
        }
        let t = Temp::new();
        let creator = Wal::with_filesystem(&t.0, StopBeforeSync).unwrap();
        assert!(creator
            .begin("replay", intent(&creator), &Authority)
            .is_err());
        assert!(
            creator.inspect("replay").is_ok(),
            "record zero exists despite failed begin"
        );
        let replay = Wal::with_filesystem(&t.0, Steps(Default::default())).unwrap();
        replay.fs.0.lock().unwrap().clear();
        assert!(matches!(
            replay.begin("replay", intent(&replay), &Authority).unwrap(),
            Begin::Existing(_)
        ));
        assert_eq!(
            &*replay.fs.0.lock().unwrap(),
            &["existing-intent-parent-fsync"]
        );
        let mut different = intent(&replay);
        different.request_digest = "f".repeat(64);
        assert!(matches!(
            replay.begin("replay", different, &Authority),
            Err(WalError::OperationIdConflict)
        ));
    }

    #[test]
    fn scan_ignores_compaction_temporaries_before_counting_the_bound() {
        let t = Temp::new();
        let wal = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        fs::write(
            wal.ledger.path().join(".durable-file-123-0.tmp"),
            b"partial ledger",
        )
        .unwrap();
        let scan = wal.scan(0).unwrap();
        assert!(scan.complete);
        assert_eq!(scan.unresolved, 0);
        assert_eq!(scan.ledger_entries, 0);
        assert!(scan.entries.is_empty());
        fs::write(wal.ledger.path().join("unexpected"), b"bad").unwrap();
        let scan = wal.scan(10).unwrap();
        assert_eq!(scan.unresolved, 1);
        assert!(scan.entries[0].error.is_some());
    }

    #[test]
    fn scan_remains_terminal_while_compaction_removes_records_and_directories() {
        struct SlowRemoval;
        impl FileSystem for SlowRemoval {
            fn checkpoint(&self, step: &'static str) -> io::Result<()> {
                if step == "remove-record" {
                    std::thread::sleep(std::time::Duration::from_millis(1));
                }
                Ok(())
            }
        }
        let t = Temp::new();
        let wal = Wal::with_filesystem(&t.0, SlowRemoval).unwrap();
        let mut terminal = Vec::new();
        for n in 0..16 {
            let c = success(&wal, &attempted(&wal, &format!("race-{n}")));
            let c = wal
                .append(
                    &c,
                    Phase::PinReleaseAttempt {
                        prior_target_attempt: None,
                        expected: c.intent().next.clone(),
                        next: Tip::Absent,
                    },
                )
                .unwrap();
            terminal.push(wal.append(&c, Phase::PinReleased).unwrap());
        }
        let done = std::sync::atomic::AtomicBool::new(false);
        std::thread::scope(|scope| {
            let worker = scope.spawn(|| {
                for chain in &terminal {
                    let mut r = reader(chain.intent());
                    r.pin = ObservedRef::Direct(Tip::Absent);
                    wal.compact(chain, &r, &Authority).unwrap();
                }
                done.store(true, Ordering::SeqCst);
            });
            let mut scans = 0;
            while !done.load(Ordering::SeqCst) && scans < 1000 {
                let backlog = wal.scan(100).unwrap();
                assert!(backlog.complete);
                assert_eq!(backlog.unresolved, 0, "{:?}", backlog.entries);
                assert!(backlog.entries.iter().all(|e| e.error.is_none()));
                scans += 1;
            }
            worker.join().unwrap();
            assert!(scans > 0);
        });
        assert_eq!(wal.scan(100).unwrap().ledger_entries, 16);
    }

    #[test]
    fn durable_directories_are_synced_once_per_process_and_records_keep_their_syncs() {
        let t = Temp::new();
        let first = Wal::with_filesystem(&t.0, Steps(Default::default())).unwrap();
        assert!(first.fs.0.lock().unwrap().contains(&"directory-fsync"));
        // Same directories, already durable: no second fsync of them.
        let again = Wal::with_filesystem(&t.0, Steps(Default::default())).unwrap();
        assert!(!again.fs.0.lock().unwrap().contains(&"directory-fsync"));
        // A record still fsyncs its file and directory; record zero also
        // the parent of its new operation directory.
        let c = begun(&again, "one");
        let steps = std::mem::take(&mut *again.fs.0.lock().unwrap());
        assert_eq!(steps.iter().filter(|s| **s == "file-fsync").count(), 1);
        assert_eq!(steps.iter().filter(|s| **s == "parent-fsync").count(), 1);
        again.append(&c, Phase::Prepared).unwrap();
        let steps = std::mem::take(&mut *again.fs.0.lock().unwrap());
        assert_eq!(steps.iter().filter(|s| **s == "file-fsync").count(), 1);
        assert_eq!(steps.iter().filter(|s| **s == "parent-fsync").count(), 1);
        // A directory removed and made again is a new directory: synced again.
        drop((first, again));
        fs::remove_dir_all(t.0.join("fgos")).unwrap();
        let fresh = Wal::with_filesystem(&t.0, Steps(Default::default())).unwrap();
        assert!(fresh.fs.0.lock().unwrap().contains(&"directory-fsync"));
    }
    #[test]
    fn crash_at_each_record_install_boundary_is_conservative() {
        for point in 1..=16 {
            let t = Temp::new();
            let w = Wal::with_filesystem(
                &t.0,
                Fault {
                    fail: AtomicUsize::new(usize::MAX),
                    count: AtomicUsize::new(0),
                },
            )
            .unwrap();
            let c = w.append(&begun(&w, "one"), Phase::Prepared).unwrap();
            w.fs.count.store(0, Ordering::SeqCst);
            w.fs.fail.store(point, Ordering::SeqCst);
            let _ = w.append(
                &c,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: c.intent().expected.clone(),
                    next: c.intent().next.clone(),
                },
            );
            let reopened = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
            let c = reopened.inspect("one").unwrap();
            let state = reopened.recover("one", &reader(c.intent())).unwrap();
            assert!(matches!(
                state,
                Recovery::FirstAttemptEligible | Recovery::RecoveryRequired
            ));
            if matches!(c.last().phase, Phase::TargetAttempt { .. }) {
                assert_eq!(state, Recovery::RecoveryRequired);
            }
        }
    }
    #[test]
    fn doctor_scan_flags_retained_ledger_capacity_without_deleting_evidence() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let path = w.ledger.path().join("capacity-evidence");
        let file = std::fs::File::create(&path).unwrap();
        file.set_len(64 * 1024 * 1024).unwrap();
        let scan = w.scan(100).unwrap();
        assert_eq!(scan.ledger_entries, 1);
        assert!(scan.ledger_capacity_warning);
        assert!(scan.entries[0].error.is_some());
        assert!(path.exists());
    }
    #[test]
    fn legacy_compact_entries_keep_their_binding_and_exact_request_replay() {
        let t = Temp::new();
        let wal = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let i = intent(&wal);
        let receipt = compact_outcome(&Outcome::Success {
            observed: i.next.clone(),
            attribution: Attribution::ThisInvocationWonCas,
        });
        let binding = binding_digest(&i).unwrap();
        let digest =
            canonical_digest(&(1u8, "legacy", &i.request_digest, &binding, &receipt)).unwrap();
        let old = serde_json::json!({"v": 1, "id": "legacy", "q": i.request_digest, "b": binding, "r": receipt, "digest": digest});
        fgos_durable_file::install_once(&wal.ledger.path(), "legacy", old.to_string().as_bytes())
            .unwrap();
        assert!(matches!(
            wal.begin("legacy", i.clone(), &Authority).unwrap(),
            Begin::Compacted(_)
        ));
        let mut other = i;
        other.expected = Tip::Oid("c".repeat(40));
        assert!(matches!(
            wal.begin("legacy", other, &Authority),
            Err(WalError::OperationIdConflict)
        ));
        assert_eq!(wal.scan(10).unwrap().unresolved, 0);
    }

    #[test]
    fn compact_retains_binding_and_receipt_before_deletion() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let c = success(&w, &attempted(&w, "one"));
        let c = w
            .append(
                &c,
                Phase::PinReleaseAttempt {
                    prior_target_attempt: None,
                    expected: c.intent().next.clone(),
                    next: Tip::Absent,
                },
            )
            .unwrap();
        let c = w.append(&c, Phase::PinReleased).unwrap();
        let mut r = reader(c.intent());
        r.pin = ObservedRef::Direct(Tip::Absent);
        w.compact(&c, &r, &Authority).unwrap();
        assert!(!w.root.path().join("one").exists());
        assert!(matches!(
            w.begin("one", intent(&w), &Authority).unwrap(),
            Begin::Compacted(_)
        ));
        let mut i = intent(&w);
        i.request_digest = "c".repeat(64);
        assert!(matches!(
            w.begin("one", i, &Authority),
            Err(WalError::OperationIdConflict)
        ));
        let scan = w.scan(100).unwrap();
        assert!(scan.ledger_bytes <= 512);
        assert_eq!(scan.ledger_entries, 1);
        assert!(!scan.ledger_capacity_warning);
    }
    fn git(path: &Path, args: &[&str], input: Option<&[u8]>) -> Vec<u8> {
        use std::io::Write;
        use std::process::{Command, Stdio};
        let mut child = Command::new("git")
            .current_dir(path)
            .args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        if let Some(bytes) = input {
            child.stdin.take().unwrap().write_all(bytes).unwrap();
        }
        let output = child.wait_with_output().unwrap();
        assert!(
            output.status.success(),
            "{:?}: {}",
            args,
            String::from_utf8_lossy(&output.stderr)
        );
        output.stdout
    }
    #[test]
    fn recovery_observes_real_git_refs_and_native_residue_both_formats() {
        for (format, backend) in [
            ("sha1", "files"),
            ("sha256", "files"),
            ("sha1", "reftable"),
            ("sha256", "reftable"),
        ] {
            let t = Temp::new();
            git(
                &t.0,
                &[
                    "init",
                    "--bare",
                    "--quiet",
                    &format!("--object-format={format}"),
                    &format!("--ref-format={backend}"),
                ],
                None,
            );
            let state = Temp::new();
            let driver = crate::GitDriver::new(&state.0).unwrap();
            let repo = match driver.resolve_repo(&t.0, &t.0).unwrap() {
                crate::ResolveRepo::Repository(r) => r,
                _ => panic!(),
            };
            let fence = repo.trusted_main_root().join(".fgos/locks/activation.lock");
            fs::create_dir_all(&fence).unwrap();
            fs::write(
                fence.join("TOMBSTONE"),
                r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
            )
            .unwrap();
            let w = Wal::open(&repo).unwrap();
            let oid = String::from_utf8(git(
                &t.0,
                &["hash-object", "-w", "--stdin"],
                Some(b"candidate"),
            ))
            .unwrap()
            .trim()
            .to_owned();
            let mut i = intent(&w);
            i.object_format = repo.object_format();
            i.next = Tip::Oid(oid.clone());
            let c = match w.begin("real", i, &Authority).unwrap() {
                Begin::Created(c) => c,
                _ => panic!(),
            };
            let read = crate::WalReader {
                driver: &driver,
                repo: &repo,
            };
            let pin = "refs/fgos/git-operations/real/candidate";
            git(&t.0, &["update-ref", pin, &oid], None);
            let c = w.append(&c, Phase::Prepared).unwrap();
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::FirstAttemptEligible
            );
            let c = w
                .append(
                    &c,
                    Phase::TargetAttempt {
                        prior_target_attempt: None,
                        expected: Tip::Absent,
                        next: Tip::Oid(oid.clone()),
                    },
                )
                .unwrap();
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::RecoveryRequired
            );
            git(
                &t.0,
                &["update-ref", &c.intent().resource_set[0], &oid],
                None,
            );
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::EffectObservedOnly
            );
            git(&t.0, &["pack-refs", "--all"], None);
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::EffectObservedOnly
            );
            git(&t.0, &["update-ref", "-d", pin, &oid], None);
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::PinReconciliationRequired
            );
            git(&t.0, &["update-ref", pin, &oid], None);
            git(
                &t.0,
                &[
                    "symbolic-ref",
                    &c.intent().resource_set[0],
                    "refs/heads/dangling",
                ],
                None,
            );
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::RecoveryRequired
            );
            git(
                &t.0,
                &["symbolic-ref", "--delete", &c.intent().resource_set[0]],
                None,
            );
            git(
                &t.0,
                &["update-ref", &c.intent().resource_set[0], &oid],
                None,
            );
            // ABA does not restore eligibility.
            git(
                &t.0,
                &["update-ref", "-d", &c.intent().resource_set[0], &oid],
                None,
            );
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::RecoveryRequired
            );
        }
    }
    #[test]
    fn compaction_crash_keeps_chain_or_ledger_and_id_binding() {
        for point in 1..=25 {
            let t = Temp::new();
            let w = Wal::with_filesystem(
                &t.0,
                Fault {
                    fail: AtomicUsize::new(usize::MAX),
                    count: AtomicUsize::new(0),
                },
            )
            .unwrap();
            let c = success(&w, &attempted(&w, "one"));
            let c = w
                .append(
                    &c,
                    Phase::PinReleaseAttempt {
                        prior_target_attempt: None,
                        expected: c.intent().next.clone(),
                        next: Tip::Absent,
                    },
                )
                .unwrap();
            let c = w.append(&c, Phase::PinReleased).unwrap();
            let mut r = reader(c.intent());
            r.pin = ObservedRef::Direct(Tip::Absent);
            w.fs.count.store(0, Ordering::SeqCst);
            w.fs.fail.store(point, Ordering::SeqCst);
            let _ = w.compact(&c, &r, &Authority);
            let reopened = Wal::open_existing(&t.0, OsFileSystem).unwrap();
            assert!(
                reopened.inspect("one").is_ok() || reopened.compacted("one").unwrap().is_some()
            );
            if reopened.compacted("one").unwrap().is_some() {
                reopened
                    .resume_compaction("one", &r, c.intent(), &Authority)
                    .unwrap();
                assert!(!reopened.root.path().join("one").exists());
            }
            let mut i = intent(&reopened);
            i.request_digest = "f".repeat(64);
            assert!(matches!(
                reopened.begin("one", i, &Authority),
                Err(WalError::OperationIdConflict)
            ));
        }
    }
    #[test]
    fn compact_superseded_and_maximum_ids_fit_512_bytes() {
        let o = Outcome::Superseded {
            later_operation_id: "z".repeat(80),
            later_receipt_digest: "a".repeat(64),
            attribution: Attribution::Uncertain,
        };
        let c = CompactReceipt {
            v: 2,
            id: "x".repeat(80),
            request: "b".repeat(64),
            binding: "c".repeat(64),
            expected: "e".repeat(64),
            next: "f".repeat(64),
            receipt: compact_outcome(&o),
            reference: None,
            digest: "d".repeat(64),
        };
        let bytes = serde_json::to_vec(&c).unwrap();
        assert!(bytes.len() < 512, "{} bytes", bytes.len());
        let restored: CompactReceipt = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(restored.expected, c.expected);
        assert_eq!(restored.next, c.next);
        assert_eq!(restored.receipt, c.receipt);
    }
    #[test]
    fn ten_thousand_terminal_operations_have_no_record_directories() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        for n in 0..10_000 {
            let id = format!("op-{n}");
            let c = success(&w, &attempted(&w, &id));
            let c = w
                .append(
                    &c,
                    Phase::PinReleaseAttempt {
                        prior_target_attempt: None,
                        expected: c.intent().candidate().clone(),
                        next: Tip::Absent,
                    },
                )
                .unwrap();
            let c = w.append(&c, Phase::PinReleased).unwrap();
            let mut r = reader(c.intent());
            r.pin = ObservedRef::Direct(Tip::Absent);
            w.compact(&c, &r, &Authority).unwrap();
        }
        assert_eq!(fs::read_dir(w.root.path()).unwrap().count(), 0);
        let scan = w.scan(10_001).unwrap();
        assert!(scan.complete);
        assert_eq!(scan.unresolved, 0);
        assert!(scan.ledger_bytes <= 10_000 * 512);
        assert_eq!(scan.entries.len(), 10_000);
    }
    #[test]
    fn missing_borrow_refuses_before_intent_and_doctor_never_writes() {
        struct Missing;
        impl PublicationAuthority for Missing {
            fn validate_publication_borrow(&self, _: &Intent) -> WalResult<()> {
                Err(WalError::PublicationBorrowUnavailable)
            }
        }
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        assert!(matches!(
            w.begin("no-borrow", intent(&w), &Missing),
            Err(WalError::PublicationBorrowUnavailable)
        ));
        assert_eq!(fs::read_dir(w.root.path()).unwrap().count(), 0);
        let read = Wal::open_existing(
            &t.0,
            Fault {
                fail: AtomicUsize::new(1),
                count: AtomicUsize::new(0),
            },
        )
        .unwrap();
        assert!(read.scan(10).unwrap().complete);
        assert_eq!(read.fs.count.load(Ordering::SeqCst), 0);
    }
    #[test]
    fn intent_crash_boundaries_ignore_uninstalled_intent_but_preserve_evidence() {
        for point in 1..=12 {
            let t = Temp::new();
            let w = Wal::with_filesystem(
                &t.0,
                Fault {
                    fail: AtomicUsize::new(usize::MAX),
                    count: AtomicUsize::new(0),
                },
            )
            .unwrap();
            w.fs.count.store(0, Ordering::SeqCst);
            w.fs.fail.store(point, Ordering::SeqCst);
            let _ = w.begin("one", intent(&w), &Authority);
            let reopened = Wal::open_existing(&t.0, OsFileSystem).unwrap();
            let installed = reopened
                .root
                .path()
                .join("one")
                .join(record_name(0))
                .exists();
            assert_eq!(
                reopened.scan(100).unwrap().unresolved,
                usize::from(installed)
            );
            assert_eq!(reopened.active(100).unwrap().len(), usize::from(installed));
            match reopened.inspect("one") {
                Ok(c) => assert!(matches!(c.last().phase, Phase::Intent(_))),
                Err(WalError::Corrupt(_)) => (),
                other => panic!("unexpected recovery: {other:?}"),
            }
        }
    }
}
