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
use std::path::{Path, PathBuf};
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
    for args in [vec!["not-a-real-selector"], vec!["nosuch", "--help"]] {
        let output = Command::new(fgos_bin())
            .args(&args)
            .output()
            .expect("failed to execute fgos");

        assert_eq!(
            output.status.code(),
            Some(4),
            "unlisted selector must fail closed with exit code 4: {args:?}"
        );

        let stderr = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr.contains(&format!("unknown verb \"{}\"", args[0])),
            "stderr must name the unknown verb, got: {}",
            stderr
        );
    }
}

#[test]
fn an_unknown_flag_on_a_native_verb_writes_one_record_in_the_callers_store_and_names_it() {
    let base = std::env::temp_dir().join(format!("fgos-doors-cli-{}", std::process::id()));
    let _ = fs::remove_dir_all(&base);
    let (project, other) = (base.join("project"), base.join("other"));
    for dir in [&project, &other] {
        fs::create_dir_all(dir.join(".git")).unwrap();
        fs::create_dir_all(dir.join(".fgos")).unwrap();
    }
    let output = Command::new(fgos_bin())
        .current_dir(&project)
        .env("HOME", &base)
        .args(["config", "show", "--bogus", "--dir"])
        .arg(&other)
        .output()
        .expect("failed to execute fgos");
    assert_eq!(output.status.code(), Some(4));
    let log = fs::canonicalize(&project)
        .unwrap()
        .join(".fgos/logs/invocation-faults.jsonl");
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.ends_with(&format!(
            "fgos: invocation fault recorded to {}\n",
            log.display()
        )),
        "{stderr}"
    );
    let records = fs::read_to_string(&log).unwrap();
    assert_eq!(records.lines().count(), 1, "{records}");
    assert!(
        records.contains("\"faultClass\":\"unknown-flag\""),
        "{records}"
    );
    assert!(
        !other.join(".fgos/logs").exists(),
        "the project --dir names never receives the record of a call that failed before it was read"
    );
    let _ = fs::remove_dir_all(&base);
}

#[test]
fn version_flag_prints_one_line_with_the_version_the_verb_reports() {
    let flag = Command::new(fgos_bin())
        .arg("--version")
        .output()
        .expect("failed to execute fgos");
    let verb = Command::new(fgos_bin())
        .arg("version")
        .output()
        .expect("failed to execute fgos");

    assert_eq!(flag.status.code(), Some(0), "--version must exit 0");
    let envelope: serde_json::Value =
        serde_json::from_slice(&verb.stdout).expect("the version verb keeps the envelope");
    let version = envelope["data"]["packageVersion"]
        .as_str()
        .expect("the version verb reports a version");
    assert_eq!(
        String::from_utf8_lossy(&flag.stdout),
        format!("fgos {version}\n"),
        "--version is one line, `fgos <version>`"
    );
}

#[test]
fn no_arguments_print_get_started_and_exit_0() {
    let output = Command::new(fgos_bin())
        .output()
        .expect("failed to execute fgos");

    assert_eq!(output.status.code(), Some(0));
    let stdout = String::from_utf8_lossy(&output.stdout);
    for needle in [
        "Get started",
        "curl -fsSL",
        "fgctl init",
        "fgos run",
        "Agents / automation",
        "fgos doctor --json",
    ] {
        assert!(stdout.contains(needle), "missing {needle:?} in: {stdout}");
    }
    assert!(output.stderr.is_empty(), "get started is stdout only");
}

#[test]
fn a_retired_verb_answers_unknown_verb_for_a_call_and_for_its_help() {
    for args in [
        vec!["setup"],
        vec!["setup", "--pretty"],
        vec!["setup", "--help"],
    ] {
        let output = Command::new(fgos_bin())
            .args(&args)
            .output()
            .expect("failed to execute fgos");

        assert_eq!(output.status.code(), Some(4), "{args:?}");
        let stderr = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr.contains("unknown verb \"setup\""),
            "{args:?}: {stderr}"
        );
        assert!(output.stdout.is_empty(), "{args:?}");
    }
}

#[test]
fn a_near_miss_verb_is_refused_with_a_suggestion() {
    let output = Command::new(fgos_bin())
        .arg("doctr")
        .output()
        .expect("failed to execute fgos");

    assert_eq!(output.status.code(), Some(4));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(stderr.contains("unknown verb \"doctr\""), "{stderr}");
    assert!(stderr.contains("did you mean `fgos doctor`"), "{stderr}");
}

#[test]
fn a_verb_with_no_near_miss_gets_no_suggestion() {
    let output = Command::new(fgos_bin())
        .arg("not-a-real-selector")
        .output()
        .expect("failed to execute fgos");

    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(!stderr.contains("did you mean"), "{stderr}");
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

/// A temporary directory holding a `node` wrapper that logs one `SPY_PID:` line per start and then runs the
/// real `node`; returns the directory, its log file and a `PATH` that finds the wrapper first.
#[cfg(unix)]
fn node_spy_dir(prefix: &str) -> (PathBuf, PathBuf, String) {
    use std::os::unix::fs::PermissionsExt;
    let temp_dir = std::env::temp_dir().join(format!("{prefix}_{}", std::process::id()));
    fs::create_dir_all(&temp_dir).unwrap();
    let spy_log = temp_dir.join("spy_log.txt");
    let _ = fs::remove_file(&spy_log);
    let which_out = Command::new("which")
        .arg("node")
        .output()
        .expect("which node must succeed");
    let real_node = String::from_utf8_lossy(&which_out.stdout)
        .trim()
        .to_string();
    let spy_script = temp_dir.join("node");
    let script_content = format!(
        "#!/bin/sh\necho \"SPY_PID:$$\" >> \"{}\"\nexec \"{real_node}\" \"$@\"\n",
        spy_log.display(),
    );
    fs::write(&spy_script, script_content).unwrap();
    let mut perms = fs::metadata(&spy_script).unwrap().permissions();
    perms.set_mode(0o755);
    fs::set_permissions(&spy_script, perms).unwrap();
    let original_path = std::env::var("PATH").unwrap_or_default();
    let modified_path = format!("{}:{}", temp_dir.display(), original_path);
    (temp_dir, spy_log, modified_path)
}

// Help needs no Node: every help form is answered by the host from its embedded manifest, so the `node`
// wrapper on PATH is never started, for a legacy verb, a native verb and the `hook` raw-argv verb alike, and
// no release or payload has to be named.
#[cfg(unix)]
#[test]
fn test_every_help_form_starts_no_node() {
    let (temp_dir, spy_log, path) = node_spy_dir("fgos_test_help_spy");
    let forms: &[&[&str]] = &[
        &["--help"],
        &["-h"],
        &["--help", "--json"],
        &["-h", "--json"],
        &["--help", "dispatch", "decide", "--json"],
        &["add", "--help"],
        &["add", "-h", "--json"],
        &["dispatch", "decide", "--help", "--json"],
        &["config", "--help"],
        &["config", "show", "-h", "--json"],
        &["metrics", "--help", "--json"],
        &["hook", "mailbox", "--help"],
        &["hook", "mailbox", "--help", "--json"],
        &["workflow", "--help"],
    ];
    for args in forms {
        let output = Command::new(fgos_bin())
            .args(*args)
            .env("PATH", &path)
            .env_remove("FGOS_ACTIVE_RELEASE_PATH")
            .env_remove("FGOS_ACTIVE_MANIFEST_PATH")
            .output()
            .expect("failed to execute fgos");
        assert_eq!(
            output.status.code(),
            Some(0),
            "{args:?}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        assert!(!output.stdout.is_empty(), "{args:?} printed no help");
        assert!(
            output.stderr.is_empty(),
            "{args:?}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        let starts = fs::read_to_string(&spy_log).unwrap_or_default();
        assert!(starts.is_empty(), "{args:?} started node: {starts}");
    }
    let _ = fs::remove_dir_all(&temp_dir);
}

// Unix only: the spy is a `sh` wrapper script and symlinks need no privilege.
#[cfg(unix)]
#[test]
fn test_one_node_child_process_spy() {
    let manifest_path = ensure_dev_manifest();
    let root = repo_root();

    // Create a temporary directory containing a spy `node` wrapper script.
    let (temp_dir, spy_log, modified_path) = node_spy_dir("fgos_test_spy");

    let output = Command::new(fgos_bin())
        .args(["workflow", "list"])
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

// The gateway verbs run in the host with no Node: a `node` wrapper on PATH is never started, and a project with
// no registry answers "not running" with the Node CLI's envelope.
#[cfg(unix)]
#[test]
fn gateway_status_and_stop_of_a_fresh_project_start_no_node_and_answer_not_running() {
    let (spy_dir, spy_log, path) = node_spy_dir("fgos_test_gateway_spy");
    let project = spy_dir.join("project");
    fs::create_dir_all(project.join(".fgos")).unwrap();
    let home = spy_dir.join("home");
    fs::create_dir_all(&home).unwrap();
    let run = |sub: &str| {
        Command::new(fgos_bin())
            .args(["gateway", sub])
            .current_dir(&project)
            .env("PATH", &path)
            .env("HOME", &home)
            .output()
            .expect("failed to execute fgos")
    };
    for (sub, expected) in [
        (
            "status",
            serde_json::json!({"running": false, "reachable": false}),
        ),
        ("stop", serde_json::json!({"alreadyStopped": true})),
    ] {
        let output = run(sub);
        assert_eq!(
            output.status.code(),
            Some(0),
            "gateway {sub}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        let parsed: serde_json::Value =
            serde_json::from_slice(&output.stdout).expect("output must be a JSON envelope");
        assert_eq!(parsed["contract"], "fgos.v1");
        assert_eq!(parsed["data"], expected, "gateway {sub}");
    }
    let spied = fs::read_to_string(&spy_log).unwrap_or_default();
    assert!(
        spied.lines().all(|line| !line.starts_with("SPY_PID:")),
        "gateway status and stop started node: {spied}"
    );
    assert!(
        !spy_dir.join(".fgos").exists(),
        "the call wrote a store above its own project"
    );
    let _ = fs::remove_dir_all(&spy_dir);
}

#[test]
fn test_legacy_exec_invocation_record_sink() {
    let manifest_path = ensure_dev_manifest();
    let root = repo_root();

    let record_file =
        std::env::temp_dir().join(format!("fgos_test_rec_{}.jsonl", std::process::id()));
    let _ = fs::remove_file(&record_file);

    let output = Command::new(fgos_bin())
        .args(["workflow", "list"])
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
    assert_eq!(parsed["operation_id"], "cli.legacy.workflow");
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

fn run_host_list(release_root: &Path, manifest_path: &Path) -> std::process::Output {
    Command::new(fgos_bin())
        .arg("list")
        .arg("--json")
        .env("FGOS_ACTIVE_RELEASE_PATH", release_root)
        .env("FGOS_ACTIVE_MANIFEST_PATH", manifest_path)
        .output()
        .expect("failed to execute fgos")
}

#[test]
fn test_host_rejects_tampered_native_addon_byte() {
    let temp_dir =
        std::env::temp_dir().join(format!("fgos_test_addon_tamper_{}", std::process::id()));
    let _ = fs::remove_dir_all(&temp_dir);
    let release_root = temp_dir.join("release");
    fs::create_dir_all(release_root.join("bin")).unwrap();
    fs::create_dir_all(release_root.join("native")).unwrap();
    fs::copy(
        repo_root().join("bin").join("fgos.mjs"),
        release_root.join("bin").join("fgos.mjs"),
    )
    .unwrap();
    fs::write(
        release_root.join("native").join("fgos.node"),
        b"tampered addon",
    )
    .unwrap();
    let declared = format!("{:x}", Sha256::digest(b"addon bytes"));
    let mut manifest = valid_dev_manifest();
    manifest["components"]["nativeAddon"] = serde_json::json!({
        "capabilities": ["git-wal-v1"],
        "path": "native/fgos.node",
        "digest": declared,
        "target": "linux-x64",
        "napiVersion": 8,
        "crateChecksums": fgos_distribution::manifest::native_addon_crate_checksums(),
    });
    manifest["files"]
        .as_array_mut()
        .unwrap()
        .push(serde_json::json!({
            "path": "native/fgos.node",
            "kind": "file",
            "digest": format!("sha256:{declared}"),
            "mode": "644",
            "class": "immutable-runtime",
        }));
    manifest.as_object_mut().unwrap().remove("artifactDigest");
    let canonical = fgos_distribution::verify::to_canonical_json(&manifest);
    manifest["artifactDigest"] =
        serde_json::json!(format!("sha256:{:x}", Sha256::digest(canonical.as_bytes())));
    let manifest_path = temp_dir.join("manifest.json");
    fs::write(
        &manifest_path,
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .unwrap();

    let output = run_host_list(&release_root, &manifest_path);

    assert_ne!(output.status.code(), Some(0));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("file digest mismatch for native/fgos.node"),
        "stderr must report the addon digest refusal, got: {}",
        stderr
    );

    let _ = fs::remove_dir_all(&temp_dir);
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

    let output = run_host_list(&release_root, &manifest_path);

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
        "stanceOptions": ["a", "b"],
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
            "--since",
            "2026-10-05",
            "--by",
            "executor",
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
    // An empty home, so the machine's real global config never decides a case.
    let home = identity_state_root().with_extension("home");
    fs::create_dir_all(&home).unwrap();
    cmd.env("HOME", home).env_remove("XDG_CONFIG_HOME");
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
        vec!["--fgos-dir", ""],
        vec!["--pid=7"],
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
    let state =
        std::env::temp_dir().join(format!("fgos_test_identity_session_{}", std::process::id()));
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
    assert_eq!(
        bare["machine"],
        serde_json::json!({ "id": "fg-server-abc234", "handle": "fg-server" })
    );

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
    let state = std::env::temp_dir().join(format!(
        "fgos_test_identity_directory_{}",
        std::process::id()
    ));
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
    let handle_of = |id: &str| {
        identity_data(&run(id, &["session", "--json"]))["handle"]
            .as_str()
            .unwrap()
            .to_owned()
    };
    let (a, b) = (handle_of("alpha"), handle_of("beta"));
    identity_data(&run("alpha", &["--json"]));
    assert!(
        !state.join("identity").exists(),
        "a plain read and the bare verb never register"
    );

    let registered = identity_data(&run("alpha", &["session", "--role", "lead:MAIL", "--json"]));
    assert_eq!(registered["handle"], a.as_str());
    assert_eq!(registered["roles"], serde_json::json!(["lead:MAIL"]));
    identity_data(&run("beta", &["session", "--register", "--json"]));

    assert_eq!(
        identity_data(&run("beta", &["resolve", &a, "--json"]))["id"],
        "fg-server-abc234/alpha"
    );
    assert_eq!(
        identity_data(&run("alpha", &["resolve", "lead:MAIL", "--json"]))["handle"],
        a.as_str()
    );
    assert_eq!(
        identity_data(&run(
            "beta",
            &["resolve", "fg-server-abc234/alpha", "--json"]
        ))["handle"],
        a.as_str()
    );
    assert_eq!(
        run("beta", &["resolve", "fg-other-xyz789/alpha"])
            .status
            .code(),
        Some(65)
    );
    assert_eq!(
        identity_data(&run("beta", &["list", "--json"]))["sessions"]
            .as_array()
            .unwrap()
            .len(),
        2
    );

    let held = run("beta", &["session", "--role", "lead:MAIL"]);
    assert_eq!(held.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&held.stderr).contains("[role-held]"));
    identity_data(&run(
        "beta",
        &["session", "--role", "lead:MAIL", "--take", "--json"],
    ));
    assert_eq!(
        identity_data(&run("alpha", &["resolve", "lead:MAIL", "--json"]))["handle"],
        b.as_str()
    );

    let foreign = run("alpha", &["session", "--drop-role", "lead:MAIL"]);
    assert_eq!(
        foreign.status.code(),
        Some(65),
        "alpha no longer holds the role beta took"
    );
    assert!(String::from_utf8_lossy(&foreign.stderr).contains("[role-not-held]"));
    identity_data(&run(
        "beta",
        &["session", "--drop-role", "lead:MAIL", "--json"],
    ));
    assert_eq!(
        run("alpha", &["resolve", "lead:MAIL"]).status.code(),
        Some(65)
    );

    identity_data(&run(
        "alpha",
        &["session", "--role", "work:tsk-4f2a9c1b3d", "--json"],
    ));
    assert_eq!(
        identity_data(&run("beta", &["resolve", "work:tsk-4f2a9c1b3d", "--json"]))["handle"],
        a.as_str()
    );
    let bad_work = run("beta", &["session", "--role", "work:Tsk-1"]);
    assert_eq!(bad_work.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&bad_work.stderr).contains("[invalid-role]"));

    let missing = run("alpha", &["resolve", "claude-zzzz@fg-server"]);
    assert_eq!(missing.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&missing.stderr).contains("[not-found]"));
    assert!(
        missing.stdout.is_empty(),
        "without --json a refusal prints nothing on stdout"
    );

    // With --json the same refusal is also one line of JSON on stdout: the
    // message, the stable reason and the candidates, never a success envelope.
    let near = run("alpha", &["resolve", &a[..10], "--json"]);
    assert_eq!(near.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&near.stderr).contains("[not-found]"));
    let refusal: serde_json::Value =
        serde_json::from_slice(&near.stdout).expect("a --json refusal is JSON");
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

/// The wiring of the shared directory over real clones: `--register` appends
/// one `identity.session-published` to the clone's Event Store, and `resolve`
/// answers a session another machine published after one sync. The signature,
/// fold and role rules are owned by the identity crate's shared tests.
#[cfg(unix)]
#[test]
fn identity_register_publishes_and_resolve_answers_a_session_of_another_machine() {
    use fgos_event_store::{
        append::{append, AppendRequest, EventInput},
        layout::{Layout, StreamId},
        registry::Registry,
        sync::{sync, SyncRequest},
    };
    use fgos_git::{GitDriver, ResolveRepo};
    use fgos_identity::shared::{published_payload, MachineRef};
    use std::os::unix::fs::PermissionsExt;

    let world =
        std::env::temp_dir().join(format!("fgos_test_identity_shared_{}", std::process::id()));
    let _ = fs::remove_dir_all(&world);
    fs::create_dir_all(&world).unwrap();
    fs::set_permissions(&world, fs::Permissions::from_mode(0o700)).unwrap();
    let git = |dir: &std::path::Path, args: &[&str]| {
        let out = Command::new("git")
            .arg("-C")
            .arg(dir)
            .args(args)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "git {args:?}: {}",
            String::from_utf8_lossy(&out.stderr)
        );
    };
    let remote = world.join("remote.git");
    git(&world, &["init", "--bare", "-q", remote.to_str().unwrap()]);
    let machine_state = |name: &str, machine_id: &str| {
        let state = world.join(format!("state-{name}"));
        fs::create_dir_all(&state).unwrap();
        fs::set_permissions(&state, fs::Permissions::from_mode(0o700)).unwrap();
        fs::write(state.join("machine-id"), format!("{machine_id}\n")).unwrap();
        fgos_identity::signing::mint_key(&state).unwrap();
        state
    };
    let project_id = "0123456789abcdef0123456789abcdef";
    let driver = GitDriver::new(&world).unwrap();
    // A clone of a migrated project: the `.fgos/events` fence is there, but this clone never appended,
    // so it has no store yet; its first identity publish creates it.
    let clone = |name: &str| {
        let root = world.join(name);
        git(
            &world,
            &[
                "clone",
                "-q",
                remote.to_str().unwrap(),
                root.to_str().unwrap(),
            ],
        );
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        fs::create_dir_all(root.join(".fgos")).unwrap();
        fs::write(
            root.join(".fgos/project.json"),
            format!(r#"{{"v":1,"projectId":"{project_id}","handle":"demo","createdAt":"2026-10-24T00:00:00.000Z"}}"#),
        )
        .unwrap();
        let fence = root.join(".fgos/locks/activation.lock");
        fs::create_dir_all(&fence).unwrap();
        fs::write(
            fence.join("TOMBSTONE"),
            "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
        )
        .unwrap();
        let repo = match driver.resolve_repo(&root, &root).unwrap() {
            ResolveRepo::Repository(repo) => repo,
            _ => panic!("a clone is a repository"),
        };
        let layout = Layout::from_common_dir(Some(repo.common_dir())).unwrap();
        fs::create_dir_all(layout.root.join("locks")).unwrap();
        for dir in [layout.common_dir.join("fgos"), layout.root.join("locks")] {
            fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).unwrap();
        }
        fgos_git::RepositoryConfig::ensure_fetch_mapping(
            &driver,
            &repo,
            "origin",
            &fgos_git::publication_fetch_mappings("origin").unwrap(),
            "test-mapping-setup",
        )
        .unwrap();
        fs::write(root.join(".fgos/events"), "fence\n").unwrap();
        (root, repo, layout)
    };
    let sync_clone = |repo: &fgos_git::RepoHandle, layout: &Layout, machine: &str| {
        sync(
            &driver,
            repo,
            SyncRequest {
                layout,
                machine,
                remote: "origin",
                no_push: false,
                opportunistic: false,
                held_ranks: &[],
                hot_lock_depth: 0,
            },
        )
        .unwrap();
    };
    let (alpha_state, bravo_state) = (
        machine_state("alpha", "alpha-aaaaaa"),
        machine_state("bravo", "bravo-bbbbbb"),
    );
    let (alpha_root, alpha_repo, alpha_layout) = clone("alpha");
    let (bravo_root, bravo_repo, bravo_layout) = clone("bravo");
    let _ = bravo_root;

    let run = |args: &[&str]| {
        identity_command(args)
            .env("FGOS_STATE_ROOT", &alpha_state)
            .env("FGOS_SESSION_ID", "alpha-session")
            .current_dir(&alpha_root)
            .output()
            .unwrap()
    };
    let published_in_alpha = || {
        let active = alpha_layout
            .stream(&StreamId::parse("project:identity").unwrap())
            .active();
        fs::read_to_string(active)
            .map_or(0, |text| text.matches("identity.session-published").count())
    };
    assert!(
        !alpha_layout.store().exists(),
        "the clone has never appended"
    );
    identity_data(&run(&[
        "session",
        "--register",
        "--role",
        "lead:WORK",
        "--json",
    ]));
    assert_eq!(
        published_in_alpha(),
        1,
        "a new registration in a migrated clone without a store creates it and publishes once"
    );
    identity_data(&run(&[
        "session",
        "--register",
        "--role",
        "lead:WORK",
        "--json",
    ]));
    assert_eq!(
        published_in_alpha(),
        1,
        "an unchanged registration publishes nothing"
    );

    // Bravo publishes a session with its own key into its clone and pushes it.
    let listed = fgos_identity::directory::Listed {
        id: "bravo-bbbbbb/sess".into(),
        handle: "claude-sess@bravo".into(),
        cli: "claude".into(),
        project_id: Some(project_id.into()),
        clone: None,
        registered_at: "2026-10-24T01:00:00.000Z".into(),
        roles: vec!["lead:MAIL".into()],
        liveness: fgos_identity::refusal::Liveness::Alive,
        remote: None,
    };
    let payload = published_payload(
        &bravo_state,
        &listed,
        &MachineRef {
            id: "bravo-bbbbbb".into(),
            handle: "bravo".into(),
        },
    )
    .unwrap();
    let registry = Registry::shipped().unwrap();
    let sealed: Vec<bool> = ["identity.session-published", "identity.session-ended"]
        .iter()
        .map(|t| registry.get(t).unwrap().seal_on_write)
        .collect();
    assert_eq!(
        sealed,
        [false, false],
        "the host appends and never seals, so the contract says so"
    );
    append(
        &bravo_layout,
        &registry,
        AppendRequest {
            stream: &StreamId::parse("project:identity").unwrap(),
            events: &[EventInput {
                event_type: "identity.session-published".into(),
                schema_version: 1,
                payload,
                ts: "2026-10-24T01:00:00.000Z".into(),
            }],
            cursor: &Default::default(),
            writer: "bravo-writer",
            machine: "bravo-bbbbbb",
            held_ranks: &[],
        },
    )
    .unwrap();
    sync_clone(&bravo_repo, &bravo_layout, "bravo-bbbbbb");
    sync_clone(&alpha_repo, &alpha_layout, "alpha-aaaaaa");

    let remote_session = identity_data(&run(&["resolve", "lead:MAIL", "--json"]));
    assert_eq!(remote_session["id"], "bravo-bbbbbb/sess");
    assert_eq!(remote_session["liveness"], "remote");
    assert_eq!(
        remote_session["machine"],
        serde_json::json!({ "id": "bravo-bbbbbb", "handle": "bravo" })
    );
    assert_eq!(remote_session["pin"], "seen");
    assert!(remote_session["fetchedAt"].is_string());
    assert_eq!(
        identity_data(&run(&["resolve", "bravo-bbbbbb/sess", "--json"]))["handle"],
        "claude-sess@bravo"
    );
    assert_eq!(
        identity_data(&run(&["resolve", "lead:WORK", "--json"]))["id"],
        "alpha-aaaaaa/alpha-session",
        "the local session is asked first"
    );
    let cache: serde_json::Value = serde_json::from_slice(
        &fs::read(alpha_root.join(".fgos/cache/identity-directory.json")).unwrap(),
    )
    .unwrap();
    assert_eq!(
        cache["entries"][0]["machine"]["id"], "bravo-bbbbbb",
        "a read keeps the verified view in the cache"
    );
    let by_machine = identity_data(&run(&["list", "--machine", "bravo", "--json"]));
    let ids: Vec<&str> = by_machine["sessions"]
        .as_array()
        .unwrap()
        .iter()
        .map(|s| s["id"].as_str().unwrap())
        .collect();
    assert_eq!(
        ids,
        ["bravo-bbbbbb/sess"],
        "--machine keeps one machine's sessions"
    );

    let _ = fs::remove_dir_all(&world);
}

/// A repository created after the Event Store cutover carries no `.fgos/events` fence and has no
/// store: the first identity registration still opens the log and mints the store.
#[cfg(unix)]
#[test]
fn identity_register_in_a_repository_without_a_fence_or_a_store_mints_the_store() {
    use fgos_event_store::layout::{Layout, StreamId};
    use fgos_git::{GitDriver, ResolveRepo};
    use std::os::unix::fs::PermissionsExt;

    let world = std::env::temp_dir().join(format!(
        "fgos_test_identity_unfenced_{}",
        std::process::id()
    ));
    let _ = fs::remove_dir_all(&world);
    fs::create_dir_all(&world).unwrap();
    fs::set_permissions(&world, fs::Permissions::from_mode(0o700)).unwrap();
    let git = |dir: &std::path::Path, args: &[&str]| {
        let out = Command::new("git")
            .arg("-C")
            .arg(dir)
            .args(args)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "git {args:?}: {}",
            String::from_utf8_lossy(&out.stderr)
        );
    };
    let state = world.join("state");
    fs::create_dir_all(&state).unwrap();
    fs::set_permissions(&state, fs::Permissions::from_mode(0o700)).unwrap();
    fs::write(state.join("machine-id"), "alpha-aaaaaa\n").unwrap();
    fgos_identity::signing::mint_key(&state).unwrap();

    let root = world.join("project");
    fs::create_dir_all(&root).unwrap();
    git(&root, &["init", "-q"]);
    fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
    fs::create_dir_all(root.join(".fgos")).unwrap();
    fs::write(
        root.join(".fgos/project.json"),
        r#"{"v":1,"projectId":"0123456789abcdef0123456789abcdef","handle":"demo","createdAt":"2026-10-24T00:00:00.000Z"}"#,
    )
    .unwrap();
    let activation = root.join(".fgos/locks/activation.lock");
    fs::create_dir_all(&activation).unwrap();
    fs::write(
        activation.join("TOMBSTONE"),
        "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
    )
    .unwrap();
    git(
        &root,
        &[
            "-c",
            "user.name=t",
            "-c",
            "user.email=t@example.invalid",
            "commit",
            "-q",
            "--allow-empty",
            "-m",
            "init",
        ],
    );

    let driver = GitDriver::new(&world).unwrap();
    let repo = match driver.resolve_repo(&root, &root).unwrap() {
        ResolveRepo::Repository(repo) => repo,
        _ => panic!("the project is a repository"),
    };
    let layout = Layout::from_common_dir(Some(repo.common_dir())).unwrap();
    fs::create_dir_all(layout.root.join("locks")).unwrap();
    for dir in [layout.common_dir.join("fgos"), layout.root.join("locks")] {
        fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).unwrap();
    }
    assert!(
        !root.join(".fgos/events").exists() && !layout.store().exists(),
        "no fence and no store"
    );

    let output = identity_command(&["session", "--register", "--role", "lead:WORK", "--json"])
        .env("FGOS_STATE_ROOT", &state)
        .env("FGOS_SESSION_ID", "alpha-session")
        .current_dir(&root)
        .output()
        .unwrap();
    identity_data(&output);
    assert!(layout.store().exists(), "the first append minted the store");
    let active = layout
        .stream(&StreamId::parse("project:identity").unwrap())
        .active();
    assert_eq!(
        fs::read_to_string(active)
            .unwrap()
            .matches("identity.session-published")
            .count(),
        1
    );

    let _ = fs::remove_dir_all(&world);
}

/// A seat the runner starts (its writer id is `att-...`) is never listed as a live session, whatever
/// hook or step asks it to register. The attempt-id rule is owned by the identity crate.
#[test]
fn identity_session_register_in_a_runner_seat_exits_quietly_and_registers_nothing() {
    let state =
        std::env::temp_dir().join(format!("fgos_test_identity_seat_{}", std::process::id()));
    let _ = fs::remove_dir_all(&state);
    fs::create_dir_all(&state).unwrap();
    fs::write(state.join("machine-id"), "fg-server-abc234\n").unwrap();
    let run = |id: &str| {
        identity_command(&["session", "--register", "--json"])
            .env("FGOS_STATE_ROOT", &state)
            .env("FGOS_SESSION_ID", id)
            .current_dir(&state)
            .output()
            .unwrap()
    };

    let seat = run("att-unit-7");
    let answer = identity_data(&seat);
    assert_eq!(
        answer,
        serde_json::json!({ "registered": false, "reason": "runner-seat" })
    );
    assert!(
        seat.stderr.is_empty(),
        "a skipped registration says nothing on stderr"
    );
    assert!(
        !state.join("identity").exists(),
        "the runner seat left no directory entry"
    );

    identity_data(&run("alpha"));
    assert!(
        state.join("identity").exists(),
        "an ordinary session still registers"
    );
    let _ = fs::remove_dir_all(&state);
}

/// `fgos identity machine` over a scratch state root: the wiring of the verb
/// (route, operation per flag, exit code of a refusal). The id, handle and
/// alias rules are owned by the identity crate's own tests.
#[test]
fn identity_machine_reads_refuses_and_sets_the_alias_through_the_state_root() {
    let state =
        std::env::temp_dir().join(format!("fgos_test_identity_machine_{}", std::process::id()));
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
    assert_eq!(
        refusal["reason"], "machine-id-missing",
        "a refusal under --json is not a success envelope"
    );

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
        fs::read_to_string(state.join("machine-alias"))
            .unwrap()
            .trim(),
        "owner"
    );
    let _ = fs::remove_dir_all(&state);
}

/// `fgos identity pins`: the wiring of the read, `--confirm` and `--forget` (read versus
/// write operation, flag validation, exit code of a refusal). What a pin is and
/// when it is made is owned by the identity crate's signing tests.
#[test]
fn identity_pins_lists_confirms_and_forgets_a_pin_by_machine_id() {
    let state =
        std::env::temp_dir().join(format!("fgos_test_identity_pins_{}", std::process::id()));
    let _ = fs::remove_dir_all(&state);
    fs::create_dir_all(state.join("identity/pins")).unwrap();
    let pin = serde_json::json!({
        "v": 1, "machineId": "peer-abc234", "publicKey": "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPLegqRm6sBzTw7JLFKGzcduIlAVoH8jcr9dq746BdvU",
        "fingerprint": "SHA256:5wLNh9SwL7zhGNE0qofyBNDQfRFTovOOLn//JmogtF0", "firstSeen": "2026-10-23T00:00:00.000Z"
    });
    fs::write(state.join("identity/pins/peer-abc234"), pin.to_string()).unwrap();
    let pins = |args: &[&str]| {
        identity_command(&[&["pins"], args].concat())
            .env("FGOS_STATE_ROOT", &state)
            .output()
            .unwrap()
    };

    // A pin file written without `state` lists as `seen`.
    let seen = serde_json::json!({
        "v": 1, "machineId": pin["machineId"], "publicKey": pin["publicKey"], "fingerprint": pin["fingerprint"],
        "firstSeen": pin["firstSeen"], "state": "seen"
    });
    assert_eq!(
        identity_data(&pins(&["--json"])),
        serde_json::json!({ "pins": [seen] })
    );
    let fingerprint = pin["fingerprint"].as_str().unwrap();
    for refused in [
        pins(&["--confirm", "peer-abc234"]),
        pins(&["--fingerprint", fingerprint]),
        pins(&[
            "--confirm",
            "peer-abc234",
            "--fingerprint",
            fingerprint,
            "--forget",
            "peer-abc234",
        ]),
    ] {
        assert_ne!(
            refused.status.code(),
            Some(0),
            "--confirm needs --fingerprint and excludes --forget"
        );
    }
    let absent = pins(&["--confirm", "other-abc234", "--fingerprint", fingerprint]);
    assert_eq!(absent.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&absent.stderr).contains("[pin-missing]"));
    let wrong = pins(&["--confirm", "peer-abc234", "--fingerprint", "SHA256:other"]);
    assert_eq!(wrong.status.code(), Some(65));
    let stderr = String::from_utf8_lossy(&wrong.stderr);
    assert!(
        stderr.contains("[fingerprint-mismatch]")
            && stderr.contains(fingerprint)
            && stderr.contains("SHA256:other"),
        "{stderr}"
    );
    let confirmed = identity_data(&pins(&[
        "--confirm",
        "peer-abc234",
        "--fingerprint",
        fingerprint,
    ]));
    assert_eq!(confirmed["confirmed"]["state"], "confirmed");
    assert!(confirmed["confirmed"]["confirmedAt"].is_string());
    assert_eq!(
        identity_data(&pins(&["--json"]))["pins"][0],
        confirmed["confirmed"]
    );
    let pin = confirmed["confirmed"].clone();
    let missing = pins(&["--forget", "other-abc234"]);
    assert_eq!(missing.status.code(), Some(65));
    assert!(String::from_utf8_lossy(&missing.stderr).contains("[pin-not-found]"));
    assert_ne!(
        pins(&["--forget"]).status.code(),
        Some(0),
        "--forget needs a machine id"
    );
    assert_eq!(
        identity_data(&pins(&["--forget", "peer-abc234"])),
        serde_json::json!({ "forgotten": pin })
    );
    assert_eq!(
        identity_data(&pins(&["--json"])),
        serde_json::json!({ "pins": [] })
    );
    let _ = fs::remove_dir_all(&state);
}

/// `fgos identity project` over a scratch repository: the wiring of the verb
/// (route, operation per flag, cwd as the repository, exit code of a refusal,
/// flag validation). The mint rules and refusals are owned by the identity
/// crate's project tests.
#[test]
fn identity_project_reads_mints_once_and_refuses_a_second_mint_through_the_cwd() {
    let base =
        std::env::temp_dir().join(format!("fgos_test_identity_project_{}", std::process::id()));
    let _ = fs::remove_dir_all(&base);
    let repo = base.join("sample-app");
    fs::create_dir_all(&repo).unwrap();
    let init = Command::new("/usr/bin/git")
        .args(["init", "-q"])
        .current_dir(&repo)
        .output()
        .unwrap();
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

    assert_ne!(
        project(&["--handle", "x"]).status.code(),
        Some(0),
        "--handle alone writes nothing"
    );
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
    fs::write(
        &fake_node,
        format!(
            "#!/bin/sh\nprintf '%s' \"$FGOS_STATE_ROOT\" > '{}'\n",
            seen.display()
        ),
    )
    .unwrap();
    fs::set_permissions(&fake_node, fs::Permissions::from_mode(0o755)).unwrap();
    let path = format!(
        "{}:{}",
        dir.display(),
        std::env::var("PATH").unwrap_or_default()
    );
    let run = |pinned: Option<&str>| {
        let mut cmd = Command::new(fgos_bin());
        cmd.args(["workflow", "list"])
            .env("PATH", &path)
            .env("FGOS_ACTIVE_RELEASE_PATH", repo_root())
            .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
            .env("FGOS_STATE_HOME", "/custom/state-home")
            .env_remove("FGOS_STATE_ROOT");
        if let Some(root) = pinned {
            cmd.env("FGOS_STATE_ROOT", root);
        }
        let out = cmd.output().unwrap();
        assert_eq!(
            out.status.code(),
            Some(0),
            "{}",
            String::from_utf8_lossy(&out.stderr)
        );
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
    cmd.arg("config")
        .args(args)
        .arg("--dir")
        .arg(sandbox.join("project"));
    cmd.current_dir(sandbox.join("project"));
    cmd.env("HOME", sandbox.join("home"))
        .env("FGOS_STATE_ROOT", sandbox.join("state"));
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
    let parsed: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("a JSON envelope");
    assert_eq!(parsed["contract"], "fgos.v1");
    parsed["data"].clone()
}

fn config_refusal(output: &std::process::Output) -> String {
    assert_eq!(
        output.status.code(),
        Some(65),
        "stderr={}",
        String::from_utf8_lossy(&output.stderr)
    );
    String::from_utf8_lossy(&output.stderr).into_owned()
}

#[test]
fn config_show_prints_the_value_with_where_it_came_from() {
    let sandbox = config_sandbox("show");
    fs::write(
        sandbox.join("project/.fgos/config.yaml"),
        "gateBypass:\n  level: light\n",
    )
    .unwrap();
    let shown = config_data(&config_run(
        &sandbox,
        &["show", "--path", "gateBypass.level", "--json"],
        false,
    ));
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
    let fragment = config_data(&config_run(
        &sandbox,
        &["standard", "--path", "gateway.port"],
        false,
    ));
    assert!(fragment["fragment"]
        .as_str()
        .unwrap()
        .contains("port: 4170"));
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
        fs::set_permissions(
            private.join("gateway-token"),
            fs::Permissions::from_mode(0o600),
        )
        .unwrap();
    }
    assert_eq!(
        config_data(&config_run(&sandbox, &["check"], false))["ok"],
        true
    );
    fs::write(
        sandbox.join("project/.fgos/config.yaml"),
        "gateway:\n  port: 49999\n",
    )
    .unwrap();
    let output = config_run(&sandbox, &["check", "--json"], false);
    assert_eq!(output.status.code(), Some(65));
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("config-schema"), "{stdout}");
    assert!(
        !stdout.contains("49999"),
        "a finding never carries a value: {stdout}"
    );
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn config_set_unset_and_patch_write_through_the_transaction_and_record_the_reason() {
    let sandbox = config_sandbox("write");
    let file = sandbox.join("project/.fgos/config.yaml");
    let set = |reason: &str| {
        config_run(
            &sandbox,
            &["set", "gateBypass.level", "light", "--reason", reason],
            false,
        )
    };
    assert_eq!(
        config_data(&set("light gates while auditing"))["applied"][0]["path"],
        "gateBypass.level"
    );
    let text = fs::read_to_string(&file).unwrap();
    assert!(
        text.contains("@fgos:why [config-test-writer] light gates while auditing"),
        "{text}"
    );
    let shown = config_data(&config_run(
        &sandbox,
        &["show", "--path", "gateBypass.level"],
        false,
    ));
    assert_eq!(shown["value"], "light");
    assert!(config_refusal(&config_run(
        &sandbox,
        &["set", "gateBypass.level", "heavy"],
        false
    ))
    .contains("config-comment-reason-required"));
    // The refusal says how to fix it, and a mistyped key is refused with the nearest keys.
    let missing = config_refusal(&config_run(
        &sandbox,
        &["set", "gateBypass.level", "heavy"],
        false,
    ));
    assert!(missing.contains("add --reason"), "{missing}");
    let typo = config_run(
        &sandbox,
        &[
            "set",
            "gateBypass.levle",
            "light",
            "--reason",
            "mistyped on purpose",
        ],
        false,
    );
    assert_eq!(typo.status.code(), Some(65));
    let typo = config_refusal(&typo);
    assert!(typo.contains("config-key-unknown"), "{typo}");
    assert!(typo.contains("did-you-mean=gateBypass.level"), "{typo}");
    // The note on the key is not dropped silently.
    let plain = config_run(
        &sandbox,
        &[
            "unset",
            "gateBypass.level",
            "--reason",
            "back to the standard",
        ],
        false,
    );
    assert_eq!(plain.status.code(), Some(65));
    assert!(config_refusal(&plain).contains("pass --acknowledge-comment-loss"));
    let ack = [
        "unset",
        "gateBypass.level",
        "--reason",
        "back to the standard",
        "--acknowledge-comment-loss",
    ];
    assert_eq!(
        config_data(&config_run(&sandbox, &ack, false))["applied"][0]["unset"],
        true
    );
    let patch = sandbox.join("patch.yaml");
    fs::write(
        &patch,
        "- set: gateBypass.level\n  value: standard\n- set: cleanup.ttlDays\n  value: 14\n",
    )
    .unwrap();
    let applied = config_data(&config_run(
        &sandbox,
        &["patch", patch.to_str().unwrap(), "--reason", "tune both"],
        false,
    ));
    assert_eq!(applied["applied"].as_array().unwrap().len(), 2);
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn config_writes_are_refused_for_a_confined_session_before_any_file_is_read() {
    let sandbox = config_sandbox("confined");
    let output = config_run(
        &sandbox,
        &[
            "set",
            "gateBypass.level",
            "light",
            "--reason",
            "should not land",
        ],
        true,
    );
    assert!(config_refusal(&output).contains("config-write-confined"));
    assert!(!sandbox.join("project/.fgos/config.yaml").exists());
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn config_migrate_converts_a_legacy_project_file_and_leaves_the_tombstone() {
    let sandbox = config_sandbox("migrate");
    let json = sandbox.join("project/.fgos/config.json");
    fs::write(
        &json,
        "{\"gateBypass\":{\"level\":\"light\"},\"gateway\":{\"port\":4170,\"token\":null}}\n",
    )
    .unwrap();
    let dry = config_data(&config_run(&sandbox, &["migrate", "--dry-run"], false));
    assert_eq!(dry["kept"][0], "gateBypass.level");
    assert!(!sandbox.join("project/.fgos/config.yaml").exists());
    let done = config_data(&config_run(&sandbox, &["migrate"], false));
    assert_eq!(done["dryRun"], false);
    assert!(fs::read_to_string(&json)
        .unwrap()
        .starts_with("moved to .fgos/config.yaml"));
    let yaml = fs::read_to_string(sandbox.join("project/.fgos/config.yaml")).unwrap();
    assert!(
        yaml.contains("[migrate] carried over from config.json"),
        "{yaml}"
    );
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn config_migrate_global_copies_first_refuses_the_removal_without_the_machine_check_then_converts()
{
    let sandbox = config_sandbox("global");
    fs::create_dir_all(sandbox.join("home/.fgos")).unwrap();
    let global = sandbox.join("home/.fgos/config.json");
    let legacy = "{\"gateBypass\":{\"level\":\"light\"},\"runner\":{\"llmAccounts\":{\"claude\":{\"work\":{\"login\":\"~/.claude-work\"}}}}}\n";
    fs::write(&global, legacy).unwrap();
    let copied = config_data(&config_run(&sandbox, &["migrate", "--global"], false));
    assert_eq!(copied["stage"], "copy");
    assert!(sandbox.join("home/.fgos/private/accounts.yaml").exists());
    assert_eq!(
        fs::read_to_string(&global).unwrap(),
        legacy,
        "stage 1 keeps the source"
    );
    let refused = config_run(&sandbox, &["migrate", "--global", "--finish"], false);
    assert!(config_refusal(&refused).contains("config-machine-check-required"));
    let finished = config_data(&config_run(
        &sandbox,
        &["migrate", "--global", "--finish", "--machine-checked"],
        false,
    ));
    assert_eq!(finished["stage"], "finish");
    let converted = config_data(&config_run(
        &sandbox,
        &["migrate", "--global", "--convert", "--machine-checked"],
        false,
    ));
    assert_eq!(converted["kept"][0], "gateBypass.level");
    assert!(sandbox.join("home/.fgos/config.yaml").exists());
    assert!(fs::read_to_string(&global)
        .unwrap()
        .starts_with("moved to .fgos/config.yaml"));
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn config_refresh_docs_rewrites_doc_lines_once_and_then_has_nothing_to_do() {
    let sandbox = config_sandbox("refresh");
    let file = sandbox.join("project/.fgos/config.yaml");
    fs::write(&file, "gateBypass:\n  level: light\n").unwrap();
    let first = config_data(&config_run(&sandbox, &["refresh-docs"], false));
    assert_eq!(first["nothingToDo"], false);
    assert!(fs::read_to_string(&file)
        .unwrap()
        .contains("# @fgos:doc Gate bypass level"));
    assert_eq!(
        config_data(&config_run(&sandbox, &["refresh-docs"], false))["nothingToDo"],
        true
    );
    let _ = fs::remove_dir_all(&sandbox);
}

#[test]
fn a_native_verb_under_home_with_no_project_is_refused_instead_of_using_the_global_fgos() {
    let sandbox = std::env::temp_dir().join(format!("fgos_test_root_walk_{}", std::process::id()));
    let _ = fs::remove_dir_all(&sandbox);
    let home = sandbox.join("home");
    let checkout = home.join("projects/stripped-worktree");
    fs::create_dir_all(home.join(".fgos")).unwrap();
    fs::create_dir_all(&checkout).unwrap();
    let run = |args: &[&str]| {
        Command::new(fgos_bin())
            .args(args)
            .current_dir(&checkout)
            .env("HOME", &home)
            .env("FGOS_STATE_ROOT", sandbox.join("state"))
            .output()
            .unwrap()
    };
    let ping = run(&["friction", "ping", "--json"]);
    let stderr = String::from_utf8_lossy(&ping.stderr);
    assert_eq!(
        ping.status.code(),
        Some(1),
        "stdout={} stderr={stderr}",
        String::from_utf8_lossy(&ping.stdout)
    );
    assert!(
        stderr.contains("not inside an fgOS project"),
        "stderr={stderr}"
    );
    // A verb that needs no project still runs from the same place.
    let version = run(&["version", "--json"]);
    assert_eq!(
        version.status.code(),
        Some(0),
        "stderr={}",
        String::from_utf8_lossy(&version.stderr)
    );
    let _ = fs::remove_dir_all(&sandbox);
}

// `events` runs in the host: a status of a fresh repository answers from the Event Store crate with no Node child
// (the `node` wrapper on PATH is never started), and a seal of a malformed stream is refused with the validation exit.
#[cfg(target_os = "linux")]
#[test]
fn events_status_runs_in_the_host_and_starts_no_node() {
    use std::os::unix::fs::PermissionsExt;
    let (spy_dir, spy_log, path) = node_spy_dir("fgos_test_events_spy");
    let repo = spy_dir.join("repo");
    fs::create_dir_all(&repo).unwrap();
    let state = spy_dir.join("state");
    fs::create_dir_all(&state).unwrap();
    fs::set_permissions(&state, fs::Permissions::from_mode(0o700)).unwrap();
    for args in [
        &["init", "-q", "-b", "main"][..],
        &["config", "fgos.machineId", "testbox"],
    ] {
        assert!(Command::new("git")
            .args(args)
            .current_dir(&repo)
            .status()
            .unwrap()
            .success());
    }
    let run = |args: &[&str]| {
        let mut command = Command::new(fgos_bin());
        command.args(args).current_dir(&repo);
        command.env("PATH", &path);
        command.env("FGOS_STATE_ROOT", &state);
        command.env("HOME", &spy_dir);
        command.output().expect("failed to execute fgos")
    };
    let status = run(&["events", "status"]);
    assert_eq!(
        status.status.code(),
        Some(0),
        "{}",
        String::from_utf8_lossy(&status.stderr)
    );
    let answer: serde_json::Value = serde_json::from_slice(&status.stdout).unwrap();
    assert_eq!(answer["data"]["remote"], "origin");
    assert_eq!(answer["data"]["machineId"], "testbox");
    let refused = run(&["events", "seal", "--stream", "Bad_1"]);
    assert_eq!(refused.status.code(), Some(4));
    assert!(String::from_utf8_lossy(&refused.stderr)
        .contains("fgos: events seal requires --stream <name>"));
    let spied = fs::read_to_string(&spy_log).unwrap_or_default();
    assert_eq!(
        spied.lines().filter(|l| l.starts_with("SPY_PID:")).count(),
        0,
        "no node child for a native events call: {spied}"
    );
    let _ = fs::remove_dir_all(&spy_dir);
}

// The session verbs are served by the host itself: start, list, end and gc of a real checkout run with a
// `node` spy on PATH and start no Node process.
#[cfg(unix)]
#[test]
fn test_session_verbs_start_no_node() {
    use std::os::unix::fs::PermissionsExt;
    let (spy_dir, spy_log, path) = node_spy_dir("fgos_test_session_spy");
    let sandbox = std::env::temp_dir().join(format!("fgos_test_session_{}", std::process::id()));
    let _ = fs::remove_dir_all(&sandbox);
    let state = sandbox.join("state");
    let temp = sandbox.join("tmp");
    let repo = sandbox.join("repo");
    for dir in [&state, &temp, &repo] {
        fs::create_dir_all(dir).unwrap();
    }
    fs::set_permissions(&state, fs::Permissions::from_mode(0o700)).unwrap();
    let git = |args: &[&str]| {
        let status = Command::new("git")
            .arg("-C")
            .arg(&repo)
            .args(args)
            .status()
            .unwrap();
        assert!(status.success(), "git {args:?}");
    };
    git(&["init", "-q", "--initial-branch=main"]);
    git(&["config", "user.name", "Fixture"]);
    git(&["config", "user.email", "fixture@example.invalid"]);
    fs::write(repo.join("seed.txt"), "seed\n").unwrap();
    git(&["add", "-A"]);
    git(&["commit", "-qm", "seed"]);
    let fence = repo.join(".fgos/locks/activation.lock");
    fs::create_dir_all(&fence).unwrap();
    fs::write(
        fence.join("TOMBSTONE"),
        r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
    )
    .unwrap();

    let run = |args: &[&str]| {
        let output = Command::new(fgos_bin())
            .args(args)
            .current_dir(&repo)
            .env("PATH", &path)
            .env("FGOS_STATE_ROOT", &state)
            .env("TMPDIR", &temp)
            .env_remove("FGOS_ACTIVE_RELEASE_PATH")
            .env_remove("FGOS_ACTIVE_MANIFEST_PATH")
            .output()
            .expect("failed to execute fgos");
        assert_eq!(
            output.status.code(),
            Some(0),
            "{args:?}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        serde_json::from_slice::<serde_json::Value>(&output.stdout).unwrap()["data"].clone()
    };
    let started = run(&["session", "start", "--json"]);
    let id = started["sessionId"].as_str().unwrap().to_owned();
    assert_eq!(run(&["session", "list"]).as_array().unwrap().len(), 1);
    assert_eq!(run(&["session", "end", &id])["forced"], false);
    assert_eq!(run(&["session", "list"]), serde_json::json!([]));
    // The one-shot start process is gone by the time a gc runs, so a clean session it left is reclaimed.
    let left = run(&["session", "start"])["sessionId"].clone();
    assert_eq!(
        run(&["session", "gc"])["reclaimed"],
        serde_json::json!([left])
    );

    let starts = fs::read_to_string(&spy_log).unwrap_or_default();
    assert!(
        starts.is_empty(),
        "the session verbs started node: {starts}"
    );
    let _ = fs::remove_dir_all(&sandbox);
    let _ = fs::remove_dir_all(&spy_dir);
}

// A session verb run where there is no project is refused through the project check, with the refusal every
// ported verb gives, and creates nothing: no `.fgos`, no lock, no session directory, not even in the current directory.
#[cfg(unix)]
#[test]
fn test_session_verbs_outside_a_project_are_refused_and_create_nothing() {
    use std::os::unix::fs::PermissionsExt;
    let sandbox =
        std::env::temp_dir().join(format!("fgos_test_session_bare_{}", std::process::id()));
    let _ = fs::remove_dir_all(&sandbox);
    let (state, temp, bare) = (
        sandbox.join("state"),
        sandbox.join("tmp"),
        sandbox.join("bare"),
    );
    for dir in [&state, &temp, &bare] {
        fs::create_dir_all(dir).unwrap();
    }
    fs::set_permissions(&state, fs::Permissions::from_mode(0o700)).unwrap();
    for args in [
        &["session", "list"][..],
        &["session", "start"][..],
        &["session", "gc"][..],
        &["session", "end", "x"][..],
    ] {
        let output = Command::new(fgos_bin())
            .args(args)
            .current_dir(&bare)
            .env("FGOS_STATE_ROOT", &state)
            .env("TMPDIR", &temp)
            .output()
            .expect("failed to execute fgos");
        let stderr = String::from_utf8_lossy(&output.stderr);
        assert_eq!(output.status.code(), Some(4), "{args:?}: {stderr}");
        assert!(
            output.stdout.is_empty(),
            "{args:?} printed {:?}",
            output.stdout
        );
        assert!(
            stderr.contains("not inside an fgOS project") && stderr.contains("[not-in-project]"),
            "{args:?}: {stderr}"
        );
    }
    assert_eq!(
        fs::read_dir(&bare).unwrap().count(),
        0,
        "nothing was made in the directory"
    );
    assert_eq!(
        fs::read_dir(&temp).unwrap().count(),
        0,
        "no session directory was made"
    );
    let _ = fs::remove_dir_all(&sandbox);
}

/// `fgos lock-status` is the first native verb that opens the store, so this is the one proof that the invocation
/// doors work through the binary for a `store: read` verb: the admission warning for a worktree with no store, the
/// refused `--dir ""` with one record in the caller's store, and the Event Store lifecycle triggers (a refused
/// `eventStore` section answers a deterministic error: one end record, and with a dispatch depth also one start
/// record, on Linux only). A `node` wrapper that fails when started proves no Node process runs.
#[cfg(unix)]
#[test]
fn lock_status_runs_the_doors_through_the_binary_and_starts_no_node() {
    use std::os::unix::fs::PermissionsExt;
    let sandbox = std::env::temp_dir().join(format!(
        "fgos_test_lock_status_doors_{}",
        std::process::id()
    ));
    let _ = fs::remove_dir_all(&sandbox);
    let (home, state) = (sandbox.join("home"), sandbox.join("state"));
    let shim = sandbox.join("shim");
    for dir in [&home, &state, &shim] {
        fs::create_dir_all(dir).unwrap();
    }
    fs::set_permissions(&state, fs::Permissions::from_mode(0o700)).unwrap();
    let node_log = sandbox.join("node-started.log");
    let wrapper = shim.join("node");
    fs::write(
        &wrapper,
        format!(
            "#!/bin/sh\necho started >> \"{}\"\nexit 97\n",
            node_log.display()
        ),
    )
    .unwrap();
    fs::set_permissions(&wrapper, fs::Permissions::from_mode(0o755)).unwrap();
    let path = format!(
        "{}:{}",
        shim.display(),
        std::env::var("PATH").unwrap_or_default()
    );
    let git = |dir: &Path, args: &[&str]| {
        let output = Command::new("git")
            .current_dir(dir)
            .args(["-c", "user.name=doors", "-c", "user.email=doors@test"])
            .args(args)
            .output()
            .expect("git runs");
        assert!(
            output.status.success(),
            "git {args:?}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    };
    let project = |name: &str| {
        let root = sandbox.join(name);
        fs::create_dir_all(root.join(".fgos")).unwrap();
        git(&root, &["init", "-q", "."]);
        git(&root, &["commit", "-q", "--allow-empty", "-m", "init"]);
        fs::canonicalize(&root).unwrap()
    };
    let run = |dir: &Path, extra: &[(&str, &str)], args: &[&str]| {
        let mut command = Command::new(fgos_bin());
        command
            .current_dir(dir)
            .args(args)
            .env("HOME", &home)
            .env("FGOS_STATE_ROOT", &state)
            .env("PATH", &path)
            .env_remove("FGOS_DISPATCH_DEPTH");
        for (key, value) in extra {
            command.env(key, value);
        }
        command.output().expect("failed to execute fgos")
    };
    let records = |root: &Path, class: &str| {
        fs::read_to_string(root.join(".fgos/logs/invocation-faults.jsonl"))
            .unwrap_or_default()
            .lines()
            .filter(|line| line.contains(&format!("\"faultClass\":\"{class}\"")))
            .count()
    };

    // A worktree with no store: admitted with the warning, and the report is the empty-store answer.
    let main = project("main");
    let worktree = sandbox.join("worktree");
    git(
        &main,
        &[
            "worktree",
            "add",
            "-q",
            "--detach",
            worktree.to_str().unwrap(),
        ],
    );
    let from_worktree = run(&worktree, &[], &["lock-status"]);
    let stderr = String::from_utf8_lossy(&from_worktree.stderr);
    assert_eq!(from_worktree.status.code(), Some(0), "{stderr}");
    assert!(stderr.contains(".fgos/ not found"), "{stderr}");
    let envelope: serde_json::Value = serde_json::from_slice(&from_worktree.stdout).unwrap();
    assert_eq!(envelope["data"]["mainCheckout"]["outcome"], "free");
    assert!(envelope["data"]["locks"]
        .as_array()
        .is_some_and(|rows| rows.len() > 20));

    // `--dir ""` is refused as an invalid directory, with exactly one record in the caller's store.
    let caller = project("caller");
    let refused = run(&caller, &[], &["lock-status", "--dir", ""]);
    assert_eq!(refused.status.code(), Some(4));
    assert!(
        String::from_utf8_lossy(&refused.stderr).contains("--dir requires a non-empty path value"),
        "{}",
        String::from_utf8_lossy(&refused.stderr)
    );
    assert_eq!(records(&caller, "dir-invalid"), 1);
    assert_eq!(
        records(&caller, "event-store-end-trigger"),
        0,
        "a refused call never reaches the lifecycle"
    );

    // A project whose `eventStore` section the reader refuses: the lifecycle's error is recorded, never fatal.
    let store = project("store");
    fs::write(
        store.join(".fgos/config.yaml"),
        "eventStore:\n  remote: origin\n",
    )
    .unwrap();
    let on_linux = usize::from(cfg!(target_os = "linux"));
    let plain = run(&store, &[], &["lock-status"]);
    assert_eq!(
        plain.status.code(),
        Some(0),
        "{}",
        String::from_utf8_lossy(&plain.stderr)
    );
    assert_eq!(records(&store, "event-store-end-trigger"), on_linux);
    assert_eq!(records(&store, "event-store-start-trigger"), 0);
    let dispatched = run(&store, &[("FGOS_DISPATCH_DEPTH", "1")], &["lock-status"]);
    assert_eq!(dispatched.status.code(), Some(0));
    assert_eq!(records(&store, "event-store-end-trigger"), 2 * on_linux);
    assert_eq!(records(&store, "event-store-start-trigger"), on_linux);

    assert!(!node_log.exists(), "a Node process was started");
    let _ = fs::remove_dir_all(&sandbox);
}

/// The body of the process the lock-fence case below holds a lock with: it takes the lock the environment
/// names, says so through a file and waits to be ended. Without the variable it does nothing.
#[cfg(unix)]
#[test]
fn lock_fence_holder_child_body() {
    use fgos_holder_lock::{acquire, Acquire, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
    let Ok(path) = std::env::var("FGOS_TEST_FENCE_HOLD") else {
        return;
    };
    let Acquire::Acquired(_handle) = acquire(
        &Resource::new("main-checkout", &path),
        Mode::Ex,
        Wait::Ms(0),
        DEFAULT_KILL_WAIT_MS,
    ) else {
        std::process::exit(3);
    };
    fs::write(std::env::var("FGOS_TEST_FENCE_READY").unwrap(), "held").unwrap();
    loop {
        std::thread::sleep(std::time::Duration::from_secs(1));
    }
}

// `lock fence` through the binary: without `--yes` it lists the holder and signals nothing (exit 2, on a
// terminal too), with `--yes` it ends the holder and answers the envelope, and neither call starts Node.
#[cfg(unix)]
#[test]
fn lock_fence_refuses_without_yes_then_ends_the_holder_and_starts_no_node() {
    let (spy_dir, spy_log, path) = node_spy_dir("fgos_test_lock_fence_spy");
    let base = std::env::temp_dir().join(format!("fgos-lock-fence-cli-{}", std::process::id()));
    let _ = fs::remove_dir_all(&base);
    let project = base.join("project");
    fs::create_dir_all(project.join(".git")).unwrap();
    fs::create_dir_all(project.join(".fgos/locks")).unwrap();
    let lock_file = project.join(".fgos/locks/main-checkout.lock");
    let ready = base.join("ready");
    let mut holder = Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "lock_fence_holder_child_body", "--nocapture"])
        .env("FGOS_TEST_FENCE_HOLD", &lock_file)
        .env("FGOS_TEST_FENCE_READY", &ready)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .unwrap();
    for _ in 0..400 {
        if ready.exists() {
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(25));
    }
    assert!(ready.exists(), "the holder child never took the lock");
    let fence = |extra: &[&str]| {
        Command::new(fgos_bin())
            .current_dir(&project)
            .env("HOME", &base)
            .env("PATH", &path)
            .args(["lock", "fence", "main-checkout"])
            .args(extra)
            .output()
            .expect("failed to execute fgos")
    };

    let refused = fence(&[]);
    let stderr = String::from_utf8_lossy(&refused.stderr);
    assert_eq!(refused.status.code(), Some(2), "stderr={stderr}");
    assert!(
        stderr.contains(&format!("pid {} (started ", holder.id())),
        "the holder is listed: {stderr}"
    );
    assert!(
        stderr.contains("holder-lock (lock-fence-not-confirmed)")
            && stderr.contains("nothing was signalled"),
        "{stderr}"
    );
    assert!(
        holder.try_wait().unwrap().is_none(),
        "an unconfirmed fence leaves the holder alone"
    );

    let fenced = fence(&["--yes"]);
    assert_eq!(
        fenced.status.code(),
        Some(0),
        "stderr={}",
        String::from_utf8_lossy(&fenced.stderr)
    );
    let parsed: serde_json::Value = serde_json::from_slice(&fenced.stdout).unwrap();
    assert_eq!(parsed["contract"], "fgos.v1");
    assert_eq!(parsed["data"]["status"], "fenced");
    assert_eq!(parsed["data"]["terminated"][0], holder.id());
    holder.wait().unwrap();

    let spied = fs::read_to_string(&spy_log).unwrap_or_default();
    assert!(
        !spied.lines().any(|line| line.starts_with("SPY_PID:")),
        "lock fence started a node process: {spied}"
    );
    let _ = fs::remove_dir_all(&base);
    let _ = fs::remove_dir_all(&spy_dir);
}

// ---------------------------------------------------------------------------------------------------------
// `fgos doctor` in the host: the rows whose layers Node still owns are judged through the one Node rows bridge;
// everything else (the report, `--strict`, `--pretty`, the refusals) is the host's own.
// ---------------------------------------------------------------------------------------------------------

/// A fresh, empty directory under the temp dir.
fn fresh_dir(prefix: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "{prefix}_{}_{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir_all(&dir).unwrap();
    dir.canonicalize().unwrap()
}

/// `PATH` without any directory that holds a `node`, so the host finds no Node at all.
#[cfg(unix)]
fn path_without_node() -> String {
    std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default())
        .filter(|dir| !dir.join("node").exists())
        .map(|dir| dir.display().to_string())
        .collect::<Vec<_>>()
        .join(":")
}

/// A directory whose `node` is a shell script with `body`; returns it and a `PATH` that finds it first.
#[cfg(unix)]
fn scripted_node(prefix: &str, body: &str) -> (PathBuf, String) {
    use std::os::unix::fs::PermissionsExt;
    let dir = fresh_dir(prefix);
    let script = dir.join("node");
    fs::write(&script, format!("#!/bin/sh\n{body}\n")).unwrap();
    fs::set_permissions(&script, fs::Permissions::from_mode(0o755)).unwrap();
    (
        dir.clone(),
        format!(
            "{}:{}",
            dir.display(),
            std::env::var("PATH").unwrap_or_default()
        ),
    )
}

/// The one result line a finished bridge call ends with, as a shell command.
#[cfg(unix)]
const BRIDGE_END_LINE: &str = r#"printf '\036FGOS-DOCTOR-BRIDGE {"kind":"end","count":0}\n'"#;

/// `fgos doctor <args>` in `cwd` with its own HOME and state root, against the checkout's dev release.
fn doctor_in(
    cwd: &Path,
    path: &str,
    args: &[&str],
    extra_env: &[(&str, &str)],
) -> std::process::Output {
    let manifest_path = ensure_dev_manifest();
    let home = fresh_dir("fgos_doctor_home");
    let state = fresh_dir("fgos_doctor_state");
    let mut command = Command::new(fgos_bin());
    command
        .arg("doctor")
        .args(args)
        .current_dir(cwd)
        .env("PATH", path)
        .env("HOME", &home)
        .env("FGOS_STATE_ROOT", &state)
        .env("FGOS_ACTIVE_RELEASE_PATH", repo_root())
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .env("FGOS_CLAUDE_COMMAND", "/nonexistent/fgos-test-claude");
    for (key, value) in extra_env {
        command.env(key, value);
    }
    command.output().expect("failed to execute fgos")
}

#[cfg(unix)]
#[test]
fn doctor_without_node_fails_each_bridged_row_naming_node_once_and_the_host_rows_still_answer() {
    let project = fresh_dir("fgos_doctor_nonode");
    let path = path_without_node();

    let plain = doctor_in(&project, &path, &["--json"], &[]);
    assert_eq!(
        plain.status.code(),
        Some(0),
        "{}",
        String::from_utf8_lossy(&plain.stderr)
    );
    let envelope: serde_json::Value = serde_json::from_slice(&plain.stdout).unwrap();
    let data = &envelope["data"];
    assert_eq!(data["ok"], false);
    let checks = data["checks"].as_array().unwrap();
    assert!(checks.len() > 100, "{}", checks.len());
    // The rows the host judges itself (the registry's `inRust`) answer for themselves; every other row is the
    // Node bridge's and fails naming Node.
    let registry: serde_json::Value = serde_json::from_str(include_str!(
        "../../../packages/distribution/contracts/doctor-registry.v1.json"
    ))
    .unwrap();
    let in_rust: Vec<&str> = registry["inRust"]["rows"]
        .as_array()
        .unwrap()
        .iter()
        .map(|id| id.as_str().unwrap())
        .collect();
    for id in &in_rust {
        let row = checks
            .iter()
            .find(|row| row["id"] == *id)
            .unwrap_or_else(|| panic!("the report has no row {id}"));
        assert!(
            !row["message"]
                .as_str()
                .unwrap_or_default()
                .starts_with("Node is not available"),
            "a row the host judges names Node: {row}"
        );
    }
    for row in checks
        .iter()
        .filter(|row| !in_rust.contains(&row["id"].as_str().unwrap()))
    {
        assert_eq!(row["status"], "fail", "{row}");
        assert_eq!(row["passed"], false);
        assert!(row["fix"].is_null(), "{row}");
        assert!(
            row["message"]
                .as_str()
                .unwrap()
                .starts_with("Node is not available"),
            "{row}"
        );
    }
    // Node is named once; a row the host judges and `doctor --fix` repairs adds that one command, nothing else.
    let next: Vec<&str> = data["next"]
        .as_array()
        .unwrap()
        .iter()
        .map(|entry| entry.as_str().unwrap())
        .collect();
    let (named_node, others): (Vec<&str>, Vec<&str>) = next
        .iter()
        .partition(|entry| entry.contains("install Node 18 or newer"));
    assert_eq!(named_node.len(), 1, "{next:?}");
    assert!(
        others.iter().all(|entry| *entry == "fgos doctor --fix"),
        "{next:?}"
    );

    // `--strict` exits 1 when a row still fails; `--pretty` prints the text form instead of the envelope.
    let strict = doctor_in(&project, &path, &["--strict", "--json"], &[]);
    assert_eq!(strict.status.code(), Some(1));
    let pretty = doctor_in(&project, &path, &["--pretty"], &[]);
    assert_eq!(pretty.status.code(), Some(0));
    let text = String::from_utf8_lossy(&pretty.stdout);
    assert!(text.starts_with("fgos doctor\n"), "{text}");
    assert!(
        text.contains("\nNext:\n  install Node 18 or newer"),
        "{text}"
    );
    assert_eq!(
        fs::read_dir(&project).unwrap().count(),
        0,
        "a doctor run left something in the project"
    );
    let _ = fs::remove_dir_all(&project);
}

/// The rows of the Node-owned layers are one call of the rows bridge: one Node process for the whole run, however
/// many rows it judges. (That a doctor run leaves a repository with no fgOS setup untouched and starts no events
/// child is proved through the host by `test/setup/checks-doctor-config.test.mjs`.)
#[cfg(unix)]
#[test]
fn doctor_starts_one_node_child_for_all_its_bridged_rows() {
    let project = fresh_dir("fgos_doctor_fresh");
    let (spy_dir, spy_log, path) = node_spy_dir("fgos_doctor_spy");

    let output = doctor_in(&project, &path, &["--json"], &[]);
    assert_eq!(
        output.status.code(),
        Some(0),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let envelope: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
    assert!(envelope["data"]["checks"].as_array().unwrap().len() > 100);

    let starts = fs::read_to_string(&spy_log).unwrap_or_default();
    assert_eq!(
        starts.lines().filter(|l| l.starts_with("SPY_PID:")).count(),
        1,
        "the rows of Node-owned layers are one bridge call: {starts}"
    );
    let _ = fs::remove_dir_all(&project);
    let _ = fs::remove_dir_all(&spy_dir);
}

#[cfg(unix)]
#[test]
fn the_bridge_child_gets_a_fresh_guard_this_host_and_the_state_root_even_when_the_host_inherited_a_guard(
) {
    let dump = fresh_dir("fgos_doctor_env");
    let seen = dump.join("env.txt");
    let (spy_dir, path) = scripted_node(
        "fgos_doctor_envnode",
        &format!(
            "cat >/dev/null\nenv | grep -E '^(FGOS_RUST_HOST_RECURSION_GUARD|FGOS_HOST_BIN|{state})=' > '{out}'\n{end}",
            state = fgos_holder_lock::state_root::PINNED_ROOT_ENV,
            out = seen.display(),
            end = BRIDGE_END_LINE
        ),
    );
    let project = fresh_dir("fgos_doctor_envproj");
    // The parent carries a guard already: a legacy route would refuse here, the bridge is a bounded child and runs.
    let output = doctor_in(
        &project,
        &path,
        &["--json"],
        &[("FGOS_RUST_HOST_RECURSION_GUARD", "1")],
    );
    assert_eq!(
        output.status.code(),
        Some(0),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let env = fs::read_to_string(&seen).expect("the bridge child never started");
    assert!(env.contains("FGOS_RUST_HOST_RECURSION_GUARD=1"), "{env}");
    assert!(
        env.contains(&format!("FGOS_HOST_BIN={}", fgos_bin().display())),
        "{env}"
    );
    assert!(
        env.contains(&format!(
            "{}=",
            fgos_holder_lock::state_root::PINNED_ROOT_ENV
        )),
        "{env}"
    );
    for dir in [dump, spy_dir, project] {
        let _ = fs::remove_dir_all(&dir);
    }
}

#[cfg(unix)]
#[test]
fn an_interrupt_of_the_host_ends_the_bridge_child_and_everything_it_started() {
    let dump = fresh_dir("fgos_doctor_sigint");
    let grandchild = dump.join("grandchild.pid");
    let (spy_dir, path) = scripted_node(
        "fgos_doctor_sigintnode",
        &format!(
            "cat >/dev/null\nsh -c 'echo $$ > \"{pid}\"; exec sleep 300'",
            pid = grandchild.display()
        ),
    );
    let project = fresh_dir("fgos_doctor_sigintproj");
    let record = dump.join("invocation-record.jsonl");
    let manifest_path = ensure_dev_manifest();
    let mut host = Command::new(fgos_bin())
        .args(["doctor", "--json"])
        .current_dir(&project)
        .env("PATH", &path)
        .env("HOME", fresh_dir("fgos_doctor_sigint_home"))
        .env("FGOS_STATE_ROOT", fresh_dir("fgos_doctor_sigint_state"))
        .env("FGOS_ACTIVE_RELEASE_PATH", repo_root())
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .env("FGOS_INVOCATION_RECORD_PATH", &record)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .unwrap();
    let started = std::time::Instant::now();
    while !grandchild.exists() {
        assert!(
            started.elapsed() < std::time::Duration::from_secs(30),
            "the bridge child never started"
        );
        std::thread::sleep(std::time::Duration::from_millis(20));
    }
    std::thread::sleep(std::time::Duration::from_millis(200));
    let pid: i32 = fs::read_to_string(&grandchild)
        .unwrap()
        .trim()
        .parse()
        .unwrap();
    assert_eq!(unsafe { libc::kill(host.id() as i32, libc::SIGINT) }, 0);
    let ended = std::time::Instant::now();
    loop {
        if let Some(status) = host.try_wait().unwrap() {
            // A signalled doctor ends as a signalled process does (128 + SIGINT), it does not print a report and go on.
            assert_eq!(status.code(), Some(130), "{status}");
            break;
        }
        assert!(
            ended.elapsed() < std::time::Duration::from_secs(30),
            "the host did not end after the interrupt"
        );
        std::thread::sleep(std::time::Duration::from_millis(20));
    }
    let written = fs::read_to_string(&record).unwrap_or_default();
    assert!(
        written.contains("doctor.run"),
        "an interrupted doctor still writes its invocation record: {written:?}"
    );
    std::thread::sleep(std::time::Duration::from_millis(300));
    let alive = unsafe { libc::kill(pid, 0) } == 0
        && fs::read_to_string(format!("/proc/{pid}/stat"))
            .map_or(true, |stat| !stat.contains(") Z "));
    assert!(
        !alive,
        "the grandchild of the bridge child outlived the interrupted host"
    );
    for dir in [dump, spy_dir, project] {
        let _ = fs::remove_dir_all(&dir);
    }
}

#[test]
fn a_malformed_doctor_call_is_refused_before_anything_runs() {
    let project = fresh_dir("fgos_doctor_refused");
    for args in [vec!["--bogus"], vec!["--fix=1"], vec!["--strict=1"]] {
        let output = Command::new(fgos_bin())
            .arg("doctor")
            .args(&args)
            .current_dir(&project)
            .env("FGOS_STATE_ROOT", fresh_dir("fgos_doctor_refused_state"))
            .output()
            .unwrap();
        assert_eq!(output.status.code(), Some(4), "{args:?}");
        assert!(output.stdout.is_empty(), "{args:?}");
        assert!(
            String::from_utf8_lossy(&output.stderr).contains("unknown flag"),
            "{args:?}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }
    let _ = fs::remove_dir_all(&project);
}

// ---------------------------------------------------------------------------------------------------------
// `fgos wire-agents` in the host: no Node process at all, whatever `node` on PATH would do.
// ---------------------------------------------------------------------------------------------------------

#[cfg(unix)]
#[test]
fn wire_agents_runs_in_the_host_without_node_and_a_failing_step_exits_1() {
    use std::os::unix::fs::PermissionsExt;
    let (node_dir, path) = scripted_node(
        "fgos_wire_agents_node",
        "echo node-was-started >&2\nexit 99",
    );
    let work = fresh_dir("fgos_wire_agents");
    let (home, project) = (work.join("home"), work.join("project"));
    fs::create_dir_all(&home).unwrap();
    fs::create_dir_all(&project).unwrap();
    assert!(Command::new("git")
        .args(["init", "-q", "-b", "main"])
        .current_dir(&project)
        .status()
        .unwrap()
        .success());
    let claude = work.join("fake-claude");
    fs::write(
        &claude,
        "#!/bin/sh\ncase \"$*\" in\n  --version) echo 1.0;;\n  'plugin marketplace list --json'|'plugin list --json') printf '[]';;\n  'plugin marketplace add '*) echo 'refused' >&2; exit 1;;\n  *) exit 0;;\nesac\n",
    )
    .unwrap();
    fs::set_permissions(&claude, fs::Permissions::from_mode(0o755)).unwrap();
    let run = |args: &[&str]| {
        Command::new(fgos_bin())
            .arg("wire-agents")
            .args(args)
            .current_dir(&project)
            .env("PATH", &path)
            .env("HOME", &home)
            .env("FGOS_STATE_ROOT", work.join("state"))
            .env("FGOS_CLAUDE_COMMAND", &claude)
            .output()
            .expect("failed to execute fgos")
    };
    let plan = run(&["--json"]);
    assert_eq!(
        plan.status.code(),
        Some(0),
        "{}",
        String::from_utf8_lossy(&plan.stderr)
    );
    let answer: serde_json::Value = serde_json::from_slice(&plan.stdout).unwrap();
    assert_eq!(answer["data"]["applied"], false);
    assert_eq!(
        answer["data"]["agents"][0]["changes"][0]["id"],
        "claude-plugin"
    );
    let applied = run(&["--yes"]);
    assert_eq!(applied.status.code(), Some(1));
    let text = String::from_utf8_lossy(&applied.stdout);
    assert!(
        text.contains(
            "Failed: claude-plugin: \"claude plugin marketplace add vantt/forgent\" failed: refused"
        ),
        "{text}"
    );
    assert!(!String::from_utf8_lossy(&applied.stderr).contains("node-was-started"));
    let refused = run(&["--yes=1"]);
    assert_eq!(refused.status.code(), Some(4));
    assert!(String::from_utf8_lossy(&refused.stderr).contains("unknown flag"));
    let _ = fs::remove_dir_all(&work);
    let _ = fs::remove_dir_all(&node_dir);
}

// ---------------------------------------------------------------------------------------------------------
// `fgos uninstall` in the host: no Node anywhere on the way.
// ---------------------------------------------------------------------------------------------------------

#[cfg(unix)]
#[test]
fn uninstall_plans_and_applies_with_no_node_on_the_machine_and_exits_zero() {
    let manifest_path = ensure_dev_manifest();
    let project = fresh_dir("fgos_uninstall_nonode");
    let home = fresh_dir("fgos_uninstall_home");
    let state = fresh_dir("fgos_uninstall_state");
    let path = path_without_node();
    let run = |args: &[&str]| {
        Command::new(fgos_bin())
            .arg("uninstall")
            .args(args)
            .current_dir(&project)
            .env("PATH", &path)
            .env("HOME", &home)
            .env("FGOS_STATE_ROOT", &state)
            .env("FGOS_ACTIVE_RELEASE_PATH", repo_root())
            .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
            .output()
            .expect("failed to execute fgos")
    };
    for args in [&[][..], &["--yes"][..], &["--yes", "--dry-run"][..]] {
        let output = run(args);
        assert_eq!(
            output.status.code(),
            Some(0),
            "{args:?}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        let envelope: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
        let data = &envelope["data"];
        assert_eq!(data["applied"], args == ["--yes"], "{args:?}");
        for key in ["changes", "keeps", "leftToYou", "backups", "failed"] {
            assert!(data[key].is_array(), "{args:?}: {key}");
        }
        assert_eq!(data["failed"], serde_json::json!([]), "{args:?}");
    }
    assert_eq!(
        fs::read_dir(&project).unwrap().count(),
        0,
        "a reversal in a project with nothing of fgOS's left something behind"
    );
    // A refused call is refused by the host with the Node text and exit status.
    let refused = run(&["--bogus"]);
    assert_eq!(refused.status.code(), Some(4));
    assert!(String::from_utf8_lossy(&refused.stderr)
        .contains("unknown flag \"--bogus\" for \"fgos uninstall\"."));
    let _ = fs::remove_dir_all(&project);
}

/// A call from a linked worktree acts on the main checkout that owns it, as the Node CLI did: the extension file
/// only the main checkout has is the one the reversal names.
#[cfg(unix)]
#[test]
fn uninstall_from_a_linked_worktree_acts_on_the_main_checkout() {
    let manifest_path = ensure_dev_manifest();
    let base = fresh_dir("fgos_uninstall_worktree");
    let main = base.join("main");
    let linked = base.join("linked");
    let home = fresh_dir("fgos_uninstall_worktree_home");
    let state = fresh_dir("fgos_uninstall_worktree_state");
    let git = |dir: &Path, args: &[&str]| {
        let output = Command::new("git")
            .arg("-C")
            .arg(dir)
            .args(["-c", "user.email=t@example.com", "-c", "user.name=T"])
            .args(args)
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "git {args:?}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    };
    fs::create_dir_all(&main).unwrap();
    git(&main, &["init", "-q", "-b", "main"]);
    fs::write(main.join("seed.txt"), "seed\n").unwrap();
    git(&main, &["add", "seed.txt"]);
    git(&main, &["commit", "-qm", "seed"]);
    git(
        &main,
        &[
            "worktree",
            "add",
            "-q",
            "--detach",
            linked.to_str().unwrap(),
        ],
    );
    fs::create_dir_all(main.join(".omp/extensions")).unwrap();
    fs::write(
        main.join(".omp/extensions/fgos-hooks.ts"),
        "// the person's own\n",
    )
    .unwrap();
    let output = Command::new(fgos_bin())
        .arg("uninstall")
        .current_dir(&linked)
        .env("PATH", path_without_node())
        .env("HOME", &home)
        .env("FGOS_STATE_ROOT", &state)
        .env("FGOS_ACTIVE_RELEASE_PATH", repo_root())
        .env("FGOS_ACTIVE_MANIFEST_PATH", &manifest_path)
        .output()
        .expect("failed to execute fgos");
    assert_eq!(
        output.status.code(),
        Some(0),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let envelope: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
    let hooks = envelope["data"]["hooks"].as_array().unwrap();
    assert_eq!(hooks.len(), 1, "{hooks:?}");
    assert_eq!(
        hooks[0]["file"],
        main.join(".omp/extensions/fgos-hooks.ts").to_str().unwrap()
    );
    assert_eq!(hooks[0]["state"], "edited");
    let _ = fs::remove_dir_all(&base);
}

// ---------------------------------------------------------------------------------------------------------
// `fgos init` in the host: the machine and project steps run in process; Node is asked for the Work store only.
// ---------------------------------------------------------------------------------------------------------

/// One world for `init`: a repository with a commit, its own HOME and state root.
#[cfg(unix)]
struct InitWorld {
    base: PathBuf,
    project: PathBuf,
    home: PathBuf,
    state: PathBuf,
}

#[cfg(unix)]
impl InitWorld {
    fn new(prefix: &str) -> Self {
        let base = fresh_dir(prefix);
        let (project, home, state) = (base.join("project"), base.join("home"), base.join("state"));
        for dir in [&project, &home.join(".fgos"), &state] {
            fs::create_dir_all(dir).unwrap();
        }
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&state, fs::Permissions::from_mode(0o700)).unwrap();
        }
        let git = |args: &[&str]| {
            assert!(Command::new("git")
                .args(args)
                .current_dir(&project)
                .output()
                .unwrap()
                .status
                .success());
        };
        git(&["init", "-q", "-b", "main"]);
        git(&["config", "user.email", "test@example.com"]);
        git(&["config", "user.name", "Test"]);
        fs::write(project.join("seed.txt"), "seed\n").unwrap();
        git(&["add", "seed.txt"]);
        git(&["commit", "-q", "-m", "seed"]);
        Self {
            base,
            project,
            home,
            state,
        }
    }

    fn command(&self, path: &str) -> Command {
        let mut command = Command::new(fgos_bin());
        command
            .arg("init")
            .current_dir(&self.project)
            .env("PATH", path)
            .env("HOME", &self.home)
            .env("FGOS_STATE_ROOT", &self.state)
            .env("FGOS_ACTIVE_RELEASE_PATH", repo_root())
            .env("FGOS_ACTIVE_MANIFEST_PATH", ensure_dev_manifest());
        command
    }

    fn init(&self, path: &str, args: &[&str]) -> std::process::Output {
        self.command(path)
            .args(args)
            .output()
            .expect("failed to execute fgos")
    }

    fn data(&self, output: &std::process::Output) -> serde_json::Value {
        assert_eq!(
            output.status.code(),
            Some(0),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        let envelope: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
        envelope["data"].clone()
    }

    fn fgos_file(&self, name: &str) -> PathBuf {
        self.project.join(".fgos").join(name)
    }
}

/// A Node that records the request the host sends it and answers with `answer` (a shell command).
#[cfg(unix)]
fn bridge_node(prefix: &str, request: &Path, answer: &str) -> (PathBuf, String) {
    scripted_node(prefix, &format!("cat > '{}'\n{answer}", request.display()))
}

#[cfg(target_os = "macos")]
#[test]
fn init_on_macos_installs_and_names_the_work_store_unsupported() {
    let world = InitWorld::new("fgos_init_macos");
    let request = world.base.join("request.json");
    let (node_dir, path) = bridge_node("fgos_init_macos_node", &request, BRIDGE_END_LINE);

    let answer = world.data(&world.init(&path, &["--json"]));
    assert_eq!(answer["workStore"], "unsupported-platform");
    assert!(world.fgos_file("config.yaml").is_file());
    let _ = fs::remove_dir_all(node_dir);
}

// The Work store step is Linux only; elsewhere init names it unsupported and the Node step never runs.
#[cfg(target_os = "linux")]
#[test]
fn init_makes_the_machine_and_project_files_in_process_and_asks_node_only_for_the_work_store() {
    let world = InitWorld::new("fgos_init_fresh");
    let request = world.base.join("request.json");
    let (node_dir, path) = bridge_node("fgos_init_node", &request, BRIDGE_END_LINE);

    let first = world.data(&world.init(&path, &["--json"]));
    assert_eq!(first["dir"], world.project.join(".fgos").to_str().unwrap());
    assert_eq!(first["detectedHarnesses"], serde_json::json!([]));
    assert_eq!(first["config"]["project"]["created"], true);
    assert_eq!(first["config"]["global"]["created"], true);
    assert!(first.get("workStore").is_none(), "{first}");
    for file in ["config.yaml", "coexistence.json"] {
        assert!(world.fgos_file(file).is_file(), "{file}");
    }
    assert!(world.state.join("machine-id").is_file());
    assert!(world.home.join(".fgos/config.yaml").is_file());
    let asked: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(&request).unwrap()).unwrap();
    assert_eq!(asked["phase"], "work-store-init");
    assert_eq!(asked["ids"], serde_json::json!([]));
    assert_eq!(asked["dir"], world.project.to_str().unwrap());

    let second = world.data(&world.init(&path, &[]));
    assert_eq!(second["config"]["project"]["created"], false);
    assert_eq!(second["config"]["global"]["created"], false);
    let _ = fs::remove_dir_all(&world.base);
    let _ = fs::remove_dir_all(&node_dir);
}

/// After a fresh `init` the Git journal exists and is trusted, so the first doctor of the project finds the
/// `git-operation-journal` row passing and has no Git fix to name.
// The Work store step is Linux only; elsewhere init names it unsupported and the Node step never runs.
#[cfg(target_os = "linux")]
#[test]
fn after_a_fresh_init_the_git_journal_row_passes_and_no_git_fix_is_named() {
    let world = InitWorld::new("fgos_init_wal");
    // The controller's activation fence is what `fgctl` places when it activates the release, before the tail runs.
    let fence = world.project.join(".fgos/locks/activation.lock");
    fs::create_dir_all(&fence).unwrap();
    fs::write(
        fence.join("TOMBSTONE"),
        "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
    )
    .unwrap();
    let request = world.base.join("request.json");
    let (node_dir, path) = bridge_node("fgos_init_wal_node", &request, BRIDGE_END_LINE);
    let first = world.data(&world.init(&path, &["--json"]));
    assert!(first.get("gitWalWarning").is_none(), "{first}");

    let output = doctor_in(
        &world.project,
        &path,
        &["--json"],
        &[
            ("HOME", world.home.to_str().unwrap()),
            ("FGOS_STATE_ROOT", world.state.to_str().unwrap()),
        ],
    );
    let envelope: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
    let checks = envelope["data"]["checks"].as_array().unwrap();
    let journal = checks
        .iter()
        .find(|row| row["id"] == "git-operation-journal")
        .expect("the journal row is in the report");
    assert_eq!(journal["passed"], true, "{journal}");
    assert!(
        !envelope["data"]["next"]
            .as_array()
            .unwrap()
            .iter()
            .any(|entry| entry.as_str().is_some_and(|s| s.contains("git-wal"))),
        "{}",
        envelope["data"]["next"]
    );
    let _ = fs::remove_dir_all(&world.base);
    let _ = fs::remove_dir_all(&node_dir);
}

/// Without the controller's activation fence `init` cannot create the Git WAL, and says which command places it.
// init initialises the Git journal, which the Git door keeps on Linux only.
#[cfg(target_os = "linux")]
#[test]
fn init_without_the_activation_fence_warns_and_names_fgctl() {
    let world = InitWorld::new("fgos_init_nofence");
    let request = world.base.join("request.json");
    let (node_dir, path) = bridge_node("fgos_init_nofence_node", &request, BRIDGE_END_LINE);
    let first = world.data(&world.init(&path, &["--json"]));
    let warning = first["gitWalWarning"].as_str().expect("a warning");
    assert!(
        warning.starts_with("Git WAL not initialised: git-fence-missing; run `fgctl init`"),
        "{warning}"
    );
    let _ = fs::remove_dir_all(&world.base);
    let _ = fs::remove_dir_all(&node_dir);
}

#[cfg(unix)]
const TOKEN: &str = "SENTINEL-4417";

/// An older release's global and project `config.json`, the gateway token inside the global one.
#[cfg(unix)]
fn write_legacy_config(world: &InitWorld) {
    fs::write(
        world.home.join(".fgos/config.json"),
        format!(
            r#"{{"gateway":{{"port":4001,"token":"{TOKEN}"}},"bin":{{"globalFgosPath":"/opt/fgos"}}}}"#
        ),
    )
    .unwrap();
    fs::create_dir_all(world.fgos_file("")).unwrap();
    fs::write(
        world.fgos_file("config.json"),
        r#"{"gateBypass":{"level":"light"},"ironLaw":{"level":"ask"}}"#,
    )
    .unwrap();
}

#[cfg(unix)]
#[test]
fn init_moves_an_older_releases_json_config_in_order_keeps_the_token_and_a_second_run_changes_nothing(
) {
    let world = InitWorld::new("fgos_init_legacy");
    let (node_dir, path) = scripted_node(
        "fgos_init_legacy_node",
        &format!("cat >/dev/null\n{BRIDGE_END_LINE}"),
    );
    write_legacy_config(&world);

    let output = world.init(&path, &["--json"]);
    let text = format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(!text.contains(TOKEN), "no output carries the token");
    let first = world.data(&output);
    assert_eq!(
        first["legacyConfig"],
        serde_json::json!(["copy", "finish", "convert-global", "convert-project"])
    );
    assert_eq!(
        first["legacyConfigNote"],
        "~/.fgos/config.json moved; projects on an older release refuse until `fgctl upgrade`"
    );
    let token = fs::read_to_string(world.home.join(".fgos/private/gateway-token")).unwrap();
    assert_eq!(
        token.trim(),
        TOKEN,
        "the token the person had is the machine token"
    );
    let snapshot = || {
        [
            world.home.join(".fgos/config.yaml"),
            world.home.join(".fgos/config.json"),
            world.fgos_file("config.yaml"),
            world.fgos_file("config.json"),
        ]
        .map(|file| fs::read(file).ok())
    };
    let settled = snapshot();
    let second = world.data(&world.init(&path, &["--json"]));
    assert!(second.get("legacyConfig").is_none(), "{second}");
    assert_eq!(snapshot(), settled);
    let _ = fs::remove_dir_all(&world.base);
    let _ = fs::remove_dir_all(&node_dir);
}

#[cfg(unix)]
#[test]
fn init_never_replaces_a_private_token_that_differs_and_stops_before_the_later_steps() {
    let world = InitWorld::new("fgos_init_differs");
    let (node_dir, path) = scripted_node(
        "fgos_init_differs_node",
        &format!("cat >/dev/null\n{BRIDGE_END_LINE}"),
    );
    write_legacy_config(&world);
    let private = world.home.join(".fgos/private");
    fs::create_dir_all(&private).unwrap();
    fs::write(private.join("gateway-token"), "SENTINEL-8820\n").unwrap();
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&private, fs::Permissions::from_mode(0o700)).unwrap();
        fs::set_permissions(
            private.join("gateway-token"),
            fs::Permissions::from_mode(0o600),
        )
        .unwrap();
    }
    let legacy = fs::read(world.home.join(".fgos/config.json")).unwrap();

    let output = world.init(&path, &[]);
    assert_eq!(output.status.code(), Some(1));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.starts_with("fgos: config-migrate-destination-differs: "),
        "{stderr}"
    );
    assert!(!stderr.contains(TOKEN) && !stderr.contains("SENTINEL-8820"));
    assert_eq!(
        fs::read(world.home.join(".fgos/config.json")).unwrap(),
        legacy
    );
    assert_eq!(
        fs::read_to_string(private.join("gateway-token")).unwrap(),
        "SENTINEL-8820\n"
    );
    assert!(
        !world.fgos_file("coexistence.json").exists(),
        "a later step ran"
    );
    let _ = fs::remove_dir_all(&world.base);
    let _ = fs::remove_dir_all(&node_dir);
}

// The Work store step is Linux only; elsewhere init names it unsupported and the Node step never runs.
#[cfg(target_os = "linux")]
#[test]
fn a_legacy_global_file_init_may_not_move_leaves_it_and_the_event_store_config_refuses_it_by_name()
{
    use std::os::unix::fs::PermissionsExt;
    let world = InitWorld::new("fgos_init_readonly");
    let (node_dir, path) = scripted_node(
        "fgos_init_readonly_node",
        &format!("cat >/dev/null\n{BRIDGE_END_LINE}"),
    );
    write_legacy_config(&world);
    let global = world.home.join(".fgos");
    fs::set_permissions(&global, fs::Permissions::from_mode(0o500)).unwrap();
    if fs::write(global.join("probe"), "").is_ok() {
        let _ = fs::remove_dir_all(&world.base);
        return; // a user the mode does not bind (root)
    }
    let output = world.init(&path, &[]);
    fs::set_permissions(&global, fs::Permissions::from_mode(0o700)).unwrap();
    // The refused write is a warning of the settle, not an error; the next step reads the config and says what is
    // still wrong, naming the file and the key and never the value.
    assert_eq!(output.status.code(), Some(1));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr
            .starts_with("fgos: event-store-config: config-key-in-wrong-file global:config.json:"),
        "{stderr}"
    );
    assert!(!stderr.contains(TOKEN));
    assert!(
        !world.fgos_file("coexistence.json").exists(),
        "a later step ran"
    );
    let _ = fs::remove_dir_all(&world.base);
    let _ = fs::remove_dir_all(&node_dir);
}

// The Work store step is Linux only; elsewhere init names it unsupported and the Node step never runs.
#[cfg(target_os = "linux")]
#[test]
fn a_refusal_of_the_work_store_keeps_the_payloads_text_and_exit_category_and_the_later_steps_do_not_run(
) {
    let world = InitWorld::new("fgos_init_refused");
    let (node_dir, path) = scripted_node(
        "fgos_init_refused_node",
        r#"cat >/dev/null
printf '\036FGOS-DOCTOR-BRIDGE {"kind":"refusal","message":"lock-timeout: the project lock stayed held","category":"lock-timeout"}\n'
exit 2"#,
    );
    let output = world.init(&path, &[]);
    assert_eq!(output.status.code(), Some(7));
    assert_eq!(
        String::from_utf8_lossy(&output.stderr).trim(),
        "fgos: lock-timeout: the project lock stayed held"
    );
    assert!(output.stdout.is_empty());
    assert!(
        !world.fgos_file("coexistence.json").exists(),
        "a later step ran"
    );
    assert!(
        world.state.join("machine-id").is_file(),
        "an earlier step did not"
    );
    let _ = fs::remove_dir_all(&world.base);
    let _ = fs::remove_dir_all(&node_dir);
}

// The Work store step is Linux only; elsewhere init names it unsupported and the Node step never runs.
#[cfg(target_os = "linux")]
#[test]
fn init_without_node_is_a_missing_precondition_after_the_steps_that_need_none() {
    let world = InitWorld::new("fgos_init_nonode");
    let output = world.init(&path_without_node(), &[]);
    assert_eq!(output.status.code(), Some(2));
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(stderr.contains("Node 18 or newer"), "{stderr}");
    assert!(world.state.join("machine-id").is_file());
    assert!(!world.fgos_file("coexistence.json").exists());
    let _ = fs::remove_dir_all(&world.base);
}

#[cfg(unix)]
#[test]
fn init_without_a_home_is_a_missing_precondition_and_writes_nothing() {
    let world = InitWorld::new("fgos_init_nohome");
    let output = world
        .command(&std::env::var("PATH").unwrap_or_default())
        .env_remove("HOME")
        .env_remove("USERPROFILE")
        .output()
        .expect("failed to execute fgos");
    assert_eq!(output.status.code(), Some(2));
    assert!(String::from_utf8_lossy(&output.stderr).contains("HOME is not set"));
    assert!(!world.state.join("machine-id").exists());
    assert!(!world.fgos_file("coexistence.json").exists());
    let _ = fs::remove_dir_all(&world.base);
}
