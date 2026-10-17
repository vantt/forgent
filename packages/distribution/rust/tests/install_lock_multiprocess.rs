//! The machine-wide `install.lock` against real processes: a held lock refuses staging, a killed
//! holder frees it at once, and the lock sits at `<stateRoot>/locks/install.lock` for every state
//! root variable.
#![cfg(unix)]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use fgos_distribution::store::{install_lock_path, stage_release, InstallLockGuard, LockError, StageError};
use fgos_holder_lock::{acquire, lock_root, Acquire, Mode, Resource, Wait};

const ROLE: &str = "INSTALL_TEST_ROLE";
const LOCK: &str = "INSTALL_TEST_LOCK";
const READY: &str = "INSTALL_TEST_READY";

/// Re-executed by the tests below as the holder process; does nothing in an ordinary run.
#[test]
fn child_entry() {
    let Ok(role) = std::env::var(ROLE) else {
        return;
    };
    assert_eq!(role, "holder");
    let lock = PathBuf::from(std::env::var(LOCK).expect("lock path"));
    let res = Resource::new("install", &lock);
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

fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-install-{tag}-{}-{nanos}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    dir
}

/// One lock test at a time (a fork copies every open description until the child execs), and
/// the state root variable test needs the process environment to itself.
fn serial() -> std::sync::MutexGuard<'static, ()> {
    static SERIAL: std::sync::Mutex<()> = std::sync::Mutex::new(());
    SERIAL.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

#[test]
fn a_held_install_lock_refuses_staging_and_a_killed_holder_frees_it_at_once() {
    let _serial = serial();
    let store = temp_dir("held");
    let lock = install_lock_path(&store);
    fs::create_dir_all(lock.parent().unwrap()).unwrap();
    let mut holder = Holder::spawn(&lock, &store.join("ready"));

    assert!(matches!(InstallLockGuard::acquire(&store), Err(LockError::AlreadyInProgress)));
    let source = temp_dir("source");
    assert!(
        matches!(stage_release(&store, &source), Err(StageError::Lock(LockError::AlreadyInProgress))),
        "stage_release must meet the held lock before it reads the candidate"
    );
    fs::remove_dir_all(&source).ok();

    holder.kill();
    let started = Instant::now();
    let guard = InstallLockGuard::acquire(&store).expect("a dead holder frees the lock");
    assert!(started.elapsed() < Duration::from_millis(50), "took {:?}: no reclaim window may exist", started.elapsed());
    drop(guard);
    fs::remove_dir_all(&store).ok();
}

#[test]
fn two_guards_in_one_process_exclude_each_other_and_drop_releases() {
    let _serial = serial();
    let store = temp_dir("two");
    let first = InstallLockGuard::acquire(&store).expect("first");
    assert!(matches!(InstallLockGuard::acquire(&store), Err(LockError::AlreadyInProgress)));
    drop(first);
    drop(InstallLockGuard::acquire(&store).expect("after drop"));
    fs::remove_dir_all(&store).ok();
}

#[test]
fn the_lock_sits_under_the_lock_root_for_every_state_root_variable() {
    let _serial = serial();
    let saved: Vec<(&str, Option<String>)> =
        ["FGOS_STATE_ROOT", "FGOS_STATE_HOME", "XDG_STATE_HOME", "HOME"].iter().map(|k| (*k, std::env::var(k).ok())).collect();
    let base = temp_dir("roots");

    let cases: [(&str, PathBuf); 3] = [
        ("FGOS_STATE_HOME", base.join("fgos-home")),
        ("XDG_STATE_HOME", base.join("xdg").join("fgos")),
        ("HOME", base.join("home").join(".local").join("state").join("fgos")),
    ];
    for (var, expected_state_root) in cases {
        for (key, _) in &saved {
            std::env::remove_var(key);
        }
        let value = match var {
            "XDG_STATE_HOME" => base.join("xdg"),
            "HOME" => base.join("home"),
            _ => expected_state_root.clone(),
        };
        std::env::set_var(var, &value);
        // The caller passes the machine release store root, the same formula as the state root.
        let store_root = fgos_distribution::store::resolve_machine_release_store_root();
        assert_eq!(store_root, expected_state_root, "{var}: state root");
        let guard = InstallLockGuard::acquire(&store_root).expect("acquire");
        let expected_lock = expected_state_root.join("locks").join("install.lock");
        assert_eq!(install_lock_path(&store_root), expected_lock, "{var}: lock path");
        assert_eq!(lock_root().join("install.lock"), expected_lock, "{var}: crate lock root");
        assert!(expected_lock.is_file(), "{var}: lock file exists at {expected_lock:?}");
        drop(guard);
    }

    for (key, value) in saved {
        match value {
            Some(v) => std::env::set_var(key, v),
            None => std::env::remove_var(key),
        }
    }
    fs::remove_dir_all(&base).ok();
}
