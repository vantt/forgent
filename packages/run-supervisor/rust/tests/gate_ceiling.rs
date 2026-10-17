//! Escalation and the hard ceiling, through a real gate in a real bwrap
//! namespace: SIGTERM, the grace, SIGKILL, and a ceiling that fires with no
//! supervisor left.
#![cfg(target_os = "linux")]

mod support;

use std::fs;
use std::thread::sleep;
use std::time::{Duration, Instant};

use fgos_process::control::{signal_by_identity, Signal};
use support::*;

fn stubborn(name: &str) -> (Options, std::path::PathBuf) {
    let marker = std::env::temp_dir().join(format!("fgos-gate-{name}-stubborn-marker-{}", std::process::id()));
    let _ = fs::remove_file(&marker);
    (Options::new("/bin/sh", &[&fixture("ignore-sigterm.sh"), &marker.to_string_lossy()]), marker)
}

#[test]
fn an_agent_that_ignores_sigterm_is_killed_after_the_grace() {
    let Some(driver) = bwrap_driver("ignore-sigterm") else { return };
    let (mut options, marker) = stubborn("grace");
    options.grace_ms = 1_500;
    let attempt = Attempt::new("grace", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    start_agent(&mut gate, &attempt);
    wait_for(&marker, Duration::from_secs(10));
    attempt.stop_requested("soft-deadline");
    let started = Instant::now();
    signal_by_identity(&gate.spawned.root, Signal::Term);
    assert_eq!(wait_exit(&mut gate.spawned, Duration::from_secs(15)), 0);
    let took = started.elapsed();
    assert!(took >= Duration::from_millis(1_400), "SIGKILL waited for the grace: {took:?}");
    assert!(took < Duration::from_secs(6), "and not much longer: {took:?}");
    let exit = attempt.gate_exit().unwrap();
    assert_eq!(exit["signal"], "SIGKILL");
    assert_eq!(exit["stoppedBy"], "soft-deadline");
}

#[test]
fn the_hard_ceiling_is_enforced_with_no_supervisor_left() {
    let Some(driver) = bwrap_driver("hard-ceiling") else { return };
    let (mut options, marker) = stubborn("ceiling");
    options.grace_ms = 500;
    options.ceiling = Some((boot_id(), boottime_ns() + 2_000_000_000));
    let attempt = Attempt::new("ceiling", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    start_agent(&mut gate, &attempt);
    wait_for(&marker, Duration::from_secs(10));
    // The supervisor disappears: the gate and the agent carry on.
    let started = Instant::now();
    let Gate { mut spawned, go, domain: _domain } = gate;
    drop(go);
    sleep(Duration::from_millis(600));
    assert!(spawned.child.try_wait().unwrap().is_none(), "the gate outlives its supervisor in direct mode");
    assert_eq!(wait_exit(&mut spawned, Duration::from_secs(15)), 0);
    let took = started.elapsed();
    assert!(took >= Duration::from_millis(1_800), "the ceiling is absolute: {took:?}");
    let exit = attempt.gate_exit().unwrap();
    assert_eq!(exit["stoppedBy"], "hard-ceiling");
    assert_eq!(exit["cause"], "hard-ceiling");
    assert_eq!(exit["signal"], "SIGKILL");
}

#[test]
fn a_cooperative_agent_stops_on_the_ceiling_with_sigterm() {
    let Some(driver) = bwrap_driver("ceiling-sigterm") else { return };
    let mut options = Options::new("/bin/sleep", &["600"]);
    options.ceiling = Some((boot_id(), boottime_ns() + 1_000_000_000));
    let attempt = Attempt::new("ceiling-term", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    start_agent(&mut gate, &attempt);
    assert_eq!(wait_exit(&mut gate.spawned, Duration::from_secs(15)), 0);
    let exit = attempt.gate_exit().unwrap();
    assert_eq!(exit["stoppedBy"], "hard-ceiling");
    assert_eq!(exit["signal"], "SIGTERM");
}

#[test]
fn a_ceiling_from_another_boot_means_the_attempt_is_already_over() {
    let Some(driver) = bwrap_driver("ceiling-other-boot") else { return };
    let marker = std::env::temp_dir().join(format!("fgos-gate-otherboot-marker-{}", std::process::id()));
    let _ = fs::remove_file(&marker);
    let mut options = Options::new("/bin/sh", &["-c", &format!("echo ran > {}", marker.display())]);
    options.ceiling = Some(("00000000-0000-0000-0000-000000000000".into(), boottime_ns() + 3_600_000_000_000));
    let attempt = Attempt::new("other-boot", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    send_go(&mut gate, &attempt.attempt_id, &attempt.digest);
    assert_eq!(wait_exit(&mut gate.spawned, Duration::from_secs(10)), 0);
    assert!(!marker.exists(), "no agent starts past its ceiling");
    let exit = attempt.gate_exit().unwrap();
    assert_eq!(exit["stoppedBy"], "hard-ceiling");
}
