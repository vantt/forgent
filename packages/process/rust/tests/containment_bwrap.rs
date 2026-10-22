//! `bwrap-pidns` against real bwrap, real namespaces and real processes.
#![cfg(target_os = "linux")]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread::sleep;
use std::time::Duration;

use fgos_process::containment::{select, BwrapPidns, ContainmentDriver, GuaranteeLevel, SelectEnv, SpawnSpec, StartMode};
use fgos_process::control::{signal_by_identity, Signal};
use fgos_process::facts::{self, ProcTuple};
use fgos_process::{Domain, KillOutcome, ProcId};

mod common;
use common::{scratch, wait_for};
const HELPER_ENV: &str = "FGOS_CONTAINMENT_HELPER_MODE";

fn fixture(name: &str) -> String {
    format!("{}/tests/fixtures/{name}", env!("CARGO_MANIFEST_DIR"))
}

fn lines(path: &Path) -> usize {
    fs::read_to_string(path).map(|text| text.lines().count()).unwrap_or(0)
}

fn bwrap_driver(_test: &str) -> Option<Box<dyn ContainmentDriver>> {
    common::require_bwrap()?;
    let driver = select(&SelectEnv::default()).expect("select");
    (driver.name() == "bwrap-pidns").then_some(driver)
}

fn spec(argv: &[&str], mode: StartMode) -> SpawnSpec {
    let mut s = common::spec(argv);
    s.mode = mode;
    s
}

fn identity(pid: u32) -> ProcTuple {
    facts::identity_of(ProcId(pid)).expect("live process")
}

#[test]
fn containment_gate_is_pid_1_inside_and_its_host_pid_matches_nspid() {
    let Some(driver) = bwrap_driver("pid-1") else { return };
    let dir = scratch("pid1");
    let out = dir.join("inner-pid");
    let script = format!("echo $$ > {}; exec sleep 30", out.display());
    let mut domain = driver.create("attempt-pid1").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, spec(&["sh", "-c", &script], StartMode::Direct)).unwrap();

    assert_eq!(wait_for(&out).trim(), "1", "the gate is pid 1 of its namespace");
    let status = fs::read_to_string(format!("/proc/{}/status", spawned.root.pid.0)).unwrap();
    let nspid: Vec<&str> = status.lines().find(|l| l.starts_with("NSpid:")).unwrap().split_whitespace().skip(1).collect();
    assert_eq!(nspid.first().copied(), Some(spawned.root.pid.0.to_string().as_str()), "first NSpid is the host pid reported by --info-fd");
    assert_eq!(nspid.last().copied(), Some("1"));
    assert!(matches!(domain.domain(), Some(Domain::LinuxGate(tuple)) if *tuple == spawned.root));

    assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    spawned.child.wait().unwrap();
}

/// A cooperative terminal gate: arm the same primitive as the production gate
/// before exec, retaining PID 1 and its death signal across the exec.
#[test]
fn containment_terminal_gate_helper() {
    use std::os::unix::process::CommandExt;
    let Ok(dir) = std::env::var("FGOS_CONTAINMENT_GATE_DIR") else { return };
    fgos_process::control::arm_parent_death_signal().unwrap();
    let err = Command::new("sh").arg(fixture("heartbeat-grandchild.sh"))
        .arg(Path::new(&dir).join("beat")).exec();
    panic!("gate exec: {err}");
}

/// Role of the process the next test kills: it starts the gate and sleeps.
#[test]
fn containment_supervisor_helper() {
    let Ok(mode) = std::env::var(HELPER_ENV) else { return };
    let driver = select(&SelectEnv::default()).unwrap();
    assert_eq!(driver.name(), "bwrap-pidns");
    let dir = PathBuf::from(std::env::var("FGOS_CONTAINMENT_HELPER_DIR").unwrap());
    let mode = if mode == "terminal" { StartMode::Terminal } else { StartMode::Direct };
    let script = fixture("heartbeat-grandchild.sh");
    let mut domain = driver.create("attempt-supervisor").unwrap();
    let mut launch = spec(&["sh", &script, &dir.join("beat").display().to_string()], mode);
    if mode == StartMode::Terminal {
        launch.argv = vec![std::env::current_exe().unwrap().display().to_string(),
            "--exact".into(), "containment_terminal_gate_helper".into(),
            "--nocapture".into(), "--test-threads=1".into()];
        launch.env.insert("FGOS_CONTAINMENT_GATE_DIR".into(), dir.display().to_string());
    }
    let mut spawned = driver.spawn_in(&mut domain, launch).unwrap();
    fs::write(dir.join("gate-pid"), spawned.root.pid.0.to_string()).unwrap();
    let _ = spawned.child.wait();
}

struct GateCleanup(ProcTuple);
impl Drop for GateCleanup {
    fn drop(&mut self) { let _ = signal_by_identity(&self.0, Signal::Kill); }
}

fn run_with_killed_supervisor(mode: &str) -> Option<(PathBuf, GateCleanup)> {
    bwrap_driver(mode)?;
    let dir = scratch(mode);
    let mut helper = Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "containment_supervisor_helper", "--nocapture", "--test-threads=1"])
        .env(HELPER_ENV, mode)
        .env("FGOS_CONTAINMENT_HELPER_DIR", &dir)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();
    let gate = GateCleanup(identity(wait_for(&dir.join("gate-pid")).trim().parse().unwrap()));
    let beat = dir.join("beat");
    wait_for(&beat);
    helper.kill().unwrap();
    helper.wait().unwrap();
    sleep(Duration::from_millis(500));
    Some((beat, gate))
}

#[test]
fn containment_direct_gate_outlives_a_killed_supervisor() {
    let Some((beat, gate)) = run_with_killed_supervisor("direct") else { return };
    let before = lines(&beat);
    sleep(Duration::from_millis(300));
    assert!(lines(&beat) > before, "the namespace keeps running after its supervisor was killed");
    drop(gate);
}

#[test]
fn containment_terminal_gate_dies_with_a_killed_supervisor() {
    let Some((beat, gate)) = run_with_killed_supervisor("terminal") else { return };
    let before = lines(&beat);
    sleep(Duration::from_millis(300));
    assert_eq!(lines(&beat), before, "a terminal attempt dies with its supervisor");
    drop(gate);
}

#[test]
fn containment_direct_refuses_die_with_parent_by_name() {
    let driver = BwrapPidns::new("/usr/bin/bwrap".into());
    let mut domain = driver.create("attempt-refused").unwrap();
    let mut direct = spec(&["true"], StartMode::Direct);
    let prefix = |extra: &[&str]| {
        let mut args = vec!["/usr/bin/bwrap", "--unshare-pid", "--as-pid-1", "--dev-bind", "/", "/", "--proc", "/proc"];
        args.extend(extra);
        Some(args.iter().map(|a| a.to_string()).collect::<Vec<_>>())
    };
    direct.bwrap_prefix = prefix(&["--die-with-parent"]);
    let err = driver.spawn_in(&mut domain, direct).err().expect("refused");
    assert_eq!(err.to_string(), "invalid-bwrap-prefix: die-with-parent-in-direct");

    let mut terminal = spec(&["true"], StartMode::Terminal);
    terminal.bwrap_prefix = prefix(&[]);
    let err = driver.spawn_in(&mut domain, terminal).err().expect("refused");
    assert_eq!(err.to_string(), "invalid-bwrap-prefix: die-with-parent-missing-in-terminal");

    let mut missing = spec(&["true"], StartMode::Direct);
    missing.bwrap_prefix = Some(["/usr/bin/bwrap", "--as-pid-1", "--proc", "/proc"].iter().map(|a| a.to_string()).collect());
    let err = driver.spawn_in(&mut domain, missing).err().expect("refused");
    assert_eq!(err.to_string(), "invalid-bwrap-prefix: missing-unshare-pid");
}

#[test]
fn a_refused_mount_is_named_in_the_containment_error() {
    let driver = BwrapPidns::new(fixture("bwrap-refuses-mount.sh").into());
    let mut domain = driver.create("attempt-refused-mount").unwrap();
    let err = driver.spawn_in(&mut domain, spec(&["true"], StartMode::Terminal)).err().expect("the refusing bwrap cannot start a gate");
    match err {
        fgos_process::containment::ContainmentError::NamespaceUnavailable(msg) => {
            assert!(msg.contains("Can't bind mount /oldroot/var/tmp/x"), "the refused mount is named, got: {msg}");
        }
        other => panic!("expected namespace-unavailable, got {other}"),
    }
}

#[test]
fn containment_select_prefers_bwrap_pidns_when_user_namespaces_work() {
    let Some(_) = common::require_bwrap() else { return };
    let driver = select(&SelectEnv::default()).unwrap();
    assert_eq!(driver.name(), "bwrap-pidns");
    let guarantee = driver.guarantee();
    assert_eq!(guarantee.level, GuaranteeLevel::Kernel);
    assert!(guarantee.escapes.iter().any(|e| e.contains("herdr")));
    // A bwrap that does not exist cannot be selected.
    let none = select(&SelectEnv { bwrap: Some("/nonexistent/bwrap".into()) }).unwrap();
    assert_eq!(none.name(), "linux-pgroup");
}
