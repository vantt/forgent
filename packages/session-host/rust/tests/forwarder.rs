//! Owning proof of the argv window: one test per refusal no persona can lift, and the shape of an allowed or asked argv.

use std::path::Path;

use fgos_session_host::forwarder::{plan, read_answer, Planned};
use serde_json::{json, Value};

fn stage_path() -> std::path::PathBuf {
    use std::sync::atomic::{AtomicU32, Ordering};
    static NEXT: AtomicU32 = AtomicU32::new(0);
    std::env::temp_dir().join(format!(
        "fgos-forwarder-stage-{}-{}.yaml",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ))
}

fn run(persona: &str, argv: Value, root: &Path) -> Result<Planned, String> {
    plan(persona, &argv, root, &stage_path()).map_err(|why| why.0)
}

fn scratch(name: &str, patch: &str) -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-forwarder-{name}-{}", std::process::id()));
    std::fs::create_dir_all(&dir).unwrap();
    std::fs::write(dir.join("patch.yaml"), patch).unwrap();
    dir
}

#[test]
fn an_allowed_argv_runs_on_the_host_with_json_added() {
    let planned = run(
        "supervisor",
        json!(["session", "read", "s1", "--lines", "20"]),
        Path::new("/p"),
    )
    .unwrap();
    assert_eq!(
        planned,
        Planned::Run(
            ["session", "read", "s1", "--lines", "20", "--json"]
                .map(String::from)
                .to_vec()
        )
    );
}

#[test]
fn a_json_flag_the_caller_already_passed_is_not_added_twice() {
    let planned = run("supervisor", json!(["slots", "--json"]), Path::new("/p")).unwrap();
    assert_eq!(
        planned,
        Planned::Run(["slots", "--json"].map(String::from).to_vec())
    );
}

#[test]
fn an_argv_no_row_matches_is_asked_with_the_callers_own_words() {
    let planned = run("planner", json!(["deploy", "production"]), Path::new("/p")).unwrap();
    assert_eq!(
        planned,
        Planned::Ask(["deploy", "production"].map(String::from).to_vec())
    );
}

#[test]
fn a_flag_that_changes_the_root_the_cwd_or_the_environment_is_refused() {
    for flag in [
        "-C",
        "--cwd",
        "--root",
        "--project",
        "--env",
        "--dir",
        "--repo-root",
        "--repo-root=/tmp",
        "--dir=/tmp",
        "--cwd=/tmp",
        "--env=A=b",
        "-C/tmp",
    ] {
        let refused =
            run("secretary", json!(["slots", flag, "/tmp"]), Path::new("/p")).unwrap_err();
        assert!(refused.contains("project root"), "{flag}: {refused}");
    }
}

#[test]
fn an_argv_that_is_not_an_fgos_verb_is_refused() {
    for first in [
        "bash", "/bin/sh", "git", "Slots", "rm", "-rf", "fgos", "node",
    ] {
        // `git recover` is a verb; a bare `git push` still names no row and is asked, never run.
        let result = run("secretary", json!([first, "push"]), Path::new("/p"));
        assert!(!matches!(result, Ok(Planned::Run(_))), "{first}");
    }
    assert!(
        run("secretary", json!(["bash", "-c", "ls"]), Path::new("/p"))
            .unwrap_err()
            .contains("not an fgos verb")
    );
    assert!(run("secretary", json!(["/bin/sh"]), Path::new("/p"))
        .unwrap_err()
        .contains("not an fgos verb"));
}

#[test]
fn an_argv_element_that_is_not_a_plain_string_is_refused() {
    for argv in [
        json!(["slots", 1]),
        json!(["slots", null]),
        json!(["slots", ["x"]]),
        json!(["slots", ""]),
        json!([]),
        json!("slots"),
        json!(["slots", "a\u{0}b"]),
    ] {
        assert!(
            run("secretary", argv.clone(), Path::new("/p")).is_err(),
            "{argv}"
        );
    }
}

#[test]
fn activation_of_a_release_is_refused_to_every_persona() {
    for persona in ["lead", "planner", "shaper", "supervisor", "secretary"] {
        for argv in [json!(["activate"]), json!(["release", "activate"])] {
            let refused = run(persona, argv, Path::new("/p")).unwrap_err();
            assert!(refused.contains("denied"), "{persona}: {refused}");
        }
    }
}

#[test]
fn a_config_patch_touching_a_grant_confinement_or_release_key_is_refused() {
    // Real config keys: below a protected path, on it, and above it (a whole-object edit holds the protected key).
    for key in [
        "runner.confinement.required",
        "runner.confinement",
        "runner",
        "runner.capabilities",
        "runner.capabilities.code.confinement.mode",
        "runner.capabilities.code",
        "runner.executors.claude.invocation",
        "runner.confinementPolicies.mine",
        "gateBypass",
        "gateBypass.enabled",
        "secretary",
        "secretary.run.maxMinutes",
        "land",
        "land.gates",
        "release",
        "release.recipe",
        "release[0]",
    ] {
        let root = scratch("deny", &format!("- set: {key}\n  value: 1\n"));
        let refused = run(
            "supervisor",
            json!(["config", "patch", "patch.yaml"]),
            &root,
        )
        .unwrap_err();
        assert!(refused.contains("widens"), "{key}: {refused}");
    }
    // An unset of a protected key and one protected item among harmless ones are refused as well.
    let root = scratch(
        "mixed",
        "- set: watcher.activeIntervalSec\n  value: 30\n- unset: runner.executors.claude\n",
    );
    assert!(run(
        "supervisor",
        json!(["config", "patch", "patch.yaml"]),
        &root
    )
    .is_err());
}

#[test]
fn a_config_patch_the_window_cannot_read_is_refused_rather_than_passed_on() {
    assert!(run(
        "supervisor",
        json!(["config", "patch", "missing.yaml"]),
        Path::new("/nonexistent")
    )
    .is_err());
    assert!(run(
        "supervisor",
        json!(["config", "patch", "../patch.yaml"]),
        Path::new("/p")
    )
    .is_err());
    assert!(run(
        "supervisor",
        json!(["config", "patch", "/etc/passwd"]),
        Path::new("/p")
    )
    .is_err());
}

#[test]
fn a_harmless_config_patch_runs_project_only_and_the_scope_flags_are_the_hosts() {
    let root = scratch("ok", "- set: watcher.activeIntervalSec\n  value: 30\n");
    let stage = stage_path();
    let planned = plan(
        "supervisor",
        &json!(["config", "patch", "patch.yaml", "--reason", "tune"]),
        &root,
        &stage,
    )
    .unwrap();
    // The host gets the private copy of the checked bytes, never the caller's path.
    assert_eq!(
        planned,
        Planned::Run(
            [
                "config",
                "patch",
                stage.to_str().unwrap(),
                "--reason",
                "tune",
                "--project-only",
                "--json"
            ]
            .map(String::from)
            .to_vec()
        )
    );
    assert_eq!(
        std::fs::read_to_string(&stage).unwrap(),
        "- set: watcher.activeIntervalSec\n  value: 30\n"
    );
    // The scope flags are the host's: the exact shape `<file> [--reason <text>]` leaves no room for them.
    for flag in ["--global", "--project-only"] {
        assert!(
            run(
                "supervisor",
                json!(["config", "patch", "patch.yaml", flag]),
                &root
            )
            .is_err(),
            "{flag}"
        );
    }
}

#[test]
fn a_config_patch_names_exactly_one_file_at_the_third_word() {
    let root = scratch("shape", "- set: watcher.activeIntervalSec\n  value: 30\n");
    std::fs::write(
        root.join("evil.yaml"),
        "- set: runner.executors.x\n  value: 1\n",
    )
    .unwrap();
    for argv in [
        // A second file after `--reason` would be the one the host applies.
        json!(["config", "patch", "--reason", "ok", "evil.yaml"]),
        json!([
            "config",
            "patch",
            "patch.yaml",
            "--reason",
            "ok",
            "evil.yaml"
        ]),
        json!(["config", "patch", "patch.yaml", "evil.yaml"]),
        json!(["config", "patch", "patch.yaml", "--reason"]),
        json!(["config", "patch"]),
    ] {
        assert!(
            run("supervisor", argv.clone(), &root)
                .unwrap_err()
                .contains("exactly"),
            "{argv}"
        );
    }
    assert!(run(
        "supervisor",
        json!(["config", "patch", "patch.yaml", "--reason=tune"]),
        &root
    )
    .is_ok());
}

#[test]
fn a_config_patch_file_is_never_followed_through_a_symlink_or_read_from_fgos() {
    let root = scratch("links", "- set: watcher.activeIntervalSec\n  value: 30\n");
    std::os::unix::fs::symlink("patch.yaml", root.join("link.yaml")).unwrap();
    std::fs::create_dir_all(root.join("dir")).unwrap();
    std::os::unix::fs::symlink(&root, root.join("dir/up")).unwrap();
    std::fs::create_dir_all(root.join(".fgos")).unwrap();
    std::fs::write(
        root.join(".fgos/patch.yaml"),
        "- set: watcher.activeIntervalSec\n  value: 30\n",
    )
    .unwrap();
    for file in ["link.yaml", "dir/up/patch.yaml", ".fgos/patch.yaml"] {
        assert!(
            run("supervisor", json!(["config", "patch", file]), &root).is_err(),
            "{file}"
        );
    }
}

#[test]
fn a_config_patch_changed_after_the_window_read_it_does_not_reach_the_host() {
    let root = scratch("swap", "- set: watcher.activeIntervalSec\n  value: 30\n");
    let stage = stage_path();
    plan(
        "supervisor",
        &json!(["config", "patch", "patch.yaml"]),
        &root,
        &stage,
    )
    .unwrap();
    std::fs::write(
        root.join("patch.yaml"),
        "- set: runner.executors.x\n  value: 1\n",
    )
    .unwrap();
    assert_eq!(
        std::fs::read_to_string(&stage).unwrap(),
        "- set: watcher.activeIntervalSec\n  value: 30\n"
    );
}

#[test]
fn a_raise_names_only_the_coordination_event_kinds() {
    for persona in ["lead", "supervisor"] {
        for kind in [
            "coordination-help",
            "coordination-handoff",
            "coordination-chore",
        ] {
            assert!(run(
                persona,
                json!([
                    "supervisor",
                    "raise",
                    "--kind",
                    kind,
                    "--ref",
                    "plan:x",
                    "--reason",
                    "r"
                ]),
                Path::new("/p")
            )
            .is_ok());
        }
        for kind in [
            "head-gone",
            "session-idle",
            "coordination",
            "coordination-help-x",
        ] {
            let refused = run(
                persona,
                json!([
                    "supervisor",
                    "raise",
                    &format!("--kind={kind}"),
                    "--ref",
                    "plan:x"
                ]),
                Path::new("/p"),
            )
            .unwrap_err();
            assert!(refused.contains("--kind takes one of"), "{kind}: {refused}");
        }
    }
}

#[test]
fn a_worktree_is_removed_only_once_delivered_to_main() {
    let ok = run(
        "supervisor",
        json!(["worktree", "remove", "w1", "--delivered-to", "main"]),
        Path::new("/p"),
    );
    assert!(ok.is_ok());
    for refs in [
        json!(["--delivered-to", "feature"]),
        json!(["--delivered-to=HEAD~1"]),
    ] {
        let mut argv = vec![json!("worktree"), json!("remove"), json!("w1")];
        argv.extend(refs.as_array().unwrap().iter().cloned());
        let refused = run("supervisor", Value::Array(argv), Path::new("/p")).unwrap_err();
        assert!(refused.contains("--delivered-to takes one of"), "{refused}");
    }
}

#[test]
fn a_session_read_or_type_names_a_plain_target_and_a_bounded_line_count() {
    for lines in ["1", "1000"] {
        assert!(run(
            "supervisor",
            json!(["session", "read", "head:lead-x", "--lines", lines]),
            Path::new("/p")
        )
        .is_ok());
    }
    for lines in ["1001", "0x10", "-1", "many"] {
        let refused = run(
            "supervisor",
            json!(["session", "read", "s1", "--lines", lines]),
            Path::new("/p"),
        )
        .unwrap_err();
        assert!(
            refused.contains("whole number up to 1000"),
            "{lines}: {refused}"
        );
    }
    for target in ["--lines", "-x", "a b", "a;b", "$(x)", &"a".repeat(129)] {
        for verb in ["read", "type"] {
            let refused = run(
                "supervisor",
                json!(["session", verb, target, "--text", "hi"]),
                Path::new("/p"),
            )
            .unwrap_err();
            assert!(
                refused.contains("session target"),
                "{verb} {target}: {refused}"
            );
        }
    }
    assert!(run(
        "supervisor",
        json!(["session", "type", "slot:abc-1", "--text", "hi"]),
        Path::new("/p")
    )
    .is_ok());
}

#[test]
fn a_policy_verb_is_not_run_as_an_argv() {
    let refused = run("lead", json!(["land", "--paths", "x"]), Path::new("/p")).unwrap_err();
    assert!(refused.contains("policy verb"), "{refused}");
}

#[test]
fn the_hosts_answer_is_its_data_or_its_own_refusal() {
    assert_eq!(
        read_answer(true, "{\"data\": {\"n\": 1}}", "", Some(0)).unwrap(),
        json!({"n": 1})
    );
    assert_eq!(
        read_answer(true, "{\"n\": 2}", "", Some(0)).unwrap(),
        json!({"n": 2})
    );
    assert_eq!(
        read_answer(true, "", "", Some(0)).unwrap_err().0,
        "host-output-unreadable"
    );
    let line = read_answer(
        false,
        "{\"code\": \"event-store-no-repository\", \"message\": \"no\"}",
        "",
        Some(70),
    )
    .unwrap_err();
    assert_eq!(
        line,
        ("event-store-no-repository".to_string(), "no".to_string())
    );
    let printed =
        read_answer(false, "", "fgos: nothing to do [nothing-to-do]\n", Some(1)).unwrap_err();
    assert_eq!(
        printed,
        ("nothing-to-do".to_string(), "nothing to do".to_string())
    );
    assert_eq!(
        read_answer(false, "", "", Some(3)).unwrap_err().0,
        "host-failed"
    );
    let big = format!("{{\"data\": {{\"x\": \"{}\"}}}}", "y".repeat(70_000));
    assert_eq!(
        read_answer(true, &big, "", Some(0)).unwrap_err().0,
        "reply-too-large"
    );
}
