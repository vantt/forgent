//! `fgos internal supervise` on every OS the supervisor supports, with a real
//! gate, a real agent and real steps (no shell, no Node, no bwrap): the
//! hand-over, the receipt, the steps, the deadlines, the cancel request, the
//! supervisor dying mid-run and the adopt door settling what it left behind.
//! Unix runs the gate as a plain process in a process group (or the macOS
//! tree); Windows runs it inside the attempt's job.

mod portable;

use std::fs;
use std::time::Duration;

use portable::supervisor::*;
use portable::{agent_exe, pid_in, wait_dead, wait_for};
use serde_json::json;

const LIMIT: Duration = Duration::from_secs(90);


#[test]
fn a_full_lifecycle_binds_receipts_runs_the_steps_in_order_and_frees_the_lock() {
    let (name, dir) = ("lifecycle", dir_of("lifecycle"));
    let order = arg_path(name, "order");
    // The agent lives long enough to have an identity the gate can report.
    let mut opts = Opts::agent(&["work", "600", &arg_path(name, "agent.up"), &arg_path(name, "agent.done")]);
    opts.steps = vec![step(&dir, "settle-attempt", &["step-write", &order, "settle"], 20_000), step(&dir, "finalize-home", &["step-write", &order, "finalize"], 20_000)];
    let mut run = Run::new(name, &opts);
    let supervisor = run.start();
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["result"], "closed", "{line} {}", run.log());
    assert_eq!(line["outcome"], "exited");

    let binding = run.json("supervisor-binding.json").expect("binding");
    assert_eq!(binding["attemptId"], run.attempt_id.as_str());
    assert_eq!(binding["domain"]["kind"], portable::driver_name());
    assert!(run.json("attempt.lock.predecessor.json").is_some(), "the domain was declared on the lock");
    assert!(run.json("agent-binding.json").is_some_and(|a| a["agent"]["pid"].is_number()));

    let receipt = run.json("receipt.json").expect("receipt");
    assert_eq!(receipt["outcome"], "exited");
    assert_eq!(receipt["synthesizedBy"], "supervisor");
    assert_eq!(receipt["gateExit"]["stoppedBy"], "agent");
    assert!(receipt["captureDigests"]["stdout"].as_str().unwrap().starts_with("sha256:"));
    assert!(fs::read_to_string(run.path("capture-stdout.log")).unwrap().contains("tick"));

    let order: Vec<String> = fs::read_to_string(run.path("order")).unwrap().lines().map(|l| l.trim().to_string()).collect();
    assert_eq!(order, ["settle", "finalize"]);
    for id in ["settle-attempt", "finalize-home"] {
        assert_eq!(run.json(&format!("steps/{id}.json")).unwrap_or_else(|| panic!("receipt of {id}"))["status"], "done");
    }
    assert_eq!(run.json("closed.json").expect("closed")["steps"], json!(["settle-attempt", "finalize-home"]));
    assert!(run.lock_is_free(), "the attempt lock is empty once the supervisor is gone");
    assert!(run.json("supervisor-heartbeat.json").is_some());
}

#[test]
fn a_supervisor_killed_midway_leaves_the_agent_running_and_adopt_settles_from_gate_exit() {
    let (name, dir) = ("crash", dir_of("crash"));
    let mut opts = Opts::agent(&["work", "3000", &arg_path(name, "agent.up"), &arg_path(name, "agent.done")]);
    opts.steps = vec![step(&dir, "settle-attempt", &["step-write", &arg_path(name, "ran"), "settle"], 20_000)];
    let mut run = Run::new(name, &opts);
    let mut supervisor = run.start();
    wait_for(&run.path("agent.up"), Duration::from_secs(30));
    wait_until(Duration::from_secs(30), "the agent binding", || run.path("agent-binding.json").exists());

    supervisor.kill().expect("kill the supervisor");
    let _ = supervisor.wait();

    assert!(!run.path("gate-exit.json").exists(), "the agent is still running");
    assert!(!run.path("agent.done").exists());
    let running = run.adopt(&["--probe-only"]);
    assert_eq!(running["state"], "running", "a live domain is never adopted: {running}");

    wait_until(Duration::from_secs(60), "the gate to end the attempt", || run.path("gate-exit.json").exists());
    let exit = run.json("gate-exit.json").unwrap();
    assert_eq!(exit["stoppedBy"], "agent");
    assert_eq!(exit["exitCode"], 0, "the agent never saw a broken pipe");
    assert_eq!(fs::read_to_string(run.path("agent.done")).unwrap(), "done", "the agent finished its work");
    assert!(!run.path("receipt.json").exists(), "no supervisor, no receipt: adopt synthesizes it");

    wait_until(Duration::from_secs(30), "the lock and the domain to be free", || run.lock_is_free() && run.adopt(&["--probe-only"])["state"] == "needs-adopt");
    let adopted = run.adopt(&[]);
    assert_eq!(adopted["state"], "adopted", "{adopted}");
    assert_eq!(adopted["outcome"], "exited");
    let receipt = run.json("receipt.json").unwrap();
    assert_eq!(receipt["synthesizedBy"], "adopt");
    assert_eq!(receipt["gateExit"]["stoppedBy"], "agent");
    assert_eq!(fs::read_to_string(run.path("ran")).unwrap().lines().count(), 1, "the step ran once");
    assert_eq!(run.json("closed.json").unwrap()["closedBy"], "adopt");
    assert_eq!(run.adopt(&[])["state"], "closed");
}

#[test]
fn a_soft_deadline_stops_the_agent_and_its_children() {
    let mut opts = Opts::agent(&["tree", &arg_path("soft", "agent.up"), &arg_path("soft", "child.pid")]);
    opts.soft_ms = Some(1_500);
    let mut run = Run::new("soft", &opts);
    let supervisor = run.start();
    let child = pid_in(&run.path("child.pid"));
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["outcome"], "timeout", "{line}");
    let receipt = run.json("receipt.json").unwrap();
    assert_eq!(receipt["gateExit"]["stoppedBy"], "soft-deadline");
    assert_eq!(run.json("stop-requested.json").unwrap()["cause"], "soft-deadline");
    assert!(wait_dead(child, Duration::from_secs(15)), "the agent's child {child} died with the attempt");
    assert!(run.lock_is_free());
}

#[test]
fn a_cancel_request_ends_the_attempt_as_cancelled() {
    let opts = Opts::agent(&["sleep", &arg_path("cancel", "agent.up")]);
    let mut run = Run::new("cancel", &opts);
    let supervisor = run.start();
    wait_for(&run.path("agent.up"), Duration::from_secs(30));
    fs::write(run.path("cancel-requested.json"), json!({"v": 1, "attemptId": run.attempt_id, "requestedBy": "test", "at": "2026-10-18T00:00:00.000Z"}).to_string()).unwrap();
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["outcome"], "cancelled", "{line}");
    assert_eq!(run.json("receipt.json").unwrap()["gateExit"]["stoppedBy"], "cancel");
}

#[test]
fn neither_the_agent_nor_a_step_holds_a_handle_on_the_attempt_lock() {
    let (name, dir) = ("no-lock-handle", dir_of("no-lock-handle"));
    let lock = arg_path(name, "attempt.lock");
    let mut opts = Opts::agent(&["scan-lock", &lock, &arg_path(name, "agent-scan.txt")]);
    opts.steps = vec![step(&dir, "settle-attempt", &["scan-lock", &lock, &arg_path(name, "step-scan.txt")], 20_000)];
    let mut run = Run::new(name, &opts);
    let supervisor = run.start();
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["result"], "closed", "{line} {}", run.log());
    assert_eq!(fs::read_to_string(run.path("agent-scan.txt")).unwrap(), "none", "the agent holds no handle on the attempt lock");
    assert_eq!(fs::read_to_string(run.path("step-scan.txt")).unwrap(), "none", "a step holds no handle on the attempt lock");
}

#[test]
fn a_host_bin_that_is_not_the_running_binary_spawns_nothing() {
    let mut opts = Opts::agent(&["say", ""]);
    opts.host_bin = Some(agent_exe());
    let mut run = Run::new("mismatch", &opts);
    let supervisor = run.start();
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 3, "{}", run.log());
    assert_eq!(line["code"], "host-version-mismatch");
    for name in ["supervisor-binding.json", "attempt.lock.predecessor.json", "receipt.json", "capture-stdout.log"] {
        assert!(!run.path(name).exists(), "{name} must not exist");
    }
    assert!(run.lock_is_free(), "the lock is released when the refused supervisor exits");
}

#[test]
fn a_step_exit_of_75_leaves_no_receipt_and_stops_the_chain() {
    let (name, dir) = ("retry", dir_of("retry"));
    let mut opts = Opts::agent(&["say", ""]);
    opts.steps = vec![step(&dir, "settle-attempt", &["step-exit", "75"], 20_000), step(&dir, "finalize-home", &["step-write", &arg_path(name, "ran"), "x"], 20_000)];
    let mut run = Run::new(name, &opts);
    let supervisor = run.start();
    let (code, line) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
    assert_eq!(line["result"], "open", "{line}");
    assert_eq!(line["pendingStep"], "settle-attempt");
    assert!(!run.path("steps/settle-attempt.json").exists() && !run.path("ran").exists() && !run.path("closed.json").exists());
}
