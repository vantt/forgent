//! Integration tests for `apps/fgos`.
//!
//! Verifies:
//! - R3: Unlisted selector fails closed with exit code 4.
//! - R5/R10: Recursion trap test (fails closed when recursion guard is set).
//! - R11: Process-spy test (exactly one node child process spawned per legacy invocation).
//! - R6: Native `version` selector fails closed with SelectionRefused pre-Phase-08.
//! - R7: Invocation record sink writes exactly one record when configured.

use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

fn fgos_bin() -> PathBuf {
    if let Ok(bin) = std::env::var("CARGO_BIN_EXE_fgos") {
        return PathBuf::from(bin);
    }
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest_dir
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("target")
        .join("debug")
        .join("fgos")
}

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf()
}

fn sha256_file(path: PathBuf) -> String {
    let bytes = fs::read(path).unwrap();
    format!("sha256:{:x}", Sha256::digest(&bytes))
}

fn valid_dev_manifest() -> serde_json::Value {
    let legacy_node_digest = sha256_file(repo_root().join("bin").join("fgos.mjs"));
    let mut manifest = serde_json::json!({
        "schemaVersion": 1,
        "entries": {
            "fgos": "target/debug/fgos",
        },
        "components": {
            "legacyNode": {
                "root": ".",
                "entry": "bin/fgos.mjs",
                "digest": legacy_node_digest,
            },
        },
        "requires": {
            "node": ">=18",
        },
        "target": {
            "os": "linux",
            "arch": "x64",
        },
        "stateSchemas": {
            "read": ["2"],
            "write": ["2"],
            "migrations": [],
        },
        "files": [
            {
                "path": "bin/fgos.mjs",
                "kind": "file",
                "digest": legacy_node_digest,
                "mode": "755",
                "class": "legacy-node",
            },
        ],
    });
    let canonical = fgos_distribution::verify::to_canonical_json(&manifest);
    manifest["artifactDigest"] =
        serde_json::json!(format!("sha256:{:x}", Sha256::digest(canonical.as_bytes())));
    manifest
}

fn ensure_dev_manifest() -> PathBuf {
    let target = std::env::temp_dir().join(format!(
        "fgos_test_dev_manifest_{}_{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let manifest_path = target.join("manifest.json");
    let manifest = valid_dev_manifest();
    fs::create_dir_all(&target).unwrap();
    fs::write(
        &manifest_path,
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();
    manifest_path
}

#[test]
fn test_unlisted_selector_fails_closed_with_exit_4() {
    let output = Command::new(fgos_bin())
        .arg("not-a-real-selector")
        .output()
        .expect("failed to execute fgos");

    assert_eq!(
        output.status.code(),
        Some(4),
        "unlisted selector must fail closed with exit code 4"
    );

    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("unknown verb \"not-a-real-selector\""),
        "stderr must name the unknown verb, got: {}",
        stderr
    );
}

#[test]
fn test_recursion_trap_fails_closed() {
    let output = Command::new(fgos_bin())
        .arg("add")
        .env("FGOS_RUST_HOST_RECURSION_GUARD", "1")
        .output()
        .expect("failed to execute fgos");

    assert_ne!(
        output.status.code(),
        Some(0),
        "recursion trap must fail closed with non-zero exit code"
    );

    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("recursion guard triggered"),
        "stderr must report recursion guard triggered, got: {}",
        stderr
    );
}

// Unix only: the spy is a `sh` wrapper script and symlinks need no privilege.
#[cfg(unix)]
#[test]
fn test_one_node_child_process_spy() {
    let manifest_path = ensure_dev_manifest();
    let root = repo_root();

    // Create a temporary directory containing a spy `node` wrapper script.
    let temp_dir = std::env::temp_dir().join(format!("fgos_test_spy_{}", std::process::id()));
    fs::create_dir_all(&temp_dir).unwrap();

    let spy_log = temp_dir.join("spy_log.txt");
    let real_node = {
        let which_out = Command::new("which")
            .arg("node")
            .output()
            .expect("which node must succeed");
        let path_str = String::from_utf8_lossy(&which_out.stdout)
            .trim()
            .to_string();
        PathBuf::from(path_str)
    };

    let spy_script = temp_dir.join("node");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let script_content = format!(
            "#!/bin/sh\necho \"SPY_PID:$$\" >> \"{}\"\nexec \"{}\" \"$@\"\n",
            spy_log.display(),
            real_node.display()
        );
        fs::write(&spy_script, script_content).unwrap();
        let mut perms = fs::metadata(&spy_script).unwrap().permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&spy_script, perms).unwrap();
    }

    let original_path = std::env::var("PATH").unwrap_or_default();
    let modified_path = format!("{}:{}", temp_dir.display(), original_path);

    let output = Command::new(fgos_bin())
        .args(["add", "--help"])
        .env("PATH", modified_path)
        .env("FGOS_ACTIVE_RELEASE_PATH", &root)
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .output()
        .expect("failed to execute fgos");

    assert_eq!(output.status.code(), Some(0));

    // Read spy log: must contain exactly one invocation of the `node` wrapper.
    let log_content = fs::read_to_string(&spy_log).unwrap_or_default();
    let invocations: Vec<&str> = log_content
        .lines()
        .filter(|l| l.starts_with("SPY_PID:"))
        .collect();

    assert_eq!(
        invocations.len(),
        1,
        "expected exactly one node child process per legacy invocation, got: {:?}",
        invocations
    );

    // Clean up temporary directory.
    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_native_version_succeeds_with_envelope() {
    let output = Command::new(fgos_bin())
        .arg("version")
        .output()
        .expect("failed to execute fgos");

    assert_eq!(
        output.status.code(),
        Some(0),
        "native version must exit 0, got: {:?}",
        output.status.code()
    );

    let stdout = String::from_utf8_lossy(&output.stdout);
    let parsed: serde_json::Value =
        serde_json::from_str(&stdout).expect("output must be valid JSON envelope");

    assert_eq!(parsed["contract"], "fgos.v1");
    let gen_at = parsed["generated_at"]
        .as_str()
        .expect("generated_at must be string");
    assert!(gen_at.ends_with('Z'));
    assert_eq!(parsed["data_hash"].as_str().map(|h| h.len()), Some(64));
    let package_json: serde_json::Value = serde_json::from_str(
        &std::fs::read_to_string(repo_root().join("package.json")).expect("read package.json"),
    )
    .expect("package.json must be valid JSON");
    assert_eq!(parsed["data"]["packageVersion"], package_json["version"]);
    let routes_path = repo_root().join("packages/host-runtime/contracts/command-routes.json");
    let routes_str =
        fs::read_to_string(&routes_path).expect("command-routes.json must be readable");
    let routes: std::collections::HashMap<String, serde_json::Value> =
        serde_json::from_str(&routes_str).expect("command-routes.json must be valid JSON");
    assert_eq!(
        parsed["data"]["verbs"].as_array().map(|v| v.len()),
        Some(routes.keys().filter(|k| !k.starts_with('-')).count())
    );
}

#[test]
fn test_native_version_zero_node_child_process_spy() {
    let root = repo_root();

    // Create a temporary directory containing a spy `node` wrapper script.
    let temp_dir = std::env::temp_dir().join(format!("fgos_test_spy_zero_{}", std::process::id()));
    fs::create_dir_all(&temp_dir).unwrap();

    let spy_log = temp_dir.join("spy_log.txt");
    let real_node = {
        let which_out = Command::new("which")
            .arg("node")
            .output()
            .expect("which node must succeed");
        let path_str = String::from_utf8_lossy(&which_out.stdout)
            .trim()
            .to_string();
        PathBuf::from(path_str)
    };

    let spy_script = temp_dir.join("node");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let script_content = format!(
            "#!/bin/sh\necho \"SPY_PID:$$\" >> \"{}\"\nexec \"{}\" \"$@\"\n",
            spy_log.display(),
            real_node.display()
        );
        fs::write(&spy_script, script_content).unwrap();
        let mut perms = fs::metadata(&spy_script).unwrap().permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&spy_script, perms).unwrap();
    }

    let original_path = std::env::var("PATH").unwrap_or_default();
    let modified_path = format!("{}:{}", temp_dir.display(), original_path);

    let output = Command::new(fgos_bin())
        .arg("version")
        .env("PATH", modified_path)
        .env("FGOS_ACTIVE_RELEASE_PATH", &root)
        .output()
        .expect("failed to execute fgos");

    assert_eq!(output.status.code(), Some(0));

    // Read spy log: must contain zero invocations of the `node` wrapper.
    let log_content = fs::read_to_string(&spy_log).unwrap_or_default();
    let invocations: Vec<&str> = log_content
        .lines()
        .filter(|l| l.starts_with("SPY_PID:"))
        .collect();

    assert_eq!(
        invocations.len(),
        0,
        "expected zero node child processes for native version, got: {:?}",
        invocations
    );

    // Clean up temporary directory.
    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_native_gate_bypass_succeeds_with_envelope() {
    let temp_dir =
        std::env::temp_dir().join(format!("fgos_test_gate_bypass_{}", std::process::id()));
    let _ = fs::remove_dir_all(&temp_dir);
    fs::create_dir_all(temp_dir.join(".fgos")).unwrap();
    fs::write(
        temp_dir.join(".fgos").join("config.json"),
        r#"{"gateBypass":{"level":"standard"}}"#,
    )
    .unwrap();

    let output = Command::new(fgos_bin())
        .arg("gate-bypass")
        .current_dir(&temp_dir)
        .output()
        .expect("failed to execute fgos");

    assert_eq!(
        output.status.code(),
        Some(0),
        "native gate-bypass must exit 0, got: {:?}, stderr={}",
        output.status.code(),
        String::from_utf8_lossy(&output.stderr)
    );

    let stdout = String::from_utf8_lossy(&output.stdout);
    let parsed: serde_json::Value =
        serde_json::from_str(&stdout).expect("output must be valid JSON envelope");

    assert_eq!(parsed["contract"], "fgos.v1");
    assert_eq!(parsed["data"]["level"], "standard");

    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_native_gate_bypass_zero_node_child_process_spy() {
    let temp_dir =
        std::env::temp_dir().join(format!("fgos_test_gate_bypass_spy_{}", std::process::id()));
    fs::create_dir_all(temp_dir.join(".fgos")).unwrap();

    let spy_dir = temp_dir.join("spy");
    fs::create_dir_all(&spy_dir).unwrap();
    let spy_log = spy_dir.join("spy_log.txt");
    let real_node = {
        let which_out = Command::new("which")
            .arg("node")
            .output()
            .expect("which node must succeed");
        let path_str = String::from_utf8_lossy(&which_out.stdout)
            .trim()
            .to_string();
        PathBuf::from(path_str)
    };

    let spy_script = spy_dir.join("node");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let script_content = format!(
            "#!/bin/sh\necho \"SPY_PID:$$\" >> \"{}\"\nexec \"{}\" \"$@\"\n",
            spy_log.display(),
            real_node.display()
        );
        fs::write(&spy_script, script_content).unwrap();
        let mut perms = fs::metadata(&spy_script).unwrap().permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&spy_script, perms).unwrap();
    }

    let original_path = std::env::var("PATH").unwrap_or_default();
    let modified_path = format!("{}:{}", spy_dir.display(), original_path);

    let output = Command::new(fgos_bin())
        .arg("gate-bypass")
        .current_dir(&temp_dir)
        .env("PATH", modified_path)
        .output()
        .expect("failed to execute fgos");

    assert_eq!(output.status.code(), Some(0));

    let log_content = fs::read_to_string(&spy_log).unwrap_or_default();
    let invocations: Vec<&str> = log_content
        .lines()
        .filter(|l| l.starts_with("SPY_PID:"))
        .collect();

    assert_eq!(
        invocations.len(),
        0,
        "expected zero node child processes for native gate-bypass, got: {:?}",
        invocations
    );

    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_legacy_exec_invocation_record_sink() {
    let manifest_path = ensure_dev_manifest();
    let root = repo_root();

    let record_file =
        std::env::temp_dir().join(format!("fgos_test_rec_{}.jsonl", std::process::id()));
    let _ = fs::remove_file(&record_file);

    let output = Command::new(fgos_bin())
        .args(["add", "--help"])
        .env("FGOS_ACTIVE_RELEASE_PATH", &root)
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .env("FGOS_INVOCATION_RECORD_PATH", &record_file)
        .output()
        .expect("failed to execute fgos");

    assert_eq!(output.status.code(), Some(0));

    let content = fs::read_to_string(&record_file).expect("invocation record file must exist");
    let lines: Vec<&str> = content.lines().filter(|l| !l.trim().is_empty()).collect();
    assert_eq!(
        lines.len(),
        1,
        "exactly one invocation record must be written"
    );

    let parsed: serde_json::Value =
        serde_json::from_str(lines[0]).expect("record must be valid JSON");
    assert_eq!(parsed["host_kind"], "cli");
    assert_eq!(parsed["operation_id"], "cli.legacy.add");
    assert_eq!(parsed["provider_id"], "legacy-node");
    assert_eq!(parsed["terminal_state"], "succeeded");
    assert_eq!(parsed["dispatched"], true);

    let _ = fs::remove_file(&record_file);
}

/// Regression for red-team's HIGH finding: a leading unlisted option must
/// not be silently skipped while searching for "the real" selector -- R1
/// says the first positional token is always the selector, dash-prefixed
/// or not, so an unrecognized leading option must itself fail R3's
/// unknown-verb check rather than letting the token after it pick a route.
#[test]
fn test_leading_unlisted_option_does_not_bypass_selector_validation() {
    let output = Command::new(fgos_bin())
        .args(["--made-up", "version"])
        .output()
        .expect("failed to execute fgos");

    assert_eq!(
        output.status.code(),
        Some(4),
        "a leading unlisted option must itself fail closed with exit code 4, not be skipped"
    );

    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("unknown verb \"--made-up\""),
        "stderr must name the leading unlisted option as the rejected verb, got: {}",
        stderr
    );
}

/// Regression for red-team's HIGH finding: an absolute `legacyNode.entry`
/// (or `root`) in the manifest must not escape `FGOS_ACTIVE_RELEASE_PATH`.
/// `Path::join` replaces its base entirely when the joined component is
/// itself absolute, so a naive join would silently execute a payload
/// outside the active release.
#[test]
fn test_absolute_manifest_entry_is_rejected() {
    let temp_dir = std::env::temp_dir().join(format!("fgos_test_escape_{}", std::process::id()));
    let release_root = temp_dir.join("release");
    let outside_dir = temp_dir.join("outside");
    fs::create_dir_all(&release_root).unwrap();
    fs::create_dir_all(&outside_dir).unwrap();

    let marker = outside_dir.join("executed.marker");
    let _ = fs::remove_file(&marker);
    let outside_script = outside_dir.join("outside.mjs");
    fs::write(
        &outside_script,
        format!(
            "import fs from 'node:fs';\nfs.writeFileSync({:?}, 'executed');\nprocess.exit(37);\n",
            marker.to_string_lossy()
        ),
    )
    .unwrap();

    let manifest_path = temp_dir.join("manifest.json");
    let mut manifest = valid_dev_manifest();
    manifest["components"]["legacyNode"]["root"] = serde_json::json!("payload");
    manifest["components"]["legacyNode"]["entry"] =
        serde_json::json!(outside_script.to_string_lossy());
    manifest["components"]["legacyNode"]["digest"] = serde_json::json!("sha256:test");
    fs::write(
        &manifest_path,
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();

    let output = Command::new(fgos_bin())
        .arg("add")
        .env("FGOS_ACTIVE_RELEASE_PATH", &release_root)
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .output()
        .expect("failed to execute fgos");

    assert_ne!(
        output.status.code(),
        Some(37),
        "the outside-release script must never actually execute"
    );
    assert!(
        !marker.exists(),
        "the outside-release script must never run, but its marker file was created"
    );

    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("must be relative") || stderr.contains("escapes"),
        "stderr must report the confinement rejection, got: {}",
        stderr
    );

    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_manifest_without_components_legacy_node_is_rejected() {
    let temp_dir = std::env::temp_dir().join(format!(
        "fgos_test_missing_legacy_node_{}",
        std::process::id()
    ));
    let release_root = temp_dir.join("release");
    fs::create_dir_all(&release_root).unwrap();

    let manifest_path = temp_dir.join("manifest.json");
    let manifest = serde_json::json!({
        "schemaVersion": 1,
        "root": ".",
        "entry": "bin/fgos.mjs",
    });
    fs::write(
        &manifest_path,
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();

    let output = Command::new(fgos_bin())
        .arg("add")
        .env("FGOS_ACTIVE_RELEASE_PATH", &release_root)
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .output()
        .expect("failed to execute fgos");

    assert_ne!(output.status.code(), Some(0));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("failed to parse manifest"),
        "stderr must report manifest rejection, got: {}",
        stderr
    );
}

#[test]
fn test_host_manifest_v1_invariants_are_rejected() {
    let temp_dir = std::env::temp_dir().join(format!(
        "fgos_test_manifest_v1_invariants_{}",
        std::process::id()
    ));
    let release_root = temp_dir.join("release");
    fs::create_dir_all(&release_root).unwrap();
    let manifest_path = temp_dir.join("manifest.json");

    let mut schema_version_2 = valid_dev_manifest();
    schema_version_2["schemaVersion"] = serde_json::json!(2);
    let mut entry_repeats_root = valid_dev_manifest();
    entry_repeats_root["components"]["legacyNode"]["root"] = serde_json::json!("payload");
    entry_repeats_root["components"]["legacyNode"]["entry"] =
        serde_json::json!("payload/bin/fgos.mjs");
    let mut migrations = valid_dev_manifest();
    migrations["components"]["legacyNode"]["root"] = serde_json::json!("payload");
    migrations["stateSchemas"]["migrations"] = serde_json::json!(["2-to-1"]);

    let invalid_cases = [
        (
            schema_version_2,
            "manifest schemaVersion is unsupported; expected 1",
        ),
        (
            entry_repeats_root,
            "manifest components.legacyNode.entry must be relative to components.legacyNode.root, not repeat it",
        ),
        (
            migrations,
            "manifest stateSchemas.migrations is reserved in V1 and must be empty",
        ),
    ];

    for (manifest, expected_stderr) in invalid_cases {
        fs::write(
            &manifest_path,
            serde_json::to_string_pretty(&manifest).unwrap(),
        )
        .unwrap();

        let output = Command::new(fgos_bin())
            .arg("add")
            .env("FGOS_ACTIVE_RELEASE_PATH", &release_root)
            .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
            .output()
            .expect("failed to execute fgos");

        assert_ne!(output.status.code(), Some(0));
        let stderr = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr.contains(expected_stderr),
            "stderr must report {expected_stderr:?}, got: {}",
            stderr
        );
    }
}

#[test]
fn test_host_rejects_partial_manifest_missing_required_v1_fields() {
    let temp_dir =
        std::env::temp_dir().join(format!("fgos_test_partial_manifest_{}", std::process::id()));
    let release_root = temp_dir.join("release");
    fs::create_dir_all(&release_root).unwrap();
    let manifest_path = temp_dir.join("manifest.json");
    let mut manifest = valid_dev_manifest();
    manifest.as_object_mut().unwrap().remove("artifactDigest");

    fs::write(
        &manifest_path,
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();

    let output = Command::new(fgos_bin())
        .arg("add")
        .env("FGOS_ACTIVE_RELEASE_PATH", &release_root)
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .output()
        .expect("failed to execute fgos");

    assert_ne!(output.status.code(), Some(0));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("missing field `artifactDigest`"),
        "stderr must report the missing required V1 field, got: {}",
        stderr
    );
}

#[test]
fn test_host_rejects_full_manifest_with_mismatched_file_digest() {
    let temp_dir = std::env::temp_dir().join(format!(
        "fgos_test_manifest_file_digest_mismatch_{}",
        std::process::id()
    ));
    let _ = fs::remove_dir_all(&temp_dir);
    let release_root = temp_dir.join("release");
    fs::create_dir_all(release_root.join("bin")).unwrap();
    fs::copy(
        repo_root().join("bin").join("fgos.mjs"),
        release_root.join("bin").join("fgos.mjs"),
    )
    .unwrap();
    let manifest_path = temp_dir.join("manifest.json");
    let mut manifest = valid_dev_manifest();
    manifest["files"] = serde_json::json!([
        {
            "path": "bin/fgos.mjs",
            "kind": "file",
            "digest": "sha256:0000000000000000000000000000000000000000000000000000000000000000",
            "mode": "755",
            "class": "legacy-node"
        }
    ]);
    let mut without_digest = manifest.clone();
    without_digest
        .as_object_mut()
        .unwrap()
        .remove("artifactDigest");
    let canonical = fgos_distribution::verify::to_canonical_json(&without_digest);
    manifest["artifactDigest"] =
        serde_json::json!(format!("sha256:{:x}", Sha256::digest(canonical.as_bytes())));

    fs::write(
        &manifest_path,
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();

    let output = Command::new(fgos_bin())
        .arg("list")
        .arg("--json")
        .env("FGOS_ACTIVE_RELEASE_PATH", &release_root)
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .output()
        .expect("failed to execute fgos");

    assert_ne!(output.status.code(), Some(0));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("file digest mismatch for bin/fgos.mjs"),
        "stderr must report file digest refusal, got: {}",
        stderr
    );
    assert!(
        !stderr.contains("manifest components.legacyNode.digest mismatch"),
        "failure must not conflate with legacyNode.digest mismatch"
    );

    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_host_rejects_full_manifest_with_legacy_node_digest_only_mismatch() {
    let temp_dir = std::env::temp_dir().join(format!(
        "fgos_test_manifest_legacy_node_digest_mismatch_{}",
        std::process::id()
    ));
    let _ = fs::remove_dir_all(&temp_dir);
    let release_root = temp_dir.join("release");
    fs::create_dir_all(release_root.join("bin")).unwrap();
    fs::copy(
        repo_root().join("bin").join("fgos.mjs"),
        release_root.join("bin").join("fgos.mjs"),
    )
    .unwrap();
    let manifest_path = temp_dir.join("manifest.json");
    let mut manifest = valid_dev_manifest();
    // files[0].digest is correct and matches the file on disk.
    // Only components.legacyNode.digest is mismatched.
    manifest["components"]["legacyNode"]["digest"] = serde_json::json!(
        "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    );
    let mut without_digest = manifest.clone();
    without_digest
        .as_object_mut()
        .unwrap()
        .remove("artifactDigest");
    let canonical = fgos_distribution::verify::to_canonical_json(&without_digest);
    manifest["artifactDigest"] =
        serde_json::json!(format!("sha256:{:x}", Sha256::digest(canonical.as_bytes())));

    fs::write(
        &manifest_path,
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();

    let output = Command::new(fgos_bin())
        .arg("list")
        .arg("--json")
        .env("FGOS_ACTIVE_RELEASE_PATH", &release_root)
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .output()
        .expect("failed to execute fgos");

    assert_ne!(output.status.code(), Some(0));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("manifest components.legacyNode.digest mismatch"),
        "stderr must report legacyNode.digest refusal, got: {}",
        stderr
    );
    assert!(
        !stderr.contains("file digest mismatch"),
        "failure must not conflate with file digest mismatch"
    );
    assert!(
        !stderr.contains("manifest verification failed"),
        "failure must not conflate with artifactDigest mismatch"
    );

    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_host_rejects_full_manifest_with_mismatched_artifact_digest() {
    let temp_dir = std::env::temp_dir().join(format!(
        "fgos_test_manifest_artifact_digest_mismatch_{}",
        std::process::id()
    ));
    let _ = fs::remove_dir_all(&temp_dir);
    let release_root = temp_dir.join("release");
    fs::create_dir_all(release_root.join("bin")).unwrap();
    fs::copy(
        repo_root().join("bin").join("fgos.mjs"),
        release_root.join("bin").join("fgos.mjs"),
    )
    .unwrap();
    let manifest_path = temp_dir.join("manifest.json");
    let mut manifest = valid_dev_manifest();
    // files[] and components.legacyNode are valid, but artifactDigest is corrupted.
    manifest["artifactDigest"] = serde_json::json!(
        "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    );

    fs::write(
        &manifest_path,
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();

    let output = Command::new(fgos_bin())
        .arg("list")
        .arg("--json")
        .env("FGOS_ACTIVE_RELEASE_PATH", &release_root)
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .output()
        .expect("failed to execute fgos");

    assert_ne!(output.status.code(), Some(0));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("manifest verification failed: manifest digest mismatch"),
        "stderr must report artifactDigest refusal, got: {}",
        stderr
    );
    assert!(
        !stderr.contains("file digest mismatch"),
        "failure must not conflate with file digest mismatch"
    );
    assert!(
        !stderr.contains("manifest components.legacyNode.digest mismatch"),
        "failure must not conflate with legacyNode.digest mismatch"
    );

    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_host_rejects_full_manifest_with_path_traversal_before_launch() {
    let temp_dir = std::env::temp_dir().join(format!(
        "fgos_test_manifest_path_traversal_{}",
        std::process::id()
    ));
    let _ = fs::remove_dir_all(&temp_dir);
    let release_root = temp_dir.join("release");
    fs::create_dir_all(release_root.join("bin")).unwrap();
    fs::copy(
        repo_root().join("bin").join("fgos.mjs"),
        release_root.join("bin").join("fgos.mjs"),
    )
    .unwrap();

    let outside_file = temp_dir.join("outside.txt");
    fs::write(&outside_file, b"outside content").unwrap();
    let outside_digest = format!("sha256:{:x}", Sha256::digest(b"outside content"));

    let manifest_path = temp_dir.join("manifest.json");
    let mut manifest = valid_dev_manifest();
    manifest["files"] = serde_json::json!([
        {
            "path": "../outside.txt",
            "kind": "file",
            "digest": outside_digest,
            "mode": "644",
            "class": "immutable-runtime"
        },
        {
            "path": "bin/fgos.mjs",
            "kind": "file",
            "digest": sha256_file(repo_root().join("bin").join("fgos.mjs")),
            "mode": "755",
            "class": "legacy-node"
        }
    ]);
    let mut without_digest = manifest.clone();
    without_digest
        .as_object_mut()
        .unwrap()
        .remove("artifactDigest");
    let canonical = fgos_distribution::verify::to_canonical_json(&without_digest);
    manifest["artifactDigest"] =
        serde_json::json!(format!("sha256:{:x}", Sha256::digest(canonical.as_bytes())));

    fs::write(
        &manifest_path,
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();

    let invocation_record_path = temp_dir.join("invocations.jsonl");

    let output = Command::new(fgos_bin())
        .arg("list")
        .arg("--json")
        .env("FGOS_ACTIVE_RELEASE_PATH", &release_root)
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .env("FGOS_INVOCATION_RECORD_PATH", &invocation_record_path)
        .output()
        .expect("failed to execute fgos");

    assert_ne!(output.status.code(), Some(0));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("path traversal refused in release manifest: ../outside.txt"),
        "stderr must report path traversal refusal, got: {}",
        stderr
    );

    // Confirm rejected before legacy Node launch
    let records_content = fs::read_to_string(&invocation_record_path).unwrap();
    assert!(
        records_content.contains("\"dispatched\":false"),
        "invocation must not have been dispatched to Node"
    );
    assert!(
        records_content.contains("\"terminal_state\":\"admission-refused\""),
        "invocation record must record admission-refused"
    );

    let _ = fs::remove_dir_all(&temp_dir);
}

// Unix only: creating a symlink needs a privilege a Windows runner may lack.
#[cfg(unix)]
#[test]
fn test_host_rejects_manifest_with_in_root_directory_symlink() {
    let temp_dir = std::env::temp_dir().join(format!(
        "fgos_test_manifest_in_root_dir_symlink_{}",
        std::process::id()
    ));
    let _ = fs::remove_dir_all(&temp_dir);
    let release_root = temp_dir.join("release");
    fs::create_dir_all(release_root.join("bin")).unwrap();
    let fgos_mjs_path = release_root.join("bin").join("fgos.mjs");
    fs::copy(repo_root().join("bin").join("fgos.mjs"), &fgos_mjs_path).unwrap();

    #[cfg(unix)]
    std::os::unix::fs::symlink(release_root.join("bin"), release_root.join("link")).unwrap();

    let digest = sha256_file(fgos_mjs_path);
    let manifest_path = temp_dir.join("manifest.json");
    let mut manifest = valid_dev_manifest();
    manifest["files"] = serde_json::json!([
        {
            "path": "link/fgos.mjs",
            "kind": "file",
            "digest": digest,
            "mode": "755",
            "class": "legacy-node"
        }
    ]);
    let mut without_digest = manifest.clone();
    without_digest
        .as_object_mut()
        .unwrap()
        .remove("artifactDigest");
    let canonical = fgos_distribution::verify::to_canonical_json(&without_digest);
    manifest["artifactDigest"] =
        serde_json::json!(format!("sha256:{:x}", Sha256::digest(canonical.as_bytes())));

    fs::write(
        &manifest_path,
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();

    let invocation_record_path = temp_dir.join("invocations.jsonl");

    let output = Command::new(fgos_bin())
        .arg("list")
        .arg("--json")
        .env("FGOS_ACTIVE_RELEASE_PATH", &release_root)
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .env("FGOS_INVOCATION_RECORD_PATH", &invocation_record_path)
        .output()
        .expect("failed to execute fgos");

    assert_ne!(output.status.code(), Some(0));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("symlink refused in release files on disk: link/fgos.mjs"),
        "stderr must report symlink refusal for directory symlink component, got: {}",
        stderr
    );

    let records_content = fs::read_to_string(&invocation_record_path).unwrap();
    assert!(
        records_content.contains("\"dispatched\":false"),
        "invocation must not have been dispatched to Node"
    );
    assert!(
        records_content.contains("\"terminal_state\":\"admission-refused\""),
        "invocation record must record admission-refused"
    );

    let _ = fs::remove_dir_all(&temp_dir);
}

// Unix only: creating a symlink needs a privilege a Windows runner may lack.
#[cfg(unix)]
#[test]
fn test_host_rejects_manifest_with_unlisted_payload_symlink() {
    let temp_dir = std::env::temp_dir().join(format!(
        "fgos_test_manifest_unlisted_payload_symlink_{}",
        std::process::id()
    ));
    let _ = fs::remove_dir_all(&temp_dir);
    let release_root = temp_dir.join("release");
    fs::create_dir_all(release_root.join("bin")).unwrap();
    let real_mjs = release_root.join("bin").join("real_fgos.mjs");
    fs::copy(repo_root().join("bin").join("fgos.mjs"), &real_mjs).unwrap();

    let sym_mjs = release_root.join("bin").join("sym_fgos.mjs");
    #[cfg(unix)]
    std::os::unix::fs::symlink(&real_mjs, &sym_mjs).unwrap();

    let digest = sha256_file(real_mjs.clone());
    let manifest_path = temp_dir.join("manifest.json");
    let mut manifest = valid_dev_manifest();
    manifest["components"]["legacyNode"] = serde_json::json!({
        "root": ".",
        "entry": "bin/sym_fgos.mjs",
        "digest": digest,
    });
    manifest["files"] = serde_json::json!([
        {
            "path": "bin/real_fgos.mjs",
            "kind": "file",
            "digest": digest,
            "mode": "755",
            "class": "legacy-node"
        }
    ]);
    let mut without_digest = manifest.clone();
    without_digest
        .as_object_mut()
        .unwrap()
        .remove("artifactDigest");
    let canonical = fgos_distribution::verify::to_canonical_json(&without_digest);
    manifest["artifactDigest"] =
        serde_json::json!(format!("sha256:{:x}", Sha256::digest(canonical.as_bytes())));

    fs::write(
        &manifest_path,
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();

    let invocation_record_path = temp_dir.join("invocations.jsonl");

    let output = Command::new(fgos_bin())
        .arg("list")
        .arg("--json")
        .env("FGOS_ACTIVE_RELEASE_PATH", &release_root)
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .env("FGOS_INVOCATION_RECORD_PATH", &invocation_record_path)
        .output()
        .expect("failed to execute fgos");

    assert_ne!(output.status.code(), Some(0));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("symlink refused in release files on disk"),
        "stderr must report symlink refusal for unlisted payload symlink, got: {}",
        stderr
    );

    let records_content = fs::read_to_string(&invocation_record_path).unwrap();
    assert!(
        records_content.contains("\"dispatched\":false"),
        "invocation must not have been dispatched to Node"
    );
    assert!(
        records_content.contains("\"terminal_state\":\"admission-refused\""),
        "invocation record must record admission-refused"
    );

    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn native_discussions_reports_owner_voters_and_root_wide_summary_diagnostics() {
    use serde_json::{json, Value};
    let root = std::env::temp_dir().join(format!(
        "fgos-native-discussions-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let assignments = root.join(".fgos/assignments");
    fs::create_dir_all(assignments.join("unit-run-missing")).unwrap();
    let attempt = json!({
        "assignmentId": "unit-run-research/researcher-1/1", "runId": "research-run",
        "executor": "alpha", "provider": "alpha", "persona": "research", "model": "test-model",
        "outcome": "pass", "fallbackFrom": null
    });
    let mut final_attempt = attempt.clone();
    final_attempt["stance"] = json!({"status": "valid", "choice": "a", "confidence": null});
    let mut summary = json!({
        "contract": {"id": "unit-summary", "version": 2},
        "unitRunId": "unit-run-research", "workflow": null,
        "pattern": "research-fan-out", "capability": "analysis", "outcome": "pass",
        "startedAt": "2026-10-05T12:00:00Z", "settledAt": "2026-10-05T12:01:00Z",
        "inline": false, "stanceOptions": ["a", "b"],
        "seats": [
            {"role": "researcher-1", "kind": "panelist", "round": 1, "final": final_attempt, "attempts": [attempt]},
            {"role": "researcher-2", "kind": "panelist", "round": 1, "final": final_attempt, "attempts": [attempt]},
            {"role": "panelist", "kind": "synthesizer", "round": 1, "final": final_attempt, "attempts": [attempt]}
        ]
    });
    for (id, timestamp) in [
        ("unit-run-research", json!("2026-10-05T12:01:00Z")),
        ("unit-run-outside", json!("2026-10-04T12:01:00Z")),
        ("unit-run-undated", Value::Null),
    ] {
        summary["unitRunId"] = json!(id);
        summary["settledAt"] = timestamp;
        let dir = assignments.join(id);
        fs::create_dir_all(&dir).unwrap();
        fs::write(
            dir.join("unit-summary.json"),
            serde_json::to_vec(&summary).unwrap(),
        )
        .unwrap();
    }
    let output = Command::new(fgos_bin())
        .args([
            "metrics",
            "discussions",
            "--since=2026-10-05",
            "--by=executor",
            "--dir",
        ])
        .arg(&root)
        .current_dir(&root)
        .output()
        .expect("failed to execute native discussions");
    let _ = fs::remove_dir_all(&root);
    assert_eq!(
        output.status.code(),
        Some(0),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let envelope: Value = serde_json::from_slice(&output.stdout).expect("native JSON envelope");
    assert_eq!(envelope["contract"], "fgos.v1");
    let report = &envelope["data"];
    assert_eq!(report["totals"]["unitRuns"], 1);
    assert_eq!(report["totals"]["seats"], 3);
    assert_eq!(report["groups"]["alpha"]["unitRuns"], 1);
    assert_eq!(report["units"][0]["unitRunId"], "unit-run-research");
    assert_eq!(report["units"][0]["stanceSeats"], 2);
    assert_eq!(report["units"][0]["stancesValid"], 2);
    assert_eq!(report["units"][0]["agreement"], 1.0);
    assert_eq!(report["units"][0]["genuineSplit"], false);
    assert_eq!(report["summaryDiagnosticsScope"], "root-wide");
    assert_eq!(report["summaryDirsSeen"], 4);
    assert_eq!(report["summariesMissing"], 1);
    assert_eq!(report["summariesUnusable"], 1);
    assert_eq!(
        report["summariesSkippedByReason"],
        json!({"missing-timestamp": 1})
    );
    assert_eq!(report["summariesOutsideWindow"], 1);
}

/// An empty state root of its own, so the machine and session parts of the
/// answer never depend on the machine the tests run on.
fn identity_state_root() -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos_test_identity_state_{}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn identity_command(args: &[&str]) -> Command {
    let mut cmd = Command::new(fgos_bin());
    cmd.arg("identity").args(args);
    cmd.env("FGOS_STATE_ROOT", identity_state_root());
    for key in [
        "FGOS_SESSION_ID",
        "CODEX_THREAD_ID",
        "PI_SESSION_ID",
        "CLAUDE_CODE_SESSION_ID",
    ] {
        cmd.env_remove(key);
    }
    cmd
}

fn identity_data(output: &std::process::Output) -> serde_json::Value {
    assert_eq!(
        output.status.code(),
        Some(0),
        "identity must exit 0, stderr={}",
        String::from_utf8_lossy(&output.stderr)
    );
    let parsed: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("output must be a JSON envelope");
    assert_eq!(parsed["contract"], "fgos.v1");
    parsed["data"].clone()
}

#[test]
fn identity_reports_the_env_session_and_confirms_it_from_the_registry() {
    let dir = std::env::temp_dir().join(format!("fgos_test_identity_{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    fs::write(dir.join("sessions.json"), r#"[{"sessionId":"thread-a"}]"#).unwrap();

    let env_only = identity_command(&[])
        .env("CODEX_THREAD_ID", "thread-a")
        .env("CLAUDE_CODE_SESSION_ID", "claude-b")
        .output()
        .unwrap();
    assert_eq!(
        identity_data(&env_only),
        serde_json::json!({ "id": "thread-a", "source": "env", "machine": null, "session": null })
    );

    let confirmed = identity_command(&["--fgos-dir", dir.to_str().unwrap()])
        .env("CODEX_THREAD_ID", "thread-a")
        .output()
        .unwrap();
    assert_eq!(
        identity_data(&confirmed),
        serde_json::json!({ "id": "thread-a", "source": "registry", "machine": null, "session": null })
    );
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn identity_runs_under_the_recursion_guard() {
    let output = identity_command(&["--json"])
        .env("FGOS_SESSION_ID", "guarded")
        .env("FGOS_RUST_HOST_RECURSION_GUARD", "1")
        .output()
        .unwrap();
    assert_eq!(
        identity_data(&output),
        serde_json::json!({ "id": "guarded", "source": "env", "machine": null, "session": null })
    );
}

#[test]
fn identity_without_env_resolves_from_the_named_caller() {
    let me = std::process::id().to_string();
    let data = identity_data(&identity_command(&["--pid", &me]).output().unwrap());
    assert!(
        matches!(data["source"].as_str(), Some("pid") | Some("unresolved")),
        "unexpected {data}"
    );
    assert!(data["id"].as_u64().unwrap() > 0);
    if cfg!(not(unix)) {
        assert_eq!(data["id"].as_u64().unwrap().to_string(), me);
    }
    // Without --pid the caller is the process that started fgos: this test.
    let implicit = identity_data(&identity_command(&[]).output().unwrap());
    if cfg!(unix) {
        assert_eq!(data, implicit);
    }
}

#[test]
fn identity_rejects_bad_options() {
    for args in [
        vec!["--pid", "0"],
        vec!["--pid", "abc"],
        vec!["--pid"],
        vec!["--fgos-dir="],
        vec!["--unknown"],
    ] {
        let output = identity_command(&args).output().unwrap();
        assert_ne!(output.status.code(), Some(0), "args {args:?} must fail");
        assert!(
            output.stdout.is_empty(),
            "args {args:?} must print no envelope"
        );
    }
}

/// `fgos identity session` and the bare answer's session part over a state
/// root that has a machine id: the wiring of the verb. The handle rules are
/// owned by the identity crate's session tests.
#[test]
fn identity_session_prints_a_stable_handle_per_session_and_refuses_an_unresolved_caller() {
    let state = std::env::temp_dir().join(format!("fgos_test_identity_session_{}", std::process::id()));
    let _ = fs::remove_dir_all(&state);
    fs::create_dir_all(&state).unwrap();
    fs::write(state.join("machine-id"), "fg-server-abc234\n").unwrap();
    let session = |id: &str| {
        identity_data(
            &identity_command(&["session", "--json"])
                .env("FGOS_STATE_ROOT", &state)
                .env("FGOS_SESSION_ID", id)
                .output()
                .unwrap(),
        )
    };
    let (a, b) = (session("a"), session("b"));
    assert_eq!(a["id"], "fg-server-abc234/a");
    assert_ne!(a["handle"], b["handle"]);
    assert_eq!(a, session("a"), "a session's handle never changes");
    assert!(a["handle"].as_str().unwrap().ends_with("@fg-server"));

    let bare = identity_data(
        &identity_command(&["--json"])
            .env("FGOS_STATE_ROOT", &state)
            .env("FGOS_SESSION_ID", "a")
            .output()
            .unwrap(),
    );
    assert_eq!(bare["session"], a);
    assert_eq!(bare["machine"], serde_json::json!({ "id": "fg-server-abc234", "handle": "fg-server" }));

    let unresolved = identity_command(&["session", "--pid", "99999999"])
        .env("FGOS_STATE_ROOT", &state)
        .output()
        .unwrap();
    assert_eq!(unresolved.status.code(), Some(65));
    assert!(unresolved.stdout.is_empty());
    assert!(String::from_utf8_lossy(&unresolved.stderr).contains("[unresolved]"));
    let _ = fs::remove_dir_all(&state);
}

/// The directory verbs over a scratch state root: the wiring (route, the
/// operation per flag, exit codes, that only the explicit flags write). The
/// registration, liveness and contention rules are owned by the identity
/// crate's directory tests.
#[test]
fn identity_directory_registers_only_on_request_and_resolves_by_handle_and_role() {
    let state = std::env::temp_dir().join(format!("fgos_test_identity_directory_{}", std::process::id()));
    let _ = fs::remove_dir_all(&state);
    fs::create_dir_all(&state).unwrap();
    fs::write(state.join("machine-id"), "fg-server-abc234\n").unwrap();
    let run = |id: &str, args: &[&str]| {
        identity_command(args)
            .env("FGOS_STATE_ROOT", &state)
            .env("FGOS_SESSION_ID", id)
            .current_dir(&state)
            .output()
            .unwrap()
    };
    let handle_of = |id: &str| identity_data(&run(id, &["session", "--json"]))["handle"].as_str().unwrap().to_owned();
    let (a, b) = (handle_of("alpha"), handle_of("beta"));
    identity_data(&run("alpha", &["--json"]));
    assert!(!state.join("identity").exists(), "a plain read and the bare verb never register");

    let registered = identity_data(&run("alpha", &["session", "--role", "lead:MAIL", "--json"]));
    assert_eq!(registered["handle"], a.as_str());
    assert_eq!(registered["roles"], serde_json::json!(["lead:MAIL"]));
    identity_data(&run("beta", &["session", "--register", "--json"]));

    assert_eq!(identity_data(&run("beta", &["resolve", &a, "--json"]))["id"], "fg-server-abc234/alpha");
    assert_eq!(identity_data(&run("alpha", &["resolve", "lead:MAIL", "--json"]))["handle"], a.as_str());
    assert_eq!(identity_data(&run("beta", &["resolve", "fg-server-abc234/alpha", "--json"]))["handle"], a.as_str());
    assert_eq!(run("beta", &["resolve", "fg-other-xyz789/alpha"]).status.code(), Some(65));
    assert_eq!(identity_data(&run("beta", &["list", "--json"]))["sessions"].as_array().unwrap().len(), 2);

    let held = run("beta", &["session", "--role", "lead:MAIL"]);
    assert_eq!(held.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&held.stderr).contains("[role-held]"));
    identity_data(&run("beta", &["session", "--role", "lead:MAIL", "--take", "--json"]));
    assert_eq!(identity_data(&run("alpha", &["resolve", "lead:MAIL", "--json"]))["handle"], b.as_str());

    let foreign = run("alpha", &["session", "--drop-role", "lead:MAIL"]);
    assert_eq!(foreign.status.code(), Some(65), "alpha no longer holds the role beta took");
    assert!(String::from_utf8_lossy(&foreign.stderr).contains("[role-not-held]"));
    identity_data(&run("beta", &["session", "--drop-role", "lead:MAIL", "--json"]));
    assert_eq!(run("alpha", &["resolve", "lead:MAIL"]).status.code(), Some(65));

    let missing = run("alpha", &["resolve", "claude-zzzz@fg-server"]);
    assert_eq!(missing.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&missing.stderr).contains("[not-found]"));
    assert!(missing.stdout.is_empty(), "without --json a refusal prints nothing on stdout");

    // With --json the same refusal is also one line of JSON on stdout: the
    // message, the stable reason and the candidates, never a success envelope.
    let near = run("alpha", &["resolve", &a[..10], "--json"]);
    assert_eq!(near.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&near.stderr).contains("[not-found]"));
    let refusal: serde_json::Value = serde_json::from_slice(&near.stdout).expect("a --json refusal is JSON");
    assert_eq!(refusal["reason"], "not-found");
    let candidates = refusal["candidates"].as_array().unwrap();
    assert_eq!(candidates.len(), 1);
    assert_eq!(candidates[0]["id"], "fg-server-abc234/alpha");
    assert_eq!(candidates[0]["handle"], a.as_str());
    assert!(["alive", "unknown"].contains(&candidates[0]["liveness"].as_str().unwrap()));
    assert!(refusal["error"].as_str().unwrap().contains(&a));
    assert!(refusal.get("contract").is_none());
    let _ = fs::remove_dir_all(&state);
}

/// `fgos identity machine` over a scratch state root: the wiring of the verb
/// (route, operation per flag, exit code of a refusal). The id, handle and
/// alias rules are owned by the identity crate's own tests.
#[test]
fn identity_machine_reads_refuses_and_sets_the_alias_through_the_state_root() {
    let state = std::env::temp_dir().join(format!("fgos_test_identity_machine_{}", std::process::id()));
    let _ = fs::remove_dir_all(&state);
    fs::create_dir_all(&state).unwrap();
    let machine = |args: &[&str]| {
        identity_command(&[&["machine"], args].concat())
            .env("FGOS_STATE_ROOT", &state)
            .output()
            .unwrap()
    };

    let missing = machine(&["--json"]);
    assert_eq!(missing.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&missing.stderr).contains("[machine-id-missing]"));
    let refusal: serde_json::Value = serde_json::from_slice(&missing.stdout).unwrap();
    assert_eq!(refusal["reason"], "machine-id-missing", "a refusal under --json is not a success envelope");

    fs::write(state.join("machine-id"), "fg-server-abc234\n").unwrap();
    assert_eq!(
        identity_data(&machine(&["--json"])),
        serde_json::json!({ "id": "fg-server-abc234", "handle": "fg-server", "alias": null, "keyFingerprint": null })
    );
    assert_eq!(
        identity_data(&machine(&["--alias", "owner"])),
        serde_json::json!({ "id": "fg-server-abc234", "handle": "owner", "alias": "owner", "keyFingerprint": null })
    );
    assert_eq!(
        identity_data(&machine(&[]))["handle"],
        serde_json::json!("owner")
    );
    let bad = machine(&["--alias", "Not A Handle"]);
    assert_eq!(bad.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&bad.stderr).contains("[invalid-alias]"));
    assert_eq!(
        fs::read_to_string(state.join("machine-alias")).unwrap().trim(),
        "owner"
    );
    let _ = fs::remove_dir_all(&state);
}

/// `fgos identity pins`: the wiring of the read, `--confirm` and `--forget` (read versus
/// write operation, flag validation, exit code of a refusal). What a pin is and
/// when it is made is owned by the identity crate's signing tests.
#[test]
fn identity_pins_lists_confirms_and_forgets_a_pin_by_machine_id() {
    let state = std::env::temp_dir().join(format!("fgos_test_identity_pins_{}", std::process::id()));
    let _ = fs::remove_dir_all(&state);
    fs::create_dir_all(state.join("identity/pins")).unwrap();
    let pin = serde_json::json!({
        "v": 1, "machineId": "peer-abc234", "publicKey": "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPLegqRm6sBzTw7JLFKGzcduIlAVoH8jcr9dq746BdvU",
        "fingerprint": "SHA256:5wLNh9SwL7zhGNE0qofyBNDQfRFTovOOLn//JmogtF0", "firstSeen": "2026-10-23T00:00:00.000Z"
    });
    fs::write(state.join("identity/pins/peer-abc234"), pin.to_string()).unwrap();
    let pins = |args: &[&str]| {
        identity_command(&[&["pins"], args].concat()).env("FGOS_STATE_ROOT", &state).output().unwrap()
    };

    // A pin file written without `state` lists as `seen`.
    let seen = serde_json::json!({
        "v": 1, "machineId": pin["machineId"], "publicKey": pin["publicKey"], "fingerprint": pin["fingerprint"],
        "firstSeen": pin["firstSeen"], "state": "seen"
    });
    assert_eq!(identity_data(&pins(&["--json"])), serde_json::json!({ "pins": [seen] }));
    let fingerprint = pin["fingerprint"].as_str().unwrap();
    for refused in [
        pins(&["--confirm", "peer-abc234"]),
        pins(&["--fingerprint", fingerprint]),
        pins(&["--confirm", "peer-abc234", "--fingerprint", fingerprint, "--forget", "peer-abc234"]),
    ] {
        assert_ne!(refused.status.code(), Some(0), "--confirm needs --fingerprint and excludes --forget");
    }
    let absent = pins(&["--confirm", "other-abc234", "--fingerprint", fingerprint]);
    assert_eq!(absent.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&absent.stderr).contains("[pin-missing]"));
    let wrong = pins(&["--confirm", "peer-abc234", "--fingerprint", "SHA256:other"]);
    assert_eq!(wrong.status.code(), Some(65));
    let stderr = String::from_utf8_lossy(&wrong.stderr);
    assert!(stderr.contains("[fingerprint-mismatch]") && stderr.contains(fingerprint) && stderr.contains("SHA256:other"), "{stderr}");
    let confirmed = identity_data(&pins(&["--confirm", "peer-abc234", "--fingerprint", fingerprint]));
    assert_eq!(confirmed["confirmed"]["state"], "confirmed");
    assert!(confirmed["confirmed"]["confirmedAt"].is_string());
    assert_eq!(identity_data(&pins(&["--json"]))["pins"][0], confirmed["confirmed"]);
    let pin = confirmed["confirmed"].clone();
    let missing = pins(&["--forget", "other-abc234"]);
    assert_eq!(missing.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&missing.stderr).contains("[pin-not-found]"));
    assert_ne!(pins(&["--forget"]).status.code(), Some(0), "--forget needs a machine id");
    assert_eq!(identity_data(&pins(&["--forget", "peer-abc234"])), serde_json::json!({ "forgotten": pin }));
    assert_eq!(identity_data(&pins(&["--json"])), serde_json::json!({ "pins": [] }));
    let _ = fs::remove_dir_all(&state);
}

/// `fgos identity project` over a scratch repository: the wiring of the verb
/// (route, operation per flag, cwd as the repository, exit code of a refusal,
/// flag validation). The mint rules and refusals are owned by the identity
/// crate's project tests.
#[test]
fn identity_project_reads_mints_once_and_refuses_a_second_mint_through_the_cwd() {
    let base = std::env::temp_dir().join(format!("fgos_test_identity_project_{}", std::process::id()));
    let _ = fs::remove_dir_all(&base);
    let repo = base.join("sample-app");
    fs::create_dir_all(&repo).unwrap();
    let init = Command::new("/usr/bin/git").args(["init", "-q"]).current_dir(&repo).output().unwrap();
    assert!(init.status.success());
    let project = |args: &[&str]| {
        identity_command(&[&["project"], args].concat())
            .env("FGOS_STATE_ROOT", base.join("state"))
            .current_dir(&repo)
            .output()
            .unwrap()
    };

    let missing = project(&["--json"]);
    assert_eq!(missing.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&missing.stderr).contains("[project-id-missing]"));

    let minted = identity_data(&project(&["--init", "--json"]));
    assert_eq!(minted["handle"], "sample-app");
    assert_eq!(minted["file"], ".fgos/project.json");
    assert_eq!(identity_data(&project(&["--json"]))["id"], minted["id"]);

    let again = project(&["--init"]);
    assert_eq!(again.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&again.stderr).contains("[project-id-exists]"));

    let renamed = identity_data(&project(&["--new", "--handle", "other"]));
    assert_ne!(renamed["id"], minted["id"]);
    assert_eq!(renamed["handle"], "other");

    assert_ne!(project(&["--handle", "x"]).status.code(), Some(0), "--handle alone writes nothing");
    assert_ne!(project(&["--init", "--new"]).status.code(), Some(0));
    let _ = fs::remove_dir_all(&base);
}

/// Spawns fgos with a stdin pipe whose writer stays open (what a heredoc, an
/// agent Bash tool, or `sleep 30 | fgos ...` hands the child). Returns the
/// exit status if the child finishes within `limit`, otherwise kills it and
/// returns None.
fn run_with_open_stdin(
    args: &[&str],
    cwd: &std::path::Path,
    limit: std::time::Duration,
) -> Option<std::process::ExitStatus> {
    use std::process::Stdio;
    let mut child = Command::new(fgos_bin())
        .args(args)
        .current_dir(cwd)
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .expect("failed to spawn fgos");
    let _writer = child.stdin.take(); // held open until the end of this function
    let deadline = std::time::Instant::now() + limit;
    loop {
        if let Some(status) = child.try_wait().unwrap() {
            return Some(status);
        }
        if std::time::Instant::now() >= deadline {
            let _ = child.kill();
            let _ = child.wait();
            return None;
        }
        std::thread::sleep(std::time::Duration::from_millis(50));
    }
}

#[test]
fn test_native_verb_without_stdin_payload_ignores_open_inherited_stdin() {
    let temp_dir =
        std::env::temp_dir().join(format!("fgos_test_open_stdin_{}", std::process::id()));
    let _ = fs::remove_dir_all(&temp_dir);
    fs::create_dir_all(&temp_dir).unwrap();

    let status = run_with_open_stdin(
        &[
            "convention",
            "path",
            "--kind",
            "report",
            "--type",
            "x",
            "--slug",
            "y",
            "--json",
        ],
        &temp_dir,
        std::time::Duration::from_secs(20),
    );
    let _ = fs::remove_dir_all(&temp_dir);
    assert!(
        status.is_some(),
        "native verb that takes no stdin blocked on an open inherited stdin"
    );
}

#[test]
fn test_native_verb_with_stdin_payload_still_reads_it() {
    use std::io::Write;
    use std::process::Stdio;
    let temp_dir =
        std::env::temp_dir().join(format!("fgos_test_stdin_payload_{}", std::process::id()));
    let _ = fs::remove_dir_all(&temp_dir);
    fs::create_dir_all(&temp_dir).unwrap();

    let mut child = Command::new(fgos_bin())
        .args(["metrics", "ping", "--dir"])
        .arg(&temp_dir)
        .current_dir(&temp_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("failed to spawn fgos");
    child
        .stdin
        .take()
        .unwrap()
        .write_all(b"hello-payload")
        .unwrap();
    let output = child.wait_with_output().unwrap();
    let _ = fs::remove_dir_all(&temp_dir);
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.contains("hello-payload"),
        "stdin payload must still reach the provider, stdout={stdout} stderr={}",
        String::from_utf8_lossy(&output.stderr)
    );
}

/// The host resolves the state root once and pins it into the Node
/// payload's environment as `FGOS_STATE_ROOT`; a root the caller already
/// pinned is passed through untouched.
#[cfg(unix)]
#[test]
fn host_pins_the_state_root_for_the_node_payload() {
    use std::os::unix::fs::PermissionsExt;
    let manifest_path = ensure_dev_manifest();
    let dir = std::env::temp_dir().join(format!("fgos_test_state_root_{}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    let seen = dir.join("seen.txt");
    let fake_node = dir.join("node");
    fs::write(&fake_node, format!("#!/bin/sh\nprintf '%s' \"$FGOS_STATE_ROOT\" > '{}'\n", seen.display())).unwrap();
    fs::set_permissions(&fake_node, fs::Permissions::from_mode(0o755)).unwrap();
    let path = format!("{}:{}", dir.display(), std::env::var("PATH").unwrap_or_default());
    let run = |pinned: Option<&str>| {
        let mut cmd = Command::new(fgos_bin());
        cmd.args(["add", "--help"])
            .env("PATH", &path)
            .env("FGOS_ACTIVE_RELEASE_PATH", repo_root())
            .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
            .env("FGOS_STATE_HOME", "/custom/state-home")
            .env_remove("FGOS_STATE_ROOT");
        if let Some(root) = pinned {
            cmd.env("FGOS_STATE_ROOT", root);
        }
        let out = cmd.output().unwrap();
        assert_eq!(out.status.code(), Some(0), "{}", String::from_utf8_lossy(&out.stderr));
        fs::read_to_string(&seen).unwrap()
    };
    assert_eq!(run(None), "/custom/state-home");
    assert_eq!(run(Some("/already/pinned")), "/already/pinned");
    let _ = fs::remove_dir_all(&dir);
}

// ---- `fgos config`: one wiring case per verb family; the behaviours are owned by the
// `fgos-config` crate tests, these prove the verbs are routed, projected and exit as documented.

/// A fresh project, home and state root; the state root is left for fgos to create (mode 0700).
fn config_sandbox(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos_test_config_{name}_{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(dir.join("project/.fgos")).unwrap();
    fs::create_dir_all(dir.join("home")).unwrap();
    dir
}

fn config_run(sandbox: &std::path::Path, args: &[&str], confined: bool) -> std::process::Output {
    let mut cmd = Command::new(fgos_bin());
    cmd.arg("config").args(args).arg("--dir").arg(sandbox.join("project"));
    cmd.current_dir(sandbox.join("project"));
    cmd.env("HOME", sandbox.join("home")).env("FGOS_STATE_ROOT", sandbox.join("state"));
    cmd.env("FGOS_SESSION_ID", "config-test-writer");
    cmd.env_remove("FGOS_CONFINED");
    if confined {
        cmd.env("FGOS_CONFINED", "1");
    }
    cmd.output().unwrap()
}

fn config_data(output: &std::process::Output) -> serde_json::Value {
    assert_eq!(
        output.status.code(),
        Some(0),
        "config must exit 0, stderr={}",
        String::from_utf8_lossy(&output.stderr)
    );
    let parsed: serde_json::Value = serde_json::from_slice(&output.stdout).expect("a JSON envelope");
    assert_eq!(parsed["contract"], "fgos.v1");
    parsed["data"].clone()
}

fn config_refusal(output: &std::process::Output) -> String {
    assert_eq!(output.status.code(), Some(65), "stderr={}", String::from_utf8_lossy(&output.stderr));
    String::from_utf8_lossy(&output.stderr).into_owned()
}

#[test]
fn config_show_prints_the_value_with_where_it_came_from() {
    let sandbox = config_sandbox("show");
    fs::write(sandbox.join("project/.fgos/config.yaml"), "gateBypass:\n  level: light\n").unwrap();
    let shown = config_data(&config_run(&sandbox, &["show", "--path", "gateBypass.level", "--json"], false));
    assert_eq!(shown["value"], "light");
    assert_eq!(shown["provenance"][0]["layer"], "project");
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn config_explain_and_standard_describe_a_key_without_a_secret_value() {
    let sandbox = config_sandbox("explain");
    let explained = config_data(&config_run(&sandbox, &["explain", "gateway.token"], false));
    assert_eq!(explained["scope"], "global-only");
    assert_eq!(explained["sensitivity"], "secret-value");
    let fragment = config_data(&config_run(&sandbox, &["standard", "--path", "gateway.port"], false));
    assert!(fragment["fragment"].as_str().unwrap().contains("port: 4170"));
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn config_check_fails_on_a_fail_row_and_prints_the_row_without_the_value() {
    let sandbox = config_sandbox("check");
    // A machine with its private directory and token file in order checks clean.
    let private = sandbox.join("home/.fgos/private");
    fs::create_dir_all(&private).unwrap();
    fs::write(private.join("gateway-token"), "0123456789abcdef\n").unwrap();
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&private, fs::Permissions::from_mode(0o700)).unwrap();
        fs::set_permissions(private.join("gateway-token"), fs::Permissions::from_mode(0o600)).unwrap();
    }
    assert_eq!(config_data(&config_run(&sandbox, &["check"], false))["ok"], true);
    fs::write(sandbox.join("project/.fgos/config.yaml"), "gateway:\n  port: 49999\n").unwrap();
    let output = config_run(&sandbox, &["check", "--json"], false);
    assert_eq!(output.status.code(), Some(65));
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("config-schema"), "{stdout}");
    assert!(!stdout.contains("49999"), "a finding never carries a value: {stdout}");
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn config_set_unset_and_patch_write_through_the_transaction_and_record_the_reason() {
    let sandbox = config_sandbox("write");
    let file = sandbox.join("project/.fgos/config.yaml");
    let set = |reason: &str| config_run(&sandbox, &["set", "gateBypass.level", "light", "--reason", reason], false);
    assert_eq!(config_data(&set("light gates while auditing"))["applied"][0]["path"], "gateBypass.level");
    let text = fs::read_to_string(&file).unwrap();
    assert!(text.contains("@fgos:why [config-test-writer] light gates while auditing"), "{text}");
    let shown = config_data(&config_run(&sandbox, &["show", "--path", "gateBypass.level"], false));
    assert_eq!(shown["value"], "light");
    assert!(config_refusal(&config_run(&sandbox, &["set", "gateBypass.level", "heavy"], false))
        .contains("config-comment-reason-required"));
    // The note on the key is not dropped silently.
    let plain = config_run(&sandbox, &["unset", "gateBypass.level", "--reason", "back to the standard"], false);
    assert_eq!(plain.status.code(), Some(65));
    assert!(config_refusal(&plain).contains("pass --acknowledge-comment-loss"));
    let ack = ["unset", "gateBypass.level", "--reason", "back to the standard", "--acknowledge-comment-loss"];
    assert_eq!(config_data(&config_run(&sandbox, &ack, false))["applied"][0]["unset"], true);
    let patch = sandbox.join("patch.yaml");
    fs::write(&patch, "- set: gateBypass.level\n  value: standard\n- set: cleanup.enabled\n  value: true\n").unwrap();
    let applied = config_data(&config_run(&sandbox, &["patch", patch.to_str().unwrap(), "--reason", "tune both"], false));
    assert_eq!(applied["applied"].as_array().unwrap().len(), 2);
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn config_writes_are_refused_for_a_confined_session_before_any_file_is_read() {
    let sandbox = config_sandbox("confined");
    let output = config_run(&sandbox, &["set", "gateBypass.level", "light", "--reason", "should not land"], true);
    assert!(config_refusal(&output).contains("config-write-confined"));
    assert!(!sandbox.join("project/.fgos/config.yaml").exists());
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn config_migrate_converts_a_legacy_project_file_and_leaves_the_tombstone() {
    let sandbox = config_sandbox("migrate");
    let json = sandbox.join("project/.fgos/config.json");
    fs::write(&json, "{\"gateBypass\":{\"level\":\"light\"},\"gateway\":{\"port\":4170,\"token\":null}}\n").unwrap();
    let dry = config_data(&config_run(&sandbox, &["migrate", "--dry-run"], false));
    assert_eq!(dry["kept"][0], "gateBypass.level");
    assert!(!sandbox.join("project/.fgos/config.yaml").exists());
    let done = config_data(&config_run(&sandbox, &["migrate"], false));
    assert_eq!(done["dryRun"], false);
    assert!(fs::read_to_string(&json).unwrap().starts_with("moved to .fgos/config.yaml"));
    let yaml = fs::read_to_string(sandbox.join("project/.fgos/config.yaml")).unwrap();
    assert!(yaml.contains("[migrate] carried over from config.json"), "{yaml}");
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn config_migrate_global_copies_first_and_refuses_the_removal_without_the_machine_check() {
    let sandbox = config_sandbox("global");
    fs::create_dir_all(sandbox.join("home/.fgos")).unwrap();
    let global = sandbox.join("home/.fgos/config.json");
    let legacy = "{\"runner\":{\"llmAccounts\":{\"claude\":{\"work\":{\"login\":\"~/.claude-work\"}}}}}\n";
    fs::write(&global, legacy).unwrap();
    let copied = config_data(&config_run(&sandbox, &["migrate", "--global"], false));
    assert_eq!(copied["stage"], "copy");
    assert!(sandbox.join("home/.fgos/private/accounts.yaml").exists());
    assert_eq!(fs::read_to_string(&global).unwrap(), legacy, "stage 1 keeps the source");
    let refused = config_run(&sandbox, &["migrate", "--global", "--finish"], false);
    assert!(config_refusal(&refused).contains("config-machine-check-required"));
    let finished = config_data(&config_run(&sandbox, &["migrate", "--global", "--finish", "--machine-checked"], false));
    assert_eq!(finished["stage"], "finish");
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn config_refresh_docs_rewrites_doc_lines_once_and_then_has_nothing_to_do() {
    let sandbox = config_sandbox("refresh");
    let file = sandbox.join("project/.fgos/config.yaml");
    fs::write(&file, "gateBypass:\n  level: light\n").unwrap();
    let first = config_data(&config_run(&sandbox, &["refresh-docs"], false));
    assert_eq!(first["nothingToDo"], false);
    assert!(fs::read_to_string(&file).unwrap().contains("# @fgos:doc Gate bypass level"));
    assert_eq!(config_data(&config_run(&sandbox, &["refresh-docs"], false))["nothingToDo"], true);
    let _ = fs::remove_dir_all(&sandbox);
}
