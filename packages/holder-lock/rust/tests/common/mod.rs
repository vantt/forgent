//! Shared helpers of the holder-lock integration tests. The test binary
//! re-executes itself as a child process with `HL_TEST_ROLE` set; each test
//! file declares `#[test] fn child_entry() { common::child_entry() }`, which
//! does nothing in an ordinary run.
#![allow(dead_code)]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use fgos_holder_lock::{acquire, release, Acquire, Mode, Resource, Wait};
use fgos_process::{Domain, ProcId};

pub const ROLE: &str = "HL_TEST_ROLE";
pub const LOCK: &str = "HL_TEST_LOCK";
pub const READY: &str = "HL_TEST_READY";
pub const ARG: &str = "HL_TEST_ARG";

/// Tests of one binary run on parallel threads, and a fork on one thread
/// copies every description open in the process until the child execs: a
/// probe right after another test's release could see that copy. Each
/// lock test holds this for its whole run.
pub fn serial() -> std::sync::MutexGuard<'static, ()> {
    static SERIAL: std::sync::Mutex<()> = std::sync::Mutex::new(());
    SERIAL.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

pub fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-holder-lock-{tag}-{}-{nanos}", std::process::id()));
    fs::create_dir_all(&dir).expect("temp dir");
    dir
}

pub fn resource(dir: &Path, name: &str) -> Resource {
    Resource::new(name, dir.join(format!("{name}.lock")))
}

/// A child process killed and reaped when dropped, so a failing test never
/// leaves a holder behind (it would keep cargo's stderr pipe open).
pub struct Guard(pub Child);

impl std::ops::Deref for Guard {
    type Target = Child;
    fn deref(&self) -> &Child {
        &self.0
    }
}

impl std::ops::DerefMut for Guard {
    fn deref_mut(&mut self) -> &mut Child {
        &mut self.0
    }
}

impl Drop for Guard {
    fn drop(&mut self) {
        kill_and_reap(&mut self.0);
    }
}

/// Spawn this test binary as a child running `role` (through the test named
/// `child_entry`).
pub fn spawn_role(role: &str, lock: &Path, ready: &Path, arg: &str) -> Guard {
    Guard(Command::new(std::env::current_exe().expect("test binary"))
        .args(["--exact", "child_entry", "--nocapture", "--test-threads", "1"])
        .env(ROLE, role)
        .env(LOCK, lock)
        .env(READY, ready)
        .env(ARG, arg)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::inherit())
        .spawn()
        .expect("spawn child role"))
}

/// Wait until the child wrote its ready file; returns the file's text.
pub fn wait_ready(ready: &Path, child: &mut Child) -> String {
    let deadline = Instant::now() + Duration::from_secs(30);
    loop {
        if let Ok(text) = fs::read_to_string(ready) {
            if text.ends_with('\n') {
                return text.trim().to_string();
            }
        }
        if let Some(status) = child.try_wait().expect("try_wait") {
            panic!("child exited before it was ready: {status}");
        }
        assert!(Instant::now() < deadline, "child never became ready");
        std::thread::sleep(Duration::from_millis(5));
    }
}

pub fn kill_and_reap(child: &mut Child) {
    let _ = child.kill();
    let _ = child.wait();
}

fn write_ready(text: &str) {
    let path = std::env::var(READY).expect("ready path");
    let tmp = format!("{path}.tmp");
    fs::write(&tmp, format!("{text}\n")).expect("ready tmp");
    fs::rename(&tmp, &path).expect("ready rename");
}

fn hold_forever() -> ! {
    loop {
        std::thread::sleep(Duration::from_secs(3600));
    }
}

/// A gate-like process that ignores SIGTERM: only SIGKILL ends it.
pub fn spawn_term_ignoring_sleep() -> Child {
    Command::new("sh")
        .args(["-c", "trap '' TERM; exec sleep 1000"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .expect("spawn sleep")
}

/// The body of `child_entry` in every test file.
pub fn child_entry() {
    let Ok(role) = std::env::var(ROLE) else {
        return;
    };
    let lock = PathBuf::from(std::env::var(LOCK).expect("lock path"));
    let res = Resource::new("test", &lock);
    match role.as_str() {
        // Take the lock and keep it until killed.
        "holder" => {
            let handle = match acquire(&res, Mode::Ex, Wait::Ms(20_000), 2000) {
                Acquire::Acquired(h) => h,
                other => panic!("holder could not acquire: {other:?}"),
            };
            write_ready("held");
            let _keep = handle;
            hold_forever();
        }
        // Take the lock, start a SIGTERM-ignoring gate, declare it as the
        // domain, report the gate pid, keep the lock until killed.
        "gate-holder" => {
            let handle = match acquire(&res, Mode::Ex, Wait::Ms(20_000), 2000) {
                Acquire::Acquired(h) => h,
                other => panic!("gate holder could not acquire: {other:?}"),
            };
            let gate = spawn_term_ignoring_sleep();
            let tuple = loop {
                if let Some(t) = fgos_process::facts::identity_of(ProcId(gate.id())) {
                    break t;
                }
            };
            handle.declare_domain(&Domain::LinuxGate(tuple)).expect("declare domain");
            write_ready(&gate.id().to_string());
            let _keep = (handle, gate);
            hold_forever();
        }
        // Stress worker: ARG rounds of acquire, a critical section guarded by
        // a marker file, release.
        "stress" => {
            let rounds: u32 = std::env::var(ARG).unwrap().parse().unwrap();
            let marker = lock.with_extension("marker");
            let violations = lock.with_extension("violations");
            write_ready("started");
            for _ in 0..rounds {
                let handle = match acquire(&res, Mode::Ex, Wait::Ms(60_000), 2000) {
                    Acquire::Acquired(h) => h,
                    other => panic!("stress worker could not acquire: {other:?}"),
                };
                if let Ok(text) = fs::read_to_string(&marker) {
                    // A marker left by a holder that was killed inside the
                    // critical section is fine; one of a live process is not.
                    // The kernel drops a SIGKILLed holder's lock while the
                    // process is still tearing down, before it turns into a
                    // zombie, so a killed holder can still read as live here:
                    // the test names every pid it kills before the signal.
                    let pid: u32 = text.trim().parse().unwrap_or(0);
                    let killed = fs::read_to_string(lock.with_extension("killed")).unwrap_or_default();
                    let was_killed = killed.lines().any(|line| line.trim() == pid.to_string());
                    if !was_killed && matches!(fgos_process::facts::observe(ProcId(pid)), fgos_process::facts::Observed::Live { .. }) {
                        use std::io::Write;
                        let mut f = fs::OpenOptions::new().create(true).append(true).open(&violations).unwrap();
                        writeln!(f, "{} entered while {pid} was inside", std::process::id()).unwrap();
                    }
                }
                fs::write(&marker, std::process::id().to_string()).unwrap();
                std::thread::sleep(Duration::from_micros(500 + u64::from(std::process::id() % 7) * 300));
                fs::remove_file(&marker).unwrap();
                assert!(matches!(release(handle), fgos_holder_lock::Release::Released { .. }));
            }
            std::process::exit(0);
        }
        other => panic!("unknown role {other}"),
    }
}

pub fn percentile(sorted: &[f64], p: f64) -> f64 {
    if sorted.is_empty() {
        return 0.0;
    }
    let idx = ((sorted.len() as f64 - 1.0) * p).round() as usize;
    sorted[idx]
}
