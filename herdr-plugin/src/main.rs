use std::io;
use std::path::Path;
use std::process::Command;
use std::time::{Duration, Instant};

use serde::Deserialize;

use herdr_fgos::app::{App, Panel, WorkItem};
use herdr_fgos::fgos::{self, FgosCliSource};
use herdr_fgos::layout;
use herdr_fgos::pane_scan::HerdrPaneScanner;
use herdr_fgos::pick::{self, HerdrPaneAdapter};
use herdr_fgos::ports::{
    PaneOrchestrator, PaneRegistry, TerminalUi, UiEvent, WorkItemSource, WorkerLaneView,
};
use herdr_fgos::settings;
use herdr_fgos::ui::RatatuiTerminalUi;

/// Same poll cadence as the existing STR40 bash cockpit's dashboard pane —
/// also the one tick pane-state refresh piggybacks on (tsk-4zo D1's
/// deferred cadence question, resolved here: no separate timer).
const POLL_INTERVAL: Duration = Duration::from_secs(5);

fn main() -> io::Result<()> {
    // tsk-7l9-2 D1: gateway mode is a separate launch path from the TUI's
    // default -- `herdr-fgos gateway` never touches the terminal at all
    // (no `RatatuiTerminalUi::init()` below), it just runs the REST server
    // to completion. D8: same binary/process either way, chosen at launch
    // rather than a `--role gateway`/`--role orchestrator` split across
    // machines.
    if std::env::args().nth(1).as_deref() == Some("gateway") {
        let root = fgos::repo_root()?;
        return herdr_fgos::gateway::run(root);
    }

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
    let mut operation_panes: Option<layout::OperationPanes> = None;
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
    app.operation_panes = operation_panes;
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
/// `/fgOS:discover` launch this tick — the same `WorkItem::discover_eligible`
/// gate the manual Discover button now enforces (`UiEvent::Discover`
/// below), plus `status == "todo"` (never `doing`/`blocked`/
/// `awaiting-human`, all of which mean a person or another session
/// already owns it). One candidate only, never a batch — the caller
/// launches at most one pane per tick.
///
/// `discover_eligible`'s `blocked_by.is_empty()` check (added after this
/// function was first written) is what actually fixes the bug this
/// function used to have: picking an item whose stage/status looked
/// right but that still had an unmet dependency, sending the launched
/// session straight into a `fgos take` refusal instead of real work.
fn next_auto_discover_candidate(work_items: &[WorkItem]) -> Option<&WorkItem> {
    work_items
        .iter()
        .find(|item| item.status == "todo" && item.discover_eligible())
}

/// Is an unattended discovery worker already running? (tsk-1zq, D2/D5.)
///
/// This replaces the `fgos-auto-discover` pane label that used to serve as
/// the launch mutex. That label was orchestrator state parked on a piece
/// of chrome, and it failed in both directions: a session was free to
/// rename its own pane mid-flight, silently releasing the lock and letting
/// a second launcher in, while a session that died before renaming left it
/// held forever, so auto-discover never fired again. D2 puts "what is
/// running" in the engine's hands, and the answer is already sitting in
/// the work list the poll tick fetches: an unattended discover session's
/// whole job is to claim an item out of the discovery pool, so a live one
/// shows up as an item at `doing` whose stage is one that
/// `/fgOS:discover` drives.
///
/// The stage set is shared with `discover_eligible` via
/// `WorkItem::in_discover_stage`, which mirrors `CANDIDATE_STAGES` in
/// `src/state/discover-pool.mjs`. `blocked_by` is deliberately not
/// consulted here: a claimed item is already running regardless of what
/// it once waited on.
fn discovery_worker_alive(work_items: &[WorkItem]) -> bool {
    work_items
        .iter()
        .any(|item| item.status == "doing" && item.in_discover_stage())
}

/// The read-only worker-slot ledger, as the engine reports it.
#[derive(Debug, Clone, Default)]
struct WorkerSlots {
    has_room: bool,
}

#[derive(Debug, Deserialize)]
struct SlotsExecution {
    #[serde(rename = "hasRoom")]
    has_room: bool,
}

#[derive(Debug, Deserialize)]
struct SlotsData {
    execution: SlotsExecution,
}

#[derive(Debug, Deserialize)]
struct SlotsEnvelope {
    data: SlotsData,
}

/// Ask the engine whether the execution lane has room before standing a
/// worker up (D6) — `fgos slots`, the read-only face T1 exposed precisely
/// because decision 0014 makes the CLI the only door a Rust adapter can
/// reach the engine through. Same `node bin/fgos.mjs ... --json --dir`
/// shape `fgos.rs`'s own fetch functions use, mirrored here rather than
/// reused because `fgos.rs` is outside this item's footprint.
///
/// `None` means the question could not be asked at all, which the caller
/// treats as "no ceiling known" rather than "no room" — see
/// `worker_slot_room`.
fn fetch_worker_slots(root: &Path) -> Option<WorkerSlots> {
    let fgos_mjs = root.join("bin/fgos.mjs");
    let output = Command::new("node")
        .args([
            fgos_mjs.to_string_lossy().as_ref(),
            "slots",
            "--json",
            "--dir",
            root.to_string_lossy().as_ref(),
        ])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let envelope: SlotsEnvelope = serde_json::from_slice(&output.stdout).ok()?;
    Some(WorkerSlots {
        has_room: envelope.data.execution.has_room,
    })
}

/// Fail OPEN, not closed: an unreachable or unparseable `fgos slots` means
/// no ceiling is known, so nothing is refused.
///
/// This is deliberate and load-bearing. The verb ships with this feature,
/// so it does not exist on the trunk this cockpit runs from until the
/// whole feature merges — failing closed would freeze every launch button
/// in the meantime. It also matches what the engine itself does with a
/// ceiling that was never configured (`worker-slots.mjs`:
/// `reason: 'no-ceiling-configured'` returns `allowed: true`), which in
/// turn follows `shared-config-file.mjs`'s rule that an absent config
/// section leaves behavior identical to before it existed.
fn worker_slot_room(slots: Option<&WorkerSlots>) -> bool {
    slots.map(|slots| slots.has_room).unwrap_or(true)
}

/// The one path every worker launch takes (D6): ask the engine for a slot
/// first, hand the adapter what only the domain knows about the lane, and
/// remember the pane that came back until its session labels itself.
///
/// Every launcher goes through here — the two dashboard buttons and the
/// unattended tick alike — so no caller can quietly skip the slot check
/// the way each of the three launchers used to keep its own private
/// ceiling (RESEARCH F2).
fn launch_worker<F>(app: &mut App, root: Option<&Path>, launch: F) -> Result<String, String>
where
    F: FnOnce(&WorkerLaneView) -> io::Result<String>,
{
    let slots = root.and_then(fetch_worker_slots);
    if !worker_slot_room(slots.as_ref()) {
        return Err("engine reports no free worker slot".to_string());
    }

    let doing_ids = app.doing_item_ids();
    let pending = app.pending_pane_ids();
    let lane = WorkerLaneView {
        doing_ids: &doing_ids,
        pending_panes: &pending,
    };

    match launch(&lane) {
        Ok(pane_id) => {
            app.pending_worker_panes.insert(pane_id.clone());
            Ok(pane_id)
        }
        Err(err) => Err(err.to_string()),
    }
}

fn run(
    ui: &mut impl TerminalUi,
    app: &mut App,
    source: Option<&dyn WorkItemSource>,
    registry: Option<&dyn PaneRegistry>,
    pane_orchestrator: &impl PaneOrchestrator,
    poll_interval: Duration,
    // The main fgOS checkout root (tsk-45u D1's already-resolved root,
    // threaded in rather than re-resolved every tick). `None` outside a
    // real herdr-managed pane (dev/test) — same degrade-gracefully shape
    // `source`/`registry` above already use. Needed for the auto-discover
    // toggle read (tsk-2ja) and the auto-merge/retro/cleanup launcher's
    // own settings read and retro-vs-cleanup priority check (tsk-57q).
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
                        let selected = app.selected_id().map(String::from);
                        app.pick_status = Some(match selected {
                            Some(id) => launch_worker(app, root, |lane| {
                                pane_orchestrator.open_pick_pane(&id, lane)
                            })
                            .map(|_| format!("opened pane for /fgOS:pick {id}"))
                            .unwrap_or_else(|err| format!("pick failed for {id}: {err}")),
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
                // `discovery` — otherwise inert (the disabled/dimmed button
                // gives no keyboard action to fire, D4's own "disable,
                // never hide" shape carried through to the event loop).
                UiEvent::Discover => {
                    if app.detail_modal_open {
                        let is_discovery = app
                            .selected_work_item()
                            .is_some_and(|item| item.discover_eligible());
                        if is_discovery {
                            let selected = app.selected_id().map(String::from);
                            app.pick_status = Some(match selected {
                                Some(id) => launch_worker(app, root, |lane| {
                                    pane_orchestrator.open_discover_pane(&id, lane)
                                })
                                .map(|_| format!("opened pane for /fgOS:discover {id}"))
                                .unwrap_or_else(|err| format!("discover failed for {id}: {err}")),
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
            // tick. `next_auto_discover_candidate` is the fgOS-engine-
            // backed readiness check (`fgos triage --json`'s dependency
            // data via `WorkItem::discover_eligible`) that must find a
            // real candidate before a pane is ever opened — the launched
            // pane itself never picks blind; it hands off to
            // `/fgOS:discover-next`, which re-picks off the same live
            // pool via `pickNextDiscoverItem`, so this check only decides
            // WHETHER to launch, never WHICH id (that stays centralized).
            //
            // tsk-1zq: the "one at a time" guard is `discovery_worker_alive`
            // now — the engine's own answer — where it used to be an
            // exact-match probe for a pane label this adapter had planted
            // itself. Any failure (no free slot, spawn failure) is
            // swallowed here — never surfaced as `app.pick_status`
            // (person-initiated actions only), never retried within the
            // same tick, never queued; a fresh read next tick is the only
            // retry.
            //
            // tsk-3q8z: `discovery_worker_alive` only becomes true once the
            // launched session actually claims its item (`fgos take`/
            // `fgos discover`), which leaves the whole boot+claim window
            // (roughly 10-60s) where both conjuncts above stay true —
            // without `pending_discover_pane.is_none()` this would re-fire
            // every tick and stack launches into the same pane.
            if app.orchestrator_settings.auto_discover
                && !discovery_worker_alive(&app.work_items)
                && app.pending_discover_pane.is_none()
                && next_auto_discover_candidate(&app.work_items).is_some()
            {
                if let Ok(pane_id) = launch_worker(app, root, |lane| {
                    pane_orchestrator.open_auto_discover_pane(lane)
                }) {
                    app.pending_discover_pane = Some(pane_id);
                }
            }
            // tsk-57q: same tick, so the guard check and the launch it
            // gates never straddle two ticks (poll-tick race risk row,
            // plan.md). `None` `root` (outside a real herdr-managed pane,
            // e.g. local dev/test) skips this entirely — same
            // degrade-gracefully shape the two refreshes above already
            // use. tsk-4ry: no longer needs `registry` — the guard reads
            // `app`'s own pending-pane bookkeeping instead of a pane scan.
            if let Some(root) = root {
                auto_launch_operation_panes(app, root, pane_orchestrator);
            }
            last_poll = Instant::now();
        }
    }
}

/// Fail-closed read of `.fgos/config.json`'s `herdrOrchestrator` section
/// (tsk-57q) — read directly here rather than through a shared settings
/// module (`tsk-2m5`'s own settings-source item, not yet landed on this
/// branch at the time this was written): a missing file, missing
/// section, any missing/malformed field, or a parse failure all resolve
/// to every toggle OFF, the same fail-closed convention `gate-bypass.mjs`
/// already uses for this exact shape of on/off config
/// (`src/config/shared-config-file.mjs`). Activates for real the moment
/// `tsk-2m5` lands its actual write-side — no further change needed here.
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
struct HerdrOrchestratorToggles {
    auto_merge: bool,
    auto_retro: bool,
    auto_cleanup: bool,
}

fn read_herdr_orchestrator_toggles(root: &Path) -> HerdrOrchestratorToggles {
    let Ok(raw) = std::fs::read_to_string(root.join(".fgos/config.json")) else {
        return HerdrOrchestratorToggles::default();
    };
    let Ok(value) = serde_json::from_str::<serde_json::Value>(&raw) else {
        return HerdrOrchestratorToggles::default();
    };
    // `serde_json::Value`'s `Index` impl returns a static `Null` for a
    // missing key rather than panicking, so an absent `herdrOrchestrator`
    // section (or an absent field inside it) falls straight through to
    // `as_bool()`'s own `None` -> `unwrap_or(false)` below — no separate
    // "section missing" branch needed.
    let section = &value["herdrOrchestrator"];
    HerdrOrchestratorToggles {
        auto_merge: section["autoMerge"].as_bool().unwrap_or(false),
        auto_retro: section["autoRetro"].as_bool().unwrap_or(false),
        auto_cleanup: section["autoCleanup"].as_bool().unwrap_or(false),
    }
}

/// The auto-merge/retro/cleanup launcher itself (tsk-57q): for each
/// enabled toggle, guard-checks whether that lane is already in flight,
/// then launches — never queues, never double-launches. A `None` fixed
/// pane id (outside a live herdr session, or `ensure_operation_tab`
/// failed at startup) is a no-op for that slot.
/// Which of the three lanes (if any) to actually launch this tick —
/// isolated as a pure decision so it stays unit-testable against fixed
/// inputs, the same separation `layout.rs`'s `find_operation_tab`/
/// `left_right_panes` already use for the same reason.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
struct AutoOperationTabLaunches {
    merge: bool,
    retro: bool,
    cleanup: bool,
}

/// Merge candidates the same way `/fgOS:merge-list`'s own ranking sources
/// them (`src/state/graph-harness.mjs:112`): plain `awaiting-approval`
/// status. Mirrors `next_auto_discover_candidate`'s shape above, but only
/// existence is needed here, not a specific item — `/fgOS:merge-next`
/// does its own picking once launched, the same centralization
/// `next_auto_discover_candidate`'s own doc comment already describes for
/// `/fgOS:discover-next`.
fn merge_pool_has_candidate(work_items: &[WorkItem]) -> bool {
    work_items.iter().any(|item| item.status == "awaiting-approval")
}

/// Retro candidates: plain `retrospective` status
/// (`src/state/retro-pool.mjs:12`). Same shape as `merge_pool_has_candidate`.
fn retro_pool_has_candidate(work_items: &[WorkItem]) -> bool {
    work_items.iter().any(|item| item.status == "retrospective")
}

/// Cleanup candidates: plain `cleanup` status. `src/state/cleanup-pool.mjs`'s
/// own TTL sub-filter is deliberately NOT replicated here — that module's
/// own header documents it as "a SCHEDULING OPTIMIZATION, not [a
/// correctness requirement]... a TTL-not-elapsed item is harmless either
/// way", and the TTL check itself reads the raw event log, not anything
/// `WorkItem` carries (tsk-4ry, confirmed at `fgos-coding-validating`). Worst
/// case this launches an `/fgOS:cleanup-next` that finds nothing
/// TTL-ready and exits immediately — wasted, never wrong.
fn cleanup_pool_has_candidate(work_items: &[WorkItem]) -> bool {
    work_items.iter().any(|item| item.status == "cleanup")
}

/// Pure decision `auto_launch_operation_panes` below dispatches on
/// (tsk-57q): given already-resolved toggles, whether each lane is
/// already in flight, and whether each lane's own pool still has a ready
/// candidate, decides which lanes to launch. Never queues, never
/// double-launches — a lane already in flight, or with an empty pool, is
/// `false` here, not retried.
///
/// tsk-1zq: each of the three loops has its own slot in the 4-pane
/// `fg:operation` tab now, so retro and cleanup no longer compete for one
/// pane and neither is gated on winning a priority comparison.
///
/// tsk-4ry: `*_already_running` used to come from `registry.has_labeled_pane`
/// — a label no writer ever set, so this was always `false` and the guard
/// relaunched every tick. It now comes from `App`'s own
/// `pending_merge_pane`/`pending_retro_pane`/`pending_cleanup_pane`
/// (pane-scan liveness, D2-consistent: never a label read). The
/// `*_pool_ready` half is new — the old guard had no equivalent, since a
/// `-loop` launch was safe to fire even into an empty pool (it would just
/// exit immediately); a `-next` launch is now gated on the pool
/// explicitly so a genuinely empty pool does not still trigger a pane
/// launch every tick.
#[allow(clippy::too_many_arguments)]
fn decide_auto_operation_tab_launches(
    toggles: HerdrOrchestratorToggles,
    merge_in_flight: bool,
    retro_in_flight: bool,
    cleanup_in_flight: bool,
    merge_pool_ready: bool,
    retro_pool_ready: bool,
    cleanup_pool_ready: bool,
) -> AutoOperationTabLaunches {
    AutoOperationTabLaunches {
        merge: toggles.auto_merge && !merge_in_flight && merge_pool_ready,
        retro: toggles.auto_retro && !retro_in_flight && retro_pool_ready,
        cleanup: toggles.auto_cleanup && !cleanup_in_flight && cleanup_pool_ready,
    }
}

/// The auto-merge/retro/cleanup launcher itself (tsk-57q): gathers the
/// real settings and guard state (impure I/O — file read) and hands it to
/// the pure `decide_auto_operation_tab_launches` above, then acts on the
/// result — recording each fired launch's pane id into `app`'s own
/// `pending_merge_pane`/`pending_retro_pane`/`pending_cleanup_pane`
/// (tsk-4ry), the same "record right after firing" shape the
/// auto-discover launch above already uses for `pending_discover_pane`.
/// Guard-check and launch happen synchronously within this one call —
/// this function only ever runs once per poll tick (`run`'s own tick
/// block above), so a launch decision is never stale by the time it acts
/// on it (poll-tick race risk row, plan.md). A `None` slot set (outside a
/// live herdr session, or `ensure_operation_tab` failed at startup) is a
/// no-op.
///
/// tsk-1zq: with `fg:operation` grown to four slots, retro and cleanup
/// each own a pane, so the priority comparison that used to decide which
/// of them got the single right-hand pane is gone — along with the `fgos
/// list --all --json` subprocess it ran every tick to make that call.
/// These panes are never touched by the worker lane's reclaim path: admin
/// launches live here, one-shot worker-lane flows live there (A7).
fn auto_launch_operation_panes(app: &mut App, root: &Path, pane_orchestrator: &impl PaneOrchestrator) {
    let Some(panes) = app.operation_panes.clone() else {
        return;
    };
    let toggles = read_herdr_orchestrator_toggles(root);

    let launches = decide_auto_operation_tab_launches(
        toggles,
        app.pending_merge_pane.is_some(),
        app.pending_retro_pane.is_some(),
        app.pending_cleanup_pane.is_some(),
        merge_pool_has_candidate(&app.work_items),
        retro_pool_has_candidate(&app.work_items),
        cleanup_pool_has_candidate(&app.work_items),
    );

    if launches.merge && pane_orchestrator.launch_merge_loop(&panes.merge).is_ok() {
        app.pending_merge_pane = Some(panes.merge.clone());
    }
    if launches.retro && pane_orchestrator.launch_retro_loop(&panes.retro).is_ok() {
        app.pending_retro_pane = Some(panes.retro.clone());
    }
    if launches.cleanup && pane_orchestrator.launch_cleanup_loop(&panes.cleanup).is_ok() {
        app.pending_cleanup_pane = Some(panes.cleanup.clone());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::Cell;

    use herdr_fgos::fgos::{DoingRow, FgosError, TriageRow};
    use herdr_fgos::pane_scan::{PaneIdentity, PaneScanError, PaneSnapshot};

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
        fn scan_panes(&self) -> Result<Vec<PaneSnapshot>, PaneScanError> {
            self.calls.set(self.calls.get() + 1);
            Ok(Vec::new())
        }

        fn has_labeled_pane(&self, _label: &str) -> Result<bool, PaneScanError> {
            Ok(false)
        }
    }

    struct NoopPaneOrchestrator;

    impl PaneOrchestrator for NoopPaneOrchestrator {
        fn open_pick_pane(&self, _id: &str, _lane: &WorkerLaneView) -> io::Result<String> {
            Ok("wS:pStub".into())
        }

        fn open_discover_pane(&self, _id: &str, _lane: &WorkerLaneView) -> io::Result<String> {
            Ok("wS:pStub".into())
        }

        fn focus_pane(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn launch_merge_loop(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn launch_retro_loop(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn launch_cleanup_loop(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn open_auto_discover_pane(&self, _lane: &WorkerLaneView) -> io::Result<String> {
            Ok("wS:pStub".into())
        }
    }

    /// Records every pane id it was asked to focus, so a test can assert
    /// on it without a real herdr binary.
    struct RecordingPaneOrchestrator {
        focused: std::cell::RefCell<Vec<String>>,
    }

    impl PaneOrchestrator for RecordingPaneOrchestrator {
        fn open_pick_pane(&self, _id: &str, _lane: &WorkerLaneView) -> io::Result<String> {
            Ok("wS:pStub".into())
        }

        fn open_discover_pane(&self, _id: &str, _lane: &WorkerLaneView) -> io::Result<String> {
            Ok("wS:pStub".into())
        }

        fn focus_pane(&self, pane_id: &str) -> io::Result<()> {
            self.focused.borrow_mut().push(pane_id.to_string());
            Ok(())
        }

        fn launch_merge_loop(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn launch_retro_loop(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn launch_cleanup_loop(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn open_auto_discover_pane(&self, _lane: &WorkerLaneView) -> io::Result<String> {
            Ok("wS:pStub".into())
        }
    }

    /// Records every work-item id it was asked to open a pick or discover
    /// pane for, so a test can assert each fires exactly once (tsk-1e3).
    /// `auto_discovered` is a call counter, not an id list (tsk-2ja no
    /// longer resolves an id before opening the pane — see
    /// `open_auto_discover_pane`'s own doc comment in `pick.rs`/`ports.rs`).
    /// Also records every fixed-pane loop it was asked to launch (tsk-57q).
    struct RecordingPickOrchestrator {
        picked: std::cell::RefCell<Vec<String>>,
        discovered: std::cell::RefCell<Vec<String>>,
        auto_discovered: std::cell::RefCell<u32>,
        merge_launched: std::cell::RefCell<Vec<String>>,
        retro_launched: std::cell::RefCell<Vec<String>>,
        cleanup_launched: std::cell::RefCell<Vec<String>>,
    }

    impl PaneOrchestrator for RecordingPickOrchestrator {
        fn open_pick_pane(&self, id: &str, _lane: &WorkerLaneView) -> io::Result<String> {
            self.picked.borrow_mut().push(id.to_string());
            Ok("wS:pStub".into())
        }

        fn open_discover_pane(&self, id: &str, _lane: &WorkerLaneView) -> io::Result<String> {
            self.discovered.borrow_mut().push(id.to_string());
            Ok("wS:pStub".into())
        }

        fn focus_pane(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn launch_merge_loop(&self, pane_id: &str) -> io::Result<()> {
            self.merge_launched.borrow_mut().push(pane_id.to_string());
            Ok(())
        }

        fn launch_retro_loop(&self, pane_id: &str) -> io::Result<()> {
            self.retro_launched.borrow_mut().push(pane_id.to_string());
            Ok(())
        }

        fn launch_cleanup_loop(&self, pane_id: &str) -> io::Result<()> {
            self.cleanup_launched.borrow_mut().push(pane_id.to_string());
            Ok(())
        }

        fn open_auto_discover_pane(&self, _lane: &WorkerLaneView) -> io::Result<String> {
            *self.auto_discovered.borrow_mut() += 1;
            Ok("wS:pStub".into())
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
    /// `discovery` — the modal stays open), then Esc/q twice to close and
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
            auto_discovered: std::cell::RefCell::new(0),
            merge_launched: std::cell::RefCell::new(Vec::new()),
            retro_launched: std::cell::RefCell::new(Vec::new()),
            cleanup_launched: std::cell::RefCell::new(Vec::new()),
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
            auto_discovered: std::cell::RefCell::new(0),
            merge_launched: std::cell::RefCell::new(Vec::new()),
            retro_launched: std::cell::RefCell::new(Vec::new()),
            cleanup_launched: std::cell::RefCell::new(Vec::new()),
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
            auto_discovered: std::cell::RefCell::new(0),
            merge_launched: std::cell::RefCell::new(Vec::new()),
            retro_launched: std::cell::RefCell::new(Vec::new()),
            cleanup_launched: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert_eq!(*pane_orchestrator.picked.borrow(), vec!["tsk-a".to_string()]);
        assert!(!app.detail_modal_open);
        assert_eq!(app.pick_status.as_deref(), Some("opened pane for /fgOS:pick tsk-a"));
    }

    /// tsk-1e3 D4: Discover only fires while the modal is open AND the
    /// selected item is `discover_eligible` — mirrors the Pick test above
    /// (`PickTwiceThenQuit`/`work_item_enter_opens_detail_modal_and_pick_
    /// only_fires_on_second_enter`), driving `d` instead of `Enter` twice.
    #[test]
    fn discover_button_fires_pane_open_when_item_is_at_discovery_stage() {
        let mut ui = DiscoverTwiceThenQuit { calls: Cell::new(0) };
        let mut app = App::empty();
        app.work_items = vec![herdr_fgos::app::WorkItem {
            id: "tsk-a".into(),
            title: "A".into(),
            goal_tier: "mvp".into(),
            stage: "discovery".into(),
            status: "todo".into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        }];
        app.select_next();
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(0),
            merge_launched: std::cell::RefCell::new(Vec::new()),
            retro_launched: std::cell::RefCell::new(Vec::new()),
            cleanup_launched: std::cell::RefCell::new(Vec::new()),
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

    /// tsk-1e3 D4: `d` is inert when the selected item isn't
    /// `discover_eligible` (wrong stage) — the modal stays open, nothing is
    /// opened, no status is set (the disabled button gives no keyboard
    /// action to fire).
    #[test]
    fn discover_button_is_inert_when_item_is_not_at_discovery_stage() {
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
            auto_discovered: std::cell::RefCell::new(0),
            merge_launched: std::cell::RefCell::new(Vec::new()),
            retro_launched: std::cell::RefCell::new(Vec::new()),
            cleanup_launched: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, None, &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert!(pane_orchestrator.discovered.borrow().is_empty());
        assert!(app.pick_status.is_none());
    }

    /// Companion to the test above, for the other half of
    /// `discover_eligible`: right stage, but `blocked_by` non-empty. This
    /// is the exact scenario that used to send herdr's Discover button
    /// straight into a `fgos take` refusal — the item looked ready by
    /// stage alone, but a dependency wasn't actually resolved yet.
    #[test]
    fn discover_button_is_inert_when_item_is_blocked_even_at_eligible_stage() {
        let mut ui = DiscoverThenQuit { calls: Cell::new(0) };
        let mut app = App::empty();
        app.work_items = vec![herdr_fgos::app::WorkItem {
            id: "tsk-a".into(),
            title: "A".into(),
            goal_tier: "mvp".into(),
            stage: "clarify".into(),
            status: "todo".into(),
            blocked_by: vec!["tsk-dep".into()],
            blocks: 0,
            priority: None,
        }];
        app.select_next();
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(0),
            merge_launched: std::cell::RefCell::new(Vec::new()),
            retro_launched: std::cell::RefCell::new(Vec::new()),
            cleanup_launched: std::cell::RefCell::new(Vec::new()),
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

    // --- tsk-57q: auto-merge/retro/cleanup launcher --------------------
    // Named with the literal substring `auto_operation_tab` throughout —
    // the item's own recorded verify (`cargo test auto_operation_tab`)
    // filters by substring match on the full test path (plan.md).

    /// The four fixed `fg:operation` slots, as `ensure_operation_tab`
    /// resolves them once the tab holds a full 2x2 grid.
    fn operation_panes_fixture() -> layout::OperationPanes {
        layout::OperationPanes {
            merge: "wS:pOpMerge".into(),
            retro: "wS:pOpRetro".into(),
            cleanup: "wS:pOpCleanup".into(),
            spare: "wS:pOpSpare".into(),
        }
    }

    fn all_off() -> HerdrOrchestratorToggles {
        HerdrOrchestratorToggles::default()
    }

    fn all_on() -> HerdrOrchestratorToggles {
        HerdrOrchestratorToggles {
            auto_merge: true,
            auto_retro: true,
            auto_cleanup: true,
        }
    }

    fn discovery_todo_item(id: &str) -> WorkItem {
        WorkItem {
            id: id.into(),
            title: id.into(),
            goal_tier: "mvp".into(),
            stage: "discovery".into(),
            status: "todo".into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        }
    }

    fn work_item_with_status(id: &str, status: &str) -> WorkItem {
        WorkItem {
            id: id.into(),
            title: id.into(),
            goal_tier: "mvp".into(),
            stage: "executing".into(),
            status: status.into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        }
    }

    // All pool-ready flags default `true` in the decision tests below —
    // they exercise the toggle/in-flight half of the decision, which the
    // pool-nonempty half (tested separately below) never interferes with
    // as long as it stays true.
    const POOLS_READY: (bool, bool, bool) = (true, true, true);

    #[test]
    fn auto_operation_tab_decision_stays_off_for_every_loop_when_every_toggle_is_off() {
        let (m, r, c) = POOLS_READY;
        let launches = decide_auto_operation_tab_launches(all_off(), false, false, false, m, r, c);
        assert_eq!(launches, AutoOperationTabLaunches::default());
    }

    #[test]
    fn auto_operation_tab_decision_launches_merge_when_toggle_on_and_not_in_flight() {
        let (m, r, c) = POOLS_READY;
        let launches = decide_auto_operation_tab_launches(all_on(), false, true, true, m, r, c);
        assert!(launches.merge);
    }

    #[test]
    fn auto_operation_tab_decision_skips_merge_when_already_in_flight() {
        // Also stands in for "two poll ticks close together never
        // produce two panes for the same lane" (plan.md): the second
        // tick reads `merge_in_flight: true` (the first tick's own
        // launch having recorded a `pending_merge_pane` by then) and
        // must decide the same way as any other in-flight lane.
        let (m, r, c) = POOLS_READY;
        let launches = decide_auto_operation_tab_launches(all_on(), true, true, true, m, r, c);
        assert!(!launches.merge);
    }

    #[test]
    fn auto_operation_tab_decision_skips_merge_when_the_pool_is_empty() {
        // tsk-4ry: the new half of the decision — a lane can be off the
        // toggle-and-in-flight guard entirely and still not launch if its
        // own pool has nothing ready.
        let launches = decide_auto_operation_tab_launches(all_on(), false, false, false, false, true, true);
        assert!(!launches.merge);
        assert!(launches.retro);
        assert!(launches.cleanup);
    }

    #[test]
    fn auto_operation_tab_launches_retro_and_cleanup_together_now_they_own_separate_panes() {
        // tsk-1zq: retro and cleanup used to share the single right-hand
        // pane, so each was gated on winning a priority comparison against
        // the other and at most one could run. With four slots in the
        // `fg:operation` tab they each own a pane, so both start.
        let (m, r, c) = POOLS_READY;
        let launches = decide_auto_operation_tab_launches(all_on(), true, false, false, m, r, c);
        assert!(launches.retro);
        assert!(launches.cleanup);
    }

    #[test]
    fn auto_operation_tab_decision_skips_a_loop_whose_own_toggle_is_off() {
        let toggles = HerdrOrchestratorToggles {
            auto_merge: false,
            auto_retro: false,
            auto_cleanup: true,
        };
        let (m, r, c) = POOLS_READY;
        let launches = decide_auto_operation_tab_launches(toggles, true, false, false, m, r, c);
        assert!(!launches.merge);
        assert!(!launches.retro);
        assert!(launches.cleanup);
    }

    #[test]
    fn merge_pool_has_candidate_reads_awaiting_approval_status() {
        assert!(!merge_pool_has_candidate(&[work_item_with_status("tsk-a", "todo")]));
        assert!(merge_pool_has_candidate(&[work_item_with_status(
            "tsk-a",
            "awaiting-approval"
        )]));
    }

    #[test]
    fn retro_pool_has_candidate_reads_retrospective_status() {
        assert!(!retro_pool_has_candidate(&[work_item_with_status("tsk-a", "delivered")]));
        assert!(retro_pool_has_candidate(&[work_item_with_status("tsk-a", "retrospective")]));
    }

    #[test]
    fn cleanup_pool_has_candidate_reads_cleanup_status_without_a_ttl_check() {
        assert!(!cleanup_pool_has_candidate(&[work_item_with_status(
            "tsk-a",
            "retrospective"
        )]));
        // No TTL data is available client-side (tsk-4ry) — any `cleanup`
        // item counts as a candidate, TTL-elapsed or not; `/fgOS:cleanup-next`
        // itself safely no-ops on one that is not ready yet.
        assert!(cleanup_pool_has_candidate(&[work_item_with_status("tsk-a", "cleanup")]));
    }

    // `tag` alone already disambiguates every call site below (each uses
    // its own literal, never reused); `process::id()` only additionally
    // guards against two full test-binary runs racing on the same tmp
    // dir (e.g. a retry) — not needed against parallel tests within one
    // run, since no two tests here share a tag.
    fn unique_temp_root(tag: &str) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "herdr-fgos-auto-operation-tab-test-{tag}-{}",
            std::process::id()
        ));
        std::fs::create_dir_all(dir.join(".fgos")).expect("create temp .fgos dir");
        dir
    }

    #[test]
    fn auto_operation_tab_toggles_default_off_when_config_file_is_missing() {
        let root = unique_temp_root("missing-config");
        // No `.fgos/config.json` written at all.
        assert_eq!(read_herdr_orchestrator_toggles(&root), all_off());
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn auto_operation_tab_toggles_default_off_when_config_json_is_malformed() {
        let root = unique_temp_root("malformed-config");
        std::fs::write(root.join(".fgos/config.json"), "{ not valid json")
            .expect("write malformed config");
        assert_eq!(read_herdr_orchestrator_toggles(&root), all_off());
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn auto_operation_tab_toggles_default_off_when_the_herdr_orchestrator_section_is_absent() {
        let root = unique_temp_root("no-section");
        std::fs::write(root.join(".fgos/config.json"), r#"{"gateBypass":{"level":0}}"#)
            .expect("write config without herdrOrchestrator");
        assert_eq!(read_herdr_orchestrator_toggles(&root), all_off());
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn auto_operation_tab_toggles_default_off_for_a_field_missing_inside_the_section() {
        let root = unique_temp_root("partial-section");
        std::fs::write(
            root.join(".fgos/config.json"),
            r#"{"herdrOrchestrator":{"autoMerge":true}}"#,
        )
        .expect("write partial section");
        let toggles = read_herdr_orchestrator_toggles(&root);
        assert!(toggles.auto_merge);
        assert!(!toggles.auto_retro);
        assert!(!toggles.auto_cleanup);
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn auto_operation_tab_toggles_read_real_values_when_the_section_is_present() {
        let root = unique_temp_root("full-section");
        std::fs::write(
            root.join(".fgos/config.json"),
            r#"{"herdrOrchestrator":{"autoMerge":true,"autoRetro":false,"autoCleanup":true}}"#,
        )
        .expect("write full section");
        assert_eq!(
            read_herdr_orchestrator_toggles(&root),
            HerdrOrchestratorToggles {
                auto_merge: true,
                auto_retro: false,
                auto_cleanup: true,
            }
        );
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn auto_operation_tab_launcher_fires_merge_next_into_the_left_pane_end_to_end() {
        // Real settings read (from a real file), real decision, real
        // launch call. tsk-4ry: no registry/label stub needed any more —
        // the guard reads `app`'s own `pending_*_pane` bookkeeping
        // (empty here, nothing in flight) and `app.work_items` for the
        // pool-nonempty half, both plain in-memory state.
        let root = unique_temp_root("end-to-end-merge");
        std::fs::write(
            root.join(".fgos/config.json"),
            r#"{"herdrOrchestrator":{"autoMerge":true,"autoRetro":false,"autoCleanup":false}}"#,
        )
        .expect("write config");

        let mut app = App::empty();
        app.operation_panes = Some(operation_panes_fixture());
        app.work_items = vec![work_item_with_status("tsk-ready", "awaiting-approval")];

        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(0),
            merge_launched: std::cell::RefCell::new(Vec::new()),
            retro_launched: std::cell::RefCell::new(Vec::new()),
            cleanup_launched: std::cell::RefCell::new(Vec::new()),
        };

        auto_launch_operation_panes(&mut app, &root, &pane_orchestrator);

        assert_eq!(*pane_orchestrator.merge_launched.borrow(), vec!["wS:pOpMerge".to_string()]);
        assert!(pane_orchestrator.retro_launched.borrow().is_empty());
        assert!(pane_orchestrator.cleanup_launched.borrow().is_empty());
        assert_eq!(app.pending_merge_pane, Some("wS:pOpMerge".to_string()));

        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn auto_operation_tab_launcher_never_double_launches_and_resumes_once_the_pane_retires() {
        // The concrete "two poll ticks close together" case (plan.md),
        // exercised through the real launcher function this time rather
        // than the pure decision fn alone: tick 2 reads `pending_merge_pane`
        // still `Some` (tick 1's own launch having recorded it, no scan
        // pass has retired it yet) and must not fire again. Tick 3
        // simulates that retirement directly (`retire_settled_pending_operation_panes`
        // is exercised on its own in `app.rs`'s tests; this test only
        // needs its observable effect: the field going back to `None`)
        // and proves the guard resumes once it does — the D2 half a
        // one-shot latch could never have provided.
        let root = unique_temp_root("no-double-launch");
        std::fs::write(
            root.join(".fgos/config.json"),
            r#"{"herdrOrchestrator":{"autoMerge":true,"autoRetro":false,"autoCleanup":false}}"#,
        )
        .expect("write config");

        let mut app = App::empty();
        app.operation_panes = Some(operation_panes_fixture());
        app.work_items = vec![work_item_with_status("tsk-ready", "awaiting-approval")];

        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(0),
            merge_launched: std::cell::RefCell::new(Vec::new()),
            retro_launched: std::cell::RefCell::new(Vec::new()),
            cleanup_launched: std::cell::RefCell::new(Vec::new()),
        };

        // Tick 1: nothing in flight yet.
        auto_launch_operation_panes(&mut app, &root, &pane_orchestrator);

        // Tick 2: `pending_merge_pane` is still `Some` from tick 1 — no
        // scan has retired it — so this must not launch a second time.
        auto_launch_operation_panes(&mut app, &root, &pane_orchestrator);

        assert_eq!(
            *pane_orchestrator.merge_launched.borrow(),
            vec!["wS:pOpMerge".to_string()],
            "tick 2 must not launch a second time while the pane is still pending"
        );

        // Tick 3: the pane has settled (simulating what a real scan pass
        // would do via `retire_settled_pending_operation_panes`) and the
        // pool still has a candidate — the guard must allow a fresh
        // launch.
        app.pending_merge_pane = None;
        auto_launch_operation_panes(&mut app, &root, &pane_orchestrator);

        assert_eq!(
            pane_orchestrator.merge_launched.borrow().len(),
            2,
            "tick 3 must relaunch once the pending pane has settled"
        );

        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn auto_discover_selects_the_first_discovery_todo_item() {
        let items = vec![
            {
                let mut item = discovery_todo_item("tsk-a");
                item.stage = "executing".into();
                item
            },
            discovery_todo_item("tsk-b"),
            discovery_todo_item("tsk-c"),
        ];
        let candidate = next_auto_discover_candidate(&items).expect("one discovery+todo item exists");
        assert_eq!(candidate.id, "tsk-b", "first matching item wins, never a later one");
    }

    #[test]
    fn auto_discover_skips_items_not_at_discovery_or_not_todo() {
        let items = vec![
            {
                let mut item = discovery_todo_item("tsk-a");
                item.status = "doing".into();
                item
            },
            {
                let mut item = discovery_todo_item("tsk-b");
                item.stage = "decompose".into();
                item
            },
        ];
        assert!(next_auto_discover_candidate(&items).is_none());
    }

    /// The bug this whole change fixes: an item at the right stage/status
    /// but with an unmet dependency must never be picked — herdr would
    /// open a discover pane for it, and the launched `/fgOS:discover`
    /// session's own `fgos take` call would just refuse it.
    #[test]
    fn auto_discover_skips_an_item_blocked_by_an_unmet_dependency() {
        let items = vec![
            {
                let mut item = discovery_todo_item("tsk-a");
                item.blocked_by = vec!["tsk-dep".into()];
                item
            },
            discovery_todo_item("tsk-b"),
        ];
        let candidate = next_auto_discover_candidate(&items).expect("tsk-b is ready");
        assert_eq!(candidate.id, "tsk-b", "the blocked item must be skipped, not picked first");
    }

    /// work-item-backlog-status D4: `backlog` is promoted to `todo` by a
    /// person's own judgment, so an unattended discover pane must never be
    /// opened for one. The `status == "todo"` check above already excludes
    /// it by construction — this pins that, since a backlog item otherwise
    /// looks maximally eligible: right stage, nothing blocking it.
    #[test]
    fn auto_discover_skips_a_backlog_item_even_at_an_eligible_stage() {
        let items = vec![
            {
                let mut item = discovery_todo_item("tsk-backlog");
                item.status = "backlog".into();
                item
            },
        ];
        assert!(
            items[0].discover_eligible(),
            "the item is otherwise fully eligible — stage matches and nothing blocks it"
        );
        assert!(
            next_auto_discover_candidate(&items).is_none(),
            "backlog -> todo is a human-only edge; never auto-discovered"
        );
    }

    #[test]
    fn auto_discover_skips_when_toggle_is_off() {
        let mut ui = QuitAfterOneTick { calls: Cell::new(0) };
        let mut app = App::empty();
        // `App::empty()`'s `orchestrator_settings` defaults to all-OFF
        // (tsk-2m5) — never explicitly flipped on in this test.
        app.work_items = vec![discovery_todo_item("tsk-b")];
        let registry = CountingRegistry { calls: Cell::new(0) };
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(0),
            merge_launched: std::cell::RefCell::new(Vec::new()),
            retro_launched: std::cell::RefCell::new(Vec::new()),
            cleanup_launched: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, Some(&registry), &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert_eq!(
            *pane_orchestrator.auto_discovered.borrow(),
            0,
            "toggle off must never launch, even with a ready item"
        );
    }

    #[test]
    fn auto_discover_launches_when_toggle_is_on_and_an_item_is_ready() {
        let mut ui = QuitAfterOneTick { calls: Cell::new(0) };
        let mut app = App::empty();
        app.orchestrator_settings.auto_discover = true;
        app.work_items = vec![discovery_todo_item("tsk-b")];
        let registry = CountingRegistry { calls: Cell::new(0) };
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(0),
            merge_launched: std::cell::RefCell::new(Vec::new()),
            retro_launched: std::cell::RefCell::new(Vec::new()),
            cleanup_launched: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, Some(&registry), &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert_eq!(
            *pane_orchestrator.auto_discovered.borrow(),
            1,
            "a ready item must launch exactly once this tick, whichever id /fgOS:discover-next \
             ends up picking inside the pane"
        );
        assert!(
            app.pick_status.is_none(),
            "an unattended launch must never surface as app.pick_status"
        );
    }

    /// A discovery-pool item the engine reports as CLAIMED — the shape a
    /// live unattended discover worker takes once it has picked something.
    fn discovery_doing_item(id: &str) -> WorkItem {
        WorkItem {
            id: id.into(),
            title: id.into(),
            goal_tier: "mvp".into(),
            stage: "discovery".into(),
            status: "doing".into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        }
    }

    #[test]
    fn auto_discover_skips_when_the_engine_reports_a_discovery_worker_running() {
        // tsk-1zq: the "one at a time" guard used to be an exact-match
        // probe for a pane label this adapter had planted itself, which a
        // session could silently release by renaming its own pane and a
        // dead session could hold forever. The registry here reports NO
        // labels at all, so the old guard would have launched — only the
        // engine's own answer stops it now.
        let mut ui = QuitAfterOneTick { calls: Cell::new(0) };
        let mut app = App::empty();
        app.orchestrator_settings.auto_discover = true;
        app.work_items = vec![
            discovery_doing_item("tsk-a"),
            discovery_todo_item("tsk-b"),
        ];
        let registry = CountingRegistry { calls: Cell::new(0) };
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(0),
            merge_launched: std::cell::RefCell::new(Vec::new()),
            retro_launched: std::cell::RefCell::new(Vec::new()),
            cleanup_launched: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, Some(&registry), &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert_eq!(
            *pane_orchestrator.auto_discovered.borrow(),
            0,
            "a discovery worker the engine reports at `doing` must stop a \
             second unattended launch, even with no pane label in sight"
        );
    }

    struct StillOpenPendingPaneRegistry {
        pane_id: &'static str,
    }

    impl PaneRegistry for StillOpenPendingPaneRegistry {
        fn scan_panes(&self) -> Result<Vec<PaneSnapshot>, PaneScanError> {
            // The launched pane is still open but unlabeled -- the shape a
            // real boot-window scan takes before the new session claims
            // and labels its own pane.
            Ok(vec![PaneSnapshot {
                pane_id: self.pane_id.to_string(),
                tab_id: "wS:t9".into(),
                label: None,
                focused: false,
            }])
        }

        fn has_labeled_pane(&self, _label: &str) -> Result<bool, PaneScanError> {
            Ok(false)
        }
    }

    /// tsk-3q8z defect 2: between an auto-discover launch and the launched
    /// session's own claim landing, `discovery_worker_alive` stays false
    /// (nothing is `doing` yet) and the candidate item stays `todo` — the
    /// exact boot window that used to re-fire a launch every tick.
    /// `pending_discover_pane` must stop the second launch even though
    /// neither of the other two conjuncts changed.
    #[test]
    fn auto_discover_skips_during_the_boot_window_when_a_discover_pane_is_already_pending() {
        let mut ui = QuitAfterOneTick { calls: Cell::new(0) };
        let mut app = App::empty();
        app.orchestrator_settings.auto_discover = true;
        app.work_items = vec![discovery_todo_item("tsk-b")];
        app.pending_worker_panes.insert("wS:pPendingDiscover".to_string());
        app.pending_discover_pane = Some("wS:pPendingDiscover".to_string());
        let registry = StillOpenPendingPaneRegistry { pane_id: "wS:pPendingDiscover" };
        let pane_orchestrator = RecordingPickOrchestrator {
            picked: std::cell::RefCell::new(Vec::new()),
            discovered: std::cell::RefCell::new(Vec::new()),
            auto_discovered: std::cell::RefCell::new(0),
            merge_launched: std::cell::RefCell::new(Vec::new()),
            retro_launched: std::cell::RefCell::new(Vec::new()),
            cleanup_launched: std::cell::RefCell::new(Vec::new()),
        };

        run(&mut ui, &mut app, None, Some(&registry), &pane_orchestrator, Duration::ZERO, None)
            .expect("run should exit cleanly on Quit");

        assert_eq!(
            *pane_orchestrator.auto_discovered.borrow(),
            0,
            "a pending, not-yet-claimed auto-discover pane must stop a second launch during \
             the boot window, even though discovery_worker_alive and the candidate check alone \
             would both still allow one"
        );
        assert_eq!(
            app.pending_discover_pane,
            Some("wS:pPendingDiscover".to_string()),
            "the pending pane is still open and unlabeled -- it must stay tracked, not clear early"
        );
    }

    #[test]
    fn discovery_worker_alive_reads_stage_and_status_together() {
        // Only a claimed discovery-pool item counts. A ready-but-unclaimed
        // one is the very thing that TRIGGERS a launch, and a claimed item
        // at some other stage belongs to a different flow entirely.
        assert!(discovery_worker_alive(&[discovery_doing_item("tsk-a")]));
        assert!(!discovery_worker_alive(&[discovery_todo_item("tsk-a")]));
        assert!(!discovery_worker_alive(&[]));

        let executing = WorkItem {
            status: "doing".into(),
            stage: "executing".into(),
            ..discovery_todo_item("tsk-c")
        };
        assert!(!discovery_worker_alive(&[executing]));
    }

    #[test]
    fn worker_slot_room_fails_open_when_the_engine_cannot_be_asked() {
        // `fgos slots` ships with this same feature, so it does not exist
        // on the trunk the cockpit runs from until everything merges.
        // Refusing on an unanswerable question would freeze every launch
        // button in the meantime; the engine itself takes the same stance
        // on an unconfigured ceiling.
        assert!(worker_slot_room(None));
        assert!(worker_slot_room(Some(&WorkerSlots { has_room: true })));
        assert!(!worker_slot_room(Some(&WorkerSlots { has_room: false })));
    }

    struct AlwaysFailingPaneOrchestrator;

    impl PaneOrchestrator for AlwaysFailingPaneOrchestrator {
        fn open_pick_pane(&self, _id: &str, _lane: &WorkerLaneView) -> io::Result<String> {
            Ok("wS:pStub".into())
        }

        fn open_discover_pane(&self, _id: &str, _lane: &WorkerLaneView) -> io::Result<String> {
            Ok("wS:pStub".into())
        }

        fn focus_pane(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn launch_merge_loop(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn launch_retro_loop(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn launch_cleanup_loop(&self, _pane_id: &str) -> io::Result<()> {
            Ok(())
        }

        fn open_auto_discover_pane(&self, _lane: &WorkerLaneView) -> io::Result<String> {
            Err(io::Error::other("simulated: no pane could be placed"))
        }
    }

    /// Covers the wiring's own contract for ANY launch failure (cap
    /// refusal, rename failure, spawn failure) — the cap refusal itself
    /// is already proven at `layout.rs`'s own level
    /// (`agent_tabs_at_cap_refuse_a_third_tab`); this proves the poll
    /// tick swallows whatever `Err` it gets back, never panics, and never
    /// leaks it into `app.pick_status`.
    #[test]
    fn auto_discover_skips_without_panic_when_no_pane_can_be_placed() {
        let mut ui = QuitAfterOneTick { calls: Cell::new(0) };
        let mut app = App::empty();
        app.orchestrator_settings.auto_discover = true;
        app.work_items = vec![discovery_todo_item("tsk-b")];
        let registry = CountingRegistry { calls: Cell::new(0) };
        let pane_orchestrator = AlwaysFailingPaneOrchestrator;

        let result = run(&mut ui, &mut app, None, Some(&registry), &pane_orchestrator, Duration::ZERO, None);

        assert!(result.is_ok(), "a launch failure must never crash the dashboard");
        assert!(app.pick_status.is_none());
    }
}
