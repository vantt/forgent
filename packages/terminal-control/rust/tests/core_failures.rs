mod common;
use common::*;
use fgos_terminal_control::core::Core;
use fgos_terminal_control::driver::ForegroundProcess;
use fgos_terminal_control::policy::measured_split::MeasuredSplit;
use fgos_terminal_control::port::*;
use std::cell::Cell;
use std::process::{Child, Command};

fn spawn_sleeper() -> Child {
    Command::new("sleep").arg("30").spawn().expect("spawn sleep")
}

fn launch_spec() -> LaunchSpec {
    LaunchSpec {
        command: "sleep".into(),
        args: vec!["30".into()],
        cwd: "/tmp".into(),
        env: Default::default(),
        activity: None,
        expect: None,
    }
}

#[test]
fn an_orchestrator_that_died_after_allocate_leaves_the_pane_alone() {
    let driver = MemDriver::new(352, 69);
    let root = state_dir("orphan");
    let now = Cell::new(1_000_000u64);
    let slot = {
        let core = Core::new(&driver, &MeasuredSplit, config(root.clone())).with_clock(|| now.get());
        core.allocate(&request("a", "g")).unwrap().slot
    };
    // A fresh core, much later: the scan reports the bare shell, closes nothing.
    now.set(1_000_000 + 10 * 60_000);
    let core = Core::new(&driver, &MeasuredSplit, config(root)).with_clock(|| now.get());
    let findings = core.reconcile_scan(0).unwrap();
    assert_eq!(findings.len(), 1);
    assert_eq!(findings[0].kind, FindingKind::AllocatedNotLaunchedBareShell);
    assert!(driver.calls("pane.close").is_empty());
    assert!(driver.panes.borrow().contains_key(&slot.pane_id));
}

#[test]
fn a_slot_inside_the_allocation_grace_is_not_reported() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("grace"));
    core.allocate(&request("a", "g")).unwrap();
    assert!(core.reconcile_scan(0).unwrap().is_empty());
}

#[test]
fn launch_requested_without_launched_is_kept_and_never_launched_into_again() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("not-launched"));
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    // The foreground never becomes the command: the root is not identified.
    let out = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(out, LaunchOutcome::NotStarted { .. }), "{out:?}");
    let again = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(again, LaunchOutcome::NotStarted { .. }));
    assert_eq!(driver.calls("pane.run").len(), 1, "second launch must not reach the driver");
    let findings = core.reconcile_scan(0).unwrap();
    assert_eq!(findings.len(), 1);
    assert_eq!(findings[0].kind, FindingKind::Unknown);
    assert!(driver.panes.borrow().contains_key(&slot.pane_id));
    assert!(driver.calls("pane.close").is_empty());
}

#[test]
fn launch_identifies_the_root_process_and_writes_the_launched_marker() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("launched"));
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    let mut child = spawn_sleeper();
    driver.set_foreground(
        &slot.pane_id,
        900,
        vec![
            ForegroundProcess { pid: 900, argv: vec!["bash".into()] },
            ForegroundProcess { pid: child.id(), argv: vec!["sleep".into(), "30".into()] },
        ],
        child.id(),
    );
    let out = core.launch("a", &launch_spec()).unwrap();
    let LaunchOutcome::Launched(identity) = out else { panic!("{out:?}") };
    assert_eq!(identity.pid, child.id());
    assert_eq!(identity.pgid, child.id());
    assert!(!identity.start_time.is_empty());
    let run = driver.calls("pane.run");
    assert_eq!(run.len(), 1);
    assert!(run[0].contains("cd '/tmp' && 'sleep' '30'") && !run[0].contains("exec"), "{}", run[0]);
    assert!(core.reconcile_scan(0).unwrap().is_empty());
    let inspection = core.inspect("a", false);
    assert_eq!(inspection.pane, PaneState::Live);
    assert_eq!(inspection.foreground.map(|f| f.pid), Some(child.id()));
    child.kill().unwrap();
    child.wait().unwrap();
}

#[test]
fn a_command_that_replaced_the_shell_is_still_the_foreground_of_its_slot() {
    // `exec` makes the launched command the pane's own root process: its pid is the shell pid.
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("exec-root"));
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    let mut child = spawn_sleeper();
    driver.set_foreground(
        &slot.pane_id,
        child.id(),
        vec![ForegroundProcess { pid: child.id(), argv: vec!["sleep".into(), "30".into()] }],
        child.id(),
    );
    let LaunchOutcome::Launched(identity) = core.launch("a", &launch_spec()).unwrap() else { panic!("not launched") };
    assert_eq!(identity.pid, child.id());
    assert_eq!(core.inspect("a", false).foreground.map(|f| f.pid), Some(child.id()), "inspect finds the exec'd root through the launched marker");
    child.kill().unwrap();
    child.wait().unwrap();
    // The process is gone: nothing is reported as the foreground, whatever the marker says.
    driver.set_foreground(&slot.pane_id, 900, vec![ForegroundProcess { pid: 900, argv: vec!["bash".into()] }], 900);
    assert_eq!(core.inspect("a", false).foreground, None);
}

#[test]
fn a_server_restart_invalidates_old_records_and_never_closes_the_new_servers_panes() {
    let driver = MemDriver::new(352, 69);
    let root = state_dir("restart");
    let core = core(&driver, &MeasuredSplit, root);
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    driver.restart_server();
    // The pane id now belongs to the new incarnation; the old record must not reach it.
    let inspection = core.inspect("a", false);
    assert_eq!(inspection.pane, PaneState::Unknown);
    let released = core.release("a", Disposition::Close, None).unwrap();
    assert!(matches!(released, ReleaseOutcome::KeptUnknown { .. }), "{released:?}");
    assert!(driver.calls("pane.close").is_empty());
    assert!(driver.panes.borrow().contains_key(&slot.pane_id));
    let findings = core.reconcile_scan(0).unwrap();
    assert_eq!(findings.len(), 1);
    assert_eq!(findings[0].kind, FindingKind::StaleIncarnation);
    // The same key allocates again under the new incarnation, as a new pane.
    let again = core.allocate(&request("a", "g")).unwrap().slot;
    assert_ne!(again.pane_id, slot.pane_id);
}

#[test]
fn a_close_across_an_incarnation_change_is_kept_unknown() {
    // The driver itself reports the mismatch: the core keeps the pane.
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("close-mismatch"));
    core.allocate(&request("a", "g")).unwrap();
    // Bump the incarnation after the core read it: simulate through a release
    // whose expected incarnation is older than the live one.
    driver.restart_server();
    let out = core.release("a", Disposition::Close, None).unwrap();
    assert!(matches!(out, ReleaseOutcome::KeptUnknown { .. }));
    assert!(driver.calls("pane.close").is_empty());
}

#[test]
fn retain_closes_only_past_until_on_the_same_incarnation() {
    let driver = MemDriver::new(352, 69);
    let root = state_dir("retain");
    let now = Cell::new(1_000u64);
    let core = Core::new(&driver, &MeasuredSplit, config(root)).with_clock(|| now.get());
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    core.release("a", Disposition::Retain, Some(5_000)).unwrap();
    assert!(driver.calls("pane.close").is_empty());

    now.set(4_000);
    assert!(core.reconcile_scan(0).unwrap().is_empty());
    assert!(driver.panes.borrow().contains_key(&slot.pane_id));

    now.set(6_000);
    let findings = core.reconcile_scan(0).unwrap();
    assert_eq!(findings[0].kind, FindingKind::RetainExpired);
    assert!(!driver.panes.borrow().contains_key(&slot.pane_id));
}

#[test]
fn retain_with_a_foreign_foreground_is_kept() {
    let driver = MemDriver::new(352, 69);
    let now = Cell::new(1_000u64);
    let core = Core::new(&driver, &MeasuredSplit, config(state_dir("retain-foreign"))).with_clock(|| now.get());
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    core.release("a", Disposition::Retain, Some(2_000)).unwrap();
    driver.set_foreground(
        &slot.pane_id,
        900,
        vec![ForegroundProcess { pid: 31337, argv: vec!["vim".into()] }],
        31337,
    );
    now.set(9_000);
    let findings = core.reconcile_scan(0).unwrap();
    assert_eq!(findings[0].kind, FindingKind::Unknown);
    assert!(driver.panes.borrow().contains_key(&slot.pane_id));
}

#[test]
fn retain_without_until_is_kept_until_a_person_closes_it() {
    let driver = MemDriver::new(352, 69);
    let now = Cell::new(1_000u64);
    let core = Core::new(&driver, &MeasuredSplit, config(state_dir("retain-null"))).with_clock(|| now.get());
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    core.release("a", Disposition::Retain, None).unwrap();
    now.set(u64::MAX / 2);
    assert!(core.reconcile_scan(0).unwrap().is_empty());
    assert!(driver.panes.borrow().contains_key(&slot.pane_id));
}

#[test]
fn send_and_read_reach_the_pane_of_the_key() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("send-read"));
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    core.send("a", Some("hello"), None, true).unwrap();
    core.send("a", None, Some(&["Enter".to_string()]), false).unwrap();
    assert!(core.send("a", Some("x"), Some(&["Enter".to_string()]), false).is_err());
    assert_eq!(core.read("a", None, None).unwrap(), format!("screen of {}", slot.pane_id));
    core.label("a", &Display { label: "new".into(), ..Display::default() }, None).unwrap();
    assert_eq!(driver.calls("label.pane"), vec![format!("label.pane {} new", slot.pane_id)]);
}

#[test]
fn inspect_of_a_missing_key_or_gone_pane_is_not_live() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("inspect"));
    assert_eq!(core.inspect("nope", false).pane, PaneState::Unknown);
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    driver.kill_pane(&slot.pane_id);
    assert_eq!(core.inspect("a", false).pane, PaneState::Gone);
}

#[test]
fn a_command_that_replaced_the_shell_is_identified() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("exec-replaced-shell"));
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    let mut child = spawn_sleeper();
    // `exec` keeps the shell's pid: the foreground process is the shell pid itself.
    driver.set_foreground(
        &slot.pane_id,
        child.id(),
        vec![ForegroundProcess { pid: child.id(), argv: vec!["sleep".into(), "30".into()] }],
        child.id(),
    );
    let out = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(out, LaunchOutcome::Launched(ref i) if i.pid == child.id()), "{out:?}");
    child.kill().unwrap();
    child.wait().unwrap();
}

#[test]
fn close_after_retain_does_not_pretend_to_close() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("close-after-retain"));
    core.allocate(&request("a", "g")).unwrap();
    core.release("a", Disposition::Retain, Some(1)).unwrap();
    let out = core.release("a", Disposition::Close, None).unwrap();
    assert!(matches!(out, ReleaseOutcome::KeptUnknown { .. }), "{out:?}");
    assert!(driver.calls("pane.close").is_empty());
}

#[test]
fn the_core_never_launches_into_an_attached_or_released_slot() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("launch-guards"));
    let own = core.allocate(&request("own", "g")).unwrap().slot;
    core.attach("att", &own.pane_id, None, None).unwrap();
    assert!(core.launch("att", &launch_spec()).is_err());
    core.release("own", Disposition::Retain, None).unwrap();
    assert!(core.launch("own", &launch_spec()).is_err());
    assert!(driver.calls("pane.run").is_empty());
}
