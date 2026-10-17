//! `fgos internal supervise` against a real gate under bwrap: the hand-over,
//! the receipt, the steps, the deadlines, the cancel request and the lease.
#![cfg(target_os = "linux")]

mod support;

use std::fs;
use std::time::Duration;

use serde_json::json;
use support::supervisor::*;
use support::*;

const LIMIT: Duration = Duration::from_secs(60);

fn steps(run: &std::path::Path) -> Vec<serde_json::Value> {
    let dir = run.display();
    vec![
        shell_step(run, "settle-attempt", &format!("echo settle >> {dir}/order; echo '{{\"result\":\"done\",\"detail\":{{\"settled\":true}}}}'"), 10_000),
        shell_step(run, "finalize-home", &format!("echo finalize >> {dir}/order"), 10_000),
    ]
}

#[test]
fn a_full_lifecycle_binds_receipts_runs_the_steps_in_order_and_frees_the_lock() {
    let Some(_driver) = bwrap_driver("supervise-lifecycle") else { return };
    let mut opts = RunOpts::agent(600);
    let probe = SupRun::new("lifecycle", &opts);
    opts.steps = steps(&probe.dir);
    drop(probe);
    let mut run = SupRun::new("lifecycle", &opts);
    let supervisor = run.start();
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["result"], "closed");
    assert_eq!(line["outcome"], "exited");

    let binding = run.json("supervisor-binding.json").expect("binding");
    assert_eq!(binding["attemptId"], run.attempt_id.as_str());
    assert_eq!(binding["domain"]["kind"], "linux-gate");
    assert_eq!(binding["guarantee"]["containment"], "kernel");
    assert_eq!(binding["gate"]["pid"], binding["domain"]["id"]["pid"]);
    assert!(run.json("attempt.lock.predecessor.json").is_some(), "the domain was declared on the lock");
    assert!(run.json("agent-binding.json").is_some_and(|a| a["agent"]["pid"].is_number()));

    let receipt = run.json("receipt.json").expect("receipt");
    assert_eq!(receipt["outcome"], "exited");
    assert_eq!(receipt["synthesizedBy"], "supervisor");
    assert_eq!(receipt["outboxPresent"], true);
    assert_eq!(receipt["gateExit"]["stoppedBy"], "agent");
    assert!(receipt["captureDigests"]["stdout"].as_str().unwrap().starts_with("sha256:"));

    assert_eq!(fs::read_to_string(run.path("order")).unwrap(), "settle\nfinalize\n");
    for id in ["settle-attempt", "finalize-home"] {
        let step = run.json(&format!("steps/{id}.json")).unwrap_or_else(|| panic!("receipt of {id}"));
        assert_eq!(step["status"], "done");
    }
    assert_eq!(run.json("steps/settle-attempt.json").unwrap()["detail"], json!({"settled": true}));
    let closed = run.json("closed.json").expect("closed");
    assert_eq!(closed["steps"], json!(["settle-attempt", "finalize-home"]));
    assert!(lock_is_free(&run.path("attempt.lock")), "the attempt lock is empty once the supervisor is gone");
    assert!(run.json("supervisor-heartbeat.json").is_some());
}

#[test]
fn a_soft_deadline_stops_the_agent_and_every_descendant() {
    let Some(_driver) = bwrap_driver("supervise-soft-deadline") else { return };
    let mut opts = RunOpts::agent(120_000);
    opts.soft_ms = Some(1_000);
    let mut run = SupRun::new("soft", &opts);
    let supervisor = run.start();
    wait_until(Duration::from_secs(30), "the agent and its grandchild", || run.grandchild_pid.exists() && run.path("supervisor-binding.json").exists());
    std::thread::sleep(Duration::from_millis(300));
    let gate_pid = run.json("supervisor-binding.json").unwrap()["gate"]["pid"].as_u64().unwrap() as u32;
    let gate = fgos_process::facts::identity_of(fgos_process::ProcId(gate_pid)).expect("gate identity");
    let members: Vec<u32> = namespace_members(&gate).into_iter().map(|(pid, _)| pid).filter(|pid| *pid != gate_pid).collect();
    assert!(members.len() >= 2, "agent and setsid grandchild are in the namespace: {members:?}");
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["outcome"], "timeout");
    let receipt = run.json("receipt.json").unwrap();
    assert_eq!(receipt["gateExit"]["stoppedBy"], "soft-deadline");
    assert_eq!(run.json("stop-requested.json").unwrap()["cause"], "soft-deadline");
    assert!(members.iter().all(|pid| !alive(*pid)), "every member of the domain died: {members:?}");
    assert!(lock_is_free(&run.path("attempt.lock")));
}

#[test]
fn a_cancel_request_ends_the_attempt_as_cancelled() {
    let Some(_driver) = bwrap_driver("supervise-cancel") else { return };
    let mut run = SupRun::new("cancel", &RunOpts::agent(120_000));
    let supervisor = run.start();
    wait_until(Duration::from_secs(20), "the agent to start", || run.marker.exists());
    fs::write(run.path("cancel-requested.json"), json!({"v": 1, "attemptId": run.attempt_id, "requestedBy": "test", "at": "2026-10-18T00:00:00.000Z"}).to_string()).unwrap();
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["outcome"], "cancelled");
    assert_eq!(run.json("receipt.json").unwrap()["gateExit"]["stoppedBy"], "cancel");
}

#[test]
fn the_cwd_lease_is_free_the_moment_the_gate_is_gone_while_a_step_still_runs() {
    let Some(_driver) = bwrap_driver("supervise-lease") else { return };
    let mut opts = RunOpts::agent(300);
    opts.mutating = true;
    let probe = SupRun::new("lease", &opts);
    opts.steps = vec![shell_step(&probe.dir, "settle-attempt", "sleep 3", 20_000)];
    drop(probe);
    let mut run = SupRun::new("lease", &opts);
    let supervisor = run.start();
    wait_until(Duration::from_secs(30), "the gate to publish gate-exit", || run.path("gate-exit.json").exists());
    let lease = run.path("cwd.lease");
    wait_until(Duration::from_secs(2), "the cwd lease to be free", || lock_is_free_ex(&lease));
    assert!(!run.path("steps/settle-attempt.json").exists(), "the step is still running when the lease is already free");
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["result"], "closed");
}

#[test]
fn a_host_bin_that_is_not_the_running_binary_spawns_nothing() {
    let mut opts = RunOpts::agent(300);
    opts.host_bin = Some("/bin/true".into());
    let mut run = SupRun::new("mismatch", &opts);
    let supervisor = run.start();
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 3, "{}", run.log());
    assert_eq!(line["code"], "host-version-mismatch");
    assert_eq!(line["protocol"], 1);
    for name in ["supervisor-binding.json", "attempt.lock.predecessor.json", "receipt.json", "capture-stdout.log", "agent.marker"] {
        assert!(!run.path(name).exists(), "{name} must not exist");
    }
    assert!(lock_is_free(&run.path("attempt.lock")), "the lock is released when the refused supervisor exits");
}

#[test]
fn a_tampered_envelope_is_refused_before_anything_starts() {
    let mut run = SupRun::new("tampered", &RunOpts::agent(300));
    let mut value: serde_json::Value = serde_json::from_str(&fs::read_to_string(&run.envelope).unwrap()).unwrap();
    value["cwd"] = json!("/tmp");
    fs::write(&run.envelope, serde_json::to_vec(&value).unwrap()).unwrap();
    let supervisor = run.start();
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 65);
    assert_eq!(line["code"], "envelope-invalid");
    assert!(!run.path("supervisor-binding.json").exists());
}

#[test]
fn a_gate_that_never_starts_the_agent_still_ends_in_a_named_receipt() {
    let Some(_driver) = bwrap_driver("supervise-no-agent") else { return };
    let mut opts = RunOpts::agent(300);
    opts.ceiling_past = true;
    let mut run = SupRun::new("no-agent", &opts);
    let supervisor = run.start();
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["outcome"], "timeout");
    assert_eq!(run.json("receipt.json").unwrap()["gateExit"]["stoppedBy"], "hard-ceiling");
    assert!(!run.path("agent-binding.json").exists() && !run.marker.exists(), "no agent ever ran");
}

#[test]
fn a_gate_that_dies_without_gate_exit_gives_a_gate_lost_receipt() {
    let Some(_driver) = bwrap_driver("supervise-gate-lost") else { return };
    let mut run = SupRun::new("gate-lost", &RunOpts::agent(300));
    // The side file is gone: the gate leaves with 65 after GO and publishes nothing.
    fs::remove_file(run.path("protected/attempt-secrets.json")).unwrap();
    let supervisor = run.start();
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["outcome"], "gate-lost");
    let receipt = run.json("receipt.json").unwrap();
    assert!(receipt.get("gateExit").is_none());
    assert!(!run.marker.exists());
    assert!(lock_is_free(&run.path("attempt.lock")));
}
