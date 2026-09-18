//! Integration tests for R2-P5: Router Integration.
//!
//! Proves:
//! (a) ExternalProcessLinker accepts frozen fixture manifest and derives an entry for fixture.echo.echo.
//! (b) RegistrySnapshot built via build_snapshot using test catalog plus the linker-derived descriptor
//!     links without duplicate-binding panic.
//! (c) InvocationService built from snapshot with adapter registered via register_provider
//!     invokes fixture.echo.echo end-to-end through the unmodified admission gate; selected provider
//!     is fixture.echo.process, round-trips request id and negotiated protocol version (fgos.component.v1).
//! (d) test.fixture.echo resolves only to built-in EchoProvider.
//! (e) External provider claims to reserved namespaces (distribution.build.show, work.gate-bypass.show)
//!     are refused by ExternalProcessLinker with LinkerError::ReservedNamespace.

use fgos_host_runtime::catalog::CATALOG;
use fgos_host_runtime::contracts::{
    ContractRef, HostInvocation, OperationCatalog, OperationDescriptor, OperationEffect,
    OperationId, OperationIdempotency, OperationRequest, ProviderDescriptor, ProviderOutcome,
    RegistrySnapshot, StreamingMode,
};
use fgos_host_runtime::invocation_service::{
    InMemoryEventSink, InvocationService, InvocationTerminalState,
};
use fgos_host_runtime::operation_provider_router::{select, RouterPolicy, SelectionInput};
use fgos_host_runtime::providers::builtin::{EchoAction, EchoProvider, ECHO_PROVIDER_DESCRIPTOR};
use fgos_host_runtime::providers::external_process::{
    ExternalManifest, ExternalProcessConfig, ExternalProcessLinker, ExternalProcessProviderAdapter,
    LinkerError, COMPONENT_PROTOCOL_VERSION, FIXTURE_OPERATION_ID, FIXTURE_PROVIDER_ID,
};
use fgos_host_runtime::registry::build_snapshot;
use std::borrow::Cow;
use std::path::PathBuf;
use std::sync::Arc;

fn fixture_bin() -> PathBuf {
    if let Ok(path) = std::env::var("CARGO_BIN_EXE_fixture-echo-process") {
        let p = PathBuf::from(path);
        if p.exists() {
            return p;
        }
    }
    if let Ok(current) = std::env::current_exe() {
        if let Some(dir) = current.parent() {
            let candidate = dir.join("fixture-echo-process");
            if candidate.exists() {
                return candidate;
            }
            if let Some(grandparent) = dir.parent() {
                let candidate = grandparent.join("fixture-echo-process");
                if candidate.exists() {
                    return candidate;
                }
            }
        }
    }
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let target_debug = root.join("../../target/debug/fixture-echo-process");
    if target_debug.exists() {
        return target_debug;
    }
    panic!("could not locate fixture-echo-process binary");
}

fn fixture_manifest_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join("external-provider")
        .join("manifest.yaml")
}

fn test_catalog() -> OperationCatalog {
    static CATALOG_CELL: std::sync::OnceLock<&'static [OperationDescriptor]> =
        std::sync::OnceLock::new();
    CATALOG_CELL.get_or_init(|| {
        let mut entries = CATALOG.to_vec();
        entries.push(OperationDescriptor {
            operation_id: OperationId::from_static(FIXTURE_OPERATION_ID),
            owning_component_id: Cow::Borrowed("test"),
            request_contract: ContractRef::from_static("fixture.echo.echo.request", "1.0.0"),
            outcome_contract: ContractRef::from_static("fixture.echo.echo.outcome", "1.0.0"),
            effect: OperationEffect::Read,
            idempotency: OperationIdempotency::Safe,
            authority_policy_id: Cow::Borrowed("test.read"),
            allowed_host_kinds: &["cli", "remote", "test"],
            streaming_mode: StreamingMode::None,
        });
        Box::leak(entries.into_boxed_slice())
    })
}

fn derive_fixture_descriptor() -> ProviderDescriptor {
    let linker = ExternalProcessLinker::new();
    let manifest = ExternalManifest::load_from_file(fixture_manifest_path())
        .expect("frozen fixture manifest.yaml must load and validate");
    let registry = linker
        .link(&[manifest])
        .expect("linker must link frozen fixture manifest");
    registry
        .get_provider(&OperationId::from_static(FIXTURE_OPERATION_ID))
        .expect("fixture provider entry must be derived by linker")
        .to_provider_descriptor()
}

fn build_test_snapshot() -> (RegistrySnapshot, ProviderDescriptor) {
    let derived_desc = derive_fixture_descriptor();
    let combined_providers: &'static [ProviderDescriptor] =
        Box::leak(vec![ECHO_PROVIDER_DESCRIPTOR, derived_desc.clone()].into_boxed_slice());
    let snapshot = build_snapshot(test_catalog(), combined_providers, "test-snapshot-r2-p5");
    (snapshot, derived_desc)
}

// -----------------------------------------------------------------------------
// Positive Linker Test: accepts and derives entry for fixture.echo.echo
// -----------------------------------------------------------------------------

#[test]
fn test_linker_accepts_and_derives_fixture_echo_entry() {
    let linker = ExternalProcessLinker::new();
    let manifest = ExternalManifest::load_from_file(fixture_manifest_path())
        .expect("frozen fixture manifest.yaml must load and validate");
    let registry = linker
        .link(&[manifest])
        .expect("linker must link frozen fixture manifest");

    let op_id = OperationId::from_static(FIXTURE_OPERATION_ID);
    let entry = registry
        .get_provider(&op_id)
        .expect("registry must contain derived entry for fixture.echo.echo");

    assert_eq!(entry.provider_id, FIXTURE_PROVIDER_ID);
    assert_eq!(entry.operation_id, op_id);
    assert_eq!(entry.request_contract.id(), "fixture.echo.echo.request");
    assert_eq!(entry.request_contract.version(), "1.0.0");
    assert_eq!(entry.outcome_contract.id(), "fixture.echo.echo.outcome");
    assert_eq!(entry.outcome_contract.version(), "1.0.0");
    assert_eq!(entry.protocol, "fgos.component.v1");

    let derived_desc = entry.to_provider_descriptor();
    assert_eq!(derived_desc.provider_id.as_ref(), FIXTURE_PROVIDER_ID);
    assert_eq!(derived_desc.operation_id, op_id);
    assert!(derived_desc.allowed_hosts.contains(&"test"));
    assert!(derived_desc.allowed_modes.contains(&"test"));
}

// -----------------------------------------------------------------------------
// Test (a): RegistrySnapshot linking with test catalog and derived descriptor
// -----------------------------------------------------------------------------

#[test]
fn test_registry_snapshot_links_catalog_and_derived_adapter_without_panic() {
    let (snapshot, derived_desc) = build_test_snapshot();

    assert_eq!(snapshot.fingerprint(), "test-snapshot-r2-p5");
    assert_eq!(snapshot.catalog().len(), CATALOG.len() + 1);
    assert_eq!(snapshot.providers().len(), 2);

    let fixture_desc = snapshot
        .providers()
        .iter()
        .find(|p| p.provider_id == FIXTURE_PROVIDER_ID)
        .expect("fixture.echo.process descriptor must be present in snapshot");

    assert_eq!(fixture_desc.operation_id.as_str(), FIXTURE_OPERATION_ID);
    assert_eq!(fixture_desc.provider_id, derived_desc.provider_id);
    assert_eq!(fixture_desc.mechanism, "process");
    assert!(fixture_desc.allowed_hosts.contains(&"test"));
    assert!(fixture_desc.allowed_modes.contains(&"test"));
}

// -----------------------------------------------------------------------------
// Test (b): End-to-end invocation through InvocationService
// -----------------------------------------------------------------------------

#[tokio::test]
async fn test_invocation_service_invokes_fixture_echo_end_to_end() {
    let (snapshot, derived_desc) = build_test_snapshot();
    let service = InvocationService::new(snapshot);

    // Register both built-in EchoProvider and ExternalProcessProviderAdapter
    service.register_provider(Arc::new(EchoProvider::new()));
    let bin = fixture_bin();
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, bin);
    let adapter = ExternalProcessProviderAdapter::with_descriptor(derived_desc, config);
    service.register_provider(Arc::new(adapter));

    let mut invocation = HostInvocation::new("test");
    invocation.invocation_id = Some("req-roundtrip-001".to_string());

    let payload = serde_json::json!({
        "message": "hello router integration",
        "timestamp": 123456789,
        "items": ["alpha", "beta", "gamma"]
    });

    let request = OperationRequest::new(
        OperationId::from_static(FIXTURE_OPERATION_ID),
        ContractRef::from_static("fixture.echo.echo.request", "1.0.0"),
        Box::new(payload.clone()),
    );

    let sink = InMemoryEventSink::new();
    let (outcome_res, record) = service.invoke_with_record(invocation, request, &sink).await;

    // 1. Verify provider routing and lifecycle record
    assert_eq!(
        record.provider_id.as_deref(),
        Some(FIXTURE_PROVIDER_ID),
        "selected provider must be fixture.echo.process"
    );
    assert_eq!(record.operation_id.as_str(), FIXTURE_OPERATION_ID);
    assert_eq!(record.terminal_state, InvocationTerminalState::Succeeded);
    assert!(record.dispatched, "invocation must have been dispatched");

    // 2. Verify outcome contract
    let outcome = outcome_res.expect("invocation must succeed");
    assert_eq!(outcome.contract().id(), "fixture.echo.echo.outcome");
    assert_eq!(outcome.contract().version(), "1.0.0");

    // 3. Verify negotiated protocol version (fgos.component.v1) round-trip
    assert!(
        outcome
            .diagnostics()
            .iter()
            .any(|d| d == &format!("protocol_version:{COMPONENT_PROTOCOL_VERSION}")),
        "diagnostics must contain negotiated protocol version '{COMPONENT_PROTOCOL_VERSION}', got {:?}",
        outcome.diagnostics()
    );

    // 4. Verify request id round-trip
    assert!(
        outcome
            .diagnostics()
            .iter()
            .any(|d| d == "request_id:req-roundtrip-001"),
        "diagnostics must contain round-tripped request id 'req-roundtrip-001', got {:?}",
        outcome.diagnostics()
    );

    // 5. Verify payload content and attributes in echoed outcome
    let ProviderOutcome::Completed { output, .. } = outcome else {
        panic!("expected completed outcome");
    };
    let echo_output = output
        .downcast_ref::<serde_json::Value>()
        .expect("output must downcast to serde_json::Value");
    assert_eq!(echo_output["message"], "hello router integration");
    assert_eq!(echo_output["timestamp"], 123456789);
    assert_eq!(echo_output["items"][0], "alpha");
    assert_eq!(echo_output["protocol_version"], COMPONENT_PROTOCOL_VERSION);
    assert_eq!(echo_output["request_id"], "req-roundtrip-001");
}

// -----------------------------------------------------------------------------
// Test (c): test.fixture.echo resolves only to built-in EchoProvider
// -----------------------------------------------------------------------------

#[tokio::test]
async fn test_fixture_echo_resolves_only_to_builtin_provider() {
    let (snapshot, derived_desc) = build_test_snapshot();

    // Check 1: Router select directly selects test.fixture.echo.builtin
    let selection = select(
        SelectionInput {
            operation: OperationId::from_static("test.fixture.echo"),
            request_contract_version: "1.0.0",
            outcome_contract_version: "1.0.0",
            host_kind: "test",
            invocation_mode: "sync",
            policy: RouterPolicy,
        },
        &snapshot,
    )
    .expect("router select for test.fixture.echo must succeed");

    assert_eq!(
        selection.provider_id, "test.fixture.echo.builtin",
        "router must select built-in echo provider"
    );
    assert_ne!(
        selection.provider_id, FIXTURE_PROVIDER_ID,
        "router must NOT select external process fixture for test.fixture.echo"
    );

    // Check 2: Full invocation pipeline executes through EchoProvider
    let service = InvocationService::new(snapshot);
    service.register_provider(Arc::new(EchoProvider::new()));
    let bin = fixture_bin();
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, bin);
    service.register_provider(Arc::new(ExternalProcessProviderAdapter::with_descriptor(
        derived_desc,
        config,
    )));

    let invocation = HostInvocation::new("test");
    let request = OperationRequest::new(
        OperationId::from_static("test.fixture.echo"),
        ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
        Box::new(EchoAction::Echo("hello builtin test".to_string())),
    );

    let sink = InMemoryEventSink::new();
    let (outcome_res, record) = service.invoke_with_record(invocation, request, &sink).await;

    assert_eq!(
        record.provider_id.as_deref(),
        Some("test.fixture.echo.builtin"),
        "pipeline record must reflect built-in provider"
    );
    assert_ne!(
        record.provider_id.as_deref(),
        Some(FIXTURE_PROVIDER_ID),
        "pipeline record must NOT reflect external process fixture"
    );

    let outcome = outcome_res.expect("built-in echo must succeed");
    let ProviderOutcome::Completed { output, .. } = outcome else {
        panic!("expected completed outcome");
    };
    let echoed_msg = output
        .downcast_ref::<String>()
        .expect("built-in echo returns String");
    assert_eq!(echoed_msg, "hello builtin test");
}

// -----------------------------------------------------------------------------
// Test (d): Refusal of claims to reserved namespaces (distribution, work)
// -----------------------------------------------------------------------------

#[test]
fn test_claims_to_reserved_namespaces_are_refused() {
    // Attempting to claim reserved namespaces (distribution.build.show or
    // work.gate-bypass.show) via external provider manifest is refused
    // by the linker with LinkerError::ReservedNamespace.

    // 1. Linker refuses reserved namespace "distribution"
    let linker = ExternalProcessLinker::new();
    let manifest_dist_yaml = r#"
manifestVersion: "1.0.0"
id: "untrusted.distribution.provider"
version: "1.0.0"
runtime:
  kind: "process"
  command: "./echo-runner.sh"
provides:
  operations:
    - id: "distribution.build.show"
      request_contract: "distribution.build.show.request@1.0.0"
      outcome_contract: "distribution.build.show.outcome@1.0.0"
      protocol: "fgos.component.v1"
capabilities: []
"#;
    let manifest_dist =
        ExternalManifest::from_yaml_str(manifest_dist_yaml, None).expect("valid manifest yaml");
    let err_dist = linker.link(&[manifest_dist]).unwrap_err();
    assert!(
        matches!(err_dist, LinkerError::ReservedNamespace { ref namespace, .. } if namespace == "distribution"),
        "linker must refuse distribution namespace: got {err_dist:?}"
    );

    // 2. Linker refuses reserved namespace "work"
    let manifest_work_yaml = r#"
manifestVersion: "1.0.0"
id: "untrusted.work.provider"
version: "1.0.0"
runtime:
  kind: "process"
  command: "./echo-runner.sh"
provides:
  operations:
    - id: "work.gate-bypass.show"
      request_contract: "work.gate-bypass.show.request@1.0.0"
      outcome_contract: "work.gate-bypass.show.outcome@1.0.0"
      protocol: "fgos.component.v1"
capabilities: []
"#;
    let manifest_work =
        ExternalManifest::from_yaml_str(manifest_work_yaml, None).expect("valid manifest yaml");
    let err_work = linker.link(&[manifest_work]).unwrap_err();
    assert!(
        matches!(err_work, LinkerError::ReservedNamespace { ref namespace, .. } if namespace == "work"),
        "linker must refuse work namespace: got {err_work:?}"
    );
}
