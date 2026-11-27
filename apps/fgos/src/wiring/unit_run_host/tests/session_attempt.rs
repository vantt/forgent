//! A head session launched through the host's attempt driver: engine `launch_session_attempt` over
//! [`super::super::session_attempt::HostSessionDriver`], the assignment runner's machine, a fake pane route (no herdr
//! is started) and a stub supervisor that binds and records what it was given (no agent seat starts). The seat is
//! confined (bwrap, from the machine's backend registry), as every head is.
#![cfg(target_os = "linux")]

use std::sync::{Arc, Mutex};

use fgos_run_supervisor::controller::launch::AttemptHost;
use serde_json::{json, Value};

use super::super::session_attempt::{launch_session, SessionRequest};
use super::run_unit::{hermetic, runner, stub_bin};
use super::terminal::{FakeRoute, Seen};
use super::{repo, Scratch};

#[test]
fn a_head_session_is_launched_confined_in_its_pane_and_handed_to_a_supervisor_that_binds_it() {
    hermetic(
        module_path!(),
        "a_head_session_is_launched_confined_in_its_pane_and_handed_to_a_supervisor_that_binds_it",
        true,
        session_launch,
    );
}

#[test]
fn a_launch_with_workdir_opens_its_attempt_with_cwd_and_sandbox_root_in_the_worktree_and_fgos_in_the_project_root(
) {
    hermetic(
        module_path!(),
        "a_launch_with_workdir_opens_its_attempt_with_cwd_and_sandbox_root_in_the_worktree_and_fgos_in_the_project_root",
        true,
        session_launch_workdir,
    );
}

#[test]
fn a_workdir_that_is_not_a_linked_worktree_is_refused_by_name() {
    hermetic(
        module_path!(),
        "a_workdir_that_is_not_a_linked_worktree_is_refused_by_name",
        false,
        session_refuse_unlinked_workdir,
    );
}

/// The stub supervisor: binds the attempt, keeps the envelope and the herdr endpoint it was started with, and ends.
fn binding_supervisor(scratch: &Scratch) -> std::path::PathBuf {
    use std::os::unix::fs::PermissionsExt;
    let host = scratch.0.join("bin").join("session-host.sh");
    std::fs::write(
        &host,
        "#!/bin/sh\nrun=$(dirname \"$4\")\ncp \"$4\" \"$run/../../seen-envelope.json\"\nprintf '%s' \"$FGOS_HERDR_BIN\" > \"$run/../../seen-herdr-bin\"\n: > \"$run/supervisor-binding.json\"\n",
    )
    .unwrap();
    std::fs::set_permissions(&host, std::fs::Permissions::from_mode(0o755)).unwrap();
    host
}

fn read(file: &std::path::Path) -> Value {
    serde_json::from_str(&std::fs::read_to_string(file).unwrap()).unwrap()
}

fn session_launch() {
    let scratch = Scratch::new("session");
    let (main, _) = repo(&scratch);
    let (bin, _) = stub_bin(&scratch);
    let host_bin = binding_supervisor(&scratch);
    let request = SessionRequest::from_json(&json!({
        "binding": { "executor": "stub", "invocation": "stub-cli", "model": "stub-model", "tier": "standard" },
        "runnerConfig": runner(&bin),
        "key": "head-planner-p-1",
        "role": "head:planner-p",
        "grant": { "writes": [] },
        "opening": "read the portfolio",
        "ceilingMs": 3_600_000,
        "env": { "FGOS_HEAD_PERSONA": "planner", "FGOS_HEAD_NAME": "p", "FGOS_HEAD_GEN": "1" },
        "projectRoot": main,
        "display": { "id": "p", "title": "planner" },
    }))
    .unwrap();
    let seen = Arc::new(Mutex::new(Seen::default()));
    let placed = launch_session(
        &request,
        AttemptHost {
            host_bin: host_bin.to_string_lossy().into(),
            payload_root: env!("CARGO_MANIFEST_DIR").replace("/apps/fgos", ""),
        },
        Some(Arc::new(FakeRoute(seen.clone()))),
    )
    .unwrap_or_else(|e| panic!("{e:?}"));

    assert_eq!(placed.host, "terminal");
    assert_eq!(placed.key, placed.attempt_id);
    let assignment = main.join(".fgos/assignments/head-planner-p-1");
    assert_eq!(placed.run_dir, assignment.join("runs/01"));

    // The supervisor got the attempt's envelope: a session of the role its grant names, with its request socket and
    // the head its environment names, bounded by its ceiling, confined, and with no settle step.
    let envelope = read(&assignment.join("seen-envelope.json"));
    assert_eq!(envelope["attemptId"], placed.attempt_id.as_str());
    assert_eq!(envelope["session"]["role"], "head:planner-p");
    assert_eq!(envelope["session"]["persona"], "planner");
    assert!(envelope["session"]["requestSocketPath"].is_string());
    assert!(
        envelope["containment"]["bwrapPrefix"].is_array(),
        "{envelope}"
    );
    let steps: Vec<&str> = envelope["steps"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|s| s["stepId"].as_str())
        .collect();
    assert!(!steps.contains(&"settle-attempt"), "{steps:?}");
    // The supervisor is started with the endpoint of the pane (its environment is otherwise only the step's).
    assert!(!std::fs::read_to_string(assignment.join("seen-herdr-bin"))
        .unwrap()
        .is_empty());
    {
        let seen = seen.lock().unwrap();
        assert_eq!(seen.allocated.len(), 1);
        assert_eq!(seen.allocated[0].1.key, placed.attempt_id);
        assert!(seen.released.is_empty(), "a bound session keeps its pane");
    }
    // Handed over and bound: this controller holds the attempt no more.
    let intent = read(&placed.run_dir.join("attempt-intent.json"));
    assert_eq!(intent["attemptId"], placed.attempt_id.as_str());
    let lock = fgos_run_supervisor::controller::launch::acquire_attempt_locks(
        fgos_run_supervisor::controller::launch::AttemptLockRequest {
            fgos_dir: &main.join(".fgos"),
            assignment_dir: &assignment,
            attempt_str: "01",
            cwd: &main,
            mutating: false,
            custody: None,
            executor_id: Some("stub"),
            capability: Some("execute"),
        },
    );
    assert!(lock.is_ok(), "the attempt lock is free: {lock:?}");
}

fn session_launch_workdir() {
    let scratch = Scratch::new("session-workdir");
    let (main, tree) = repo(&scratch);
    let (bin, _) = stub_bin(&scratch);
    let host_bin = binding_supervisor(&scratch);
    // Write grant target directory in worktree
    std::fs::create_dir_all(tree.join("plans/discussions/test")).unwrap();

    let request = SessionRequest::from_json(&json!({
        "binding": { "executor": "stub", "invocation": "stub-cli", "model": "stub-model", "tier": "standard" },
        "runnerConfig": runner(&bin),
        "key": "head-shaper-s-1",
        "role": "head:shaper-s",
        "grant": { "writes": ["plans/discussions/test"] },
        "opening": "read the discussion",
        "ceilingMs": 3_600_000,
        "env": { "FGOS_HEAD_PERSONA": "shaper", "FGOS_HEAD_NAME": "s", "FGOS_HEAD_GEN": "1" },
        "projectRoot": main,
        "workdir": tree,
        "display": { "id": "s", "title": "shaper" },
    }))
    .unwrap();
    let seen = Arc::new(Mutex::new(Seen::default()));
    let placed = launch_session(
        &request,
        AttemptHost {
            host_bin: host_bin.to_string_lossy().into(),
            payload_root: env!("CARGO_MANIFEST_DIR").replace("/apps/fgos", ""),
        },
        Some(Arc::new(FakeRoute(seen.clone()))),
    )
    .unwrap_or_else(|e| panic!("{e:?}"));

    assert_eq!(placed.host, "terminal");
    assert_eq!(placed.key, placed.attempt_id);

    // .fgos remains in the project root
    let assignment = main.join(".fgos/assignments/head-shaper-s-1");
    assert_eq!(placed.run_dir, assignment.join("runs/01"));
    assert!(main.join(".fgos").exists());
    assert!(!tree.join(".fgos").exists());

    // Cwd of the allocated pane is in the worktree
    {
        let seen = seen.lock().unwrap();
        assert_eq!(seen.allocated.len(), 1);
        assert_eq!(
            seen.allocated[0].1.cwd.as_deref(),
            Some(tree.to_str().unwrap())
        );
    }

    // Envelope shows attempt cwd in worktree and sandbox root/bindings in worktree
    let envelope = read(&assignment.join("seen-envelope.json"));
    assert_eq!(envelope["attemptId"], placed.attempt_id.as_str());
    assert_eq!(envelope["session"]["role"], "head:shaper-s");
    assert_eq!(envelope["session"]["persona"], "shaper");
    let bwrap_prefix = envelope["containment"]["bwrapPrefix"].as_array().unwrap();
    let binds_tree = bwrap_prefix.iter().any(|v| {
        v.as_str()
            .is_some_and(|s| s.contains(tree.to_str().unwrap()))
    });
    assert!(
        binds_tree,
        "bwrap prefix must bind paths in the worktree: {bwrap_prefix:?}"
    );
}

fn session_refuse_unlinked_workdir() {
    let scratch = Scratch::new("session-refuse");
    let (main, tree) = repo(&scratch);
    let (bin, _) = stub_bin(&scratch);
    let host = AttemptHost {
        host_bin: "/bin/true".into(),
        payload_root: env!("CARGO_MANIFEST_DIR").replace("/apps/fgos", ""),
    };

    // 1. Project root itself is refused as workdir
    let request_main = SessionRequest::from_json(&json!({
        "binding": { "executor": "stub", "invocation": "stub-cli", "model": "stub-model", "tier": "standard" },
        "runnerConfig": runner(&bin),
        "key": "head-shaper-refuse-1",
        "role": "head:shaper-s",
        "grant": { "writes": [] },
        "opening": "test",
        "ceilingMs": 3_600_000,
        "env": { "FGOS_HEAD_PERSONA": "shaper" },
        "projectRoot": main,
        "workdir": main,
    }))
    .unwrap();
    let err = launch_session(&request_main, host.clone(), None).unwrap_err();
    assert_eq!(err.code, "workdir-not-linked");
    assert_eq!(
        err.extra.get("workdir").and_then(Value::as_str),
        Some(main.to_str().unwrap())
    );

    // 2. Directory outside any git repo is refused
    let not_repo = scratch.0.join("not-repo");
    std::fs::create_dir_all(&not_repo).unwrap();
    let request_not_repo = SessionRequest::from_json(&json!({
        "binding": { "executor": "stub", "invocation": "stub-cli", "model": "stub-model", "tier": "standard" },
        "runnerConfig": runner(&bin),
        "key": "head-shaper-refuse-2",
        "role": "head:shaper-s",
        "grant": { "writes": [] },
        "opening": "test",
        "ceilingMs": 3_600_000,
        "env": { "FGOS_HEAD_PERSONA": "shaper" },
        "projectRoot": main,
        "workdir": not_repo,
    }))
    .unwrap();
    let err = launch_session(&request_not_repo, host.clone(), None).unwrap_err();
    assert_eq!(err.code, "workdir-not-linked");
    assert_eq!(
        err.extra.get("workdir").and_then(Value::as_str),
        Some(not_repo.to_str().unwrap())
    );

    // 3. Worktree of another repository is refused
    let other_scratch = Scratch::new("other-repo");
    let (_, other_tree) = repo(&other_scratch);
    let request_other_tree = SessionRequest::from_json(&json!({
        "binding": { "executor": "stub", "invocation": "stub-cli", "model": "stub-model", "tier": "standard" },
        "runnerConfig": runner(&bin),
        "key": "head-shaper-refuse-3",
        "role": "head:shaper-s",
        "grant": { "writes": [] },
        "opening": "test",
        "ceilingMs": 3_600_000,
        "env": { "FGOS_HEAD_PERSONA": "shaper" },
        "projectRoot": main,
        "workdir": other_tree,
    }))
    .unwrap();
    let err = launch_session(&request_other_tree, host, None).unwrap_err();
    assert_eq!(err.code, "workdir-not-linked");
    assert_eq!(
        err.extra.get("workdir").and_then(Value::as_str),
        Some(other_tree.to_str().unwrap())
    );

    // 4. Valid linked worktree parses successfully
    let request_valid = SessionRequest::from_json(&json!({
        "binding": { "executor": "stub", "invocation": "stub-cli", "model": "stub-model", "tier": "standard" },
        "runnerConfig": runner(&bin),
        "key": "head-shaper-valid",
        "role": "head:shaper-s",
        "grant": { "writes": [] },
        "opening": "test",
        "ceilingMs": 3_600_000,
        "env": { "FGOS_HEAD_PERSONA": "shaper" },
        "projectRoot": main,
        "workdir": tree,
    }))
    .unwrap();
    assert_eq!(request_valid.workdir.as_deref(), Some(tree.as_path()));
    assert_eq!(request_valid.working_checkout(), tree.as_path());

    // 5. Relative workdir is refused at parse time
    let relative_err = SessionRequest::from_json(&json!({
        "binding": { "executor": "stub", "invocation": "stub-cli", "model": "stub-model", "tier": "standard" },
        "runnerConfig": runner(&bin),
        "key": "head-shaper-rel",
        "role": "head:shaper-s",
        "grant": { "writes": [] },
        "opening": "test",
        "ceilingMs": 3_600_000,
        "env": { "FGOS_HEAD_PERSONA": "shaper" },
        "projectRoot": main,
        "workdir": "relative/tree",
    }))
    .unwrap_err();
    assert_eq!(relative_err, "workdir must be an absolute path");
}
