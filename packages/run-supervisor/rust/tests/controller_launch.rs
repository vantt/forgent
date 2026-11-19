//! The controller's launch half against the vectors recorded from `direct-launch.mjs`
//! (`contracts/controller/launch.v1.json`), plus the files, locks and waits the vectors cannot carry.

use fgos_run_supervisor::controller::launch::*;
use serde_json::{json, Map, Value};
use std::path::{Path, PathBuf};

const VECTOR: &str = include_str!("../../contracts/controller/launch.v1.json");

fn vector() -> Value {
    serde_json::from_str(VECTOR).unwrap()
}

fn scratch(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "fgos-controller-launch-{name}-{}",
        std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn host() -> AttemptHost {
    AttemptHost {
        host_bin: "/h/fgos".into(),
        payload_root: "/h/payload".into(),
    }
}

/// The recorder's normalisation: clock fields become an offset from `createdAt` in whole seconds.
fn normalised(envelope: &Value) -> Value {
    let created = envelope["createdAt"]["boottimeNs"].as_i64().unwrap();
    let secs =
        |at: &Value| ((at["boottimeNs"].as_i64().unwrap() - created) as f64 / 1e9).round() as i64;
    let mut out = envelope.clone();
    out["createdAt"] = json!({"bootId": "<boot>"});
    if !envelope["deadlines"]["softAt"].is_null() {
        out["deadlines"]["softAt"] =
            json!({"bootId": "<boot>", "afterSec": secs(&envelope["deadlines"]["softAt"])});
    }
    out["deadlines"]["hardCeiling"] =
        json!({"bootId": "<boot>", "afterSec": secs(&envelope["deadlines"]["hardCeiling"])});
    out
}

struct Case {
    mutating: bool,
    cwd_lease_file: Option<&'static str>,
    confined: Option<Vec<String>>,
    max_output: Option<u64>,
    idle: u64,
    timeout: u64,
    lanes: bool,
    terminal: bool,
    extra: Vec<String>,
    session: Option<Value>,
    ceiling: Option<u64>,
}

impl Case {
    fn base() -> Self {
        Case {
            mutating: true,
            cwd_lease_file: Some("/l/cwd.lock"),
            confined: Some(vec!["--unshare-pid".into(), "--".into()]),
            max_output: Some(4096),
            idle: 500,
            timeout: 1000,
            lanes: false,
            terminal: false,
            extra: vec![],
            session: None,
            ceiling: None,
        }
    }
}

fn build(case: &Case) -> Result<Value, fgos_run_supervisor::controller::error::DispatchError> {
    let host = host();
    let attempt = AttemptLaunch {
        command: "/bin/agent".into(),
        args: if case.confined.is_some() {
            vec!["-p".into()]
        } else {
            vec![]
        },
        env: if case.confined.is_some() {
            Map::from_iter([("A".to_string(), json!("1"))])
        } else {
            Map::new()
        },
        bwrap_prefix: case.confined.clone(),
        bwrap_executable: case.confined.as_ref().map(|_| "/usr/bin/bwrap".to_string()),
    };
    let step_env = Map::from_iter([("PATH".to_string(), json!("/bin"))]);
    let cli = json!("claude");
    let terminal = TerminalInput {
        brief_path: "/r/brief.md".into(),
        outbox_dir: Some("/r/out".into()),
        group_key: "g1".into(),
        socket_path: "/run/u/fgos/abc.sock".into(),
        exit_command: None,
        orphan_settle_ms: 100,
        retain_failed_pane_ms: Some(json!(5000)),
    };
    let lanes = lane_transport(
        Some(&LaneSettings {
            ceiling: Some(4),
            lane_wait_sec: 3,
        }),
        0,
    );
    build_envelope(&EnvelopeInput {
        attempt_id: "att-1",
        unit_run_id: "ur-1",
        run_dir: Path::new("/r/run"),
        host: &host,
        cwd: "/w",
        mutating: case.mutating,
        attempt: &attempt,
        timeout_ms: case.timeout,
        idle_timeout_ms: case.idle,
        max_output_bytes: case.max_output,
        cli: &cli,
        step_env: &step_env,
        gate_kill_grace_ms: 2000,
        kill_wait_ms: 300,
        cwd_lease_file: case.cwd_lease_file,
        cwd_lease_owner: None,
        identity: None,
        terminal: case.terminal.then_some(&terminal),
        extra_steps: &case.extra,
        session: case.session.as_ref(),
        ceiling_ms: case.ceiling,
        lanes: case.lanes.then_some(&lanes).and_then(|l| l.as_ref()),
    })
}

#[test]
fn every_recorded_envelope_and_refusal_is_built_as_the_node_launcher_built_it() {
    let session = Some(json!({"role": "head:a-b", "verbs": []}));
    let cases: Vec<(&str, Case)> = vec![
        ("direct-confined-mutating", Case::base()),
        (
            "direct-readonly-unconfined",
            Case {
                mutating: false,
                cwd_lease_file: None,
                confined: None,
                max_output: Some(0),
                idle: 0,
                timeout: 0,
                ..Case::base()
            },
        ),
        (
            "direct-lanes",
            Case {
                lanes: true,
                ..Case::base()
            },
        ),
        (
            "terminal-lanes-extra-step",
            Case {
                terminal: true,
                extra: vec!["cleanup-trust".into()],
                lanes: true,
                ..Case::base()
            },
        ),
        (
            "session",
            Case {
                terminal: true,
                session: session.clone(),
                ceiling: Some(9000),
                lanes: true,
                ..Case::base()
            },
        ),
        (
            "session-needs-terminal",
            Case {
                session: session.clone(),
                ceiling: Some(9000),
                ..Case::base()
            },
        ),
        (
            "session-needs-ceiling",
            Case {
                terminal: true,
                session: session.clone(),
                ..Case::base()
            },
        ),
        (
            "too-many-steps",
            Case {
                extra: vec!["a".into(), "b".into()],
                ..Case::base()
            },
        ),
        (
            "pid-namespace-required",
            Case {
                confined: Some(vec!["--ro-bind".into(), "--".into()]),
                ..Case::base()
            },
        ),
    ];
    let recorded = vector();
    let recorded = recorded["envelopes"].as_array().unwrap();
    assert_eq!(recorded.len(), cases.len());
    for ((label, case), want) in cases.iter().zip(recorded) {
        assert_eq!(want["label"], *label);
        match build(case) {
            Ok(body) => assert_eq!(normalised(&body), want["envelope"], "envelope {label}"),
            Err(error) => {
                assert_eq!(
                    json!({"code": error.code, "message": error.message, "runDir": error.detail["runDir"]}),
                    want["error"],
                    "refusal {label}"
                );
            }
        }
    }
}

#[test]
fn paths_gate_commands_lane_transport_and_waits_match_the_recorded_answers() {
    let v = vector();
    let paths = attempt_paths(Path::new("/r/run"), "a1");
    let want = &v["paths"];
    assert_eq!(paths.run_dir.to_str().unwrap(), want["runDir"]);
    assert_eq!(paths.side_file.to_str().unwrap(), want["sideFile"]);
    assert_eq!(paths.capture_dir.to_str().unwrap(), want["captureDir"]);
    assert_eq!(paths.stdout.to_str().unwrap(), want["stdout"]);
    assert_eq!(paths.stderr.to_str().unwrap(), want["stderr"]);
    assert_eq!(paths.gate_exit.to_str().unwrap(), want["gateExit"]);
    assert_eq!(paths.outbox_dir.to_str().unwrap(), want["outboxDir"]);
    assert_eq!(
        json!(attempt_gate_command("/h/fgos", Path::new("/r/run"), None)),
        v["gate"]["direct"]
    );
    assert_eq!(
        json!(attempt_gate_command(
            "/h/fgos",
            Path::new("/r/run"),
            Some("/run/u/s.sock")
        )),
        v["gate"]["terminal"]
    );
    for row in v["laneTransport"].as_array().unwrap() {
        let lanes = (!row["lanes"].is_null()).then(|| LaneSettings {
            ceiling: row["lanes"]["ceiling"].as_u64(),
            lane_wait_sec: row["lanes"]["laneWaitSec"].as_u64().unwrap(),
        });
        let got = lane_transport(lanes.as_ref(), row["depth"].as_u64().unwrap());
        assert_eq!(got.unwrap_or(Value::Null), row["out"], "{row}");
    }
    for row in v["waits"].as_array().unwrap() {
        let envelope = &row["envelope"];
        assert_eq!(
            lane_wait_budget_ms(envelope),
            row["laneWaitMs"].as_u64().unwrap()
        );
        assert_eq!(
            binding_wait_ms(envelope),
            row["bindingWaitMs"].as_u64().unwrap()
        );
        assert_eq!(
            settlement_ceiling_ms(envelope, 1000, 500),
            row["settlementCeilingMs"].as_u64().unwrap()
        );
    }
}

#[test]
fn the_step_environment_passes_the_allow_list_and_fgos_variables_but_never_a_lock_descriptor() {
    let env = std::collections::BTreeMap::from_iter(
        [
            ("PATH", "/bin"),
            ("HOME", "/home/u"),
            ("FGOS_X", "1"),
            ("FGOS_LOCK_FD", "x"),
            ("FGOS_LOCK_JOB", "j"),
            ("FGOS_RUST_HOST_RECURSION_GUARD", "1"),
            ("OTHER", "z"),
            ("XDG_RUNTIME_DIR", "/run/u"),
        ]
        .map(|(k, v)| (k.to_string(), v.to_string())),
    );
    let out = attempt_step_env(&env);
    for kept in ["PATH", "HOME", "FGOS_X", "XDG_RUNTIME_DIR"] {
        assert!(out.contains_key(kept), "{kept}");
    }
    for dropped in [
        "FGOS_LOCK_FD",
        "FGOS_LOCK_JOB",
        "FGOS_RUST_HOST_RECURSION_GUARD",
        "OTHER",
    ] {
        assert!(!out.contains_key(dropped), "{dropped}");
    }
    assert!(out["FGOS_STATE_ROOT"]
        .as_str()
        .is_some_and(|s| s.starts_with('/')));
}

#[test]
fn an_attempts_writer_id_replaces_what_the_controller_carried() {
    let env = Map::from_iter([
        ("FGOS_SESSION_ID".to_string(), json!("old")),
        ("A".to_string(), json!("1")),
    ]);
    let out = with_identity_env(
        &env,
        Some(&json!({"writerId": "w1", "parentWriterId": "p1"})),
    );
    assert_eq!(out["FGOS_SESSION_ID"], "w1");
    assert_eq!(out["FGOS_PARENT_WRITER_ID"], "p1");
    assert_eq!(out["A"], "1");
    assert_eq!(with_identity_env(&env, None), env);
}

#[test]
fn the_envelope_and_the_side_file_are_each_written_once_and_the_digest_verifies() {
    let dir = scratch("files");
    let run_dir = dir.join("run");
    std::fs::create_dir_all(&run_dir).unwrap();
    let mut body = build(&Case::base()).unwrap();
    body["runDir"] = run_dir.to_str().unwrap().into();
    body["sideFile"] = run_dir
        .join("protected")
        .join("attempt-secrets.json")
        .to_str()
        .unwrap()
        .into();
    let written = write_attempt_files(&run_dir, &body, &json!({"S": "secret"}), 2, "tok").unwrap();
    assert!(written["digest"].as_str().unwrap().starts_with("sha256:"));
    let verified =
        fgos_run_supervisor::envelope::read_verified(&run_dir.join("envelope.json")).unwrap();
    assert_eq!(verified["digest"], written["digest"]);
    let side: Value = serde_json::from_str(
        &std::fs::read_to_string(run_dir.join("protected/attempt-secrets.json")).unwrap(),
    )
    .unwrap();
    assert_eq!(
        side,
        json!({"v": 1, "attemptId": "att-1", "env": {"S": "secret"}, "controlEpoch": 2, "controlToken": "tok"})
    );
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        assert_eq!(
            std::fs::metadata(run_dir.join("protected/attempt-secrets.json"))
                .unwrap()
                .permissions()
                .mode()
                & 0o777,
            0o600
        );
        assert_eq!(
            std::fs::metadata(run_dir.join("protected"))
                .unwrap()
                .permissions()
                .mode()
                & 0o777,
            0o700
        );
    }
    assert!(
        write_attempt_files(&run_dir, &body, &json!({}), 2, "tok").is_err(),
        "a second write finds the side file and the envelope"
    );
}

#[test]
fn the_intent_names_the_steps_and_a_pane_and_is_taken_back() {
    let dir = scratch("intent");
    let step_env = Map::new();
    let pane = json!({"slot": {"key": "att-1", "groupKey": "g1"}, "endpointEnv": {"E": "1"}});
    write_attempt_intent(&IntentInput {
        run_dir: &dir,
        attempt_id: "att-1",
        unit_run_id: "ur-1",
        terminal: true,
        cwd: "/w",
        host: &host(),
        step_env: &step_env,
        pane: Some(&pane),
        session: false,
    })
    .unwrap();
    let intent: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("attempt-intent.json")).unwrap())
            .unwrap();
    let ids: Vec<&str> = intent["steps"]
        .as_array()
        .unwrap()
        .iter()
        .map(|s| s["stepId"].as_str().unwrap())
        .collect();
    assert_eq!(ids, ["settle-attempt", "finalize-home", "cleanup-trust"]);
    assert_eq!(intent["host"], "terminal");
    assert_eq!(intent["terminal"], pane);
    write_attempt_intent(&IntentInput {
        run_dir: &dir,
        attempt_id: "att-1",
        unit_run_id: "ur-1",
        terminal: false,
        cwd: "/w",
        host: &host(),
        step_env: &step_env,
        pane: None,
        session: true,
    })
    .unwrap();
    let intent: Value =
        serde_json::from_str(&std::fs::read_to_string(dir.join("attempt-intent.json")).unwrap())
            .unwrap();
    assert_eq!(intent["steps"].as_array().unwrap().len(), 1);
    assert!(intent.get("terminal").is_none());
    remove_attempt_intent(&dir);
    assert!(!dir.join("attempt-intent.json").exists());
}

#[test]
fn attempt_files_exist_empty_before_the_gate_runs_and_the_tail_holds_back_half_a_character() {
    let dir = scratch("tail");
    let binds = prepare_attempt_files(&dir, "a1").unwrap();
    assert_eq!(binds.len(), 3);
    assert!(binds.iter().all(|f| f.metadata().unwrap().len() == 0));
    let paths = attempt_paths(&dir, "a1");
    let mut tail = capture_tail(&paths);
    let mut seen: Vec<(String, String)> = Vec::new();
    let mut take = |tail: &mut CaptureTail| {
        tail.follow(&mut |stream, text| seen.push((stream.to_string(), text.to_string())))
    };
    std::fs::write(
        &paths.stdout,
        [b"ab".as_slice(), &"é".as_bytes()[..1]].concat(),
    )
    .unwrap();
    take(&mut tail);
    std::fs::write(&paths.stdout, [b"ab".as_slice(), "é!".as_bytes()].concat()).unwrap();
    std::fs::write(&paths.stderr, "err").unwrap();
    take(&mut tail);
    assert_eq!(
        seen,
        vec![
            ("stdout".into(), "ab".into()),
            ("stdout".into(), "é!".into()),
            ("stderr".into(), "err".into())
        ]
    );
}

#[cfg(unix)]
#[test]
fn a_second_attempt_lock_is_refused_by_name_and_a_mutating_attempt_also_takes_the_cwd_lease() {
    let dir = scratch("locks");
    let fgos_dir = dir.join(".fgos");
    let cwd = dir.join("work");
    std::fs::create_dir_all(&cwd).unwrap();
    let assignment = dir.join("assignment");
    let lock = |attempt: &str, mutating: bool| {
        acquire_attempt_locks(AttemptLockRequest {
            fgos_dir: &fgos_dir,
            assignment_dir: &assignment,
            attempt_str: attempt,
            cwd: &cwd,
            mutating,
            custody: None,
            executor_id: None,
            capability: None,
        })
    };
    let mut first = lock("01", true).unwrap();
    assert!(first.attempt.is_some() && first.cwd_lease.is_some());
    let refused = lock("01", false).unwrap_err();
    assert_eq!(refused.code, "attempt-in-flight");
    let second_cwd = lock("02", true).unwrap_err();
    assert_eq!(second_cwd.code, "dispatch-in-flight");
    let read_only = lock("03", false).unwrap();
    assert!(read_only.cwd_lease.is_none());
    drop(read_only);
    first.release();
    assert!(first.attempt.is_none() && first.cwd_lease.is_none());
    lock("01", true).expect("released locks can be taken again");
}

#[cfg(unix)]
#[test]
fn a_supervisor_that_binds_is_seen_bound_one_that_exits_is_seen_exited_and_a_failed_start_removes_the_secrets(
) {
    use std::os::unix::fs::PermissionsExt;
    let dir = scratch("supervisor");
    let run_dir = dir.join("run");
    std::fs::create_dir_all(run_dir.join("protected")).unwrap();
    let script = dir.join("host.sh");
    std::fs::write(&script, "#!/bin/sh\nif [ \"$2\" = supervise ]; then :; fi\ncase \"$(cat \"$(dirname \"$4\")/mode\")\" in bind) : > \"$(dirname \"$4\")/supervisor-binding.json\"; sleep 1;; exit) exit 7;; esac\n").unwrap();
    std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755)).unwrap();
    let side = run_dir.join("protected/attempt-secrets.json");
    std::fs::write(&side, "{}").unwrap();
    let envelope = json!({"runDir": run_dir.to_str().unwrap(), "hostBin": script.to_str().unwrap(), "sideFile": side.to_str().unwrap()});
    let step_env = Map::new();
    std::fs::write(run_dir.join("mode"), "bind").unwrap();
    let mut started = start_supervisor(&envelope, &[], &step_env, &Map::new()).unwrap();
    assert!(started.hands_over_locks);
    assert_eq!(
        wait_for_binding(&run_dir, &mut started.child, 5000),
        Binding::Bound
    );
    let _ = started.child.wait();
    std::fs::remove_file(run_dir.join("supervisor-binding.json")).unwrap();
    std::fs::write(run_dir.join("mode"), "exit").unwrap();
    let mut gone = start_supervisor(&envelope, &[], &step_env, &Map::new()).unwrap();
    assert_eq!(
        wait_for_binding(&run_dir, &mut gone.child, 5000),
        Binding::Exited {
            exit: Some(7),
            signal: None
        }
    );
    let missing = json!({"runDir": run_dir.to_str().unwrap(), "hostBin": dir.join("nope").to_str().unwrap(), "sideFile": side.to_str().unwrap()});
    assert!(start_supervisor(&missing, &[], &step_env, &Map::new()).is_err());
    assert!(!side.exists(), "secrets with no reader do not stay on disk");
}

#[test]
fn a_result_that_never_comes_is_judged_by_the_adopt_door_and_read_once_more() {
    let dir = scratch("await");
    let mut child = std::process::Command::new(std::env::current_exe().unwrap())
        .arg("--list")
        .stdout(std::process::Stdio::null())
        .spawn()
        .unwrap();
    child.wait().unwrap();
    let judged = std::cell::Cell::new(0);
    let mut chunks = |_: &str, _: &str| {};
    let none = await_settled_result(&dir, "a1", &mut child, 0, &mut chunks, &|_| None, &|_| {
        judged.set(judged.get() + 1);
        Ok("closed".into())
    });
    assert!(none.is_none());
    assert_eq!(judged.get(), 1);
    let found = await_settled_result(
        &dir,
        "a1",
        &mut child,
        0,
        &mut chunks,
        &|_| Some(json!({"outcome": "ok"})),
        &|_| unreachable!(),
    );
    assert_eq!(found, Some(json!({"outcome": "ok"})));
}
