//! `fgos internal lock-hold` on Windows, through the real host binary. The
//! parent here is this test's own child process, not a libuv job, so the
//! helper's parent-handle path is the only thing that can free the lock.
#![cfg(windows)]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use fgos_holder_lock::{probe, Probe, Resource};
use serde_json::Value;

fn fgos() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_fgos"))
}

fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-lock-hold-route-{tag}-{}-{nanos}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn hold_args(lock: &Path, work: &Path, wait: &[&str]) -> Vec<String> {
    let mut args = ["internal", "lock-hold", "--protocol", "2", "--path"].map(String::from).to_vec();
    args.push(lock.to_string_lossy().into_owned());
    args.extend(["--mode", "ex", "--work"].map(String::from));
    args.push(work.to_string_lossy().into_owned());
    args.extend(wait.iter().map(|s| s.to_string()));
    args
}

fn wait_for(path: &Path, what: &str) -> Value {
    let started = Instant::now();
    loop {
        if let Ok(text) = fs::read_to_string(path) {
            return serde_json::from_str(&text).unwrap();
        }
        assert!(started.elapsed() < Duration::from_secs(10), "{what} never appeared at {}", path.display());
        std::thread::sleep(Duration::from_millis(2));
    }
}

/// A parent process that spawns the helper and then just lives: a `fgos`
/// helper itself would be a third process, so the parent is a short
/// PowerShell that starts the helper and waits.
fn spawn_parent_with_helper(lock: &Path, work: &Path) -> Child {
    let helper = hold_args(lock, work, &["--try"]);
    let quoted: Vec<String> = helper.iter().map(|a| if a.contains(' ') { format!("\"{a}\"") } else { a.clone() })
        .map(|a| format!("'{}'", a.replace('\'', "''"))).collect();
    let script = format!("$p = Start-Process -FilePath '{}' -ArgumentList {} -WindowStyle Hidden -PassThru; Start-Sleep -Seconds 120", fgos().display(), quoted.join(","));
    Command::new("powershell").args(["-NoProfile", "-NonInteractive", "-Command", &script]).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).spawn().unwrap()
}

#[test]
fn the_helper_frees_the_lock_when_its_parent_is_terminated() {
    let dir = temp_dir("parent");
    let lock = dir.join("hold.lock");
    let work = dir.join("work");
    fs::create_dir_all(&work).unwrap();
    let mut parent = spawn_parent_with_helper(&lock, &work);
    let ready = wait_for(&work.join("ready.json"), "ready.json");
    assert_eq!(ready["result"], "acquired");
    let helper_pid = ready["helperPid"].as_u64().unwrap();
    let res = Resource::new("hold", &lock);
    assert_eq!(probe(&res).unwrap(), Probe::Held);

    parent.kill().unwrap();
    parent.wait().unwrap();
    let started = Instant::now();
    while probe(&res).unwrap() == Probe::Held {
        assert!(started.elapsed() < Duration::from_millis(1000), "the helper (pid {helper_pid}) still holds the lock after its parent died");
        std::thread::sleep(Duration::from_millis(2));
    }
    let freed_after = started.elapsed();
    assert!(freed_after < Duration::from_millis(100), "lock freed after {freed_after:?}");
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn a_held_lock_is_answered_held_and_the_helper_exits_with_the_contract_code() {
    let dir = temp_dir("held");
    let lock = dir.join("hold.lock");
    let work = dir.join("work");
    fs::create_dir_all(&work).unwrap();
    let first = Command::new(fgos()).args(hold_args(&lock, &work, &["--try"])).stdin(Stdio::null()).stdout(Stdio::null()).spawn();
    // The first helper's parent is this test: it holds until the test ends.
    let mut first = first.unwrap();
    assert_eq!(wait_for(&work.join("ready.json"), "first ready.json")["result"], "acquired");

    let work2 = dir.join("work2");
    fs::create_dir_all(&work2).unwrap();
    let second = Command::new(fgos()).args(hold_args(&lock, &work2, &["--try"])).stdin(Stdio::null()).stdout(Stdio::null()).status().unwrap();
    assert_eq!(second.code(), Some(10));
    let answer = wait_for(&work2.join("ready.json"), "second ready.json");
    assert_eq!((answer["result"].as_str(), answer["reason"].as_str()), (Some("held"), Some("kernel-lock-held")));

    let timed = Command::new(fgos()).args(hold_args(&lock, &work2, &["--wait-ms", "80"])).stdin(Stdio::null()).stdout(Stdio::null()).status().unwrap();
    assert_eq!(timed.code(), Some(11));
    first.kill().unwrap();
    first.wait().unwrap();
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn an_unknown_request_is_refused_by_name_and_probe_sees_held_and_free() {
    let dir = temp_dir("req");
    let lock = dir.join("hold.lock");
    let work = dir.join("work");
    fs::create_dir_all(&work).unwrap();
    let mut helper = Command::new(fgos()).args(hold_args(&lock, &work, &["--try"])).stdin(Stdio::null()).stdout(Stdio::null()).spawn().unwrap();
    assert_eq!(wait_for(&work.join("ready.json"), "ready.json")["result"], "acquired");
    fs::write(work.join("req-1.json"), r#"{"op":"nope"}"#).unwrap();
    assert_eq!(wait_for(&work.join("result-1.json"), "result-1.json")["error"], "request-unknown");

    let probe_out = Command::new(fgos()).args(["internal", "lock-fd", "--protocol", "2", "--probe"]).arg(&lock).stdin(Stdio::null()).output().unwrap();
    assert_eq!(probe_out.status.code(), Some(10));
    assert!(String::from_utf8_lossy(&probe_out.stdout).contains("\"result\":\"held\""));
    helper.kill().unwrap();
    helper.wait().unwrap();
    let free = Command::new(fgos()).args(["internal", "lock-fd", "--protocol", "2", "--probe"]).arg(&lock).stdin(Stdio::null()).output().unwrap();
    assert_eq!(free.status.code(), Some(0));
    assert!(String::from_utf8_lossy(&free.stdout).contains("\"result\":\"free\""));
    let _ = fs::remove_dir_all(&dir);
}
