//! Manifest parser and validator for external process providers.
//!
//! R2-P1: Static manifest discovery and validation without executing provider code.
//! Fails closed on malformed, missing, path-escaping, and unsupported manifests.

use crate::contracts::{ContractRef, OperationId, OperationIdError};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::path::{Component, Path, PathBuf};

/// Supported manifest versions for external providers.
pub const SUPPORTED_MANIFEST_VERSIONS: &[&str] = &["1.0.0", "1.0", "1", "v1", "fgos.component.v1"];

/// Supported runtime kinds for external process providers.
pub const SUPPORTED_RUNTIME_KINDS: &[&str] = &["process"];

/// Supported component protocols.
pub const SUPPORTED_PROTOCOLS: &[&str] = &["fgos.component.v1", "1.0.0", "1", "v1", "process.v1"];

/// Errors returned during manifest parsing and validation.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum ManifestError {
    #[error("missing manifest file: '{0}'")]
    MissingManifest(String),

    #[error("malformed yaml in manifest: {0}")]
    MalformedYaml(String),

    #[error("manifest content is not valid utf-8: {0}")]
    NonUtf8(String),

    #[error("unsupported manifest version '{0}'; supported versions: 1.0.0, 1.0, 1, v1, fgos.component.v1")]
    UnsupportedManifestVersion(String),

    #[error("unsupported runtime kind '{0}'; only 'process' is supported")]
    UnsupportedRuntimeKind(String),

    #[error("unsupported protocol '{0}'")]
    UnsupportedProtocol(String),

    #[error("path escaping detected in command '{path}': {reason}")]
    PathEscaping { path: String, reason: String },

    #[error("invalid operation id '{raw}': {error}")]
    InvalidOperationId {
        raw: String,
        error: OperationIdError,
    },

    #[error("malformed contract reference '{raw}': {reason}")]
    MalformedContractRef { raw: String, reason: String },

    #[error("manifest validation error: {0}")]
    Validation(String),

    #[error("i/o error reading manifest: {0}")]
    Io(String),
}

impl From<std::io::Error> for ManifestError {
    fn from(err: std::io::Error) -> Self {
        if err.kind() == std::io::ErrorKind::NotFound {
            Self::MissingManifest(err.to_string())
        } else {
            Self::Io(err.to_string())
        }
    }
}

/// Helper function to parse a contract reference string (e.g. `fixture.echo.echo.request@1.0.0`).
pub fn parse_contract_ref(s: &str) -> Result<ContractRef, ManifestError> {
    let trimmed = s.trim();
    if trimmed != s {
        return Err(ManifestError::MalformedContractRef {
            raw: s.to_string(),
            reason: "contract reference contains leading or trailing whitespace".to_string(),
        });
    }

    let parts: Vec<&str> = trimmed.split('@').collect();
    if parts.len() != 2 {
        return Err(ManifestError::MalformedContractRef {
            raw: s.to_string(),
            reason: "contract reference must be formatted as <contract_id>@<version>".to_string(),
        });
    }

    let id = parts[0].trim();
    let version = parts[1].trim();

    if id.is_empty() {
        return Err(ManifestError::MalformedContractRef {
            raw: s.to_string(),
            reason: "contract id cannot be empty".to_string(),
        });
    }
    if version.is_empty() {
        return Err(ManifestError::MalformedContractRef {
            raw: s.to_string(),
            reason: "contract version cannot be empty".to_string(),
        });
    }

    Ok(ContractRef::new(id, version))
}

/// Operation declaration under `provides.operations[]`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ExternalOperationDeclaration {
    #[serde(alias = "operation_id", alias = "operationId")]
    pub id: String,

    #[serde(alias = "requestContract", alias = "request_contract")]
    pub request_contract: String,

    #[serde(alias = "outcomeContract", alias = "outcome_contract")]
    pub outcome_contract: String,

    pub protocol: String,
}

/// Runtime declaration under `runtime`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ExternalRuntimeDeclaration {
    pub kind: String,
    pub command: PathBuf,

    #[serde(default)]
    pub args: Vec<String>,

    #[serde(default)]
    pub env: HashMap<String, String>,
}

/// Provides declaration under `provides`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ExternalProvidesDeclaration {
    pub operations: Vec<ExternalOperationDeclaration>,
}

/// Parsed and validated static manifest (`manifest.yaml`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ExternalManifest {
    #[serde(alias = "manifestVersion", alias = "manifest_version")]
    pub manifest_version: String,

    pub id: String,

    pub version: String,

    #[serde(default)]
    pub kind: Option<String>,

    pub runtime: ExternalRuntimeDeclaration,

    pub provides: ExternalProvidesDeclaration,

    #[serde(default)]
    pub capabilities: Vec<String>,

    #[serde(default)]
    pub replacement: Option<String>,

    #[serde(skip)]
    pub manifest_path: Option<PathBuf>,

    #[serde(skip)]
    pub raw_digest: Option<String>,
}

impl ExternalManifest {
    /// Parses a YAML string and validates all fields against base directory rules.
    pub fn from_yaml_str(yaml: &str, base_dir: Option<&Path>) -> Result<Self, ManifestError> {
        let mut manifest: Self =
            serde_yaml::from_str(yaml).map_err(|e| ManifestError::MalformedYaml(e.to_string()))?;

        // Calculate SHA-256 digest of the manifest string
        let mut hasher = Sha256::new();
        hasher.update(yaml.as_bytes());
        let digest = format!("{:x}", hasher.finalize());
        manifest.raw_digest = Some(digest);

        manifest.validate(base_dir)?;
        Ok(manifest)
    }

    /// Loads and validates a manifest from raw bytes. Fails if bytes are not UTF-8.
    pub fn load_from_bytes(bytes: &[u8], base_dir: Option<&Path>) -> Result<Self, ManifestError> {
        let yaml_str =
            std::str::from_utf8(bytes).map_err(|e| ManifestError::NonUtf8(e.to_string()))?;

        Self::from_yaml_str(yaml_str, base_dir)
    }

    /// Loads and validates a manifest from a file path without executing provider code.
    pub fn load_from_file(path: impl AsRef<Path>) -> Result<Self, ManifestError> {
        let path_ref = path.as_ref();
        if !path_ref.exists() {
            return Err(ManifestError::MissingManifest(
                path_ref.display().to_string(),
            ));
        }

        let bytes = fs::read(path_ref).map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                ManifestError::MissingManifest(path_ref.display().to_string())
            } else {
                ManifestError::Io(e.to_string())
            }
        })?;

        let base_dir = path_ref.parent();
        let mut manifest = Self::load_from_bytes(&bytes, base_dir)?;
        manifest.manifest_path = Some(path_ref.to_path_buf());
        Ok(manifest)
    }

    /// Performs static semantic validation on the manifest fields.
    pub fn validate(&self, base_dir: Option<&Path>) -> Result<(), ManifestError> {
        // 1. Validate manifestVersion
        let ver = self.manifest_version.trim();
        if !SUPPORTED_MANIFEST_VERSIONS.contains(&ver) {
            return Err(ManifestError::UnsupportedManifestVersion(
                self.manifest_version.clone(),
            ));
        }

        // 2. Validate id
        if self.id.trim() != self.id || self.id.is_empty() {
            return Err(ManifestError::Validation(
                "provider id must not be empty and cannot contain leading/trailing whitespace"
                    .to_string(),
            ));
        }
        if self.id.contains(char::is_whitespace) {
            return Err(ManifestError::Validation(
                "provider id cannot contain internal whitespace".to_string(),
            ));
        }

        // 3. Validate version
        if self.version.trim() != self.version || self.version.is_empty() {
            return Err(ManifestError::Validation(
                "provider version must not be empty and cannot contain whitespace".to_string(),
            ));
        }

        // 4. Validate runtime.kind
        if !SUPPORTED_RUNTIME_KINDS.contains(&self.runtime.kind.as_str()) {
            return Err(ManifestError::UnsupportedRuntimeKind(
                self.runtime.kind.clone(),
            ));
        }

        // 5. Validate runtime.command for path escaping
        Self::validate_command_path(&self.runtime.command, base_dir)?;

        // 6. Validate provides.operations
        if self.provides.operations.is_empty() {
            return Err(ManifestError::Validation(
                "provides.operations must contain at least one operation".to_string(),
            ));
        }

        let mut seen_ops = std::collections::HashSet::new();
        for op in &self.provides.operations {
            // Validate whitespace and casing on operation id
            let raw_id = op.id.as_str();
            if raw_id.trim() != raw_id {
                return Err(ManifestError::Validation(format!(
                    "operation id '{raw_id}' contains leading or trailing whitespace"
                )));
            }
            if raw_id.contains(char::is_whitespace) {
                return Err(ManifestError::Validation(format!(
                    "operation id '{raw_id}' contains internal whitespace"
                )));
            }
            if raw_id != raw_id.to_ascii_lowercase() {
                return Err(ManifestError::Validation(format!(
                    "operation id '{raw_id}' must be lowercase"
                )));
            }

            // Parse through OperationId validator
            let parsed_id =
                OperationId::parse(raw_id).map_err(|e| ManifestError::InvalidOperationId {
                    raw: raw_id.to_string(),
                    error: e,
                })?;

            // Check intra-manifest duplicates
            if !seen_ops.insert(parsed_id.as_str().to_string()) {
                return Err(ManifestError::Validation(format!(
                    "duplicate operation id '{raw_id}' within the same manifest"
                )));
            }

            // Validate contract refs
            parse_contract_ref(&op.request_contract)?;
            parse_contract_ref(&op.outcome_contract)?;

            // Validate protocol
            let proto = op.protocol.trim();
            if proto.is_empty() || !SUPPORTED_PROTOCOLS.contains(&proto) {
                return Err(ManifestError::UnsupportedProtocol(op.protocol.clone()));
            }
        }

        // 7. Validate capabilities
        for cap in &self.capabilities {
            if cap.trim() != cap || cap.is_empty() {
                return Err(ManifestError::Validation(
                    "capability name must not be empty or contain whitespace".to_string(),
                ));
            }
        }

        Ok(())
    }

    /// Validates that `command` is manifest-relative and does not escape the manifest directory.
    pub fn validate_command_path(
        command: &Path,
        base_dir: Option<&Path>,
    ) -> Result<(), ManifestError> {
        let cmd_str = command
            .to_str()
            .ok_or_else(|| ManifestError::PathEscaping {
                path: command.display().to_string(),
                reason: "command path contains invalid utf-8".to_string(),
            })?;

        if cmd_str.trim().is_empty() {
            return Err(ManifestError::PathEscaping {
                path: cmd_str.to_string(),
                reason: "command path cannot be empty".to_string(),
            });
        }

        if cmd_str.contains('\0') {
            return Err(ManifestError::PathEscaping {
                path: cmd_str.to_string(),
                reason: "command path contains null bytes".to_string(),
            });
        }

        // Check for absolute paths
        if command.is_absolute()
            || cmd_str.starts_with('/')
            || cmd_str.starts_with('\\')
            || (cmd_str.len() >= 2 && cmd_str.chars().nth(1) == Some(':'))
        {
            return Err(ManifestError::PathEscaping {
                path: cmd_str.to_string(),
                reason: "command path must be manifest-relative; absolute paths are forbidden"
                    .to_string(),
            });
        }

        // Check for '..' parent directory traversal in path components
        for component in command.components() {
            if matches!(component, Component::ParentDir) {
                return Err(ManifestError::PathEscaping {
                    path: cmd_str.to_string(),
                    reason: "command path contains '..' parent directory traversal".to_string(),
                });
            }
        }

        // If base_dir is known, verify symlink target stays within manifest directory
        if let Some(base) = base_dir {
            let full_path = base.join(command);
            // If the path exists on disk, check whether it or any component is a symlink that points outside base_dir
            if full_path.exists() || fs::symlink_metadata(&full_path).is_ok() {
                if let Ok(canonical_base) = fs::canonicalize(base) {
                    if let Ok(canonical_target) = fs::canonicalize(&full_path) {
                        if !canonical_target.starts_with(&canonical_base) {
                            return Err(ManifestError::PathEscaping {
                                path: cmd_str.to_string(),
                                reason:
                                    "command path resolves to a symlink outside manifest directory"
                                        .to_string(),
                            });
                        }
                    }
                }
            }
        }

        Ok(())
    }
}
