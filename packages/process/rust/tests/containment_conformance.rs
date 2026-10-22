//! Conformance suite for containment drivers across platforms.

mod common;

use std::fs;
use std::path::Path;
use std::time::{Duration, Instant};

use fgos_process::containment::{ContainmentDriver, GuaranteeLevel, SpawnSpec};
#[cfg(windows)]
use fgos_process::facts::{self, Observed};
#[cfg(windows)]
use fgos_process::ProcId;
use fgos_process::{domain_is_empty, domain_kill_all, DomainState, KillOutcome};

use common::{scratch, wait_for};

struct Props {
    name: &'static str,
    level: GuaranteeLevel,
    escapes: &'static [&'static str],
    double_fork_escapee_survives: bool,
    term_without_handler_kills: bool,
    term_phase: bool,
    leader_exit_ends_domain: bool,
    fast_iterations: u32,
}

const fn props(
    name: &'static str,
    level: GuaranteeLevel,
    escapes: &'static [&'static str],
    df: bool,
    term_kills: bool,
    term_phase: bool,
    leader_ends: bool,
    fast: u32,
) -> Props {
    Props {
        name,
        level,
        escapes,
        double_fork_escapee_survives: df,
        term_without_handler_kills: term_kills,
        term_phase,
        leader_exit_ends_domain: leader_ends,
        fast_iterations: fast,
    }
}

#[cfg(target_os = "linux")]
const LINUX_PGROUP_PROPS: Props = props("linux-pgroup", GuaranteeLevel::BestEffort, &["setsid", "reused pgid", "daemons"], true, true, true, false, 100);
#[cfg(target_os = "linux")]
const BWRAP_PIDNS_PROPS: Props = props("bwrap-pidns", GuaranteeLevel::Kernel, &["herdr", "systemd", "docker"], false, false, true, true, 100);
#[cfg(target_os = "macos")]
const MACOS_TREE_PROPS: Props = props("macos-tree", GuaranteeLevel::BestEffort, &["double fork", "reused pgid", "launchd"], true, true, true, false, 100);
#[cfg(windows)]
const WINDOWS_JOB_PROPS: Props = props("windows-job", GuaranteeLevel::Kernel, &["service", "COM server"], false, true, false, false, 20);

enum Workload<'a> {
    Tree(&'a Path),
    Sleeper,
    Exit(i32),
    Lingering(&'a Path),
    Echo(&'a Path),
    TermProbe(&'a Path, bool),
}

fn attach_stdio(mut s: SpawnSpec, dir: &Path) -> SpawnSpec {
    let _ = fs::write(dir.join("stdin.txt"), "conformance stdin\n");
    s.stdin = fs::File::open(dir.join("stdin.txt")).ok();
    s.stdout = fs::File::create(dir.join("stdout.txt")).ok();
    s.stderr = fs::File::create(dir.join("stderr.txt")).ok();
    s
}

#[cfg(unix)]
fn workload(w: Workload) -> SpawnSpec {
    match w {
        // Every member keeps a marker path in its argv, so the host sees it in
        // any pid namespace: `<dir>/member` for the tree, `<dir>/escape` for
        // the setsid + double-fork escapee.
        Workload::Tree(dir) => common::spec([
            "sh", "-c",
            "if command -v setsid >/dev/null 2>&1; then r() { setsid \"$@\"; }; else r() { perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV' \"$@\"; }; fi; loop='while :; do sleep 1; done'; for i in $(seq 1 15); do sh -c \"$loop\" member \"$1/member\" & done; r sh -c \"$loop\" member \"$1/member\" & (r sh -c \"$loop\" escape \"$1/escape\" &); wait",
            "sh", &dir.display().to_string(),
        ]),
        Workload::Sleeper => common::spec(["sleep", "600"]),
        Workload::Exit(code) => common::spec(["sh", "-c", &format!("exit {code}")]),
        Workload::Lingering(dir) => {
            let _ = dir;
            common::spec(["sh", "-c", "sleep 600 &"])
        }
        Workload::Echo(dir) => {
            let mut s = common::spec(["sh", "-c", "read -r l; echo \"stdin:$l\"; echo \"cwd:$(pwd)\"; echo \"a:$FGOS_CONF_A\"; echo \"b:$FGOS_CONF_B\"; echo \"err:out\" >&2; exit 7"]);
            s.cwd = dir.to_path_buf();
            s.env.insert("FGOS_CONF_A".into(), "alpha".into());
            s.env.insert("FGOS_CONF_B".into(), "beta".into());
            attach_stdio(s, dir)
        }
        Workload::TermProbe(dir, handler) => {
            let script = if handler {
                "trap 'echo term > \"$1/term.txt\"' TERM; echo ready > \"$1/ready.txt\"; while true; do sleep 1 & wait $!; done"
            } else {
                "echo ready > \"$1/ready.txt\"; exec sleep 600"
            };
            common::spec(["sh", "-c", script, "sh", &dir.display().to_string()])
        }
    }
}

#[cfg(windows)]
fn workload(w: Workload) -> SpawnSpec {
    match w {
        Workload::Tree(dir) => common::win_spec("tree", dir, &[]),
        Workload::Sleeper => common::win_spec("sleep", &std::env::temp_dir(), &[]),
        Workload::Exit(code) => common::win_spec("exit", &std::env::temp_dir(), &[("FGOS_TEST_EXIT_CODE", &code.to_string())]),
        Workload::Lingering(dir) => common::win_spec("lingering", dir, &[]),
        Workload::Echo(dir) => attach_stdio(common::win_spec("echo", dir, &[("FGOS_CONF_A", "alpha"), ("FGOS_CONF_B", "beta")]), dir),
        Workload::TermProbe(dir, _) => {
            let _ = fs::write(dir.join("ready.txt"), "ready\n");
            common::win_spec("sleep", dir, &[])
        }
    }
}

fn tree_ends(driver: &dyn ContainmentDriver, props: &Props) {
    let dir = scratch(&format!("tree-{}", props.name));
    let mut domain = driver.create("att-tree").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, workload(Workload::Tree(&dir))).unwrap();
    assert_eq!(driver.is_empty(&mut domain), DomainState::NotEmpty);

    #[cfg(unix)]
    let (member, escape) = (dir.join("member").display().to_string(), dir.join("escape").display().to_string());
    #[cfg(unix)]
    {
        let start = Instant::now();
        while common::running(&member) < 16 || common::running(&escape) < 1 {
            assert!(start.elapsed() < Duration::from_secs(20), "tree never started");
            std::thread::sleep(Duration::from_millis(20));
        }
    }
    #[cfg(windows)]
    let pids: Vec<u32> = ["child", "detached", "nest", "grandchild"]
        .iter()
        .map(|n| wait_for(&dir.join(format!("{n}.pid"))).trim().parse().unwrap())
        .collect();

    assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);

    #[cfg(unix)]
    {
        assert_eq!(common::running(&member), 0, "every tree member was ended");
        let escaped = common::running(&escape) > 0;
        common::end_all(&escape);
        assert_eq!(escaped, props.double_fork_escapee_survives, "escapee survives only on drivers that name that escape");
    }
    #[cfg(windows)]
    for pid in pids {
        assert!(!matches!(facts::observe(ProcId(pid)), Observed::Live { .. }), "child {pid} was ended");
    }

    let _ = spawned.child.wait();
}

fn record_alone(driver: &dyn ContainmentDriver, _props: &Props) {
    let mut domain = driver.create("att-record").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, workload(Workload::Sleeper)).unwrap();
    let record = domain.domain().expect("domain record").clone();
    assert_eq!(domain_is_empty(&record), DomainState::NotEmpty);
    assert_eq!(domain_kill_all(&record), KillOutcome::Ok);
    assert_eq!(domain_is_empty(&record), DomainState::Empty);
    let _ = spawned.child.wait();
}

fn fast_exits(driver: &dyn ContainmentDriver, props: &Props) {
    for i in 0..props.fast_iterations {
        let code = if i % 2 == 0 { 0 } else { 7 };
        let mut domain = driver.create(&format!("fast-{i}")).unwrap();
        let mut spawned = driver.spawn_in(&mut domain, workload(Workload::Exit(code))).unwrap();
        assert_eq!(spawned.child.wait().unwrap().code(), Some(code));
        assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
        assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    }
}

fn leader_exit(driver: &dyn ContainmentDriver, props: &Props) {
    let dir = scratch(&format!("leader-exit-{}", props.name));
    let mut domain = driver.create("att-leader-exit").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, workload(Workload::Lingering(&dir))).unwrap();
    assert!(spawned.child.wait().unwrap().success());
    let expected = if props.leader_exit_ends_domain { DomainState::Empty } else { DomainState::NotEmpty };
    assert_eq!(driver.is_empty(&mut domain), expected, "leader exit domain state");
    assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
}

fn spawn_plumbing(driver: &dyn ContainmentDriver, props: &Props) {
    let dir = scratch(&format!("plumbing-{}", props.name));
    let mut domain = driver.create("att-plumbing").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, workload(Workload::Echo(&dir))).unwrap();
    assert_eq!(spawned.child.wait().unwrap().code(), Some(7));
    assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
    assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);

    let stdout = fs::read_to_string(dir.join("stdout.txt")).unwrap_or_default();
    let stderr = fs::read_to_string(dir.join("stderr.txt")).unwrap_or_default();
    assert!(stdout.contains("stdin:conformance stdin"), "stdin: {stdout}");
    assert!(stdout.contains(&format!("cwd:{}", fs::canonicalize(&dir).unwrap().display())), "cwd: {stdout}");
    assert!(stdout.contains("a:alpha") && stdout.contains("b:beta"), "env: {stdout}");
    assert!(stderr.contains("err:out"), "stderr: {stderr}");
}

fn kill_all_grace(driver: &dyn ContainmentDriver, props: &Props) {
    let run_probe = |name: &str, handler: bool, grace: u64| {
        let dir = scratch(&format!("grace-{name}-{}", props.name));
        let mut dom = driver.create(&format!("att-grace-{name}")).unwrap();
        let mut sp = driver.spawn_in(&mut dom, workload(Workload::TermProbe(&dir, handler))).unwrap();
        wait_for(&dir.join("ready.txt"));
        let start = Instant::now();
        assert_eq!(driver.kill_all(&mut dom, grace), KillOutcome::Ok);
        let elapsed = start.elapsed();
        assert_eq!(driver.is_empty(&mut dom), DomainState::Empty);
        let _ = sp.child.wait();
        (dir, elapsed)
    };

    let (dir_a, elapsed_a) = run_probe("a", true, 250);
    if props.term_phase {
        assert!(elapsed_a >= Duration::from_millis(200), "grace respected: {elapsed_a:?}");
        let term = fs::read_to_string(dir_a.join("term.txt")).unwrap_or_default();
        assert!(term.contains("term"), "SIGTERM reached probe: {term}");
    }

    let (_, elapsed_b) = run_probe("b", false, 1000);
    if props.term_without_handler_kills {
        assert!(elapsed_b < Duration::from_millis(600), "ended on SIGTERM: {elapsed_b:?}");
    } else {
        assert!(elapsed_b >= Duration::from_millis(900), "unhandled SIGTERM dropped: {elapsed_b:?}");
    }
}

fn guarantee_names_itself(driver: &dyn ContainmentDriver, props: &Props) {
    let g = driver.guarantee();
    assert_eq!(g.driver, props.name);
    assert_eq!(g.level, props.level);
    for e in props.escapes {
        assert!(g.escapes.iter().any(|x| x.contains(e)), "guarantee must mention '{e}': {:?}", g.escapes);
    }
}

macro_rules! conformance_suite {
    ($mod_name:ident, $driver_init:expr, $props:expr) => {
        mod $mod_name {
            use super::*;
            #[test]
            fn tree_ends() {
                if let Some(d) = $driver_init { super::tree_ends(&*d, &$props); }
            }
            #[test]
            fn record_alone() {
                if let Some(d) = $driver_init { super::record_alone(&*d, &$props); }
            }
            #[test]
            fn fast_exits() {
                if let Some(d) = $driver_init { super::fast_exits(&*d, &$props); }
            }
            #[test]
            fn leader_exit() {
                if let Some(d) = $driver_init { super::leader_exit(&*d, &$props); }
            }
            #[test]
            fn spawn_plumbing() {
                if let Some(d) = $driver_init { super::spawn_plumbing(&*d, &$props); }
            }
            #[test]
            fn kill_all_grace() {
                if let Some(d) = $driver_init { super::kill_all_grace(&*d, &$props); }
            }
            #[test]
            fn guarantee_names_itself() {
                if let Some(d) = $driver_init { super::guarantee_names_itself(&*d, &$props); }
            }
        }
    };
}

#[cfg(target_os = "linux")]
conformance_suite!(linux_pgroup, Some(Box::new(fgos_process::containment::LinuxPgroup) as Box<dyn ContainmentDriver>), LINUX_PGROUP_PROPS);
#[cfg(target_os = "linux")]
conformance_suite!(bwrap_pidns, common::require_bwrap().map(|b| Box::new(fgos_process::containment::BwrapPidns::new(b)) as Box<dyn ContainmentDriver>), BWRAP_PIDNS_PROPS);
#[cfg(target_os = "macos")]
conformance_suite!(macos_tree, Some(Box::new(fgos_process::containment::MacosTree) as Box<dyn ContainmentDriver>), MACOS_TREE_PROPS);
#[cfg(windows)]
conformance_suite!(windows_job, Some(Box::new(fgos_process::containment::WindowsJobDriver) as Box<dyn ContainmentDriver>), WINDOWS_JOB_PROPS);

#[cfg(windows)]
#[test]
fn helper_role() {
    common::run_helper_role();
}
