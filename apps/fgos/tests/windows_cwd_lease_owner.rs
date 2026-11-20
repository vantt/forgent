//! A writing attempt on Windows, through the real host binary's supervisor and gate: the controller holds the cwd
//! lease (its custody) in its own process, since a `LockFileEx` lock is held only by the process that took it, and
//! serves the lease's request channel while it hands the attempt over. The supervisor declares its job there before
//! GO, the agent writes its file, and the controller still holds the lease after the supervisor is gone.
#![cfg(windows)]

use std::path::PathBuf;
use std::time::{Duration, Instant};

use fgos_execution_engine::assignment_runner::attempt::{open_attempt, OpenAttempt};
use fgos_execution_engine::assignment_runner::launch::{cwd_lease_owner_dir, start_and_bind};
use fgos_holder_lock::{predecessor, probe, LockScope, Probe, Resource};
use fgos_run_supervisor::controller::cwd_lock::admit_successor;
use fgos_run_supervisor::controller::launch::{
    acquire_attempt_locks, build_envelope, prepare_attempt_files, write_attempt_files, AttemptHost,
    AttemptLaunch, AttemptLockRequest, Binding, EnvelopeInput,
};
use serde_json::{json, Map, Value};

fn scratch() -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!(
        "fgos-cwd-lease-owner-{}-{nanos}",
        std::process::id()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn env_of(names: &[&str]) -> Map<String, Value> {
    names
        .iter()
        .filter_map(|name| {
            std::env::var(name)
                .ok()
                .map(|v| (name.to_string(), json!(v)))
        })
        .collect()
}

#[test]
fn a_writing_attempt_declares_its_job_on_the_lease_the_controller_holds() {
    let cwd = scratch();
    let fgos_dir = cwd.join(".fgos");
    let assignment_dir = fgos_dir.join("assignments").join("custody");
    let run_dir = assignment_dir.join("runs").join("01");
    let attempt_id = format!("windows-lease-owner-{}", std::process::id());
    let scope = LockScope::seeded(Vec::new()).unwrap();
    let custody = admit_successor(&scope, &fgos_dir, &cwd).expect("custody of the worktree");
    let locks = acquire_attempt_locks(AttemptLockRequest {
        fgos_dir: &fgos_dir,
        assignment_dir: &assignment_dir,
        attempt_str: "01",
        cwd: &cwd,
        mutating: true,
        custody: Some(&custody),
        executor_id: None,
        capability: None,
    })
    .expect("the attempt locks");
    prepare_attempt_files(&run_dir, &attempt_id).unwrap();
    let host = AttemptHost {
        host_bin: env!("CARGO_BIN_EXE_fgos").into(),
        payload_root: concat!(env!("CARGO_MANIFEST_DIR"), "/../..").into(),
    };
    let step_env = env_of(&["PATH", "SystemRoot", "ComSpec"]);
    let comspec = std::env::var("ComSpec").unwrap_or_else(|_| "cmd.exe".into());
    let launch = AttemptLaunch {
        command: comspec,
        args: vec!["/d".into(), "/c".into(), "echo new> b".into()],
        env: step_env.clone(),
        bwrap_prefix: None,
        bwrap_executable: None,
    };
    let owner = cwd_lease_owner_dir(&run_dir).to_string_lossy().into_owned();
    let lease_file = custody.path().to_string_lossy().into_owned();
    let mut body = build_envelope(&EnvelopeInput {
        attempt_id: &attempt_id,
        unit_run_id: "unit-lease-owner",
        run_dir: &run_dir,
        host: &host,
        cwd: &cwd.to_string_lossy(),
        mutating: true,
        attempt: &launch,
        timeout_ms: 30_000,
        idle_timeout_ms: 0,
        max_output_bytes: Some(1 << 20),
        cli: &json!("claude"),
        step_env: &step_env,
        gate_kill_grace_ms: 1000,
        kill_wait_ms: 2000,
        cwd_lease_file: Some(&lease_file),
        cwd_lease_owner: Some(&owner),
        identity: None,
        terminal: None,
        extra_steps: &[],
        session: None,
        ceiling_ms: None,
        lanes: None,
    })
    .expect("the envelope");
    // No settle step: the proof ends at the supervisor's receipt.
    body["steps"] = json!([]);
    let envelope = write_attempt_files(&run_dir, &body, &json!({}), 1, "test").unwrap();
    let mut attempt = open_attempt(OpenAttempt {
        run_dir: run_dir.clone(),
        run_id: "01".into(),
        attempt_id: attempt_id.clone(),
        unit_run_id: "unit-lease-owner".into(),
        terminal: false,
        cwd: cwd.to_string_lossy().into_owned(),
        host: Some(host),
        step_env,
        custody: true,
        lease_runtime_dir: None,
        session: false,
    });
    attempt.locks = Some(locks);

    let (bound, mut started) = start_and_bind(&mut attempt, &envelope, &Map::new(), Some(&custody))
        .expect("the attempt is handed over");
    let log = || std::fs::read_to_string(run_dir.join("supervisor.log")).unwrap_or_default();
    assert!(
        matches!(bound, Binding::Bound),
        "bound: {bound:?}\n{}",
        log()
    );
    let record: Value = serde_json::from_slice(
        &std::fs::read(predecessor::record_path(custody.path())).expect("the lease's record"),
    )
    .unwrap();
    assert_eq!(record["domainKind"], "windows-job", "{record}");
    let lease = Resource::new("dispatch-cwd", custody.path());
    assert_eq!(probe(&lease).unwrap(), Probe::Held);

    let until = Instant::now() + Duration::from_secs(60);
    let status = loop {
        if let Some(status) = started.child.try_wait().unwrap() {
            break status;
        }
        assert!(
            Instant::now() < until,
            "the supervisor never ended\n{}",
            log()
        );
        std::thread::sleep(Duration::from_millis(50));
    };
    assert!(
        run_dir.join("receipt.json").exists(),
        "no receipt (supervisor {status})\n{}",
        log()
    );
    let written = std::fs::read_to_string(cwd.join("b")).expect("the agent's file");
    assert_eq!(written.trim_end(), "new");
    assert_eq!(
        probe(&lease).unwrap(),
        Probe::Held,
        "the controller keeps custody after its supervisor is gone"
    );
    custody.clear_domain().unwrap();
    drop(attempt);
    drop(custody);
    assert_eq!(probe(&lease).unwrap(), Probe::Free);
    let _ = std::fs::remove_dir_all(&cwd);
}
