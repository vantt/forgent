//! `windows-job` against real process trees. The test binary starts itself as
//! the gate, the supervisor and the agents: `helper_role` does nothing unless
//! `FGOS_TEST_ROLE` names a role.
#![cfg(windows)]

mod common;

use std::ffi::c_void;
use std::path::Path;
use std::thread::sleep;
use std::time::{Duration, Instant};

use windows_sys::Win32::Foundation::CloseHandle;
use windows_sys::Win32::System::JobObjects::{
    JobObjectExtendedLimitInformation, OpenJobObjectW, QueryInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
    JOB_OBJECT_LIMIT_BREAKAWAY_OK, JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE, JOB_OBJECT_LIMIT_SILENT_BREAKAWAY_OK,
};

use common::{scratch, wait_for, win_spec};
use fgos_process::containment::{ContainmentDriver, GuaranteeLevel, WindowsJobDriver};
use fgos_process::control::{signal_by_identity, Signal};
use fgos_process::facts::{self, Observed};
use fgos_process::{domain_watch, Domain, DomainState, ProcId};

/// `JOB_OBJECT_QUERY` access right.
const JOB_OBJECT_QUERY: u32 = 0x0004;

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

fn limit_flags(name: &str) -> u32 {
    let wide: Vec<u16> = name.encode_utf16().chain(std::iter::once(0)).collect();
    // SAFETY: a NUL-terminated name; the handle is closed below and the info block is plain data.
    unsafe {
        let job = OpenJobObjectW(JOB_OBJECT_QUERY, 0, wide.as_ptr());
        assert!(!job.is_null(), "the job opens by name");
        let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
        let ok = QueryInformationJobObject(
            job,
            JobObjectExtendedLimitInformation,
            &mut info as *mut _ as *mut c_void,
            std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
            std::ptr::null_mut(),
        );
        CloseHandle(job);
        assert_ne!(ok, 0, "the limit block reads");
        info.BasicLimitInformation.LimitFlags
    }
}

/// Not a test: the body of every helper process.
#[test]
fn helper_role() {
    common::run_helper_role();
}
#[test]
fn containment_windows_job_close_ends_child_grandchild_and_detached_child() {
    let dir = scratch("close");
    let driver = WindowsJobDriver;
    let mut domain = driver.create("attempt-close").unwrap();
    let spawned = driver.spawn_in(&mut domain, win_spec("tree", &dir, &[])).unwrap();
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
    // The fallback over the process tree needs quiet rounds, so one watch is polled, not one-shot calls.
    let mut watch = domain_watch(&record);
    let start = Instant::now();
    while watch.is_empty() != DomainState::Empty {
        assert!(start.elapsed() < Duration::from_secs(20), "a closed job's record never judged empty");
        sleep(Duration::from_millis(50));
    }
}

#[test]
fn containment_windows_job_refuses_breakaway() {
    let dir = scratch("breakaway");
    let driver = WindowsJobDriver;
    let mut domain = driver.create("attempt-breakaway").unwrap();
    let _spawned = driver.spawn_in(&mut domain, win_spec("breakaway", &dir, &[])).unwrap();
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
    let mut supervisor = common::helper_command().env("FGOS_TEST_ROLE", "supervisor").env("FGOS_TEST_DIR", &dir).spawn().unwrap();
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
