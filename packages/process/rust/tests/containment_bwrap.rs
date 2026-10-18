//! `bwrap-pidns` against real bwrap, real namespaces and real processes.
#![cfg(target_os = "linux")]

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread::sleep;
use std::time::{Duration, Instant};

use fgos_process::containment::{select, BwrapPidns, ContainmentDriver, GuaranteeLevel, SelectEnv, SpawnSpec, StartMode};
use fgos_process::control::{signal_by_identity, Signal};
use fgos_process::facts::{self, ProcTuple};
use fgos_process::{Domain, DomainState, KillOutcome, ProcId};

const HELPER_ENV: &str = "FGOS_CONTAINMENT_HELPER_MODE";

fn scratch(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-containment-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn fixture(name: &str) -> String {
    format!("{}/tests/fixtures/{name}", env!("CARGO_MANIFEST_DIR"))
}

/// The driver `select` picks, only when it is `bwrap-pidns`; otherwise the
/// named skip is printed and the test ends.
fn bwrap_driver(test: &str) -> Option<Box<dyn ContainmentDriver>> {
    let driver = select(&SelectEnv::default()).expect("select");
    if driver.name() == "bwrap-pidns" {
        return Some(driver);
    }
    eprintln!("skip: {test}: no-bwrap-pidns (driver {})", driver.name());
    None
}

fn spec(argv: &[&str], mode: StartMode) -> SpawnSpec {
    SpawnSpec {
        argv: argv.iter().map(|a| a.to_string()).collect(),
        bwrap_prefix: None,
        fd_map: Vec::new(),
        env: BTreeMap::from([("PATH".to_string(), "/usr/bin:/bin".to_string())]),
        cwd: std::env::temp_dir(),
        stdin: None,
        stdout: None,
        stderr: None,
        mode,
    }
}

fn wait_for(path: &Path) -> String {
    let start = Instant::now();
    loop {
        if let Ok(text) = fs::read_to_string(path) {
            if !text.trim().is_empty() {
                return text;
            }
        }
        assert!(start.elapsed() < Duration::from_secs(10), "{} never written", path.display());
        sleep(Duration::from_millis(10));
    }
}

fn lines(path: &Path) -> usize {
    fs::read_to_string(path).map(|text| text.lines().count()).unwrap_or(0)
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

#[test]
fn containment_killing_the_gate_stops_a_setsid_grandchild_and_empties_the_domain() {
    let Some(driver) = bwrap_driver("heartbeat") else { return };
    let dir = scratch("heartbeat");
    let beat = dir.join("beat");
    let script = fixture("heartbeat-grandchild.sh");
    let mut domain = driver.create("attempt-heartbeat").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, spec(&["sh", &script, &beat.display().to_string()], StartMode::Direct)).unwrap();

    wait_for(&beat);
    sleep(Duration::from_millis(100));
    assert!(lines(&beat) > 1, "the grandchild is beating");
    assert_eq!(driver.is_empty(&mut domain), DomainState::NotEmpty);

    assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    assert_eq!(driver.is_empty(&mut domain), DomainState::Empty, "empty as soon as the gate is dead");
    sleep(Duration::from_millis(200));
    let settled = lines(&beat);
    sleep(Duration::from_millis(200));
    assert_eq!(lines(&beat), settled, "the heartbeat stopped within 200 ms of the gate's death");
    spawned.child.wait().unwrap();
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
    let mut spawned = driver.spawn_in(&mut domain, spec(&["sh", &script, &dir.join("beat").display().to_string()], mode)).unwrap();
    fs::write(dir.join("gate-pid"), spawned.root.pid.0.to_string()).unwrap();
    let _ = spawned.child.wait();
}

fn run_with_killed_supervisor(mode: &str) -> Option<(PathBuf, ProcTuple)> {
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
    let gate = identity(wait_for(&dir.join("gate-pid")).trim().parse().unwrap());
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
    let _ = signal_by_identity(&gate, Signal::Kill);
}

#[test]
fn containment_terminal_gate_dies_with_a_killed_supervisor() {
    let Some((beat, gate)) = run_with_killed_supervisor("terminal") else { return };
    let before = lines(&beat);
    sleep(Duration::from_millis(300));
    assert_eq!(lines(&beat), before, "a terminal attempt dies with its supervisor");
    let _ = signal_by_identity(&gate, Signal::Kill);
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
fn containment_select_prefers_bwrap_pidns_when_user_namespaces_work() {
    let usable = Path::new("/usr/bin/bwrap").is_file()
        && Command::new("/usr/bin/bwrap")
            .args(["--unshare-user", "--dev-bind", "/", "/", "--", "/bin/true"])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map(|s| s.success())
            .unwrap_or(false);
    if !usable {
        eprintln!("skip: no-userns-to-disable");
        return;
    }
    let driver = select(&SelectEnv::default()).unwrap();
    assert_eq!(driver.name(), "bwrap-pidns");
    let guarantee = driver.guarantee();
    assert_eq!(guarantee.level, GuaranteeLevel::Kernel);
    assert!(guarantee.escapes.iter().any(|e| e.contains("herdr")));
    // A bwrap that does not exist cannot be selected.
    let none = select(&SelectEnv { bwrap: Some("/nonexistent/bwrap".into()) }).unwrap();
    assert_eq!(none.name(), "linux-pgroup");
}

#[test]
fn a_thousand_fast_exits_are_normal_spawns() {
    let Some(driver) = bwrap_driver("fast-exit") else { return };
    for i in 0..1000 {
        let mut domain = driver.create(&format!("fast-{i}")).unwrap();
        let mut spawned = driver.spawn_in(&mut domain, spec(&["/bin/true"], StartMode::Direct)).unwrap();
        assert!(spawned.child.wait().unwrap().success(), "spawn {i}");
        assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
        assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    }
}

#[test]
fn fast_exit_preserves_a_nonzero_status() {
    let Some(driver) = bwrap_driver("fast-status") else { return };
    for i in 0..100 {
        let mut domain = driver.create(&format!("status-{i}")).unwrap();
        let mut spawned = driver.spawn_in(&mut domain, spec(&["/bin/sh", "-c", "exit 7"], StartMode::Direct)).unwrap();
        assert_eq!(spawned.child.wait().unwrap().code(), Some(7));
        assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
    }
}
