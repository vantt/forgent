//! Canonical kernel contracts and types.
//!
//! Kernel §3 / §5 contract definitions for `fgos-host-runtime`.
//!
//! Forward reference note:
//! `OperationProvider` trait definition and its `invoke()` signature are owned
//! by Phase 06 (`invocation_service.rs`). Phase 05 declares `OperationProvider`
//! only as a forward-referencing doc comment and does not define `invoke()` or
//! the trait body.

use serde::{Deserialize, Serialize};
use std::any::Any;
use std::borrow::Cow;
use std::fmt;
use std::str::FromStr;

/// Error returned when parsing an invalid [`OperationId`].
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum OperationIdError {
    #[error("operation id must have 3 or 4 dot-separated segments (<component>.<object-type>.<action>[.<variant>]), got '{0}'")]
    InvalidSegmentCount(String),
    #[error("operation id segment cannot be empty in '{0}'")]
    EmptySegment(String),
    #[error("operation id segment '{segment}' contains invalid character '{char}' in '{raw}'")]
    InvalidCharacter {
        char: char,
        segment: String,
        raw: String,
    },
}

/// Stable semantic identifier for an operation.
///
/// Validated format: `<component>.<object-type>.<action>[.<variant>]`.
/// - `<component>` owns authority (e.g. `distribution`, `work`).
/// - `<object-type>` is singular (e.g. `build`, `item`).
/// - `<action>` is a verb (e.g. `show`, `submit`, `create`).
/// - `<variant>` is an optional extension.
#[derive(Clone, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
pub struct OperationId(pub Cow<'static, str>);

impl OperationId {
    /// Parses and validates an operation identifier from a string.
    pub fn parse(s: impl AsRef<str>) -> Result<Self, OperationIdError> {
        let raw = s.as_ref();
        let segments: Vec<&str> = raw.split('.').collect();
        if segments.len() < 3 || segments.len() > 4 {
            return Err(OperationIdError::InvalidSegmentCount(raw.to_string()));
        }
        for segment in &segments {
            if segment.is_empty() {
                return Err(OperationIdError::EmptySegment(raw.to_string()));
            }
            for c in segment.chars() {
                if !(c.is_ascii_alphanumeric() || c == '-' || c == '_') {
                    return Err(OperationIdError::InvalidCharacter {
                        char: c,
                        segment: (*segment).to_string(),
                        raw: raw.to_string(),
                    });
                }
            }
        }
        Ok(Self(Cow::Owned(raw.to_string())))
    }

    /// Constructs an `OperationId` from a static string literal without runtime allocation.
    pub const fn from_static(s: &'static str) -> Self {
        Self(Cow::Borrowed(s))
    }

    /// Returns the raw operation string.
    pub fn as_str(&self) -> &str {
        self.0.as_ref()
    }

    /// Returns the `<component>` segment.
    pub fn component(&self) -> &str {
        self.0.split('.').next().unwrap_or("")
    }

    /// Returns the `<object-type>` segment.
    pub fn object_type(&self) -> &str {
        self.0.split('.').nth(1).unwrap_or("")
    }

    /// Returns the `<action>` segment.
    pub fn action(&self) -> &str {
        self.0.split('.').nth(2).unwrap_or("")
    }

    /// Returns the optional `<variant>` segment.
    pub fn variant(&self) -> Option<&str> {
        self.0.split('.').nth(3)
    }
}

impl fmt::Display for OperationId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl fmt::Debug for OperationId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "OperationId(\"{}\")", self.as_str())
    }
}

impl std::ops::Deref for OperationId {
    type Target = str;
    fn deref(&self) -> &Self::Target {
        self.as_str()
    }
}

impl AsRef<str> for OperationId {
    fn as_ref(&self) -> &str {
        self.as_str()
    }
}

impl std::borrow::Borrow<str> for OperationId {
    fn borrow(&self) -> &str {
        self.as_str()
    }
}

impl FromStr for OperationId {
    type Err = OperationIdError;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::parse(s)
    }
}

impl TryFrom<&str> for OperationId {
    type Error = OperationIdError;
    fn try_from(s: &str) -> Result<Self, Self::Error> {
        Self::parse(s)
    }
}

impl TryFrom<String> for OperationId {
    type Error = OperationIdError;
    fn try_from(s: String) -> Result<Self, Self::Error> {
        Self::parse(s)
    }
}

/// Host/caller invocation context admitted before routing.
///
/// `host_kind` is an open string (e.g. `"cli"`, `"remote"`, `"chat"`), not a closed enum.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostInvocation {
    pub host_kind: String,
    pub invocation_id: Option<String>,
    pub deadline: Option<std::time::SystemTime>,
    pub cancellation_token: Option<String>,
    pub trace_context: Option<String>,
}

impl HostInvocation {
    pub fn new(host_kind: impl Into<String>) -> Self {
        Self {
            host_kind: host_kind.into(),
            invocation_id: None,
            deadline: None,
            cancellation_token: None,
            trace_context: None,
        }
    }
}

/// Identifies a contract schema and version (`{id, version}`) traveling with requests and outcomes.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ContractRef {
    pub id: Cow<'static, str>,
    pub version: Cow<'static, str>,
}

impl ContractRef {
    pub const fn from_static(id: &'static str, version: &'static str) -> Self {
        Self {
            id: Cow::Borrowed(id),
            version: Cow::Borrowed(version),
        }
    }

    pub fn new(id: impl Into<String>, version: impl Into<String>) -> Self {
        Self {
            id: Cow::Owned(id.into()),
            version: Cow::Owned(version.into()),
        }
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn version(&self) -> &str {
        &self.version
    }
}

/// Typed request carrying operation id, contract reference, and typed input.
pub struct OperationRequest {
    pub operation: OperationId,
    pub contract: ContractRef,
    pub input: Box<dyn Any + Send>,
}

impl OperationRequest {
    pub fn new(operation: OperationId, contract: ContractRef, input: Box<dyn Any + Send>) -> Self {
        Self {
            operation,
            contract,
            input,
        }
    }
}

impl fmt::Debug for OperationRequest {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("OperationRequest")
            .field("operation", &self.operation)
            .field("contract", &self.contract)
            .field("input", &"<Box<dyn Any + Send>>")
            .finish()
    }
}

/// Typed outcome returned from a provider invocation.
pub enum ProviderOutcome {
    Completed {
        contract: ContractRef,
        output: Box<dyn Any + Send>,
        diagnostics: Vec<String>,
    },
}

impl ProviderOutcome {
    pub fn completed(contract: ContractRef, output: Box<dyn Any + Send>) -> Self {
        Self::Completed {
            contract,
            output,
            diagnostics: Vec::new(),
        }
    }

    pub fn completed_with_diagnostics(
        contract: ContractRef,
        output: Box<dyn Any + Send>,
        diagnostics: Vec<String>,
    ) -> Self {
        Self::Completed {
            contract,
            output,
            diagnostics,
        }
    }

    pub fn contract(&self) -> &ContractRef {
        match self {
            Self::Completed { contract, .. } => contract,
        }
    }

    pub fn diagnostics(&self) -> &[String] {
        match self {
            Self::Completed { diagnostics, .. } => diagnostics,
        }
    }
}

impl fmt::Debug for ProviderOutcome {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Completed {
                contract,
                diagnostics,
                ..
            } => f
                .debug_struct("ProviderOutcome::Completed")
                .field("contract", contract)
                .field("output", &"<Box<dyn Any + Send>>")
                .field("diagnostics", diagnostics)
                .finish(),
        }
    }
}

/// Closed failure families a provider call can terminate with (kernel §8).
///
/// Note: pipeline normalization (`provider-failed`) and outcome extension (`parked`)
/// are additions owned by Phase 06.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum ProviderError {
    #[error("semantic validation error: {0}")]
    SemanticValidation(String),
    #[error("precondition error: {0}")]
    Precondition(String),
    #[error("conflict error: {0}")]
    Conflict(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("caller admission denied: {0}")]
    CallerAdmissionDenied(String),
    #[error("selected provider capability denied: {0}")]
    SelectedProviderCapabilityDenied(String),
    #[error("no binding: {0}")]
    NoBinding(String),
    #[error("ambiguous binding: {0}")]
    AmbiguousBinding(String),
    #[error("incompatible contract: {0}")]
    IncompatibleContract(String),
    #[error("provider unavailable: {0}")]
    ProviderUnavailable(String),
    #[error("protocol violation: {0}")]
    ProtocolViolation(String),
    #[error("provider crash: {0}")]
    ProviderCrash(String),
    #[error("deadline exceeded: {0}")]
    DeadlineExceeded(String),
    #[error("caller cancelled: {0}")]
    CallerCancelled(String),
    #[error("completion unknown: {0}")]
    CompletionUnknown(String),
}

/// Lifecycle mode of a provider instance.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ProviderLifecycle {
    Singleton,
    PerInvocation,
    Pooled,
}

/// Descriptor of a registered operation provider.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProviderDescriptor {
    pub provider_id: Cow<'static, str>,
    pub operation_id: OperationId,
    pub component_class: Cow<'static, str>,
    pub mechanism: Cow<'static, str>,
    pub lifecycle: ProviderLifecycle,
    pub request_contract: ContractRef,
    pub outcome_contract: ContractRef,
    pub allowed_hosts: &'static [&'static str],
    pub allowed_modes: &'static [&'static str],
    pub capabilities: &'static [&'static str],
    pub replacement: Option<&'static str>,
    pub concurrency: Option<u32>,
    pub health: Option<&'static str>,
}

impl ProviderDescriptor {
    pub fn operation(&self) -> &OperationId {
        &self.operation_id
    }
}

/// Effect of an operation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum OperationEffect {
    Read,
    Write,
    External,
}

/// Idempotency guarantee of an operation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum OperationIdempotency {
    None,
    Keyed,
    Safe,
}

/// Streaming mode of an operation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum StreamingMode {
    None,
    Client,
    Server,
    Bidirectional,
}

/// Descriptor for an operation in the catalog.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OperationDescriptor {
    pub operation_id: OperationId,
    pub owning_component_id: Cow<'static, str>,
    pub request_contract: ContractRef,
    pub outcome_contract: ContractRef,
    pub effect: OperationEffect,
    pub idempotency: OperationIdempotency,
    pub authority_policy_id: Cow<'static, str>,
    pub allowed_host_kinds: &'static [&'static str],
    pub streaming_mode: StreamingMode,
}

impl OperationDescriptor {
    pub fn operation(&self) -> &OperationId {
        &self.operation_id
    }
}

/// Authority-bearing inventory of operation descriptors.
pub type OperationCatalog = &'static [OperationDescriptor];

/// Immutable linked provider registry snapshot for an invocation.
///
/// `providers` holds `ProviderDescriptor` metadata, not `&'static dyn
/// OperationProvider` trait objects, even though phase-05.md's own R1/R3
/// literally specify the latter. This is a genuine contradiction inside the
/// phase spec, not a misreading on either side: R1/R3 ask for the
/// trait-object field, while R7 says in the same breath that THIS phase
/// "does not define... the trait body" at all -- and a `&'static dyn Trait`
/// field cannot type-check with no trait definition in scope. (A `dyn
/// Trait` field itself would need no dependency on any IMPLEMENTING crate --
/// that is not the blocker; the blocker is that the trait declaration itself
/// does not exist yet in this crate, by R7's own explicit instruction.)
/// R7 is treated as controlling here: `OperationProvider` (the trait
/// carrying `descriptor()` + async `invoke()`) is defined fresh in Phase
/// 06's `invocation_service.rs` (per that phase's own R3: "defined here,
/// not in contracts.rs"), which consumes this crate's `select()` read-only.
/// Cost of this choice, for whoever picks up Phase 06/08: `select()` hands
/// back a `&ProviderDescriptor`, so `InvocationService` needs its own
/// separate mapping from a selected `ProviderDescriptor` to the real
/// provider object it dispatches to, rather than the one shared table
/// canonical §6 sketches -- two registration tables Phase 08 must keep in
/// sync instead of one.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegistrySnapshot {
    pub catalog: OperationCatalog,
    pub providers: &'static [ProviderDescriptor],
    pub fingerprint: &'static str,
}

impl RegistrySnapshot {
    pub fn catalog(&self) -> OperationCatalog {
        self.catalog
    }

    pub fn providers(&self) -> &'static [ProviderDescriptor] {
        self.providers
    }

    pub fn fingerprint(&self) -> &'static str {
        self.fingerprint
    }
}

// -----------------------------------------------------------------------------
// OperationProvider
//
// Forward reference: The `OperationProvider` trait definition and its async
// `invoke()` signature are owned by Phase 06 (`invocation_service.rs`).
// Phase 05 declares this only as a forward-referencing doc comment and does not
// define `invoke()` or the trait body.
// -----------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_valid_operation_id() {
        let op = OperationId::parse("distribution.build.show").expect("valid 3 segments");
        assert_eq!(op.component(), "distribution");
        assert_eq!(op.object_type(), "build");
        assert_eq!(op.action(), "show");
        assert_eq!(op.variant(), None);
        assert_eq!(op.as_str(), "distribution.build.show");

        let op4 = OperationId::parse("work.item.submit.quick").expect("valid 4 segments");
        assert_eq!(op4.component(), "work");
        assert_eq!(op4.object_type(), "item");
        assert_eq!(op4.action(), "submit");
        assert_eq!(op4.variant(), Some("quick"));
    }

    #[test]
    fn parse_invalid_operation_ids() {
        assert!(matches!(
            OperationId::parse("foo.bar"),
            Err(OperationIdError::InvalidSegmentCount(_))
        ));
        assert!(matches!(
            OperationId::parse("a.b.c.d.e"),
            Err(OperationIdError::InvalidSegmentCount(_))
        ));
        assert!(matches!(
            OperationId::parse("foo..bar"),
            Err(OperationIdError::EmptySegment(_))
        ));
        assert!(matches!(
            OperationId::parse("foo.b@r.baz"),
            Err(OperationIdError::InvalidCharacter { char: '@', .. })
        ));
    }
}
