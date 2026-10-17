//! The GO handshake, through a real gate in a real bwrap namespace.
#![cfg(target_os = "linux")]

mod support;

use std::time::Duration;

use fgos_run_supervisor::go_channel::read_frame;
use support::*;

fn quick_agent(attempt_name: &str) -> (Options, std::path::PathBuf) {
    let marker = std::env::temp_dir().join(format!("fgos-gate-go-marker-{attempt_name}-{}", std::process::id()));
    let _ = std::fs::remove_file(&marker);
    (Options::new("/bin/sh", &["-c", &format!("echo ran > {}", marker.display())]), marker)
}

#[test]
fn eof_before_go_exits_without_running_the_agent() {
    let Some(driver) = bwrap_driver("eof-before-go") else { return };
    let (options, agent_marker) = quick_agent("eof");
    let attempt = Attempt::new("eof", &options);
    let Gate { mut spawned, mut go, domain: _domain } = start_gate(&*driver, &attempt, None);
    let hello = read_frame(&mut go).expect("HELLO");
    assert_eq!(hello["attemptId"], attempt.attempt_id.as_str());
    // The supervisor goes away without sending GO.
    drop(go);
    assert_eq!(wait_exit(&mut spawned, Duration::from_secs(10)), fgos_run_supervisor::gate::EXIT_NO_GO);
    assert!(!agent_marker.exists(), "the agent must not run without GO");
    assert!(attempt.gate_exit().is_none(), "no gate-exit without an agent");
}

#[test]
fn go_with_the_wrong_digest_is_refused() {
    let Some(driver) = bwrap_driver("wrong-digest") else { return };
    let (options, agent_marker) = quick_agent("digest");
    let attempt = Attempt::new("digest", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    send_go(&mut gate, &attempt.attempt_id, "sha256:0000000000000000000000000000000000000000000000000000000000000000");
    assert_eq!(wait_exit(&mut gate.spawned, Duration::from_secs(10)), fgos_run_supervisor::gate::EXIT_ENVELOPE_INVALID);
    assert!(!agent_marker.exists());
    assert!(attempt.gate_exit().is_none());
}

#[test]
fn go_for_another_attempt_is_refused() {
    let Some(driver) = bwrap_driver("wrong-attempt") else { return };
    let (options, agent_marker) = quick_agent("attempt");
    let attempt = Attempt::new("attempt", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    send_go(&mut gate, "att-someone-else", &attempt.digest);
    assert_eq!(wait_exit(&mut gate.spawned, Duration::from_secs(10)), fgos_run_supervisor::gate::EXIT_ENVELOPE_INVALID);
    assert!(!agent_marker.exists());
}

#[test]
fn a_tampered_envelope_is_refused_before_hello() {
    let Some(driver) = bwrap_driver("tampered-envelope") else { return };
    let (options, agent_marker) = quick_agent("tamper");
    let attempt = Attempt::new("tamper", &options);
    let text = std::fs::read_to_string(&attempt.envelope).unwrap().replace("\"unit-1\"", "\"unit-2\"");
    std::fs::write(&attempt.envelope, text).unwrap();
    let mut gate = start_gate(&*driver, &attempt, None);
    assert_eq!(wait_exit(&mut gate.spawned, Duration::from_secs(10)), fgos_run_supervisor::gate::EXIT_ENVELOPE_INVALID);
    assert!(!agent_marker.exists());
}

#[test]
fn a_correct_go_runs_the_agent_and_reports_its_tuple() {
    let Some(driver) = bwrap_driver("correct-go") else { return };
    let (options, agent_marker) = quick_agent("ok");
    let attempt = Attempt::new("ok", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    let agent = start_agent(&mut gate, &attempt);
    assert_eq!(agent["tuple"]["pid"].as_u64().is_some(), true);
    assert_eq!(wait_exit(&mut gate.spawned, Duration::from_secs(10)), 0);
    assert!(agent_marker.exists());
    assert_eq!(attempt.gate_exit().unwrap()["stoppedBy"], "agent");
}
