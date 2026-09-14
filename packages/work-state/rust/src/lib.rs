//! `fgos-work-state` crate.
//!
//! Native read providers for work/state-owned operations.

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

pub const LEVELS: &[&str] = &["off", "light", "standard", "heavy"];
pub const DEFAULT_LEVEL: &str = "off";

/// Typed request for `work.gate-bypass.show`.
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GateBypassShowRequest {}

/// Typed outcome for `work.gate-bypass.show`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GateBypassShowOutcome {
    pub level: String,
}

/// Static provider descriptor for `work.gate-bypass.show.builtin`.
pub const WORK_GATE_BYPASS_SHOW_DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed("work.gate-bypass.show.builtin"),
    operation_id: OperationId::from_static("work.gate-bypass.show"),
    component_class: Cow::Borrowed("work"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("work.gate-bypass.show.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("work.gate-bypass.show.outcome", "1.0.0"),
    allowed_hosts: &["cli", "remote"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

fn resolve_workspace_root(start: &Path) -> PathBuf {
    let mut current = start.to_path_buf();
    loop {
        if current.join(".fgos").is_dir() {
            return current;
        }
        if !current.pop() {
            return start.to_path_buf();
        }
    }
}

fn valid_level(value: &str) -> bool {
    LEVELS.contains(&value)
}

fn read_shared_level(root: &Path) -> Option<String> {
    let config_path = root.join(".fgos").join("config.json");
    let raw = std::fs::read_to_string(config_path).ok()?;
    let parsed: serde_json::Value = serde_json::from_str(&raw).ok()?;
    let level = parsed
        .get("gateBypass")
        .and_then(|v| v.get("level"))
        .and_then(|v| v.as_str())?;
    if valid_level(level) {
        Some(level.to_string())
    } else {
        None
    }
}

fn read_legacy_level(root: &Path) -> Option<String> {
    let legacy_path = root.join(".fgos").join("gate-bypass.json");
    let raw = std::fs::read_to_string(legacy_path).ok()?;
    let parsed: serde_json::Value = serde_json::from_str(&raw).ok()?;
    let level = parsed.get("level").and_then(|v| v.as_str())?;
    if valid_level(level) {
        Some(level.to_string())
    } else {
        None
    }
}

/// Reads the configured gate-bypass level with the same fail-closed posture as
/// `src/state/gate-bypass.mjs`: shared config first, legacy standalone file
/// second, and `off` for missing, malformed, or unknown values.
pub fn read_gate_bypass_level(root: &Path) -> String {
    read_shared_level(root)
        .or_else(|| read_legacy_level(root))
        .unwrap_or_else(|| DEFAULT_LEVEL.to_string())
}

pub fn resolve_gate_bypass_show() -> GateBypassShowOutcome {
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let root = resolve_workspace_root(&cwd);
    GateBypassShowOutcome {
        level: read_gate_bypass_level(&root),
    }
}

/// Built-in provider implementing `work.gate-bypass.show`.
#[derive(Debug, Clone)]
pub struct GateBypassShowProvider {
    descriptor: ProviderDescriptor,
}

impl GateBypassShowProvider {
    pub fn new() -> Self {
        Self {
            descriptor: WORK_GATE_BYPASS_SHOW_DESCRIPTOR,
        }
    }
}

impl Default for GateBypassShowProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for GateBypassShowProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        _request: OperationRequest,
        _control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event("work.gate-bypass.show.invoked");
            Ok(ProviderOutcome::completed(
                self.descriptor.outcome_contract.clone(),
                Box::new(resolve_gate_bypass_show()),
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
            .find(|op| op.operation_id.as_str() == "work.gate-bypass.show")
            .expect("catalog must contain work.gate-bypass.show");
        assert_eq!(
            WORK_GATE_BYPASS_SHOW_DESCRIPTOR.operation_id,
            catalog_entry.operation_id
        );
        assert_eq!(
            WORK_GATE_BYPASS_SHOW_DESCRIPTOR.request_contract,
            catalog_entry.request_contract
        );
        assert_eq!(
            WORK_GATE_BYPASS_SHOW_DESCRIPTOR.outcome_contract,
            catalog_entry.outcome_contract
        );
    }

    #[test]
    fn test_gate_bypass_level_fails_closed() {
        let tmp = std::env::temp_dir().join(format!(
            "fgos-work-state-gate-bypass-{}",
            std::process::id()
        ));
        let _ = std::fs::remove_dir_all(&tmp);
        std::fs::create_dir_all(tmp.join(".fgos")).unwrap();
        assert_eq!(read_gate_bypass_level(&tmp), "off");

        std::fs::write(
            tmp.join(".fgos").join("config.json"),
            r#"{"gateBypass":{"level":"standard"}}"#,
        )
        .unwrap();
        assert_eq!(read_gate_bypass_level(&tmp), "standard");

        std::fs::write(
            tmp.join(".fgos").join("config.json"),
            r#"{"gateBypass":{"level":"bogus"}}"#,
        )
        .unwrap();
        std::fs::write(
            tmp.join(".fgos").join("gate-bypass.json"),
            r#"{"level":"light"}"#,
        )
        .unwrap();
        assert_eq!(read_gate_bypass_level(&tmp), "light");

        let _ = std::fs::remove_dir_all(&tmp);
    }

    #[tokio::test]
    async fn test_provider_invoke_completed() {
        let provider = GateBypassShowProvider::new();
        let invocation = HostInvocation::new("cli");
        let request = OperationRequest::new(
            OperationId::from_static("work.gate-bypass.show"),
            ContractRef::from_static("work.gate-bypass.show.request", "1.0.0"),
            Box::new(GateBypassShowRequest::default()),
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
                assert_eq!(contract.id(), "work.gate-bypass.show.outcome");
                assert_eq!(contract.version(), "1.0.0");
                let info = output
                    .downcast_ref::<GateBypassShowOutcome>()
                    .expect("output must be GateBypassShowOutcome");
                assert!(valid_level(&info.level));
            }
            _ => panic!("expected completed outcome"),
        }
    }
}
