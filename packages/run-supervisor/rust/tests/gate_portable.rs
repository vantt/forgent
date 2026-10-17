//! The gate on every OS the supervisor supports, through a real gate process
//! and a real agent: no namespace, no bwrap. Windows runs the gate inside the
//! attempt's job (the driver's `spawn_in`); Linux and macOS run it as a plain
//! process, the way a host without a usable pid namespace does.

mod portable;

use std::fs;
use std::time::{Duration, Instant};

use fgos_run_supervisor::gate::boottime_ns;
use fgos_run_supervisor::publish::{publish_once, Published};
use portable::*;

fn marker(name: &str) -> std::path::PathBuf {
    let path = std::env::temp_dir().join(format!("fgos-gate-portable-marker-{name}-{}", std::process::id()));
    let _ = fs::remove_file(&path);
    path
}

#[test]
fn the_agent_starts_only_after_go_and_its_output_lands_in_the_capture_files() {
    let ran = marker("go");
    let options = Options::new(&["say", &ran.to_string_lossy()]);
    let attempt = Attempt::new("go", &options);
    let mut gate = start_gate(&attempt);
    let hello = read_hello(&mut gate);
    assert_eq!(hello["attemptId"], attempt.attempt_id.as_str());
    std::thread::sleep(Duration::from_millis(500));
    assert!(!ran.exists(), "the agent must not start before GO");
    send_go(&mut gate, &attempt.attempt_id, &attempt.digest);
    let agent = fgos_run_supervisor::go_channel::read_frame(&mut gate.go).expect("AGENT");
    assert_eq!(agent["type"], "AGENT");
    assert!(agent["tuple"]["pid"].as_u64().is_some(), "the AGENT frame names the agent: {agent}");
    wait_for(&ran, Duration::from_secs(10));
    assert_eq!(wait_exit(&mut gate, &attempt, Duration::from_secs(15)), 0, "{}", attempt.gate_log());
    let exit = attempt.gate_exit().expect("gate-exit.json");
    assert_eq!(exit["stoppedBy"], "agent");
    assert_eq!(exit["exitCode"], 0);
    assert!(fs::read_to_string(&attempt.stdout).unwrap().contains("agent says hello"));
    assert!(fs::read_to_string(&attempt.stderr).unwrap().contains("agent says hello on stderr"));
}

#[test]
fn gate_exit_is_published_once() {
    let ran = marker("once");
    let options = Options::new(&["say", &ran.to_string_lossy()]);
    let attempt = Attempt::new("once", &options);
    let mut gate = start_gate(&attempt);
    start_agent(&mut gate, &attempt);
    assert_eq!(wait_exit(&mut gate, &attempt, Duration::from_secs(15)), 0);
    let first = fs::read_to_string(attempt.dir.join("gate-exit.json")).unwrap();
    assert_eq!(publish_once(&attempt.dir, "gate-exit.json", b"{\"second\":true}").unwrap(), Published::AlreadyPublished);
    assert_eq!(fs::read_to_string(attempt.dir.join("gate-exit.json")).unwrap(), first);
}

#[test]
fn a_go_for_another_digest_ends_the_gate_with_65_and_no_agent() {
    let ran = marker("digest");
    let options = Options::new(&["say", &ran.to_string_lossy()]);
    let attempt = Attempt::new("digest", &options);
    let mut gate = start_gate(&attempt);
    read_hello(&mut gate);
    send_go(&mut gate, &attempt.attempt_id, "sha256:0000");
    assert_eq!(wait_exit(&mut gate, &attempt, Duration::from_secs(15)), 65);
    std::thread::sleep(Duration::from_millis(300));
    assert!(!ran.exists(), "no agent after a mismatched GO");
    assert!(attempt.gate_exit().is_none());
}

#[test]
fn eof_before_go_ends_the_gate_with_64_and_no_agent() {
    let ran = marker("eof");
    let options = Options::new(&["say", &ran.to_string_lossy()]);
    let attempt = Attempt::new("eof", &options);
    let mut gate = start_gate(&attempt);
    read_hello(&mut gate);
    let Gate { mut child, go, .. } = gate;
    drop(go);
    let start = Instant::now();
    let code = loop {
        if let Some(status) = child.try_wait().unwrap() {
            break status.code().unwrap_or(-1);
        }
        assert!(start.elapsed() < Duration::from_secs(15), "gate did not exit; {}", attempt.gate_log());
        std::thread::sleep(Duration::from_millis(10));
    };
    assert_eq!(code, 64);
    assert!(!ran.exists());
}

#[test]
fn a_stop_request_ends_the_agent_and_its_child_inside_the_grace() {
    let (ran, pids) = (marker("stop"), marker("stop-pids"));
    let mut options = Options::new(&["tree", &ran.to_string_lossy(), &pids.to_string_lossy()]);
    options.grace_ms = 3_000;
    let attempt = Attempt::new("stop", &options);
    let mut gate = start_gate(&attempt);
    let agent = start_agent(&mut gate, &attempt);
    wait_for(&ran, Duration::from_secs(10));
    let child = pid_in(&pids);
    let agent_pid = agent["tuple"]["pid"].as_u64().unwrap() as u32;
    let started = Instant::now();
    request_stop(&gate, &attempt, "soft-deadline");
    assert_eq!(wait_exit(&mut gate, &attempt, Duration::from_secs(20)), 0);
    assert!(started.elapsed() < Duration::from_millis(3_000 + 5_000), "the agent ends inside the grace: {:?}", started.elapsed());
    let exit = attempt.gate_exit().unwrap();
    assert_eq!(exit["stoppedBy"], "soft-deadline");
    assert_eq!(exit["cause"], "soft-deadline");
    assert!(wait_dead(agent_pid, Duration::from_secs(5)), "agent {agent_pid} survived the gate");
    assert!(wait_dead(child, Duration::from_secs(5)), "the agent's child {child} survived the gate");
}

#[test]
fn an_agent_that_ignores_the_stop_is_killed_after_the_grace() {
    let ran = marker("grace");
    let mut options = Options::new(&["stubborn", &ran.to_string_lossy()]);
    options.grace_ms = 1_500;
    let attempt = Attempt::new("grace", &options);
    let mut gate = start_gate(&attempt);
    let agent = start_agent(&mut gate, &attempt);
    wait_for(&ran, Duration::from_secs(10));
    let started = Instant::now();
    request_stop(&gate, &attempt, "cancel");
    assert_eq!(wait_exit(&mut gate, &attempt, Duration::from_secs(20)), 0);
    let took = started.elapsed();
    assert!(took >= Duration::from_millis(1_400), "the kill waited for the grace: {took:?}");
    assert!(took < Duration::from_secs(8), "and not much longer: {took:?}");
    let exit = attempt.gate_exit().unwrap();
    assert_eq!(exit["stoppedBy"], "cancel");
    #[cfg(unix)]
    assert_eq!(exit["signal"], "SIGKILL");
    assert!(wait_dead(agent["tuple"]["pid"].as_u64().unwrap() as u32, Duration::from_secs(5)));
}

#[test]
fn the_hard_ceiling_is_enforced_with_no_supervisor_left() {
    let ran = marker("ceiling");
    let mut options = Options::new(&["stubborn", &ran.to_string_lossy()]);
    options.grace_ms = 500;
    options.ceiling = Some((boot_id(), boottime_ns() + 6_000_000_000));
    let started = Instant::now();
    let attempt = Attempt::new("ceiling", &options);
    let mut gate = start_gate(&attempt);
    let agent = start_agent(&mut gate, &attempt);
    wait_for(&ran, Duration::from_secs(10));
    let Gate { mut child, go, .. } = gate;
    drop(go);
    // The supervisor is gone: the gate and the agent carry on until the ceiling.
    std::thread::sleep(Duration::from_millis(600));
    assert!(child.try_wait().unwrap().is_none(), "the gate outlives its supervisor in direct mode");
    let begun = Instant::now();
    let code = loop {
        if let Some(status) = child.try_wait().unwrap() {
            break status.code().unwrap_or(-1);
        }
        assert!(begun.elapsed() < Duration::from_secs(20), "the ceiling never fired; {}", attempt.gate_log());
        std::thread::sleep(Duration::from_millis(10));
    };
    assert_eq!(code, 0);
    let took = started.elapsed();
    assert!(took >= Duration::from_millis(5_500), "the ceiling is absolute: {took:?}");
    let exit = attempt.gate_exit().unwrap();
    assert_eq!(exit["stoppedBy"], "hard-ceiling");
    assert_eq!(exit["cause"], "hard-ceiling");
    assert!(wait_dead(agent["tuple"]["pid"].as_u64().unwrap() as u32, Duration::from_secs(5)));
}

#[test]
fn a_child_the_agent_leaves_behind_dies_with_the_gate() {
    let (ran, pids) = (marker("orphan"), marker("orphan-pids"));
    let options = Options::new(&["orphan", &ran.to_string_lossy(), &pids.to_string_lossy()]);
    let attempt = Attempt::new("orphan", &options);
    let mut gate = start_gate(&attempt);
    start_agent(&mut gate, &attempt);
    assert_eq!(wait_exit(&mut gate, &attempt, Duration::from_secs(20)), 0, "{}", attempt.gate_log());
    let child = pid_in(&pids);
    assert!(wait_dead(child, Duration::from_secs(10)), "the child {child} outlived the gate");
    assert_eq!(attempt.gate_exit().unwrap()["stoppedBy"], "agent");
}

/// A descendant that left the agent's session is still the gate's: on Linux the
/// gate adopts it. macOS has no subreaper, so this escape is the named limit of
/// that driver and has no test.
#[cfg(target_os = "linux")]
#[test]
fn a_child_in_its_own_session_dies_with_the_gate() {
    let (ran, pids) = (marker("setsid"), marker("setsid-pids"));
    let options = Options::new(&["orphan-setsid", &ran.to_string_lossy(), &pids.to_string_lossy()]);
    let attempt = Attempt::new("setsid", &options);
    let mut gate = start_gate(&attempt);
    start_agent(&mut gate, &attempt);
    assert_eq!(wait_exit(&mut gate, &attempt, Duration::from_secs(20)), 0, "{}", attempt.gate_log());
    let child = pid_in(&pids);
    assert!(wait_dead(child, Duration::from_secs(10)), "the child {child} outlived the gate");
}
