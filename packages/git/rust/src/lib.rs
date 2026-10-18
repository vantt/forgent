//! Git component contracts and hardened repository inspection.
//!
//! Publication uses caller-held opaque holder-lock authority, hardened borrowed
//! children and a file WAL. There is no public raw-argv escape hatch.
mod driver;
mod publication;
mod repository_config;
pub use publication::{HolderAuthority, PublicationPort, RemoteGrant};
pub mod wal;
pub use driver::{GitDriver, WalReader};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ObjectFormat {
    Sha1,
    Sha256,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(transparent)]
pub struct Oid(String);
impl Oid {
    pub fn parse(value: &str, format: ObjectFormat) -> std::result::Result<Self, InvalidInput> {
        let length = match format {
            ObjectFormat::Sha1 => 40,
            ObjectFormat::Sha256 => 64,
        };
        if value.len() != length
            || !value
                .bytes()
                .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
        {
            return Err(InvalidInput(
                "expected full lowercase object-format-aware OID",
            ));
        }
        Ok(Self(value.into()))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(transparent)]
pub struct RefName(String);
impl RefName {
    /// Syntax only. Namespace grants and symbolic-ref refusal belong to the
    /// operation, and must be revalidated at the irreversible boundary.
    pub fn parse(value: &str) -> std::result::Result<Self, InvalidInput> {
        if !value.starts_with("refs/")
            || value.contains("..")
            || value.contains("@{")
            || value
                .bytes()
                .any(|b| b <= 32 || b == 127 || b"~^:?*[\\".contains(&b))
            || value.split('/').any(|s| {
                s.is_empty() || s.starts_with('.') || s.ends_with('.') || s.ends_with(".lock")
            })
        {
            return Err(InvalidInput("expected full literal ref name"));
        }
        Ok(Self(value.into()))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidInput(pub &'static str);
impl std::fmt::Display for InvalidInput {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.0)
    }
}
impl std::error::Error for InvalidInput {}

/// Only the validated driver may construct a repository handle.
#[derive(Debug)]
pub struct RepoHandle {
    common_dir: PathBuf,
    trusted_main_root: PathBuf,
    object_format: ObjectFormat,
    git_dir: PathBuf,
    work_tree: Option<PathBuf>,
    layout: RepoLayout,
}
impl RepoHandle {
    pub fn layout(&self) -> &RepoLayout {
        &self.layout
    }
    pub fn git_dir(&self) -> &std::path::Path {
        &self.git_dir
    }
    pub fn common_dir(&self) -> &std::path::Path {
        &self.common_dir
    }
    pub fn trusted_main_root(&self) -> &std::path::Path {
        &self.trusted_main_root
    }
    pub fn object_format(&self) -> ObjectFormat {
        self.object_format
    }
}
#[derive(Debug)]
pub enum ResolveRepo {
    Repository(RepoHandle),
    NotARepository,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", content = "oid", rename_all = "camelCase")]
pub enum ExpectedTip {
    Absent,
    Oid(Oid),
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RefValue {
    Absent,
    Direct(Oid),
    Symbolic(RefName),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ResultCode {
    Unchanged,
    Created,
    Committed,
    Landed,
    ConflictedOpen,
    ConflictAborted,
    Busy,
    Stale,
    Refused,
    Cancelled,
    Failed,
    PublishedCheckoutPending,
    CommittedButContractViolation,
    RemoteOutcomeUnknown,
    RecoveryRequired,
    Superseded,
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Receipt {
    pub operation_id: String,
    pub request_digest: String,
    pub local_effect: LocalEffect,
    pub checkout: Checkout,
    pub durability: Durability,
    pub remote: Remote,
    pub consumer_settlement: ConsumerSettlement,
    pub attribution: Attribution,
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LocalEffect {
    pub expected: ExpectedTip,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub published_oid: Option<Oid>,
    pub observed_tip: ExpectedTip,
    /// Distinct from attribution: equality cannot establish a CAS winner.
    pub publication_state: PublicationState,
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PublicationState {
    NotPublished,
    CurrentlyAtCandidate,
    CasObservedSuccessful,
    Unknown,
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Checkout {
    NotApplicable,
    Pending,
    Reconciled,
    RecoveryRequired,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Durability {
    pub level: DurabilityLevel,
    pub capability_evidence: Vec<String>,
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum DurabilityLevel {
    ProcessCrash,
    StableMedia,
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Remote {
    NotRequested,
    Acknowledged,
    Unknown,
    Rejected,
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ConsumerSettlement {
    NotOwnedByGit,
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Attribution {
    ThisInvocationWonCas,
    EffectObservedOnly,
    Uncertain,
}

#[derive(Debug)]
pub struct OperationError {
    pub code: ResultCode,
    pub cause: String,
    pub retryable: bool,
    pub operation_id: Option<String>,
    pub receipt: Option<Box<Receipt>>,
    pub exit_code: Option<i32>,
    pub signal: Option<i32>,
    /// Driver must bound and redact before constructing this value.
    pub stderr: Vec<u8>,
}
pub type Result<T> = std::result::Result<T, OperationError>;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ObjectType {
    Blob,
    Tree,
    Commit,
    Tag,
}
#[derive(Debug)]
pub struct TreeEntry {
    pub name: Vec<u8>,
    pub mode: u32,
    pub oid: Oid,
}
#[derive(Debug)]
pub struct Identity {
    pub name: String,
    pub email: String,
}
/// Dates are mandatory caller inputs, never implicitly supplied by the clock.
#[derive(Debug)]
pub struct CommitInput {
    pub tree: Oid,
    pub parents: Vec<Oid>,
    pub author: Identity,
    pub committer: Identity,
    pub author_date: String,
    pub committer_date: String,
    pub message: Vec<u8>,
}
#[derive(Debug)]
pub struct WalkBounds {
    pub max_commits: usize,
    pub max_bytes: usize,
}
#[derive(Debug)]
pub struct WalkCursor(pub Vec<u8>);
#[derive(Debug)]
pub struct WalkCommit {
    pub oid: Oid,
    pub parents: Vec<Oid>,
    pub tree: Oid,
}
#[derive(Debug)]
pub struct WalkPage {
    pub commits: Vec<WalkCommit>,
    pub next_cursor: Option<WalkCursor>,
    pub complete: bool,
}
#[derive(Debug)]
pub enum ReadObject {
    Present { kind: ObjectType, bytes: Vec<u8> },
    Missing,
}
#[derive(Debug)]
pub enum PushOutcome {
    Accepted,
    RejectedNonFastForward { advertised_tip: Option<Oid> },
    RejectedOther { reason: String },
    RemoteOutcomeUnknown,
}
#[derive(Debug)]
pub struct PushResult {
    pub receipt: Receipt,
    pub refs: Vec<(RefName, PushOutcome)>,
}

/// Typed publication contract. PublicationPort implements it under the caller's
/// opaque event-seal authority and the signed §4/§10 WAL protocol.
pub trait Publication: Inspect {
    fn write_blob(&self, repo: &RepoHandle, bytes: &[u8]) -> Result<Oid>;
    fn write_tree(&self, repo: &RepoHandle, entries: &[TreeEntry]) -> Result<Oid>;
    fn write_commit(&self, repo: &RepoHandle, input: &CommitInput) -> Result<Oid>;
    fn read_ref(&self, repo: &RepoHandle, name: &RefName) -> Result<RefValue>;
    fn read_object(
        &self,
        repo: &RepoHandle,
        oid: &Oid,
        expected_type: ObjectType,
    ) -> Result<ReadObject>;
    fn compare_and_swap(
        &self,
        repo: &RepoHandle,
        name: &RefName,
        expected: &ExpectedTip,
        next: &ExpectedTip,
        operation_id: &str,
    ) -> Result<Receipt>;
    fn fetch_refs(&self, repo: &RepoHandle, remote: &str, refspecs: &[String]) -> Result<Receipt>;
    fn push_refs(
        &self,
        repo: &RepoHandle,
        remote: &str,
        refs: &[(RefName, RefName)],
    ) -> Result<PushResult>;
}
#[derive(Debug)]
pub struct ConfigFact {
    pub value: Vec<u8>,
    pub origin: PathBuf,
}
#[derive(Debug)]
pub struct FloorProbe {
    pub name: String,
    pub passed: bool,
    pub evidence: String,
}
#[derive(Debug)]
pub struct GitFloorVerdict {
    pub version: String,
    pub minimum: String,
    pub supported: bool,
    pub probes: Vec<FloorProbe>,
}
#[derive(Debug)]
pub struct FetchMappingProvenance {
    pub operation_id: String,
    pub remote_url: String,
    pub refspecs: Vec<String>,
}

pub trait Inspect {
    fn resolve_head(&self, repo: &RepoHandle) -> Result<HeadFact>;
    fn list_tree(
        &self,
        repo: &RepoHandle,
        revision: &Oid,
        prefix: &[u8],
        cursor: Option<TreeCursor>,
        max_entries: usize,
    ) -> Result<TreePage>;

    fn list_refs(
        &self,
        repo: &RepoHandle,
        prefixes: &[RefPrefix],
        cursor: Option<RefCursor>,
        max_entries: usize,
    ) -> Result<RefPage>;
    fn read_paths_at(
        &self,
        repo: &RepoHandle,
        revision: &Oid,
        paths: &[Vec<u8>],
        max_blob_bytes: usize,
    ) -> Result<Vec<PathRead>>;

    fn walk_commits(
        &self,
        repo: &RepoHandle,
        tips: &[Oid],
        stop: &[Oid],
        cursor: Option<WalkCursor>,
        bounds: WalkBounds,
    ) -> Result<WalkPage>;
    fn configured_fetch_refspecs(&self, repo: &RepoHandle, remote: &str)
        -> Result<Vec<ConfigFact>>;
    fn push_refspecs(&self, repo: &RepoHandle, remote: &str) -> Result<Vec<ConfigFact>>;
    /// Effective URL, with credentials redacted by the future driver.
    fn remote_url(&self, repo: &RepoHandle, remote: &str) -> Result<String>;
    fn machine_id(&self, repo: &RepoHandle) -> Result<Option<ConfigFact>>;
    fn git_floor_verdict(&self) -> Result<GitFloorVerdict>;
    fn fetch_mapping_provenance(
        &self,
        repo: &RepoHandle,
        remote: &str,
    ) -> Result<Option<FetchMappingProvenance>>;
    fn resolve_repo(&self, path: &std::path::Path) -> Result<ResolveRepo>;
}
pub trait RepositoryConfig {
    fn ensure_fetch_mapping(
        &self,
        repo: &RepoHandle,
        remote: &str,
        refspecs: &[String],
        operation_id: &str,
    ) -> Result<Receipt>;
}

/// Repository-owned compatibility features; none grants implicit network access.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RepoLayout {
    pub refs: RefStorage,
    pub shallow: bool,
    pub alternates: bool,
    pub promisor: bool,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RefStorage {
    Files,
    Reftable,
}

/// Literal byte prefix, never a Git glob. A trailing slash selects a namespace.
#[derive(Debug, Clone)]
pub struct RefPrefix(String);
impl RefPrefix {
    pub fn parse(value: &str) -> std::result::Result<Self, InvalidInput> {
        RefName::parse(value.trim_end_matches('/'))?;
        Ok(Self(value.into()))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}
#[derive(Debug, Clone)]
pub struct RefCursor {
    pub(crate) binding: Vec<String>,
    pub(crate) after: String,
}
#[derive(Debug)]
pub struct RefEntry {
    pub name: RefName,
    pub value: RefValue,
}
#[derive(Debug)]
pub struct RefPage {
    pub entries: Vec<RefEntry>,
    pub complete: bool,
    pub next_cursor: Option<RefCursor>,
}
#[derive(Debug)]
pub enum PathValue {
    Blob(Vec<u8>),
    Absent,
    NotABlob(ObjectType),
    Error(OperationError),
}
#[derive(Debug)]
pub struct PathRead {
    pub path: Vec<u8>,
    pub value: PathValue,
}

/// Checked-out commit and symbolic target belong to this handle's worktree.
#[derive(Debug)]
pub enum HeadFact {
    Attached { target: RefName, commit: Oid },
    Detached { commit: Oid },
    Unborn { target: RefName },
}
#[derive(Debug, Clone)]
pub struct TreeCursor {
    pub(crate) revision: Oid,
    pub(crate) prefix: Vec<u8>,
    pub(crate) after: Vec<u8>,
}
#[derive(Debug)]
pub struct ListedTreeEntry {
    pub path: Vec<u8>,
    pub mode: u32,
    pub kind: ObjectType,
    pub oid: Oid,
}
#[derive(Debug)]
pub struct TreePage {
    pub entries: Vec<ListedTreeEntry>,
    pub complete: bool,
    pub next_cursor: Option<TreeCursor>,
}

/// Versions of the public Git contracts, independent of package release versions.
pub fn contract_versions() -> serde_json::Value {
    serde_json::json!({"gitPort": 1, "receipt": 1, "walRecord": 1})
}

pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Lock-taking Git ports stay dormant until the Windows handoff exists (Q6).
pub fn require_lock_scope_platform() -> Result<()> {
    if cfg!(target_os = "windows") {
        return Err(OperationError {
            code: ResultCode::Refused,
            cause: "git-lockscope-unavailable-windows".into(),
            retryable: false,
            operation_id: None,
            receipt: None,
            exit_code: None,
            signal: None,
            stderr: vec![],
        });
    }
    Ok(())
}
