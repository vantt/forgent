//! `linux-pgroup` against real process trees.
#![cfg(target_os = "linux")]

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::thread::sleep;
use std::time::{Duration, Instant};

use fgos_process::containment::{ContainmentDriver, LinuxPgroup, SpawnSpec, StartMode};
use fgos_process::facts::{self, Observed};
use fgos_process::{domain_kill_all, DomainState, KillOutcome, ProcId};

fn scratch(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-pgroup-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn spec(argv: &[&str]) -> SpawnSpec {
    SpawnSpec {
        argv: argv.iter().map(|a| a.to_string()).collect(),
        bwrap_prefix: None,
        fd_map: Vec::new(),
        env: BTreeMap::from([("PATH".to_string(), "/usr/bin:/bin".to_string())]),
        cwd: std::env::temp_dir(),
        stdin: None,
        stdout: None,
        stderr: None,
        mode: StartMode::Direct,
    }
}

fn wait_for(path: &Path) -> String {
    let start = Instant::now();
    loop {
        if let Ok(text) = fs::read_to_string(path) {
            if !text.trim().is_empty() {
                return text;
            }
        }
        assert!(start.elapsed() < Duration::from_secs(10), "{} never written", path.display());
        sleep(Duration::from_millis(10));
    }
}


#[test]
fn containment_pgroup_grace_snapshot_keeps_a_setsid_child_of_a_leader_that_ends_on_sigterm() {
    let dir = scratch("grace");
    let driver = LinuxPgroup;
    let mut domain = driver.create("attempt-grace").unwrap();
    // The leader ends on SIGTERM; its setsid child ignores it.
    let script = r#"setsid sh -c 'trap "" TERM; echo $$ > "$1/child.pid"; while :; do sleep 1; done' sh "$1" & wait"#;
    let mut spawned = driver.spawn_in(&mut domain, spec(&["sh", "-c", script, "sh", &dir.display().to_string()])).unwrap();
    let child: u32 = wait_for(&dir.join("child.pid")).trim().parse().unwrap();
    assert_eq!(driver.is_empty(&mut domain), DomainState::NotEmpty);
    assert_eq!(driver.kill_all(&mut domain, 300), KillOutcome::Ok);
    assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
    assert!(!matches!(facts::observe(ProcId(child)), Observed::Live { .. }));
    let _ = spawned.child.wait();
}


fn is_subreaper() -> bool {
    let mut flag: libc::c_int = -1;
    // SAFETY: PR_GET_CHILD_SUBREAPER writes one int through the pointer and nothing else.
    let rc = unsafe { libc::prctl(libc::PR_GET_CHILD_SUBREAPER, &mut flag as *mut libc::c_int as libc::c_ulong, 0, 0, 0) };
    assert_eq!(rc, 0, "prctl(PR_GET_CHILD_SUBREAPER) failed");
    flag != 0
}

/// Spawning a domain's gate must not turn the calling process into a
/// subreaper: the flag is process-wide and inherited state of the caller, and
/// every orphan of the host would be re-parented to it. The flag is
/// per-process and the other tests of this binary run in threads of the same
/// process, so the case runs in a fresh process of this same test binary.
#[test]
fn spawn_in_never_makes_the_caller_a_subreaper() {
    if std::env::var_os("FGOS_TEST_SUBREAPER_PROBE").is_some() {
        assert!(!is_subreaper(), "a fresh test process starts as no subreaper");
        let driver = LinuxPgroup;
        let mut domain = driver.create("attempt-subreaper").unwrap();
        let mut spawned = driver.spawn_in(&mut domain, spec(&["sleep", "600"])).unwrap();
        let after = is_subreaper();
        let record = domain.domain().unwrap().clone();
        assert_eq!(domain_kill_all(&record), KillOutcome::Ok);
        let _ = spawned.child.wait();
        assert!(!after, "spawn_in made the calling process a child subreaper");
        return;
    }
    let output = std::process::Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "spawn_in_never_makes_the_caller_a_subreaper", "--test-threads=1", "--nocapture"])
        .env("FGOS_TEST_SUBREAPER_PROBE", "1")
        .output()
        .unwrap();
    assert!(output.status.success(), "{}{}", String::from_utf8_lossy(&output.stdout), String::from_utf8_lossy(&output.stderr));
}
