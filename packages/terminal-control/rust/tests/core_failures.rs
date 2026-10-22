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
    let mut cfg = config(state_dir("not-launched"));
    cfg.launch_identify_timeout_ms = 50;
    let core = Core::new(&driver, &MeasuredSplit, cfg);
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    // The foreground never becomes the command: the root is not identified.
    let out = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(out, LaunchOutcome::NotStarted { .. }), "{out:?}");
    let runs_before = driver.calls("pane.run").len();
    let again = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(again, LaunchOutcome::NotStarted { .. }));
    assert_eq!(driver.calls("pane.run").len(), runs_before, "second launch must not reach the driver");
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
    driver.set_launch_foreground(
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
    let last_run = run.last().expect("at least one pane.run call");
    assert!(last_run.contains("cd '/tmp' && 'sleep' '30'") && !last_run.contains("exec"), "{}", last_run);
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
    driver.set_launch_foreground(
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
    let mut child = spawn_sleeper();
    driver.set_foreground(&slot.pane_id, 900, vec![ForegroundProcess { pid: 900, argv: vec!["bash".into()] }, ForegroundProcess { pid: child.id(), argv: vec!["sleep".into(), "30".into()] }], child.id());
    assert_eq!(core.send("a", Some("hello"), None, true).unwrap(), SendOutcome::Sent);
    assert_eq!(core.send("a", None, Some(&["Enter".to_string()]), false).unwrap(), SendOutcome::Sent);
    assert!(core.send("a", Some("x"), Some(&["Enter".to_string()]), false).is_err());
    assert_eq!(driver.calls("send."), vec![format!("send.text {} hello true", slot.pane_id), format!("send.keys {} Enter", slot.pane_id)]);
    // A foreground program that is gone is no program to type at: nothing more reaches the pane.
    child.kill().unwrap();
    child.wait().unwrap();
    assert!(matches!(core.send("a", Some("late"), None, false).unwrap(), SendOutcome::ForegroundNotAgent { reason } if reason.contains("no live process")));
    assert_eq!(driver.calls("send.").len(), 2);
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
    driver.set_launch_foreground(
        &slot.pane_id,
        child.id(),
        vec![ForegroundProcess { pid: child.id(), argv: vec!["sleep".into(), "30".into()] }],
        child.id(),
    );
    let out = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(&out, LaunchOutcome::Launched(i) if i.pid == child.id()), "{out:?}");
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

#[test]
fn immediate_close_with_a_foreign_foreground_is_kept_without_a_release_marker() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("close-foreign"));
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    driver.set_foreground(&slot.pane_id, 900, vec![ForegroundProcess { pid: 31337, argv: vec!["vim".into()] }], 31337);
    assert!(matches!(core.release("a", Disposition::Close, None).unwrap(), ReleaseOutcome::KeptUnknown { .. }));
    assert!(driver.panes.borrow().contains_key(&slot.pane_id));
    driver.set_foreground(&slot.pane_id, 900, vec![ForegroundProcess { pid: 900, argv: vec!["bash".into()] }], 900);
    assert!(matches!(core.release("a", Disposition::Close, None).unwrap(), ReleaseOutcome::Released { disposition: Disposition::Close }));
    assert!(!driver.panes.borrow().contains_key(&slot.pane_id));
}

#[test]
fn immediate_close_without_process_info_is_kept_without_a_release_marker() {
    let driver = MemDriver::with_caps(352, 69, all_caps().into_iter().filter(|c| *c != "process.info").collect());
    let core = core(&driver, &MeasuredSplit, state_dir("close-no-process-info"));
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    // Even a shell-only foreground cannot be read without the capability: nothing proves the close is safe.
    driver.set_foreground(&slot.pane_id, 900, vec![ForegroundProcess { pid: 900, argv: vec!["bash".into()] }], 900);
    assert!(matches!(core.release("a", Disposition::Close, None).unwrap(), ReleaseOutcome::KeptUnknown { .. }));
    assert!(driver.panes.borrow().contains_key(&slot.pane_id));
    assert!(driver.calls("pane.close").is_empty());
}

#[test]
fn the_launcher_is_typed_only_after_the_shell_has_run_a_probe() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("token-first"));
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    let mut child = spawn_sleeper();
    driver.set_launch_foreground(
        &slot.pane_id,
        900,
        vec![
            ForegroundProcess { pid: 900, argv: vec!["bash".into()] },
            ForegroundProcess { pid: child.id(), argv: vec!["sleep".into(), "30".into()] },
        ],
        child.id(),
    );
    let out = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(out, LaunchOutcome::Launched(_)), "{out:?}");
    let runs = driver.calls("pane.run");
    assert_eq!(runs.len(), 2);
    assert!(runs[0].contains("printf '%s%s\\n' fgos-ok- "), "first call must be probe: {}", runs[0]);
    assert!(runs[1].contains("cd '/tmp' && 'sleep' '30'"), "second call must be launcher: {}", runs[1]);
    child.kill().unwrap();
    child.wait().unwrap();
}

#[test]
fn a_shell_whose_start_prompt_eats_the_first_key_still_gets_an_intact_launch_line() {
    let driver = MemDriver::new(352, 69);
    let mut cfg = config(state_dir("eats-first-key"));
    cfg.shell_ready_timeout_ms = 1_500;
    let core = Core::new(&driver, &MeasuredSplit, cfg);
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    driver.set_script(&slot.pane_id, ShellScript::PromptReadsFirstKey);
    let mut child = spawn_sleeper();
    driver.set_launch_foreground(
        &slot.pane_id,
        900,
        vec![
            ForegroundProcess { pid: 900, argv: vec!["bash".into()] },
            ForegroundProcess { pid: child.id(), argv: vec!["sleep".into(), "30".into()] },
        ],
        child.id(),
    );
    let out = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(out, LaunchOutcome::Launched(_)), "{out:?}");
    let runs = driver.calls("pane.run");
    assert_eq!(runs.len(), 3, "expected probe 1, probe 2, then launch line: {runs:?}");
    assert!(runs[0].contains("printf '%s%s\\n' fgos-ok- "));
    assert!(runs[1].contains("printf '%s%s\\n' fgos-ok- "));
    assert!(runs[2].contains("cd '/tmp' && 'sleep' '30'"), "launch line must be intact: {}", runs[2]);
    child.kill().unwrap();
    child.wait().unwrap();
}

#[test]
fn a_shell_serving_only_typed_echo_retypes_only_after_backoff_and_caps_at_three_probes() {
    let driver = MemDriver::new(352, 69);
    let mut cfg = config(state_dir("echo-only-backoff"));
    cfg.shell_ready_timeout_ms = 1_500;
    let core = Core::new(&driver, &MeasuredSplit, cfg);
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    driver.set_script(&slot.pane_id, ShellScript::EchoOnly);
    let out = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(&out, LaunchOutcome::NotStarted { reason } if reason.contains("not become ready")), "{out:?}");
    let runs = driver.calls("pane.run");
    assert_eq!(runs.len(), 3, "must type at most three probes after backoff: {runs:?}");
    for r in &runs {
        assert!(r.contains("printf '%s%s\\n' fgos-ok- "));
    }
}

#[test]
fn a_line_typed_before_the_start_prompt_draws_is_not_swallowed_and_launches_once() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("typed-ahead"));
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    driver.set_script(&slot.pane_id, ShellScript::TypedAheadSkipsPrompt);
    let mut child = spawn_sleeper();
    driver.set_launch_foreground(
        &slot.pane_id,
        900,
        vec![
            ForegroundProcess { pid: 900, argv: vec!["bash".into()] },
            ForegroundProcess { pid: child.id(), argv: vec!["sleep".into(), "30".into()] },
        ],
        child.id(),
    );
    let out = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(out, LaunchOutcome::Launched(_)), "{out:?}");
    let runs = driver.calls("pane.run");
    assert_eq!(runs.len(), 2, "single probe followed by single launch line: {runs:?}");
    assert!(runs[1].contains("cd '/tmp' && 'sleep' '30'"));
    child.kill().unwrap();
    child.wait().unwrap();
}

#[test]
fn a_shell_reading_whole_lines_gets_at_most_three_probes_and_ends_not_started() {
    let driver = MemDriver::new(352, 69);
    let mut cfg = config(state_dir("line-mode-read"));
    cfg.shell_ready_timeout_ms = 1_500;
    let core = Core::new(&driver, &MeasuredSplit, cfg);
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    driver.set_script(&slot.pane_id, ShellScript::LineModeRead);
    let out = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(&out, LaunchOutcome::NotStarted { reason } if reason.contains("not become ready")), "{out:?}");
    let runs = driver.calls("pane.run");
    assert_eq!(runs.len(), 3, "must type at most three probes: {runs:?}");
    for r in &runs {
        assert!(r.contains("printf '%s%s\\n' fgos-ok- "));
    }
}

#[test]
fn a_pane_whose_foreground_is_a_child_process_gets_nothing_typed_and_ends_not_started() {
    let driver = MemDriver::new(352, 69);
    let mut cfg = config(state_dir("non-shell-fg"));
    cfg.shell_ready_timeout_ms = 50;
    let core = Core::new(&driver, &MeasuredSplit, cfg);
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    driver.set_foreground(
        &slot.pane_id,
        900,
        vec![
            ForegroundProcess { pid: 900, argv: vec!["bash".into()] },
            ForegroundProcess { pid: 9999, argv: vec!["sudo".into(), "-i".into()] },
        ],
        9999,
    );
    let before = driver.calls("pane.run").len();
    let out = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(&out, LaunchOutcome::NotStarted { reason } if reason.contains("foreground is not the shell")), "{out:?}");
    assert_eq!(driver.calls("pane.run").len(), before, "pane.run delta must be zero");
}

#[test]
fn a_shell_that_never_becomes_ready_ends_not_started_with_no_marker_and_reports_bare_shell() {
    let driver = MemDriver::new(352, 69);
    let mut cfg = config(state_dir("never-ready"));
    cfg.shell_ready_timeout_ms = 50;
    cfg.allocation_grace_ms = 50;
    let now = Cell::new(100_000u64);
    let core = Core::new(&driver, &MeasuredSplit, cfg).with_clock(|| now.get());
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    driver.set_script(&slot.pane_id, ShellScript::LineModeRead);

    let out = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(out, LaunchOutcome::NotStarted { .. }), "{out:?}");

    // No launch-requested marker exists: relaunchable!
    driver.set_script(&slot.pane_id, ShellScript::Ready);
    let mut child = spawn_sleeper();
    driver.set_launch_foreground(
        &slot.pane_id,
        900,
        vec![
            ForegroundProcess { pid: 900, argv: vec!["bash".into()] },
            ForegroundProcess { pid: child.id(), argv: vec!["sleep".into(), "30".into()] },
        ],
        child.id(),
    );
    // Before launching again, check reconcile scan past grace reports plain bare-shell slot:
    now.set(100_000 + 100);
    let findings = core.reconcile_scan(0).unwrap();
    assert_eq!(findings.len(), 1);
    assert_eq!(findings[0].kind, FindingKind::AllocatedNotLaunchedBareShell);

    // Launch again succeeds:
    let out2 = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(out2, LaunchOutcome::Launched(_)), "{out2:?}");
    child.kill().unwrap();
    child.wait().unwrap();
}

#[test]
fn every_probe_differs_contains_no_y_and_scrollback_token_does_not_satisfy() {
    let driver = MemDriver::new(352, 69);
    let mut cfg = config(state_dir("scrollback-check"));
    cfg.shell_ready_timeout_ms = 1_500;
    let core = Core::new(&driver, &MeasuredSplit, cfg);
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    driver.set_screen(&slot.pane_id, "earlier session\nfgos-ok-cafebabedeadbeef0123456789abcdef\n");
    driver.set_script(&slot.pane_id, ShellScript::LineModeRead);

    let out = core.launch("a", &launch_spec()).unwrap();
    assert!(matches!(out, LaunchOutcome::NotStarted { .. }), "{out:?}");

    let runs = driver.calls("pane.run");
    assert_eq!(runs.len(), 3);
    let mut nonces = Vec::new();
    for r in &runs {
        assert!(!r.contains('y') && !r.contains('Y'), "probe must not contain y or Y: {r}");
        let nonce = r.strip_prefix(&format!("pane.run {} printf '%s%s\\n' fgos-ok- ", slot.pane_id)).expect("probe format").trim();
        nonces.push(nonce.to_string());
    }
    assert_ne!(nonces[0], nonces[1]);
    assert_ne!(nonces[1], nonces[2]);
    assert_ne!(nonces[0], nonces[2]);
}

#[test]
fn a_vanished_pane_ends_the_handshake_at_once_with_unknown() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("vanished"));
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    *driver.vanish_on_process_info.borrow_mut() = Some(slot.pane_id.clone());
    let out = core.launch("a", &launch_spec());
    assert!(matches!(&out, Err(Refusal::Unknown { reason }) if reason.contains("pane is gone")), "{out:?}");
}

#[test]
fn a_created_pane_gets_the_quiet_env() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("quiet-env-created"));
    let req1 = request("pane-tab", "group-1");
    let slot1 = core.allocate(&req1).unwrap().slot;

    let env1 = driver.env_of(&slot1.pane_id).expect("env recorded for created tab pane");
    assert!(
        env1.contains(&("DISABLE_AUTO_UPDATE".to_string(), "true".to_string())),
        "created tab pane must receive DISABLE_AUTO_UPDATE=true, got {env1:?}"
    );

    let req2 = request("pane-split", "group-1");
    let slot2 = core.allocate(&req2).unwrap().slot;
    let env2 = driver.env_of(&slot2.pane_id).expect("env recorded for created split pane");
    assert!(
        env2.contains(&("DISABLE_AUTO_UPDATE".to_string(), "true".to_string())),
        "created split pane must receive DISABLE_AUTO_UPDATE=true, got {env2:?}"
    );
}

#[test]
fn a_caller_value_for_the_same_key_wins() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("quiet-env-caller-wins"));
    let mut req = request("pane-override", "group-1");
    req.env.insert("DISABLE_AUTO_UPDATE".into(), "false".into());
    let slot = core.allocate(&req).unwrap().slot;

    let env = driver.env_of(&slot.pane_id).expect("env recorded for created pane");
    assert!(
        env.contains(&("DISABLE_AUTO_UPDATE".to_string(), "false".to_string())),
        "caller-provided DISABLE_AUTO_UPDATE must win, got {env:?}"
    );
    assert!(
        !env.contains(&("DISABLE_AUTO_UPDATE".to_string(), "true".to_string())),
        "default DISABLE_AUTO_UPDATE=true must not be added when caller provides it, got {env:?}"
    );
}

#[test]
fn an_attached_pane_is_created_with_no_env() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("attached-no-env"));
    let tab = "t-existing".to_string();
    let pane = "p-existing".to_string();
    driver.tabs.borrow_mut().push((tab.clone(), "ext".into()));
    driver.panes.borrow_mut().insert(
        pane.clone(),
        MemPane::new(&pane, tab, driver.area, bare(500), vec![]),
    );

    let tab_creates_before = driver.calls("tab.create").len();
    let splits_before = driver.calls("pane.split").len();

    let attached = core.attach("attached-key", &pane, None, None).unwrap();
    assert_eq!(attached.origin, Origin::Attached);
    assert_eq!(attached.slot.pane_id, pane);

    assert_eq!(driver.calls("tab.create").len(), tab_creates_before);
    assert_eq!(driver.calls("pane.split").len(), splits_before);
    let env = driver.env_of(&pane).expect("pane exists");
    assert!(env.is_empty(), "attached pane must have no env injected, got {env:?}");
}
