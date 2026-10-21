//! Lock holders and the process scan against real processes. The test
//! binary re-executes itself as the lock-holding child (`child_entry`), so
//! `flock` is taken by a process other than the one scanning.
#![cfg(target_os = "linux")]

use std::fs::{self, File, OpenOptions};
use std::os::fd::AsRawFd;
use std::os::unix::fs::MetadataExt;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use fgos_process::facts::{self, Holders, Scan, ScanFilter};
use fgos_process::ProcId;

const ROLE: &str = "FGOS_PROCESS_TEST_ROLE";
const LOCK_FILE: &str = "FGOS_PROCESS_TEST_LOCK_FILE";
const READY_FILE: &str = "FGOS_PROCESS_TEST_READY_FILE";

/// Re-executed by the parent with `ROLE=flock-holder`: take `flock` on the
/// lock file, write the ready marker, then sleep until killed. Does nothing
/// in an ordinary test run.
#[test]
fn child_entry() {
    if std::env::var(ROLE).as_deref() != Ok("flock-holder") {
        return;
    }
    let lock_path = std::env::var(LOCK_FILE).expect("lock file path");
    let file = OpenOptions::new().read(true).write(true).open(&lock_path).expect("open lock file");
    // SAFETY: flock on a descriptor this process owns.
    assert_eq!(unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX) }, 0, "flock in child");
    fs::write(std::env::var(READY_FILE).expect("ready file path"), b"ready").expect("ready marker");
    loop {
        std::thread::sleep(Duration::from_secs(3600));
    }
}

fn temp_dir(tag: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-process-{tag}-{}-{}", std::process::id(), nanos()));
    fs::create_dir_all(&dir).expect("temp dir");
    dir
}

fn nanos() -> u128 {
    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()
}

fn wait_for(path: &Path, child: &mut Child) {
    let deadline = Instant::now() + Duration::from_secs(20);
    while !path.exists() {
        if let Some(status) = child.try_wait().expect("try_wait") {
            panic!("child exited before it was ready: {status}");
        }
        assert!(Instant::now() < deadline, "child never became ready");
        std::thread::sleep(Duration::from_millis(20));
    }
}

fn spawn_flock_holder(lock_path: &Path, ready_path: &Path) -> Child {
    Command::new(std::env::current_exe().expect("test binary"))
        .args(["--exact", "child_entry", "--nocapture", "--test-threads=1"])
        .env(ROLE, "flock-holder")
        .env(LOCK_FILE, lock_path)
        .env(READY_FILE, ready_path)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::inherit())
        .spawn()
        .expect("spawn child")
}

fn holder_pids(holders: &Holders) -> Vec<u32> {
    match holders {
        Holders::List(holders) => holders.iter().map(|t| t.pid.0).collect(),
        Holders::Unlistable => panic!("Linux must list holders"),
    }
}

#[test]
fn a_child_holding_flock_is_listed_and_disappears_when_it_dies() {
    let dir = temp_dir("holders");
    let lock_path = dir.join("resource.lock");
    let ready_path = dir.join("ready");
    File::create(&lock_path).expect("create lock file");
    let (dev, ino) = facts::file_key(&File::open(&lock_path).unwrap()).expect("file key");

    let mut child = spawn_flock_holder(&lock_path, &ready_path);
    wait_for(&ready_path, &mut child);

    let listed = facts::lock_holders(dev, ino);
    let pids = holder_pids(&listed);
    assert_eq!(pids, vec![child.id()], "exactly the child holds the lock: {listed:?}");
    if let Holders::List(holders) = &listed {
        let tuple = &holders[0];
        assert_eq!(Some(tuple.start_time.clone()), facts::identity_of(ProcId(child.id())).map(|t| t.start_time));
        assert_eq!(tuple.host, facts::host());
    }

    child.kill().expect("kill child");
    child.wait().expect("reap child");
    assert_eq!(holder_pids(&facts::lock_holders(dev, ino)), Vec::<u32>::new(), "a dead holder is gone from the list");
    fs::remove_dir_all(&dir).ok();
}

#[test]
fn this_process_is_listed_while_it_holds_flock_and_not_after_close() {
    let dir = temp_dir("holders-self");
    let lock_path = dir.join("resource.lock");
    let file = OpenOptions::new().read(true).write(true).create(true).truncate(true).open(&lock_path).unwrap();
    let (dev, ino) = facts::file_key(&file).unwrap();
    // SAFETY: flock on a descriptor this process owns.
    assert_eq!(unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX) }, 0);
    // Membership, not equality: a child another test thread forks at this
    // moment shares this description until it execs, and is listed too.
    let me = std::process::id();
    assert!(holder_pids(&facts::lock_holders(dev, ino)).contains(&me));
    drop(file);
    assert!(!holder_pids(&facts::lock_holders(dev, ino)).contains(&me), "a closed description holds nothing");
    fs::remove_dir_all(&dir).ok();
}

#[test]
fn scan_sees_a_child_by_its_environment_and_names_what_it_cannot_read() {
    let dir = temp_dir("scan");
    let state_root = dir.join("state-root");
    let mut child = Command::new("sleep")
        .arg("300")
        .env("FGOS_STATE_ROOT", &state_root)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .spawn()
        .expect("spawn sleep");

    let filter = ScanFilter { env_keys: vec!["FGOS_STATE_ROOT".to_string()], include_self: false };
    let Scan::Views(views) = facts::scan(&filter) else {
        panic!("Linux must scan");
    };
    let view = views.iter().find(|v| v.pid.0 == child.id()).expect("the child is in the scan");
    assert_eq!(view.tuple.as_ref().map(|t| t.pid), Some(view.pid), "our own child is identified");
    assert_eq!(view.tuple.as_ref().and_then(|t| facts::identity_of(t.pid)).map(|t| t.start_time), view.tuple.as_ref().map(|t| t.start_time.clone()));
    assert_eq!(view.env_subset.get("FGOS_STATE_ROOT"), Some(&state_root.to_string_lossy().into_owned()));
    assert_eq!(view.cmdline.as_ref().and_then(|c| c.first()).map(String::as_str), Some("sleep"));
    assert_eq!(view.cwd.as_deref(), Some(std::env::current_dir().unwrap().as_path()));
    assert!(view.unreadable.is_empty(), "our own child is fully readable: {:?}", view.unreadable);
    assert!(views.iter().all(|v| v.pid.0 != std::process::id()), "include_self=false leaves the scanner out");

    // SAFETY: geteuid reads the effective uid.
    let euid = unsafe { libc::geteuid() };
    let init_uid = fs::metadata("/proc/1").map(|m| m.uid()).ok();
    if euid != 0 && init_uid.is_some_and(|uid| uid != euid) {
        // Another user's process stays in the list, with the reads that
        // failed named, never dropped. (Inside a sandbox whose init is our
        // own user there is nothing unreadable about it; when /proc hides
        // pid 1 entirely, `init_uid` is None and the scan cannot see it.)
        let init = views.iter().find(|v| v.pid.0 == 1).expect("pid 1 is listed even though it belongs to another user");
        if init.tuple.is_some() {
            assert!(init.unreadable.iter().any(|u| u.starts_with("environ:")), "pid 1's environ is unreadable to a non-root scanner: {:?}", init.unreadable);
        } else {
            assert!(init.unreadable.iter().any(|u| u.starts_with("stat:")), "an unidentified process names the read that failed: {:?}", init.unreadable);
        }
        assert!(init.env_subset.is_empty());
    }

    child.kill().ok();
    child.wait().ok();
    fs::remove_dir_all(&dir).ok();
}
