//! The gate as pid 1 of a real bwrap namespace: IO ownership, signals, reaping,
//! the end of the domain, and the description rule.
#![cfg(target_os = "linux")]

mod support;

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::os::unix::fs::{MetadataExt, PermissionsExt};
use std::thread::sleep;
use std::time::{Duration, Instant};

use fgos_process::control::{signal_by_identity, Signal};
use fgos_run_supervisor::publish::{publish_once, Published};
use support::*;

fn noisy(extra: &[&str]) -> Options {
    let mut args = vec![fixture("noisy-agent.mjs")];
    args.extend(extra.iter().map(|a| a.to_string()));
    Options { command: node(), args, stdin_brief: None, ceiling: None, grace_ms: 10_000, side_env: BTreeMap::new() }
}

fn nspid(host_pid: u32) -> Vec<u32> {
    let status = fs::read_to_string(format!("/proc/{host_pid}/status")).unwrap();
    let line = status.lines().find(|l| l.starts_with("NSpid:")).unwrap();
    line.split_whitespace().skip(1).map(|n| n.parse().unwrap()).collect()
}

#[test]
fn the_gate_is_pid_1_runs_the_agent_and_publishes_gate_exit_once() {
    let Some(driver) = bwrap_driver("pid-1-lifecycle") else { return };
    let attempt_marker = std::env::temp_dir().join(format!("fgos-gate-lifecycle-marker-{}", std::process::id()));
    let outbox = attempt_dir("lifecycle").join("outbox");
    let options = noisy(&["--outbox", &outbox.to_string_lossy(), "--marker", &attempt_marker.to_string_lossy(), "--run-ms", "800"]);
    let attempt = Attempt::new("lifecycle", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    assert_eq!(nspid(gate.spawned.root.pid.0).last(), Some(&1), "the gate must be pid 1 of its namespace");
    start_agent(&mut gate, &attempt);
    assert_eq!(wait_exit(&mut gate.spawned, Duration::from_secs(20)), 0);

    let exit = attempt.gate_exit().expect("gate-exit.json");
    assert_eq!(exit["v"], 1);
    assert_eq!(exit["attemptId"], attempt.attempt_id.as_str());
    assert_eq!(exit["exitCode"], 0);
    assert!(exit["signal"].is_null());
    assert_eq!(exit["stoppedBy"], "agent");
    assert!(exit["cause"].is_null());
    assert!(exit["exitedAt"].as_str().unwrap().ends_with('Z'));
    assert!(attempt.outbox.join("result-1.json").exists(), "the agent's outbox result");

    let captured = fs::read_to_string(&attempt.stdout).unwrap();
    assert!(captured.contains("tick"), "stdout is captured by the gate: {captured:?}");
    assert_eq!(fs::metadata(&attempt.stdout).unwrap().permissions().mode() & 0o777, 0o600);

    // A second writer never replaces the first gate-exit.
    let before = fs::read(attempt.dir.join("gate-exit.json")).unwrap();
    assert_eq!(publish_once(&attempt.dir, "gate-exit.json", b"{\"v\":1,\"other\":true}").unwrap(), Published::AlreadyPublished);
    assert_eq!(fs::read(attempt.dir.join("gate-exit.json")).unwrap(), before);
    let leftovers: Vec<_> = fs::read_dir(&attempt.dir).unwrap().flatten().filter(|e| e.file_name().to_string_lossy().contains(".tmp.")).collect();
    assert!(leftovers.is_empty(), "temp files of the publish are removed");
}

#[test]
fn the_agent_environment_is_the_envelope_plus_the_side_file_plus_the_anchor() {
    let Some(driver) = bwrap_driver("agent-env") else { return };
    let env_file = std::env::temp_dir().join(format!("fgos-gate-env-{}", std::process::id()));
    let _ = fs::remove_file(&env_file);
    let mut options = Options::new("/bin/sh", &["-c", &format!("env > {}", env_file.display())]);
    options.side_env.insert("FGOS_TEST_SECRET".into(), "hunter2".into());
    let attempt = Attempt::new("env", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    start_agent(&mut gate, &attempt);
    assert_eq!(wait_exit(&mut gate.spawned, Duration::from_secs(10)), 0);

    let env: BTreeMap<String, String> = fs::read_to_string(&env_file).unwrap().lines().filter_map(|l| l.split_once('=')).map(|(k, v)| (k.to_string(), v.to_string())).collect();
    assert_eq!(env["PATH"], "/usr/local/bin:/usr/bin:/bin", "the envelope's PATH, not the gate's");
    assert_eq!(env["FGOS_TEST_SECRET"], "hunter2");
    let anchor: serde_json::Value = serde_json::from_str(&env["FGOS_PIDNS_ANCHOR"]).unwrap();
    assert_eq!(anchor["pid"], gate.spawned.root.pid.0);
    assert_eq!(anchor["startTime"], gate.spawned.root.start_time.as_str());
}

#[test]
fn stdin_comes_from_the_brief_file() {
    let Some(driver) = bwrap_driver("brief-stdin") else { return };
    let brief = std::env::temp_dir().join(format!("fgos-gate-brief-{}", std::process::id()));
    fs::write(&brief, "write the report\n").unwrap();
    let mut options = Options::new("/bin/cat", &[]);
    options.stdin_brief = Some(brief.to_string_lossy().into_owned());
    let attempt = Attempt::new("brief", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    start_agent(&mut gate, &attempt);
    assert_eq!(wait_exit(&mut gate.spawned, Duration::from_secs(10)), 0);
    assert_eq!(fs::read_to_string(&attempt.stdout).unwrap(), "write the report\n");
}

fn long_agent(name: &str) -> (Options, std::path::PathBuf, std::path::PathBuf) {
    let marker = std::env::temp_dir().join(format!("fgos-gate-{name}-marker-{}", std::process::id()));
    let pidfile = std::env::temp_dir().join(format!("fgos-gate-{name}-grandchild-{}", std::process::id()));
    let _ = (fs::remove_file(&marker), fs::remove_file(&pidfile));
    (noisy(&["--outbox", "/nonexistent", "--marker", &marker.to_string_lossy(), "--run-ms", "120000", "--grandchild-pidfile", &pidfile.to_string_lossy()]), marker, pidfile)
}

#[test]
fn sigterm_to_the_gate_stops_the_agent_and_names_the_requested_cause() {
    let Some(driver) = bwrap_driver("sigterm-cause") else { return };
    let (options, marker, _) = long_agent("cause");
    let attempt = Attempt::new("cause", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    start_agent(&mut gate, &attempt);
    wait_for(&marker, Duration::from_secs(10));
    attempt.stop_requested("idle");
    let started = Instant::now();
    signal_by_identity(&gate.spawned.root, Signal::Term);
    assert_eq!(wait_exit(&mut gate.spawned, Duration::from_secs(10)), 0);
    assert!(started.elapsed() < Duration::from_secs(5), "the agent stops within the grace");
    let exit = attempt.gate_exit().unwrap();
    assert_eq!(exit["stoppedBy"], "idle");
    assert_eq!(exit["cause"], "idle");
    assert_eq!(exit["signal"], "SIGTERM");
    assert!(exit["exitCode"].is_null());
}

#[test]
fn sigterm_without_a_stop_file_is_a_cancel_by_signal() {
    let Some(driver) = bwrap_driver("sigterm-no-file") else { return };
    let (options, marker, _) = long_agent("nofile");
    let attempt = Attempt::new("nofile", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    start_agent(&mut gate, &attempt);
    wait_for(&marker, Duration::from_secs(10));
    signal_by_identity(&gate.spawned.root, Signal::Term);
    assert_eq!(wait_exit(&mut gate.spawned, Duration::from_secs(10)), 0);
    let exit = attempt.gate_exit().unwrap();
    assert_eq!(exit["stoppedBy"], "cancel");
    assert_eq!(exit["cause"], "signal");
}

#[test]
fn killing_the_gate_kills_a_setsid_grandchild() {
    let Some(driver) = bwrap_driver("setsid-grandchild") else { return };
    let (options, marker, pidfile) = long_agent("setsid");
    let attempt = Attempt::new("setsid", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    start_agent(&mut gate, &attempt);
    wait_for(&marker, Duration::from_secs(10));
    wait_for(&pidfile, Duration::from_secs(10));
    sleep(Duration::from_millis(300));
    let members: Vec<u32> = namespace_members(&gate.spawned.root).into_iter().map(|(pid, _)| pid).filter(|pid| *pid != gate.spawned.root.pid.0).collect();
    assert!(members.len() >= 2, "agent and setsid grandchild are in the namespace: {members:?}");
    signal_by_identity(&gate.spawned.root, Signal::Kill);
    wait_exit(&mut gate.spawned, Duration::from_secs(10));
    let start = Instant::now();
    while members.iter().any(|pid| alive(*pid)) {
        assert!(start.elapsed() < Duration::from_secs(5), "a member of the namespace survived the gate: {members:?}");
        sleep(Duration::from_millis(20));
    }
}

#[test]
fn a_long_attempt_with_many_orphans_accumulates_no_zombies() {
    let Some(driver) = bwrap_driver("no-zombies") else { return };
    let marker = std::env::temp_dir().join(format!("fgos-gate-zombie-marker-{}", std::process::id()));
    let _ = fs::remove_file(&marker);
    let options = noisy(&["--outbox", "/nonexistent", "--marker", &marker.to_string_lossy(), "--run-ms", "60000", "--orphans", "200", "--orphan-life", "2"]);
    let attempt = Attempt::new("zombies", &options);
    let mut gate = start_gate(&*driver, &attempt, None);
    start_agent(&mut gate, &attempt);

    let mut ever_seen: BTreeSet<u32> = BTreeSet::new();
    let mut zombie_since: BTreeMap<u32, Instant> = BTreeMap::new();
    let begin = Instant::now();
    while begin.elapsed() < Duration::from_secs(57) {
        let members = namespace_members(&gate.spawned.root);
        let now = Instant::now();
        let zombies: BTreeSet<u32> = members.iter().filter(|(_, state)| *state == 'Z').map(|(pid, _)| *pid).collect();
        zombie_since.retain(|pid, _| zombies.contains(pid));
        for pid in &zombies {
            let since = *zombie_since.entry(*pid).or_insert(now);
            // A zombie is in transit for a moment after it exits; a gate that
            // does not reap leaves it there.
            assert!(now.duration_since(since) < Duration::from_millis(600), "zombie {pid} was never reaped");
        }
        ever_seen.extend(members.iter().map(|(pid, _)| *pid));
        sleep(Duration::from_millis(150));
    }
    assert!(ever_seen.len() > 150, "the orphans were created: only {} processes seen", ever_seen.len());
    signal_by_identity(&gate.spawned.root, Signal::Term);
    wait_exit(&mut gate.spawned, Duration::from_secs(20));
}

#[test]
fn no_process_of_the_attempt_but_the_gate_holds_the_lock() {
    let Some(driver) = bwrap_driver("lock-leak") else { return };
    let lock_path = std::env::temp_dir().join(format!("fgos-gate-lock-{}", std::process::id()));
    let lock = fs::OpenOptions::new().create(true).truncate(true).write(true).read(true).open(&lock_path).unwrap();
    let key = {
        let meta = lock.metadata().unwrap();
        (meta.dev(), meta.ino())
    };
    let (options, marker, pidfile) = long_agent("lock");
    let attempt = Attempt::new("lock", &options);
    let mut gate = start_gate(&*driver, &attempt, Some(&lock));
    start_agent(&mut gate, &attempt);
    wait_for(&marker, Duration::from_secs(10));
    wait_for(&pidfile, Duration::from_secs(10));
    sleep(Duration::from_millis(300));

    let gate_pid = gate.spawned.root.pid.0;
    assert!(holds_file(gate_pid, key), "the gate keeps the lock description until it has reaped everything");
    let others: Vec<u32> = namespace_members(&gate.spawned.root).into_iter().map(|(pid, _)| pid).filter(|pid| *pid != gate_pid).collect();
    assert!(others.len() >= 2, "agent and grandchild are running: {others:?}");
    for pid in others {
        assert!(!holds_file(pid, key), "process {pid} inherited the lock description");
    }
    signal_by_identity(&gate.spawned.root, Signal::Term);
    wait_exit(&mut gate.spawned, Duration::from_secs(10));
}
