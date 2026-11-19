//! The driver contract and what it returns: the assessment of a request, the prepared invocation, and the
//! mismatches that refuse one by name.

use super::DriverError;
use serde_json::{Map, Value};
use std::path::PathBuf;

/// One named refusal: a stable `code` and the sentence that says why.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Mismatch {
    pub code: String,
    pub detail: String,
}

impl Mismatch {
    pub fn new(code: &str, detail: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            detail: detail.into(),
        }
    }
}

/// What a backend can enforce of a request: per-control coverage, the resolved resources, readiness of each
/// declared need and every mismatch. A request with a mismatch is refused, never accepted best-effort.
#[derive(Debug, Clone, PartialEq)]
pub struct Assessment {
    pub coverage: Map<String, Value>,
    pub resources: Vec<Value>,
    pub readiness: Map<String, Value>,
    pub mismatches: Vec<Mismatch>,
}

/// The sandbox invocation a driver prepared, plus what the caller keeps to settle it.
#[derive(Debug, Clone, PartialEq)]
pub struct Prepared {
    /// The request's invocation with the backend's command, the sandbox argv and the resolved env.
    pub invocation: Value,
    pub claims: Map<String, Value>,
    /// A supervised attempt only: the sandbox argv prefix the gate command follows.
    pub bwrap_prefix: Option<Vec<String>>,
    pub agent_argv: Option<Vec<String>>,
    /// Digest of the prefix, the gate command and the agent argv; present when the request names a gate command.
    pub launch_digest: Option<String>,
    /// `{credentialProvisioned: true}` when a login was copied into the private home.
    pub provider_capacity: Option<Value>,
    pub credential_write_back: Option<Value>,
    /// Homes this preparation allocated; a settle removes them through the private-home host.
    pub allocated_paths: Vec<PathBuf>,
    pub dispatch_id: String,
}

/// One backend type: validates its instance config, assesses a request and prepares the invocation.
pub trait BackendDriver: Send + Sync {
    fn driver_type(&self) -> &str;
    fn version(&self) -> &str;
    fn validate_config(&self, config: &Value, label: &str) -> Result<(), DriverError>;
    fn assess(&self, request: &Value, backend: &Value) -> Result<Assessment, DriverError>;
    fn prepare(
        &self,
        plan: &Value,
        request: &Value,
        backend: &Value,
    ) -> Result<Prepared, DriverError>;
}
