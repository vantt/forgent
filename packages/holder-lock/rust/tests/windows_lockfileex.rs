//! The Windows `LockFileEx` driver, measured through the port: exclusion
//! between processes and between handles, release on process death and on
//! drop, no lingering shared lock after a probe, the file-identity retry, and
//! that a lock handle is never inherited by a child.
#![cfg(windows)]

mod common;

use std::fs::{File, OpenOptions};
use std::os::windows::io::AsRawHandle;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use fgos_holder_lock::driver::{self, TryLock};
use fgos_holder_lock::{
    acquire, guarantee, probe, release, Acquire, HeldReason, Level, Mode, Probe, Wait,
};

use common::{kill_and_reap, resource, serial, spawn_role, temp_dir, wait_ready};

#[test]
fn child_entry() {
    common::child_entry()
}

fn acquired(outcome: Acquire) -> fgos_holder_lock::Handle {
    match outcome {
        Acquire::Acquired(handle) => handle,
        other => panic!("expected Acquired, got {other:?}"),
    }
}

#[test]
fn a_killed_holder_frees_the_lock_at_once() {
    let _serial = serial();
    let dir = temp_dir("wlfx-kill");
    let res = resource(&dir, "kill");
    let ready = dir.join("ready");
    let mut child = spawn_role("holder", &res.path, &ready, "");
    wait_ready(&ready, &mut child);
    assert!(matches!(
        acquire(&res, Mode::Ex, Wait::Try, 2000),
        Acquire::Held {
            reason: HeldReason::KernelLockHeld,
            ..
        }
    ));
    kill_and_reap(&mut child);
    let started = Instant::now();
    let handle = acquired(acquire(&res, Mode::Ex, Wait::Ms(50), 2000));
    assert!(
        started.elapsed() < Duration::from_millis(150),
        "took {:?}",
        started.elapsed()
    );
    assert!(matches!(
        release(handle),
        fgos_holder_lock::Release::Released { .. }
    ));
}

#[test]
fn two_handles_in_one_process_exclude_each_other() {
    let _serial = serial();
    let dir = temp_dir("wlfx-two");
    let res = resource(&dir, "two");
    let first = acquired(acquire(&res, Mode::Ex, Wait::Try, 2000));
    assert!(matches!(
        acquire(&res, Mode::Ex, Wait::Try, 2000),
        Acquire::Held {
            reason: HeldReason::KernelLockHeld,
            ..
        }
    ));
    assert!(matches!(
        release(first),
        fgos_holder_lock::Release::Released { .. }
    ));
}

#[test]
fn shared_locks_share_and_exclude_an_exclusive() {
    let _serial = serial();
    let dir = temp_dir("wlfx-sh");
    let res = resource(&dir, "sh");
    let a = acquired(acquire(&res, Mode::Sh, Wait::Try, 2000));
    let b = acquired(acquire(&res, Mode::Sh, Wait::Try, 2000));
    assert!(matches!(
        acquire(&res, Mode::Ex, Wait::Try, 2000),
        Acquire::Held { .. }
    ));
    assert!(matches!(
        release(a),
        fgos_holder_lock::Release::Released { .. }
    ));
    assert!(matches!(
        release(b),
        fgos_holder_lock::Release::Released { .. }
    ));
    assert!(matches!(
        release(acquired(acquire(&res, Mode::Ex, Wait::Try, 2000))),
        fgos_holder_lock::Release::Released { .. }
    ));
}

#[test]
fn dropping_the_handle_releases_to_another_process() {
    let _serial = serial();
    let dir = temp_dir("wlfx-drop");
    let res = resource(&dir, "drop");
    let ready = dir.join("ready");
    let handle = acquired(acquire(&res, Mode::Ex, Wait::Try, 2000));
    let mut child = spawn_role("holder", &res.path, &ready, "");
    // The child is polling for the lock by now.
    std::thread::sleep(Duration::from_millis(1500));
    assert!(!ready.exists(), "the child must still be waiting");
    let released = Instant::now();
    drop(handle);
    wait_ready(&ready, &mut child);
    assert!(
        released.elapsed() < Duration::from_millis(250),
        "took {:?}",
        released.elapsed()
    );
}

#[test]
fn a_probe_leaves_no_shared_lock_behind() {
    let _serial = serial();
    let dir = temp_dir("wlfx-probe");
    let res = resource(&dir, "probe");
    drop(acquired(acquire(&res, Mode::Ex, Wait::Try, 2000)));
    for _ in 0..20 {
        assert_eq!(probe(&res).unwrap(), Probe::Free);
        assert!(matches!(
            release(acquired(acquire(&res, Mode::Ex, Wait::Try, 2000))),
            fgos_holder_lock::Release::Released { .. }
        ));
    }
}

#[test]
fn a_lock_file_replaced_between_open_and_lock_is_relocked() {
    let _serial = serial();
    let dir = temp_dir("wlfx-replace");
    let res = resource(&dir, "replace");
    let first = acquired(acquire(&res, Mode::Ex, Wait::Try, 2000));
    let waiter = {
        let res = res.clone();
        std::thread::spawn(move || acquire(&res, Mode::Ex, Wait::Ms(10_000), 2000))
    };
    // The waiter now polls the lock of the file it opened.
    std::thread::sleep(Duration::from_millis(200));
    let moved = dir.join("replace.moved");
    std::fs::rename(&res.path, &moved).unwrap();
    std::fs::write(&res.path, b"").unwrap();
    assert!(matches!(
        release(first),
        fgos_holder_lock::Release::Released { .. }
    ));
    let second = acquired(waiter.join().unwrap());
    // The new handle holds the file now at the path, not the renamed one.
    assert!(matches!(
        acquire(&res, Mode::Ex, Wait::Try, 2000),
        Acquire::Held { .. }
    ));
    let old = OpenOptions::new()
        .read(true)
        .write(true)
        .open(&moved)
        .unwrap();
    assert_eq!(
        driver::current().try_lock(&old, Mode::Ex).unwrap(),
        TryLock::Locked
    );
    assert!(!driver::current().same_file(&old, &res.path));
    assert!(matches!(
        release(second),
        fgos_holder_lock::Release::Released { .. }
    ));
}

#[test]
fn a_child_started_with_inheritance_holds_nothing() {
    let _serial = serial();
    let dir = temp_dir("wlfx-inherit");
    let res = resource(&dir, "inherit");
    let handle = acquired(acquire(&res, Mode::Ex, Wait::Try, 2000));
    let mut child = Command::new("ping")
        .args(["-n", "60", "127.0.0.1"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .expect("spawn ping");
    assert!(matches!(
        release(handle),
        fgos_holder_lock::Release::Released { .. }
    ));
    let result = acquire(&res, Mode::Ex, Wait::Try, 2000);
    kill_and_reap(&mut child);
    assert!(matches!(
        release(acquired(result)),
        fgos_holder_lock::Release::Released { .. }
    ));
}

#[test]
fn the_guarantee_is_lockfileex_kernel_job_scoped_with_unlistable_holders() {
    let dir = temp_dir("wlfx-guarantee");
    let g = guarantee(&dir);
    assert_eq!(
        (g.driver, g.exclusion, g.borrow, g.holders, g.platform),
        (
            "lockfileex",
            Level::Kernel,
            Level::JobScoped,
            Level::Unsupported,
            "windows"
        )
    );
    let res = resource(&dir, "holders");
    drop(acquired(acquire(&res, Mode::Ex, Wait::Try, 2000)));
    assert!(matches!(
        fgos_holder_lock::holders(&res).unwrap(),
        fgos_holder_lock::HoldersList::Unlistable(_)
    ));
}

// Measured evidence for lock custody across copies of a handle. A duplicate
// (`try_clone`) shares the owner's file object; these tests record how the
// lock behaves when the copy is closed, used, or held by a child.

const PROBE_LOCK: &str = "WLFX_PROBE_LOCK";
const OWNER_LOCK: &str = "WLFX_OWNER_LOCK";
const OWNER_READY: &str = "WLFX_OWNER_READY";

fn open_raw(path: &Path) -> File {
    OpenOptions::new()
        .create(true)
        .read(true)
        .write(true)
        .open(path)
        .expect("open lock file")
}

fn set_inheritable(file: &File) {
    use windows_sys::Win32::Foundation::{SetHandleInformation, HANDLE_FLAG_INHERIT};
    // SAFETY: the handle belongs to `file`, which outlives the call.
    let ok = unsafe {
        SetHandleInformation(
            file.as_raw_handle() as _,
            HANDLE_FLAG_INHERIT,
            HANDLE_FLAG_INHERIT,
        )
    };
    assert_ne!(
        ok,
        0,
        "SetHandleInformation: {}",
        std::io::Error::last_os_error()
    );
}

/// Child entry: tries the lock on `WLFX_PROBE_LOCK` from its own process and
/// exits 10 when another holder keeps it, 11 when it took it.
#[test]
fn probe_child_entry() {
    let Ok(path) = std::env::var(PROBE_LOCK) else {
        return;
    };
    let file = open_raw(Path::new(&path));
    let code = match driver::current().try_lock(&file, Mode::Ex).unwrap() {
        TryLock::WouldBlock => 10,
        TryLock::Locked => 11,
    };
    std::process::exit(code);
}

/// Child entry: takes the lock on `WLFX_OWNER_LOCK`, marks the handle
/// inheritable, starts a long-lived grandchild that inherits it, reports the
/// grandchild's pid and waits to be killed.
#[test]
fn owner_child_entry() {
    let Ok(path) = std::env::var(OWNER_LOCK) else {
        return;
    };
    let ready = std::env::var(OWNER_READY).expect("ready path");
    let file = open_raw(Path::new(&path));
    assert_eq!(
        driver::current().try_lock(&file, Mode::Ex).unwrap(),
        TryLock::Locked
    );
    set_inheritable(&file);
    let grandchild = Command::new("ping")
        .args(["-n", "120", "127.0.0.1"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .expect("spawn grandchild");
    let tmp = format!("{ready}.tmp");
    std::fs::write(&tmp, format!("{}\n", grandchild.id())).unwrap();
    std::fs::rename(&tmp, &ready).unwrap();
    let _keep = (file, grandchild);
    loop {
        std::thread::sleep(Duration::from_secs(3600));
    }
}

fn probe_other_process(path: &Path) -> i32 {
    Command::new(std::env::current_exe().expect("test binary"))
        .args([
            "--exact",
            "probe_child_entry",
            "--nocapture",
            "--test-threads",
            "1",
        ])
        .env(PROBE_LOCK, path)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::inherit())
        .status()
        .expect("spawn probe")
        .code()
        .expect("probe exit code")
}

const HELD_ELSEWHERE: i32 = 10;
const FREE_ELSEWHERE: i32 = 11;

#[test]
fn closing_a_duplicate_leaves_the_owners_lock_held_in_another_process() {
    let _serial = serial();
    let dir = temp_dir("wlfx-dup-close");
    let path = dir.join("dup.lock");
    let owner = open_raw(&path);
    assert_eq!(
        driver::current().try_lock(&owner, Mode::Ex).unwrap(),
        TryLock::Locked
    );
    let copy = owner.try_clone().expect("DuplicateHandle copy");
    assert_eq!(probe_other_process(&path), HELD_ELSEWHERE);
    drop(copy);
    assert_eq!(probe_other_process(&path), HELD_ELSEWHERE);
    // Another handle in this process is excluded too.
    let other = open_raw(&path);
    assert_eq!(
        driver::current().try_lock(&other, Mode::Ex).unwrap(),
        TryLock::WouldBlock
    );
    drop(owner);
    assert_eq!(probe_other_process(&path), FREE_ELSEWHERE);
}

// Measured on windows-latest: a duplicate shares the owner's file object, so
// a LockFileEx through it on the held range is refused (WouldBlock), an
// UnlockFileEx through it frees the owner's lock for other processes, and the
// lock stays held while only the copy is alive after the owner handle closed.
#[test]
fn a_duplicate_handle_shares_the_owners_lock_so_its_unlock_frees_it_and_its_lifetime_keeps_it() {
    let _serial = serial();
    let dir = temp_dir("wlfx-dup-use");
    let path = dir.join("dup-use.lock");
    let owner = open_raw(&path);
    assert_eq!(
        driver::current().try_lock(&owner, Mode::Ex).unwrap(),
        TryLock::Locked
    );
    let copy = owner.try_clone().expect("DuplicateHandle copy");
    assert_eq!(
        driver::current().try_lock(&copy, Mode::Ex).unwrap(),
        TryLock::WouldBlock
    );
    assert_eq!(probe_other_process(&path), HELD_ELSEWHERE);
    driver::current().before_close(&copy);
    assert_eq!(probe_other_process(&path), FREE_ELSEWHERE);
    drop(copy);
    drop(owner);
    assert_eq!(probe_other_process(&path), FREE_ELSEWHERE);

    let owner = open_raw(&path);
    assert_eq!(
        driver::current().try_lock(&owner, Mode::Ex).unwrap(),
        TryLock::Locked
    );
    let copy = owner.try_clone().expect("DuplicateHandle copy");
    drop(owner);
    assert_eq!(probe_other_process(&path), HELD_ELSEWHERE);
    drop(copy);
    assert_eq!(probe_other_process(&path), FREE_ELSEWHERE);
}

#[test]
fn an_inheritable_handle_kept_by_a_child_does_not_hold_the_lock_after_the_owner_closes() {
    let _serial = serial();
    let dir = temp_dir("wlfx-inherit-held");
    let path = dir.join("inherit-held.lock");
    let owner = open_raw(&path);
    assert_eq!(
        driver::current().try_lock(&owner, Mode::Ex).unwrap(),
        TryLock::Locked
    );
    set_inheritable(&owner);
    let mut child = Command::new("ping")
        .args(["-n", "60", "127.0.0.1"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .expect("spawn ping");
    assert_eq!(probe_other_process(&path), HELD_ELSEWHERE);
    driver::current().before_close(&owner);
    drop(owner);
    let after = probe_other_process(&path);
    kill_and_reap(&mut child);
    assert_eq!(after, FREE_ELSEWHERE);
}

#[test]
fn a_dead_owner_frees_the_lock_while_a_child_keeps_an_inherited_handle() {
    let _serial = serial();
    let dir = temp_dir("wlfx-owner-dies");
    let path = dir.join("owner-dies.lock");
    let ready = dir.join("ready");
    let mut owner = common::Guard(
        Command::new(std::env::current_exe().expect("test binary"))
            .args([
                "--exact",
                "owner_child_entry",
                "--nocapture",
                "--test-threads",
                "1",
            ])
            .env(OWNER_LOCK, &path)
            .env(OWNER_READY, &ready)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::inherit())
            .spawn()
            .expect("spawn owner"),
    );
    let grandchild = wait_ready(&ready, &mut owner);
    assert_eq!(probe_other_process(&path), HELD_ELSEWHERE);
    kill_and_reap(&mut owner);
    let after = probe_other_process(&path);
    let _ = Command::new("taskkill")
        .args(["/PID", &grandchild, "/F"])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();
    assert_eq!(after, FREE_ELSEWHERE);
}
