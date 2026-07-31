use std::io;
use std::time::{Duration, Instant};

use herdr_fgos::app::{App, Panel};
use herdr_fgos::fgos::{self, FgosCliSource};
use herdr_fgos::layout;
use herdr_fgos::pane_scan::HerdrPaneScanner;
use herdr_fgos::pick::{self, HerdrPaneAdapter};
use herdr_fgos::ports::{PaneOrchestrator, PaneRegistry, TerminalUi, UiEvent, WorkItemSource};
use herdr_fgos::ui::RatatuiTerminalUi;

/// Same poll cadence as the existing STR40 bash cockpit's dashboard pane —
/// also the one tick pane-state refresh piggybacks on (tsk-4zo D1's
/// deferred cadence question, resolved here: no separate timer).
const POLL_INTERVAL: Duration = Duration::from_secs(5);

fn main() -> io::Result<()> {
    // tsk-3i3 D2/D3: before touching the terminal at all, check whether a
    // `fg:cockpit` tab already exists for this workspace. If so, hand off
    // to it and close this (now-redundant) tab instead of ever rendering
    // a second dashboard. Absent HERDR_WORKSPACE_ID/HERDR_TAB_ID (outside
    // a real herdr-managed pane, e.g. local dev/test) just skips this,
    // same degrade-gracefully shape the rest of this function already
    // uses.
    let mut cockpit_error: Option<String> = None;
    if let (Ok(workspace_id), Ok(tab_id)) = (
        std::env::var("HERDR_WORKSPACE_ID"),
        std::env::var("HERDR_TAB_ID"),
    ) {
        match layout::ensure_cockpit_tab(&pick::herdr_bin(), &workspace_id, &tab_id) {
            Ok(true) => return Ok(()), // handed off to the existing cockpit tab
            Ok(false) => {}            // this tab is now the cockpit tab
            Err(err) => cockpit_error = Some(format!("could not ensure dashboard's own cockpit tab: {err}")),
        }
    }

    let mut ui = RatatuiTerminalUi::init()?;

    let mut app = App::empty();
    if let Some(err) = cockpit_error {
        app.last_error = Some(err);
    }
    let root = fgos::repo_root();
    let source: Option<FgosCliSource> = match &root {
        Ok(root) => Some(FgosCliSource {
            root: root.clone(),
        }),
        Err(err) => {
            app.last_error = Some(format!("could not resolve fgOS repo root: {err}"));
            None
        }
    };
    if let Some(source) = &source {
        app.refresh_from_fgos(source);
    }

    // tsk-45u D1: the one already-resolved root is what every pane this
    // dashboard opens starts in — resolved here once, never a second time
    // deeper in, so the work list and the launched agents can never end up
    // pointed at two different projects.
    let pane_orchestrator = HerdrPaneAdapter {
        herdr_bin: pick::herdr_bin(),
        workspace_id: std::env::var("HERDR_WORKSPACE_ID").unwrap_or_default(),
        project_root: root.as_ref().ok().cloned(),
    };

    // Absent outside a real herdr-managed pane (dev/test) — pane refresh
    // is skipped entirely rather than erroring the whole dashboard, same
    // "degrade, don't crash" shape `root`'s own failure path above uses.
    let pane_registry: Option<HerdrPaneScanner> =
        std::env::var("HERDR_WORKSPACE_ID")
            .ok()
            .map(|workspace_id| HerdrPaneScanner {
                herdr_bin: pick::herdr_bin(),
                workspace_id,
            });
    if let Some(registry) = &pane_registry {
        app.refresh_pane_state(registry);
    }

    let result = run(
        &mut ui,
        &mut app,
        source.as_ref().map(|s| s as &dyn WorkItemSource),
        pane_registry.as_ref().map(|r| r as &dyn PaneRegistry),
        &pane_orchestrator,
        POLL_INTERVAL,
    );

    ui.teardown()?;

    result
}

fn run(
    ui: &mut impl TerminalUi,
    app: &mut App,
    source: Option<&dyn WorkItemSource>,
    registry: Option<&dyn PaneRegistry>,
    pane_orchestrator: &impl PaneOrchestrator,
    poll_interval: Duration,
) -> io::Result<()> {
    let mut last_poll = Instant::now();
    loop {
        ui.draw(app)?;

        if let Some(event) = ui.poll_event(Duration::from_millis(250))? {
            match event {
                // Esc/q double as "close the modal" while it's open — only
                // closes the whole dashboard once no modal is in the way.
                UiEvent::Quit => {
                    if app.detail_modal_open {
                        app.detail_modal_open = false;
                    } else {
                        return Ok(());
                    }
                }
                UiEvent::SwitchPanel => {
                    if !app.detail_modal_open {
                        app.pick_status = None;
                        app.switch_panel();
                    }
                }
                UiEvent::Down => {
                    if !app.detail_modal_open {
                        app.pick_status = None;
                        match app.focused_panel {
                            Panel::WorkItems => app.select_next(),
                            Panel::InProcess => app.select_next_in_process(),
                        }
                    }
                }
                UiEvent::Up => {
                    if !app.detail_modal_open {
                        app.pick_status = None;
                        match app.focused_panel {
                            Panel::WorkItems => app.select_previous(),
                            Panel::InProcess => app.select_previous_in_process(),
                        }
                    }
                }
                // Enter's effect depends on the detail modal and which
                // panel has focus: with the modal open, Enter fires the
                // Pick button (today's pick action) and closes it; closed
                // and focused on "Work items", Enter opens the modal
                // instead of picking directly; "In process" keeps jumping
                // straight to the selected task's pane. Both branches that
                // touch herdr call only `pane_orchestrator`'s
                // `PaneOrchestrator` methods, never a concrete adapter
                // directly.
                UiEvent::Pick => {
                    if app.detail_modal_open {
                        app.pick_status = Some(match app.selected_id() {
                            Some(id) => match pane_orchestrator.open_pick_pane(id) {
                                Ok(()) => format!("opened pane for /fgOS:pick {id}"),
                                Err(err) => format!("pick failed for {id}: {err}"),
                            },
                            None => "no row selected".to_string(),
                        });
                        app.detail_modal_open = false;
                    } else {
                        match app.focused_panel {
                            Panel::WorkItems => {
                                if app.selected_id().is_some() {
                                    app.detail_modal_open = true;
                                } else {
                                    app.pick_status = Some("no row selected".to_string());
                                }
                            }
                            Panel::InProcess => {
                                app.pick_status = Some(match app.selected_in_process_pane_id() {
                                    Some(pane_id) => match pane_orchestrator.focus_pane(pane_id) {
                                        Ok(()) => format!("focused pane {pane_id}"),
                                        Err(err) => format!("focus failed for {pane_id}: {err}"),
                                    },
                                    None => "no pane to jump to".to_string(),
                                });
                            }
                        }
                    }
                }
            }
        }

        // One unified tick drives both refreshes — neither gets its own
        // separate timer (tsk-4zo D1).
        if last_poll.elapsed() >= poll_interval {
            if let Some(source) = source {
                app.refresh_from_fgos(source);
            }
            if let Some(registry) = registry {
                app.refresh_pane_state(registry);
            }
            last_poll = Instant::now();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::Cell;
    use std::collections::HashMap;

    use herdr_fgos::fgos::{DoingRow, FgosError, TriageRow};
    use herdr_fgos::pane_scan::{PaneIdentity, PaneScanError};

    struct CountingSource {
        calls: Cell<u32>,
    }

    impl WorkItemSource for CountingSource {
        fn fetch_triage(&self) -> Result<Vec<TriageRow>, FgosError> {
            self.calls.set(self.calls.get() + 1);
            Ok(Vec::new())
        }

        fn fetch_doing(&self) -> Result<Vec<DoingRow>, FgosError> {
            Ok(Vec::new())
        }
    }

    struct CountingRegistry {
        calls: Cell<u32>,
    }

    impl PaneRegistry for CountingRegistry {
        fn scan(&self) -> Result<HashMap<String, PaneIdentity>, PaneScanError> {
            self.calls.set(self.calls.get() + 1);
            Ok(HashMap::new())
        }
    }

    struct NoopPaneOrchestrator;

    impl PaneOrchestrator for NoopPaneOrchestrator {
        fn open_pick_pane(&self, _id: &str) -> io::Result<()> {
            Ok(())
        }

        fn focus_pane(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }
    }

    /// Records every pane id it was asked to focus, so a test can assert
    /// on it without a real herdr binary.
    struct RecordingPaneOrchestrator {
        focused: std::cell::RefCell<Vec<String>>,
    }

    impl PaneOrchestrator for RecordingPaneOrchestrator {
        fn open_pick_pane(&self, _id: &str) -> io::Result<()> {
            Ok(())
        }

        fn focus_pane(&self, pane_id: &str) -> io::Result<()> {
            self.focused.borrow_mut().push(pane_id.to_string());
            Ok(())
        }
    }

    /// Records every work-item id it was asked to open a pick pane for, so
    /// a test can assert the Pick button only fires once, on the second
    /// Enter.
    struct RecordingPickOrchestrator {
        picked: std::cell::RefCell<Vec<String>>,
    }

    impl PaneOrchestrator for RecordingPickOrchestrator {
        fn open_pick_pane(&self, id: &str) -> io::Result<()> {
            self.picked.borrow_mut().push(id.to_string());
            Ok(())
        }

        fn focus_pane(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }
    }

    /// Returns, in order: `Pick`, `Pick`, `Quit` — enough to drive
    /// "open the detail modal, then fire its Pick button".
    struct PickTwiceThenQuit {
        calls: Cell<u32>,
    }

    impl TerminalUi for PickTwiceThenQuit {
        fn draw(&mut self, _app: &mut App) -> io::Result<()> {
            Ok(())
        }

        fn poll_event(&mut self, _timeout: Duration) -> io::Result<Option<UiEvent>> {
            let n = self.calls.get();
            self.calls.set(n + 1);
            Ok(match n {
                0 | 1 => Some(UiEvent::Pick),
                _ => Some(UiEvent::Quit),
            })
        }
    }

    /// Returns, in order: `Pick`, `Quit`, `Quit` — opens the detail modal,
    /// then presses Esc/q (mapped to `Quit`) twice: the first closes the
    /// modal, the second actually exits. Records `app.detail_modal_open`
    /// on every `draw` call so a test can see the modal toggle without a
    /// hook into the event loop's internals.
    struct PickThenQuitTwiceRecordingDraws {
        calls: Cell<u32>,
        modal_open_history: std::cell::RefCell<Vec<bool>>,
    }

    impl TerminalUi for PickThenQuitTwiceRecordingDraws {
        fn draw(&mut self, app: &mut App) -> io::Result<()> {
            self.modal_open_history.borrow_mut().push(app.detail_modal_open);
            Ok(())
        }

        fn poll_event(&mut self, _timeout: Duration) -> io::Result<Option<UiEvent>> {
            let n = self.calls.get();
            self.calls.set(n + 1);
            Ok(match n {
                0 => Some(UiEvent::Pick),
                1 => Some(UiEvent::Quit),
                _ => Some(UiEvent::Quit),
            })
        }
    }

    /// Returns, in order: `SwitchPanel`, then `Pick`, then `Quit` — enough
    /// to drive one full "switch to In process, press Enter" sequence.
    struct SwitchThenPickThenQuit {
        calls: Cell<u32>,
    }

    impl TerminalUi for SwitchThenPickThenQuit {
        fn draw(&mut self, _app: &mut App) -> io::Result<()> {
            Ok(())
        }

        fn poll_event(&mut self, _timeout: Duration) -> io::Result<Option<UiEvent>> {
            let n = self.calls.get();
            self.calls.set(n + 1);
            Ok(match n {
                0 => Some(UiEvent::SwitchPanel),
                1 => Some(UiEvent::Pick),
                _ => Some(UiEvent::Quit),
            })
        }
    }

    /// Returns `None` (let the tick fire) on the first call, then
    /// `Some(UiEvent::Quit)` on the second — exactly one loop iteration's
    /// worth of tick before the loop exits.
    struct QuitAfterOneTick {
        calls: Cell<u32>,
    }

    impl TerminalUi for QuitAfterOneTick {
        fn draw(&mut self, _app: &mut App) -> io::Result<()> {
            Ok(())
        }

        fn poll_event(&mut self, _timeout: Duration) -> io::Result<Option<UiEvent>> {
            let n = self.calls.get();
            self.calls.set(n + 1);
            Ok(if n == 0 { None } else { Some(UiEvent::Quit) })
        }
    }

    #[test]
    fn pane_focus_jumps_to_selected_in_process_pane_after_switching_panels() {
        let mut ui = SwitchThenPickThenQuit { calls: Cell::new(0) };
        let mut app = App::empty();
        app.in_process = vec![herdr_fgos::app::InProcessTask {
            id: "tsk-a".into(),
            title: "A".into(),
            pane: Some(PaneIdentity {
                pane_id: "wS:p1H".into(),
                tab_id: "wS:tE".into(),
            }),
        }];
        app.select_next_in_process(); // selects index 0
        let pane_orchestrator = RecordingPaneOrchestrator {
            focused: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO)
            .expect("run should exit cleanly on Quit");

        assert_eq!(app.focused_panel, Panel::InProcess);
        assert_eq!(*pane_orchestrator.focused.borrow(), vec!["wS:p1H".to_string()]);
    }

    #[test]
    fn pane_focus_reports_no_pane_when_selected_in_process_task_is_orphaned() {
        let mut ui = SwitchThenPickThenQuit { calls: Cell::new(0) };
        let mut app = App::empty();
        app.in_process = vec![herdr_fgos::app::InProcessTask {
            id: "tsk-b".into(),
            title: "B".into(),
            pane: None,
        }];
        app.select_next_in_process();
        let pane_orchestrator = RecordingPaneOrchestrator {
            focused: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO)
            .expect("run should exit cleanly on Quit");

        assert!(pane_orchestrator.focused.borrow().is_empty());
        assert_eq!(app.pick_status.as_deref(), Some("no pane to jump to"));
    }

    #[test]
    fn work_item_enter_opens_detail_modal_and_pick_only_fires_on_second_enter() {
        let mut ui = PickTwiceThenQuit { calls: Cell::new(0) };
        let mut app = App::empty();
        app.work_items = vec![herdr_fgos::app::WorkItem {
            id: "tsk-a".into(),
            title: "A".into(),
            goal_tier: "mvp".into(),
        }];
        app.select_next();
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO)
            .expect("run should exit cleanly on Quit");

        assert_eq!(*pane_orchestrator.picked.borrow(), vec!["tsk-a".to_string()]);
        assert!(!app.detail_modal_open);
        assert_eq!(app.pick_status.as_deref(), Some("opened pane for /fgOS:pick tsk-a"));
    }

    #[test]
    fn esc_closes_detail_modal_without_quitting_dashboard() {
        let mut ui = PickThenQuitTwiceRecordingDraws {
            calls: Cell::new(0),
            modal_open_history: std::cell::RefCell::new(Vec::new()),
        };
        let mut app = App::empty();
        app.work_items = vec![herdr_fgos::app::WorkItem {
            id: "tsk-a".into(),
            title: "A".into(),
            goal_tier: "mvp".into(),
        }];
        app.select_next();
        let pane_orchestrator = NoopPaneOrchestrator;

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO)
            .expect("run should exit cleanly on Quit");

        assert_eq!(
            *ui.modal_open_history.borrow(),
            vec![false, true, false],
            "modal opens on first Enter, closes on first Esc/q without quitting"
        );
    }

    #[test]
    fn pane_rescan_refreshes_pane_state_on_the_same_tick_as_fgos_data() {
        let mut ui = QuitAfterOneTick { calls: Cell::new(0) };
        let mut app = App::empty();
        let source = CountingSource { calls: Cell::new(0) };
        let registry = CountingRegistry { calls: Cell::new(0) };
        let pane_orchestrator = NoopPaneOrchestrator;

        // `Duration::ZERO` — `last_poll.elapsed() >= poll_interval` is
        // true on the very first loop iteration, no real sleeping needed.
        run(
            &mut ui,
            &mut app,
            Some(&source),
            Some(&registry),
            &pane_orchestrator,
            Duration::ZERO,
        )
        .expect("run should exit cleanly on Quit");

        assert_eq!(source.calls.get(), 1);
        assert_eq!(registry.calls.get(), 1);
    }

    #[test]
    fn pane_rescan_skips_pane_refresh_when_no_registry_is_configured() {
        let mut ui = QuitAfterOneTick { calls: Cell::new(0) };
        let mut app = App::empty();
        let source = CountingSource { calls: Cell::new(0) };
        let pane_orchestrator = NoopPaneOrchestrator;

        run(
            &mut ui,
            &mut app,
            Some(&source),
            None,
            &pane_orchestrator,
            Duration::ZERO,
        )
        .expect("run should exit cleanly on Quit");

        // fgos refresh still fires; pane refresh has nothing to call.
        assert_eq!(source.calls.get(), 1);
        assert!(app.last_error.is_none());
    }
}
