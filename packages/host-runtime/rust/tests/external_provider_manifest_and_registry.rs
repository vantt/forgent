//! Tests for external process provider manifest parsing, validation, and registry linking.
//!
//! Packets R2-P1 / R2-P2:
//! - Positive fixture manifest parsing
//! - Separate tests for malformed, missing, path-escaping, and unsupported manifests
//! - Proof that discovery never executes the provider executable/script
//! - Linker refusal tests for duplicate, reserved-namespace, unknown-capability,
//!   incompatible-contract, and built-in-replacement
//! - Deterministic registry snapshot output across repeated runs

use fgos_host_runtime::providers::external_process::{
    parse_contract_ref, ExternalManifest, ExternalProcessLinker, LinkerError, ManifestError,
};
use fgos_host_runtime::{CATALOG, ECHO_PROVIDER_DESCRIPTOR};
use std::fs;
use std::path::{Path, PathBuf};

fn fixture_path(name: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join("external-provider")
        .join(name)
}

// -----------------------------------------------------------------------------
// R2-P1: Manifest Parser and Validator Tests
// -----------------------------------------------------------------------------

#[test]
fn positive_fixture_manifest_parses() {
    let path = fixture_path("manifest.yaml");
    assert!(path.exists(), "positive fixture manifest.yaml must exist");

    let manifest = ExternalManifest::load_from_file(&path)
        .expect("positive fixture manifest.yaml must parse cleanly");

    // Verify frozen fixture contract exact fields
    assert_eq!(manifest.id, "fixture.echo.process");
    assert_eq!(manifest.version, "1.0.0");
    assert_eq!(manifest.manifest_version, "1.0.0");
    assert_eq!(manifest.runtime.kind, "process");
    assert_eq!(manifest.runtime.command, Path::new("./echo-runner.sh"));
    assert_eq!(manifest.capabilities, Vec::<String>::new());

    assert_eq!(manifest.provides.operations.len(), 1);
    let op = &manifest.provides.operations[0];
    assert_eq!(op.id, "fixture.echo.echo");
    assert_eq!(op.request_contract, "fixture.echo.echo.request@1.0.0");
    assert_eq!(op.outcome_contract, "fixture.echo.echo.outcome@1.0.0");
    assert_eq!(op.protocol, "fgos.component.v1");

    // Verify ContractRef parsing
    let req_ref = parse_contract_ref(&op.request_contract).expect("request contract parses");
    assert_eq!(req_ref.id(), "fixture.echo.echo.request");
    assert_eq!(req_ref.version(), "1.0.0");

    let out_ref = parse_contract_ref(&op.outcome_contract).expect("outcome contract parses");
    assert_eq!(out_ref.id(), "fixture.echo.echo.outcome");
    assert_eq!(out_ref.version(), "1.0.0");
}

#[test]
fn malformed_manifest_syntax_error_fails_closed() {
    let path = fixture_path("manifest_malformed.yaml");
    let result = ExternalManifest::load_from_file(&path);
    assert!(
        matches!(result, Err(ManifestError::MalformedYaml(_))),
        "malformed yaml syntax must fail closed with MalformedYaml, got {result:?}"
    );
}

#[test]
fn malformed_manifest_truncated_fails_closed() {
    let path = fixture_path("manifest_truncated.yaml");
    let result = ExternalManifest::load_from_file(&path);
    assert!(
        matches!(
            result,
            Err(ManifestError::MalformedYaml(_)) | Err(ManifestError::Validation(_))
        ),
        "truncated yaml must fail closed, got {result:?}"
    );
}

#[test]
fn malformed_manifest_non_utf8_fails_closed() {
    let non_utf8_bytes = [0x6d, 0x61, 0x6e, 0xff, 0xfe, 0xfd];
    let result = ExternalManifest::load_from_bytes(&non_utf8_bytes, None);
    assert!(
        matches!(result, Err(ManifestError::NonUtf8(_))),
        "non-utf8 bytes must fail closed with NonUtf8, got {result:?}"
    );
}

#[test]
fn missing_manifest_fails_closed() {
    let path = fixture_path("non_existent_file_definitely_missing.yaml");
    let result = ExternalManifest::load_from_file(&path);
    assert!(
        matches!(result, Err(ManifestError::MissingManifest(_))),
        "missing manifest file must fail closed with MissingManifest, got {result:?}"
    );
}

#[test]
fn path_escaping_manifest_relative_traversal_fails_closed() {
    let path = fixture_path("manifest_path_escaping.yaml");
    let result = ExternalManifest::load_from_file(&path);
    assert!(
        matches!(result, Err(ManifestError::PathEscaping { .. })),
        "relative parent dir traversal (..) in command must fail closed with PathEscaping, got {result:?}"
    );
}

#[test]
fn path_escaping_manifest_absolute_path_fails_closed() {
    let path = fixture_path("manifest_path_escaping_abs.yaml");
    let result = ExternalManifest::load_from_file(&path);
    assert!(
        matches!(result, Err(ManifestError::PathEscaping { .. })),
        "absolute path in command must fail closed with PathEscaping, got {result:?}"
    );
}

#[test]
fn path_escaping_manifest_symlink_escape_fails_closed() {
    // Create a temporary sandbox directory
    let temp_dir = std::env::temp_dir().join(format!("fgos-test-symlink-{}", std::process::id()));
    let _ = fs::remove_dir_all(&temp_dir);
    fs::create_dir_all(&temp_dir).unwrap();

    let outside_dir = temp_dir.join("outside");
    let manifest_dir = temp_dir.join("manifest_root");
    fs::create_dir_all(&outside_dir).unwrap();
    fs::create_dir_all(&manifest_dir).unwrap();

    let outside_script = outside_dir.join("target.sh");
    fs::write(&outside_script, "#!/bin/sh\nexit 0\n").unwrap();

    // Create a symlink inside manifest_dir pointing outside to outside_script
    let symlink_path = manifest_dir.join("link-escape.sh");
    #[cfg(unix)]
    std::os::unix::fs::symlink(&outside_script, &symlink_path).unwrap();

    let manifest_content = r#"
manifestVersion: "1.0.0"
id: fixture.echo.process
version: 1.0.0
runtime:
  kind: process
  command: ./link-escape.sh
provides:
  operations:
    - id: fixture.echo.echo
      request_contract: fixture.echo.echo.request@1.0.0
      outcome_contract: fixture.echo.echo.outcome@1.0.0
      protocol: fgos.component.v1
capabilities: []
"#;
    let manifest_file = manifest_dir.join("manifest.yaml");
    fs::write(&manifest_file, manifest_content).unwrap();

    let result = ExternalManifest::load_from_file(&manifest_file);
    let _ = fs::remove_dir_all(&temp_dir);

    #[cfg(unix)]
    assert!(
        matches!(result, Err(ManifestError::PathEscaping { .. })),
        "symlink resolving outside manifest directory must fail closed with PathEscaping, got {result:?}"
    );
}

#[test]
fn unsupported_manifest_version_fails_closed() {
    let path = fixture_path("manifest_unsupported_version.yaml");
    let result = ExternalManifest::load_from_file(&path);
    assert!(
        matches!(result, Err(ManifestError::UnsupportedManifestVersion(_))),
        "unsupported manifest version must fail closed with UnsupportedManifestVersion, got {result:?}"
    );
}

#[test]
fn unsupported_runtime_kind_fails_closed() {
    let path = fixture_path("manifest_unsupported_runtime.yaml");
    let result = ExternalManifest::load_from_file(&path);
    assert!(
        matches!(result, Err(ManifestError::UnsupportedRuntimeKind(_))),
        "unsupported runtime kind must fail closed with UnsupportedRuntimeKind, got {result:?}"
    );
}

#[test]
fn discovery_never_executes_provider_executable() {
    let temp_dir = std::env::temp_dir().join(format!("fgos-test-no-exec-{}", std::process::id()));
    let _ = fs::remove_dir_all(&temp_dir);
    fs::create_dir_all(&temp_dir).unwrap();

    let sentinel_file = temp_dir.join("marker-executed.sentinel");
    let script_file = temp_dir.join("executable-trap.sh");

    // Create a script that would touch the sentinel file if executed
    let script_content = format!("#!/bin/sh\ntouch \"{}\"\nexit 0\n", sentinel_file.display());
    fs::write(&script_file, script_content).unwrap();
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&script_file).unwrap().permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&script_file, perms).unwrap();
    }

    let manifest_content = r#"
manifestVersion: "1.0.0"
id: fixture.echo.process
version: 1.0.0
runtime:
  kind: process
  command: ./executable-trap.sh
provides:
  operations:
    - id: fixture.echo.echo
      request_contract: fixture.echo.echo.request@1.0.0
      outcome_contract: fixture.echo.echo.outcome@1.0.0
      protocol: fgos.component.v1
capabilities: []
"#;
    let manifest_file = temp_dir.join("manifest.yaml");
    fs::write(&manifest_file, manifest_content).unwrap();

    // Perform static discovery / manifest loading
    let manifest = ExternalManifest::load_from_file(&manifest_file)
        .expect("manifest discovery should succeed statically");
    assert_eq!(manifest.id, "fixture.echo.process");

    // Also run through linker
    let linker = ExternalProcessLinker::new();
    let registry = linker.link(&[manifest]).expect("linking should succeed");
    assert_eq!(registry.len(), 1);

    // PROOF: The sentinel file was NEVER created, proving provider executable was never run
    assert!(
        !sentinel_file.exists(),
        "CRITICAL: discovery or linking executed the provider executable! Sentinel file exists."
    );

    let _ = fs::remove_dir_all(&temp_dir);
}

// -----------------------------------------------------------------------------
// R2-P2: Derived Registry / Linker Refusal Tests
// -----------------------------------------------------------------------------

#[test]
fn linker_refusal_duplicate_operation_claims() {
    let linker = ExternalProcessLinker::new();

    // 1. Intra-manifest duplicate
    let intra_dup_path = fixture_path("manifest_duplicate_op.yaml");
    let intra_result = ExternalManifest::load_from_file(&intra_dup_path);
    assert!(
        intra_result.is_err(),
        "intra-manifest duplicate operation must be rejected during validation"
    );

    // 2. Inter-manifest duplicate
    let manifest_a = ExternalManifest::load_from_file(fixture_path("manifest.yaml")).unwrap();
    let mut manifest_b = manifest_a.clone();
    manifest_b.id = "fixture.other.provider".to_string(); // Different provider claiming same operation

    let result = linker.link(&[manifest_a, manifest_b]);
    assert!(
        matches!(result, Err(LinkerError::DuplicateOperationClaim { .. })),
        "inter-manifest duplicate operation claim must be refused with DuplicateOperationClaim, got {result:?}"
    );
}

#[test]
fn linker_refusal_duplicate_operation_casing_and_whitespace() {
    let linker = ExternalProcessLinker::new();
    let manifest_a = ExternalManifest::load_from_file(fixture_path("manifest.yaml")).unwrap();

    // Attack: duplicate operation with mixed casing
    let mut manifest_mixed_case = manifest_a.clone();
    manifest_mixed_case.id = "fixture.casing.provider".to_string();
    manifest_mixed_case.provides.operations[0].id = "FIXTURE.ECHO.ECHO".to_string();

    // Should be caught either during manifest validation (requires lowercase) or linker duplicate check
    let val_result = manifest_mixed_case.validate(None);
    if val_result.is_ok() {
        let link_result = linker.link(&[manifest_a.clone(), manifest_mixed_case]);
        assert!(
            link_result.is_err(),
            "duplicate operation under uppercase must be refused"
        );
    } else {
        assert!(
            matches!(val_result, Err(ManifestError::Validation(_))),
            "uppercase operation id must be rejected"
        );
    }

    // Attack: duplicate operation with whitespace
    let mut manifest_whitespace = manifest_a.clone();
    manifest_whitespace.id = "fixture.whitespace.provider".to_string();
    manifest_whitespace.provides.operations[0].id = " fixture.echo.echo ".to_string();

    let val_ws = manifest_whitespace.validate(None);
    assert!(
        val_ws.is_err(),
        "operation id with whitespace must fail validation"
    );
}

#[test]
fn linker_refusal_reserved_namespace() {
    let linker = ExternalProcessLinker::new();
    let path = fixture_path("manifest_reserved_namespace.yaml");
    let manifest = ExternalManifest::load_from_file(&path)
        .expect("manifest with reserved namespace parses structurally");

    let result = linker.link(&[manifest]);
    assert!(
        matches!(result, Err(LinkerError::ReservedNamespace { ref namespace, .. }) if namespace == "distribution"),
        "manifest claiming distribution.* must be refused with ReservedNamespace, got {result:?}"
    );

    // Test other core namespaces: work, fgos, core
    let mut manifest_work =
        ExternalManifest::load_from_file(fixture_path("manifest.yaml")).unwrap();
    manifest_work.provides.operations[0].id = "work.gate-bypass.show".to_string();
    manifest_work.provides.operations[0].request_contract =
        "work.gate-bypass.show.request@1.0.0".to_string();
    manifest_work.provides.operations[0].outcome_contract =
        "work.gate-bypass.show.outcome@1.0.0".to_string();

    let result_work = linker.link(&[manifest_work]);
    assert!(
        result_work.is_err(),
        "manifest claiming work.* must be refused with ReservedNamespace"
    );
}

#[test]
fn linker_refusal_unknown_capability() {
    let linker = ExternalProcessLinker::new();
    let path = fixture_path("manifest_unknown_capability.yaml");
    let manifest = ExternalManifest::load_from_file(&path)
        .expect("manifest with unknown capability parses structurally");

    let result = linker.link(&[manifest]);
    assert!(
        matches!(result, Err(LinkerError::UnknownCapability { ref capability, .. }) if capability == "admin.superpower.unrestricted"),
        "manifest requesting unknown capability must be refused with UnknownCapability, got {result:?}"
    );
}

#[test]
fn linker_refusal_incompatible_contract() {
    let linker = ExternalProcessLinker::new();
    let path = fixture_path("manifest_incompatible_contract.yaml");
    let manifest = ExternalManifest::load_from_file(&path)
        .expect("manifest with incompatible contract parses structurally");

    let result = linker.link(&[manifest]);
    assert!(
        matches!(result, Err(LinkerError::IncompatibleContract { .. })),
        "manifest declaring incompatible contract version must be refused with IncompatibleContract, got {result:?}"
    );
}

#[test]
fn linker_refusal_builtin_replacement() {
    let linker = ExternalProcessLinker::new();

    // 1. Manifest with provider_id matching builtin provider
    let path = fixture_path("manifest_builtin_replacement.yaml");
    let manifest = ExternalManifest::load_from_file(&path)
        .expect("manifest with builtin provider id parses structurally");

    let result = linker.link(&[manifest]);
    assert!(
        matches!(result, Err(LinkerError::BuiltinReplacementRefused { .. })),
        "manifest with id matching builtin provider must be refused with BuiltinReplacementRefused, got {result:?}"
    );

    // 2. Manifest declaring replacement of builtin provider
    let mut manifest_replace =
        ExternalManifest::load_from_file(fixture_path("manifest.yaml")).unwrap();
    manifest_replace.id = "vendor.custom.echo".to_string();
    manifest_replace.replacement = Some("test.fixture.echo.builtin".to_string());

    let result_replace = linker.link(&[manifest_replace]);
    assert!(
        matches!(
            result_replace,
            Err(LinkerError::BuiltinReplacementRefused { .. })
        ),
        "manifest claiming replacement of builtin provider must be refused, got {result_replace:?}"
    );

    // 3. Manifest claiming operation served by builtin provider
    let mut manifest_op_usurp =
        ExternalManifest::load_from_file(fixture_path("manifest.yaml")).unwrap();
    manifest_op_usurp.id = "vendor.custom.echo".to_string();
    manifest_op_usurp.provides.operations[0].id = "test.fixture.echo".to_string();
    manifest_op_usurp.provides.operations[0].request_contract =
        "test.fixture.echo.request@1.0.0".to_string();
    manifest_op_usurp.provides.operations[0].outcome_contract =
        "test.fixture.echo.outcome@1.0.0".to_string();

    let result_op = linker.link(&[manifest_op_usurp]);
    assert!(
        result_op.is_err(),
        "manifest attempting to usurp builtin operation must be refused"
    );
}

#[test]
fn registry_snapshot_deterministic_output() {
    let linker = ExternalProcessLinker::new();

    // Create three distinct manifests with vendor-scoped operations
    let manifest_1 = ExternalManifest::load_from_file(fixture_path("manifest.yaml")).unwrap();

    let mut manifest_2 = manifest_1.clone();
    manifest_2.id = "vendor.alpha.provider".to_string();
    manifest_2.provides.operations[0].id = "vendor.alpha.operation".to_string();
    manifest_2.provides.operations[0].request_contract = "vendor.alpha.req@1.0.0".to_string();
    manifest_2.provides.operations[0].outcome_contract = "vendor.alpha.out@1.0.0".to_string();

    let mut manifest_3 = manifest_1.clone();
    manifest_3.id = "vendor.beta.provider".to_string();
    manifest_3.provides.operations[0].id = "vendor.beta.operation".to_string();
    manifest_3.provides.operations[0].request_contract = "vendor.beta.req@1.0.0".to_string();
    manifest_3.provides.operations[0].outcome_contract = "vendor.beta.out@1.0.0".to_string();

    // Run linking across different permutations
    let reg_order_1 = linker
        .link(&[manifest_1.clone(), manifest_2.clone(), manifest_3.clone()])
        .expect("order 1 links");
    let reg_order_2 = linker
        .link(&[manifest_3.clone(), manifest_1.clone(), manifest_2.clone()])
        .expect("order 2 links");
    let reg_order_3 = linker
        .link(&[manifest_2.clone(), manifest_3.clone(), manifest_1.clone()])
        .expect("order 3 links");

    // Fingerprints must be identical across all runs
    assert_eq!(
        reg_order_1.fingerprint(),
        reg_order_2.fingerprint(),
        "fingerprint must be deterministic regardless of input manifest order"
    );
    assert_eq!(
        reg_order_1.fingerprint(),
        reg_order_3.fingerprint(),
        "fingerprint must be deterministic across all permutations"
    );

    // Entry order must be identical
    let p1: Vec<(&str, &str)> = reg_order_1
        .providers()
        .iter()
        .map(|p| (p.provider_id.as_str(), p.operation_id.as_str()))
        .collect();
    let p2: Vec<(&str, &str)> = reg_order_2
        .providers()
        .iter()
        .map(|p| (p.provider_id.as_str(), p.operation_id.as_str()))
        .collect();
    let p3: Vec<(&str, &str)> = reg_order_3
        .providers()
        .iter()
        .map(|p| (p.provider_id.as_str(), p.operation_id.as_str()))
        .collect();

    assert_eq!(
        p1, p2,
        "provider entries must be sorted identically in order 1 vs order 2"
    );
    assert_eq!(
        p1, p3,
        "provider entries must be sorted identically in order 1 vs order 3"
    );

    // Verify build_snapshot produces valid RegistrySnapshot with builtin and external providers
    let snapshot = reg_order_1.build_snapshot(CATALOG, &[ECHO_PROVIDER_DESCRIPTOR]);
    assert_eq!(snapshot.catalog().len(), CATALOG.len());
    assert_eq!(snapshot.providers().len(), 1 + 3); // 1 builtin + 3 external
    assert_eq!(snapshot.fingerprint(), reg_order_1.fingerprint());
}
