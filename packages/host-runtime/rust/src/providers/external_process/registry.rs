//! Derived in-memory registry and linker for external process providers.
//!
//! R2-P2: Links static manifests into an in-memory registry snapshot.
//! Fails closed on duplicate claims, reserved namespaces, unknown capabilities,
//! incompatible contracts, and built-in provider replacement.

use super::manifest::{parse_contract_ref, ExternalManifest, ManifestError};
use crate::contracts::{
    ContractRef, OperationCatalog, OperationId, ProviderDescriptor, ProviderLifecycle,
    RegistrySnapshot,
};
use sha2::{Digest, Sha256};
use std::borrow::Cow;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};

/// Default list of reserved/core namespaces that external providers cannot claim.
pub const DEFAULT_RESERVED_NAMESPACES: &[&str] = &[
    "distribution",
    "work",
    "fgos",
    "core",
    "system",
    "host",
    "test",
    "kernel",
    "lifecycle",
    "coordination",
    "authority",
    "router",
];

/// Default set of known capabilities that can be requested.
pub const DEFAULT_KNOWN_CAPABILITIES: &[&str] = &[
    "process.exec",
    "git.read",
    "git.mutate",
    "fs.read",
    "fs.write",
    "fgos.write",
    ".fgos.write",
    "network.outbound",
    "secrets.read",
    "host.callback",
    "stdio.rpc",
    "test.echo",
];

/// Errors returned by the external provider linker when refusing claims.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum LinkerError {
    #[error("duplicate operation claim for '{operation_id}': claimed by '{first_provider_id}' and '{second_provider_id}'")]
    DuplicateOperationClaim {
        operation_id: OperationId,
        first_provider_id: String,
        second_provider_id: String,
    },

    #[error("reserved/core namespace claim refused: operation '{operation_id}' belongs to reserved namespace '{namespace}'")]
    ReservedNamespace {
        operation_id: OperationId,
        namespace: String,
    },

    #[error("unknown capability claim refused: provider '{provider_id}' requested unknown capability '{capability}'")]
    UnknownCapability {
        provider_id: String,
        capability: String,
    },

    #[error("incompatible contract claim refused for operation '{operation_id}': declared request '{declared_request:?}', expected '{expected_request:?}' / declared outcome '{declared_outcome:?}', expected '{expected_outcome:?}'")]
    IncompatibleContract {
        operation_id: OperationId,
        declared_request: Box<ContractRef>,
        expected_request: Box<ContractRef>,
        declared_outcome: Box<ContractRef>,
        expected_outcome: Box<ContractRef>,
    },

    #[error("replacement of built-in provider refused: provider '{provider_id}' ({reason})")]
    BuiltinReplacementRefused { provider_id: String, reason: String },

    #[error("manifest error: {0}")]
    Manifest(#[from] ManifestError),
}

/// An entry in the external process provider registry.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExternalProviderEntry {
    pub provider_id: String,
    pub operation_id: OperationId,
    pub version: String,
    pub runtime_kind: String,
    pub runtime_command: PathBuf,
    pub runtime_args: Vec<String>,
    pub runtime_env: HashMap<String, String>,
    pub request_contract: ContractRef,
    pub outcome_contract: ContractRef,
    pub protocol: String,
    pub capabilities: Vec<String>,
    pub manifest_digest: Option<String>,
    pub manifest_path: Option<PathBuf>,
}

impl ExternalProviderEntry {
    /// Converts this entry into a static [`ProviderDescriptor`].
    pub fn to_provider_descriptor(&self) -> ProviderDescriptor {
        let leaked_caps: &'static [&'static str] = {
            let caps: Vec<&'static str> = self
                .capabilities
                .iter()
                .map(|c| {
                    let b: &'static str = Box::leak(c.clone().into_boxed_str());
                    b
                })
                .collect();
            Box::leak(caps.into_boxed_slice())
        };

        ProviderDescriptor {
            provider_id: Cow::Owned(self.provider_id.clone()),
            operation_id: self.operation_id.clone(),
            component_class: Cow::Borrowed("user-plugin"),
            mechanism: Cow::Borrowed("process"),
            lifecycle: ProviderLifecycle::PerInvocation,
            request_contract: self.request_contract.clone(),
            outcome_contract: self.outcome_contract.clone(),
            allowed_hosts: &["cli", "remote", "test"],
            allowed_modes: &["sync", "test"],
            capabilities: leaked_caps,
            replacement: None,
            concurrency: None,
            health: None,
        }
    }
}

/// In-memory derived registry holding linked external process providers.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExternalProcessRegistry {
    entries: Vec<ExternalProviderEntry>,
    by_operation: HashMap<OperationId, usize>,
    fingerprint: String,
}

impl ExternalProcessRegistry {
    /// Returns a slice of all registered provider entries, sorted deterministically.
    pub fn providers(&self) -> &[ExternalProviderEntry] {
        &self.entries
    }

    /// Looks up a provider entry by its operation id.
    pub fn get_provider(&self, operation: &OperationId) -> Option<&ExternalProviderEntry> {
        self.by_operation
            .get(operation)
            .map(|&idx| &self.entries[idx])
    }

    /// Checks if an operation is registered.
    pub fn contains_operation(&self, operation: &OperationId) -> bool {
        self.by_operation.contains_key(operation)
    }

    /// Returns the deterministic fingerprint of this registry snapshot.
    pub fn fingerprint(&self) -> &str {
        &self.fingerprint
    }

    /// Returns the number of registered providers.
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Returns true if no providers are registered.
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Builds an immutable [`RegistrySnapshot`] combining built-in providers with external providers.
    pub fn build_snapshot(
        &self,
        catalog: OperationCatalog,
        builtin_providers: &[ProviderDescriptor],
    ) -> RegistrySnapshot {
        let mut all_descriptors = builtin_providers.to_vec();
        for entry in &self.entries {
            all_descriptors.push(entry.to_provider_descriptor());
        }

        all_descriptors.sort_by(|a, b| {
            a.provider_id
                .cmp(&b.provider_id)
                .then_with(|| a.operation_id.cmp(&b.operation_id))
        });

        let leaked_descriptors: &'static [ProviderDescriptor] =
            Box::leak(all_descriptors.into_boxed_slice());
        let leaked_fingerprint: &'static str = Box::leak(self.fingerprint.clone().into_boxed_str());

        crate::registry::build_snapshot(catalog, leaked_descriptors, leaked_fingerprint)
    }
}

/// Expected contract pair for an operation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExpectedContracts {
    pub request_contract: ContractRef,
    pub outcome_contract: ContractRef,
}

/// Linker that turns static external manifests into an [`ExternalProcessRegistry`].
#[derive(Debug, Clone)]
pub struct ExternalProcessLinker {
    catalog: Option<OperationCatalog>,
    builtin_providers: Vec<ProviderDescriptor>,
    known_capabilities: HashSet<String>,
    reserved_namespaces: HashSet<String>,
    expected_contracts: HashMap<OperationId, ExpectedContracts>,
}

impl Default for ExternalProcessLinker {
    fn default() -> Self {
        Self::new()
    }
}

impl ExternalProcessLinker {
    /// Creates a new linker with default catalog, builtin providers, and security rules.
    pub fn new() -> Self {
        let mut known_capabilities = HashSet::new();
        for cap in DEFAULT_KNOWN_CAPABILITIES {
            known_capabilities.insert(cap.to_string());
        }

        let mut reserved_namespaces = HashSet::new();
        for ns in DEFAULT_RESERVED_NAMESPACES {
            reserved_namespaces.insert(ns.to_string());
        }

        let expected_contracts = HashMap::new();

        Self {
            catalog: Some(crate::catalog::CATALOG),
            builtin_providers: vec![crate::providers::builtin::ECHO_PROVIDER_DESCRIPTOR],
            known_capabilities,
            reserved_namespaces,
            expected_contracts,
        }
    }

    /// Sets an explicit operation catalog.
    pub fn with_catalog(mut self, catalog: OperationCatalog) -> Self {
        self.catalog = Some(catalog);
        self
    }

    /// Sets explicit built-in provider descriptors to protect against replacement.
    pub fn with_builtin_providers(mut self, providers: Vec<ProviderDescriptor>) -> Self {
        self.builtin_providers = providers;
        self
    }

    /// Configures known capabilities.
    pub fn with_known_capabilities(mut self, capabilities: HashSet<String>) -> Self {
        self.known_capabilities = capabilities;
        self
    }

    /// Configures reserved namespaces.
    pub fn with_reserved_namespaces(mut self, namespaces: HashSet<String>) -> Self {
        self.reserved_namespaces = namespaces;
        self
    }

    /// Registers expected request/outcome contracts for an operation id.
    pub fn with_expected_contract(
        mut self,
        operation_id: OperationId,
        request_contract: ContractRef,
        outcome_contract: ContractRef,
    ) -> Self {
        self.expected_contracts.insert(
            operation_id,
            ExpectedContracts {
                request_contract,
                outcome_contract,
            },
        );
        self
    }

    /// Links a collection of static manifests into an in-memory derived [`ExternalProcessRegistry`].
    ///
    /// Fails closed on:
    /// - duplicate operation claims
    /// - reserved/core namespace claims
    /// - unknown capability claims
    /// - incompatible request/outcome contract claims
    /// - replacement of built-in providers
    pub fn link(
        &self,
        manifests: &[ExternalManifest],
    ) -> Result<ExternalProcessRegistry, LinkerError> {
        let mut claimed_operations: HashMap<String, String> = HashMap::new();
        let mut entries = Vec::new();

        for manifest in manifests {
            let base_dir = manifest.manifest_path.as_deref().and_then(Path::parent);
            manifest.validate(base_dir)?;

            // Check 1: Refuse replacement of built-in providers by provider_id or replacement field
            for bp in &self.builtin_providers {
                if manifest.id == bp.provider_id.as_ref() {
                    return Err(LinkerError::BuiltinReplacementRefused {
                        provider_id: manifest.id.clone(),
                        reason: format!(
                            "manifest provider id '{}' matches built-in provider id",
                            manifest.id
                        ),
                    });
                }
            }

            if let Some(ref target) = manifest.replacement {
                for bp in &self.builtin_providers {
                    if target == bp.provider_id.as_ref() {
                        return Err(LinkerError::BuiltinReplacementRefused {
                            provider_id: manifest.id.clone(),
                            reason: format!(
                                "manifest declares replacement of built-in provider '{}'",
                                bp.provider_id
                            ),
                        });
                    }
                }
            }

            // Check 2: Unknown capability requests fail closed
            for cap in &manifest.capabilities {
                if !self.known_capabilities.contains(cap) {
                    return Err(LinkerError::UnknownCapability {
                        provider_id: manifest.id.clone(),
                        capability: cap.clone(),
                    });
                }
            }

            // Process operations
            for op in &manifest.provides.operations {
                let parsed_op_id =
                    OperationId::parse(&op.id).map_err(|e| ManifestError::InvalidOperationId {
                        raw: op.id.clone(),
                        error: e,
                    })?;

                let parsed_req_contract = parse_contract_ref(&op.request_contract)?;
                let parsed_out_contract = parse_contract_ref(&op.outcome_contract)?;

                // Check 3: Refuse replacement of built-in provider operations
                for bp in &self.builtin_providers {
                    if bp.operation_id == parsed_op_id
                        || bp
                            .operation_id
                            .as_str()
                            .eq_ignore_ascii_case(parsed_op_id.as_str())
                    {
                        return Err(LinkerError::BuiltinReplacementRefused {
                            provider_id: manifest.id.clone(),
                            reason: format!(
                                "operation '{}' is already served by built-in provider '{}'",
                                parsed_op_id, bp.provider_id
                            ),
                        });
                    }
                }

                // Check 4: Refuse reserved/core namespace claims
                let component = parsed_op_id.component().to_ascii_lowercase();
                if self.reserved_namespaces.contains(&component) {
                    return Err(LinkerError::ReservedNamespace {
                        operation_id: parsed_op_id.clone(),
                        namespace: parsed_op_id.component().to_string(),
                    });
                }

                // Check 5: Refuse duplicate operation claims (case/whitespace normalized)
                let normalized_op_str = parsed_op_id.as_str().trim().to_ascii_lowercase();
                if let Some(existing_provider) = claimed_operations.get(&normalized_op_str) {
                    return Err(LinkerError::DuplicateOperationClaim {
                        operation_id: parsed_op_id.clone(),
                        first_provider_id: existing_provider.clone(),
                        second_provider_id: manifest.id.clone(),
                    });
                }
                claimed_operations.insert(normalized_op_str, manifest.id.clone());

                // Check 6: Refuse incompatible contract claims
                // Check against explicit expected contracts map
                if let Some(expected) = self.expected_contracts.get(&parsed_op_id) {
                    if !Self::contracts_compatible(&parsed_req_contract, &expected.request_contract)
                        || !Self::contracts_compatible(
                            &parsed_out_contract,
                            &expected.outcome_contract,
                        )
                    {
                        return Err(LinkerError::IncompatibleContract {
                            operation_id: parsed_op_id.clone(),
                            declared_request: Box::new(parsed_req_contract.clone()),
                            expected_request: Box::new(expected.request_contract.clone()),
                            declared_outcome: Box::new(parsed_out_contract.clone()),
                            expected_outcome: Box::new(expected.outcome_contract.clone()),
                        });
                    }
                }


                entries.push(ExternalProviderEntry {
                    provider_id: manifest.id.clone(),
                    operation_id: parsed_op_id,
                    version: manifest.version.clone(),
                    runtime_kind: manifest.runtime.kind.clone(),
                    runtime_command: manifest.runtime.command.clone(),
                    runtime_args: manifest.runtime.args.clone(),
                    runtime_env: manifest.runtime.env.clone(),
                    request_contract: parsed_req_contract,
                    outcome_contract: parsed_out_contract,
                    protocol: op.protocol.clone(),
                    capabilities: manifest.capabilities.clone(),
                    manifest_digest: manifest.raw_digest.clone(),
                    manifest_path: manifest.manifest_path.clone(),
                });
            }
        }

        // Deterministic sorting: sort by provider_id ascending, then operation_id ascending
        entries.sort_by(|a, b| {
            a.provider_id
                .cmp(&b.provider_id)
                .then_with(|| a.operation_id.cmp(&b.operation_id))
        });

        // Compute deterministic fingerprint over sorted entries
        let mut hasher = Sha256::new();
        for entry in &entries {
            hasher.update(entry.provider_id.as_bytes());
            hasher.update(b":");
            hasher.update(entry.operation_id.as_str().as_bytes());
            hasher.update(b":");
            hasher.update(entry.version.as_bytes());
            hasher.update(b":");
            hasher.update(entry.runtime_kind.as_bytes());
            hasher.update(b":");
            hasher.update(entry.runtime_command.to_string_lossy().as_bytes());
            hasher.update(b":");
            hasher.update(entry.request_contract.id().as_bytes());
            hasher.update(b"@");
            hasher.update(entry.request_contract.version().as_bytes());
            hasher.update(b":");
            hasher.update(entry.outcome_contract.id().as_bytes());
            hasher.update(b"@");
            hasher.update(entry.outcome_contract.version().as_bytes());
            hasher.update(b":");
            hasher.update(entry.protocol.as_bytes());
            hasher.update(b":");

            let mut sorted_caps = entry.capabilities.clone();
            sorted_caps.sort();
            for cap in sorted_caps {
                hasher.update(cap.as_bytes());
                hasher.update(b",");
            }
            if let Some(ref digest) = entry.manifest_digest {
                hasher.update(digest.as_bytes());
            }
            hasher.update(b"\n");
        }
        let fingerprint = format!("{:x}", hasher.finalize());

        let mut by_operation = HashMap::new();
        for (idx, entry) in entries.iter().enumerate() {
            by_operation.insert(entry.operation_id.clone(), idx);
        }

        Ok(ExternalProcessRegistry {
            entries,
            by_operation,
            fingerprint,
        })
    }

    /// Checks whether two contract references are compatible.
    ///
    /// Requires exact contract ID and version equality, matching
    /// operation provider router's exact-match requirement.
    pub fn contracts_compatible(declared: &ContractRef, expected: &ContractRef) -> bool {
        declared.id() == expected.id() && declared.version() == expected.version()
    }
}
