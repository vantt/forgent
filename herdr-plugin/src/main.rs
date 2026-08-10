use std::io;
use std::path::Path;
use std::time::{Duration, Instant};

use herdr_fgos::app::{App, Panel, WorkItem};
use herdr_fgos::fgos::{self, FgosCliSource};
use herdr_fgos::layout;
use herdr_fgos::pane_scan::{self, HerdrPaneScanner};
use herdr_fgos::pick::{self, HerdrPaneAdapter};
use herdr_fgos::ports::{PaneOrchestrator, PaneRegistry, TerminalUi, UiEvent, WorkItemSource};
use herdr_fgos::settings;
use herdr_fgos::ui::RatatuiTerminalUi;

/// Same poll cadence as the existing STR40 bash cockpit's dashboard pane —
/// also the one tick pane-state refresh piggybacks on (tsk-4zo D1's
/// deferred cadence question, resolved here: no separate timer).
const POLL_INTERVAL: Duration = Duration::from_secs(5);

fn main() -> io::Result<()> {
    // tsk-45u D1: resolved once, up front, so the fixed `fg:operation`
    // tab this dashboard creates at startup (below) and every pane it
    // opens later both start in the same project root.
    let root = fgos::repo_root();

    // tsk-3i3 D2/D3: before touching the terminal at all, check whether a
    // `fg:cockpit` tab already exists for this workspace. If so, hand off
    // to it and close this (now-redundant) tab instead of ever rendering
    // a second dashboard. Absent HERDR_WORKSPACE_ID/HERDR_TAB_ID (outside
    // a real herdr-managed pane, e.g. local dev/test) just skips this,
    // same degrade-gracefully shape the rest of this function already
    // uses.
    let mut cockpit_error: Option<String> = None;
    let mut operation_tab_error: Option<String> = None;
    let mut operation_panes: Option<(String, String)> = None;
    if let (Ok(workspace_id), Ok(tab_id)) = (
        std::env::var("HERDR_WORKSPACE_ID"),
        std::env::var("HERDR_TAB_ID"),
    ) {
        match layout::ensure_cockpit_tab(&pick::herdr_bin(), &workspace_id, &tab_id) {
            Ok(true) => return Ok(()), // handed off to the existing cockpit tab
            Ok(false) => {}            // this tab is now the cockpit tab
            Err(err) => cockpit_error = Some(format!("could not ensure dashboard's own cockpit tab: {err}")),
        }

        // tsk-5lr CONTEXT.md D1: the fixed `fg:operation` tab, created or
        // found eagerly at startup the same way `ensure_cockpit_tab` just
        // was above -- never lazy on first loop-launch attempt.
        if let Ok(project_root) = &root {
            match layout::ensure_operation_tab(&pick::herdr_bin(), &workspace_id, project_root) {
                Ok(panes) => operation_panes = Some(panes),
                Err(err) => {
                    operation_tab_error = Some(format!("could not ensure fg:operation tab: {err}"))
                }
            }
        }
    }

    let mut ui = RatatuiTerminalUi::init()?;

    let mut app = App::empty();
    if let Some(err) = cockpit_error {
        app.last_error = Some(err);
    }
    if let Some(err) = operation_tab_error {
        app.last_error = Some(err);
    }
    if let Some((left, right)) = operation_panes {
        app.operation_left_pane_id = Some(left);
        app.operation_right_pane_id = Some(right);
    }
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
        root.as_deref().ok(),
    );

    ui.teardown()?;

    result
}

/// tsk-2ja Shape step 1: the first item ready for an unattended
/// `/fgOS:discover` launch this tick — the exact same `stage == "clarify"`
/// gate the manual Discover button already enforces (`UiEvent::Discover`
/// below), plus `status == "todo"` (never `doing`/`blocked`/
/// `awaiting-human`, all of which mean a person or another session
/// already owns it). One candidate only, never a batch — the caller
/// launches at most one pane per tick.
fn next_auto_discover_candidate(work_items: &[WorkItem]) -> Option<&WorkItem> {
    work_items
        .iter()
        .find(|item| item.stage == "clarify" && item.status == "todo")
}

fn run(
    ui: &mut impl TerminalUi,
    app: &mut App,
    source: Option<&dyn WorkItemSource>,
    registry: Option<&dyn PaneRegistry>,
    pane_orchestrator: &impl PaneOrchestrator,
    poll_interval: Duration,
    root: Option<&Path>,
) -> io::Result<()> {
    let mut last_poll = Instant::now();
    loop {
        ui.draw(app)?;

        if let Some(event) = ui.poll_event(app, Duration::from_millis(250))? {
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
                UiEvent::SwitchPanelPrev => {
                    if !app.detail_modal_open {
                        app.pick_status = None;
                        app.switch_panel_prev();
                    }
                }
                UiEvent::Down => {
                    if !app.detail_modal_open {
                        app.pick_status = None;
                        match app.focused_panel {
                            Panel::WorkItems => app.select_next(),
                            Panel::InProcess => app.select_next_in_process(),
                            // tsk-3wl D1: view-only boxes scroll instead of
                            // selecting a row.
                            Panel::NeedAnswer => app.scroll_need_answer_down(),
                            Panel::MergeList => app.scroll_merge_list_down(),
                            Panel::AfterDeliver => app.scroll_after_deliver_down(),
                        }
                    }
                }
                UiEvent::Up => {
                    if !app.detail_modal_open {
                        app.pick_status = None;
                        match app.focused_panel {
                            Panel::WorkItems => app.select_previous(),
                            Panel::InProcess => app.select_previous_in_process(),
                            Panel::NeedAnswer => app.scroll_need_answer_up(),
                            Panel::MergeList => app.scroll_merge_list_up(),
                            Panel::AfterDeliver => app.scroll_after_deliver_up(),
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
                            // tsk-3wl D1: NeedAnswer/MergeList/AfterDeliver
                            // are view-only — Enter is inert while one of
                            // them has focus.
                            Panel::NeedAnswer | Panel::MergeList | Panel::AfterDeliver => {}
                        }
                    }
                }
                // tsk-1e3 D4: only meaningful while the detail modal is
                // open, and only fires when the selected item's stage is
                // `clarify` — otherwise inert (the disabled/dimmed button
                // gives no keyboard action to fire, D4's own "disable,
                // never hide" shape carried through to the event loop).
                UiEvent::Discover => {
                    if app.detail_modal_open {
                        let is_clarify = app
                            .selected_work_item()
                            .is_some_and(|item| item.stage == "clarify");
                        if is_clarify {
                            app.pick_status = Some(match app.selected_id() {
                                Some(id) => match pane_orchestrator.open_discover_pane(id) {
                                    Ok(()) => format!("opened pane for /fgOS:discover {id}"),
                                    Err(err) => format!("discover failed for {id}: {err}"),
                                },
                                None => "no row selected".to_string(),
                            });
                            app.detail_modal_open = false;
                        }
                    }
                }
                // tsk-64z D1: tab-cycling is inert with the modal open,
                // same discipline every other Work-Items-panel action
                // already follows.
                UiEvent::NextTab => {
                    if !app.detail_modal_open {
                        app.pick_status = None;
                        app.next_tab();
                    }
                }
                UiEvent::PrevTab => {
                    if !app.detail_modal_open {
                        app.pick_status = None;
                        app.prev_tab();
                    }
                }
                // tsk-64z D8: `/` only ever reaches this arm outside filter
                // -input mode (poll_event only emits `ActivateFilter` when
                // `app.filter_input_active` is already false) — inert with
                // the modal open, same as every other Work-Items action.
                UiEvent::ActivateFilter => {
                    if !app.detail_modal_open {
                        app.activate_filter();
                    }
                }
                UiEvent::FilterChar(c) => app.filter_push_char(c),
                UiEvent::FilterBackspace => app.filter_backspace(),
                UiEvent::FilterSubmit => app.filter_submit(),
                UiEvent::FilterCancel => app.filter_cancel(),
                // tsk-bvh D1: `poll_event` only ever produces either of
                // these while the modal is closed (its own mouse-handling
                // branch returns early on `app.detail_modal_open`), so
                // there is no modal guard to repeat here.
                UiEvent::ClickFocus(panel) => {
                    app.pick_status = None;
                    app.focused_panel = panel;
                }
                UiEvent::ClickSelectRow(panel, index) => {
                    app.pick_status = None;
                    app.focused_panel = panel;
                    match panel {
                        Panel::WorkItems => app.selected = Some(index),
                        Panel::InProcess => app.in_process_selected = Some(index),
                        // D1: `poll_event`'s `click_target` never produces
                        // this for the 3 view-only boxes — defensive no-op
                        // if that ever changes, matching `UiEvent::Pick`'s
                        // own D1 no-op arm above.
                        Panel::NeedAnswer | Panel::MergeList | Panel::AfterDeliver => {}
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
            // tsk-2m5: fail-closed local file read, no port/test-seam
            // needed (unlike the two calls above, which shell out to an
            // external process/registry) — storing only, no launcher
            // logic here (tsk-2ja/tsk-57q's own footprint).
            if let Some(root) = root {
                app.orchestrator_settings = settings::read_settings(root);
            }
            // tsk-2ja: unattended auto-discover launch, at most one per
            // tick. Any failure (cap refusal, rename failure, spawn
            // failure) is swallowed here — never surfaced as
            // `app.pick_status` (person-initiated actions only), never
            // retried within the same tick, never queued; a fresh
            // candidate read next tick is the only retry.
            if app.orchestrator_settings.auto_discover {
                if let Some(candidate) = next_auto_discover_candidate(&app.work_items) {
                    let id = candidate.id.clone();
                    let label = pick::auto_discover_pane_label(&id);
                    let already_open = registry
                        .and_then(|registry| registry.scan_raw().ok())
                        .is_some_and(|json| {
                            pane_scan::has_labeled_pane(&json, &label).unwrap_or(false)
                        });
                    if !already_open {
                        let _ = pane_orchestrator.open_auto_discover_pane(&id);
                    }
                }
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

        fn fetch_need_answer(&self) -> Result<Vec<herdr_fgos::fgos::NeedAnswerRow>, FgosError> {
            Ok(Vec::new())
        }

        fn fetch_after_deliver(&self) -> Result<Vec<herdr_fgos::fgos::AfterDeliverRow>, FgosError> {
            Ok(Vec::new())
        }

        fn fetch_merge_list(&self) -> Result<herdr_fgos::fgos::MergeListSummary, FgosError> {
            Ok(herdr_fgos::fgos::MergeListSummary::default())
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

        fn scan_raw(&self) -> Result<String, PaneScanError> {
            Ok(r#"{"result":{"panes":[]}}"#.to_string())
        }
    }

    struct NoopPaneOrchestrator;

    impl PaneOrchestrator for NoopPaneOrchestrator {
        fn open_pick_pane(&self, _id: &str) -> io::Result<()> {
            Ok(())
        }

        fn open_discover_pane(&self, _id: &str) -> io::Result<()> {
            Ok(())
        }

        fn focus_pane(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn open_auto_discover_pane(&self, _id: &str) -> io::Result<()> {
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

        fn open_discover_pane(&self, _id: &str) -> io::Result<()> {
            Ok(())
        }

        fn focus_pane(&self, pane_id: &str) -> io::Result<()> {
            self.focused.borrow_mut().push(pane_id.to_string());
            Ok(())
        }

        fn open_auto_discover_pane(&self, _id: &str) -> io::Result<()> {
            Ok(())
        }
    }

    /// Records every work-item id it was asked to open a pick, discover,
    /// or auto-discover pane for, so a test can assert each fires exactly
    /// once (tsk-1e3, tsk-2ja).
    struct RecordingPickOrchestrator {
        picked: std::cell::RefCell<Vec<String>>,
        discovered: std::cell::RefCell<Vec<String>>,
        auto_discovered: std::cell::RefCell<Vec<String>>,
    }

    impl PaneOrchestrator for RecordingPickOrchestrator {
        fn open_pick_pane(&self, id: &str) -> io::Result<()> {
            self.picked.borrow_mut().push(id.to_string());
            Ok(())
        }

        fn open_discover_pane(&self, id: &str) -> io::Result<()> {
            self.discovered.borrow_mut().push(id.to_string());
            Ok(())
        }

        fn focus_pane(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn open_auto_discover_pane(&self, id: &str) -> io::Result<()> {
            self.auto_discovered.borrow_mut().push(id.to_string());
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

        fn poll_event(&mut self, _app: &App, _timeout: Duration) -> io::Result<Option<UiEvent>> {
            let n = self.calls.get();
            self.calls.set(n + 1);
            Ok(match n {
                0 | 1 => Some(UiEvent::Pick),
                _ => Some(UiEvent::Quit),
            })
        }
    }

    /// Returns, in order: `Pick`, `Discover`, `Quit` — opens the detail
    /// modal, then fires its Discover button (tsk-1e3 D4).
    struct DiscoverTwiceThenQuit {
        calls: Cell<u32>,
    }

    impl TerminalUi for DiscoverTwiceThenQuit {
        fn draw(&mut self, _app: &mut App) -> io::Result<()> {
            Ok(())
        }

        fn poll_event(&mut self, _app: &App, _timeout: Duration) -> io::Result<Option<UiEvent>> {
            let n = self.calls.get();
            self.calls.set(n + 1);
            Ok(match n {
                0 => Some(UiEvent::Pick),
                1 => Some(UiEvent::Discover),
                _ => Some(UiEvent::Quit),
            })
        }
    }

    /// Returns, in order: `Pick`, `Discover`, `Quit`, `Quit` — opens the
    /// detail modal, presses `d` (inert when the selected item isn't at
    /// `clarify` — the modal stays open), then Esc/q twice to close and
    /// exit.
    struct DiscoverThenQuit {
        calls: Cell<u32>,
    }

    impl TerminalUi for DiscoverThenQuit {
        fn draw(&mut self, _app: &mut App) -> io::Result<()> {
            Ok(())
        }

        fn poll_event(&mut self, _app: &App, _timeout: Duration) -> io::Result<Option<UiEvent>> {
            let n = self.calls.get();
            self.calls.set(n + 1);
            Ok(match n {
                0 => Some(UiEvent::Pick),
                1 => Some(UiEvent::Discover),
                _ => Some(UiEvent::Quit),
            })
        }
    }

    /// tsk-40t D5: simulates a mouse click at a fixed `(click_col,
    /// click_row)` by checking it against `app.pick_button_rect`/
    /// `discover_button_rect` the SAME way the real `RatatuiTerminalUi::
    /// poll_event`'s `Event::Mouse` branch does (`ui.rs`) — the fake
    /// bypasses real crossterm event parsing (same "fake TerminalUi tests
    /// the domain-event contract, not raw terminal I/O" pattern every
    /// other key binding in this file already uses), but exercises the
    /// REAL `ButtonRect::contains` hit-test math against REAL app state.
    struct ClickAtFixedCoordsThenQuit {
        calls: Cell<u32>,
        click_col: u16,
        click_row: u16,
    }

    impl TerminalUi for ClickAtFixedCoordsThenQuit {
        fn draw(&mut self, _app: &mut App) -> io::Result<()> {
            Ok(())
        }

        fn poll_event(&mut self, app: &App, _timeout: Duration) -> io::Result<Option<UiEvent>> {
            let n = self.calls.get();
            self.calls.set(n + 1);
            if n == 0 {
                let hit = app
                    .pick_button_rect
                    .is_some_and(|rect| rect.contains(self.click_col, self.click_row));
                return Ok(if hit { Some(UiEvent::Pick) } else { None });
            }
            Ok(Some(UiEvent::Quit))
        }
    }

    #[test]
    fn mouse_click_inside_pick_button_rect_fires_pick() {
        let mut app = App::empty();
        app.work_items = vec![herdr_fgos::app::WorkItem {
            id: "tsk-a".into(),
            title: "A".into(),
            goal_tier: "mvp".into(),
            stage: "executing".into(),
            status: "todo".into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        }];
        app.select_next();
        // Modal already open (as if a prior Enter opened it) with a
        // recorded Pick button Rect, exactly what a real `draw()` call
        // would have left behind.
        app.detail_modal_open = true;
        app.pick_button_rect = Some(herdr_fgos::app::ButtonRect {
            x: 10,
            y: 5,
            width: 10,
            height: 3,
        });

        let mut ui = ClickAtFixedCoordsThenQuit {
            calls: Cell::new(0),
            click_col: 12, // inside x: 10..20
            click_row: 6,  // inside y: 5..8
        };
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert_eq!(*pane_orchestrator.picked.borrow(), vec!["tsk-a".to_string()]);
    }

    #[test]
    fn mouse_click_outside_pick_button_rect_fires_nothing() {
        let mut app = App::empty();
        app.work_items = vec![herdr_fgos::app::WorkItem {
            id: "tsk-a".into(),
            title: "A".into(),
            goal_tier: "mvp".into(),
            stage: "executing".into(),
            status: "todo".into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        }];
        app.select_next();
        app.detail_modal_open = true;
        app.pick_button_rect = Some(herdr_fgos::app::ButtonRect {
            x: 10,
            y: 5,
            width: 10,
            height: 3,
        });

        let mut ui = ClickAtFixedCoordsThenQuit {
            calls: Cell::new(0),
            click_col: 50, // well outside the rect
            click_row: 20,
        };
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        // A miss (n=0) returns `Ok(None)` -- no event at all this tick,
        // so nothing fires. The subsequent `Quit`s (n>=1) are what
        // actually close the modal then exit, same pre-existing
        // Quit-closes-modal-first behavior every other test in this file
        // already relies on -- not something the miss itself caused.
        assert!(pane_orchestrator.picked.borrow().is_empty(), "a miss must fire nothing");
    }

    /// Returns, in order: `NextTab`, `NextTab`, `Quit` — cycles the Work
    /// Items tab twice (tsk-64z D1).
    struct NextTabTwiceThenQuit {
        calls: Cell<u32>,
    }

    impl TerminalUi for NextTabTwiceThenQuit {
        fn draw(&mut self, _app: &mut App) -> io::Result<()> {
            Ok(())
        }

        fn poll_event(&mut self, _app: &App, _timeout: Duration) -> io::Result<Option<UiEvent>> {
            let n = self.calls.get();
            self.calls.set(n + 1);
            Ok(match n {
                0 | 1 => Some(UiEvent::NextTab),
                _ => Some(UiEvent::Quit),
            })
        }
    }

    #[test]
    fn next_tab_event_cycles_the_active_tab() {
        let mut ui = NextTabTwiceThenQuit { calls: Cell::new(0) };
        let mut app = App::empty();
        assert_eq!(app.active_tab, herdr_fgos::app::WorkTab::Todo);
        let pane_orchestrator = NoopPaneOrchestrator;

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert_eq!(
            app.active_tab,
            herdr_fgos::app::WorkTab::Review,
            "TODO -> DOING -> REVIEW after two NextTab events"
        );
    }

    /// Returns, in order: `ActivateFilter`, `FilterChar('a')`,
    /// `FilterChar('b')`, `FilterSubmit`, `Quit` — types "ab" into the
    /// filter then applies it (tsk-64z D8).
    struct TypeFilterThenSubmitThenQuit {
        calls: Cell<u32>,
    }

    impl TerminalUi for TypeFilterThenSubmitThenQuit {
        fn draw(&mut self, _app: &mut App) -> io::Result<()> {
            Ok(())
        }

        fn poll_event(&mut self, _app: &App, _timeout: Duration) -> io::Result<Option<UiEvent>> {
            let n = self.calls.get();
            self.calls.set(n + 1);
            Ok(match n {
                0 => Some(UiEvent::ActivateFilter),
                1 => Some(UiEvent::FilterChar('a')),
                2 => Some(UiEvent::FilterChar('b')),
                3 => Some(UiEvent::FilterSubmit),
                _ => Some(UiEvent::Quit),
            })
        }
    }

    #[test]
    fn filter_char_events_build_the_query_and_submit_applies_it() {
        let mut ui = TypeFilterThenSubmitThenQuit { calls: Cell::new(0) };
        let mut app = App::empty();
        let pane_orchestrator = NoopPaneOrchestrator;

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert_eq!(app.filter_query, "ab");
        assert!(!app.filter_input_active, "FilterSubmit leaves input mode");
    }

    /// Returns, in order: `ActivateFilter`, `FilterChar('a')`,
    /// `FilterCancel`, `Quit` — types then cancels (tsk-64z D8: Esc clears
    /// the query, unlike `FilterSubmit`).
    struct TypeFilterThenCancelThenQuit {
        calls: Cell<u32>,
    }

    impl TerminalUi for TypeFilterThenCancelThenQuit {
        fn draw(&mut self, _app: &mut App) -> io::Result<()> {
            Ok(())
        }

        fn poll_event(&mut self, _app: &App, _timeout: Duration) -> io::Result<Option<UiEvent>> {
            let n = self.calls.get();
            self.calls.set(n + 1);
            Ok(match n {
                0 => Some(UiEvent::ActivateFilter),
                1 => Some(UiEvent::FilterChar('a')),
                2 => Some(UiEvent::FilterCancel),
                _ => Some(UiEvent::Quit),
            })
        }
    }

    #[test]
    fn filter_cancel_event_clears_the_query() {
        let mut ui = TypeFilterThenCancelThenQuit { calls: Cell::new(0) };
        let mut app = App::empty();
        let pane_orchestrator = NoopPaneOrchestrator;

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert_eq!(app.filter_query, "");
        assert!(!app.filter_input_active);
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

        fn poll_event(&mut self, _app: &App, _timeout: Duration) -> io::Result<Option<UiEvent>> {
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

        fn poll_event(&mut self, _app: &App, _timeout: Duration) -> io::Result<Option<UiEvent>> {
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

        fn poll_event(&mut self, _app: &App, _timeout: Duration) -> io::Result<Option<UiEvent>> {
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

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
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

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
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
            stage: "executing".into(),
            status: "todo".into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        }];
        app.select_next();
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert_eq!(*pane_orchestrator.picked.borrow(), vec!["tsk-a".to_string()]);
        assert!(!app.detail_modal_open);
        assert_eq!(app.pick_status.as_deref(), Some("opened pane for /fgOS:pick tsk-a"));
    }

    /// tsk-1e3 D4: Discover only fires while the modal is open AND the
    /// selected item's stage is `clarify` — mirrors the Pick test above
    /// (`PickTwiceThenQuit`/`work_item_enter_opens_detail_modal_and_pick_
    /// only_fires_on_second_enter`), driving `d` instead of `Enter` twice.
    #[test]
    fn discover_button_fires_pane_open_when_item_is_at_clarify_stage() {
        let mut ui = DiscoverTwiceThenQuit { calls: Cell::new(0) };
        let mut app = App::empty();
        app.work_items = vec![herdr_fgos::app::WorkItem {
            id: "tsk-a".into(),
            title: "A".into(),
            goal_tier: "mvp".into(),
            stage: "clarify".into(),
            status: "todo".into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        }];
        app.select_next();
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert_eq!(*pane_orchestrator.discovered.borrow(), vec!["tsk-a".to_string()]);
        assert!(pane_orchestrator.picked.borrow().is_empty());
        assert!(!app.detail_modal_open);
        assert_eq!(
            app.pick_status.as_deref(),
            Some("opened pane for /fgOS:discover tsk-a")
        );
    }

    /// tsk-1e3 D4: `d` is inert when the selected item's stage isn't
    /// `clarify` — the modal stays open, nothing is opened, no status is
    /// set (the disabled button gives no keyboard action to fire).
    #[test]
    fn discover_button_is_inert_when_item_is_not_at_clarify_stage() {
        let mut ui = DiscoverThenQuit { calls: Cell::new(0) };
        let mut app = App::empty();
        app.work_items = vec![herdr_fgos::app::WorkItem {
            id: "tsk-a".into(),
            title: "A".into(),
            goal_tier: "mvp".into(),
            stage: "executing".into(),
            status: "todo".into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        }];
        app.select_next();
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert!(pane_orchestrator.discovered.borrow().is_empty());
        assert!(app.pick_status.is_none());
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
            stage: "executing".into(),
            status: "todo".into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        }];
        app.select_next();
        let pane_orchestrator = NoopPaneOrchestrator;

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
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
            None,
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
            None,
        )
        .expect("run should exit cleanly on Quit");

        // fgos refresh still fires; pane refresh has nothing to call.
        assert_eq!(source.calls.get(), 1);
        assert!(app.last_error.is_none());
    }

    fn clarify_todo_item(id: &str) -> WorkItem {
        WorkItem {
            id: id.into(),
            title: id.into(),
            goal_tier: "mvp".into(),
            stage: "clarify".into(),
            status: "todo".into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        }
    }

    #[test]
    fn auto_discover_selects_the_first_clarify_todo_item() {
        let items = vec![
            {
                let mut item = clarify_todo_item("tsk-a");
                item.stage = "executing".into();
                item
            },
            clarify_todo_item("tsk-b"),
            clarify_todo_item("tsk-c"),
        ];
        let candidate = next_auto_discover_candidate(&items).expect("one clarify+todo item exists");
        assert_eq!(candidate.id, "tsk-b", "first matching item wins, never a later one");
    }

    #[test]
    fn auto_discover_skips_items_not_at_clarify_or_not_todo() {
        let items = vec![
            {
                let mut item = clarify_todo_item("tsk-a");
                item.status = "doing".into();
                item
            },
            {
                let mut item = clarify_todo_item("tsk-b");
                item.stage = "decompose".into();
                item
            },
        ];
        assert!(next_auto_discover_candidate(&items).is_none());
    }

    #[test]
    fn auto_discover_skips_when_toggle_is_off() {
        let mut ui = QuitAfterOneTick { calls: Cell::new(0) };
        let mut app = App::empty();
        // `App::empty()`'s `orchestrator_settings` defaults to all-OFF
        // (tsk-2m5) — never explicitly flipped on in this test.
        app.work_items = vec![clarify_todo_item("tsk-b")];
        let registry = CountingRegistry { calls: Cell::new(0) };
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, Some(&registry), &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert!(
            pane_orchestrator.auto_discovered.borrow().is_empty(),
            "toggle off must never launch, even with a ready item"
        );
    }

    #[test]
    fn auto_discover_launches_when_toggle_is_on_and_an_item_is_ready() {
        let mut ui = QuitAfterOneTick { calls: Cell::new(0) };
        let mut app = App::empty();
        app.orchestrator_settings.auto_discover = true;
        app.work_items = vec![clarify_todo_item("tsk-b")];
        let registry = CountingRegistry { calls: Cell::new(0) };
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, Some(&registry), &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert_eq!(*pane_orchestrator.auto_discovered.borrow(), vec!["tsk-b".to_string()]);
        assert!(
            app.pick_status.is_none(),
            "an unattended launch must never surface as app.pick_status"
        );
    }

    /// A registry whose raw pane list already carries a
    /// `fgos-auto-discover-<id>`-labeled pane — simulates a still-running
    /// auto-launch from an earlier tick (or a previous herdr-plugin run).
    struct RegistryWithAutoDiscoverPaneOpen {
        label: String,
    }

    impl PaneRegistry for RegistryWithAutoDiscoverPaneOpen {
        fn scan(&self) -> Result<HashMap<String, PaneIdentity>, PaneScanError> {
            Ok(HashMap::new())
        }

        fn scan_raw(&self) -> Result<String, PaneScanError> {
            Ok(format!(
                r#"{{"result":{{"panes":[{{"pane_id":"wS:pZ","tab_id":"wS:t9","label":"{}"}}]}}}}"#,
                self.label
            ))
        }
    }

    #[test]
    fn auto_discover_skips_when_a_pane_is_already_open_for_the_id() {
        let mut ui = QuitAfterOneTick { calls: Cell::new(0) };
        let mut app = App::empty();
        app.orchestrator_settings.auto_discover = true;
        app.work_items = vec![clarify_todo_item("tsk-b")];
        let registry = RegistryWithAutoDiscoverPaneOpen {
            label: "fgos-auto-discover-tsk-b".to_string(),
        };
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, Some(&registry), &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert!(
            pane_orchestrator.auto_discovered.borrow().is_empty(),
            "an id with an already-open guarded pane must not be launched again"
        );
    }

    struct AlwaysFailingPaneOrchestrator;

    impl PaneOrchestrator for AlwaysFailingPaneOrchestrator {
        fn open_pick_pane(&self, _id: &str) -> io::Result<()> {
            Ok(())
        }

        fn open_discover_pane(&self, _id: &str) -> io::Result<()> {
            Ok(())
        }

        fn focus_pane(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn open_auto_discover_pane(&self, _id: &str) -> io::Result<()> {
            Err(io::Error::other("simulated: fg:agents-N tabs are full"))
        }
    }

    /// Covers the wiring's own contract for ANY launch failure (cap
    /// refusal, rename failure, spawn failure) — the cap refusal itself
    /// is already proven at `layout.rs`'s own level
    /// (`agent_tabs_at_cap_refuse_a_third_tab`); this proves the poll
    /// tick swallows whatever `Err` it gets back, never panics, and never
    /// leaks it into `app.pick_status`.
    #[test]
    fn auto_discover_skips_without_panic_when_agent_tabs_are_at_cap() {
        let mut ui = QuitAfterOneTick { calls: Cell::new(0) };
        let mut app = App::empty();
        app.orchestrator_settings.auto_discover = true;
        app.work_items = vec![clarify_todo_item("tsk-b")];
        let registry = CountingRegistry { calls: Cell::new(0) };
        let pane_orchestrator = AlwaysFailingPaneOrchestrator;

        let result = run(&mut ui, &mut app, None, Some(&registry), &pane_orchestrator, Duration::ZERO, None);

        assert!(result.is_ok(), "a launch failure must never crash the dashboard");
        assert!(app.pick_status.is_none());
    }
}
