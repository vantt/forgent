//! `linux-pgroup` against real process trees.
#![cfg(target_os = "linux")]

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::thread::sleep;
use std::time::{Duration, Instant};

use fgos_process::containment::{ContainmentDriver, GuaranteeLevel, LinuxPgroup, SpawnSpec, StartMode};
use fgos_process::facts::{self, Observed};
use fgos_process::{domain_is_empty, domain_kill_all, Domain, DomainState, KillOutcome, ProcId};

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

/// Live processes whose process group is `pgid`.
fn in_group(pgid: u32) -> usize {
    fs::read_dir("/proc")
        .unwrap()
        .filter_map(|e| e.ok()?.file_name().to_str()?.parse::<u32>().ok())
        .filter_map(|pid| {
            let line = fs::read_to_string(format!("/proc/{pid}/stat")).ok()?;
            let rest: Vec<&str> = line[line.rfind(')')? + 1..].split_whitespace().collect();
            (rest[0] != "Z" && rest[2].parse::<u32>().ok()? == pgid).then_some(pid)
        })
        .count()
}

const TREE: &str = r#"
for i in $(seq 1 17); do sleep 600 & done
setsid sleep 600 &
echo $! > "$1/setsid.pid"
(setsid sh -c 'echo $$ > "$1/escape.pid"; exec sleep 600' sh "$1" &)
wait
"#;

#[test]
fn containment_pgroup_ends_a_tree_of_twenty_including_a_setsid_child() {
    let dir = scratch("tree");
    let driver = LinuxPgroup;
    let mut domain = driver.create("attempt-tree").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, spec(&["sh", "-c", TREE, "sh", &dir.display().to_string()])).unwrap();
    let leader = spawned.root.clone();
    assert!(matches!(domain.domain(), Some(Domain::LinuxPgroup(t)) if *t == leader));
    let setsid_pid: u32 = wait_for(&dir.join("setsid.pid")).trim().parse().unwrap();
    let escape_pid: u32 = wait_for(&dir.join("escape.pid")).trim().parse().unwrap();

    let start = Instant::now();
    while in_group(leader.pid.0) < 18 {
        assert!(start.elapsed() < Duration::from_secs(10), "tree did not come up");
        sleep(Duration::from_millis(10));
    }
    assert_eq!(driver.is_empty(&mut domain), DomainState::NotEmpty);

    assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
    assert_eq!(in_group(leader.pid.0), 0, "no process left in the group");
    assert!(!matches!(facts::observe(ProcId(setsid_pid)), Observed::Live { .. }), "the setsid child that stayed in the tree was ended");
    assert_eq!(domain_is_empty(domain.domain().unwrap()), DomainState::Empty);
    let _ = spawned.child.wait();

    // The double-forked setsid process is the named escape: the guarantee says
    // so, and this test does not claim the driver catches it.
    let guarantee = driver.guarantee();
    assert_eq!(guarantee.level, GuaranteeLevel::BestEffort);
    assert!(guarantee.escapes.iter().any(|e| e.contains("setsid")));
    assert!(guarantee.escapes.iter().any(|e| e.contains("reused pgid")));
    // SAFETY: ends the escaped test process this test started.
    unsafe { libc::kill(escape_pid as libc::pid_t, libc::SIGKILL) };
}

#[test]
fn containment_pgroup_record_alone_judges_and_ends_the_domain() {
    let driver = LinuxPgroup;
    let mut domain = driver.create("attempt-record").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, spec(&["sleep", "600"])).unwrap();
    let record = domain.domain().unwrap().clone();
    assert_eq!(domain_is_empty(&record), DomainState::NotEmpty);
    assert_eq!(domain_kill_all(&record), KillOutcome::Ok);
    assert_eq!(domain_is_empty(&record), DomainState::Empty);
    let _ = spawned.child.wait();
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

#[test]
fn a_thousand_fast_exits_are_normal_spawns() {
    let driver = LinuxPgroup;
    for i in 0..1000 {
        let mut domain = driver.create(&format!("fast-{i}")).unwrap();
        let mut spawned = driver.spawn_in(&mut domain, spec(&["/bin/true"])).unwrap();
        assert!(spawned.child.wait().unwrap().success(), "spawn {i}");
        assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
        assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    }
}

#[test]
fn fast_exited_leader_does_not_hide_a_remaining_grandchild() {
    let driver = LinuxPgroup;
    let mut domain = driver.create("fast-grandchild").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, spec(&["sh", "-c", "(sleep 600 &) & exit 0"])).unwrap();
    assert!(spawned.child.wait().unwrap().success());
    // Let the intermediate shell finish its fork before checking the group.
    sleep(Duration::from_millis(100));
    assert_eq!(driver.is_empty(&mut domain), DomainState::NotEmpty);
    assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
}
