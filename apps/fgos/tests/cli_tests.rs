//! Integration tests for `apps/fgos`.
//!
//! Verifies:
//! - R3: Unlisted selector fails closed with exit code 4.
//! - R5/R10: Recursion trap test (fails closed when recursion guard is set).
//! - R11: Process-spy test (exactly one node child process spawned per legacy invocation).
//! - R6: Native `version` selector fails closed with SelectionRefused pre-Phase-08.
//! - R7: Invocation record sink writes exactly one record when configured.

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

fn ensure_dev_manifest() -> PathBuf {
    let root = repo_root();
    let target = root.join("target");
    let manifest_path = target.join("dev-manifest.json");
    if !manifest_path.exists() {
        let manifest = serde_json::json!({
            "schemaVersion": 1,
            "root": ".",
            "entry": "bin/fgos.mjs",
            "entries": {
                "fgos": "target/debug/fgos",
            },
            "components": {
                "legacyNode": {
                    "root": ".",
                    "entry": "bin/fgos.mjs",
                },
            },
        });
        fs::create_dir_all(&target).unwrap();
        fs::write(
            &manifest_path,
            serde_json::to_string_pretty(&manifest).unwrap(),
        )
        .unwrap();
    }
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
fn test_native_version_fails_closed_with_selection_refused() {
    let output = Command::new(fgos_bin())
        .arg("version")
        .output()
        .expect("failed to execute fgos");

    assert_ne!(
        output.status.code(),
        Some(0),
        "native version must fail closed pre-Phase-08 with non-zero exit code"
    );

    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("selection refused") && stderr.contains("no binding"),
        "stderr must report selection refused (no binding), got: {}",
        stderr
    );
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
            "require('fs').writeFileSync({:?}, 'executed');\nprocess.exit(37);\n",
            marker.to_string_lossy()
        ),
    )
    .unwrap();

    let manifest_path = temp_dir.join("manifest.json");
    let manifest = serde_json::json!({
        "schemaVersion": 1,
        "components": {
            "legacyNode": {
                "root": "payload",
                "entry": outside_script.to_string_lossy(),
            },
        },
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
