//! Signalling by identity and the `linux-gate` domain against real children.
#![cfg(target_os = "linux")]

use std::fs;
use std::os::unix::fs::MetadataExt;
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use fgos_process::control::{signal_by_identity, Signal, SignalOutcome};
use fgos_process::facts::{self, Observed, ProcTuple};
use fgos_process::{domain_is_empty, domain_kill_all, Domain, DomainState, KillOutcome, ProcId};

fn sleeper() -> Child {
    Command::new("sleep").arg("300").stdin(Stdio::null()).stdout(Stdio::null()).spawn().expect("spawn sleep")
}

fn identity(pid: u32) -> ProcTuple {
    facts::identity_of(ProcId(pid)).expect("live process has an identity")
}

/// The identity of `pid` straight from its stat line, which a zombie still
/// has; `identity_of` answers `None` for a zombie on purpose.
fn identity_from_stat(pid: u32) -> ProcTuple {
    let stat = fs::read_to_string(format!("/proc/{pid}/stat")).expect("stat line");
    let (_, start_time) = facts::parse_proc_stat(&stat).expect("stat parses");
    ProcTuple { host: facts::host(), boot_id: facts::boot_id(), pid_ns: facts::pid_ns().id, pid: ProcId(pid), start_time }
}

/// A pid that belonged to a child this test already reaped.
fn reaped_pid() -> u32 {
    let mut child = Command::new("true").stdin(Stdio::null()).stdout(Stdio::null()).spawn().expect("spawn true");
    child.wait().unwrap();
    child.id()
}

fn wait_until(what: &str, mut done: impl FnMut() -> bool) {
    let deadline = Instant::now() + Duration::from_secs(10);
    while !done() {
        assert!(Instant::now() < deadline, "timed out waiting for {what}");
        std::thread::sleep(Duration::from_millis(10));
    }
}

#[test]
fn a_wrong_start_time_is_refused_and_nothing_is_sent() {
    let mut child = sleeper();
    let mut wrong = identity(child.id());
    wrong.start_time = "1".to_string();
    assert_eq!(signal_by_identity(&wrong, Signal::Term), SignalOutcome::IdentityMismatch);
    std::thread::sleep(Duration::from_millis(50));
    assert_eq!(child.try_wait().unwrap(), None, "the child is still running");

    let right = identity(child.id());
    assert_eq!(signal_by_identity(&right, Signal::Term), SignalOutcome::Sent);
    let status = child.wait().unwrap();
    assert!(!status.success(), "the child ended by signal: {status}");
}

#[test]
fn a_reaped_pid_is_not_found_and_an_impossible_pid_is_not_found() {
    let mut tuple = identity(std::process::id());
    tuple.pid = ProcId(reaped_pid());
    let outcome = signal_by_identity(&tuple, Signal::Term);
    // The pid can in principle be reused the instant it is reaped; then the
    // start time differs and the answer is a mismatch, still nothing sent.
    assert!(matches!(outcome, SignalOutcome::NotFound | SignalOutcome::IdentityMismatch), "{outcome:?}");
    tuple.pid = ProcId(u32::MAX);
    assert_eq!(signal_by_identity(&tuple, Signal::Term), SignalOutcome::NotFound);
}

#[test]
fn the_gate_domain_is_not_empty_while_the_gate_lives_and_empty_once_it_is_reaped() {
    let mut child = sleeper();
    let domain = Domain::LinuxGate(identity(child.id()));
    assert_eq!(domain_is_empty(&domain), DomainState::NotEmpty);
    child.kill().unwrap();
    child.wait().unwrap();
    assert_eq!(domain_is_empty(&domain), DomainState::Empty);
}

#[test]
fn a_zombie_gate_counts_as_an_empty_domain() {
    let mut child = Command::new("true").stdin(Stdio::null()).stdout(Stdio::null()).spawn().expect("spawn true");
    let pid = child.id();
    // Not reaped: the child becomes a zombie and stays one until wait().
    wait_until("the child to become a zombie", || {
        fs::read_to_string(format!("/proc/{pid}/stat")).map(|s| facts::parse_proc_stat(&s).map(|(state, _)| state) == Some('Z')).unwrap_or(false)
    });
    let gate = identity_from_stat(pid);
    assert_eq!(facts::observe(ProcId(pid)), Observed::Zombie);
    assert_eq!(domain_is_empty(&Domain::LinuxGate(gate.clone())), DomainState::Empty);
    // A zombie is refused as a signal target too: it is not the recorded live process.
    assert_eq!(signal_by_identity(&gate, Signal::Term), SignalOutcome::IdentityMismatch);
    child.wait().unwrap();
}

#[test]
fn kill_all_ends_a_live_gate_and_is_ok_for_a_gate_already_gone() {
    let mut child = sleeper();
    let domain = Domain::LinuxGate(identity(child.id()));
    assert_eq!(domain_kill_all(&domain), KillOutcome::Ok);
    let status = child.wait().unwrap();
    assert!(!status.success(), "the gate ended by SIGKILL: {status}");
    assert_eq!(domain_is_empty(&domain), DomainState::Empty);
    assert_eq!(domain_kill_all(&domain), KillOutcome::Ok, "a gate that is already gone needs no kill");
}

#[test]
fn kill_all_on_init_is_refused_for_an_unprivileged_user() {
    // SAFETY: geteuid reads the effective uid.
    let euid = unsafe { libc::geteuid() };
    let init_uid = fs::metadata("/proc/1").map(|m| m.uid()).ok();
    if euid == 0 || init_uid == Some(euid) {
        // As root, or inside a sandbox whose init is our own user, the kill
        // would go through; the refusal under test needs a foreign init.
        eprintln!("skipped: pid 1 is signallable from here (euid {euid}, init uid {init_uid:?})");
        return;
    }
    let Some(init) = facts::identity_of(ProcId(1)) else {
        eprintln!("skipped: pid 1 is not readable from here");
        return;
    };
    assert_eq!(signal_by_identity(&init, Signal::Kill), SignalOutcome::Denied);
    assert_eq!(domain_kill_all(&Domain::LinuxGate(init)), KillOutcome::Refused);
}

#[test]
fn other_domain_kinds_have_no_driver_yet() {
    let me = identity(std::process::id());
    let job = Domain::WindowsJob(fgos_process::WindowsJob { job: "job".into(), session_id: 0, declared_at: 0, holder: me.clone(), keeper: None });
    assert_eq!(domain_is_empty(&job), DomainState::Unknown);
    assert_eq!(domain_kill_all(&job), KillOutcome::Refused);
    assert_eq!(domain_is_empty(&Domain::MacosTree(me.clone())), DomainState::Unknown);
    assert_eq!(domain_kill_all(&Domain::MacosTree(me)), KillOutcome::Refused);
}
