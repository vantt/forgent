use std::io;
use std::time::Duration;

use crate::app::App;
use crate::fgos::{AfterDeliverRow, DoingRow, FgosError, MergeListSummary, NeedAnswerRow, TriageRow};
use crate::pane_scan::{PaneScanError, PaneSnapshot};

/// (a) fgOS data source seam (tsk-3t9 D1) — the domain asks for rows
/// through this trait instead of importing `crate::fgos` directly.
pub trait WorkItemSource {
    fn fetch_triage(&self) -> Result<Vec<TriageRow>, FgosError>;
    fn fetch_doing(&self) -> Result<Vec<DoingRow>, FgosError>;
    /// tsk-417 D3: NEED ANSWER box source.
    fn fetch_need_answer(&self) -> Result<Vec<NeedAnswerRow>, FgosError>;
    /// tsk-417 D3: AFTER DELIVER box source.
    fn fetch_after_deliver(&self) -> Result<Vec<AfterDeliverRow>, FgosError>;
    /// tsk-417 D3: MERGE LIST box source.
    fn fetch_merge_list(&self) -> Result<MergeListSummary, FgosError>;
}

/// Pane-tracking seam (tsk-4zo D1): scans the dashboard's own herdr
/// workspace. The domain never shells out to `herdr` itself — only
/// through this port.
pub trait PaneRegistry {
    /// Every pane in the workspace, raw. `herdr pane list` already returns
    /// `label`, `tab_id` and `focused` on the same row, so the task-id map
    /// the "In process" panel needs (`pane_scan::task_id_map`) and the
    /// reuse decision the worker lane needs (`layout::reusable_worker_pane`)
    /// are both pure folds over one call rather than two round trips.
    fn scan_panes(&self) -> Result<Vec<PaneSnapshot>, PaneScanError>;
    /// Guard check for a fixed/synthetic, non-id-shaped pane title — the
    /// admin lane's own `fgos-auto-merge`/`fgos-auto-retro`/
    /// `fgos-auto-cleanup` slot titles (tsk-57q), which the adapter sets
    /// once per fixed pane and which never change per item.
    ///
    /// Deliberately NOT used by the worker lane any more: the
    /// `fgos-auto-discover` guard this once served read a pane label to
    /// decide whether to launch, which is exactly what D2 forbids. That
    /// question is now put to the engine instead
    /// (`main::discovery_worker_alive`).
    fn has_labeled_pane(&self, label: &str) -> Result<bool, PaneScanError>;
}

/// What the domain knows about the worker lane when it asks the adapter
/// to stand a worker up. Passed in rather than fetched by the adapter:
/// D2 puts "what is running" in the engine's hands, and only the domain
/// side holds the engine's answer.
pub struct WorkerLaneView<'a> {
    /// Ids the engine currently reports at `status: doing`. A pane whose
    /// label names an id NOT in here is a finished pane, free to reuse.
    pub doing_ids: &'a [String],
    /// Panes this adapter has already launched a worker into whose session
    /// has not yet labeled itself (D5's helper runs from inside the
    /// session, so there is a window where a live pane looks unlabeled).
    /// The adapter's own bookkeeping of its own actions — never
    /// orchestrator state, and never persisted.
    pub pending_panes: &'a [String],
}

/// (b1) herdr pane-orchestration seam (tsk-3t9 D1) — swappable
/// independently of the render seam below.
pub trait PaneOrchestrator {
    /// Runs `/fgOS:pick <id>` in a worker-lane pane, reusing a free pane
    /// when the lane has one and splitting a new one only when it does
    /// not (tsk-1zq). Returns the pane id it actually used, so the caller
    /// can hold it pending until the launched session labels itself.
    fn open_pick_pane(&self, id: &str, lane: &WorkerLaneView) -> io::Result<String>;
    /// Opens a worker pane running `/fgOS:discover <id>` (tsk-1e3 D4) —
    /// same shape as `open_pick_pane`, different slash command.
    fn open_discover_pane(&self, id: &str, lane: &WorkerLaneView) -> io::Result<String>;
    /// Switches herdr's focus directly to an already-running pane
    /// (tsk-1eu D2), never opening a new one.
    fn focus_pane(&self, pane_id: &str) -> io::Result<()>;
    /// Runs `/fgOS:merge-next` in an already-resolved pane (tsk-57q;
    /// single-item `-next`, not the perpetual `-loop` skill, since
    /// tsk-4ry) — unlike `open_pick_pane`/`open_discover_pane`, this
    /// never places or reuses a pane itself: the fixed `fg:operation`
    /// tab's four slot panes are resolved once, eagerly, at startup
    /// (`layout::ensure_operation_tab`) and passed in directly. No id
    /// argument — `/fgOS:merge-next` picks its own item off the live
    /// merge pool, the same centralization `/fgOS:discover-next` already
    /// uses. This structural split is why the worker lane can reclaim
    /// panes at all (A7): admin-lane launches live here, never there.
    /// The method name keeps its `_loop` suffix (D3: this trait's public
    /// surface is unchanged, only the launched command and the guard
    /// deciding when to call it change) — see `main::auto_launch_operation_panes`
    /// for that guard.
    fn launch_merge_loop(&self, pane_id: &str) -> io::Result<()>;
    /// Same shape as `launch_merge_loop`, running `/fgOS:retro-next`.
    fn launch_retro_loop(&self, pane_id: &str) -> io::Result<()>;
    /// Same shape as `launch_merge_loop`, running `/fgOS:cleanup-next`.
    fn launch_cleanup_loop(&self, pane_id: &str) -> io::Result<()>;
    /// Unattended equivalent of `open_discover_pane` (tsk-2ja) — but never
    /// for a specific id: the caller only ever knows a discoverable item
    /// exists (via `next_auto_discover_candidate`'s own engine-backed
    /// readiness check against `fgos triage --json`'s dependency data),
    /// never which one, so picking stays fully centralized in
    /// `pickNextDiscoverItem` (`src/state/discover-pool.mjs`) — the typed
    /// command is `/fgOS:discover-next`, no id.
    ///
    /// tsk-1zq: no longer renames the pane to a fixed guard label first.
    /// That label existed only to serve as a launch mutex, and D2 forbids
    /// a label carrying orchestrator state at all — the "is one already
    /// running" question moved to the engine
    /// (`main::discovery_worker_alive`), so the write side of the guard
    /// goes with it rather than being left behind as decoration.
    fn open_auto_discover_pane(&self, lane: &WorkerLaneView) -> io::Result<String>;
}

/// (D7) Gateway verb-chokepoint seam (tsk-7l9-2): the ONE trait a gateway
/// HTTP handler calls through to run an `fgos <verb>` invocation. This is a
/// new, sibling seam to (a) `WorkItemSource` above — the TUI's own
/// `fgos.rs` read calls stay on that port, untouched; a gateway route
/// calls this one instead, so both ultimately funnel through the same
/// "only ever spawn `fgos <verb>` as a subprocess, never link the core lib"
/// boundary D8 already locked, just via two different callers of the same
/// underlying CLI-shelling mechanism.
///
/// Deliberately synchronous (not `async fn`, which would need the
/// `async-trait` crate or a hand-rolled boxed future): `fgos.rs`'s own
/// `FgosCliSource` already shells out to `node bin/fgos.mjs` synchronously
/// via `std::process::Command`, so the concrete adapter
/// (`gateway::FgosCliGateway`) does the same. Axum route handlers run it
/// through `tokio::task::spawn_blocking` (see `gateway.rs`) so this
/// blocking call never stalls the async runtime's own worker threads.
pub trait VerbGateway: Send + Sync {
    /// Runs `fgos <args...> --dir <root>`, parses the resulting `fgos.v1`
    /// envelope on stdout, and returns its `data` field on exit 0 — or a
    /// `GatewayError` carrying the same closed category taxonomy CTR001's
    /// own `EXIT_CODES` defines (`src/state/store.mjs`) on a non-zero exit.
    fn run_verb(&self, args: &[String]) -> Result<serde_json::Value, crate::gateway::GatewayError>;
}

/// Domain-level input the render adapter translates real terminal events
/// into — the domain and `main.rs`'s event loop never see a
/// `crossterm::event::KeyCode` directly.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UiEvent {
    Up,
    Down,
    /// Enter — its effect depends on which panel has focus (tsk-1eu D1):
    /// "Work items" runs the existing pick action, "In process" jumps to
    /// the selected task's pane.
    Pick,
    /// Tab — cycles keyboard focus forward through all 5 boxes (tsk-1eu
    /// D1; widened from WorkItems/InProcess-only by tsk-3wl D1).
    SwitchPanel,
    /// Shift+Tab — same cycle, backward (tsk-3wl D1).
    SwitchPanelPrev,
    /// `d` while the detail modal is open — fires the Discover button
    /// (tsk-1e3 D4). Inert everywhere else; inert even in the modal when
    /// the selected item's `stage != "clarify"` (checked by the caller,
    /// this event only carries the keypress itself).
    Discover,
    /// `]` — cycles the Work Items panel to the next tab (tsk-64z D1).
    NextTab,
    /// `[` — cycles the Work Items panel to the previous tab (tsk-64z D1).
    PrevTab,
    /// `/` — enters filter-input mode (tsk-64z D8). Only meaningful when
    /// not already filtering.
    ActivateFilter,
    /// A printable character typed while filter-input mode is active
    /// (tsk-64z D8) — `poll_event` only ever produces this while
    /// `app.filter_input_active` is true; every other context keeps its
    /// existing specific binding for the same physical key.
    FilterChar(char),
    /// Backspace while filtering (tsk-64z D8).
    FilterBackspace,
    /// Enter while filtering (tsk-64z D8) — leaves input mode, keeps the
    /// query applied.
    FilterSubmit,
    /// Esc while filtering (tsk-64z D8) — leaves input mode AND clears the
    /// query.
    FilterCancel,
    /// tsk-bvh D1: left-click inside a box's `Rect` (outside the modal,
    /// and not on a WorkItems/InProcess row) — focuses that box, same
    /// effect Tab already produces for it.
    ClickFocus(crate::app::Panel),
    /// tsk-bvh D1: left-click on a specific row inside the WorkItems or
    /// InProcess box — focuses that box AND selects the row ("click item
    /// = select" from the original ask). Never produced for
    /// NeedAnswer/MergeList/AfterDeliver (CONTEXT.md D1: those stay
    /// view-only, `ClickFocus` is the only event they ever produce).
    ClickSelectRow(crate::app::Panel, usize),
    Quit,
}

/// (b2) TUI render-framework seam (tsk-3t9 D1) — owns the terminal's
/// lifecycle (init/teardown) and the domain-to-widget conversion (D2: the
/// adapter, not `App`, holds any ratatui-specific selection state).
pub trait TerminalUi {
    fn draw(&mut self, app: &mut App) -> io::Result<()>;
    /// tsk-64z D8: takes `app` (read-only) so a raw keypress can be
    /// translated differently depending on `app.filter_input_active` —
    /// e.g. `j` moves the cursor normally, but inserts the literal
    /// character into the filter query while typing one. This is the one
    /// place the render adapter needs domain state to translate a key at
    /// all; every other translation stays a pure function of the key
    /// itself.
    fn poll_event(&mut self, app: &App, timeout: Duration) -> io::Result<Option<UiEvent>>;
}
