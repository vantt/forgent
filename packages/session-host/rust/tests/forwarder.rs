//! Owning proof of the argv window: one test per refusal no persona can lift, and the shape of an allowed or asked argv.

use std::path::Path;

use fgos_session_host::forwarder::{plan, read_answer, Planned};
use serde_json::{json, Value};

fn run(persona: &str, argv: Value, root: &Path) -> Result<Planned, String> {
    plan(persona, &argv, root).map_err(|why| why.0)
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
    assert_eq!(planned, Planned::Run(["slots", "--json"].map(String::from).to_vec()));
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
    for key in [
        "grant.supervisor.verbs",
        "confinement",
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
        assert!(refused.contains("prefix"), "{key}: {refused}");
    }
    // An unset of a protected key and one protected item among harmless ones are refused as well.
    let root = scratch(
        "mixed",
        "- set: secretary.run.tier\n  value: standard\n- unset: release.recipe\n",
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
    let root = scratch("ok", "- set: secretary.run.maxMinutes\n  value: 10\n");
    let planned = run(
        "supervisor",
        json!(["config", "patch", "patch.yaml", "--reason", "tune"]),
        &root,
    )
    .unwrap();
    assert_eq!(
        planned,
        Planned::Run(
            [
                "config",
                "patch",
                "patch.yaml",
                "--reason",
                "tune",
                "--project-only",
                "--json"
            ]
            .map(String::from)
            .to_vec()
        )
    );
    for flag in ["--global", "--project-only"] {
        assert!(
            run(
                "supervisor",
                json!(["config", "patch", "patch.yaml", flag]),
                &root
            )
            .unwrap_err()
            .contains("host's to set"),
            "{flag}"
        );
    }
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
