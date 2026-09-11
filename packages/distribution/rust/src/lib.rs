//! `fgos-distribution` crate.
//!
//! Distribution provider and manifest utilities.

pub mod canonical;
pub mod extract;
pub mod init;
pub mod lock;
pub mod manifest;
pub mod store;
pub mod verify;
pub mod workspace;

pub use canonical::*;
pub use extract::*;
pub use init::*;
pub use lock::*;
pub use manifest::*;
pub use store::*;
pub use verify::*;
pub use workspace::*;

use fgos_host_runtime::contracts::{
    ContractRef, HostInvocation, OperationId, OperationRequest, ProviderDescriptor, ProviderError,
    ProviderLifecycle, ProviderOutcome,
};
use fgos_host_runtime::invocation_service::{EventSink, InvocationControl, OperationProvider};
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;

/// Embedded root package.json for resolving package version without drift.
const PACKAGE_JSON_STR: &str = include_str!("../../../../package.json");

/// Embedded command routes descriptor from packages/host-runtime/contracts/command-routes.json.
const COMMAND_ROUTES_JSON: &str =
    include_str!("../../../../packages/host-runtime/contracts/command-routes.json");

/// Typed request for `distribution.build.show`.
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BuildShowRequest {
    #[serde(default)]
    pub include_runtime: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct StateSchemasInfoRuntime {
    #[serde(default)]
    pub read: Vec<String>,
    #[serde(default)]
    pub write: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LegacyNodeComponentRuntime {
    pub root: String,
    pub entry: String,
    pub digest: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ComponentsInfoRuntime {
    pub legacy_node: LegacyNodeComponentRuntime,
}

/// Section-14 identity fields reported when `include_runtime` is true (R10).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeIdentityInfo {
    pub project_root: Option<String>,
    pub workspace_id: Option<String>,
    pub work_history_root: Option<String>,
    pub work_state_id: Option<String>,
    pub machine_release_store: Option<String>,
    pub artifact_digest: Option<String>,
    pub release_version: Option<String>,
    pub schema_version: Option<u32>,
    pub state_schemas: Option<StateSchemasInfoRuntime>,
    pub components: Option<ComponentsInfoRuntime>,
    pub host: String,
}

impl RuntimeIdentityInfo {
    pub fn dev_source() -> Self {
        Self {
            project_root: None,
            workspace_id: None,
            work_history_root: None,
            work_state_id: None,
            machine_release_store: None,
            artifact_digest: None,
            release_version: None,
            schema_version: None,
            state_schemas: None,
            components: None,
            host: "dev-source".to_string(),
        }
    }
}

/// Typed outcome for `distribution.build.show`.
///
/// Matches `src/cli/version.mjs`'s `resolveCliVersionInfo()` shape field-for-field.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BuildShowOutcome {
    pub package_version: String,
    pub git_commit: Option<String>,
    pub verbs: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub runtime: Option<RuntimeIdentityInfo>,
}

/// Static provider descriptor for `distribution.build.show.builtin`.
pub const DISTRIBUTION_BUILD_SHOW_DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed("distribution.build.show.builtin"),
    operation_id: OperationId::from_static("distribution.build.show"),
    component_class: Cow::Borrowed("distribution"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("distribution.build.show.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("distribution.build.show.outcome", "1.0.0"),
    allowed_hosts: &["cli", "remote"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

/// Resolves the product version from the embedded root `package.json`.
pub fn resolve_package_version() -> String {
    let parsed: serde_json::Value =
        serde_json::from_str(PACKAGE_JSON_STR).expect("root package.json must be valid JSON");
    parsed["version"]
        .as_str()
        .expect("package.json must contain a string version field")
        .to_string()
}

/// Resolves the product root directory if determinable.
pub fn resolve_product_root() -> Option<PathBuf> {
    if let Ok(path_str) = std::env::var("FGOS_ACTIVE_RELEASE_PATH") {
        let p = PathBuf::from(path_str);
        if p.exists() {
            return Some(p);
        }
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Ok(real_exe) = std::fs::canonicalize(&exe) {
            let candidate = real_exe
                .parent()
                .and_then(|p| p.parent())
                .and_then(|p| p.parent());
            if let Some(root) = candidate {
                if root.join("package.json").exists() {
                    return Some(root.to_path_buf());
                }
            }
        }
    }
    if Path::new("package.json").exists() {
        if let Ok(cwd) = std::env::current_dir() {
            return Some(cwd);
        }
    }
    None
}

/// Resolves the short git commit hash from git rev-parse --short HEAD.
///
/// Returns None on any failure (not a git checkout, git binary missing, command failed).
pub fn resolve_git_commit() -> Option<String> {
    let mut cmd = std::process::Command::new("git");
    cmd.args(["rev-parse", "--short", "HEAD"]);
    if let Some(root) = resolve_product_root() {
        cmd.current_dir(root);
    }
    match cmd.output() {
        Ok(output) if output.status.success() => {
            let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if s.is_empty() {
                None
            } else {
                Some(s)
            }
        }
        _ => None,
    }
}

/// Resolves the sorted list of command verb selectors from embedded command-routes.json.
pub fn resolve_verbs() -> Vec<String> {
    let routes: std::collections::HashMap<String, serde_json::Value> =
        serde_json::from_str(COMMAND_ROUTES_JSON)
            .expect("embedded command-routes.json must be valid JSON");
    let mut verbs: Vec<String> = routes.into_keys().collect();
    verbs.sort();
    verbs
}

/// Resolves the full build show info matching `resolveCliVersionInfo()` in `src/cli/version.mjs`.
pub fn resolve_cli_version_info() -> BuildShowOutcome {
    BuildShowOutcome {
        package_version: resolve_package_version(),
        git_commit: resolve_git_commit(),
        verbs: resolve_verbs(),
        runtime: None,
    }
}

/// Resolves the runtime identity info from .fgos/installation/activation.json (R10).
pub fn resolve_runtime_identity_info() -> RuntimeIdentityInfo {
    let cwd = match std::env::current_dir() {
        Ok(d) => d,
        Err(_) => return RuntimeIdentityInfo::dev_source(),
    };

    let workspace_root = match crate::workspace::resolve_workspace_root(&cwd) {
        Ok(r) => r,
        Err(_) => return RuntimeIdentityInfo::dev_source(),
    };

    let installation_dir = workspace_root.join(".fgos").join("installation");
    let activation_path = installation_dir.join("activation.json");
    if !activation_path.exists() {
        return RuntimeIdentityInfo::dev_source();
    }

    let activation_str = match std::fs::read_to_string(&activation_path) {
        Ok(s) => s,
        Err(_) => return RuntimeIdentityInfo::dev_source(),
    };

    let activation: serde_json::Value = match serde_json::from_str(&activation_str) {
        Ok(v) => v,
        Err(_) => return RuntimeIdentityInfo::dev_source(),
    };

    let root_json_path = installation_dir.join("root.json");
    let root_json: Option<serde_json::Value> = std::fs::read_to_string(&root_json_path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok());

    let workspace_id = activation["workspaceId"].as_str().map(|s| s.to_string());
    let work_state_id = activation["workStateId"]
        .as_str()
        .map(|s| s.to_string())
        .or_else(|| workspace_id.clone());

    let work_history_root = work_state_id.as_ref().map(|ws_id| {
        format!(
            "{}/.fgos/local/work-state/{}",
            workspace_root.display(),
            ws_id
        )
    });

    let machine_release_store = root_json
        .as_ref()
        .and_then(|r| r["machineReleaseStore"].as_str().map(|s| s.to_string()));

    let artifact_digest = activation["artifactDigest"].as_str().map(|s| s.to_string());
    let release_path_str = activation["releasePath"].as_str();

    let manifest = release_path_str.and_then(|rp| {
        let p = Path::new(rp);
        crate::manifest::read_manifest_from_dir(p).ok()
    });

    let release_version = manifest.as_ref().and_then(|m| m.release_version.clone());
    let schema_version = manifest.as_ref().map(|m| m.schema_version);
    let state_schemas = manifest.as_ref().and_then(|m| {
        m.state_schemas.as_ref().map(|s| StateSchemasInfoRuntime {
            read: s.read.clone(),
            write: s.write.clone(),
        })
    });
    let components = manifest.as_ref().map(|m| ComponentsInfoRuntime {
        legacy_node: LegacyNodeComponentRuntime {
            root: m.components.legacy_node.root.clone(),
            entry: m.components.legacy_node.entry.clone(),
            digest: m.components.legacy_node.digest.clone(),
        },
    });

    RuntimeIdentityInfo {
        project_root: Some(workspace_root.to_string_lossy().to_string()),
        workspace_id,
        work_history_root,
        work_state_id,
        machine_release_store,
        artifact_digest,
        release_version,
        schema_version,
        state_schemas,
        components,
        host: "rust".to_string(),
    }
}

/// Built-in provider implementing `distribution.build.show`.
#[derive(Debug, Clone)]
pub struct BuildShowProvider {
    descriptor: ProviderDescriptor,
}

impl BuildShowProvider {
    pub fn new() -> Self {
        Self {
            descriptor: DISTRIBUTION_BUILD_SHOW_DESCRIPTOR,
        }
    }

    pub fn with_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
    }
}

impl Default for BuildShowProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for BuildShowProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        request: OperationRequest,
        _control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event("distribution.build.show.invoked");
            let include_runtime = request
                .input
                .downcast_ref::<BuildShowRequest>()
                .map(|r| r.include_runtime)
                .unwrap_or(false);

            let mut outcome = resolve_cli_version_info();
            if include_runtime {
                outcome.runtime = Some(resolve_runtime_identity_info());
            }
            Ok(ProviderOutcome::completed(
                self.descriptor.outcome_contract.clone(),
                Box::new(outcome),
            ))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use fgos_host_runtime::invocation_service::NoopEventSink;
    use fgos_host_runtime::CATALOG;

    #[test]
    fn test_descriptor_matches_catalog() {
        let catalog_entry = CATALOG
            .iter()
            .find(|op| op.operation_id.as_str() == "distribution.build.show")
            .expect("catalog must contain distribution.build.show");
        assert_eq!(
            DISTRIBUTION_BUILD_SHOW_DESCRIPTOR.operation_id,
            catalog_entry.operation_id
        );
        assert_eq!(
            DISTRIBUTION_BUILD_SHOW_DESCRIPTOR.request_contract,
            catalog_entry.request_contract
        );
        assert_eq!(
            DISTRIBUTION_BUILD_SHOW_DESCRIPTOR.outcome_contract,
            catalog_entry.outcome_contract
        );
    }

    #[test]
    fn test_package_version_resolved() {
        let ver = resolve_package_version();
        assert_eq!(ver, "0.1.0");
    }

    #[test]
    fn test_verbs_sorted_and_match_73() {
        let verbs = resolve_verbs();
        assert_eq!(verbs.len(), 73);
        let mut sorted = verbs.clone();
        sorted.sort();
        assert_eq!(verbs, sorted);
        assert!(verbs.contains(&"version".to_string()));
    }

    #[test]
    fn test_git_commit_no_panic() {
        let _commit = resolve_git_commit();
    }

    #[tokio::test]
    async fn test_provider_invoke_completed() {
        let provider = BuildShowProvider::new();
        let invocation = HostInvocation::new("cli");
        let request = OperationRequest::new(
            OperationId::from_static("distribution.build.show"),
            ContractRef::from_static("distribution.build.show.request", "1.0.0"),
            Box::new(BuildShowRequest::default()),
        );
        let control = InvocationControl::new(None, None, Vec::new());
        let outcome = provider
            .invoke(&invocation, request, control, &NoopEventSink)
            .await
            .expect("provider invoke must succeed");

        match outcome {
            ProviderOutcome::Completed {
                contract, output, ..
            } => {
                assert_eq!(contract.id(), "distribution.build.show.outcome");
                assert_eq!(contract.version(), "1.0.0");
                let info = output
                    .downcast_ref::<BuildShowOutcome>()
                    .expect("output must be BuildShowOutcome");
                assert_eq!(info.package_version, "0.1.0");
                assert_eq!(info.verbs.len(), 73);
            }
            _ => panic!("expected completed outcome"),
        }
    }

    #[test]
    fn test_vector_parity_version() {
        let vector_str = include_str!("../../../../test/rust-host/vectors/envelope/version.json");
        let vector: serde_json::Value =
            serde_json::from_str(vector_str).expect("version vector must parse");
        let vector_data = &vector["data"];
        let expected_version = vector_data["packageVersion"].as_str().unwrap();
        let expected_verbs: Vec<String> = vector_data["verbs"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_str().unwrap().to_string())
            .collect();

        assert_eq!(resolve_package_version(), expected_version);
        assert_eq!(resolve_verbs(), expected_verbs);

        let outcome = BuildShowOutcome {
            package_version: expected_version.to_string(),
            git_commit: Some(vector_data["gitCommit"].as_str().unwrap().to_string()),
            verbs: expected_verbs,
            runtime: None,
        };
        let compact = serde_json::to_string(&outcome).unwrap();
        assert_eq!(compact, vector["compact_hash_input"].as_str().unwrap());
    }
}
