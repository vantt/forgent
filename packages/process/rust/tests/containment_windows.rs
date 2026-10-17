//! `windows-job` against real process trees. The test binary starts itself as
//! the gate, the supervisor and the agents: `helper_role` does nothing unless
//! `FGOS_TEST_ROLE` names a role.
#![cfg(windows)]

use std::collections::BTreeMap;
use std::ffi::c_void;
use std::fs;
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::thread::sleep;
use std::time::{Duration, Instant};

use windows_sys::Win32::Foundation::CloseHandle;
use windows_sys::Win32::System::JobObjects::{
    JobObjectExtendedLimitInformation, OpenJobObjectW, QueryInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION, JOB_OBJECT_LIMIT_BREAKAWAY_OK, JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    JOB_OBJECT_LIMIT_SILENT_BREAKAWAY_OK,
};

use fgos_process::containment::{ContainmentDriver, GuaranteeLevel, SpawnSpec, StartMode, WindowsJobDriver};
use fgos_process::control::{signal_by_identity, Signal};
use fgos_process::facts::{self, Observed};
use fgos_process::platform::windows_job::open_job;
use fgos_process::{domain_is_empty, Domain, DomainState, ProcId};

/// `JOB_OBJECT_QUERY` access right.
const JOB_OBJECT_QUERY: u32 = 0x0004;
const DETACHED_PROCESS: u32 = 0x0000_0008;
const CREATE_BREAKAWAY_FROM_JOB: u32 = 0x0100_0000;

fn scratch(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-win-job-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn me() -> String {
    std::env::current_exe().unwrap().display().to_string()
}

/// The command line that runs `helper_role` in this binary.
fn helper_argv() -> Vec<String> {
    [&me()[..], "--exact", "helper_role", "--nocapture", "--test-threads=1"].iter().map(|a| a.to_string()).collect()
}

fn helper_command() -> Command {
    let mut cmd = Command::new(me());
    cmd.args(["--exact", "helper_role", "--nocapture", "--test-threads=1"]);
    cmd
}

/// The environment of a helper: this process's own, plus the role and its directory.
fn helper_env(role: &str, dir: &Path, extra: &[(&str, &str)]) -> BTreeMap<String, String> {
    let mut env: BTreeMap<String, String> = std::env::vars().collect();
    env.insert("FGOS_TEST_ROLE".into(), role.into());
    env.insert("FGOS_TEST_DIR".into(), dir.display().to_string());
    for (key, value) in extra {
        env.insert((*key).into(), (*value).into());
    }
    env
}

fn spec(role: &str, dir: &Path, extra: &[(&str, &str)]) -> SpawnSpec {
    SpawnSpec {
        argv: helper_argv(),
        bwrap_prefix: None,
        fd_map: Vec::new(),
        env: helper_env(role, dir, extra),
        cwd: std::env::temp_dir(),
        stdin: None,
        stdout: None,
        stderr: None,
        mode: StartMode::Direct,
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
        assert!(start.elapsed() < Duration::from_secs(20), "{} never written", path.display());
        sleep(Duration::from_millis(20));
    }
}

fn pid_file(dir: &Path, name: &str) -> u32 {
    wait_for(&dir.join(name)).trim().parse().unwrap()
}

fn live(pid: u32) -> bool {
    matches!(facts::observe(ProcId(pid)), Observed::Live { .. })
}

fn wait_dead(pid: u32, what: &str) {
    let start = Instant::now();
    while live(pid) {
        assert!(start.elapsed() < Duration::from_secs(20), "{what} (pid {pid}) is still alive");
        sleep(Duration::from_millis(50));
    }
}

/// A helper outlives its test only by a few minutes, so a failed test leaves nothing behind.
fn forever() -> ! {
    sleep(Duration::from_secs(180));
    std::process::exit(0)
}

fn write_pid(dir: &Path, name: &str, pid: u32) {
    // Written whole under another name first: the reader never sees a partial number.
    let tmp = dir.join(format!("{name}.tmp"));
    fs::write(&tmp, pid.to_string()).unwrap();
    fs::rename(&tmp, dir.join(name)).unwrap();
}

fn sleeper(flags: u32, dir: &Path) -> Child {
    let mut cmd = helper_command();
    cmd.env("FGOS_TEST_ROLE", "sleep").env("FGOS_TEST_DIR", dir).creation_flags(flags);
    cmd.spawn().unwrap()
}

/// Not a test: the body of every helper process.
#[test]
fn helper_role() {
    let Ok(role) = std::env::var("FGOS_TEST_ROLE") else {
        return;
    };
    let dir = PathBuf::from(std::env::var("FGOS_TEST_DIR").unwrap());
    match role.as_str() {
        "sleep" => forever(),
        // A child, a grandchild and a detached child, all started by the gate.
        "tree" => {
            let child = sleeper(0, &dir);
            write_pid(&dir, "child.pid", child.id());
            let detached = sleeper(DETACHED_PROCESS, &dir);
            write_pid(&dir, "detached.pid", detached.id());
            let mut nest = helper_command();
            nest.env("FGOS_TEST_ROLE", "nest").env("FGOS_TEST_DIR", &dir);
            let nest = nest.spawn().unwrap();
            write_pid(&dir, "nest.pid", nest.id());
            forever()
        }
        "nest" => {
            let grandchild = sleeper(0, &dir);
            write_pid(&dir, "grandchild.pid", grandchild.id());
            forever()
        }
        "breakaway" => {
            let outcome = match sleeper_with_flags_result(CREATE_BREAKAWAY_FROM_JOB, &dir) {
                Ok(child) => format!("allowed {}", child.id()),
                Err(_) => "denied".to_string(),
            };
            fs::write(dir.join("breakaway.txt"), outcome).unwrap();
            forever()
        }
        // The gate holds a second handle of its own on the job, then starts the agent.
        "holder" => {
            let job = open_job(&std::env::var("FGOS_TEST_JOB").unwrap()).unwrap();
            let agent = sleeper(0, &dir);
            write_pid(&dir, "agent.pid", agent.id());
            write_pid(&dir, "gate.pid", std::process::id());
            let _keep = job;
            forever()
        }
        // The supervisor: makes the domain, starts the holder gate in it, then waits to be killed.
        "supervisor" => {
            let driver = WindowsJobDriver;
            let mut domain = driver.create("attempt-supervisor").unwrap();
            let job = WindowsJobDriver::job_name(&domain).unwrap().to_string();
            let _spawned = driver.spawn_in(&mut domain, spec("holder", &dir, &[("FGOS_TEST_JOB", &job)])).unwrap();
            write_pid(&dir, "supervisor.pid", std::process::id());
            forever()
        }
        other => panic!("unknown role {other}"),
    }
}

fn limit_flags(name: &str) -> u32 {
    let wide: Vec<u16> = name.encode_utf16().chain(std::iter::once(0)).collect();
    // SAFETY: a NUL-terminated name; the handle is closed below and the info block is plain data.
    unsafe {
        let job = OpenJobObjectW(JOB_OBJECT_QUERY, 0, wide.as_ptr());
        assert!(!job.is_null(), "the job opens by name");
        let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
        let ok = QueryInformationJobObject(job, JobObjectExtendedLimitInformation, &mut info as *mut _ as *mut c_void, std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32, std::ptr::null_mut());
        CloseHandle(job);
        assert_ne!(ok, 0, "the limit block reads");
        info.BasicLimitInformation.LimitFlags
    }
}

fn sleeper_with_flags_result(flags: u32, dir: &Path) -> std::io::Result<Child> {
    let mut cmd = helper_command();
    cmd.env("FGOS_TEST_ROLE", "sleep").env("FGOS_TEST_DIR", dir).creation_flags(flags);
    cmd.spawn()
}

#[test]
fn containment_windows_job_close_ends_child_grandchild_and_detached_child() {
    let dir = scratch("close");
    let driver = WindowsJobDriver;
    let mut domain = driver.create("attempt-close").unwrap();
    let spawned = driver.spawn_in(&mut domain, spec("tree", &dir, &[])).unwrap();
    let record = domain.domain().unwrap().clone();
    assert!(matches!(record, Domain::WindowsJob(_)));
    let pids: Vec<(&str, u32)> = ["child", "detached", "nest", "grandchild"].iter().map(|name| (*name, pid_file(&dir, &format!("{name}.pid")))).collect();
    for (name, pid) in &pids {
        assert!(live(*pid), "{name} should be running");
    }
    assert_eq!(driver.is_empty(&mut domain), DomainState::NotEmpty);

    // The supervisor's handle is the only one: closing it ends the whole job.
    let gate = spawned.root.pid.0;
    drop(spawned);
    drop(domain);
    wait_dead(gate, "gate");
    for (name, pid) in &pids {
        wait_dead(*pid, name);
    }
    let start = Instant::now();
    while domain_is_empty(&record) != DomainState::Empty {
        assert!(start.elapsed() < Duration::from_secs(20), "a closed job's record never judged empty");
        sleep(Duration::from_millis(50));
    }
}

#[test]
fn containment_windows_job_refuses_breakaway() {
    let dir = scratch("breakaway");
    let driver = WindowsJobDriver;
    let mut domain = driver.create("attempt-breakaway").unwrap();
    let _spawned = driver.spawn_in(&mut domain, spec("breakaway", &dir, &[])).unwrap();
    assert_eq!(wait_for(&dir.join("breakaway.txt")).trim(), "denied");
    // The runner's own job may also deny breakaway: read the flags of this job itself.
    let flags = limit_flags(WindowsJobDriver::job_name(&domain).unwrap());
    assert_ne!(flags & JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE, 0, "kill on close is set");
    assert_eq!(flags & (JOB_OBJECT_LIMIT_BREAKAWAY_OK | JOB_OBJECT_LIMIT_SILENT_BREAKAWAY_OK), 0, "no breakaway flag is set");
    assert_eq!(driver.guarantee().level, GuaranteeLevel::Kernel);
    driver.kill_all(&mut domain, 0);
}

#[test]
fn containment_windows_job_outlives_its_supervisor_while_the_gate_holds_a_handle() {
    let dir = scratch("supervisor");
    let mut supervisor = helper_command().env("FGOS_TEST_ROLE", "supervisor").env("FGOS_TEST_DIR", &dir).spawn().unwrap();
    let agent = pid_file(&dir, "agent.pid");
    let gate = pid_file(&dir, "gate.pid");
    pid_file(&dir, "supervisor.pid");

    supervisor.kill().unwrap();
    let _ = supervisor.wait();
    sleep(Duration::from_secs(2));
    assert!(live(gate), "the gate holds the job open");
    assert!(live(agent), "the agent lives while one handle on the job is open");

    // Both holders gone: the job closes and ends the agent.
    let tuple = facts::identity_of(ProcId(gate)).expect("gate identity");
    signal_by_identity(&tuple, Signal::Kill);
    wait_dead(gate, "gate");
    wait_dead(agent, "agent");
}
