//! The activation lock and the main checkout probe against real processes: a held lock refuses,
//! a killed holder frees it at once, the description never leaks into a spawned child, and the
//! main checkout probe sees a kernel holder and passes over a tombstone.
#![cfg(unix)]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use fgos_distribution::init::{activation_lock_path, ActivationLockGuard, InitError};
use fgos_distribution::lock::{check_main_checkout_lock, MainCheckoutLockError};
use fgos_holder_lock::{acquire, Acquire, Mode, Resource, Wait};

const ROLE: &str = "ACT_TEST_ROLE";
const LOCK: &str = "ACT_TEST_LOCK";
const READY: &str = "ACT_TEST_READY";

/// Re-executed by the tests below as the holder process; does nothing in an ordinary run.
#[test]
fn child_entry() {
    let Ok(role) = std::env::var(ROLE) else {
        return;
    };
    assert_eq!(role, "holder");
    let lock = PathBuf::from(std::env::var(LOCK).expect("lock path"));
    let res = Resource::new("test", &lock);
    let handle = match acquire(&res, Mode::Ex, Wait::Ms(20_000), 2000) {
        Acquire::Acquired(handle) => handle,
        other => panic!("holder could not acquire: {other:?}"),
    };
    let ready = std::env::var(READY).expect("ready path");
    fs::write(format!("{ready}.tmp"), "held\n").unwrap();
    fs::rename(format!("{ready}.tmp"), &ready).unwrap();
    let _keep = handle;
    loop {
        std::thread::sleep(Duration::from_secs(3600));
    }
}

struct Holder(Child);

impl Holder {
    fn spawn(lock: &Path, ready: &Path) -> Holder {
        let mut child = Command::new(std::env::current_exe().unwrap())
            .args(["--exact", "child_entry", "--nocapture", "--test-threads", "1"])
            .env(ROLE, "holder")
            .env(LOCK, lock)
            .env(READY, ready)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::inherit())
            .spawn()
            .expect("spawn holder");
        let deadline = Instant::now() + Duration::from_secs(30);
        while !ready.exists() {
            if let Some(status) = child.try_wait().unwrap() {
                panic!("holder exited before it held the lock: {status}");
            }
            assert!(Instant::now() < deadline, "holder never became ready");
            std::thread::sleep(Duration::from_millis(5));
        }
        Holder(child)
    }

    fn kill(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

impl Drop for Holder {
    fn drop(&mut self) {
        self.kill();
    }
}

fn temp_workspace(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-activation-{tag}-{}-{nanos}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    dir
}

/// One lock test at a time: a fork on one test thread copies every description open in the
/// process until the child execs, which could keep another test's lock alive.
fn serial() -> std::sync::MutexGuard<'static, ()> {
    static SERIAL: std::sync::Mutex<()> = std::sync::Mutex::new(());
    SERIAL.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

#[test]
fn a_held_activation_lock_refuses_and_a_killed_holder_frees_it_at_once() {
    let _serial = serial();
    let ws = temp_workspace("held");
    let lock = activation_lock_path(&ws);
    fs::create_dir_all(lock.parent().unwrap()).unwrap();
    let mut holder = Holder::spawn(&lock, &ws.join("ready"));

    match ActivationLockGuard::acquire(&ws) {
        Err(InitError::ActivationLockHeld(reason)) => assert_eq!(reason, "kernel-lock-held"),
        Err(other) => panic!("expected ActivationLockHeld, got {other}"),
        Ok(_) => panic!("a held activation lock must refuse"),
    }

    holder.kill();
    let started = Instant::now();
    let guard = ActivationLockGuard::acquire(&ws).expect("a dead holder frees the lock");
    assert!(started.elapsed() < Duration::from_millis(50), "took {:?}: no reclaim window may exist", started.elapsed());
    drop(guard);
    fs::remove_dir_all(&ws).ok();
}

#[test]
fn two_guards_in_one_process_exclude_each_other_and_drop_releases() {
    let _serial = serial();
    let ws = temp_workspace("two");
    let first = ActivationLockGuard::acquire(&ws).expect("first");
    assert!(matches!(ActivationLockGuard::acquire(&ws), Err(InitError::ActivationLockHeld(_))));
    drop(first);
    drop(ActivationLockGuard::acquire(&ws).expect("after drop"));
    fs::remove_dir_all(&ws).ok();
}

#[test]
fn the_activation_description_does_not_leak_into_a_spawned_child() {
    let _serial = serial();
    let ws = temp_workspace("leak");
    let guard = ActivationLockGuard::acquire(&ws).expect("acquire");
    let mut child = Command::new("sleep").arg("30").stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).spawn().unwrap();
    let lock = fs::canonicalize(activation_lock_path(&ws)).unwrap();
    let mut open_on_lock = Vec::new();
    for entry in fs::read_dir(format!("/proc/{}/fd", child.id())).unwrap().flatten() {
        if let Ok(target) = fs::read_link(entry.path()) {
            if target == lock {
                open_on_lock.push(entry.path());
            }
        }
    }
    let _ = child.kill();
    let _ = child.wait();
    drop(guard);
    fs::remove_dir_all(&ws).ok();
    assert!(open_on_lock.is_empty(), "the child inherited the lock description: {open_on_lock:?}");
}

#[test]
fn the_main_checkout_probe_sees_a_kernel_holder_and_passes_over_a_tombstone() {
    let _serial = serial();
    let ws = temp_workspace("main");
    let v3 = ws.join(".fgos").join("locks").join("main-checkout.lock");
    fs::create_dir_all(v3.parent().unwrap()).unwrap();
    assert!(check_main_checkout_lock(&ws).is_ok(), "no holder: free");

    let mut holder = Holder::spawn(&v3, &ws.join("ready"));
    assert!(matches!(check_main_checkout_lock(&ws), Err(MainCheckoutLockError::HeldV3)));
    holder.kill();
    assert!(check_main_checkout_lock(&ws).is_ok(), "holder gone: free");

    // The v1 path as a directory is the tombstone: the v1 read is skipped.
    let v1 = ws.join(".fgos").join("main-checkout.lock");
    fs::create_dir_all(&v1).unwrap();
    fs::write(v1.join("TOMBSTONE"), "moved\n").unwrap();
    assert!(check_main_checkout_lock(&ws).is_ok());
    fs::remove_dir_all(&ws).ok();
}
