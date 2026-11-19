//! A terminal attempt's pane through the host's route port, over a fake terminal driver: no herdr is started.

use std::sync::{Arc, Mutex};

use fgos_execution_engine::accounts::SystemHost;
use fgos_execution_engine::assignment_runner::attempt::{
    open_attempt, publish_attempt_intent, OpenAttempt,
};
use fgos_execution_engine::assignment_runner::seat::{PaneAsk, SeatInput};
use fgos_execution_engine::confinement::request::Launch;
use fgos_execution_engine::transport::worker_session::{Env, WorkerSessionError};
use fgos_execution_engine::transport::worker_session_boot::{Capabilities, WorkerSession};
use fgos_execution_engine::transport_round::round::RoundPanes;
use fgos_run_supervisor::controller::launch::{AttemptHost, LaneSettings, LaunchSettings};
use fgos_session_host::Panes;
use fgos_terminal_control::core::Want;
use fgos_terminal_control::port::{
    AllocateRequest, Allocation, Disposition, Inspection, LaunchOutcome, LaunchSpec, Origin,
    PaneState, Refusal, ReleaseOutcome, SendOutcome, Slot,
};
use serde_json::{json, Map, Value};

use super::super::terminal::{prepare_pane, PaneMachine, PaneRoute, RoutePanes};
use super::Scratch;

/// What the fake driver saw, each call with the herdr endpoint it was reached through.
#[derive(Default)]
struct Seen {
    allocated: Vec<(Env, AllocateRequest)>,
    released: Vec<(Env, String)>,
    sessions: Vec<Env>,
}

struct FakeRoute(Arc<Mutex<Seen>>);

struct FakePanes {
    endpoint: Env,
    seen: Arc<Mutex<Seen>>,
}

impl Panes for FakePanes {
    fn allocate(&self, request: &AllocateRequest) -> Result<Allocation, Refusal> {
        let mut seen = self.seen.lock().unwrap();
        seen.allocated
            .push((self.endpoint.clone(), request.clone()));
        Ok(Allocation {
            slot: Slot {
                tab_id: "tab-1".into(),
                pane_id: "pane-9".into(),
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
    fn inspect(&self, _: &str, _: Want) -> Inspection {
        Inspection {
            pane: PaneState::Live,
            foreground: None,
            activity: None,
        }
    }
    fn focus(&self, _: &str) -> Result<(), Refusal> {
        Ok(())
    }
    fn release(&self, key: &str, disposition: Disposition) -> Result<ReleaseOutcome, Refusal> {
        let mut seen = self.seen.lock().unwrap();
        seen.released.push((self.endpoint.clone(), key.to_string()));
        Ok(ReleaseOutcome::Released { disposition })
    }
}

impl RoundPanes for FakePanes {
    fn attach(&self, _: &str, _: &str, _: &str, _: &Value) -> Result<(), String> {
        Ok(())
    }
    fn read_visible(&self, _: &str) -> Result<String, String> {
        Ok(String::new())
    }
}

impl RoutePanes for FakePanes {
    fn server(&self) -> Capabilities {
        Capabilities {
            server_answers: true,
            socket_path: self.endpoint.get("HERDR_SOCKET_PATH").cloned(),
        }
    }
}

fn worker_endpoint() -> Env {
    [
        ("HERDR_SESSION", "fgos-worker"),
        ("HERDR_SOCKET_PATH", "/run/fgos-worker.sock"),
    ]
    .into_iter()
    .map(|(k, v)| (k.to_string(), v.to_string()))
    .collect()
}

impl PaneRoute for FakeRoute {
    fn panes(&self, endpoint: &Env) -> Result<Box<dyn RoutePanes>, String> {
        Ok(Box::new(FakePanes {
            endpoint: endpoint.clone(),
            seen: self.0.clone(),
        }))
    }
    fn ensure_session(&self, env: &Env) -> Result<WorkerSession, WorkerSessionError> {
        self.0.lock().unwrap().sessions.push(env.clone());
        Ok(WorkerSession {
            session_name: "fgos-worker".into(),
            socket_path: "/run/fgos-worker.sock".into(),
            env: worker_endpoint(),
            started_server: false,
        })
    }
}

#[test]
fn a_terminal_attempts_pane_opens_in_its_worker_session_is_named_by_the_intent_first_and_is_given_back_on_abandon(
) {
    let scratch = Scratch::new("pane");
    let root = scratch.0.join("repo");
    let run_dir = root.join(".fgos/assignments/u1/runs/01");
    std::fs::create_dir_all(&run_dir).unwrap();
    let attempt_id = "cmd_1795081120288_aabbccdd";
    let mut attempt = open_attempt(OpenAttempt {
        run_dir: run_dir.clone(),
        run_id: "run_u1_01".into(),
        attempt_id: attempt_id.into(),
        unit_run_id: "u1".into(),
        terminal: true,
        cwd: root.to_string_lossy().into_owned(),
        host: Some(AttemptHost {
            host_bin: "/bin/false".into(),
            payload_root: root.to_string_lossy().into_owned(),
        }),
        step_env: Map::new(),
        custody: false,
        lease_runtime_dir: None,
        session: false,
    });
    publish_attempt_intent(&mut attempt, None).unwrap();

    let settings = LaunchSettings {
        gate_kill_grace_ms: 0,
        kill_wait_ms: 0,
        lanes: LaneSettings {
            ceiling: None,
            lane_wait_sec: 0,
        },
    };
    let (cfg, policy, context, requirement) = (
        json!({}),
        json!({ "tier": "standard", "model": "m" }),
        json!({}),
        json!({ "mode": "unconfined" }),
    );
    let label = json!({ "id": "run-ab12", "title": "look around" });
    let fgos_dir = root.join(".fgos");
    let seat = SeatInput {
        cfg: &cfg,
        root: &root,
        fgos_dir: &fgos_dir,
        executor_id: "stub",
        effective_policy: &policy,
        pinned_invocation_id: None,
        requested_model: None,
        prompt: "do the thing",
        timeout_ms: 1000,
        settings: &settings,
        capability: "execute",
        assignment_launch_context: &context,
        provider_capacity: None,
        provider_capacity_evidence: None,
        confinement_requirement: &requirement,
        repo_root: &root,
        context_refs: None,
        dispatch_batch_key: Some("batch-1"),
        dispatch_batch_size: Some(2),
        work_label: Some(&label),
        launch_env: None,
        blind: false,
        mutating: false,
        case_context: None,
        session: None,
        ceiling_ms: None,
        request_socket: None,
        retain_failed_pane_ms: None,
        depth: 0,
    };
    let prepared = Launch {
        attempt: json!({ "command": "/usr/bin/claude", "secretEnv": { "SECRET": "s" } }),
        prepared_invocation: json!({}),
        prepared_invocation_digest: String::new(),
        provider_capacity: None,
        finalization_path: run_dir.join("finalization.json"),
        finalization_descriptor: Value::Null,
        backend_plan: None,
        prepared: None,
    };
    // An executor that declares its own herdr session: the pane must never open in the controller's.
    let resolved = json!({ "interactiveMode": { "kind": "claude" }, "confinement": { "isolatedSession": true } });
    let request = json!({ "requirement": requirement });
    let contract = json!({ "assignment": { "role": "producer" } });
    let ask = PaneAsk {
        resolved_cmd: &resolved,
        prepared: &prepared,
        confinement_request: &request,
        seat: &seat,
        agent_args: &[],
        effective_contract: Some(&contract),
    };
    let controller: Env = [
        ("HERDR_SESSION", "cockpit"),
        ("HERDR_SOCKET_PATH", "/run/cockpit.sock"),
        ("HOME", scratch.0.to_str().unwrap()),
    ]
    .into_iter()
    .map(|(k, v)| (k.to_string(), v.to_string()))
    .collect();
    let seen = Arc::new(Mutex::new(Seen::default()));
    let host = SystemHost::new();
    let pane = prepare_pane(
        &mut attempt,
        &ask,
        Arc::new(FakeRoute(seen.clone())),
        &PaneMachine {
            env: &controller,
            state_root: &scratch.0.join("state"),
            tmp_dir: scratch.0.clone(),
            host: &host,
        },
    )
    .unwrap_or_else(|e| panic!("{e:?}"));

    assert_eq!(pane.group_key, "batch-1");
    assert_eq!(pane.endpoint_env["HERDR_SESSION"], "fgos-worker");
    assert!(std::fs::read_to_string(&pane.brief_path)
        .unwrap()
        .contains("do the thing"));
    {
        let seen = seen.lock().unwrap();
        assert_eq!(
            seen.sessions[0]["HERDR_SESSION"], "cockpit",
            "the session is brought up from the controller's view"
        );
        assert_eq!(seen.allocated.len(), 1);
        let (endpoint, request) = &seen.allocated[0];
        assert_eq!(endpoint, &worker_endpoint(), "opened in the worker session");
        assert_eq!(request.key, attempt_id);
        assert_eq!(request.group_size, Some(2));
        assert_eq!(request.display.role.as_deref(), Some("producer"));
        assert_eq!(request.display.agent.as_deref(), Some("claude"));
    }
    let intent: Value = serde_json::from_str(
        &std::fs::read_to_string(run_dir.join("attempt-intent.json")).unwrap(),
    )
    .unwrap();
    assert_eq!(intent["terminal"]["slot"]["key"], attempt_id);
    assert_eq!(
        intent["terminal"]["endpointEnv"]["HERDR_SESSION"],
        "fgos-worker"
    );
    assert!(attempt.intent_names_pane);

    // Before the handover the pane is the controller's to give back, through the session it was opened in.
    attempt
        .terminal_prep
        .take()
        .expect("a pane is owed")
        .abandon();
    let seen = seen.lock().unwrap();
    assert_eq!(seen.released, [(worker_endpoint(), attempt_id.to_string())]);
}
