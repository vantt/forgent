//! The supervisor can die at any time; the gate keeps the agent's IO and the
//! lock until the agent is done.
#![cfg(target_os = "linux")]

mod support;

use std::fs;
use std::time::Duration;

use fgos_process::control::{signal_by_identity, Signal};
use fgos_process::facts;
use fgos_process::ProcId;
use support::supervisor::*;
use support::*;

#[test]
fn a_supervisor_killed_midway_leaves_the_agent_running_and_the_lock_held_until_the_gate_exits() {
    let Some(_driver) = bwrap_driver("supervise-crash") else { return };
    let mut run = SupRun::new("crash", &RunOpts::agent(2_500));
    let supervisor = run.start();
    let tuple = facts::identity_of(ProcId(supervisor.id())).expect("supervisor identity");
    wait_until(Duration::from_secs(30), "the agent binding", || run.path("agent-binding.json").exists());

    signal_by_identity(&tuple, Signal::Kill);
    let mut supervisor = supervisor;
    let _ = supervisor.wait();

    assert!(run.path("gate-exit.json").exists() == false, "the agent is still running");
    assert!(!lock_is_free(&run.path("attempt.lock")), "the gate keeps the attempt lock after its supervisor died");

    wait_until(Duration::from_secs(30), "the gate to end the attempt", || run.path("gate-exit.json").exists());
    let exit = run.json("gate-exit.json").unwrap();
    assert_eq!(exit["stoppedBy"], "agent");
    assert_eq!(exit["exitCode"], 0, "the agent never saw EPIPE or SIGPIPE");
    assert!(run.outbox.join("result-1.json").exists(), "the agent finished its work");
    assert!(fs::read_to_string(&run.stdout).unwrap().contains("tick"));
    wait_until(Duration::from_secs(5), "the lock to be free after the gate exits", || lock_is_free(&run.path("attempt.lock")));
    assert!(!run.path("receipt.json").exists(), "no supervisor, no receipt: adopt synthesizes it");
}
