//! `fgos internal ...` through the real host binary: the routes that remain
//! cold paths (the borrower test and the shared try of the git hook, the Windows hold helper's
//! refusal here, the protocol and usage rules, the quiesce scan, the borrow
//! vectors and the state root). Every other lock operation runs in the
//! caller's process through the addon's `holderLock` door and is proven by
//! the holder-lock crate's own tests.
#![cfg(target_os = "linux")]

use std::fs::{self, File, OpenOptions};
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};
use std::os::unix::process::CommandExt;
use std::time::Duration;

use fgos_holder_lock::{acquire, probe, release, run_borrowed, Acquire, BorrowSpec, BorrowStdio, Mode, Probe, Release, Resource, Wait};
use fgos_process::FdSlot;
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

/// Kill a child that leads its own process group, with everything it started, and reap it.
fn end_group(child: &mut std::process::Child) {
    unsafe { libc::kill(-(child.id() as i32), libc::SIGKILL) };
    let _ = child.wait();
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

#[test]
fn shared_try_answers_free_or_held_on_the_handed_description_and_never_waits() {
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
    let started = std::time::Instant::now();
    let held = route_fd(&["lock-fd", "--protocol", "2", "--shared-try"], &file);
    assert!(started.elapsed() < Duration::from_secs(2), "the shared try never waits");
    let v = json_line(&held);
    assert_eq!((held.status.code(), v["result"].as_str(), v["reason"].as_str()), (Some(10), Some("held"), Some("kernel-lock-held")));
    drop(file);
    assert_eq!(probe(&res).unwrap(), Probe::Held, "the try left the owner's lock alone");
    assert!(matches!(release(owner), Release::Released { .. }));
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
        vec!["lock-fd", "--borrowed-check", "/x"],
        vec!["lock-fd", "--protocol", "1", "--borrowed-check", "/x"],
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
    for args in [vec!["nope", "--protocol", "2"], vec!["lock-fd", "--protocol", "2"], vec!["lock-fd", "--protocol", "2", "--try"], vec!["lock-fd", "--protocol", "2", "--borrowed-check"], vec!["lock-fd", "--protocol", "2", "--shared-try", "--borrowed-check", "/x"], vec!["lock-fd", "--protocol", "2", "--bogus"], vec!["quiesce-scan", "--protocol", "1"]] {
        let out = route(&args);
        assert_eq!(out.status.code(), Some(2), "{args:?}");
        assert_eq!(json_line(&out)["code"], "usage", "{args:?}");
    }
    let out = Command::new(fgos()).arg("internal").output().unwrap();
    assert_eq!(out.status.code(), Some(2));
}

#[test]
fn quiesce_scan_lists_a_process_working_in_the_workspace() {
    let _serial = serial();
    let dir = temp_dir("quiesce");
    // A cwd in the workspace counts only for a process that could be fgOS (the
    // scan reads argv[0]'s basename): a shell named `fgos` that does not exec away.
    // `spawn` returns after the child's exec, so the scan reads the exec'd argv. Each child leads its own
    // process group, so ending the group also ends the `sleep` it started.
    let mut sleeper = Command::new("bash").arg0("fgos").args(["-c", "sleep 30; :"]).current_dir(&dir).process_group(0).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).spawn().unwrap();
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
    end_group(&mut sleeper);
    // A process elsewhere whose argv points into the workspace.
    let file_in_root = dir.join("payload.mjs");
    let mut runner = Command::new("sh")
        .args(["-c", "sleep 30; :", "runner"])
        .arg(&file_in_root)
        .current_dir("/")
        .process_group(0)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();
    let v = json_line(&route(&["quiesce-scan", "--protocol", "1", "--root", &root]));
    let hit: Vec<&Value> = v["processes"].as_array().unwrap().iter().filter(|p| p["pid"] == runner.id()).collect();
    assert_eq!(hit.len(), 1, "{v}");
    assert_eq!(hit[0]["matched"], "cmdline");
    assert_eq!(hit[0]["root"], root.as_str());
    end_group(&mut runner);
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
