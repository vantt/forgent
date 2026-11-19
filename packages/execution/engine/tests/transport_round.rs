//! The transport round replays the vectors recorded from the Node modules it ports
//! (`packages/execution/contracts/transport-round/`, recorded by `test/golden-recorders/transport-round.recorder.mjs`),
//! proves the round's decisions against fakes (a pane host, a lease and attempt driver, the worker session boot),
//! and drives one attempt end to end: the controller's prepared round, the attempt lock acquired and handed to a
//! stub supervisor as a duplicate descriptor, a stub agent that settles on its brief.

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use fgos_execution_engine::transport::worker_home::ProcSweeper;
use fgos_execution_engine::transport::worker_session::{Env, WorkerSessionError};
use fgos_execution_engine::transport::worker_session_boot::WorkerSession;
use fgos_execution_engine::transport_round::attention::*;
use fgos_execution_engine::transport_round::executor_command::*;
use fgos_execution_engine::transport_round::inspection::*;
use fgos_execution_engine::transport_round::round::*;
use fgos_execution_engine::transport_round::session_attempt::*;
use fgos_session_host::{Panes, SessionHost};
use fgos_terminal_control::core::Want;
use fgos_terminal_control::port::{
    AllocateRequest, Allocation, Disposition, Inspection, LaunchOutcome, LaunchSpec, Origin,
    PaneState, Refusal, ReleaseOutcome, SendOutcome, Slot,
};
use serde_json::{json, Map, Value};

fn vectors(name: &str) -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/transport-round")
        .join(name);
    serde_json::from_str(
        &std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display())),
    )
    .unwrap()
}

fn scratch(tag: &str) -> PathBuf {
    use std::sync::atomic::{AtomicU32, Ordering};
    static N: AtomicU32 = AtomicU32::new(0);
    let dir = std::env::temp_dir().join(format!(
        "fgos-transport-round-{tag}-{}-{}",
        std::process::id(),
        N.fetch_add(1, Ordering::SeqCst)
    ));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn strs(value: &Value) -> Vec<String> {
    value
        .as_array()
        .map(|all| {
            all.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default()
}

fn env_of(value: &Value) -> Env {
    value
        .as_object()
        .map(|map| {
            map.iter()
                .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                .collect()
        })
        .unwrap_or_default()
}

fn without_null(value: &Value) -> Value {
    match value {
        Value::Object(map) => Value::Object(
            map.iter()
                .filter(|(_, v)| !v.is_null())
                .map(|(k, v)| (k.clone(), without_null(v)))
                .collect(),
        ),
        other => other.clone(),
    }
}

const NOW: &str = "2026-11-19T10:00:00.000Z";

// ---- executor command ------------------------------------------------------------------------------------

#[test]
fn every_recorded_command_is_resolved_as_the_node_resolver_did() {
    let recorded = vectors("executor-command.v1.json");
    let mut ran = 0;
    for case in recorded["commands"].as_array().unwrap() {
        let (request, executor) = (&case["request"], &case["executor"]);
        if executor.is_null() {
            continue;
        }
        let command = CommandRequest {
            prompt: request["prompt"].as_str().unwrap(),
            model: request["model"].as_str().unwrap(),
            executor_id: request["executorId"].as_str(),
            fgos_dir: None,
            attest_root: None,
            reasoning_effort: request["reasoningEffort"].as_str(),
            requested_model: request["requestedModel"].as_str(),
        };
        let out = resolve_executor_command(executor, &command);
        match (case["out"].get("ok"), case["out"].get("error")) {
            (Some(ok), _) => assert_eq!(
                without_null(&out.expect("resolves")),
                without_null(ok),
                "{request}"
            ),
            (_, Some(error)) => {
                let refusal = out.expect_err("refuses");
                assert_eq!(
                    refusal.message,
                    error["message"].as_str().unwrap(),
                    "{request}"
                );
                assert_eq!(refusal.name, error["name"].as_str().unwrap());
            }
            _ => panic!("recorded neither"),
        }
        ran += 1;
    }
    assert!(
        ran >= 4,
        "the vectors carry resolvable and refused commands"
    );
}

#[test]
fn a_command_whose_effort_the_cli_cannot_take_is_refused_by_name_and_an_unknown_adapter_too() {
    let executor = json!({ "command": "my-agent", "args": ["{prompt}"] });
    let command = CommandRequest {
        prompt: "p",
        model: "m",
        executor_id: Some("x"),
        reasoning_effort: Some("low"),
        ..Default::default()
    };
    let refusal = resolve_executor_command(&executor, &command).unwrap_err();
    assert!(
        refusal
            .message
            .contains("has no reasoning-effort control fgOS can set"),
        "{}",
        refusal.message
    );
    let unknown = json!({ "command": "claude", "adapter": "nope", "args": [] });
    let refusal = resolve_executor_command(&unknown, &CommandRequest::default()).unwrap_err();
    assert!(refusal
        .message
        .contains("unknown executor adapter \"nope\" (known: cli-spawn, herdr-spawn)"));
    let bad_args = json!({ "command": "claude", "args": ["a", 1] });
    let refusal = resolve_executor_command(&bad_args, &CommandRequest::default()).unwrap_err();
    assert!(refusal.message.contains("must all be strings"));
}

#[test]
fn the_agents_own_argv_drops_exactly_the_entries_that_carried_the_prompt() {
    for case in vectors("executor-command.v1.json")["argvCases"]
        .as_array()
        .unwrap()
    {
        let template = case["argsTemplate"]
            .as_array()
            .map(|_| strs(&case["argsTemplate"]));
        let out = agent_args_without_prompt(
            template.as_deref(),
            &strs(&case["args"]),
            case["prompt"].as_str().unwrap(),
            case["model"].as_str().unwrap_or(""),
        );
        assert_eq!(json!(out), case["out"], "{case}");
    }
}

#[test]
fn a_reasoning_effort_is_checked_against_the_vocabulary_then_the_executors_own_levels() {
    for case in vectors("executor-command.v1.json")["efforts"]
        .as_array()
        .unwrap()
    {
        let supported = case["supported"].as_array().cloned();
        let out = assert_reasoning_effort(
            case["value"].as_str().unwrap(),
            supported.as_deref(),
            case["executorId"].as_str(),
        );
        match case["out"].get("ok") {
            Some(_) => out.expect("accepted"),
            None => assert_eq!(
                out.unwrap_err().message,
                case["out"]["error"]["message"].as_str().unwrap()
            ),
        }
    }
}

#[test]
fn an_adapter_reached_directly_is_refused_by_name_because_every_agent_runs_under_the_supervisor() {
    let (code, message) = supervised_only_refusal("herdr-spawn", Some("w9"));
    assert_eq!(code, "herdr-spawn-supervised-only");
    assert!(message.starts_with(
        "executor for work \"w9\" refused: herdr-spawn runs as an attempt of the run supervisor"
    ));
}

#[test]
fn a_checkout_is_attested_by_its_head_and_branch_and_a_path_that_is_no_checkout_by_nothing() {
    let none = capture_dispatch_attestation(None, None);
    assert_eq!(none, DispatchAttestation::default());
    let dir = scratch("attest");
    let outside = capture_dispatch_attestation(Some(&dir.join(".fgos")), None);
    assert_eq!(outside, DispatchAttestation::default());
    assert_eq!(
        none.to_json(),
        json!({ "baseCommit": null, "headRef": null })
    );
    // A checkout is attested by its head and the branch it has checked out. The Git door keeps its trust records
    // under the state root, so the test pins a scratch one beside a scratch repository.
    let state = scratch("attest-state");
    let repo = scratch("attest-repo");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&state, std::fs::Permissions::from_mode(0o700)).unwrap();
    }
    for args in [
        vec!["init", "-q", "-b", "trunk"],
        vec![
            "-c",
            "user.name=t",
            "-c",
            "user.email=t@t",
            "commit",
            "-q",
            "--allow-empty",
            "-m",
            "first",
        ],
    ] {
        let status = std::process::Command::new("git")
            .args(&args)
            .current_dir(&repo)
            .status()
            .expect("git runs");
        assert!(status.success(), "{args:?}");
    }
    #[allow(unused_unsafe)]
    // SAFETY: no other test of this binary reads or writes the process environment.
    unsafe {
        std::env::set_var("FGOS_STATE_ROOT", &state);
    }
    let attested = capture_dispatch_attestation(None, Some(&repo));
    assert!(
        attested
            .base_commit
            .as_deref()
            .is_some_and(|c| c.len() == 40),
        "{attested:?}"
    );
    assert_eq!(attested.head_ref.as_deref(), Some("trunk"));
    // The project root above a `.fgos` directory is attested the same way.
    assert_eq!(
        capture_dispatch_attestation(Some(&repo.join(".fgos")), None),
        attested
    );
    // A detached head has a commit and no branch.
    let status = std::process::Command::new("git")
        .args(["checkout", "-q", "--detach"])
        .current_dir(&repo)
        .status()
        .unwrap();
    assert!(status.success());
    let detached = capture_dispatch_attestation(None, Some(&repo));
    assert_eq!(
        (detached.base_commit.as_ref(), detached.head_ref.as_ref()),
        (attested.base_commit.as_ref(), None)
    );
}

// ---- session attempt -------------------------------------------------------------------------------------

#[test]
fn a_heads_requirement_names_each_grant_it_has_and_the_posture_it_starts_from() {
    for case in vectors("session-attempt.v1.json")["grants"]
        .as_array()
        .unwrap()
    {
        let grant = HeadGrant {
            verbs: strs(&case["in"]["verbs"]),
            writes: strs(&case["in"]["writes"]),
            mailbox: case["in"]["mailbox"].as_bool().unwrap(),
            peers: case["in"]["peers"].as_bool().unwrap(),
        };
        assert_eq!(requirement_of(&grant), case["out"], "{case}");
    }
}

#[test]
fn a_head_is_named_only_when_its_environment_names_persona_name_and_a_whole_generation() {
    for case in vectors("session-attempt.v1.json")["envs"]
        .as_array()
        .unwrap()
    {
        let env = env_of(&case["env"]);
        assert_eq!(Value::Object(head_of(&env)), case["out"], "{case}");
    }
}

#[derive(Default)]
struct Driver {
    calls: Vec<String>,
    lease: Option<Lease>,
    bound: Option<Bound>,
    handed: bool,
    selected: bool,
    fail_at: Option<&'static str>,
    seat: Option<SessionSeat>,
}

impl Driver {
    fn step(&mut self, name: &'static str) -> Result<(), SessionLaunchError> {
        self.calls.push(name.into());
        if self.fail_at == Some(name) {
            return Err(SessionLaunchError::new("step-failed", name));
        }
        Ok(())
    }
}

impl AttemptDriver for Driver {
    fn open_attempt(
        &mut self,
        _: &Path,
        _: &str,
        _: &str,
        _: &str,
    ) -> Result<(), SessionLaunchError> {
        self.step("open")
    }
    fn acquire_locks(&mut self) -> Result<(), SessionLaunchError> {
        self.step("locks")
    }
    fn publish_intent(&mut self) -> Result<(), SessionLaunchError> {
        self.step("intent")
    }
    fn lease_account(&mut self) -> Result<Lease, SessionLaunchError> {
        self.step("lease")?;
        self.selected = true;
        Ok(self.lease.clone().unwrap_or(Lease::Selected))
    }
    fn renew_leased_login(&mut self, _: &Value) -> Result<(), SessionLaunchError> {
        self.step("renew")
    }
    fn prepare_seat(&mut self, seat: &SessionSeat) -> Result<(), SessionLaunchError> {
        self.seat = Some(seat.clone());
        self.step("seat")
    }
    fn start_and_bind(&mut self) -> Result<Bound, SessionLaunchError> {
        self.step("start")?;
        self.handed = true;
        Ok(self.bound.clone().unwrap_or(Bound {
            state: "bound".into(),
            exit: None,
        }))
    }
    fn adopt(&mut self, _: &Path) {
        self.calls.push("adopt".into())
    }
    fn handed_over(&self) -> bool {
        self.handed
    }
    fn lease_selected(&self) -> bool {
        self.selected
    }
    fn release_lease(&mut self, _: &str) {
        self.calls.push("release-lease".into())
    }
    fn close(&mut self) {
        self.calls.push("close".into())
    }
}

fn launch<'a>(
    dir: &'a Path,
    grant: &'a HeadGrant,
    env: BTreeMap<String, String>,
) -> SessionLaunch<'a> {
    SessionLaunch {
        key: "head-p-n-1",
        role: "planner",
        grant,
        opening: "hello",
        ceiling_ms: 60_000,
        env,
        fgos_dir: dir,
        beside: None,
        display: None,
        attempt_id: "cmd_1_aabbccdd",
    }
}

#[test]
fn a_session_attempt_runs_its_steps_in_order_and_closes_the_attempt_when_it_is_bound() {
    let dir = scratch("session-ok");
    let grant = HeadGrant {
        verbs: vec!["note".into()],
        writes: vec!["docs".into()],
        mailbox: true,
        peers: false,
    };
    let env = BTreeMap::from([
        ("FGOS_HEAD_PERSONA".to_string(), "planner".to_string()),
        ("FGOS_HEAD_NAME".to_string(), "n".to_string()),
        ("FGOS_HEAD_GEN".to_string(), "2".to_string()),
    ]);
    let mut driver = Driver::default();
    let placement = launch_session_attempt(&mut driver, &launch(&dir, &grant, env)).expect("bound");
    assert_eq!(
        driver.calls,
        ["open", "locks", "intent", "lease", "renew", "seat", "start", "close"]
    );
    assert_eq!(
        (placement.host, placement.key.as_str()),
        ("terminal", "cmd_1_aabbccdd")
    );
    assert!(placement
        .run_dir
        .ends_with("assignments/head-p-n-1/runs/01"));
    let seat = driver.seat.unwrap();
    assert_eq!(seat.run_id, "run_head-p-n-1_01");
    assert_eq!(seat.dispatch_batch_key, "cmd_1_aabbccdd");
    assert_eq!(seat.session["gen"], 2);
    assert_eq!(seat.session["persona"], "planner");
    let socket = seat
        .request_socket
        .expect("a grant with verbs gets a request socket");
    assert_eq!(
        seat.session["requestSocketPath"],
        json!(socket.to_string_lossy())
    );
    assert_eq!(
        seat.launch_env[HEAD_REQUEST_SOCKET_ENV],
        socket.to_string_lossy()
    );
    assert_eq!(seat.confinement_requirement, requirement_of(&grant));
}

#[test]
fn a_grant_with_no_verbs_gets_no_request_socket() {
    let dir = scratch("session-nosocket");
    let grant = HeadGrant::default();
    let mut driver = Driver::default();
    launch_session_attempt(&mut driver, &launch(&dir, &grant, BTreeMap::new())).unwrap();
    let seat = driver.seat.unwrap();
    assert!(seat.request_socket.is_none() && seat.session.get("requestSocketPath").is_none());
    assert!(!seat.launch_env.contains_key(HEAD_REQUEST_SOCKET_ENV));
}

#[test]
fn a_head_key_is_used_once() {
    let dir = scratch("session-used");
    let run_dir = dir.join("assignments/head-p-n-1/runs/01");
    std::fs::create_dir_all(&run_dir).unwrap();
    std::fs::write(run_dir.join("attempt-intent.json"), "{}").unwrap();
    let mut driver = Driver::default();
    let err = launch_session_attempt(
        &mut driver,
        &launch(&dir, &HeadGrant::default(), BTreeMap::new()),
    )
    .unwrap_err();
    assert_eq!(err.code, "head-key-used");
    assert!(driver.calls.is_empty(), "nothing is made for a used key");
}

#[test]
fn a_refused_lease_gives_the_lease_back_and_names_why() {
    let dir = scratch("session-lease");
    let mut driver = Driver {
        lease: Some(Lease::Refused {
            reason: "all-busy".into(),
            detail: Some("3 accounts".into()),
            selection: json!({"status": "refused"}),
        }),
        ..Default::default()
    };
    let err = launch_session_attempt(
        &mut driver,
        &launch(&dir, &HeadGrant::default(), BTreeMap::new()),
    )
    .unwrap_err();
    assert_eq!(err.code, "lease-refused");
    assert_eq!(
        err.message,
        "no account could be leased for planner: all-busy (3 accounts)"
    );
    assert_eq!(err.extra["refusal"], json!({"status": "refused"}));
    assert_eq!(driver.calls.last().map(String::as_str), Some("close"));
    assert!(driver.calls.contains(&"release-lease".to_string()));
}

#[test]
fn a_supervisor_that_does_not_bind_is_adopted_when_it_exited_and_the_attempt_is_still_closed() {
    let dir = scratch("session-unbound");
    let mut driver = Driver {
        bound: Some(Bound {
            state: "exited".into(),
            exit: Some(7),
        }),
        ..Default::default()
    };
    let err = launch_session_attempt(
        &mut driver,
        &launch(&dir, &HeadGrant::default(), BTreeMap::new()),
    )
    .unwrap_err();
    assert_eq!(err.code, "launch-unknown");
    assert!(
        err.message.contains("(exited, exit 7)") && err.message.contains("supervisor.log"),
        "{}",
        err.message
    );
    assert_eq!(err.extra["launchState"], "exited");
    // Past the handover the attempt's own end reclaims the lease; the controller gives nothing back.
    assert_eq!(&driver.calls[driver.calls.len() - 2..], ["adopt", "close"]);
    assert!(!driver.calls.contains(&"release-lease".to_string()));
}

#[test]
fn a_failing_step_before_the_handover_releases_a_selected_lease_and_closes() {
    let dir = scratch("session-fail");
    let mut driver = Driver {
        fail_at: Some("seat"),
        ..Default::default()
    };
    let err = launch_session_attempt(
        &mut driver,
        &launch(&dir, &HeadGrant::default(), BTreeMap::new()),
    )
    .unwrap_err();
    assert_eq!(err.code, "step-failed");
    assert_eq!(
        &driver.calls[driver.calls.len() - 2..],
        ["release-lease", "close"]
    );
    let id = mint_attempt_id(1_795_000_000_000).unwrap();
    assert!(id.starts_with("cmd_1795000000000_") && id.len() == "cmd_1795000000000_".len() + 8);
}

// ---- round: pure helpers ----------------------------------------------------------------------------------

#[test]
fn a_pane_s_own_variables_never_reach_the_agent() {
    for case in vectors("round.v1.json")["withoutPaneEnv"]
        .as_array()
        .unwrap()
    {
        assert_eq!(json!(without_pane_env(&env_of(&case["env"]))), case["out"]);
    }
    let constants = &vectors("round.v1.json")["constants"];
    assert_eq!(
        PANE_IDLE_TIMEOUT_MS,
        constants["PANE_IDLE_TIMEOUT_MS"].as_u64().unwrap()
    );
    assert_eq!(
        ORPHAN_SETTLE_MS,
        constants["ORPHAN_SETTLE_MS"].as_u64().unwrap()
    );
}

#[test]
fn a_scrolled_screen_shows_only_the_lines_it_did_not_already_show() {
    for case in vectors("round.v1.json")["screens"].as_array().unwrap() {
        let previous = case["previous"].as_str().unwrap_or("");
        assert_eq!(
            screen_delta(previous, case["next"].as_str().unwrap()),
            case["out"].as_str().unwrap(),
            "{case}"
        );
    }
}

#[test]
fn an_agent_name_is_lowercase_safe_short_and_carries_a_hash_of_what_was_cut() {
    for case in vectors("round.v1.json")["names"].as_array().unwrap() {
        assert_eq!(
            normalize_agent_name(case["raw"].as_str().unwrap(), 32),
            case["out"].as_str().unwrap(),
            "{case}"
        );
    }
}

#[test]
fn the_trust_decision_is_read_from_the_accounts_store_and_written_where_the_agent_reads_it() {
    let recorded = vectors("round.v1.json");
    let home = Path::new(recorded["home"].as_str().unwrap());
    for case in recorded["trustCases"].as_array().unwrap() {
        let worker = case["workerEnv"]
            .as_object()
            .map(|_| env_of(&case["workerEnv"]));
        let stores = trust_store_paths(
            &case["trustStore"],
            &env_of(&case["fullEnv"]),
            worker.as_ref(),
            case["accountSource"]
                .as_object()
                .map(|_| &case["accountSource"]),
            home,
        );
        let expect = &case["out"]["ok"];
        assert_eq!(
            stores.root,
            Path::new(expect["root"].as_str().unwrap()),
            "{case}"
        );
        assert_eq!(
            stores.target,
            Path::new(expect["target"].as_str().unwrap()),
            "{case}"
        );
    }
}

fn confine(
    confinement: Option<&Value>,
    mode: Option<&str>,
    cwd: &Path,
    repo: &Path,
    delivery: ControlsDelivered,
    sessions: &RefCell<Vec<String>>,
    tmp: &Path,
) -> Result<Confined, fgos_run_supervisor::controller::error::DispatchError> {
    let now_iso = || NOW.to_string();
    let now_ms = || 1_795_082_400_000i64;
    let offset = |_: i64| 0i32;
    let ensure = |caller: &Env, bin: &str| -> Result<WorkerSession, WorkerSessionError> {
        sessions.borrow_mut().push(bin.to_string());
        let mut env = caller.clone();
        env.insert("HERDR_SESSION".into(), "fgos-worker".into());
        Ok(WorkerSession {
            session_name: "fgos-worker".into(),
            socket_path: "/s".into(),
            env,
            started_server: true,
        })
    };
    let sweeper = ProcSweeper::default();
    let diagnostic = |_: &str| {};
    let effects = RoundEffects {
        now_iso: &now_iso,
        now_ms: &now_ms,
        local_offset_seconds: &offset,
        ensure_session: &ensure,
        sweeper: &sweeper,
        tmp_dir: tmp.to_path_buf(),
        home_dir: PathBuf::from("/nonexistent-home-for-tests"),
        diagnostic: &diagnostic,
    };
    let round = Round::open(
        &tmp.join("run"),
        Some("w1"),
        None,
        None,
        "agent-a",
        &now_iso,
    );
    let env = Env::from([(
        "HOME".to_string(),
        "/nonexistent-home-for-vectors".to_string(),
    )]);
    let seat = ConfineSeat {
        confinement,
        full_env: &env,
        cwd,
        repo_root: Some(repo),
        permission_mode: mode,
        herdr_bin: "herdr",
        delivery,
    };
    establish_confinement(&seat, &round, &effects)
}

#[test]
fn declared_confinement_is_refused_or_reported_as_the_node_round_did() {
    let tmp = scratch("confine");
    let sessions = RefCell::new(Vec::new());
    let repo = Path::new("/repo/root");
    for case in vectors("round.v1.json")["confinementCases"]
        .as_array()
        .unwrap()
    {
        let delivery = ControlsDelivered {
            root_workspace_allowed: case["delivery"]["rootWorkspaceAllowed"]
                .as_bool()
                .unwrap_or(false),
            backend_delivers: case["delivery"]["backendDelivers"]
                .as_bool()
                .unwrap_or(false),
        };
        let got = confine(
            case.get("confinement").filter(|c| !c.is_null()),
            case["permissionMode"].as_str(),
            Path::new(case["cwd"].as_str().unwrap()),
            repo,
            delivery,
            &sessions,
            &tmp,
        );
        match (case["out"].get("ok"), case["out"].get("error")) {
            (Some(ok), _) => {
                let got = got.unwrap_or_else(|e| panic!("{case}: {e}"));
                assert_eq!(
                    (got.confined, got.status),
                    (
                        ok["confined"].as_bool().unwrap(),
                        ok["status"].as_str().unwrap()
                    ),
                    "{case}"
                );
                assert!(got.worker_home_path.is_none());
                assert_eq!(json!(got.session_env), ok["sessionEnv"]);
            }
            (_, Some(error)) => {
                let got = got.unwrap_err();
                assert_eq!(got.code, error["errorClass"].as_str().unwrap(), "{case}");
                assert_eq!(got.detail["reason"], error["reason"], "{case}");
                assert_eq!(got.message, error["message"].as_str().unwrap(), "{case}");
                assert_eq!(got.detail["agentName"], "agent-a");
            }
            _ => panic!("recorded neither"),
        }
    }
    assert!(
        sessions.borrow().is_empty(),
        "none of the recorded cases boots a session"
    );
}

#[test]
fn an_isolated_session_is_booted_once_and_its_environment_is_what_the_seat_gets() {
    let tmp = scratch("confine-session");
    let sessions = RefCell::new(Vec::new());
    let got = confine(
        Some(&json!({ "isolatedSession": true })),
        Some("ask"),
        Path::new("/repo/wt"),
        Path::new("/repo/root"),
        ControlsDelivered::default(),
        &sessions,
        &tmp,
    )
    .unwrap();
    assert_eq!((got.confined, got.status), (true, "confined"));
    assert_eq!(got.session_env["HERDR_SESSION"], "fgos-worker");
    assert_eq!(*sessions.borrow(), ["herdr"]);
}

#[test]
fn a_private_home_that_cannot_be_provisioned_refuses_the_launch_and_leaves_nothing() {
    let tmp = scratch("confine-home");
    let sessions = RefCell::new(Vec::new());
    let err = confine(
        Some(&json!({ "privateHome": true })),
        Some("ask"),
        Path::new("/repo/wt"),
        Path::new("/repo/root"),
        ControlsDelivered::default(),
        &sessions,
        &tmp,
    )
    .unwrap_err();
    assert_eq!(err.code, "invalid-config");
    assert!(err.message.starts_with("executor for work \"w1\" refused: confinement was declared but could not be established: "), "{}", err.message);
    let leftovers: Vec<_> = std::fs::read_dir(&tmp)
        .unwrap()
        .flatten()
        .map(|e| e.file_name())
        .collect();
    assert!(leftovers.is_empty(), "{leftovers:?}");
}

// ---- the pane round ---------------------------------------------------------------------------------------

#[derive(Default)]
struct FakePanes {
    allocated: RefCell<Vec<AllocateRequest>>,
    released: RefCell<Vec<(String, Disposition)>>,
    live: RefCell<BTreeSet<String>>,
    attached: RefCell<Vec<(String, String, String)>>,
    refuse: bool,
    unsupported: bool,
}

impl Panes for FakePanes {
    fn allocate(&self, request: &AllocateRequest) -> Result<Allocation, Refusal> {
        if self.unsupported {
            return Err(Refusal::Unsupported {
                capability: "pane.split".into(),
                detail: "no herdr build for this platform".into(),
            });
        }
        if self.refuse {
            return Err(Refusal::Unknown {
                reason: "herdr said no".into(),
            });
        }
        self.allocated.borrow_mut().push(request.clone());
        self.live.borrow_mut().insert(request.key.clone());
        Ok(Allocation {
            slot: Slot {
                tab_id: "tab-1".into(),
                pane_id: "pane-7".into(),
            },
            origin: Origin::Allocated,
        })
    }
    fn launch(&self, _: &str, _: &LaunchSpec) -> Result<LaunchOutcome, Refusal> {
        unreachable!("the supervisor launches")
    }
    fn send(
        &self,
        _: &str,
        _: Option<&str>,
        _: Option<&[String]>,
        _: bool,
    ) -> Result<SendOutcome, Refusal> {
        unreachable!("the supervisor types")
    }
    fn read(&self, _: &str, _: Option<&str>) -> Result<String, Refusal> {
        Ok(String::new())
    }
    fn inspect(&self, key: &str, _: Want) -> Inspection {
        let pane = if self.live.borrow().contains(key) {
            PaneState::Live
        } else {
            PaneState::Gone
        };
        Inspection {
            pane,
            foreground: None,
            activity: None,
        }
    }
    fn focus(&self, _: &str) -> Result<(), Refusal> {
        Ok(())
    }
    fn release(&self, key: &str, disposition: Disposition) -> Result<ReleaseOutcome, Refusal> {
        self.released
            .borrow_mut()
            .push((key.to_string(), disposition));
        self.live.borrow_mut().remove(key);
        Ok(ReleaseOutcome::Released { disposition })
    }
}

impl RoundPanes for FakePanes {
    fn attach(&self, key: &str, pane: &str, group_key: &str, _: &Value) -> Result<(), String> {
        self.attached
            .borrow_mut()
            .push((key.into(), pane.into(), group_key.into()));
        Ok(())
    }
    fn read_visible(&self, _: &str) -> Result<String, String> {
        Ok(String::new())
    }
}

fn effects<'a>(
    now_iso: &'a dyn Fn() -> String,
    now_ms: &'a dyn Fn() -> i64,
    offset: &'a dyn Fn(i64) -> i32,
    ensure: &'a dyn Fn(&Env, &str) -> Result<WorkerSession, WorkerSessionError>,
    sweeper: &'a ProcSweeper,
    diagnostic: &'a dyn Fn(&str),
    tmp: &Path,
) -> RoundEffects<'a> {
    RoundEffects {
        now_iso,
        now_ms,
        local_offset_seconds: offset,
        ensure_session: ensure,
        sweeper,
        tmp_dir: tmp.to_path_buf(),
        home_dir: PathBuf::from("/nonexistent-home-for-tests"),
        diagnostic,
    }
}

struct Rig {
    dir: PathBuf,
    cwd: PathBuf,
    run_dir: PathBuf,
    label: Value,
}

fn rig(tag: &str) -> Rig {
    let dir = scratch(tag);
    let cwd = dir.join("work");
    let run_dir = dir.join(".fgos/assignments/u1/runs/01");
    std::fs::create_dir_all(&cwd).unwrap();
    std::fs::create_dir_all(&run_dir).unwrap();
    Rig {
        dir,
        cwd,
        run_dir,
        label: json!({"id": "run-abc", "title": "Do it"}),
    }
}

fn attempt_for<'a>(rig: &'a Rig, env: &'a Env, binding: &'a SeatBinding) -> TerminalAttempt<'a> {
    TerminalAttempt {
        attempt_id: "cmd_1795081120288_aabbccdd",
        run_dir: &rig.run_dir,
        cwd: &rig.cwd,
        repo_root: Some(&rig.dir),
        prompt: "do the thing",
        work_id: Some("w1"),
        tier: Some("strong"),
        model: Some("opus"),
        run_id: Some("run_u1_01"),
        herdr_bin: "herdr",
        full_env: env,
        binding,
        agent_kind: Some("/usr/bin/claude"),
        delivery: "inline",
        attempt_env: None,
        dispatch_batch_key: Some("batch-1"),
        dispatch_batch_size: Some(3),
        anchor_pane_id: Some("anchor-pane"),
        work_label: Some(&rig.label),
        display: None,
        effective_contract: None,
        opening: "brief",
        beside: None,
        controls_delivered: ControlsDelivered::default(),
        role: Some("producer"),
    }
}

#[test]
fn a_prepared_attempt_writes_the_brief_opens_one_pane_for_the_attempts_key_and_records_the_allocation(
) {
    let rig = rig("prepare");
    let panes = FakePanes::default();
    let host = SessionHost { panes: &panes };
    let (env, binding) = (Env::new(), SeatBinding::default());
    let (now_iso, now_ms, offset) = (|| NOW.to_string(), || 1_795_082_400_000i64, |_: i64| 0i32);
    let ensure = |_: &Env, _: &str| -> Result<WorkerSession, WorkerSessionError> {
        unreachable!("no isolated session declared")
    };
    let sweeper = ProcSweeper::default();
    let lines = RefCell::new(Vec::new());
    let diagnostic = |line: &str| lines.borrow_mut().push(line.to_string());
    let fx = effects(
        &now_iso,
        &now_ms,
        &offset,
        &ensure,
        &sweeper,
        &diagnostic,
        &rig.dir,
    );
    let announced = RefCell::new(Vec::new());
    let mut before = |key: &str, group: &str, endpoint: &Env| {
        announced
            .borrow_mut()
            .push((key.to_string(), group.to_string(), endpoint.clone()))
    };
    let prepared = prepare_terminal_attempt(
        &attempt_for(&rig, &env, &binding),
        &host,
        &panes,
        &mut before,
        &fx,
    )
    .expect("prepared");

    assert_eq!(prepared.slot_key, "cmd_1795081120288_aabbccdd");
    assert_eq!(prepared.group_key, "batch-1");
    assert_eq!(prepared.pane_id.as_deref(), Some("pane-7"));
    assert_eq!(prepared.endpoint_env["FGOS_HERDR_BIN"], "herdr");
    let brief = std::fs::read_to_string(&prepared.brief_path).unwrap();
    assert!(brief.contains("do the thing"), "the brief wraps the prompt");
    assert!(Path::new(&prepared.outbox_dir).is_dir());

    let allocated = panes.allocated.borrow();
    assert_eq!(allocated.len(), 1);
    assert_eq!(
        (
            allocated[0].key.as_str(),
            allocated[0].group_key.as_str(),
            allocated[0].group_size
        ),
        ("cmd_1795081120288_aabbccdd", "batch-1", Some(3))
    );
    assert_eq!(allocated[0].cwd.as_deref(), Some(rig.cwd.to_str().unwrap()));
    assert_eq!(allocated[0].display.agent.as_deref(), Some("claude"));
    assert_eq!(allocated[0].display.role.as_deref(), Some("producer"));
    assert_eq!(
        *panes.attached.borrow(),
        [(
            "anchor-batch-1".to_string(),
            "anchor-pane".to_string(),
            "batch-1".to_string()
        )]
    );
    assert_eq!(
        announced.borrow().len(),
        1,
        "the pane's key is recorded before the pane exists"
    );
    assert_eq!(announced.borrow()[0].0, "cmd_1795081120288_aabbccdd");
    let visibility: Value = serde_json::from_str(
        &std::fs::read_to_string(rig.run_dir.join("visibility.json")).unwrap(),
    )
    .unwrap();
    assert_eq!(
        (visibility["status"].as_str(), visibility["paneId"].as_str()),
        (Some("pane-created"), Some("pane-7"))
    );
    assert_eq!(visibility["terminalKey"], "cmd_1795081120288_aabbccdd");
    assert!(
        lines.borrow()[0]
            .starts_with("fgos: herdr-spawn work=w1 pane=pane-7 agent=fgos-run_u1_01-cmd_1795"),
        "{:?}",
        lines.borrow()
    );
}

#[test]
fn a_file_pointer_delivery_types_a_one_line_pointer_and_a_verbatim_opening_types_the_prompt_as_it_is(
) {
    let rig = rig("pointer");
    let panes = FakePanes::default();
    let host = SessionHost { panes: &panes };
    let (env, binding) = (Env::new(), SeatBinding::default());
    let (now_iso, now_ms, offset) = (|| NOW.to_string(), || 1i64, |_: i64| 0i32);
    let ensure = |_: &Env, _: &str| -> Result<WorkerSession, WorkerSessionError> { unreachable!() };
    let sweeper = ProcSweeper::default();
    let diagnostic = |_: &str| {};
    let fx = effects(
        &now_iso,
        &now_ms,
        &offset,
        &ensure,
        &sweeper,
        &diagnostic,
        &rig.dir,
    );
    let mut attempt = attempt_for(&rig, &env, &binding);
    attempt.delivery = "file-pointer";
    attempt.opening = "verbatim";
    let prepared =
        prepare_terminal_attempt(&attempt, &host, &panes, &mut |_, _, _| {}, &fx).unwrap();
    assert!(prepared.brief_path.ends_with("brief-1.pointer.txt"));
    assert!(std::fs::read_to_string(&prepared.brief_path)
        .unwrap()
        .contains("brief-1.md"));
    assert_eq!(
        std::fs::read_to_string(rig.run_dir.join("brief-1.md")).unwrap(),
        "do the thing"
    );
}

#[test]
fn a_run_directory_that_already_holds_this_rounds_result_is_refused_before_anything_is_opened() {
    let rig = rig("stale");
    std::fs::create_dir_all(rig.run_dir.join("outbox")).unwrap();
    std::fs::write(rig.run_dir.join("outbox/result-1.json"), "{}").unwrap();
    let panes = FakePanes::default();
    let host = SessionHost { panes: &panes };
    let (env, binding) = (Env::new(), SeatBinding::default());
    let (now_iso, now_ms, offset) = (|| NOW.to_string(), || 1i64, |_: i64| 0i32);
    let ensure = |_: &Env, _: &str| -> Result<WorkerSession, WorkerSessionError> { unreachable!() };
    let sweeper = ProcSweeper::default();
    let diagnostic = |_: &str| {};
    let fx = effects(
        &now_iso,
        &now_ms,
        &offset,
        &ensure,
        &sweeper,
        &diagnostic,
        &rig.dir,
    );
    let err = prepare_terminal_attempt(
        &attempt_for(&rig, &env, &binding),
        &host,
        &panes,
        &mut |_, _, _| {},
        &fx,
    )
    .unwrap_err();
    assert_eq!(
        (err.code.as_str(), err.detail["reason"].as_str()),
        ("invalid-config", Some("stale-result-in-run-dir"))
    );
    assert!(panes.allocated.borrow().is_empty());
    let mut bad = attempt_for(&rig, &env, &binding);
    bad.attempt_id = "has space";
    let err = prepare_terminal_attempt(&bad, &host, &panes, &mut |_, _, _| {}, &fx).unwrap_err();
    assert_eq!(err.detail["reason"], "terminal-key-invalid");
}

#[test]
fn a_pane_that_cannot_be_opened_is_a_spawn_failure_and_what_was_prepared_is_given_back() {
    let rig = rig("refused");
    let panes = FakePanes {
        refuse: true,
        ..Default::default()
    };
    let host = SessionHost { panes: &panes };
    let (env, binding) = (Env::new(), SeatBinding::default());
    let (now_iso, now_ms, offset) = (|| NOW.to_string(), || 1i64, |_: i64| 0i32);
    let ensure = |_: &Env, _: &str| -> Result<WorkerSession, WorkerSessionError> { unreachable!() };
    let sweeper = ProcSweeper::default();
    let diagnostic = |_: &str| {};
    let fx = effects(
        &now_iso,
        &now_ms,
        &offset,
        &ensure,
        &sweeper,
        &diagnostic,
        &rig.dir,
    );
    let err = prepare_terminal_attempt(
        &attempt_for(&rig, &env, &binding),
        &host,
        &panes,
        &mut |_, _, _| {},
        &fx,
    )
    .unwrap_err();
    assert_eq!(err.code, "worker-spawn-fail");
    assert!(
        err.message.starts_with(
            "executor failed to start for work \"w1\": terminal-control could not open a pane ("
        ),
        "{}",
        err.message
    );
    assert_eq!(err.detail["terminalKey"], "cmd_1795081120288_aabbccdd");
    assert_eq!(
        panes.released.borrow()[0],
        ("cmd_1795081120288_aabbccdd".to_string(), Disposition::Close),
        "the pane's key is given back"
    );
}

#[test]
fn a_platform_with_no_pane_host_refuses_the_attempt_by_the_capability_it_lacks_and_never_falls_back(
) {
    let rig = rig("unsupported");
    let panes = FakePanes {
        unsupported: true,
        ..Default::default()
    };
    let host = SessionHost { panes: &panes };
    let (env, binding) = (Env::new(), SeatBinding::default());
    let (now_iso, now_ms, offset) = (|| NOW.to_string(), || 1i64, |_: i64| 0i32);
    let ensure = |_: &Env, _: &str| -> Result<WorkerSession, WorkerSessionError> { unreachable!() };
    let sweeper = ProcSweeper::default();
    let diagnostic = |_: &str| {};
    let fx = effects(
        &now_iso,
        &now_ms,
        &offset,
        &ensure,
        &sweeper,
        &diagnostic,
        &rig.dir,
    );
    let err = prepare_terminal_attempt(
        &attempt_for(&rig, &env, &binding),
        &host,
        &panes,
        &mut |_, _, _| {},
        &fx,
    )
    .unwrap_err();
    assert_eq!(
        (err.code.as_str(), err.detail["reason"].as_str()),
        ("worker-spawn-fail", Some("terminal_unsupported"))
    );
    assert!(err.message.contains("pane.split"), "{}", err.message);
}

#[test]
fn a_live_pane_is_closed_once_and_a_gone_pane_is_not_closed_again() {
    let panes = FakePanes::default();
    panes.live.borrow_mut().insert("k1".into());
    let host = SessionHost { panes: &panes };
    assert!(close_live_pane(&host, "k1"));
    assert!(!close_live_pane(&host, "k1"));
    assert_eq!(panes.released.borrow().len(), 1);
}

#[test]
fn abandoning_a_prepared_attempt_closes_its_pane() {
    let rig = rig("abandon");
    let panes = FakePanes::default();
    let host = SessionHost { panes: &panes };
    let (env, binding) = (Env::new(), SeatBinding::default());
    let (now_iso, now_ms, offset) = (|| NOW.to_string(), || 1i64, |_: i64| 0i32);
    let ensure = |_: &Env, _: &str| -> Result<WorkerSession, WorkerSessionError> { unreachable!() };
    let sweeper = ProcSweeper::default();
    let diagnostic = |_: &str| {};
    let fx = effects(
        &now_iso,
        &now_ms,
        &offset,
        &ensure,
        &sweeper,
        &diagnostic,
        &rig.dir,
    );
    let prepared = prepare_terminal_attempt(
        &attempt_for(&rig, &env, &binding),
        &host,
        &panes,
        &mut |_, _, _| {},
        &fx,
    )
    .unwrap();
    prepared.abandon(&host);
    assert_eq!(panes.released.borrow()[0].1, Disposition::Close);
    assert!(!panes.live.borrow().contains(&prepared.slot_key));
}

#[test]
fn the_pane_follow_shows_new_lines_until_it_is_stopped() {
    let screens = Arc::new(Mutex::new(vec![
        "a\nb".to_string(),
        "a\nb\nc".to_string(),
        "b\nc\nd".to_string(),
    ]));
    let seen = Arc::new(Mutex::new(Vec::<String>::new()));
    let (feed, sink) = (screens.clone(), seen.clone());
    let follow = follow_pane_screen(
        Box::new(move || {
            let mut all = feed.lock().unwrap();
            if all.len() > 1 {
                Ok(all.remove(0))
            } else {
                Ok(all[0].clone())
            }
        }),
        Box::new(move |stream, text| sink.lock().unwrap().push(format!("{stream}:{text}"))),
        Some(Duration::from_millis(5)),
    );
    let deadline = std::time::Instant::now() + Duration::from_secs(5);
    while seen.lock().unwrap().len() < 3 && std::time::Instant::now() < deadline {
        std::thread::sleep(Duration::from_millis(5));
    }
    follow.stop();
    assert_eq!(
        *seen.lock().unwrap(),
        ["stdout:a\nb\n", "stdout:c\n", "stdout:d\n"]
    );
}

#[test]
fn a_bypass_launch_of_claude_is_accepted_only_inside_a_private_config_directory_and_merged_into_what_is_there(
) {
    let rig = rig("bypass");
    let now_iso = || NOW.to_string();
    let round = Round::open(&rig.run_dir, Some("w1"), None, None, "agent-a", &now_iso);
    let store = json!({ "kind": "claude-json" });
    let full = Env::from([("CLAUDE_CONFIG_DIR".to_string(), "/operator/cfg".to_string())]);
    let private = rig.dir.join("private-cfg");
    std::fs::create_dir_all(&private).unwrap();
    std::fs::write(private.join("settings.json"), r#"{"theme":"dark"}"#).unwrap();
    let attempt = Env::from([(
        "CLAUDE_CONFIG_DIR".to_string(),
        private.to_string_lossy().into_owned(),
    )]);
    seed_bypass_acceptance(Some("bypass"), Some(&store), &round, &full, Some(&attempt)).unwrap();
    let merged: Value =
        serde_json::from_str(&std::fs::read_to_string(private.join("settings.json")).unwrap())
            .unwrap();
    assert_eq!(
        merged,
        json!({ "theme": "dark", "skipDangerousModePermissionPrompt": true })
    );
    // The operator's own directory is never written: the same environment skips.
    seed_bypass_acceptance(Some("bypass"), Some(&store), &round, &full, Some(&full)).unwrap();
    seed_bypass_acceptance(Some("ask"), Some(&store), &round, &full, Some(&attempt)).unwrap();
    // A settings file that is not an object cannot be merged over: refused by name.
    std::fs::write(private.join("settings.json"), "[1]").unwrap();
    let err = seed_bypass_acceptance(Some("bypass"), Some(&store), &round, &full, Some(&attempt))
        .unwrap_err();
    assert_eq!(err.detail["reason"], "bypass-acceptance-unseedable");
}

// ---- inspection and attention ----------------------------------------------------------------------------

fn materialize(files: &Value, root: &Path) {
    for (rel, body) in files.as_object().unwrap() {
        let file = root.join(rel);
        std::fs::create_dir_all(file.parent().unwrap()).unwrap();
        std::fs::write(file, body.as_str().unwrap()).unwrap();
    }
}

fn pin_mtimes(mtimes: &Value, root: &Path) {
    for (rel, iso) in mtimes.as_object().into_iter().flatten() {
        let millis = fgos_host_runtime::civil_time::parse_rfc3339_millis(iso.as_str().unwrap())
            .unwrap() as u64;
        let at = std::time::UNIX_EPOCH + Duration::from_millis(millis);
        std::fs::File::options()
            .write(true)
            .open(root.join(rel))
            .unwrap()
            .set_modified(at)
            .unwrap();
    }
}

fn with_root(expected: &Value, root: &Path) -> Value {
    serde_json::from_str(
        &expected
            .to_string()
            .replace("<root>", &root.to_string_lossy()),
    )
    .unwrap()
}

fn options_of(value: &Value) -> InspectionOptions {
    let text = |k: &str| value[k].as_str().map(String::from);
    InspectionOptions {
        run: text("run"),
        assignment: text("assignment"),
        cwd: text("cwd"),
        attention: value["attention"].as_bool().unwrap_or(false),
        since: text("since"),
    }
}

fn inspect_at(root: &Path, options: &InspectionOptions) -> Result<Value, String> {
    inspect_dispatch_runtime(root, options, &|| NOW.to_string(), false, None)
}

#[test]
fn every_recorded_selector_is_inspected_to_the_record_the_node_inspection_gave() {
    let recorded = vectors("inspection.v1.json");
    let root = scratch("inspect");
    materialize(&recorded["files"], &root);
    for case in recorded["selectors"].as_array().unwrap() {
        let got = inspect_at(&root, &options_of(&case["options"]));
        match (case["out"].get("ok"), case["out"].get("error")) {
            (Some(ok), _) => assert_eq!(
                got.unwrap_or_else(|e| panic!("{case}: {e}")),
                with_root(ok, &root),
                "{}",
                case["options"]
            ),
            (_, Some(error)) => assert_eq!(
                got.unwrap_err(),
                error["message"].as_str().unwrap(),
                "{}",
                case["options"]
            ),
            _ => panic!("recorded neither"),
        }
    }
}

#[test]
fn a_workspace_view_reads_the_guard_and_projection_evidence_it_finds() {
    let recorded = vectors("inspection.v1.json");
    for case in recorded["cwdEvidence"]
        .as_array()
        .unwrap()
        .iter()
        .chain([&recorded["cwdConflict"]])
    {
        let root = scratch("inspect-cwd");
        materialize(&recorded["files"], &root);
        let evidence: Map<String, Value> = case["files"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect();
        materialize(&Value::Object(evidence), &root);
        let got = inspect_at(
            &root,
            &InspectionOptions {
                cwd: case["cwd"].as_str().map(String::from),
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(got, with_root(&case["out"]["ok"], &root), "{}", case["cwd"]);
    }
}

#[test]
fn an_attention_bound_is_a_date_or_a_date_time_with_an_offset_and_never_a_rolled_over_calendar_day()
{
    for case in vectors("inspection.v1.json")["sinceCases"]
        .as_array()
        .unwrap()
    {
        let got = parse_attention_since(case["since"].as_str().unwrap());
        match case["out"].get("ok") {
            Some(ok) => assert_eq!(got.unwrap(), ok["ms"].as_i64().unwrap(), "{case}"),
            None => assert_eq!(
                got.unwrap_err(),
                case["out"]["error"]["message"].as_str().unwrap(),
                "{case}"
            ),
        }
    }
}

#[test]
fn the_runs_cache_serves_a_second_read_until_it_is_bypassed_or_cleared() {
    let recorded = vectors("inspection.v1.json");
    let root = scratch("inspect-cache");
    materialize(&recorded["files"], &root);
    let mut cache = RunsCache::default();
    let first = all_runs(&root, false, Some(&mut cache));
    std::fs::remove_dir_all(root.join(".fgos/assignments/a1")).unwrap();
    assert_eq!(
        all_runs(&root, false, Some(&mut cache)).len(),
        first.len(),
        "served from the cache"
    );
    assert_eq!(
        all_runs(&root, true, Some(&mut cache)).len(),
        first.len() - 1,
        "a bypass reads the disk again"
    );
    cache.clear(Some(&root));
    assert_eq!(
        all_runs(&root, false, Some(&mut cache)).len(),
        first.len() - 1
    );
}

#[test]
fn a_session_owning_an_assignment_is_found_by_its_refs() {
    let recorded = vectors("inspection.v1.json");
    let root = scratch("inspect-owner");
    materialize(&recorded["files"], &root);
    let found = find_coordination_session_owning_assignment(&root, "a2").unwrap();
    assert_eq!(
        found,
        json!({ "id": "s1", "observeCommand": "fgos coordination recover s1" })
    );
    assert!(find_coordination_session_owning_assignment(&root, "a1").is_none());
}

fn outcome_of(record: &Value) -> String {
    // The outcome table is the unit run history's; this stands in for it with the same rules, so the attention
    // rows are proven over real run results without that module.
    let classification = record.get("classification").cloned().unwrap_or(Value::Null);
    let category = classification
        .pointer("/outcome/category")
        .and_then(Value::as_str)
        .map(String::from)
        .unwrap_or_else(|| fgos_run_result::derive_outcome(&classification).category);
    let code = classification
        .pointer("/failure/code")
        .and_then(Value::as_str);
    match category.as_str() {
        "ok" => "pass",
        "verdict"
            if classification
                .pointer("/assessment/verdict")
                .and_then(Value::as_str)
                == Some("findings") =>
        {
            "findings"
        }
        "blocked" => "blocked",
        "policy" => "policy-refusal",
        "provider" => "provider-limit",
        "infra"
            if matches!(
                code,
                Some("provider-limit" | "paused-limit" | "provider-capacity-refused")
            ) =>
        {
            "provider-limit"
        }
        _ => "execution-failure",
    }
    .to_string()
}

#[test]
fn every_recorded_attention_window_lists_the_rows_the_node_view_listed() {
    let recorded = vectors("attention.v1.json");
    let root = scratch("attention");
    materialize(&recorded["files"], &root);
    pin_mtimes(&recorded["mtimes"], &root);
    let calls = RefCell::new(Vec::new());
    let view = |run_dir: &Path| -> Value {
        let run: Value =
            serde_json::from_str(&std::fs::read_to_string(run_dir.join("run.json")).unwrap())
                .unwrap();
        recorded["viewOf"]
            .get(run["runId"].as_str().unwrap())
            .cloned()
            .unwrap_or_else(|| json!({}))
    };
    let definitions = |since: &str, now: &str| {
        calls
            .borrow_mut()
            .push(json!({ "since": since, "now": now }));
        recorded["definitions"].clone()
    };
    let now = || recorded["observedAt"].as_str().unwrap().to_string();
    for case in recorded["cases"].as_array().unwrap() {
        let since = case["since"].as_str().unwrap();
        let mut readers = AttentionReaders {
            now: &now,
            outcome_of: &outcome_of,
            view: &view,
            definitions: Some(&definitions),
        };
        let with = attention_view(&root, since, &readers, None).unwrap();
        assert_eq!(
            with["lines"],
            with_root(&case["withDefinitions"], &root)["lines"],
            "{since}: lines"
        );
        assert_eq!(with, with_root(&case["withDefinitions"], &root), "{since}");
        readers.definitions = None;
        let without = attention_view(&root, since, &readers, None).unwrap();
        assert_eq!(
            without,
            with_root(&case["withoutDefinitions"], &root),
            "{since}"
        );
    }
    let asked: Vec<Value> = calls.borrow().clone();
    assert_eq!(
        asked.len(),
        recorded["definitionsCalls"].as_array().unwrap().len()
    );
    assert!(attention_view(
        &root,
        "2026-02-30",
        &AttentionReaders {
            now: &now,
            outcome_of: &outcome_of,
            view: &view,
            definitions: None
        },
        None
    )
    .is_err());
}

#[test]
fn the_result_outcomes_the_attention_fake_answers_match_the_ones_recorded_from_the_history_table() {
    let recorded = vectors("attention.v1.json");
    let root = scratch("attention-outcomes");
    materialize(&recorded["files"], &root);
    pin_mtimes(&recorded["mtimes"], &root);
    for (rel, expected) in recorded["outcomes"].as_object().unwrap() {
        let run_dir = root.join(rel).parent().unwrap().to_path_buf();
        let run: Value =
            serde_json::from_str(&std::fs::read_to_string(run_dir.join("run.json")).unwrap())
                .unwrap();
        let location = all_runs(&root, true, None)
            .into_iter()
            .find(|l| l.run_dir == run_dir)
            .expect("run listed");
        let terminal = result_of(&location);
        let got = terminal.value.as_ref().map(outcome_of).unwrap_or_default();
        assert_eq!(&got, expected.as_str().unwrap(), "{rel} ({})", run["runId"]);
    }
}

// ---- end to end ------------------------------------------------------------------------------------------

#[cfg(unix)]
#[test]
fn a_prepared_attempt_is_handed_over_with_its_lock_and_a_stub_agent_settles_on_the_brief() {
    use fgos_holder_lock::{probe, Probe, Resource};
    use fgos_run_supervisor::controller::launch::{
        acquire_attempt_locks, start_supervisor, wait_for_binding, AttemptLockRequest, Binding,
    };
    use std::os::unix::fs::PermissionsExt;

    let rig = rig("e2e");
    let panes = FakePanes::default();
    let host = SessionHost { panes: &panes };
    let (env, binding) = (Env::new(), SeatBinding::default());
    let (now_iso, now_ms, offset) = (|| NOW.to_string(), || 1_795_082_400_000i64, |_: i64| 0i32);
    let ensure = |_: &Env, _: &str| -> Result<WorkerSession, WorkerSessionError> { unreachable!() };
    let sweeper = ProcSweeper::default();
    let diagnostic = |_: &str| {};
    let fx = effects(
        &now_iso,
        &now_ms,
        &offset,
        &ensure,
        &sweeper,
        &diagnostic,
        &rig.dir,
    );
    let fgos_dir = rig.dir.join(".fgos");
    let assignment_dir = fgos_dir.join("assignments/u1");

    // 1. The controller takes the attempt lock first and prepares the round under it.
    let mut locks = acquire_attempt_locks(AttemptLockRequest {
        fgos_dir: &fgos_dir,
        assignment_dir: &assignment_dir,
        attempt_str: "01",
        cwd: &rig.cwd,
        mutating: false,
        custody: None,
        executor_id: None,
        capability: None,
    })
    .expect("attempt lock");
    let lock_path = locks.attempt.as_ref().unwrap().path().to_path_buf();
    let prepared = prepare_terminal_attempt(
        &attempt_for(&rig, &env, &binding),
        &host,
        &panes,
        &mut |_, _, _| {},
        &fx,
    )
    .expect("prepared");

    // 2. A stub agent that settles on the brief, and a stub supervisor that runs it with the lock at descriptor 3.
    let agent = rig.dir.join("agent.sh");
    std::fs::write(&agent, "#!/bin/sh\ngrep -q 'do the thing' \"$1\" || exit 3\nprintf '{\"status\":\"done\"}' > \"$2/result-1.json\"\n").unwrap();
    // The supervisor sets close-on-exec on the lock descriptor it was handed before anything else, as the real
    // route does; only a copy that stays inheritable counts as a borrower the controller's release ends.
    let supervisor = rig.dir.join("host.py");
    std::fs::write(&supervisor, "#!/usr/bin/env python3\nimport fcntl, os, subprocess, sys, time\nrun = os.path.dirname(sys.argv[4])\nfcntl.fcntl(3, fcntl.F_SETFD, fcntl.FD_CLOEXEC)\nif os.path.realpath('/proc/self/fd/3') != open(os.path.join(run, 'expected-lock')).read():\n    sys.exit(9)\nopen(os.path.join(run, 'supervisor-binding.json'), 'w').close()\nagent = open(os.path.join(run, 'agent')).read()\nrc = subprocess.call([agent, os.path.join(run, 'brief-1.md'), os.path.join(run, 'outbox')])\nfor _ in range(400):\n    if os.path.exists(os.path.join(run, 'controller-released')):\n        break\n    time.sleep(0.05)\nsys.exit(rc)\n").unwrap();
    for script in [&agent, &supervisor] {
        std::fs::set_permissions(script, std::fs::Permissions::from_mode(0o755)).unwrap();
    }
    std::fs::write(
        rig.run_dir.join("expected-lock"),
        std::fs::canonicalize(&lock_path)
            .unwrap()
            .to_string_lossy()
            .as_bytes(),
    )
    .unwrap();
    std::fs::write(
        rig.run_dir.join("agent"),
        agent.to_string_lossy().as_bytes(),
    )
    .unwrap();
    let side = rig.run_dir.join("attempt-secrets.json");
    std::fs::write(&side, "{}").unwrap();
    let envelope = json!({ "runDir": rig.run_dir.to_string_lossy(), "hostBin": supervisor.to_string_lossy(), "sideFile": side.to_string_lossy() });

    // 3. The handover: a duplicate of the held lock goes over, then the controller closes its own copy.
    let handover = locks
        .attempt
        .as_ref()
        .unwrap()
        .try_clone_file()
        .expect("duplicate of the lock file");
    let mut started = start_supervisor(&envelope, &[&handover], &Map::new(), &Map::new())
        .expect("supervisor started");
    drop(handover);
    assert_eq!(
        wait_for_binding(&rig.run_dir, &mut started.child, 10_000),
        Binding::Bound
    );
    locks.release_attempt();
    let resource = Resource::new("attempt", &lock_path);
    assert_eq!(
        probe(&resource).unwrap(),
        Probe::Held,
        "the supervisor keeps the lock after the controller closed its copy"
    );

    std::fs::write(rig.run_dir.join("controller-released"), "").unwrap();
    let status = started.child.wait().unwrap();
    assert!(
        status.success(),
        "the stub supervisor saw the lock at descriptor 3 and the agent read the brief: {status:?}"
    );
    let result: Value =
        serde_json::from_str(&std::fs::read_to_string(&prepared.result_path).unwrap()).unwrap();
    assert_eq!(result["status"], "done");
    assert_eq!(
        probe(&resource).unwrap(),
        Probe::Free,
        "the lock ends with the supervisor"
    );
    assert!(
        !panes.live.borrow().is_empty(),
        "the pane stays for the supervisor to release"
    );
}
