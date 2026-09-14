//! Schema and golden tests for frozen packaging-distribution records.
//!
//! Validates V1 frozen schema compatibility, golden fixtures, and forward/backward-compatible reading for:
//! - ReleaseManifest (`contracts/release-manifest.md`)
//! - WorkspaceActivationBinding / ActivationBinding (`contracts/activation-binding.md`)
//! - TrackedDistributionPin / DistributionPin (`contracts/distribution-pin.md`)
//! - WorkspaceRootBinding / TopologyRootBinding (`contracts/repository-runtime-layout.md`)
//! - InstallTransactionRecord
//! - FgctlWorkspaceStatus / ReleaseStatusEntry

use fgos_distribution::init::{
    ActivationBinding, DistributionPin, FgctlWorkspaceStatus, InstallTransactionRecord,
    TopologyRootBinding, TrackedDistributionPin, WorkspaceActivationBinding, WorkspaceRootBinding,
    ACTIVATION_BINDING_SCHEMA_VERSION_V1, DISTRIBUTION_PIN_SCHEMA_VERSION_V1,
    INSTALL_TRANSACTION_SCHEMA_VERSION_V1, WORKSPACE_ROOT_BINDING_SCHEMA_VERSION_V1,
};
use fgos_distribution::manifest::{
    read_manifest_from_path, ReleaseManifest, RELEASE_MANIFEST_SCHEMA_VERSION_V1,
};
use fgos_distribution::store::ReleaseStatusEntry;

const GOLDEN_RELEASE_MANIFEST_FULL: &str = include_str!("goldens/release-manifest-full.json");
const GOLDEN_RELEASE_MANIFEST_MINIMAL: &str = include_str!("goldens/release-manifest-minimal.json");
const GOLDEN_ACTIVATION_BINDING_FULL: &str = include_str!("goldens/activation-binding-full.json");
const GOLDEN_ACTIVATION_BINDING_MINIMAL: &str =
    include_str!("goldens/activation-binding-minimal.json");
const GOLDEN_DISTRIBUTION_PIN_FULL: &str = include_str!("goldens/distribution-pin-full.json");
const GOLDEN_DISTRIBUTION_PIN_MINIMAL: &str = include_str!("goldens/distribution-pin-minimal.json");
const GOLDEN_WORKSPACE_ROOT_BINDING: &str = include_str!("goldens/workspace-root-binding.json");
const GOLDEN_INSTALL_TRANSACTION: &str = include_str!("goldens/install-transaction.json");

// =========================================================================
// 1. ReleaseManifest Tests
// =========================================================================

#[test]
fn test_release_manifest_full_golden_roundtrip() {
    let manifest: ReleaseManifest =
        serde_json::from_str(GOLDEN_RELEASE_MANIFEST_FULL).expect("must parse full manifest");

    assert_eq!(manifest.schema_version, RELEASE_MANIFEST_SCHEMA_VERSION_V1);
    assert_eq!(
        manifest.artifact_digest,
        "sha256:1111111111111111111111111111111111111111111111111111111111111111"
    );
    assert_eq!(manifest.digest_kind.as_deref(), Some("sha256"));
    assert_eq!(manifest.release_version.as_deref(), Some("0.1.0"));
    assert_eq!(manifest.source_revision.as_deref(), Some("abcdef123456"));
    assert_eq!(
        manifest.created_at.as_deref(),
        Some("2026-09-14T00:00:00.000Z")
    );

    assert_eq!(manifest.target.os, "linux");
    assert_eq!(manifest.target.arch, "x86_64");
    assert_eq!(manifest.target.libc.as_deref(), Some("gnu"));

    assert_eq!(manifest.entries.fgos, "bin/fgos");
    assert_eq!(
        manifest.entries.fgos_runner.as_deref(),
        Some("bin/fgos-runner")
    );

    assert_eq!(manifest.components.legacy_node.root, "libexec/legacy-node");
    assert_eq!(manifest.components.legacy_node.entry, "bin/fgos.mjs");
    assert_eq!(
        manifest.components.legacy_node.digest,
        "sha256:2222222222222222222222222222222222222222222222222222222222222222"
    );

    let runner = manifest.components.runner.as_ref().unwrap();
    assert_eq!(runner.path, "bin/fgos-runner");
    assert_eq!(
        runner.digest,
        "sha256:3333333333333333333333333333333333333333333333333333333333333333"
    );

    let workshop = manifest.components.workshop.as_ref().unwrap();
    assert_eq!(
        workshop.skills_digest.as_deref(),
        Some("sha256:4444444444444444444444444444444444444444444444444444444444444444")
    );
    assert_eq!(
        workshop.agents_digest.as_deref(),
        Some("sha256:5555555555555555555555555555555555555555555555555555555555555555")
    );
    assert_eq!(
        workshop.prose_digest.as_deref(),
        Some("sha256:6666666666666666666666666666666666666666666666666666666666666666")
    );

    assert_eq!(manifest.requires.node.as_deref(), Some(">=20.0.0"));
    assert_eq!(manifest.requires.git.as_deref(), Some(">=2.30.0"));

    let state_schemas = manifest.state_schemas.as_ref().unwrap();
    assert_eq!(state_schemas.read, vec!["1"]);
    assert_eq!(state_schemas.write, vec!["1"]);
    assert!(state_schemas.migrations.is_empty());

    assert_eq!(manifest.files.len(), 1);
    assert_eq!(manifest.files[0].path, "bin/fgos");
    assert_eq!(manifest.files[0].kind, "file");
    assert_eq!(manifest.files[0].mode, "0755");
    assert_eq!(manifest.files[0].class, "binary");

    assert!(manifest.validate_legacy_node_invariant().is_ok());

    // Round-trip serialize & verify equality
    let serialized = serde_json::to_string_pretty(&manifest).expect("must serialize");
    let re_parsed: ReleaseManifest =
        serde_json::from_str(&serialized).expect("must re-parse serialized manifest");
    assert_eq!(manifest, re_parsed);
}

#[test]
fn test_release_manifest_minimal_backward_compatible() {
    let manifest: ReleaseManifest =
        serde_json::from_str(GOLDEN_RELEASE_MANIFEST_MINIMAL).expect("must parse minimal manifest");

    assert_eq!(manifest.schema_version, 1);
    assert_eq!(
        manifest.artifact_digest,
        "sha256:1111111111111111111111111111111111111111111111111111111111111111"
    );
    assert_eq!(manifest.digest_kind, None);
    assert_eq!(manifest.release_version, None);
    assert_eq!(manifest.source_revision, None);
    assert_eq!(manifest.created_at, None);
    assert_eq!(manifest.target.libc, None);
    assert_eq!(manifest.entries.fgos_runner, None);
    assert_eq!(manifest.components.runner, None);
    assert_eq!(manifest.components.workshop, None);
    assert_eq!(manifest.requires.node, None);
    assert_eq!(manifest.requires.git, None);
    assert_eq!(manifest.state_schemas, None);
    assert!(manifest.files.is_empty());

    assert_eq!(manifest.components.legacy_node.root, "libexec/legacy-node");
    assert_eq!(manifest.components.legacy_node.entry, "bin/fgos.mjs");
    assert!(manifest.validate_legacy_node_invariant().is_ok());
}

#[test]
fn test_release_manifest_forward_compatibility_ignores_unknown_fields() {
    let raw = r#"{
        "schemaVersion": 1,
        "artifactDigest": "sha256:test",
        "target": { "os": "linux", "arch": "x86_64", "futureCpuModel": "zen4" },
        "entries": { "fgos": "bin/fgos", "futureEntry": "bin/extra" },
        "components": {
            "legacyNode": {
                "root": "libexec/legacy-node",
                "entry": "libexec/legacy-node/bin/fgos.mjs",
                "digest": "sha256:digest"
            },
            "futureComponent": { "some": "field" }
        },
        "requires": {},
        "files": [],
        "unknownFutureTopLevelField": 42,
        "capabilities": ["a", "b"]
    }"#;

    let manifest: Result<ReleaseManifest, _> = serde_json::from_str(raw);
    assert!(
        manifest.is_ok(),
        "Manifest with extra future fields must deserialize cleanly"
    );
}

#[test]
fn test_release_manifest_legacy_node_invariant_enforcement() {
    // Missing components.legacyNode must be rejected
    let without_legacy_node = r#"{
        "schemaVersion": 1,
        "artifactDigest": "sha256:test",
        "target": { "os": "linux", "arch": "x86_64" },
        "entries": { "fgos": "bin/fgos" },
        "components": {},
        "requires": {},
        "files": []
    }"#;
    let res: Result<ReleaseManifest, _> = serde_json::from_str(without_legacy_node);
    assert!(
        res.is_err(),
        "Manifest lacking components.legacyNode must fail deserialization"
    );

    // Empty root or entry must fail invariant check
    let mut manifest: ReleaseManifest =
        serde_json::from_str(GOLDEN_RELEASE_MANIFEST_MINIMAL).unwrap();
    manifest.components.legacy_node.root = "  ".to_string();
    assert!(manifest.validate_legacy_node_invariant().is_err());

    manifest.components.legacy_node.root = "libexec/legacy-node".to_string();
    manifest.components.legacy_node.entry = "".to_string();
    assert!(manifest.validate_legacy_node_invariant().is_err());

    manifest.components.legacy_node.entry = "/bin/fgos.mjs".to_string();
    assert!(manifest.validate_legacy_node_invariant().is_err());

    manifest.components.legacy_node.entry = "../bin/fgos.mjs".to_string();
    assert!(manifest.validate_legacy_node_invariant().is_err());

    manifest.components.legacy_node.entry = "libexec/legacy-node/bin/fgos.mjs".to_string();
    assert!(manifest.validate_legacy_node_invariant().is_err());
}

#[test]
fn test_release_manifest_read_boundary_rejects_unsupported_v1_semantics() {
    let temp_dir =
        std::env::temp_dir().join(format!("fgos_schema_read_boundary_{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&temp_dir);
    std::fs::create_dir_all(&temp_dir).unwrap();
    let manifest_path = temp_dir.join("manifest.json");

    std::fs::write(
        &manifest_path,
        GOLDEN_RELEASE_MANIFEST_MINIMAL.replace("\"schemaVersion\": 1", "\"schemaVersion\": 2"),
    )
    .unwrap();
    assert!(read_manifest_from_path(&manifest_path).is_err());

    std::fs::write(
        &manifest_path,
        GOLDEN_RELEASE_MANIFEST_FULL.replace("\"migrations\": []", "\"migrations\": [\"2-to-1\"]"),
    )
    .unwrap();
    assert!(read_manifest_from_path(&manifest_path).is_err());

    let _ = std::fs::remove_dir_all(&temp_dir);
}

// =========================================================================
// 2. ActivationBinding Tests
// =========================================================================

#[test]
fn test_activation_binding_full_golden_roundtrip() {
    let binding: ActivationBinding =
        serde_json::from_str(GOLDEN_ACTIVATION_BINDING_FULL).expect("must parse full activation");

    assert_eq!(binding.schema_version, ACTIVATION_BINDING_SCHEMA_VERSION_V1);
    assert_eq!(binding.repository_id, "repo_8d3322d88fba3bd8");
    assert_eq!(binding.workspace_id, "8d3322d88fba3bd8");
    assert_eq!(binding.work_state_id, "8d3322d88fba3bd8");
    assert_eq!(binding.activation_id, "act_000001a08fe31d00");
    assert_eq!(binding.status, "ready");
    assert_eq!(
        binding.artifact_digest,
        "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4"
    );
    assert_eq!(
        binding.release_path,
        "/home/user/.local/state/fgos/releases/sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4"
    );
    assert_eq!(
        binding.previous_artifact_digest.as_deref(),
        Some("sha256:0000000000000000000000000000000000000000000000000000000000000000")
    );
    assert_eq!(binding.shim_version, "1");
    assert_eq!(
        binding
            .resolved_dependencies
            .get("node")
            .and_then(|v| v.as_str()),
        Some("/usr/bin/node")
    );
    assert_eq!(
        binding.pin_snapshot["projectRuntime"]["policy"].as_str(),
        Some("exact-digest")
    );
    assert_eq!(binding.activated_at, "2026-09-14T00:00:00.000Z");
    assert_eq!(binding.activated_by.tool, "fgctl");
    assert_eq!(binding.activated_by.version, "0.1.0");

    // Round-trip serialize & verify equality
    let serialized = serde_json::to_string_pretty(&binding).expect("must serialize");
    let re_parsed: WorkspaceActivationBinding =
        serde_json::from_str(&serialized).expect("must re-parse serialized activation");
    assert_eq!(binding, re_parsed);
}

#[test]
fn test_activation_binding_minimal_backward_compatible() {
    let binding: WorkspaceActivationBinding =
        serde_json::from_str(GOLDEN_ACTIVATION_BINDING_MINIMAL)
            .expect("must parse minimal activation");

    assert_eq!(binding.schema_version, 1);
    assert_eq!(binding.previous_artifact_digest, None);
    assert_eq!(binding.status, "ready");
    assert_eq!(binding.shim_version, "1");
    assert_eq!(binding.activated_by.tool, "fgctl");
}

#[test]
fn test_activation_binding_forward_compatibility_ignores_unknown_fields() {
    let raw = r#"{
        "schemaVersion": 1,
        "repositoryId": "repo_1",
        "workspaceId": "ws_1",
        "workStateId": "st_1",
        "activationId": "act_1",
        "status": "quarantined",
        "artifactDigest": "sha256:digest",
        "releasePath": "/path",
        "shimVersion": "1",
        "resolvedDependencies": {},
        "pinSnapshot": {},
        "activatedAt": "2026-09-14T00:00:00.000Z",
        "activatedBy": { "tool": "fgctl", "version": "0.1.0", "extraEnv": "ci" },
        "futureLeaseExpiry": 123456789,
        "nextRuntimeCandidate": null
    }"#;

    let parsed: Result<ActivationBinding, _> = serde_json::from_str(raw);
    assert!(
        parsed.is_ok(),
        "ActivationBinding with extra future fields must parse cleanly"
    );
    assert_eq!(parsed.unwrap().status, "quarantined");
}

// =========================================================================
// 3. DistributionPin Tests
// =========================================================================

#[test]
fn test_distribution_pin_full_golden_roundtrip() {
    let pin: DistributionPin =
        serde_json::from_str(GOLDEN_DISTRIBUTION_PIN_FULL).expect("must parse full pin");

    assert_eq!(pin.schema_version, DISTRIBUTION_PIN_SCHEMA_VERSION_V1);
    assert_eq!(pin.project_runtime.policy, "exact-digest");
    assert_eq!(
        pin.project_runtime.artifact_digest,
        "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4"
    );
    assert_eq!(
        pin.project_runtime.release_version.as_deref(),
        Some("0.1.0")
    );
    assert_eq!(pin.project_runtime.channel.as_deref(), Some("stable"));
    assert_eq!(pin.project_runtime.allow_prerelease, false);

    // Round-trip serialize & verify equality
    let serialized = serde_json::to_string_pretty(&pin).expect("must serialize");
    let re_parsed: TrackedDistributionPin =
        serde_json::from_str(&serialized).expect("must re-parse serialized pin");
    assert_eq!(pin, re_parsed);
}

#[test]
fn test_distribution_pin_minimal_backward_compatible() {
    let pin: TrackedDistributionPin =
        serde_json::from_str(GOLDEN_DISTRIBUTION_PIN_MINIMAL).expect("must parse minimal pin");

    assert_eq!(pin.schema_version, 1);
    assert_eq!(pin.project_runtime.policy, "exact-digest");
    assert_eq!(
        pin.project_runtime.artifact_digest,
        "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4"
    );
    assert_eq!(pin.project_runtime.release_version, None);
    assert_eq!(pin.project_runtime.channel, None);
    assert_eq!(pin.project_runtime.allow_prerelease, false);
}

#[test]
fn test_distribution_pin_forward_compatibility_ignores_unknown_fields() {
    let raw = r#"{
        "schemaVersion": 1,
        "projectRuntime": {
            "policy": "channel",
            "artifactDigest": "sha256:abc",
            "channel": "nightly",
            "fallbackPolicy": "pinned",
            "signatureRequired": true
        },
        "managedByTeam": "platform"
    }"#;

    let pin: Result<DistributionPin, _> = serde_json::from_str(raw);
    assert!(
        pin.is_ok(),
        "DistributionPin with extra future fields must parse cleanly"
    );
}

// =========================================================================
// 4. WorkspaceRootBinding (Topology) Tests
// =========================================================================

#[test]
fn test_workspace_root_binding_golden_roundtrip() {
    let root: TopologyRootBinding = serde_json::from_str(GOLDEN_WORKSPACE_ROOT_BINDING)
        .expect("must parse workspace root binding");

    assert_eq!(
        root.schema_version,
        WORKSPACE_ROOT_BINDING_SCHEMA_VERSION_V1
    );
    assert_eq!(root.repository_root, "/home/user/project");
    assert_eq!(root.workspace_id, "8d3322d88fba3bd8");
    assert_eq!(root.work_state_id, "8d3322d88fba3bd8");
    assert_eq!(root.machine_release_store, "/home/user/.local/state/fgos");

    // Round-trip serialize & verify equality
    let serialized = serde_json::to_string_pretty(&root).expect("must serialize");
    let re_parsed: WorkspaceRootBinding =
        serde_json::from_str(&serialized).expect("must re-parse serialized root binding");
    assert_eq!(root, re_parsed);
}

#[test]
fn test_workspace_root_binding_forward_compatibility() {
    let raw = r#"{
        "schemaVersion": 1,
        "repositoryRoot": "/repo",
        "workspaceId": "ws1",
        "workStateId": "st1",
        "machineReleaseStore": "/store",
        "workerCapsuleRoot": "/capsule",
        "extraTopologyTag": "dev"
    }"#;

    let root: Result<WorkspaceRootBinding, _> = serde_json::from_str(raw);
    assert!(
        root.is_ok(),
        "WorkspaceRootBinding with extra fields must parse cleanly"
    );
}

// =========================================================================
// 5. InstallTransactionRecord & ReleaseStatusEntry Tests
// =========================================================================

#[test]
fn test_install_transaction_record_golden_roundtrip() {
    let tx: InstallTransactionRecord =
        serde_json::from_str(GOLDEN_INSTALL_TRANSACTION).expect("must parse install transaction");

    assert_eq!(tx.schema_version, INSTALL_TRANSACTION_SCHEMA_VERSION_V1);
    assert_eq!(tx.activation_id, "act_000001a08fe31d00");
    assert_eq!(tx.workspace_id, "8d3322d88fba3bd8");
    assert_eq!(
        tx.artifact_digest,
        "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4"
    );
    assert_eq!(tx.status, "ready-published");
    assert_eq!(tx.history.len(), 4);
    assert_eq!(tx.history[0].status, "staging");
    assert_eq!(tx.history[3].status, "ready-published");
    assert_eq!(tx.updated_at, "2026-09-14T00:00:03.000Z");

    let serialized = serde_json::to_string_pretty(&tx).expect("must serialize");
    let re_parsed: InstallTransactionRecord =
        serde_json::from_str(&serialized).expect("must re-parse serialized install transaction");
    assert_eq!(tx, re_parsed);
}

#[test]
fn test_release_status_and_workspace_status_serde() {
    let release = ReleaseStatusEntry {
        artifact_digest: "sha256:test".to_string(),
        release_version: Some("1.0.0".to_string()),
        created_at: Some("2026-09-14T00:00:00Z".to_string()),
    };

    let ws_status = FgctlWorkspaceStatus {
        active_artifact_digest: "sha256:test".to_string(),
        previous_artifact_digest: None,
        quarantined: false,
        releases: vec![release.clone()],
    };

    let json_str = serde_json::to_string(&ws_status).expect("must serialize ws status");
    let re_parsed: FgctlWorkspaceStatus =
        serde_json::from_str(&json_str).expect("must deserialize ws status");
    assert_eq!(ws_status, re_parsed);
}
