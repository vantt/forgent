//! The port against real processes: exclusion between descriptions,
//! release on SIGKILL, timeouts, probe semantics, and the predecessor-domain
//! rule with a real SIGTERM-ignoring gate.
#![cfg(unix)]

mod common;

use std::fs;
use std::time::{Duration, Instant};

use common::*;
use fgos_holder_lock::predecessor::{declare, record_path};
use fgos_holder_lock::{acquire, probe, release, Acquire, HeldReason, Mode, Probe, Wait};
use fgos_process::facts::{identity_of, observe, Observed};
use fgos_process::{Domain, ProcId};

#[test]
fn child_entry() {
    common::child_entry()
}

fn acquired(a: Acquire) -> fgos_holder_lock::Handle {
    match a {
        Acquire::Acquired(h) => h,
        other => panic!("expected acquired, got {other:?}"),
    }
}

#[test]
fn two_descriptions_in_one_process_exclude_each_other() {
    let _serial = serial();
    let dir = temp_dir("two-desc");
    let res = resource(&dir, "two");
    let first = acquired(acquire(&res, Mode::Ex, Wait::Try, 2000));
    match acquire(&res, Mode::Ex, Wait::Try, 2000) {
        Acquire::Held { reason: HeldReason::KernelLockHeld, domain: None } => {}
        other => panic!("second description must be held out: {other:?}"),
    }
    release(first);
    let second = acquired(acquire(&res, Mode::Ex, Wait::Try, 2000));
    release(second);
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn a_sigkilled_holder_frees_the_lock_at_once() {
    let _serial = serial();
    let dir = temp_dir("sigkill");
    let res = resource(&dir, "k");
    let ready = dir.join("ready");
    let mut holder = spawn_role("holder", &res.path, &ready, "");
    wait_ready(&ready, &mut holder);
    assert_eq!(probe(&res).unwrap(), Probe::Held);
    assert!(matches!(acquire(&res, Mode::Ex, Wait::Try, 2000), Acquire::Held { reason: HeldReason::KernelLockHeld, .. }));
    kill_and_reap(&mut holder);
    assert_eq!(probe(&res).unwrap(), Probe::Free);
    release(acquired(acquire(&res, Mode::Ex, Wait::Try, 2000)));
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn wait_ms_times_out_and_nothing_is_kept() {
    let _serial = serial();
    let dir = temp_dir("timeout");
    let res = resource(&dir, "t");
    let ready = dir.join("ready");
    let mut holder = spawn_role("holder", &res.path, &ready, "");
    wait_ready(&ready, &mut holder);
    let started = Instant::now();
    match acquire(&res, Mode::Ex, Wait::Ms(300), 2000) {
        Acquire::Timeout { waited_ms } => assert!((300..800).contains(&waited_ms), "waited {waited_ms} ms"),
        other => panic!("expected timeout: {other:?}"),
    }
    let elapsed = started.elapsed();
    assert!(elapsed >= Duration::from_millis(300) && elapsed < Duration::from_millis(800), "{elapsed:?}");
    kill_and_reap(&mut holder);
    assert_eq!(probe(&res).unwrap(), Probe::Free, "the timed-out acquire must not hold anything");
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn probes_are_shared_and_never_obstruct_each_other() {
    let _serial = serial();
    let dir = temp_dir("probe");
    let res = resource(&dir, "p");
    // A probe in progress is a shared lock on its own description; another
    // probe still answers free.
    fs::write(&res.path, b"").unwrap();
    let in_progress = fs::OpenOptions::new().read(true).write(true).open(&res.path).unwrap();
    assert!(matches!(fgos_holder_lock::port::lock_description(&in_progress, Mode::Sh, Wait::Try).unwrap(), fgos_holder_lock::port::DescriptionLock::Locked));
    assert_eq!(probe(&res).unwrap(), Probe::Free);
    drop(in_progress);
    // An exclusive holder in another process: held.
    let ready = dir.join("ready");
    let mut holder = spawn_role("holder", &res.path, &ready, "");
    wait_ready(&ready, &mut holder);
    assert_eq!(probe(&res).unwrap(), Probe::Held);
    kill_and_reap(&mut holder);
    // A lock file that does not exist yet is free.
    assert_eq!(probe(&resource(&dir, "absent")).unwrap(), Probe::Free);
    let _ = fs::remove_dir_all(&dir);
}

#[cfg(target_os = "linux")]
fn gone(pid: u32) -> bool {
    matches!(observe(ProcId(pid)), Observed::Absent | Observed::Zombie)
}

/// predecessor-check: the holder dies with its declared gate alive; the next
/// acquirer gets the lock only after it killed the gate, never waiting for
/// it to drain.
#[cfg(target_os = "linux")]
#[test]
fn predecessor_gate_is_killed_before_the_next_holder_proceeds() {
    let _serial = serial();
    let dir = temp_dir("predecessor");
    let res = resource(&dir, "pred");
    let mut extra = Vec::new();
    for round in 0..50 {
        let ready = dir.join(format!("ready-{round}"));
        let mut holder = spawn_role("gate-holder", &res.path, &ready, "");
        let gate: u32 = wait_ready(&ready, &mut holder).parse().unwrap();
        assert!(!gone(gate), "gate must be running before the holder dies");
        kill_and_reap(&mut holder);
        let started = Instant::now();
        let handle = acquired(acquire(&res, Mode::Ex, Wait::Ms(5000), 2000));
        let took = started.elapsed();
        assert!(gone(gate), "round {round}: acquired while the gate {gate} was still alive");
        assert!(!record_path(&res.path).exists(), "an emptied domain's record is removed");
        extra.push(took.as_secs_f64() * 1000.0);
        release(handle);
    }
    extra.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let (p50, p95) = (percentile(&extra, 0.5), percentile(&extra, 0.95));
    println!("predecessor-check: 50 rounds, 0 violations, acquire after holder death p50 {p50:.2} ms p95 {p95:.2} ms");
    assert!(p95 < 500.0, "killing at once must cost milliseconds, not a drain wait: p95 {p95} ms");
    let _ = fs::remove_dir_all(&dir);
}

/// predecessor-record-stale: the recorded gate is already dead; acquire
/// proceeds at once and removes the record.
#[cfg(target_os = "linux")]
#[test]
fn a_stale_predecessor_record_lets_the_next_holder_through_at_once() {
    let _serial = serial();
    let dir = temp_dir("stale");
    let res = resource(&dir, "stale");
    let mut sleeper = spawn_term_ignoring_sleep();
    let tuple = loop {
        if let Some(t) = identity_of(ProcId(sleeper.id())) {
            break t;
        }
    };
    kill_and_reap(&mut sleeper);
    let mut extra = Vec::new();
    for _ in 0..20 {
        declare(&record_path(&res.path), &Domain::LinuxGate(tuple.clone())).unwrap();
        let started = Instant::now();
        let handle = acquired(acquire(&res, Mode::Ex, Wait::Try, 2000));
        extra.push(started.elapsed().as_secs_f64() * 1000.0);
        assert!(!record_path(&res.path).exists());
        release(handle);
    }
    let mut plain = Vec::new();
    for _ in 0..20 {
        let started = Instant::now();
        release(acquired(acquire(&res, Mode::Ex, Wait::Try, 2000)));
        plain.push(started.elapsed().as_secs_f64() * 1000.0);
    }
    extra.sort_by(|a, b| a.partial_cmp(b).unwrap());
    plain.sort_by(|a, b| a.partial_cmp(b).unwrap());
    println!(
        "predecessor-record-stale: acquire p50 {:.3} ms p95 {:.3} ms; no record: p50 {:.3} ms p95 {:.3} ms",
        percentile(&extra, 0.5),
        percentile(&extra, 0.95),
        percentile(&plain, 0.5),
        percentile(&plain, 0.95)
    );
    assert!(percentile(&extra, 0.95) < 50.0);
    let _ = fs::remove_dir_all(&dir);
}

/// predecessor-kill-wait-timeout: a domain that cannot be killed (pid 1, not
/// ours) ends in held (predecessor-domain-not-empty) within the kill wait,
/// with the description closed and the lock free.
#[cfg(target_os = "linux")]
#[test]
fn an_unkillable_predecessor_domain_is_held_within_the_kill_wait() {
    let _serial = serial();
    if unsafe { libc::geteuid() } == 0 {
        eprintln!("skipped: running as root can signal pid 1");
        return;
    }
    let dir = temp_dir("unkillable");
    let res = resource(&dir, "init");
    let init = identity_of(ProcId(1)).expect("pid 1 identity readable");
    declare(&record_path(&res.path), &Domain::LinuxGate(init)).unwrap();
    let started = Instant::now();
    match acquire(&res, Mode::Ex, Wait::Try, 200) {
        Acquire::Held { reason: HeldReason::PredecessorDomainNotEmpty, domain: Some(domain) } => {
            assert_eq!(domain["domainKind"], "linux-gate");
            assert_eq!(domain["domainId"]["pid"], 1);
        }
        other => panic!("expected held predecessor-domain-not-empty: {other:?}"),
    }
    let took = started.elapsed();
    // A refused kill answers at once; the bound only allows for a loaded host.
    assert!(took < Duration::from_millis(1200), "held after {took:?}, kill wait was 200 ms");
    assert_eq!(probe(&res).unwrap(), Probe::Free, "the description was closed");
    assert!(record_path(&res.path).exists(), "a record that could not be emptied is kept");
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn an_unknown_record_is_never_ignored() {
    let _serial = serial();
    let dir = temp_dir("unknown-record");
    let res = resource(&dir, "u");
    fs::write(record_path(&res.path), r#"{"v":2,"domainKind":"future","domainId":"x"}"#).unwrap();
    match acquire(&res, Mode::Ex, Wait::Try, 50) {
        Acquire::Held { reason: HeldReason::PredecessorDomainNotEmpty, domain: Some(domain) } => assert_eq!(domain["v"], 2),
        other => panic!("expected held: {other:?}"),
    }
    assert!(record_path(&res.path).exists());
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn only_an_exclusive_holder_declares_a_domain() {
    let _serial = serial();
    let dir = temp_dir("declare-sh");
    let res = resource(&dir, "sh");
    let shared = acquired(acquire(&res, Mode::Sh, Wait::Try, 2000));
    let me = identity_of(ProcId(std::process::id())).unwrap();
    assert!(shared.declare_domain(&Domain::LinuxGate(me)).is_err());
    assert!(!record_path(&res.path).exists());
    release(shared);
    let _ = fs::remove_dir_all(&dir);
}
