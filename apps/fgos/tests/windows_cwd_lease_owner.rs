//! A writing attempt on Windows, through the real host binary's supervisor and gate: the controller holds the cwd
//! lease (its custody) in its own process, since a `LockFileEx` lock is held only by the process that took it, and
//! serves the lease's request channel for the attempt's whole life. The supervisor declares its job there before
//! GO, the agent writes its file, a later declaration (an adopted supervisor's) is still answered after the binding,
//! a command run as a borrower of the custody reports its exit, and the controller still holds the lease after the
//! supervisor is gone.
#![cfg(windows)]

use std::path::PathBuf;
use std::time::{Duration, Instant};

use fgos_execution_engine::assignment_runner::attempt::Attempt;
use fgos_execution_engine::assignment_runner::attempt::{open_attempt, OpenAttempt};
use fgos_execution_engine::assignment_runner::launch::{
    await_binding, cwd_lease_owner_dir, start_and_bind, AwaitInput,
};
use fgos_holder_lock::{
    predecessor, probe, run_borrowed_io, BorrowIo, BorrowSpec, BorrowStdio, Handle, LockScope,
    Probe, Resource,
};
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

/// One writing attempt prepared under the controller's custody of `cwd`: the attempt's locks and files, its envelope
/// (no settle step: the proof ends at the supervisor's receipt) and the attempt that carries them.
struct Prepared {
    cwd: PathBuf,
    run_dir: PathBuf,
    owner: PathBuf,
    envelope: Value,
    attempt: Attempt,
}

fn prepare(cwd: &std::path::Path, custody: &Handle, agent_args: &str) -> Prepared {
    let fgos_dir = cwd.join(".fgos");
    let assignment_dir = fgos_dir.join("assignments").join("custody");
    let run_dir = assignment_dir.join("runs").join("01");
    let attempt_id = format!("windows-lease-owner-{}", std::process::id());
    let locks = acquire_attempt_locks(AttemptLockRequest {
        fgos_dir: &fgos_dir,
        assignment_dir: &assignment_dir,
        attempt_str: "01",
        cwd,
        mutating: true,
        custody: Some(custody),
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
        args: vec!["/d".into(), "/c".into(), agent_args.into()],
        env: step_env.clone(),
        bwrap_prefix: None,
        bwrap_executable: None,
    };
    let owner = cwd_lease_owner_dir(&run_dir);
    let owner_text = owner.to_string_lossy().into_owned();
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
        cwd_lease_owner: Some(&owner_text),
        identity: None,
        terminal: None,
        extra_steps: &[],
        session: None,
        ceiling_ms: None,
        lanes: None,
    })
    .expect("the envelope");
    body["steps"] = json!([]);
    let envelope = write_attempt_files(&run_dir, &body, &json!({}), 1, "test").unwrap();
    let mut attempt = open_attempt(OpenAttempt {
        run_dir: run_dir.clone(),
        run_id: "01".into(),
        attempt_id,
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
    Prepared {
        cwd: cwd.to_path_buf(),
        run_dir,
        owner,
        envelope,
        attempt,
    }
}

fn custody_of(scope: &LockScope<'_>, cwd: &std::path::Path) -> Handle {
    admit_successor(scope, &cwd.join(".fgos"), cwd).expect("custody of the worktree")
}

/// A declaration the way a supervisor makes it on the channel the envelope names: a request file, answered by a
/// result file. `Ok` is the holder's answer.
fn declare_on_channel(owner: &std::path::Path, domain: &Value) -> Result<Value, String> {
    let n = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let target = owner.join(format!("req-{n}.json"));
    let temporary = owner.join(format!("req-{n}.json.tmp"));
    std::fs::write(
        &temporary,
        json!({ "op": "declare-domain", "domain": domain }).to_string(),
    )
    .map_err(|e| e.to_string())?;
    std::fs::rename(&temporary, &target).map_err(|e| e.to_string())?;
    let result = owner.join(format!("result-{n}.json"));
    let until = Instant::now() + Duration::from_secs(5);
    loop {
        match std::fs::read(&result) {
            Ok(bytes) => {
                let _ = std::fs::remove_file(&target);
                let _ = std::fs::remove_file(&result);
                return serde_json::from_slice(&bytes).map_err(|e| e.to_string());
            }
            Err(_) if Instant::now() < until => std::thread::sleep(Duration::from_millis(5)),
            Err(e) => {
                let _ = std::fs::remove_file(&target);
                return Err(format!("no answer on the lease channel: {e}"));
            }
        }
    }
}

#[test]
fn a_writing_attempt_declares_its_job_on_the_lease_the_controller_holds() {
    let scope = LockScope::seeded(Vec::new()).unwrap();
    let cwd = scratch();
    let custody = custody_of(&scope, &cwd);
    // The lease is the one a Node controller takes for this worktree: its key is Node's `cwdDevIno`.
    let node = std::process::Command::new("node")
        .args([
            "-e",
            "const fs=require('fs');const s=fs.statSync(fs.realpathSync(process.argv[1]),{bigint:true});process.stdout.write(`${s.dev}-${s.ino}-${s.birthtimeNs}`)",
        ])
        .arg(&cwd)
        .output()
        .expect("node runs");
    assert_eq!(
        custody.path().file_name().unwrap().to_string_lossy(),
        format!(
            "dispatch-cwd--{}.lock",
            String::from_utf8_lossy(&node.stdout)
        )
    );
    let mut prepared = prepare(&cwd, &custody, "echo new> b");
    let run_dir = prepared.run_dir.clone();
    let (bound, mut started) = start_and_bind(
        &mut prepared.attempt,
        &prepared.envelope,
        &Map::new(),
        Some(&custody),
    )
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
    let written = std::fs::read_to_string(prepared.cwd.join("b")).expect("the agent's file");
    assert_eq!(written.trim_end(), "new");
    assert_eq!(
        probe(&lease).unwrap(),
        Probe::Held,
        "the controller keeps custody after its supervisor is gone"
    );
    custody.clear_domain().unwrap();
    drop(prepared.attempt);
    drop(custody);
    assert_eq!(probe(&lease).unwrap(), Probe::Free);
    let _ = std::fs::remove_dir_all(&cwd);
}

#[test]
fn the_lease_channel_answers_a_later_declaration_while_the_attempt_runs() {
    let scope = LockScope::seeded(Vec::new()).unwrap();
    let cwd = scratch();
    let custody = custody_of(&scope, &cwd);
    // The agent outlives the binding by a few seconds, so the channel is asked well after the binding is known.
    let mut prepared = prepare(&cwd, &custody, "echo new> b & ping -n 6 127.0.0.1 > nul");
    let owner = prepared.owner.clone();
    let record_file = predecessor::record_path(custody.path());
    let asker = std::thread::spawn(move || {
        // Wait for the first supervisor's own declaration on the lease, then declare again the way an adopted or
        // restarted supervisor does, with the record the lease now carries.
        let until = Instant::now() + Duration::from_secs(60);
        let first = loop {
            if let Ok(bytes) = std::fs::read(&record_file) {
                if let Ok(record) = serde_json::from_slice::<Value>(&bytes) {
                    if record["domainKind"] == "windows-job" {
                        break record;
                    }
                }
            }
            assert!(
                Instant::now() < until,
                "the supervisor never declared its job"
            );
            std::thread::sleep(Duration::from_millis(20));
        };
        std::thread::sleep(Duration::from_millis(500));
        let mut again = first;
        again["v"] = json!(1);
        declare_on_channel(&owner, &again)
    });
    let mut chunks = |_: &str, _: &str| {};
    let _ = await_binding(
        &mut prepared.attempt,
        AwaitInput {
            envelope: &prepared.envelope,
            timeout_ms: 30_000,
            gate_kill_grace_ms: 1000,
            on_chunk: &mut chunks,
            stop_screen: None,
            custody: Some(&custody),
            extra_env: &Map::new(),
        },
    );
    let answer = asker
        .join()
        .unwrap()
        .expect("a later declaration is answered");
    assert_eq!(answer["result"], "declared", "{answer}");
    let lease = Resource::new("dispatch-cwd", custody.path());
    assert_eq!(probe(&lease).unwrap(), Probe::Held);
    custody.clear_domain().unwrap();
    drop(prepared.attempt);
    drop(custody);
    let _ = std::fs::remove_dir_all(&cwd);
}

#[test]
fn a_command_runs_as_a_borrower_of_the_custody_and_reports_its_exit() {
    let scope = LockScope::seeded(Vec::new()).unwrap();
    let cwd = scratch();
    let custody = custody_of(&scope, &cwd);
    let run = |command: &str| {
        let spec = BorrowSpec {
            argv: vec!["cmd".into(), "/C".into(), command.into()],
            cwd: Some(cwd.clone()),
            env: Default::default(),
            clear_env: false,
            stdio: BorrowStdio::Null,
        };
        let io = BorrowIo {
            stdin: Vec::new(),
            stdout_limit: 1 << 20,
            stderr_limit: 1 << 20,
            deadline: Instant::now() + Duration::from_secs(60),
        };
        run_borrowed_io(&custody, &spec, &io).expect("the borrowed command runs")
    };
    let passed = run("echo verified");
    assert_eq!(passed.outcome.exit, Some(0));
    assert!(String::from_utf8_lossy(&passed.stdout).contains("verified"));
    let failed = run("exit 3");
    assert_eq!(failed.outcome.exit, Some(3));
    let lease = Resource::new("dispatch-cwd", custody.path());
    assert_eq!(
        probe(&lease).unwrap(),
        Probe::Held,
        "the custody is still held after the borrows"
    );
    drop(custody);
    let _ = std::fs::remove_dir_all(&cwd);
}
