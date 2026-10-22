//! Conformance suite for containment drivers across platforms.

mod common;

use std::fs;
use std::time::{Duration, Instant};

use fgos_process::containment::ContainmentDriver;
use fgos_process::facts::{self, Observed};
use fgos_process::{domain_is_empty, domain_kill_all, DomainState, KillOutcome, ProcId};

use common::{scratch, wait_for, Props, Workloads};

fn tree_ends(driver: &dyn ContainmentDriver, props: &Props, work: &dyn Workloads) {
    let dir = scratch(&format!("tree-{}", props.name));
    let mut domain = driver.create("att-tree").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, work.tree(&dir)).unwrap();
    assert_eq!(driver.is_empty(&mut domain), DomainState::NotEmpty);

    #[cfg(unix)]
    let (setsid_pid, escape_pid) = {
        let setsid: u32 = wait_for(&dir.join("setsid.pid")).trim().parse().unwrap();
        let escape: u32 = wait_for(&dir.join("escape.pid")).trim().parse().unwrap();
        (setsid, escape)
    };
    #[cfg(windows)]
    let pids: Vec<u32> = {
        ["child", "detached", "nest", "grandchild"]
            .iter()
            .map(|name| wait_for(&dir.join(format!("{name}.pid"))).trim().parse().unwrap())
            .collect()
    };

    assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);

    #[cfg(unix)]
    {
        assert!(
            !matches!(facts::observe(ProcId(setsid_pid)), Observed::Live { .. }),
            "setsid child was ended"
        );
        if props.double_fork_escapee_survives {
            assert!(
                matches!(facts::observe(ProcId(escape_pid)), Observed::Live { .. }),
                "double fork escapee survives"
            );
            // SAFETY: cleans up the escaped test child process.
            unsafe { libc::kill(escape_pid as libc::pid_t, libc::SIGKILL) };
        } else {
            assert!(
                !matches!(facts::observe(ProcId(escape_pid)), Observed::Live { .. }),
                "escapee does not survive on this driver"
            );
        }
    }
    #[cfg(windows)]
    {
        for pid in pids {
            assert!(
                !matches!(facts::observe(ProcId(pid)), Observed::Live { .. }),
                "child {pid} was ended"
            );
        }
    }

    let _ = spawned.child.wait();
}

fn record_alone(driver: &dyn ContainmentDriver, _props: &Props, work: &dyn Workloads) {
    let mut domain = driver.create("att-record").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, work.sleeper()).unwrap();
    let record = domain.domain().expect("domain record").clone();
    assert_eq!(domain_is_empty(&record), DomainState::NotEmpty);
    assert_eq!(domain_kill_all(&record), KillOutcome::Ok);
    assert_eq!(domain_is_empty(&record), DomainState::Empty);
    let _ = spawned.child.wait();
}

fn fast_exits(driver: &dyn ContainmentDriver, props: &Props, work: &dyn Workloads) {
    for i in 0..props.fast_iterations {
        let code = if i % 2 == 0 { 0 } else { 7 };
        let mut domain = driver.create(&format!("fast-{i}")).unwrap();
        let mut spawned = driver.spawn_in(&mut domain, work.exit_with(code)).unwrap();
        let status = spawned.child.wait().unwrap();
        assert_eq!(status.code(), Some(code));
        assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
        assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    }
}

fn leader_exit(driver: &dyn ContainmentDriver, props: &Props, work: &dyn Workloads) {
    let dir = scratch(&format!("leader-exit-{}", props.name));
    let mut domain = driver.create("att-leader-exit").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, work.lingering_grandchild(&dir)).unwrap();
    let status = spawned.child.wait().unwrap();
    assert!(status.success());
    if props.leader_exit_ends_domain {
        assert_eq!(driver.is_empty(&mut domain), DomainState::Empty, "leader exit ends domain");
    } else {
        assert_eq!(driver.is_empty(&mut domain), DomainState::NotEmpty, "grandchild keeps domain alive");
    }
    assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);
    assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
}

fn spawn_plumbing(driver: &dyn ContainmentDriver, props: &Props, work: &dyn Workloads) {
    let dir = scratch(&format!("plumbing-{}", props.name));
    let mut domain = driver.create("att-plumbing").unwrap();
    let mut spawned = driver.spawn_in(&mut domain, work.echo(&dir)).unwrap();
    let status = spawned.child.wait().unwrap();
    assert_eq!(status.code(), Some(7));
    assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
    assert_eq!(driver.kill_all(&mut domain, 0), KillOutcome::Ok);

    let stdout = fs::read_to_string(dir.join("stdout.txt")).unwrap_or_default();
    let stderr = fs::read_to_string(dir.join("stderr.txt")).unwrap_or_default();
    assert!(stdout.contains("stdin:conformance stdin"), "stdin reached child: {stdout}");
    assert!(stdout.contains("a:alpha"), "env FGOS_CONF_A reached child: {stdout}");
    assert!(stdout.contains("b:beta"), "env FGOS_CONF_B reached child: {stdout}");
    assert!(stderr.contains("err:out"), "stderr captured from child: {stderr}");
}

fn kill_all_grace(driver: &dyn ContainmentDriver, props: &Props, work: &dyn Workloads) {
    let dir_a = scratch(&format!("grace-a-{}", props.name));
    let mut domain_a = driver.create("att-grace-a").unwrap();
    let mut spawned_a = driver.spawn_in(&mut domain_a, work.term_probe(&dir_a, true)).unwrap();
    wait_for(&dir_a.join("ready.txt"));
    let start_a = Instant::now();
    let outcome_a = driver.kill_all(&mut domain_a, 250);
    let elapsed_a = start_a.elapsed();
    assert_eq!(outcome_a, KillOutcome::Ok);
    assert_eq!(driver.is_empty(&mut domain_a), DomainState::Empty);
    let _ = spawned_a.child.wait();

    if props.term_phase {
        assert!(
            elapsed_a >= Duration::from_millis(200),
            "driver respected grace period: elapsed {elapsed_a:?}"
        );
        let term_content = fs::read_to_string(dir_a.join("term.txt")).unwrap_or_default();
        assert!(term_content.contains("term"), "SIGTERM reached probe: {term_content}");
    }

    let dir_b = scratch(&format!("grace-b-{}", props.name));
    let mut domain_b = driver.create("att-grace-b").unwrap();
    let mut spawned_b = driver.spawn_in(&mut domain_b, work.term_probe(&dir_b, false)).unwrap();
    wait_for(&dir_b.join("ready.txt"));
    let start_b = Instant::now();
    let outcome_b = driver.kill_all(&mut domain_b, 1000);
    let elapsed_b = start_b.elapsed();
    assert_eq!(outcome_b, KillOutcome::Ok);
    assert_eq!(driver.is_empty(&mut domain_b), DomainState::Empty);
    let _ = spawned_b.child.wait();

    if props.term_without_handler_kills {
        assert!(
            elapsed_b < Duration::from_millis(600),
            "process ended on SIGTERM without waiting full grace: elapsed {elapsed_b:?}"
        );
    } else {
        assert!(
            elapsed_b >= Duration::from_millis(900),
            "unhandled SIGTERM was dropped, ended after grace: elapsed {elapsed_b:?}"
        );
    }
}

fn guarantee_names_itself(driver: &dyn ContainmentDriver, props: &Props, _work: &dyn Workloads) {
    let g = driver.guarantee();
    assert_eq!(g.driver, props.name);
    assert_eq!(g.level, props.level);
    for escape in props.escapes {
        assert!(
            g.escapes.iter().any(|e| e.contains(escape)),
            "guarantee must mention '{escape}': escapes are {:?}",
            g.escapes
        );
    }
}

macro_rules! conformance_suite {
    ($mod_name:ident, $driver_init:expr, $props:expr, $work:expr) => {
        mod $mod_name {
            use super::*;

            #[test]
            fn tree_ends() {
                let Some(driver) = $driver_init else { return; };
                super::tree_ends(&*driver, &$props, &$work);
            }

            #[test]
            fn record_alone() {
                let Some(driver) = $driver_init else { return; };
                super::record_alone(&*driver, &$props, &$work);
            }

            #[test]
            fn fast_exits() {
                let Some(driver) = $driver_init else { return; };
                super::fast_exits(&*driver, &$props, &$work);
            }

            #[test]
            fn leader_exit() {
                let Some(driver) = $driver_init else { return; };
                super::leader_exit(&*driver, &$props, &$work);
            }

            #[test]
            fn spawn_plumbing() {
                let Some(driver) = $driver_init else { return; };
                super::spawn_plumbing(&*driver, &$props, &$work);
            }

            #[test]
            fn kill_all_grace() {
                let Some(driver) = $driver_init else { return; };
                super::kill_all_grace(&*driver, &$props, &$work);
            }

            #[test]
            fn guarantee_names_itself() {
                let Some(driver) = $driver_init else { return; };
                super::guarantee_names_itself(&*driver, &$props, &$work);
            }
        }
    };
}

#[cfg(target_os = "linux")]
conformance_suite!(
    linux_pgroup,
    Some(Box::new(fgos_process::containment::LinuxPgroup) as Box<dyn ContainmentDriver>),
    common::LINUX_PGROUP_PROPS,
    common::UnixWorkloads
);

#[cfg(target_os = "linux")]
conformance_suite!(
    bwrap_pidns,
    common::require_bwrap().map(|b| Box::new(fgos_process::containment::BwrapPidns::new(b)) as Box<dyn ContainmentDriver>),
    common::BWRAP_PIDNS_PROPS,
    common::UnixWorkloads
);

#[cfg(target_os = "macos")]
conformance_suite!(
    macos_tree,
    Some(Box::new(fgos_process::containment::MacosTree) as Box<dyn ContainmentDriver>),
    common::MACOS_TREE_PROPS,
    common::UnixWorkloads
);

#[cfg(windows)]
conformance_suite!(
    windows_job,
    Some(Box::new(fgos_process::containment::WindowsJobDriver) as Box<dyn ContainmentDriver>),
    common::WINDOWS_JOB_PROPS,
    common::WindowsWorkloads
);

#[cfg(windows)]
#[test]
fn helper_role() {
    common::run_helper_role();
}
