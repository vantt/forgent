//! The observe store lock against real processes. The test binary re-executes
//! itself as a child (`OBS_TEST_ROLE`); `child_entry` does nothing in an
//! ordinary run.
#![cfg(unix)]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use fgos_observe::contract::{
    ObserveRequest, SourceError, WorkEntropySignalsRecord, WorkObservationSource, WorkOutcomesRecord,
};
use fgos_observe::metrics_cli::snapshot::dispatch_snapshot;
use fgos_observe::store_lock::{
    acquire_store_lock, acquire_store_lock_within, observe_lock_path, ObserveLockError, ACQUIRE_TIMEOUT,
};

const ROLE: &str = "OBS_TEST_ROLE";
const ROOT: &str = "OBS_TEST_ROOT";
const READY: &str = "OBS_TEST_READY";
const ARG: &str = "OBS_TEST_ARG";

struct EmptyWork;

impl WorkObservationSource for EmptyWork {
    fn read_outcomes_report(&self, _root: &Path, _filter_id: Option<&str>) -> Result<WorkOutcomesRecord, SourceError> {
        Ok(WorkOutcomesRecord { outcomes: Vec::new(), settlement: None, learning: None, missing_outcome_nag: None })
    }

    fn read_entropy_signals(&self, _root: &Path) -> Result<WorkEntropySignalsRecord, SourceError> {
        Ok(WorkEntropySignalsRecord::default())
    }
}

fn snapshot_request(root: &Path) -> ObserveRequest {
    ObserveRequest {
        operation: "metrics".into(),
        sub: "snapshot".into(),
        args: Vec::new(),
        root: root.to_path_buf(),
        stdin: None,
    }
}

/// Role body. `hold`: take the lock, report ready, keep it ARG ms (0 = until
/// killed). `snapshot`: ARG snapshots through the real command.
#[test]
fn child_entry() {
    let Ok(role) = std::env::var(ROLE) else { return };
    let root = PathBuf::from(std::env::var(ROOT).expect("root"));
    let arg: u64 = std::env::var(ARG).ok().and_then(|v| v.parse().ok()).unwrap_or(0);
    match role.as_str() {
        "hold" => {
            let guard = acquire_store_lock_within(&root, Duration::from_secs(20)).expect("holder acquires");
            let ready = std::env::var(READY).expect("ready path");
            fs::write(&ready, "held\n").expect("ready file");
            if arg == 0 {
                loop {
                    std::thread::sleep(Duration::from_secs(3600));
                }
            }
            std::thread::sleep(Duration::from_millis(arg));
            guard.release();
        }
        "snapshot" => {
            for _ in 0..arg {
                dispatch_snapshot(&snapshot_request(&root), &EmptyWork).expect("snapshot");
            }
        }
        other => panic!("unknown role {other}"),
    }
}

struct Reaped(Child);

impl Drop for Reaped {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

fn temp_root(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-observe-lock-{tag}-{}-{nanos}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn spawn(role: &str, root: &Path, ready: &Path, arg: u64, session: Option<&str>) -> Reaped {
    let mut cmd = Command::new(std::env::current_exe().unwrap());
    cmd.args(["--exact", "child_entry", "--nocapture", "--test-threads", "1"])
        .env(ROLE, role)
        .env(ROOT, root)
        .env(READY, ready)
        .env(ARG, arg.to_string())
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::inherit());
    if let Some(id) = session {
        cmd.env("FGOS_SESSION_ID", id);
    }
    Reaped(cmd.spawn().expect("spawn child"))
}

fn wait_ready(ready: &Path, child: &mut Reaped) {
    let deadline = Instant::now() + Duration::from_secs(30);
    while !ready.exists() {
        if let Some(status) = child.0.try_wait().unwrap() {
            panic!("child exited before it was ready: {status}");
        }
        assert!(Instant::now() < deadline, "child never became ready");
        std::thread::sleep(Duration::from_millis(5));
    }
}

#[test]
fn a_taker_waits_for_a_holder_that_releases() {
    let root = temp_root("wait");
    let ready = root.join("ready");
    let mut holder = spawn("hold", &root, &ready, 1000, None);
    wait_ready(&ready, &mut holder);
    let started = Instant::now();
    let guard = acquire_store_lock(&root).expect("waits, then takes it");
    let waited = started.elapsed();
    assert!(waited >= Duration::from_millis(400), "must have waited for the holder: {waited:?}");
    assert!(waited < ACQUIRE_TIMEOUT, "released holder must not cost the full timeout: {waited:?}");
    drop(guard);
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn a_taker_times_out_on_a_holder_that_never_releases() {
    let root = temp_root("timeout");
    let ready = root.join("ready");
    let mut holder = spawn("hold", &root, &ready, 0, None);
    wait_ready(&ready, &mut holder);
    let wait = Duration::from_millis(300);
    let started = Instant::now();
    match acquire_store_lock_within(&root, wait) {
        Err(ObserveLockError::Timeout(path)) => assert_eq!(path, observe_lock_path(&root)),
        other => panic!("expected observe-lock-timeout: {:?}", other.err()),
    }
    let waited = started.elapsed();
    assert!(waited >= wait && waited < wait + Duration::from_secs(2), "{waited:?}");
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn a_sigkilled_holder_frees_the_lock_at_once() {
    let root = temp_root("sigkill");
    let ready = root.join("ready");
    let mut holder = spawn("hold", &root, &ready, 0, None);
    wait_ready(&ready, &mut holder);
    holder.0.kill().unwrap();
    holder.0.wait().unwrap();
    let started = Instant::now();
    let guard = acquire_store_lock_within(&root, Duration::from_millis(200)).expect("free right after SIGKILL");
    assert!(started.elapsed() < Duration::from_millis(200));
    drop(guard);
    let _ = fs::remove_dir_all(&root);
}

#[test]
fn processes_sharing_a_writer_id_never_interleave_snapshot_lines() {
    let root = temp_root("snapshots");
    let ready = root.join("unused");
    let mut children: Vec<Reaped> =
        (0..4).map(|_| spawn("snapshot", &root, &ready, 200, Some("shared-writer"))).collect();
    for child in &mut children {
        let status = child.0.wait().unwrap();
        assert!(status.success(), "snapshot worker failed: {status}");
    }
    let shard = root.join(".fgos/observe/snapshots/shared-writer.jsonl");
    let text = fs::read_to_string(&shard).expect("shard exists");
    let lines: Vec<&str> = text.lines().collect();
    assert_eq!(lines.len(), 800);
    for line in lines {
        serde_json::from_str::<serde_json::Value>(line).expect("every shard line is whole JSON");
    }
    let _ = fs::remove_dir_all(&root);
}
