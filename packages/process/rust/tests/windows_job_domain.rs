//! The `windows-job` domain judged by the contender view, against real
//! processes. The test binary re-executes itself with `WJ_ROLE` set (through
//! the test named `child_entry`) and plays the holder, the keeper and the
//! members itself. Every scenario runs `REPEATS` times and counts violations:
//! a first "empty" while a member's process object is still unsignaled.
#![cfg(windows)]

use std::ffi::c_void;
use std::fs;
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use fgos_process::facts::{identity_of, ProcTuple};
use fgos_process::platform::windows_job::{assign_and_resume, create_kill_job, filetime_now, job_name, open_job, ContenderView, Job};
use fgos_process::{domain_watch, Domain, DomainState, KillOutcome, ProcId, WindowsJob};
use windows_sys::Win32::Foundation::{CloseHandle, HANDLE, WAIT_OBJECT_0};
use windows_sys::Win32::Storage::FileSystem::SYNCHRONIZE;
use windows_sys::Win32::System::RemoteDesktop::ProcessIdToSessionId;
use windows_sys::Win32::System::Threading::{GetCurrentProcessId, OpenProcess, WaitForSingleObject};

const REPEATS: usize = 50;
const ROLE: &str = "WJ_ROLE";
const READY: &str = "WJ_READY";
const ARG: &str = "WJ_ARG";
const CREATE_SUSPENDED: u32 = 0x0000_0004;
const CREATE_BREAKAWAY_FROM_JOB: u32 = 0x0100_0000;

// ---------- roles ----------

#[test]
fn child_entry() {
    let Ok(role) = std::env::var(ROLE) else { return };
    // A role never outlives a crashed test run by more than two minutes.
    std::thread::spawn(|| {
        std::thread::sleep(Duration::from_secs(120));
        std::process::exit(3);
    });
    let arg = std::env::var(ARG).unwrap_or_default();
    match role.as_str() {
        "block" => write_ready("up"),
        // Starts a blocked child of its own and reports its pid.
        "spawner" => {
            let child = spawn_plain("block");
            write_ready(&child.id().to_string());
            std::mem::forget(child);
        }
        // A second job owner: opens the job by name and holds it open.
        "keeper" => {
            let job = open_job(&arg).expect("keeper opens the job");
            write_ready("up");
            std::mem::forget(job);
        }
        // The holder of a borrow: creates the job, starts a member (which has a
        // blocked child of its own) into it, reports both pids.
        "job-owner" => {
            let job = create_kill_job(&arg).expect("create job");
            let member_ready = ready_path().with_extension("member");
            let member = spawn_role("spawner", "", &member_ready, true);
            assign_and_resume(&job, &member.0).expect("assign member");
            let grandchild = wait_ready(&member_ready, &member.0);
            write_ready(&format!("{} {grandchild}", member.0.id()));
            std::mem::forget((job, member));
        }
        // A member that tries to leave the job, then starts a child.
        "breakaway" => {
            let escaped = Command::new(std::env::current_exe().unwrap())
                .args(["--exact", "child_entry", "--nocapture", "--test-threads", "1"])
                .env(ROLE, "block")
                .env(READY, ready_path().with_extension("escaped"))
                .creation_flags(CREATE_BREAKAWAY_FROM_JOB)
                .stdin(Stdio::null())
                .spawn();
            let verdict = match escaped {
                Ok(mut child) => {
                    let _ = child.kill();
                    "escaped"
                }
                Err(_) => "denied",
            };
            let child = spawn_plain("block");
            write_ready(&format!("{verdict} {}", child.id()));
            std::mem::forget(child);
        }
        // Reports whether it is already in the job named by the argument.
        "in-job-probe" => {
            let job = open_job(&arg).expect("probe opens the job");
            let me = job.contains(std::process::id());
            let child = spawn_plain("block");
            write_ready(&format!("{} {}", me == Some(true), child.id()));
            std::mem::forget((job, child, me));
        }
        other => panic!("unknown role {other}"),
    }
    loop {
        std::thread::sleep(Duration::from_secs(3600));
    }
}

fn ready_path() -> PathBuf {
    PathBuf::from(std::env::var(READY).expect("ready path"))
}

fn write_ready(text: &str) {
    let path = ready_path();
    let tmp = path.with_extension("tmp");
    fs::write(&tmp, format!("{text}\n")).expect("ready tmp");
    fs::rename(&tmp, &path).expect("ready rename");
}

/// A role child that is killed and reaped when dropped.
struct Guard(Child);

impl Drop for Guard {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

fn spawn_role(role: &str, arg: &str, ready: &Path, suspended: bool) -> Guard {
    let mut cmd = Command::new(std::env::current_exe().expect("test binary"));
    cmd.args(["--exact", "child_entry", "--nocapture", "--test-threads", "1"]).env(ROLE, role).env(READY, ready).env(ARG, arg).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::inherit());
    if suspended {
        cmd.creation_flags(CREATE_SUSPENDED);
    }
    Guard(cmd.spawn().expect("spawn role"))
}

/// A role child started by a role: it has no ready file to wait on.
fn spawn_plain(role: &str) -> Child {
    let dir = std::env::temp_dir();
    Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "child_entry", "--nocapture", "--test-threads", "1"])
        .env(ROLE, role)
        .env(READY, dir.join(format!("fgos-wj-plain-{}-{}", std::process::id(), role)))
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .spawn()
        .expect("spawn plain role")
}

fn wait_ready(ready: &Path, child: &Child) -> String {
    let deadline = Instant::now() + Duration::from_secs(30);
    loop {
        if let Ok(text) = fs::read_to_string(ready) {
            if text.ends_with('\n') {
                return text.trim().to_string();
            }
        }
        assert!(Instant::now() < deadline, "role {} never became ready", child.id());
        std::thread::sleep(Duration::from_millis(5));
    }
}

fn ready_file(tag: &str, i: usize) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-wj-{}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    dir.join(format!("{tag}-{i}"))
}

/// Run `body` once per repeat, one scenario at a time: the tests of this
/// binary share the process table and a timing-sensitive wait.
fn serial() -> std::sync::MutexGuard<'static, ()> {
    static SERIAL: std::sync::Mutex<()> = std::sync::Mutex::new(());
    SERIAL.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

// ---------- the test's own view of the processes ----------

/// A `SYNCHRONIZE` handle the test opened itself, so "is it dead" is never the
/// driver's own answer.
struct Watched(HANDLE);

impl Watched {
    fn open(pid: u32) -> Watched {
        // SAFETY: OpenProcess takes plain values and returns a handle or null.
        let handle = unsafe { OpenProcess(SYNCHRONIZE, 0, pid) };
        assert!(!handle.is_null(), "cannot open pid {pid}");
        Watched(handle)
    }

    fn signaled(&self) -> bool {
        // SAFETY: a zero wait polls an open handle.
        unsafe { WaitForSingleObject(self.0, 0) == WAIT_OBJECT_0 }
    }
}

impl Drop for Watched {
    fn drop(&mut self) {
        // SAFETY: closing the handle this struct owns.
        unsafe {
            CloseHandle(self.0 as *mut c_void);
        }
    }
}

fn own_session() -> u32 {
    let mut session = 0;
    // SAFETY: one out-pointer.
    assert_ne!(unsafe { ProcessIdToSessionId(GetCurrentProcessId(), &mut session) }, 0);
    session
}

fn tuple(pid: u32) -> ProcTuple {
    identity_of(ProcId(pid)).expect("live process has an identity")
}

fn record(job: &str, holder: ProcTuple, keeper: Option<ProcTuple>, declared_at: u64) -> WindowsJob {
    WindowsJob { job: job.to_string(), session_id: own_session(), declared_at, holder, keeper }
}

fn kill(guard: &mut Guard) {
    let _ = guard.0.kill();
    let _ = guard.0.wait();
}

fn alive(pid: u32) -> bool {
    !Watched::open(pid).signaled()
}

/// Poll until the view says empty or `within` passes. Returns `(reached,
/// violated)`; `violated` is true when a watched member was still running at
/// the first empty.
fn settle(view: &mut ContenderView, within: Duration, members: &[&Watched]) -> (bool, bool) {
    let deadline = Instant::now() + within;
    loop {
        if view.is_empty() == DomainState::Empty {
            return (true, members.iter().any(|m| !m.signaled()));
        }
        if Instant::now() >= deadline {
            return (false, false);
        }
        std::thread::sleep(Duration::from_millis(1));
    }
}

fn pids(text: &str) -> Vec<u32> {
    text.split_whitespace().filter_map(|t| t.parse().ok()).collect()
}

// ---------- scenarios ----------

#[test]
fn holder_dead_second_owner_alive_member_blocked() {
    let _serial = serial();
    let mut violations = 0;
    for i in 0..REPEATS {
        let name = job_name("wj-test", "second-owner");
        let job = create_kill_job(&name).unwrap();
        let declared = filetime_now();
        let mut holder = spawn_role("block", "", &ready_file("t6-holder", i), false);
        wait_ready(&ready_file("t6-holder", i), &holder.0);
        let keeper_ready = ready_file("t6-keeper", i);
        let keeper = spawn_role("keeper", &name, &keeper_ready, false);
        wait_ready(&keeper_ready, &keeper.0);
        let member_ready = ready_file("t6-member", i);
        let member = spawn_role("spawner", "", &member_ready, true);
        assign_and_resume(&job, &member.0).unwrap();
        let grandchild: u32 = wait_ready(&member_ready, &member.0).parse().unwrap();
        let (member_h, grandchild_h) = (Watched::open(member.0.id()), Watched::open(grandchild));
        let rec = record(&name, tuple(holder.0.id()), Some(tuple(keeper.0.id())), declared);
        // The keeper is the second owner: the test's own handle can go.
        drop(job);
        kill(&mut holder);

        let mut view = ContenderView::new(&rec);
        assert!(view.job_opened(), "the keeper holds the job open");
        for _ in 0..3 {
            assert_eq!(view.is_empty(), DomainState::NotEmpty, "member is blocked and alive");
        }
        assert_eq!(view.kill_all(), KillOutcome::Ok);
        let (reached, violated) = settle(&mut view, Duration::from_secs(2), &[&member_h, &grandchild_h]);
        assert!(reached, "repeat {i}: never empty after kill_all");
        violations += usize::from(violated);
        assert!(alive(keeper.0.id()), "the keeper is never touched");
    }
    assert_eq!(violations, 0);
}

#[test]
fn all_owners_dead_the_chain_decides() {
    let _serial = serial();
    let mut violations = 0;
    for i in 0..REPEATS {
        let name = job_name("wj-test", "all-dead");
        let declared = filetime_now();
        let ready = ready_file("t7", i);
        let mut holder = spawn_role("job-owner", &name, &ready, false);
        let reported = pids(&wait_ready(&ready, &holder.0));
        let rec = record(&name, tuple(holder.0.id()), None, declared);
        let watched: Vec<Watched> = reported.iter().map(|pid| Watched::open(*pid)).collect();
        // The holder was the only owner: the kernel ends the job's members itself.
        kill(&mut holder);

        let mut view = ContenderView::new(&rec);
        let (reached, violated) = settle(&mut view, Duration::from_secs(5), &watched.iter().collect::<Vec<_>>());
        assert!(reached, "repeat {i}: never empty");
        violations += usize::from(violated);
    }
    assert_eq!(violations, 0);
}

#[test]
fn dying_job_open_keeper_outlives_the_holder_briefly() {
    let _serial = serial();
    let (mut violations, mut opened) = (0, 0);
    for i in 0..REPEATS {
        let name = job_name("wj-test", "dying-open");
        let declared = filetime_now();
        let ready = ready_file("t8", i);
        let mut holder = spawn_role("job-owner", &name, &ready, false);
        let reported = pids(&wait_ready(&ready, &holder.0));
        let keeper_ready = ready_file("t8-keeper", i);
        let mut keeper = spawn_role("keeper", &name, &keeper_ready, false);
        wait_ready(&keeper_ready, &keeper.0);
        let rec = record(&name, tuple(holder.0.id()), Some(tuple(keeper.0.id())), declared);
        let watched: Vec<Watched> = reported.iter().map(|pid| Watched::open(*pid)).collect();
        kill(&mut holder);
        std::thread::sleep(Duration::from_millis((i as u64 * 50) / REPEATS as u64));
        kill(&mut keeper);

        let mut view = ContenderView::new(&rec);
        opened += usize::from(view.job_opened());
        let (reached, violated) = settle(&mut view, Duration::from_secs(5), &watched.iter().collect::<Vec<_>>());
        assert!(reached, "repeat {i}: never empty");
        violations += usize::from(violated);
    }
    eprintln!("dying-job-open: jobOpened {opened}/{REPEATS}, violations {violations}");
    assert_eq!(violations, 0);
}

#[test]
fn holder_alive_record_left_behind_touches_nothing() {
    let _serial = serial();
    for i in 0..REPEATS {
        let ready = ready_file("t9", i);
        let holder = spawn_role("spawner", "", &ready, false);
        let older_child: u32 = wait_ready(&ready, &holder.0).parse().unwrap();
        // The child was created before the declare, so a tree walk would
        // wrongly name it; the empty job is the whole domain.
        let declared = filetime_now();
        let name = job_name("wj-test", "alive-empty");
        let job = create_kill_job(&name).unwrap();
        let rec = record(&name, tuple(holder.0.id()), None, declared);

        let mut view = ContenderView::new(&rec);
        for _ in 0..3 {
            assert_eq!(view.is_empty(), DomainState::Empty, "repeat {i}");
        }
        // Even a kill leaves them: with a live holder only the job is ended.
        assert_eq!(view.kill_all(), KillOutcome::Ok);
        assert!(alive(holder.0.id()), "the holder survives");
        assert!(alive(older_child), "the holder's older child survives");
        drop(job);
    }
}

#[test]
fn holder_alive_job_not_empty_ends_only_the_job() {
    let _serial = serial();
    for i in 0..REPEATS {
        let holder = spawn_role("block", "", &ready_file("t10-holder", i), false);
        wait_ready(&ready_file("t10-holder", i), &holder.0);
        let name = job_name("wj-test", "alive-busy");
        let job = create_kill_job(&name).unwrap();
        let declared = filetime_now();
        let member_ready = ready_file("t10-member", i);
        let member = spawn_role("spawner", "", &member_ready, true);
        assign_and_resume(&job, &member.0).unwrap();
        let grandchild: u32 = wait_ready(&member_ready, &member.0).parse().unwrap();
        let (member_h, grandchild_h) = (Watched::open(member.0.id()), Watched::open(grandchild));
        let rec = record(&name, tuple(holder.0.id()), None, declared);

        let mut view = ContenderView::new(&rec);
        assert_eq!(view.is_empty(), DomainState::NotEmpty);
        assert_eq!(view.kill_all(), KillOutcome::Ok);
        let (reached, violated) = settle(&mut view, Duration::from_secs(2), &[&member_h, &grandchild_h]);
        assert!(reached && !violated, "repeat {i}: reached {reached}, violated {violated}");
        assert!(alive(holder.0.id()), "the holder is not a member and survives");
    }
}

#[test]
fn a_stale_record_with_a_reused_holder_pid_is_empty_at_once() {
    let _serial = serial();
    for i in 0..REPEATS {
        // The holder pid is a live process (this one) whose creation time is not
        // the recorded one: the pid was reused; the job is long gone.
        let name = job_name("wj-test", "stale");
        let mut stale = tuple(std::process::id());
        stale.start_time = "1".to_string();
        let rec = record(&name, stale, None, 0);
        let started = Instant::now();
        let mut view = ContenderView::new(&rec);
        assert!(!view.job_opened());
        let (reached, _) = settle(&mut view, Duration::from_secs(2), &[]);
        assert!(reached, "repeat {i}");
        assert!(started.elapsed() < Duration::from_secs(2));
    }
}

#[test]
fn a_record_from_another_session_is_never_empty() {
    let _serial = serial();
    let name = job_name("wj-test", "session");
    let mut rec = record(&name, tuple(std::process::id()), None, 0);
    rec.session_id = own_session() + 1;
    for _ in 0..REPEATS {
        let mut view = ContenderView::new(&rec);
        assert_eq!(view.is_empty(), DomainState::NotEmpty);
        assert_eq!(view.reason(), Some("predecessor-other-session"));
        assert_eq!(view.kill_all(), KillOutcome::Refused);
        let mut watch = domain_watch(&Domain::WindowsJob(rec.clone()));
        assert_eq!(watch.is_empty(), DomainState::NotEmpty);
        assert_eq!(watch.reason(), Some("predecessor-other-session"));
    }
}

#[test]
fn a_member_cannot_break_away_from_the_job() {
    let _serial = serial();
    for i in 0..REPEATS {
        let name = job_name("wj-test", "breakaway");
        let job = create_kill_job(&name).unwrap();
        let ready = ready_file("t13", i);
        let member = spawn_role("breakaway", "", &ready, true);
        assign_and_resume(&job, &member.0).unwrap();
        let report = wait_ready(&ready, &member.0);
        let mut words = report.split_whitespace();
        assert_eq!(words.next(), Some("denied"), "repeat {i}: CREATE_BREAKAWAY_FROM_JOB must fail");
        let child: u32 = words.next().unwrap().parse().unwrap();
        assert_eq!(job.contains(child), Some(true), "its child is in the job");
    }
}

#[test]
fn assign_and_resume_puts_the_child_and_its_child_in_the_job() {
    let _serial = serial();
    for i in 0..REPEATS {
        let name = job_name("wj-test", "assign");
        let job: Job = create_kill_job(&name).unwrap();
        let ready = ready_file("t14", i);
        let member = spawn_role("in-job-probe", &name, &ready, true);
        assign_and_resume(&job, &member.0).unwrap();
        let report = wait_ready(&ready, &member.0);
        let mut words = report.split_whitespace();
        assert_eq!(words.next(), Some("true"), "repeat {i}: in the job before its first instruction");
        let child: u32 = words.next().unwrap().parse().unwrap();
        assert_eq!(job.contains(member.0.id()), Some(true));
        assert_eq!(job.contains(child), Some(true));
    }
}
