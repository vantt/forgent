//! The Windows `LockFileEx` driver, measured through the port: exclusion
//! between processes and between handles, release on process death and on
//! drop, no lingering shared lock after a probe, the file-identity retry, and
//! that a lock handle is never inherited by a child.
#![cfg(windows)]

mod common;

use std::fs::OpenOptions;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use fgos_holder_lock::driver::{self, TryLock};
use fgos_holder_lock::{acquire, guarantee, probe, release, Acquire, HeldReason, Level, Mode, Probe, Wait};

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
    assert!(matches!(acquire(&res, Mode::Ex, Wait::Try, 2000), Acquire::Held { reason: HeldReason::KernelLockHeld, .. }));
    kill_and_reap(&mut child);
    let started = Instant::now();
    let handle = acquired(acquire(&res, Mode::Ex, Wait::Ms(50), 2000));
    assert!(started.elapsed() < Duration::from_millis(150), "took {:?}", started.elapsed());
    release(handle);
}

#[test]
fn two_handles_in_one_process_exclude_each_other() {
    let _serial = serial();
    let dir = temp_dir("wlfx-two");
    let res = resource(&dir, "two");
    let first = acquired(acquire(&res, Mode::Ex, Wait::Try, 2000));
    assert!(matches!(acquire(&res, Mode::Ex, Wait::Try, 2000), Acquire::Held { reason: HeldReason::KernelLockHeld, .. }));
    release(first);
}

#[test]
fn shared_locks_share_and_exclude_an_exclusive() {
    let _serial = serial();
    let dir = temp_dir("wlfx-sh");
    let res = resource(&dir, "sh");
    let a = acquired(acquire(&res, Mode::Sh, Wait::Try, 2000));
    let b = acquired(acquire(&res, Mode::Sh, Wait::Try, 2000));
    assert!(matches!(acquire(&res, Mode::Ex, Wait::Try, 2000), Acquire::Held { .. }));
    release(a);
    release(b);
    release(acquired(acquire(&res, Mode::Ex, Wait::Try, 2000)));
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
    assert!(released.elapsed() < Duration::from_millis(250), "took {:?}", released.elapsed());
}

#[test]
fn a_probe_leaves_no_shared_lock_behind() {
    let _serial = serial();
    let dir = temp_dir("wlfx-probe");
    let res = resource(&dir, "probe");
    drop(acquired(acquire(&res, Mode::Ex, Wait::Try, 2000)));
    for _ in 0..20 {
        assert_eq!(probe(&res).unwrap(), Probe::Free);
        release(acquired(acquire(&res, Mode::Ex, Wait::Try, 2000)));
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
    release(first);
    let second = acquired(waiter.join().unwrap());
    // The new handle holds the file now at the path, not the renamed one.
    assert!(matches!(acquire(&res, Mode::Ex, Wait::Try, 2000), Acquire::Held { .. }));
    let old = OpenOptions::new().read(true).write(true).open(&moved).unwrap();
    assert_eq!(driver::current().try_lock(&old, Mode::Ex).unwrap(), TryLock::Locked);
    assert!(!driver::current().same_file(&old, &res.path));
    release(second);
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
    release(handle);
    let result = acquire(&res, Mode::Ex, Wait::Try, 2000);
    kill_and_reap(&mut child);
    release(acquired(result));
}

#[test]
fn the_guarantee_is_lockfileex_kernel_job_scoped_with_unlistable_holders() {
    let dir = temp_dir("wlfx-guarantee");
    let g = guarantee(&dir);
    assert_eq!((g.driver, g.exclusion, g.borrow, g.holders, g.platform), ("lockfileex", Level::Kernel, Level::JobScoped, Level::Unsupported, "windows"));
    let res = resource(&dir, "holders");
    drop(acquired(acquire(&res, Mode::Ex, Wait::Try, 2000)));
    assert!(matches!(fgos_holder_lock::holders(&res).unwrap(), fgos_holder_lock::HoldersList::Unlistable(_)));
}
