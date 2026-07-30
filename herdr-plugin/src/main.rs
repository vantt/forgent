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
    let mut ui = RatatuiTerminalUi::init()?;

    let mut app = App::empty();
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

    let pane_orchestrator = HerdrPaneAdapter {
        herdr_bin: pick::herdr_bin(),
        workspace_id: std::env::var("HERDR_WORKSPACE_ID").unwrap_or_default(),
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

    // tsk-1q3 D2: the dashboard renames its own tab to `fg:cockpit` if it
    // isn't already — absent `HERDR_TAB_ID` (outside a real herdr pane)
    // just skips it, same degrade-gracefully shape as the pieces above.
    if let Ok(tab_id) = std::env::var("HERDR_TAB_ID") {
        if let Err(err) = layout::ensure_cockpit_label(&pick::herdr_bin(), &tab_id) {
            app.last_error = Some(format!("could not label dashboard tab fg:cockpit: {err}"));
        }
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
                UiEvent::Quit => return Ok(()),
                UiEvent::SwitchPanel => {
                    app.pick_status = None;
                    app.switch_panel();
                }
                UiEvent::Down => {
                    app.pick_status = None;
                    match app.focused_panel {
                        Panel::WorkItems => app.select_next(),
                        Panel::InProcess => app.select_next_in_process(),
                    }
                }
                UiEvent::Up => {
                    app.pick_status = None;
                    match app.focused_panel {
                        Panel::WorkItems => app.select_previous(),
                        Panel::InProcess => app.select_previous_in_process(),
                    }
                }
                // tsk-1eu D1: Enter's effect depends on which panel has
                // focus — "Work items" keeps today's pick action, "In
                // process" jumps to the selected task's pane (D2).
                // Already tsk-3t9-4's asked-for port/adapter shape: both
                // arms below call only `pane_orchestrator`'s
                // `PaneOrchestrator` methods, never a concrete adapter
                // directly.
                UiEvent::Pick => match app.focused_panel {
                    Panel::WorkItems => {
                        app.pick_status = Some(match app.selected_id() {
                            Some(id) => match pane_orchestrator.open_pick_pane(id) {
                                Ok(()) => format!("opened pane for /fgOS:pick {id}"),
                                Err(err) => format!("pick failed for {id}: {err}"),
                            },
                            None => "no row selected".to_string(),
                        });
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
                },
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
