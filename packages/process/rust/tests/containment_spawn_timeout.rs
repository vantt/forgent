//! A `bwrap-pidns` spawn that times out waiting for bwrap's report must not
//! leave the gate (pid 1 of the namespace, no `--die-with-parent` in `direct`
//! mode) or anything it started running.
#![cfg(target_os = "linux")]

use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread::sleep;
use std::time::{Duration, Instant};

use fgos_process::containment::{BwrapPidns, ContainmentDriver, SpawnSpec, StartMode};

/// Host pids of live processes whose command line contains `token`.
fn processes_with(token: &str) -> Vec<u32> {
    let mut found = Vec::new();
    for entry in fs::read_dir("/proc").unwrap().flatten() {
        let Some(pid) = entry.file_name().to_str().and_then(|n| n.parse::<u32>().ok()) else { continue };
        let Ok(cmdline) = fs::read(format!("/proc/{pid}/cmdline")) else { continue };
        if pid != std::process::id() && String::from_utf8_lossy(&cmdline).contains(token) {
            if let Ok(stat) = fs::read_to_string(format!("/proc/{pid}/stat")) {
                if !stat.rsplit(')').next().unwrap_or("").trim_start().starts_with('Z') {
                    found.push(pid);
                }
            }
        }
    }
    found
}

#[test]
fn a_timed_out_spawn_leaves_no_process_of_the_attempt() {
    if !std::path::Path::new("/usr/bin/bwrap").exists() {
        eprintln!("skip: spawn-timeout: no-bwrap");
        return;
    }
    let usable = std::process::Command::new("/usr/bin/bwrap")
        .args(["--unshare-user", "--unshare-pid", "--as-pid-1", "--dev-bind", "/", "/", "--proc", "/proc", "--", "/bin/true"])
        .status()
        .map(|s| s.success())
        .unwrap_or(false);
    if !usable {
        eprintln!("skip: spawn-timeout: no-bwrap-pidns");
        return;
    }
    // A decimal duration that no other process on the machine has.
    let token = format!("299.{}", std::process::id());
    let wrapper = PathBuf::from(format!("{}/tests/fixtures/bwrap-without-info-fd.sh", env!("CARGO_MANIFEST_DIR")));
    let driver = BwrapPidns::new(wrapper);
    let mut domain = driver.create("att-timeout").unwrap();
    let spec = SpawnSpec {
        argv: vec!["/bin/sleep".into(), token.clone()],
        bwrap_prefix: None,
        fd_map: Vec::new(),
        env: BTreeMap::from([("PATH".to_string(), "/usr/bin:/bin".to_string())]),
        cwd: std::env::temp_dir(),
        stdin: None,
        stdout: None,
        stderr: None,
        mode: StartMode::Direct,
    };

    // The namespace really stands during the wait: watch for the gate command.
    let seen = Arc::new(AtomicBool::new(false));
    let watcher = {
        let (seen, token) = (seen.clone(), token.clone());
        std::thread::spawn(move || {
            let start = Instant::now();
            while start.elapsed() < Duration::from_secs(9) && !seen.load(Ordering::Relaxed) {
                if !processes_with(&token).is_empty() {
                    seen.store(true, Ordering::Relaxed);
                }
                sleep(Duration::from_millis(20));
            }
        })
    };
    let failure = driver.spawn_in(&mut domain, spec).err().expect("the spawn must time out");
    watcher.join().unwrap();
    assert_eq!(failure.name(), "namespace-unavailable");
    assert!(seen.load(Ordering::Relaxed), "the gate command was running during the wait");

    let start = Instant::now();
    loop {
        let left = processes_with(&token);
        if left.is_empty() {
            break;
        }
        assert!(start.elapsed() < Duration::from_secs(3), "processes of the failed attempt survive: {left:?}");
        sleep(Duration::from_millis(20));
    }
}
