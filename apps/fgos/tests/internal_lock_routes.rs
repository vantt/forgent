//! `fgos internal ...` through the real host binary, the way the Node
//! facade calls it: this test process owns the lock file description (as
//! Node does) and hands it to the route at fd 3.
#![cfg(target_os = "linux")]

use std::fs::{self, File, OpenOptions};
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};
use std::time::{Duration, Instant};

use fgos_holder_lock::predecessor::{declare, record_path};
use fgos_holder_lock::{acquire, probe, release, run_borrowed, Acquire, BorrowSpec, BorrowStdio, Mode, Probe, Release, Resource, Wait};
use fgos_process::facts::{identity_of, lock_holders, observe, Holders, Observed};
use fgos_process::{Domain, FdSlot, ProcId};
use serde_json::Value;

/// Tests of one binary run on parallel threads, and a fork on one thread
/// copies every description open in the process until the child execs: a
/// probe right after another test's release could see that copy. Each
/// lock test holds this for its whole run.
fn serial() -> std::sync::MutexGuard<'static, ()> {
    static SERIAL: std::sync::Mutex<()> = std::sync::Mutex::new(());
    SERIAL.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn fgos() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_fgos"))
}

fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-internal-routes-{tag}-{}-{nanos}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn open_rw(path: &Path) -> File {
    OpenOptions::new().read(true).write(true).create(true).truncate(false).open(path).unwrap()
}

fn base(args: &[&str]) -> Command {
    let mut cmd = Command::new(fgos());
    cmd.arg("internal").args(args).stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped());
    cmd.env_remove("FGOS_LOCK_FD");
    cmd
}

/// Run a route with `fd3` mapped at slot 3.
fn route_fd(args: &[&str], fd3: &File) -> Output {
    let child = fgos_process::control::spawn_with_fds(base(args), &[(FdSlot(3), fd3)]).unwrap();
    child.wait_with_output().unwrap()
}

fn route(args: &[&str]) -> Output {
    base(args).output().unwrap()
}

fn json_line(out: &Output) -> Value {
    let text = String::from_utf8_lossy(&out.stdout);
    assert_eq!(text.lines().count(), 1, "exactly one stdout line, got {text:?} (stderr {})", String::from_utf8_lossy(&out.stderr));
    let v: Value = serde_json::from_str(text.trim()).unwrap();
    assert_eq!(v["v"], v["protocol"]);
    v
}

fn others_holding(path: &Path) -> Vec<u32> {
    use std::os::unix::fs::MetadataExt;
    let meta = fs::metadata(path).unwrap();
    match lock_holders(meta.dev(), meta.ino()) {
        Holders::List(list) => list.into_iter().map(|t| t.pid.0).filter(|p| *p != std::process::id()).collect(),
        Holders::Unlistable => panic!("Linux lists holders"),
    }
}

#[test]
fn the_lock_stays_with_the_callers_description_after_the_helper_exits() {
    let _serial = serial();
    let dir = temp_dir("keep");
    let res = Resource::new("keep", dir.join("keep.lock"));
    let file = open_rw(&res.path);
    let out = route_fd(&["lock-fd", "--protocol", "2", "--try"], &file);
    assert_eq!(out.status.code(), Some(0));
    assert_eq!(json_line(&out)["result"], "acquired");
    assert_eq!(probe(&res).unwrap(), Probe::Held, "the helper exited; the caller still holds");
    assert!(others_holding(&res.path).is_empty(), "no process but the caller holds the description after the route exited");
    // A second description, in a route call, is refused.
    let other = open_rw(&res.path);
    let held = route_fd(&["lock-fd", "--protocol", "2", "--try"], &other);
    assert_eq!(held.status.code(), Some(10));
    let v = json_line(&held);
    assert_eq!((v["result"].as_str(), v["reason"].as_str()), (Some("held"), Some("kernel-lock-held")));
    drop(other);
    drop(file);
    assert_eq!(probe(&res).unwrap(), Probe::Free, "closing the caller's description releases");
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn wait_ms_times_out_and_leaves_nothing_on_the_description() {
    let _serial = serial();
    let dir = temp_dir("wait");
    let res = Resource::new("wait", dir.join("wait.lock"));
    let owner = match acquire(&res, Mode::Ex, Wait::Try, 2000) {
        Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    };
    let file = open_rw(&res.path);
    let started = Instant::now();
    let out = route_fd(&["lock-fd", "--protocol", "2", "--wait-ms", "300"], &file);
    let took = started.elapsed();
    assert_eq!(out.status.code(), Some(11));
    let v = json_line(&out);
    assert_eq!(v["result"], "timeout");
    assert!(v["waitedMs"].as_u64().unwrap() >= 300);
    assert!(took >= Duration::from_millis(300) && took < Duration::from_secs(2), "{took:?}");
    assert!(matches!(release(owner), Release::Released { .. }));
    // The timed-out description holds nothing: a fresh acquire succeeds
    // while it is still open.
    match acquire(&res, Mode::Ex, Wait::Try, 2000) {
        Acquire::Acquired(h) => assert!(matches!(release(h), Release::Released { .. })),
        other => panic!("timed-out description kept the lock: {other:?}"),
    }
    drop(file);
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn shared_try_answers_free_or_held_and_guarantee_names_the_driver() {
    let _serial = serial();
    let dir = temp_dir("shared");
    let res = Resource::new("shared", dir.join("shared.lock"));
    let file = open_rw(&res.path);
    let free = route_fd(&["lock-fd", "--protocol", "2", "--shared-try"], &file);
    assert_eq!((free.status.code(), json_line(&free)["result"].clone()), (Some(0), Value::from("free")));
    drop(file);
    let owner = match acquire(&res, Mode::Ex, Wait::Try, 2000) {
        Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    };
    let file = open_rw(&res.path);
    let held = route_fd(&["lock-fd", "--protocol", "2", "--shared-try"], &file);
    assert_eq!((held.status.code(), json_line(&held)["result"].clone()), (Some(10), Value::from("held")));
    drop(file);
    assert!(matches!(release(owner), Release::Released { .. }));
    let g = route(&["lock-fd", "--protocol", "2", "--guarantee", &res.path.to_string_lossy()]);
    assert_eq!(g.status.code(), Some(0));
    let v = json_line(&g);
    assert_eq!(v["result"], "guarantee");
    assert_eq!(v["guarantee"]["driver"], "flock");
    assert_eq!(v["guarantee"]["exclusion"], "kernel");
    assert_eq!(v["guarantee"]["holders"], "kernel");
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn borrowed_check_accepts_the_borrowed_description_and_refuses_a_sibling() {
    let _serial = serial();
    let dir = temp_dir("borrow");
    let res = Resource::new("main", dir.join("main.lock"));
    let owner = match acquire(&res, Mode::Ex, Wait::Try, 2000) {
        Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    };
    let lock = res.path.to_string_lossy().into_owned();
    // The holder's own description, handed through run_borrowed.
    let marker = dir.join("borrower.out");
    let spec = BorrowSpec {
        argv: vec!["sh".into(), "-c".into(), format!("'{}' internal lock-fd --protocol 2 --borrowed-check '{lock}' > '{}'", fgos().display(), marker.display())],
        cwd: None,
        env: Default::default(),
        clear_env: false,
        stdio: BorrowStdio::Null,
    };
    let outcome = run_borrowed(&owner, &spec, &fgos_holder_lock::HelperExe(fgos())).unwrap();
    assert_eq!(outcome.exit, Some(0), "{}", fs::read_to_string(&marker).unwrap_or_default());
    assert_eq!(serde_json::from_str::<Value>(fs::read_to_string(&marker).unwrap().trim()).unwrap()["result"], "borrower");
    // A sibling with the same env that opened the file itself.
    let sibling = open_rw(&res.path);
    let mut cmd = base(&["lock-fd", "--protocol", "2", "--borrowed-check", &lock]);
    cmd.env("FGOS_LOCK_FD", "main:3");
    let out = fgos_process::control::spawn_with_fds(cmd, &[(FdSlot(3), &sibling)]).unwrap().wait_with_output().unwrap();
    assert_eq!(out.status.code(), Some(10));
    let v = json_line(&out);
    assert_eq!((v["result"].as_str(), v["reason"].as_str()), (Some("not-borrower"), Some("lock-not-held-by-description")));
    // No env naming the slot.
    let out = route_fd(&["lock-fd", "--protocol", "2", "--borrowed-check", &lock], &sibling);
    assert_eq!(json_line(&out)["reason"], "fd-missing");
    // Another file at the slot.
    let stranger = open_rw(&dir.join("other.lock"));
    let mut cmd = base(&["lock-fd", "--protocol", "2", "--borrowed-check", &lock]);
    cmd.env("FGOS_LOCK_FD", "main:3");
    let out = fgos_process::control::spawn_with_fds(cmd, &[(FdSlot(3), &stranger)]).unwrap().wait_with_output().unwrap();
    assert_eq!(json_line(&out)["reason"], "inode-mismatch");
    assert!(matches!(release(owner), Release::Released { .. }));
    let _ = fs::remove_dir_all(&dir);
}

fn spawn_term_ignoring_sleep() -> std::process::Child {
    Command::new("sh").args(["-c", "trap '' TERM; exec sleep 1000"]).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).spawn().unwrap()
}

fn tuple_of(child: &std::process::Child) -> fgos_process::facts::ProcTuple {
    loop {
        if let Some(t) = identity_of(ProcId(child.id())) {
            return t;
        }
    }
}

#[test]
fn lock_fd_runs_the_predecessor_rule_before_answering_acquired() {
    let _serial = serial();
    let dir = temp_dir("predecessor");
    let lock = dir.join("pred.lock");
    let record = record_path(&lock);
    // A live, SIGTERM-ignoring gate: killed at once, then acquired.
    let mut gate = spawn_term_ignoring_sleep();
    declare(&record, &Domain::LinuxGate(tuple_of(&gate))).unwrap();
    let file = open_rw(&lock);
    let out = route_fd(&["lock-fd", "--protocol", "2", "--try", "--kill-wait-ms", "2000"], &file);
    assert_eq!((out.status.code(), json_line(&out)["result"].clone()), (Some(0), Value::from("acquired")));
    assert!(matches!(observe(ProcId(gate.id())), Observed::Absent | Observed::Zombie), "acquired while the gate lived");
    let _ = gate.wait();
    assert!(!record.exists());
    drop(file);
    // A stale record: acquired at once, record removed.
    let mut dead = spawn_term_ignoring_sleep();
    let tuple = tuple_of(&dead);
    let _ = dead.kill();
    let _ = dead.wait();
    declare(&record, &Domain::LinuxGate(tuple)).unwrap();
    let file = open_rw(&lock);
    let out = route_fd(&["lock-fd", "--protocol", "2", "--try"], &file);
    assert_eq!(json_line(&out)["result"], "acquired");
    assert!(!record.exists());
    drop(file);
    // An unkillable domain (pid 1): held, named, and the caller's close frees it.
    if unsafe { libc::geteuid() } != 0 {
        declare(&record, &Domain::LinuxGate(identity_of(ProcId(1)).unwrap())).unwrap();
        let file = open_rw(&lock);
        let out = route_fd(&["lock-fd", "--protocol", "2", "--try", "--kill-wait-ms", "200"], &file);
        assert_eq!(out.status.code(), Some(10));
        let v = json_line(&out);
        assert_eq!(v["result"], "held");
        assert_eq!(v["reason"], "predecessor-domain-not-empty");
        assert_eq!(v["domain"]["domainKind"], "linux-gate");
        assert_eq!(v["domain"]["domainId"]["pid"], 1);
        drop(file);
        assert_eq!(probe(&Resource::new("pred", &lock)).unwrap(), Probe::Free);
    }
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn predecessor_state_reads_the_record_once_and_never_kills() {
    let _serial = serial();
    let dir = temp_dir("predecessor-state");
    let lock = dir.join("state.lock");
    let record = record_path(&lock);
    let lock_arg = lock.to_str().unwrap();
    let state = || {
        let out = route(&["lock-fd", "--protocol", "2", "--predecessor-state", lock_arg]);
        assert_eq!(out.status.code(), Some(0));
        json_line(&out)
    };
    assert_eq!(state()["state"], "absent");
    // A live, SIGTERM-ignoring gate: reported not empty, and left running.
    let mut gate = spawn_term_ignoring_sleep();
    declare(&record, &Domain::LinuxGate(tuple_of(&gate))).unwrap();
    let v = state();
    assert_eq!((v["result"].clone(), v["state"].clone(), v["domain"]["domainKind"].clone()), ("predecessor".into(), "not-empty".into(), "linux-gate".into()));
    assert!(matches!(observe(ProcId(gate.id())), Observed::Live { .. }), "the read-only route must not kill");
    assert!(record.exists());
    let tuple = tuple_of(&gate);
    let _ = gate.kill();
    let _ = gate.wait();
    declare(&record, &Domain::LinuxGate(tuple)).unwrap();
    assert_eq!(state()["state"], "empty");
    assert!(record.exists(), "an empty domain is not cleaned up by a read");
    // A windows-job record cannot be judged on Linux.
    fs::write(&record, r#"{"v":1,"domainKind":"windows-job","domainId":{"job":"Local\\j","sessionId":"1","declaredAt":"2","holder":{"host":"h","pid":7,"startTime":"3"},"keeper":null}}"#).unwrap();
    let v = state();
    assert_eq!((v["state"].clone(), v["reason"].clone()), ("unknown".into(), "no-judge-on-this-platform".into()));
    fs::write(&record, "{not json").unwrap();
    assert_eq!(state()["state"], "unknown");
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn probe_opens_its_own_description_and_answers_free_or_held() {
    let _serial = serial();
    let dir = temp_dir("probe");
    let res = Resource::new("probe", dir.join("probe.lock"));
    let path = res.path.to_string_lossy().into_owned();
    // A lock file that does not exist is free, and the probe does not create it.
    let none = route(&["lock-fd", "--protocol", "2", "--probe", &path]);
    assert_eq!((none.status.code(), json_line(&none)["result"].clone()), (Some(0), Value::from("free")));
    assert!(!res.path.exists());
    let owner = match acquire(&res, Mode::Ex, Wait::Try, 2000) {
        Acquire::Acquired(h) => h,
        other => panic!("{other:?}"),
    };
    let held = route(&["lock-fd", "--protocol", "2", "--probe", &path]);
    assert_eq!((held.status.code(), json_line(&held)["result"].clone()), (Some(10), Value::from("held")));
    assert!(matches!(release(owner), Release::Released { .. }));
    let free = route(&["lock-fd", "--protocol", "2", "--probe", &path]);
    assert_eq!((free.status.code(), json_line(&free)["result"].clone()), (Some(0), Value::from("free")));
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn lock_hold_is_refused_by_name_off_windows_and_checks_its_usage() {
    let _serial = serial();
    let dir = temp_dir("hold-usage");
    let path = dir.join("hold.lock").to_string_lossy().into_owned();
    let work = dir.to_string_lossy().into_owned();
    let out = route(&["lock-hold", "--protocol", "2", "--path", &path, "--mode", "ex", "--work", &work, "--try"]);
    assert_eq!(out.status.code(), Some(12));
    let v = json_line(&out);
    assert_eq!((v["result"].as_str(), v["reason"].as_str()), (Some("unavailable"), Some("unsupported-platform")));
    for args in [
        vec!["lock-hold", "--protocol", "2", "--path", &path, "--mode", "ex", "--work", &work],
        vec!["lock-hold", "--protocol", "2", "--path", &path, "--mode", "rw", "--work", &work, "--try"],
        vec!["lock-hold", "--protocol", "2", "--mode", "ex", "--work", &work, "--try"],
        vec!["lock-hold", "--protocol", "2", "--path", &path, "--mode", "ex", "--work", &work, "--try", "--wait-ms", "5"],
    ] {
        let out = route(&args);
        assert_eq!(out.status.code(), Some(2), "{args:?}");
        assert_eq!(json_line(&out)["code"], "usage", "{args:?}");
    }
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn protocol_and_usage_errors_fail_closed() {
    let _serial = serial();
    // Protocol 1 is the retired lock protocol: every lock route refuses it and answers 2, so a payload of the
    // first release fails closed. quiesce-scan keeps protocol 1 and answers it.
    let lock_routes = [
        vec!["state-root"],
        vec!["state-root", "--protocol", "1"],
        vec!["state-root", "--protocol", "3"],
        vec!["lock-fd", "--try"],
        vec!["lock-fd", "--protocol", "1", "--try"],
        vec!["lock-hold", "--protocol", "1", "--path", "/x", "--mode", "ex", "--work", "/x"],
        vec!["lock-borrow-vectors", "--protocol", "1"],
    ];
    for args in lock_routes {
        let out = route(&args);
        assert_eq!(out.status.code(), Some(3), "{args:?}");
        let v = json_line(&out);
        assert_eq!(v["protocol"], 2, "{args:?}");
        assert_eq!((v["result"].as_str(), v["code"].as_str()), (Some("error"), Some("host-version-mismatch")), "{args:?}");
        assert!(String::from_utf8_lossy(&out.stderr).contains("host-version-mismatch"));
    }
    for args in [vec!["quiesce-scan", "--protocol", "0", "--root", "/"], vec!["quiesce-scan", "--protocol", "2", "--root", "/"]] {
        let out = route(&args);
        assert_eq!(out.status.code(), Some(3), "{args:?}");
        let v = json_line(&out);
        assert_eq!((v["protocol"].clone(), v["code"].as_str()), (serde_json::json!(1), Some("host-version-mismatch")), "{args:?}");
    }
    for args in [vec!["nope", "--protocol", "2"], vec!["lock-fd", "--protocol", "2"], vec!["lock-fd", "--protocol", "2", "--try", "--shared-try"], vec!["lock-fd", "--protocol", "2", "--bogus"], vec!["quiesce-scan", "--protocol", "1"]] {
        let out = route(&args);
        assert_eq!(out.status.code(), Some(2), "{args:?}");
        assert_eq!(json_line(&out)["code"], "usage", "{args:?}");
    }
    let out = Command::new(fgos()).arg("internal").output().unwrap();
    assert_eq!(out.status.code(), Some(2));
}

#[test]
fn state_root_route_resolves_the_one_root() {
    let _serial = serial();
    let out = base(&["state-root", "--protocol", "2"]).env("FGOS_STATE_HOME", "/custom/state").env_remove("FGOS_STATE_ROOT").output().unwrap();
    assert_eq!(out.status.code(), Some(0));
    let v = json_line(&out);
    assert_eq!((v["stateRoot"].as_str(), v["lockRoot"].as_str(), v["source"].as_str()), (Some("/custom/state"), Some("/custom/state/locks"), Some("fgos-state-home")));
    let out = base(&["state-root", "--protocol", "2"]).env("FGOS_STATE_ROOT", "/pinned/fgos").env("HOME", "/sandbox").output().unwrap();
    let v = json_line(&out);
    assert_eq!((v["stateRoot"].as_str(), v["source"].as_str()), (Some("/pinned/fgos"), Some("pinned")));
}

#[test]
fn quiesce_scan_lists_a_process_working_in_the_workspace() {
    let _serial = serial();
    let dir = temp_dir("quiesce");
    let mut sleeper = Command::new("sleep").arg("30").current_dir(&dir).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).spawn().unwrap();
    let root = dir.to_string_lossy().into_owned();
    let out = route(&["quiesce-scan", "--protocol", "1", "--root", &root]);
    assert_eq!(out.status.code(), Some(10));
    let v = json_line(&out);
    assert_eq!(v["result"], "processes");
    let mine: Vec<&Value> = v["processes"].as_array().unwrap().iter().filter(|p| p["pid"] == sleeper.id()).collect();
    assert_eq!(mine.len(), 1, "{v}");
    assert_eq!(mine[0]["matched"], "cwd");
    let pid = sleeper.id().to_string();
    let out = route(&["quiesce-scan", "--protocol", "1", "--root", &root, "--exclude-pid", &pid]);
    let v = json_line(&out);
    assert!(v["processes"].as_array().unwrap().iter().all(|p| p["pid"] != sleeper.id()), "{v}");
    let _ = sleeper.kill();
    let _ = sleeper.wait();
    // A process elsewhere whose argv points into the workspace.
    let file_in_root = dir.join("payload.mjs");
    let mut runner = Command::new("sh")
        .args(["-c", "sleep 30; :", "runner"])
        .arg(&file_in_root)
        .current_dir("/")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();
    std::thread::sleep(Duration::from_millis(50));
    let v = json_line(&route(&["quiesce-scan", "--protocol", "1", "--root", &root]));
    let hit: Vec<&Value> = v["processes"].as_array().unwrap().iter().filter(|p| p["pid"] == runner.id()).collect();
    assert_eq!(hit.len(), 1, "{v}");
    assert_eq!(hit[0]["matched"], "cmdline");
    assert_eq!(hit[0]["root"], root.as_str());
    let _ = runner.kill();
    let _ = runner.wait();
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn lock_borrow_vectors_route_is_green() {
    let _serial = serial();
    let out = route(&["lock-borrow-vectors", "--protocol", "2"]);
    let v = json_line(&out);
    println!("lock-borrow-vectors: {v}");
    assert_eq!(out.status.code(), Some(0), "{v}");
    assert_eq!(v["result"], "pass");
    assert_eq!(v["vectors"].as_array().unwrap().len(), 4);
    assert_eq!(v["sibling"]["result"], "pass");
    let bad = route(&["lock-borrow-vectors", "--protocol", "2", "--vector", "nope"]);
    assert_eq!(bad.status.code(), Some(2));
}

/// Cold-path cost of one `lock-fd --try` call, as the Node facade pays it.
#[test]
fn lock_fd_try_latency_over_300_calls() {
    let _serial = serial();
    let dir = temp_dir("latency");
    let lock = dir.join("lat.lock");
    let mut ms = Vec::with_capacity(300);
    for _ in 0..300 {
        let file = open_rw(&lock);
        let started = Instant::now();
        let out = route_fd(&["lock-fd", "--protocol", "2", "--try"], &file);
        ms.push(started.elapsed().as_secs_f64() * 1000.0);
        assert_eq!(out.status.code(), Some(0));
    }
    ms.sort_by(|a, b| a.partial_cmp(b).unwrap());
    println!("lock-fd --try x300: p50 {:.2} ms p95 {:.2} ms max {:.2} ms", ms[150], ms[284], ms[299]);
    let _ = fs::remove_dir_all(&dir);
}
