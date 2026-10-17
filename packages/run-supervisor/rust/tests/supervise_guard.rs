//! A second supervisor for an attempt whose first supervisor died must refuse before it touches the lock:
//! taking it would end the still-live domain the design promises to keep alive. The attempt is left to adopt.
#![cfg(target_os = "linux")]

mod support;

use std::fs::OpenOptions;
use std::os::unix::fs::OpenOptionsExt;
use std::os::unix::process::CommandExt;
use std::process::{Command, Stdio};
use std::time::Duration;

use fgos_process::control::{signal_by_identity, spawn_with_fds, Signal};
use fgos_process::{facts, FdSlot, ProcId};
use support::supervisor::*;
use support::*;

#[test]
fn a_second_supervisor_refuses_a_bound_attempt_and_leaves_the_live_agent_alone() {
    let Some(_driver) = bwrap_driver("supervise-guard") else { return };
    let mut run = SupRun::new("guard", &RunOpts::agent(2_500));
    let first = run.start();
    let tuple = facts::identity_of(ProcId(first.id())).expect("supervisor identity");
    wait_until(Duration::from_secs(30), "the agent binding", || run.path("agent-binding.json").exists());
    signal_by_identity(&tuple, Signal::Kill);
    let mut first = first;
    let _ = first.wait();
    assert!(!lock_is_free(&run.path("attempt.lock")), "the gate keeps the lock after its supervisor died");

    // The second start gets a description of the lock file, as a controller restart would.
    let lock = OpenOptions::new().read(true).write(true).create(true).truncate(false).mode(0o600).open(run.path("attempt.lock")).unwrap();
    let mut cmd = Command::new(internal_harness());
    cmd.args(["internal", "supervise", "--protocol", "1", "--envelope"]).arg(&run.envelope).env_clear().stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::null());
    // SAFETY: setsid is async-signal-safe.
    unsafe {
        cmd.pre_exec(|| if libc::setsid() < 0 { Err(std::io::Error::last_os_error()) } else { Ok(()) });
    }
    let second = spawn_with_fds(cmd, &[(FdSlot(3), &lock)]).expect("second supervisor starts");
    let (code, line) = finish(second, Duration::from_secs(20));
    assert_eq!(code, 71, "{line}");
    assert_eq!(line["code"], "attempt-already-bound");
    assert!(!run.path("start-refused.json").exists(), "the refusal is not a failed start of the attempt");

    // The agent was not touched: it finishes by itself and the gate ends the attempt.
    wait_until(Duration::from_secs(30), "the gate to end the attempt", || run.path("gate-exit.json").exists());
    let exit = run.json("gate-exit.json").unwrap();
    assert_eq!(exit["stoppedBy"], "agent");
    assert_eq!(exit["exitCode"], 0);
    assert!(run.outbox.join("result-1.json").exists(), "the agent finished its work");
}
