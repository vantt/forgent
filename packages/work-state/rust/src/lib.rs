//! `fgos-work-state` crate.
//!
//! Native read providers for work/state-owned operations.

pub mod legacy_friction;
pub mod work_source;
pub use work_source::{
    LearningChannelData, MissingOutcomeNagData, OutcomeEntry, SettlementChannelData,
    WorkEntropySignals, WorkOutcomesReport, WorkSource, DOMAIN_ENTRY_STAGES_JSON, FINAL_STATUSES,
};

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

/// The level the effective config holds, with whether any file (not the bundled standard) set it.
/// A refusal or an environment without `HOME` is `None`: the caller answers `off`.
fn read_shared_level(
    root: &Path,
    lookup: impl Fn(&str) -> Option<String>,
) -> Option<(String, bool)> {
    use fgos_config::Segment::Key;
    let snapshot = fgos_config::machine::project_snapshot(root, lookup).ok()?;
    let level = snapshot.value["gateBypass"]["level"].as_str()?.to_string();
    let path = [Key("gateBypass".into()), Key("level".into())];
    let from_file = snapshot
        .origins
        .iter()
        .any(|o| o.path == path && o.provenance.layer != "standard");
    Some((level, from_file))
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
/// `src/state/gate-bypass.mjs`: the effective config first (project, then the machine's global
/// file); when only the bundled standard supplies the level, the legacy standalone file; `off`
/// for a refused config or an unknown value.
pub fn read_gate_bypass_level(root: &Path) -> String {
    gate_bypass_level(root, |name| std::env::var(name).ok())
}

fn gate_bypass_level(root: &Path, lookup: impl Fn(&str) -> Option<String>) -> String {
    match read_shared_level(root, lookup) {
        Some((level, true)) => level,
        Some((level, false)) => read_legacy_level(root).unwrap_or(level),
        None => DEFAULT_LEVEL.to_string(),
    }
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

    /// A project at `<dir>/project` and an empty home at `<dir>/home`; `files` are written under `project/.fgos`.
    fn level(tag: &str, files: &[(&str, &str)], home: bool) -> String {
        let dir = std::env::temp_dir().join(format!(
            "fgos-work-state-gate-bypass-{tag}-{}",
            std::process::id()
        ));
        let _ = std::fs::remove_dir_all(&dir);
        let root = dir.join("project");
        std::fs::create_dir_all(root.join(".fgos")).unwrap();
        std::fs::create_dir_all(dir.join("home")).unwrap();
        for (name, text) in files {
            std::fs::write(root.join(".fgos").join(name), text).unwrap();
        }
        let home_dir = dir.join("home").to_string_lossy().into_owned();
        let got = gate_bypass_level(&root, |k| (home && k == "HOME").then(|| home_dir.clone()));
        let _ = std::fs::remove_dir_all(&dir);
        got
    }

    #[test]
    fn test_gate_bypass_level_fails_closed() {
        assert_eq!(level("none", &[], true), "off");
        assert_eq!(
            level(
                "set",
                &[("config.yaml", "gateBypass:\n  level: standard\n")],
                true
            ),
            "standard"
        );
        // A refused config is `off`, and the legacy file does not override the refusal.
        let legacy = ("gate-bypass.json", r#"{"level":"light"}"#);
        assert_eq!(
            level(
                "bogus",
                &[("config.yaml", "gateBypass:\n  level: bogus\n"), legacy],
                true
            ),
            "off"
        );
        assert_eq!(
            level(
                "broken",
                &[("config.yaml", "gateBypass: [unclosed\n"), legacy],
                true
            ),
            "off"
        );
        assert_eq!(
            level(
                "nohome",
                &[("config.yaml", "gateBypass:\n  level: heavy\n")],
                false
            ),
            "off"
        );
    }

    #[test]
    fn test_gate_bypass_level_falls_back_to_the_legacy_file_only_when_no_config_sets_it() {
        let legacy = ("gate-bypass.json", r#"{"level":"light"}"#);
        assert_eq!(level("legacy", &[legacy], true), "light");
        let set = ("config.yaml", "gateBypass:\n  level: heavy\n");
        assert_eq!(level("config-wins", &[set, legacy], true), "heavy");
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
