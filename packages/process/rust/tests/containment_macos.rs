//! `macos-tree` against real process trees.
#![cfg(target_os = "macos")]

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::thread::sleep;
use std::time::{Duration, Instant};

use fgos_process::containment::{ContainmentDriver, GuaranteeLevel, MacosTree, SpawnSpec, StartMode};
use fgos_process::facts::{self, Observed};
use fgos_process::{domain_is_empty, domain_kill_all, Domain, DomainState, KillOutcome, ProcId};

fn scratch(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-macos-tree-{name}-{}", std::process::id()));
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
    let out = Command::new("ps").args(["-axo", "pid=,pgid=,stat="]).output().unwrap();
    String::from_utf8_lossy(&out.stdout)
        .lines()
        .filter_map(|line| {
            let cols: Vec<&str> = line.split_whitespace().collect();
            let group: u32 = cols.get(1)?.parse().ok()?;
            (group == pgid && !cols.get(2)?.starts_with('Z')).then_some(())
        })
        .count()
}

// 1 shell + 13 subshells + 26 sleeps = 40 processes, three levels deep.
const TREE: &str = r#"
for i in $(seq 1 13); do (sleep 600 & sleep 600 & wait) & done
(perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV' sh -c 'echo $$ > "$1/escape.pid"; exec sleep 600' sh "$1" &)
wait
"#;

#[test]
fn containment_macos_tree_ends_a_tree_of_forty() {
    let dir = scratch("tree");
    let driver = MacosTree;
    let mut domain = driver.create("attempt-tree").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, spec(&["sh", "-c", TREE, "sh", &dir.display().to_string()])).unwrap();
    let leader = spawned.root.clone();
    assert!(matches!(domain.domain(), Some(Domain::MacosTree(t)) if *t == leader));
    let escape_pid: u32 = wait_for(&dir.join("escape.pid")).trim().parse().unwrap();

    let start = Instant::now();
    while in_group(leader.pid.0) < 40 {
        assert!(start.elapsed() < Duration::from_secs(20), "tree did not come up");
        sleep(Duration::from_millis(50));
    }
    assert_eq!(driver.is_empty(&mut domain), DomainState::NotEmpty);

    assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
    assert_eq!(in_group(leader.pid.0), 0, "no process left in the group");
    assert_eq!(domain_is_empty(domain.domain().unwrap()), DomainState::Empty);
    let _ = spawned.child.wait();
    // SAFETY: ends the escaped test process this test started.
    unsafe { libc::kill(escape_pid as libc::pid_t, libc::SIGKILL) };
}

#[test]
fn containment_macos_tree_record_alone_judges_and_ends_the_domain() {
    let driver = MacosTree;
    let mut domain = driver.create("attempt-record").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, spec(&["sleep", "600"])).unwrap();
    let record = domain.domain().unwrap().clone();
    assert_eq!(domain_is_empty(&record), DomainState::NotEmpty);
    assert_eq!(domain_kill_all(&record), KillOutcome::Ok);
    assert_eq!(domain_is_empty(&record), DomainState::Empty);
    let _ = spawned.child.wait();
}

#[test]
fn containment_macos_tree_names_the_double_fork_escape() {
    let dir = scratch("escape");
    let driver = MacosTree;
    let mut domain = driver.create("attempt-escape").unwrap();
    // macOS has no setsid command: perl makes the new session. The inner shell
    // forks the sleeper and ends, which re-parents it to launchd.
    let script = r#"(perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV' sh -c 'sleep 600 & echo $! > "$1/escape.pid"' sh "$1" &) ; sleep 600"#;
    let mut spawned = driver.spawn_in(&mut domain, spec(&["sh", "-c", script, "sh", &dir.display().to_string()])).unwrap();
    let escape_pid: u32 = wait_for(&dir.join("escape.pid")).trim().parse().unwrap();

    assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    let _ = spawned.child.wait();
    // The escaped process is not part of the domain: the driver does not claim it, the guarantee names it.
    assert!(matches!(facts::observe(ProcId(escape_pid)), Observed::Live { .. }), "the double-forked process left the domain");
    let guarantee = driver.guarantee();
    assert_eq!(guarantee.level, GuaranteeLevel::BestEffort);
    assert!(guarantee.escapes.iter().any(|e| e.contains("setsid") && e.contains("double fork")));
    assert!(guarantee.escapes.iter().any(|e| e.contains("reused pgid")));
    // SAFETY: ends the escaped test process this test started.
    unsafe { libc::kill(escape_pid as libc::pid_t, libc::SIGKILL) };
}

#[test]
fn a_thousand_fast_exits_are_normal_spawns() {
    let driver = MacosTree;
    for i in 0..1000 {
        let mut domain = driver.create(&format!("fast-{i}")).unwrap();
        let mut spawned = driver.spawn_in(&mut domain, spec(&["/bin/true"])).unwrap();
        assert!(spawned.child.wait().unwrap().success(), "spawn {i}");
        assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
        assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    }
}
