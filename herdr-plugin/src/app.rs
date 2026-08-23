use std::collections::HashSet;

use crate::fgos::{merge_tree_line_count, MergeListSummary, MergeTreeNode};
use crate::layout::OperationPanes;
use crate::pane_scan::{task_id_map, PaneIdentity, PaneSnapshot};
use crate::ports::{PaneRegistry, WorkItemSource};
use crate::settings::OrchestratorSettings;

/// tsk-417 D3: NEED ANSWER box row — `status` is `"blocked"` (ERR tag) or
/// `"awaiting-human"` (ASK tag), one box, distinct sub-tag per row.
pub struct NeedAnswerTask {
    pub id: String,
    pub title: String,
    pub status: String,
}

/// tsk-417 D3: AFTER DELIVER box row — `status` is `"retrospective"` (RTR
/// tag) or `"cleanup"` (POL tag).
pub struct AfterDeliverTask {
    pub id: String,
    pub title: String,
    pub status: String,
}

/// tsk-40t D5: a plain, ratatui-free rectangle (mirrors `ratatui::layout::
/// Rect`'s 4 fields) — the render adapter (`ui.rs`) writes this every
/// frame the detail modal renders, from its own `ratatui::layout::Rect`,
/// so `poll_event` (also `ui.rs`, domain-state-aware since tsk-64z) can
/// hit-test a mouse click against it without a `ratatui` type ever
/// crossing into `App` itself (D2's existing "no ratatui type in the
/// domain" boundary, preserved here rather than relaxed).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ButtonRect {
    pub x: u16,
    pub y: u16,
    pub width: u16,
    pub height: u16,
}

impl ButtonRect {
    pub fn contains(&self, col: u16, row: u16) -> bool {
        col >= self.x && col < self.x + self.width && row >= self.y && row < self.y + self.height
    }
}

#[derive(Clone)]
pub struct WorkItem {
    pub id: String,
    pub title: String,
    pub goal_tier: String,
    /// Gates the detail modal's Discover button — see `discover_eligible`
    /// below for the actual enablement rule.
    pub stage: String,
    /// tsk-64z D1: raw status literal — drives the Status column and the
    /// tab membership check (`WorkTab::matches`, below).
    pub status: String,
    /// tsk-64z D1: "Blocked By" column source.
    pub blocked_by: Vec<String>,
    /// tsk-64z D1: "Blocks" column source.
    pub blocks: u32,
    /// tsk-64z D2: sort key, ascending. `None` when not yet computed.
    pub priority: Option<i64>,
}

impl WorkItem {
    /// Whether `/fgOS:discover` actually applies to this item right now —
    /// the single shared definition `ui.rs` (button render) and `main.rs`
    /// (button click handler, auto-discover candidate filter) must both
    /// use, so they can never drift apart the way a `stage == "clarify"`
    /// render-side check and a `stage == "discovery"` handler-side check
    /// once did.
    ///
    /// Mirrors `CANDIDATE_STAGES` in `src/state/discover-pool.mjs`
    /// (`clarify`/`discovery`/`exploring` — the stages `/fgOS:discover`
    /// itself drives) plus that same module's `isDepsAndLineageReady`
    /// gate, approximated here via `blocked_by`: it is sourced from
    /// `fgos triage --json`'s `blockedBy`, which walks the identical
    /// unified dependency+lineage graph (`rankImpact`/`buildUnifiedEdges`,
    /// tsk-dus D1/D2) that `isDepsAndLineageReady` itself queries — a
    /// non-empty `blocked_by` means `fgos take`/`pick` would refuse this
    /// item today, so herdr must never open a discover pane for it.
    pub fn discover_eligible(&self) -> bool {
        self.in_discover_stage() && self.blocked_by.is_empty()
    }

    /// The stage half of `discover_eligible` on its own — the stages
    /// `/fgOS:discover` drives, mirroring `CANDIDATE_STAGES` in
    /// `src/state/discover-pool.mjs`.
    ///
    /// Split out for `main::discovery_worker_alive` (tsk-1zq), which asks
    /// whether a discovery worker is ALREADY RUNNING and so must not also
    /// require `blocked_by` to be empty: a claimed item is running no
    /// matter what it once waited on. Sharing the stage list rather than
    /// copying it is deliberate — a render-side `stage == "clarify"` and a
    /// handler-side `stage == "discovery"` drifting apart is a bug this
    /// file has already had once.
    pub fn in_discover_stage(&self) -> bool {
        matches!(self.stage.as_str(), "clarify" | "discovery" | "exploring")
    }
}

/// tsk-64z D1/D7: the Work Items panel's 5 tabs — a pure classification
/// over `WorkItem.status`, never a second copy of the item list.
///
/// `Backlog` is declared first because the tab strip mirrors the frozen
/// category order in `STATUS_CATEGORIES` (`src/state/work.mjs`), rather
/// than inventing a second ordering this side would have to keep in sync
/// by hand. It is a separate tab and not a marker inside `Todo` because
/// `backlog` carries its own `statusCategory` precisely so nothing reads a
/// backlog item as ready (work-item-backlog-status D3), and because
/// `backlog -> todo` is a human-only edge (D1): a person has to be able to
/// SEE the bucket before they can promote anything out of it (D4).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WorkTab {
    Backlog,
    Todo,
    Doing,
    Review,
    Done,
}

impl WorkTab {
    /// work-item-backlog-status D3: `backlog` only — its own tab, never
    /// folded into `Todo`, so nothing here reads it as ready.
    /// D1: `todo` only. D1: `doing`/`blocked`/`awaiting-human` — the same
    /// `in-progress` `statusCategory` grouping `workflow-stage-graphs.mjs`
    /// already uses for the `coding` domain. D1: `awaiting-approval` only.
    /// D7: the `delivered`/`retrospective`/`cleanup`/`done` tail chain PLUS
    /// `wontfix` (D7 explicitly folds canceled items into this tab too).
    fn matches(self, status: &str) -> bool {
        match self {
            WorkTab::Backlog => status == "backlog",
            WorkTab::Todo => status == "todo",
            WorkTab::Doing => matches!(status, "doing" | "blocked" | "awaiting-human"),
            WorkTab::Review => status == "awaiting-approval",
            WorkTab::Done => matches!(
                status,
                "delivered" | "retrospective" | "cleanup" | "done" | "wontfix"
            ),
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            WorkTab::Backlog => "BACKLOG",
            WorkTab::Todo => "TODO",
            WorkTab::Doing => "DOING",
            WorkTab::Review => "REVIEW",
            WorkTab::Done => "DONE",
        }
    }

    fn next(self) -> Self {
        match self {
            WorkTab::Backlog => WorkTab::Todo,
            WorkTab::Todo => WorkTab::Doing,
            WorkTab::Doing => WorkTab::Review,
            WorkTab::Review => WorkTab::Done,
            WorkTab::Done => WorkTab::Backlog,
        }
    }

    fn prev(self) -> Self {
        match self {
            WorkTab::Backlog => WorkTab::Done,
            WorkTab::Todo => WorkTab::Backlog,
            WorkTab::Doing => WorkTab::Todo,
            WorkTab::Review => WorkTab::Doing,
            WorkTab::Done => WorkTab::Review,
        }
    }
}

/// Which list currently has keyboard focus (tsk-1eu D1) — `Up`/`Down`/
/// `Enter` always apply to whichever panel this names.
///
/// tsk-3wl D1: `NeedAnswer`/`MergeList`/`AfterDeliver` are focusable but
/// read-only — `Up`/`Down` scroll them (see `scroll_need_answer_down` and
/// its siblings below), `Enter` does nothing while one of them is
/// focused. Variant order is the same top-to-bottom, left-to-right order
/// the layout already renders in (`ui.rs`'s `columns`/`right_column`
/// split), so `next`/`prev` below cycle in reading order.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Panel {
    WorkItems,
    InProcess,
    NeedAnswer,
    MergeList,
    AfterDeliver,
}

impl Panel {
    fn next(self) -> Self {
        match self {
            Panel::WorkItems => Panel::InProcess,
            Panel::InProcess => Panel::NeedAnswer,
            Panel::NeedAnswer => Panel::MergeList,
            Panel::MergeList => Panel::AfterDeliver,
            Panel::AfterDeliver => Panel::WorkItems,
        }
    }

    fn prev(self) -> Self {
        match self {
            Panel::WorkItems => Panel::AfterDeliver,
            Panel::InProcess => Panel::WorkItems,
            Panel::NeedAnswer => Panel::InProcess,
            Panel::MergeList => Panel::NeedAnswer,
            Panel::AfterDeliver => Panel::MergeList,
        }
    }
}

/// D4: an fgOS item with `status: doing` — always "doing" by definition, so
/// no separate status field is carried here.
pub struct InProcessTask {
    pub id: String,
    pub title: String,
    /// `Some` when the most recent pane scan found a matching herdr pane
    /// (tsk-4zo D1); `None` means orphaned — the task is `doing` but no
    /// live pane was found for it.
    pub pane: Option<PaneIdentity>,
}

pub struct App {
    pub work_items: Vec<WorkItem>,
    pub in_process: Vec<InProcessTask>,
    pub last_error: Option<String>,
    /// Plain row index — no ratatui type in the domain (D2). The render
    /// adapter (`ui.rs`) converts this to its own widget state at draw
    /// time.
    pub selected: Option<usize>,
    /// Independent cursor for the `in_process` list (tsk-1eu D1) — same
    /// plain-index shape as `selected`, never shared with it, so
    /// switching panels never loses your place in the other one.
    pub in_process_selected: Option<usize>,
    /// Which list currently has keyboard focus (tsk-1eu D1).
    pub focused_panel: Panel,
    /// Set right after a pick pane is opened, cleared on the next
    /// keypress — a one-line status confirmation, never a blocking modal.
    pub pick_status: Option<String>,
    /// True while the work-item detail dialog is showing. Enter on the
    /// "Work items" panel opens it instead of picking directly; while
    /// open, Up/Down/Tab are inert and Esc closes it without quitting.
    pub detail_modal_open: bool,
    /// tsk-64z D1: which of the 4 Work Items tabs is active.
    pub active_tab: WorkTab,
    /// tsk-64z D8: true while the `/` filter input is being typed —
    /// applies to the Work Items panel only, never the right-side boxes.
    pub filter_input_active: bool,
    /// tsk-64z D8: the current filter text (case-insensitive substring
    /// match against id/title). Empty string = no filter applied,
    /// regardless of `filter_input_active`.
    pub filter_query: String,
    /// tsk-417 D3: NEED ANSWER box rows.
    pub need_answer: Vec<NeedAnswerTask>,
    /// tsk-417 D3: AFTER DELIVER box rows.
    pub after_deliver: Vec<AfterDeliverTask>,
    /// tsk-417 D3: MERGE LIST box source — a direct field mapping of
    /// `fgos merge list --json`, never re-derived.
    pub merge_list: MergeListSummary,
    /// tsk-40t D5: the detail modal's Pick button's on-screen rectangle,
    /// written by `ui.rs`'s `draw_detail_modal` every frame the modal
    /// renders — `None` whenever the modal isn't open (nothing to
    /// hit-test against).
    pub pick_button_rect: Option<ButtonRect>,
    /// tsk-40t D5: same idea as `pick_button_rect`, for Discover.
    pub discover_button_rect: Option<ButtonRect>,
    /// tsk-3wl D1: scroll offset (lines) into the NEED ANSWER box's
    /// `Paragraph` — this box has no row-select, only scroll.
    pub need_answer_scroll: u16,
    /// tsk-3wl D1: same idea as `need_answer_scroll`, for MERGE LIST.
    pub merge_list_scroll: u16,
    /// tsk-3wl D1: same idea as `need_answer_scroll`, for AFTER DELIVER.
    pub after_deliver_scroll: u16,
    /// tsk-bvh D1: each box's own on-screen rectangle, written by `ui.rs`'s
    /// `draw` every frame — same "domain-safe `Rect` copy" pattern
    /// `pick_button_rect`/`discover_button_rect` already use for the
    /// modal's two buttons, widened here to all 5 boxes so `poll_event`
    /// can hit-test a click against any of them, not just the modal.
    pub work_items_rect: Option<ButtonRect>,
    pub in_process_rect: Option<ButtonRect>,
    pub need_answer_rect: Option<ButtonRect>,
    pub merge_list_rect: Option<ButtonRect>,
    pub after_deliver_rect: Option<ButtonRect>,
    /// tsk-2m5: the herdr-orchestrator's own auto-launch toggles, read
    /// fail-closed from the shared config file each poll tick
    /// (`settings::read_settings`). Storing only — acting on an enabled
    /// toggle is a sibling launcher item's own footprint (tsk-2ja/tsk-57q).
    pub orchestrator_settings: OrchestratorSettings,
    /// The fixed `fg:operation` tab's four slot panes (tsk-5lr CONTEXT.md
    /// D1; its D2's left/right geometry superseded by tsk-1zq), `None`
    /// until `main()`'s startup call to `layout::ensure_operation_tab`
    /// resolves them. A plain data carrier — which loop launches into
    /// which slot is tsk-2xt's own scope, not this item's.
    pub operation_panes: Option<OperationPanes>,
    /// Worker-lane panes this dashboard has launched into but has not yet
    /// seen label themselves (tsk-1zq). A launched session sets its own
    /// label through T3's capability-gated helper (D5), so between the
    /// launch and that write the pane looks unlabeled and would otherwise
    /// read as free — reusing it there would drop a second worker on top
    /// of a booting one.
    ///
    /// Deliberately in-process and never persisted: this is the adapter's
    /// bookkeeping about its own actions, not orchestrator state (which
    /// D2 puts in the engine). Being in-process is also what keeps it from
    /// becoming the very bug this item removes — a herdr-plugin restart
    /// clears it, whereas the pane label it replaces could stay stuck
    /// forever.
    pub pending_worker_panes: HashSet<String>,
    /// The one auto-discover pane this dashboard has launched but not yet
    /// seen claim land, if any (tsk-3q8z). `discovery_worker_alive` only
    /// answers true once the launched session actually runs `fgos take`/
    /// `fgos discover` against its item, so between launch and that claim
    /// the poll-tick auto-discover condition (`main.rs::run`) would
    /// otherwise re-fire every tick for the whole boot+claim window.
    /// Deliberately separate from `pending_worker_panes` above: that set is
    /// shared with the execution lane's own launches, and gating
    /// auto-discover on "any pending pane at all" would wrongly block a
    /// fresh discover launch behind an unrelated execution-lane one. Only
    /// ever holds at most one pane id, since `next_auto_discover_candidate`
    /// picks at most one candidate per tick. Same in-process, never-
    /// persisted discipline as `pending_worker_panes` — a herdr-plugin
    /// restart clears it, which is correct: nothing this adapter believed
    /// about an in-flight launch survives a restart either.
    pub pending_discover_pane: Option<String>,
    /// The admin-lane pane this dashboard has launched an `/fgOS:merge-next`
    /// run into but has not yet seen exit, if any (tsk-4ry). Unlike
    /// `pending_discover_pane` above, `/fgOS:merge-next` holds no
    /// lingering claimed-item status for its run's duration — it is one
    /// CLI call, not a claim-and-hold — so there is no engine-truth
    /// signal to catch up to; the pane's own presence in a fresh scan is
    /// the only "still running" signal available. Cleared once the pane
    /// id is no longer present in a scan (`retire_settled_pending_operation_panes`,
    /// below) — never "claimed and doing", since there is nothing to
    /// claim. Same in-process, never-persisted discipline as
    /// `pending_discover_pane`: a herdr-plugin restart clears it, which
    /// is correct, since nothing this adapter believed about an in-flight
    /// launch survives a restart either.
    pub pending_merge_pane: Option<String>,
    /// Same shape as `pending_merge_pane`, for `/fgOS:retro-next`.
    pub pending_retro_pane: Option<String>,
    /// Same shape as `pending_merge_pane`, for `/fgOS:cleanup-next`.
    pub pending_cleanup_pane: Option<String>,
}

impl App {
    pub fn empty() -> Self {
        Self {
            work_items: Vec::new(),
            in_process: Vec::new(),
            last_error: None,
            selected: None,
            in_process_selected: None,
            focused_panel: Panel::WorkItems,
            pick_status: None,
            detail_modal_open: false,
            active_tab: WorkTab::Todo,
            filter_input_active: false,
            filter_query: String::new(),
            need_answer: Vec::new(),
            after_deliver: Vec::new(),
            merge_list: MergeListSummary::default(),
            pick_button_rect: None,
            discover_button_rect: None,
            need_answer_scroll: 0,
            merge_list_scroll: 0,
            after_deliver_scroll: 0,
            work_items_rect: None,
            in_process_rect: None,
            need_answer_rect: None,
            merge_list_rect: None,
            after_deliver_rect: None,
            orchestrator_settings: OrchestratorSettings::default(),
            operation_panes: None,
            pending_worker_panes: HashSet::new(),
            pending_discover_pane: None,
            pending_merge_pane: None,
            pending_retro_pane: None,
            pending_cleanup_pane: None,
        }
    }

    /// tsk-64z D1/D8: `work_items` filtered to the active tab AND, when
    /// non-empty, a case-insensitive substring match against id/title —
    /// the single source both rendering and selection (`select_next`/
    /// `select_previous`/`selected_id`/`selected_work_item`) read, so the
    /// cursor can never land on a row hidden by the current tab/filter.
    pub fn visible_work_items(&self) -> Vec<&WorkItem> {
        let query = self.filter_query.to_lowercase();
        self.work_items
            .iter()
            .filter(|item| self.active_tab.matches(&item.status))
            .filter(|item| {
                query.is_empty()
                    || item.id.to_lowercase().contains(&query)
                    || item.title.to_lowercase().contains(&query)
            })
            .collect()
    }

    pub fn select_next(&mut self) {
        let len = self.visible_work_items().len();
        if len == 0 {
            return;
        }
        let next = match self.selected {
            Some(i) => (i + 1) % len,
            None => 0,
        };
        self.selected = Some(next);
    }

    pub fn select_previous(&mut self) {
        let len = self.visible_work_items().len();
        if len == 0 {
            return;
        }
        let prev = match self.selected {
            Some(0) | None => len - 1,
            Some(i) => i - 1,
        };
        self.selected = Some(prev);
    }

    pub fn selected_id(&self) -> Option<&str> {
        let items = self.visible_work_items();
        self.selected
            .and_then(|i| items.get(i))
            .map(|item| item.id.as_str())
    }

    /// Full row for the currently selected work item — the detail modal
    /// needs the title and goal tier, not just the id `selected_id` gives.
    pub fn selected_work_item(&self) -> Option<&WorkItem> {
        let items = self.visible_work_items();
        self.selected.and_then(|i| items.get(i).copied())
    }

    /// A live poll (or a tab/filter change) can shrink or grow the visible
    /// set; keep the cursor inside bounds rather than pointing at a row
    /// that no longer exists.
    fn clamp_selection(&mut self) {
        let len = self.visible_work_items().len();
        if len == 0 {
            self.selected = None;
        } else if let Some(i) = self.selected {
            if i >= len {
                self.selected = Some(len - 1);
            }
        } else {
            self.selected = Some(0);
        }
    }

    /// tsk-64z D1: cycles the active tab forward, resetting selection to
    /// the new tab's first row (never keeps a numeric index that would now
    /// silently point at a different item under the new tab).
    pub fn next_tab(&mut self) {
        self.active_tab = self.active_tab.next();
        self.selected = None;
        self.clamp_selection();
    }

    /// tsk-64z D1: same reset discipline as `next_tab`, backward.
    pub fn prev_tab(&mut self) {
        self.active_tab = self.active_tab.prev();
        self.selected = None;
        self.clamp_selection();
    }

    /// tsk-64z D8: enters filter-input mode (`/`) — typed characters route
    /// to `filter_push_char` instead of their normal binding while this is
    /// true (the render adapter's `poll_event` reads this field to decide).
    pub fn activate_filter(&mut self) {
        self.filter_input_active = true;
    }

    pub fn filter_push_char(&mut self, c: char) {
        self.filter_query.push(c);
        self.selected = None;
        self.clamp_selection();
    }

    pub fn filter_backspace(&mut self) {
        self.filter_query.pop();
        self.selected = None;
        self.clamp_selection();
    }

    /// Enter while filtering: leaves input mode, KEEPS the query applied.
    pub fn filter_submit(&mut self) {
        self.filter_input_active = false;
    }

    /// Esc while filtering: leaves input mode AND clears the query —
    /// distinct from `filter_submit`, matching D8's "activate on `/`, Esc
    /// cancels, Enter applies" contract.
    pub fn filter_cancel(&mut self) {
        self.filter_input_active = false;
        self.filter_query.clear();
        self.selected = None;
        self.clamp_selection();
    }

    /// tsk-1eu D1: same wrap-around shape as `select_next`, targeting
    /// `in_process` instead.
    pub fn select_next_in_process(&mut self) {
        if self.in_process.is_empty() {
            return;
        }
        let next = match self.in_process_selected {
            Some(i) => (i + 1) % self.in_process.len(),
            None => 0,
        };
        self.in_process_selected = Some(next);
    }

    /// tsk-1eu D1: same wrap-around shape as `select_previous`, targeting
    /// `in_process` instead.
    pub fn select_previous_in_process(&mut self) {
        if self.in_process.is_empty() {
            return;
        }
        let prev = match self.in_process_selected {
            Some(0) | None => self.in_process.len() - 1,
            Some(i) => i - 1,
        };
        self.in_process_selected = Some(prev);
    }

    /// `Some(pane_id)` only when the selected `in_process` row actually
    /// has a live pane (tsk-1eu D2) — an orphaned row (`pane: None`, D2's
    /// badge from `tsk-4zo`) has nothing to jump to.
    pub fn selected_in_process_pane_id(&self) -> Option<&str> {
        self.in_process_selected
            .and_then(|i| self.in_process.get(i))
            .and_then(|task| task.pane.as_ref())
            .map(|pane| pane.pane_id.as_str())
    }

    /// A live poll can shrink or grow `in_process`; same clamp discipline
    /// `clamp_selection` already gives `work_items`.
    fn clamp_in_process_selection(&mut self) {
        if self.in_process.is_empty() {
            self.in_process_selected = None;
        } else if let Some(i) = self.in_process_selected {
            if i >= self.in_process.len() {
                self.in_process_selected = Some(self.in_process.len() - 1);
            }
        } else {
            self.in_process_selected = Some(0);
        }
    }

    /// tsk-1eu D1 / tsk-3wl D1: cycles keyboard focus forward through all
    /// 5 boxes (was WorkItems/InProcess-only before tsk-3wl).
    pub fn switch_panel(&mut self) {
        self.focused_panel = self.focused_panel.next();
    }

    /// tsk-3wl D1: same cycle, backward — the Shift+Tab counterpart.
    pub fn switch_panel_prev(&mut self) {
        self.focused_panel = self.focused_panel.prev();
    }

    /// tsk-3wl D1: NeedAnswer/MergeList/AfterDeliver have no row-select
    /// (they stay view-only) — Up/Down instead scroll their `Paragraph`
    /// down by one line, clamped so the offset never runs past the last
    /// row (scrolling further would just show blank space).
    pub fn scroll_need_answer_down(&mut self) {
        let max = self.need_answer.len().saturating_sub(1) as u16;
        self.need_answer_scroll = (self.need_answer_scroll + 1).min(max);
    }

    pub fn scroll_need_answer_up(&mut self) {
        self.need_answer_scroll = self.need_answer_scroll.saturating_sub(1);
    }

    pub fn scroll_merge_list_down(&mut self) {
        // tsk-59b: scroll bound now matches rendered LINE count of the tree
        // (nodes + reason lines), not the old flat ready/waiting/
        // blocked_on_sync bucket count — Paragraph::scroll moves by
        // rendered line, and a `reason` line (D7) adds one line per node
        // that carries one.
        let len = merge_tree_line_count(&self.merge_list.tree);
        let max = len.saturating_sub(1) as u16;
        self.merge_list_scroll = (self.merge_list_scroll + 1).min(max);
    }

    pub fn scroll_merge_list_up(&mut self) {
        self.merge_list_scroll = self.merge_list_scroll.saturating_sub(1);
    }

    pub fn scroll_after_deliver_down(&mut self) {
        let max = self.after_deliver.len().saturating_sub(1) as u16;
        self.after_deliver_scroll = (self.after_deliver_scroll + 1).min(max);
    }

    pub fn scroll_after_deliver_up(&mut self) {
        self.after_deliver_scroll = self.after_deliver_scroll.saturating_sub(1);
    }

    /// Fake/hardcoded rows — kept only for offline rendering smoke tests
    /// (D6's original mock-only slice); the running binary uses
    /// `refresh_from_fgos` instead.
    pub fn mock() -> Self {
        Self {
            work_items: vec![
                WorkItem {
                    id: "tsk-19y-1".into(),
                    title: "Herdr plugin scaffold + mock/static dashboard TUI".into(),
                    goal_tier: "mvp".into(),
                    stage: "discovery".into(),
                    status: "todo".into(),
                    blocked_by: Vec::new(),
                    blocks: 0,
                    priority: None,
                },
                WorkItem {
                    id: "tsk-19y-2".into(),
                    title: "Wire real fgOS data into the dashboard".into(),
                    goal_tier: "mvp".into(),
                    stage: "planning".into(),
                    status: "doing".into(),
                    blocked_by: Vec::new(),
                    blocks: 1,
                    priority: Some(200),
                },
                WorkItem {
                    id: "tsk-19y-3".into(),
                    title: "Pick orchestration action".into(),
                    goal_tier: "milestone".into(),
                    stage: "executing".into(),
                    status: "awaiting-approval".into(),
                    blocked_by: vec!["tsk-19y-2".into()],
                    blocks: 0,
                    priority: Some(100),
                },
            ],
            in_process: vec![InProcessTask {
                id: "tsk-19y-2".into(),
                title: "Wire real fgOS data into the dashboard".into(),
                pane: None,
            }],
            last_error: None,
            selected: None,
            in_process_selected: None,
            focused_panel: Panel::WorkItems,
            pick_status: None,
            detail_modal_open: false,
            active_tab: WorkTab::Todo,
            filter_input_active: false,
            filter_query: String::new(),
            need_answer: vec![NeedAnswerTask {
                id: "tsk-mock-blocked".into(),
                title: "Mock blocked item".into(),
                status: "blocked".into(),
            }],
            after_deliver: vec![AfterDeliverTask {
                id: "tsk-mock-retro".into(),
                title: "Mock retrospective item".into(),
                status: "retrospective".into(),
            }],
            merge_list: MergeListSummary {
                ready: vec!["tsk-mock-ready".into()],
                waiting: Vec::new(),
                blocked_on_sync: Vec::new(),
                // tsk-59b: kept in sync with `ready` above -- one top-level
                // ready node, matching the id/shape a real `tree` field
                // carries.
                tree: vec![MergeTreeNode {
                    id: "tsk-mock-ready".into(),
                    title: "Mock ready item".into(),
                    status: "ready".into(),
                    reason: None,
                    children: Vec::new(),
                }],
            },
            pick_button_rect: None,
            discover_button_rect: None,
            need_answer_scroll: 0,
            merge_list_scroll: 0,
            after_deliver_scroll: 0,
            work_items_rect: None,
            in_process_rect: None,
            need_answer_rect: None,
            merge_list_rect: None,
            after_deliver_rect: None,
            orchestrator_settings: OrchestratorSettings::default(),
            operation_panes: None,
            pending_worker_panes: HashSet::new(),
            pending_discover_pane: None,
            pending_merge_pane: None,
            pending_retro_pane: None,
            pending_cleanup_pane: None,
        }
    }

    /// Replace `work_items`/`in_process` with real fgOS-CLI data (D4/D5),
    /// sourced through the `WorkItemSource` port (tsk-3t9 D1) rather than
    /// a concrete module — `source` is the composition root's adapter, not
    /// something this method constructs itself.
    /// On a poll failure, the previous rows are left untouched and the
    /// failure is surfaced via `last_error` — a transient CLI hiccup must
    /// never blank an already-populated dashboard.
    pub fn refresh_from_fgos(&mut self, source: &dyn WorkItemSource) {
        // tsk-1pg D2: track whether one of the 5 sources below already
        // recorded an error THIS cycle. Once one has, no later branch --
        // success or failure -- overwrites `last_error`: the first error
        // in call order (triage -> doing -> need_answer -> after_deliver
        // -> merge_list) wins and stays on screen for the whole cycle.
        let mut error_recorded_this_cycle = false;

        match source.fetch_triage() {
            Ok(rows) => {
                let mut items: Vec<WorkItem> = rows
                    .into_iter()
                    .map(|row| WorkItem {
                        id: row.id,
                        title: row.title,
                        goal_tier: row.goal_tier.unwrap_or_else(|| "none".into()),
                        stage: row.stage,
                        status: row.status,
                        blocked_by: row.blocked_by,
                        blocks: row.blocks,
                        priority: row.priority,
                    })
                    .collect();
                // tsk-64z D2: the domain owns this ordering guarantee
                // independent of which `WorkItemSource` adapter is wired
                // in (`fgos.rs`'s `parse_triage` already sorts the same
                // way for the real CLI source; this keeps the invariant
                // even for a source that doesn't).
                items.sort_by_key(|item| item.priority.unwrap_or(i64::MAX));
                self.work_items = items;
                if !error_recorded_this_cycle {
                    self.last_error = None;
                }
                self.clamp_selection();
            }
            Err(err) => {
                if !error_recorded_this_cycle {
                    self.last_error = Some(err.to_string());
                    error_recorded_this_cycle = true;
                }
            }
        }

        match source.fetch_doing() {
            Ok(rows) => {
                self.in_process = rows
                    .into_iter()
                    .map(|row| InProcessTask {
                        id: row.id,
                        title: row.title,
                        pane: None,
                    })
                    .collect();
                if !error_recorded_this_cycle {
                    self.last_error = None;
                }
                self.clamp_in_process_selection();
            }
            Err(err) => {
                if !error_recorded_this_cycle {
                    self.last_error = Some(err.to_string());
                    error_recorded_this_cycle = true;
                }
            }
        }

        match source.fetch_need_answer() {
            Ok(rows) => {
                self.need_answer = rows
                    .into_iter()
                    .map(|row| NeedAnswerTask {
                        id: row.id,
                        title: row.title,
                        status: row.status,
                    })
                    .collect();
                if !error_recorded_this_cycle {
                    self.last_error = None;
                }
            }
            Err(err) => {
                if !error_recorded_this_cycle {
                    self.last_error = Some(err.to_string());
                    error_recorded_this_cycle = true;
                }
            }
        }

        match source.fetch_after_deliver() {
            Ok(rows) => {
                self.after_deliver = rows
                    .into_iter()
                    .map(|row| AfterDeliverTask {
                        id: row.id,
                        title: row.title,
                        status: row.status,
                    })
                    .collect();
                if !error_recorded_this_cycle {
                    self.last_error = None;
                }
            }
            Err(err) => {
                if !error_recorded_this_cycle {
                    self.last_error = Some(err.to_string());
                    error_recorded_this_cycle = true;
                }
            }
        }

        // merge_list is the last source this cycle -- no branch below reads
        // `error_recorded_this_cycle` again, so its own `Err` arm doesn't
        // need to flip the flag, but it still must not overwrite an error
        // an earlier source already recorded this cycle.
        match source.fetch_merge_list() {
            Ok(summary) => {
                self.merge_list = summary;
                if !error_recorded_this_cycle {
                    self.last_error = None;
                }
            }
            Err(err) => {
                if !error_recorded_this_cycle {
                    self.last_error = Some(err.to_string());
                }
            }
        }
    }

    /// Map each `in_process` task to its herdr pane identity (tsk-4zo D1),
    /// sourced through the `PaneRegistry` port rather than shelling to
    /// `herdr` directly. A task-id absent from the scan result is left
    /// `None` — orphaned (D2's badge, rendered by `ui.rs`, reads this
    /// field; this method only produces it).
    /// On a scan failure, existing `pane` values are left untouched and
    /// the failure is surfaced via `last_error` — same transient-failure
    /// discipline `refresh_from_fgos` already uses.
    pub fn refresh_pane_state(&mut self, registry: &dyn PaneRegistry) {
        match registry.scan_panes() {
            Ok(panes) => {
                let map = task_id_map(&panes);
                for task in &mut self.in_process {
                    task.pane = map.get(&task.id).cloned();
                }
                self.retire_settled_pending_panes(&panes);
                self.retire_settled_pending_discover_pane();
                self.retire_settled_pending_operation_panes(&panes);
                self.last_error = None;
            }
            Err(err) => self.last_error = Some(err.to_string()),
        }
    }

    /// A pending pane stops being pending once it settles: gone from the
    /// scan entirely (a closed pane is nothing to hold open for), or
    /// carrying a label whose task id the engine actually reports at
    /// `doing` — that write only happens from inside a launched session
    /// (D5) that has genuinely claimed its item, which is the real proof
    /// the worker booted (tsk-3q8z). A pane that carries a label for an id
    /// that is NOT `doing` stays pending: on a REUSED pane, the previous
    /// occupant's stale label is still sitting there the instant the new
    /// worker's pane is opened, before the new worker has booted at all —
    /// checking against `doing_item_ids()` here (not just "any label at
    /// all") is what keeps that stale label from retiring the pane one
    /// tick too early and letting herdr stack a second launch on top of
    /// the first.
    fn retire_settled_pending_panes(&mut self, panes: &[PaneSnapshot]) {
        let labeled = task_id_map(panes);
        let doing: HashSet<&str> = self
            .work_items
            .iter()
            .filter(|item| item.status == "doing")
            .map(|item| item.id.as_str())
            .collect();
        let still_pending: HashSet<String> = self
            .pending_worker_panes
            .iter()
            .filter(|pane_id| panes.iter().any(|pane| pane.pane_id == **pane_id))
            .filter(|pane_id| {
                match labeled.iter().find(|(_, identity)| identity.pane_id == **pane_id) {
                    None => true,
                    Some((task_id, _)) => !doing.contains(task_id.as_str()),
                }
            })
            .cloned()
            .collect();
        self.pending_worker_panes = still_pending;
    }

    /// Clears `pending_discover_pane` once it settles (tsk-3q8z). Reuses
    /// `retire_settled_pending_panes`'s own "gone from scan, or claimed and
    /// doing" verdict rather than re-deriving it: every pane
    /// `launch_worker` opens — including an auto-discover launch — is
    /// inserted into `pending_worker_panes` too, so once this pane id is no
    /// longer present there, it has already settled by the same rule.
    /// Called right after `retire_settled_pending_panes` in the same
    /// `refresh_pane_state` pass, so both fields stay consistent within one
    /// poll tick.
    fn retire_settled_pending_discover_pane(&mut self) {
        if let Some(pane_id) = &self.pending_discover_pane {
            if !self.pending_worker_panes.contains(pane_id) {
                self.pending_discover_pane = None;
            }
        }
    }

    /// Clears `pending_merge_pane`/`pending_retro_pane`/`pending_cleanup_pane`
    /// once each settles (tsk-4ry). Unlike `retire_settled_pending_discover_pane`
    /// above, this cannot reuse `pending_worker_panes`'s own membership
    /// check: the fixed `fg:operation` tab's admin panes are launched
    /// directly by `pane_orchestrator.launch_merge_loop`/etc
    /// (`main::auto_launch_operation_panes`), never through `launch_worker`,
    /// so they are never inserted into `pending_worker_panes` in the first
    /// place. And unlike the discover case, `/fgOS:merge-next`/`retro-next`/
    /// `cleanup-next` hold no lingering claimed-item status to catch up to
    /// (D9: the admin lane never claims a work item at all) — so "settled"
    /// here means only "gone from the scan", the plain half of
    /// `retire_settled_pending_panes`'s own rule, checked directly against
    /// this same tick's fresh `panes` scan.
    fn retire_settled_pending_operation_panes(&mut self, panes: &[PaneSnapshot]) {
        let still_in_scan = |pane_id: &str| panes.iter().any(|pane| pane.pane_id == pane_id);
        if self.pending_merge_pane.as_deref().is_some_and(|id| !still_in_scan(id)) {
            self.pending_merge_pane = None;
        }
        if self.pending_retro_pane.as_deref().is_some_and(|id| !still_in_scan(id)) {
            self.pending_retro_pane = None;
        }
        if self.pending_cleanup_pane.as_deref().is_some_and(|id| !still_in_scan(id)) {
            self.pending_cleanup_pane = None;
        }
    }

    /// The ids the engine currently reports at `status: doing` — the
    /// liveness half of every worker-lane decision (D2). Read straight off
    /// the work list the poll tick already fetched via `fgos triage
    /// --json`, so this costs no extra call.
    pub fn doing_item_ids(&self) -> Vec<String> {
        self.work_items
            .iter()
            .filter(|item| item.status == "doing")
            .map(|item| item.id.clone())
            .collect()
    }

    /// `pending_worker_panes` as the slice the `WorkerLaneView` port takes.
    pub fn pending_pane_ids(&self) -> Vec<String> {
        self.pending_worker_panes.iter().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fgos::{DoingRow, FgosError, TriageRow};
    use std::collections::HashMap;

    struct FakeSource {
        triage: Vec<TriageRow>,
    }

    impl WorkItemSource for FakeSource {
        fn fetch_triage(&self) -> Result<Vec<TriageRow>, FgosError> {
            Ok(self.triage.clone())
        }

        fn fetch_doing(&self) -> Result<Vec<DoingRow>, FgosError> {
            Ok(Vec::new())
        }

        fn fetch_need_answer(&self) -> Result<Vec<crate::fgos::NeedAnswerRow>, FgosError> {
            Ok(Vec::new())
        }

        fn fetch_after_deliver(&self) -> Result<Vec<crate::fgos::AfterDeliverRow>, FgosError> {
            Ok(Vec::new())
        }

        fn fetch_merge_list(&self) -> Result<MergeListSummary, FgosError> {
            Ok(MergeListSummary::default())
        }
    }

    /// tsk-1pg D2: lets a test fail any subset of `refresh_from_fgos`'s 5
    /// sources independently, in call order (triage, doing, need_answer,
    /// after_deliver, merge_list), to prove which error wins when more
    /// than one fails in the same cycle.
    struct OrderedFailureSource {
        fail_triage: bool,
        fail_doing: bool,
        fail_need_answer: bool,
        fail_after_deliver: bool,
        fail_merge_list: bool,
    }

    impl WorkItemSource for OrderedFailureSource {
        fn fetch_triage(&self) -> Result<Vec<TriageRow>, FgosError> {
            if self.fail_triage {
                Err(FgosError::ExitStatus("triage failed".into()))
            } else {
                Ok(Vec::new())
            }
        }

        fn fetch_doing(&self) -> Result<Vec<DoingRow>, FgosError> {
            if self.fail_doing {
                Err(FgosError::ExitStatus("doing failed".into()))
            } else {
                Ok(Vec::new())
            }
        }

        fn fetch_need_answer(&self) -> Result<Vec<crate::fgos::NeedAnswerRow>, FgosError> {
            if self.fail_need_answer {
                Err(FgosError::ExitStatus("need_answer failed".into()))
            } else {
                Ok(Vec::new())
            }
        }

        fn fetch_after_deliver(&self) -> Result<Vec<crate::fgos::AfterDeliverRow>, FgosError> {
            if self.fail_after_deliver {
                Err(FgosError::ExitStatus("after_deliver failed".into()))
            } else {
                Ok(Vec::new())
            }
        }

        fn fetch_merge_list(&self) -> Result<MergeListSummary, FgosError> {
            if self.fail_merge_list {
                Err(FgosError::ExitStatus("merge_list failed".into()))
            } else {
                Ok(MergeListSummary::default())
            }
        }
    }

    #[test]
    fn last_error_first_error_wins() {
        // doing (2nd) fails; need_answer/after_deliver/merge_list (3rd-5th,
        // all after it) succeed -- a later success in the same cycle must
        // never clear the error already recorded.
        let source = OrderedFailureSource {
            fail_triage: false,
            fail_doing: true,
            fail_need_answer: false,
            fail_after_deliver: false,
            fail_merge_list: false,
        };
        let mut app = App::empty();
        app.refresh_from_fgos(&source);
        let err = app.last_error.expect("an error should be recorded");
        assert!(err.contains("doing failed"), "a later success must not clear the earlier error, got: {err}");

        // triage (1st) AND merge_list (5th, last) both fail -- the first
        // error in call order wins; a later failure in the same cycle must
        // not replace it either.
        let source = OrderedFailureSource {
            fail_triage: true,
            fail_doing: false,
            fail_need_answer: false,
            fail_after_deliver: false,
            fail_merge_list: true,
        };
        let mut app = App::empty();
        app.refresh_from_fgos(&source);
        let err = app.last_error.expect("an error should be recorded");
        assert!(err.contains("triage failed"), "the first error in call order must win, got: {err}");
    }

    fn triage_row(id: &str, status: &str, priority: Option<i64>) -> TriageRow {
        TriageRow {
            id: id.into(),
            title: format!("Title for {id}"),
            goal_tier: None,
            stage: "executing".into(),
            status: status.into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority,
        }
    }

    /// tsk-64z D2: `refresh_from_fgos` sorts by `priority` ASCENDING,
    /// regardless of the source's own given order — the fixture is
    /// deliberately handed in reverse-of-expected order, and a row with no
    /// priority yet sorts last.
    #[test]
    fn work_items_sorted_by_priority_ascending() {
        let source = FakeSource {
            triage: vec![
                triage_row("tsk-no-priority", "todo", None),
                triage_row("tsk-high-num", "todo", Some(300)),
                triage_row("tsk-low-num", "todo", Some(100)),
            ],
        };
        let mut app = App::empty();
        app.refresh_from_fgos(&source);
        let ids: Vec<&str> = app.work_items.iter().map(|i| i.id.as_str()).collect();
        assert_eq!(ids, vec!["tsk-low-num", "tsk-high-num", "tsk-no-priority"]);
    }

    /// tsk-64z D1/D7: each status literal lands in exactly the tab its
    /// bucket describes — `blocked`/`awaiting-human` share `DOING` with
    /// plain `doing` (same `in-progress` grouping the coding domain
    /// already uses), and `wontfix` shares `DONE` with the tail chain
    /// (D7).
    #[test]
    fn tabs_classify_status_into_backlog_todo_doing_review_done() {
        let source = FakeSource {
            triage: vec![
                triage_row("tsk-backlog", "backlog", Some(0)),
                triage_row("tsk-todo", "todo", Some(1)),
                triage_row("tsk-doing", "doing", Some(2)),
                triage_row("tsk-blocked", "blocked", Some(3)),
                triage_row("tsk-awaiting-human", "awaiting-human", Some(4)),
                triage_row("tsk-review", "awaiting-approval", Some(5)),
                triage_row("tsk-delivered", "delivered", Some(6)),
                triage_row("tsk-wontfix", "wontfix", Some(7)),
            ],
        };
        let mut app = App::empty();
        app.refresh_from_fgos(&source);

        app.active_tab = WorkTab::Backlog;
        assert_eq!(
            app.visible_work_items().iter().map(|i| i.id.as_str()).collect::<Vec<_>>(),
            vec!["tsk-backlog"],
            "D3: backlog gets its own tab and appears in no other"
        );

        app.active_tab = WorkTab::Todo;
        assert_eq!(
            app.visible_work_items().iter().map(|i| i.id.as_str()).collect::<Vec<_>>(),
            vec!["tsk-todo"],
            "D3: a backlog item must never be read as ready"
        );

        app.active_tab = WorkTab::Doing;
        let doing_ids: Vec<&str> = app.visible_work_items().iter().map(|i| i.id.as_str()).collect();
        assert_eq!(doing_ids.len(), 3);
        assert!(doing_ids.contains(&"tsk-doing"));
        assert!(doing_ids.contains(&"tsk-blocked"));
        assert!(doing_ids.contains(&"tsk-awaiting-human"));

        app.active_tab = WorkTab::Review;
        assert_eq!(
            app.visible_work_items().iter().map(|i| i.id.as_str()).collect::<Vec<_>>(),
            vec!["tsk-review"]
        );

        app.active_tab = WorkTab::Done;
        let done_ids: Vec<&str> = app.visible_work_items().iter().map(|i| i.id.as_str()).collect();
        assert_eq!(done_ids.len(), 2);
        assert!(done_ids.contains(&"tsk-delivered"));
        assert!(done_ids.contains(&"tsk-wontfix"), "D7: wontfix folds into DONE");
    }

    /// tsk-64z D1: cycling tabs resets selection to the new tab's first
    /// row instead of keeping a numeric index that would now point at a
    /// different item.
    #[test]
    fn next_tab_and_prev_tab_cycle_and_reset_selection() {
        let mut app = App::empty();
        assert_eq!(
            app.active_tab,
            WorkTab::Todo,
            "BACKLOG leads the strip but TODO stays the landing tab"
        );
        app.next_tab();
        assert_eq!(app.active_tab, WorkTab::Doing);
        app.next_tab();
        app.next_tab();
        assert_eq!(app.active_tab, WorkTab::Done);
        app.next_tab();
        assert_eq!(app.active_tab, WorkTab::Backlog, "wraps around after DONE");
        app.prev_tab();
        assert_eq!(app.active_tab, WorkTab::Done, "wraps around backward before BACKLOG");
    }

    /// tsk-3wl D1: `switch_panel` (Tab) must reach all 5 boxes, not just
    /// WorkItems/InProcess — in the same top-to-bottom, left-to-right
    /// spatial order the layout renders in (`ui.rs`'s `columns`/
    /// `right_column` split).
    #[test]
    fn focus_cycle_visits_all_five_panels_in_spatial_order_and_wraps() {
        let mut app = App::empty();
        assert_eq!(app.focused_panel, Panel::WorkItems);
        app.switch_panel();
        assert_eq!(app.focused_panel, Panel::InProcess);
        app.switch_panel();
        assert_eq!(app.focused_panel, Panel::NeedAnswer);
        app.switch_panel();
        assert_eq!(app.focused_panel, Panel::MergeList);
        app.switch_panel();
        assert_eq!(app.focused_panel, Panel::AfterDeliver);
        app.switch_panel();
        assert_eq!(app.focused_panel, Panel::WorkItems, "wraps around after AfterDeliver");
    }

    /// tsk-3wl D1: Shift+Tab (`switch_panel_prev`) is the exact reverse of
    /// `switch_panel` — including the wrap at the other end.
    #[test]
    fn focus_cycle_shift_tab_reverses_the_forward_cycle() {
        let mut app = App::empty();
        assert_eq!(app.focused_panel, Panel::WorkItems);
        app.switch_panel_prev();
        assert_eq!(app.focused_panel, Panel::AfterDeliver, "wraps backward before WorkItems");
        app.switch_panel_prev();
        assert_eq!(app.focused_panel, Panel::MergeList);
        app.switch_panel_prev();
        assert_eq!(app.focused_panel, Panel::NeedAnswer);
        app.switch_panel_prev();
        assert_eq!(app.focused_panel, Panel::InProcess);
        app.switch_panel_prev();
        assert_eq!(app.focused_panel, Panel::WorkItems);
    }

    /// tsk-3wl D1: NeedAnswer/MergeList/AfterDeliver have no row-select —
    /// scroll offset moves by one line per Up/Down, clamped at both ends
    /// (never negative via `saturating_sub`, never past the last row).
    #[test]
    fn focus_cycle_scroll_boxes_clamp_at_both_ends() {
        let mut app = App::empty();
        app.need_answer = vec![
            NeedAnswerTask { id: "a".into(), title: "A".into(), status: "blocked".into() },
            NeedAnswerTask { id: "b".into(), title: "B".into(), status: "awaiting-human".into() },
        ];
        assert_eq!(app.need_answer_scroll, 0);
        app.scroll_need_answer_up();
        assert_eq!(app.need_answer_scroll, 0, "never goes negative");
        app.scroll_need_answer_down();
        assert_eq!(app.need_answer_scroll, 1);
        app.scroll_need_answer_down();
        assert_eq!(app.need_answer_scroll, 1, "clamped at len - 1");
        app.scroll_need_answer_up();
        assert_eq!(app.need_answer_scroll, 0);
    }

    /// tsk-64z D8: filter matches id OR title, case-insensitively, and
    /// only within the active tab — never across it.
    #[test]
    fn filter_query_matches_id_or_title_case_insensitively() {
        let source = FakeSource {
            triage: vec![
                triage_row("tsk-alpha", "todo", Some(1)),
                triage_row("tsk-beta", "todo", Some(2)),
            ],
        };
        let mut app = App::empty();
        app.refresh_from_fgos(&source);
        app.filter_query = "ALPHA".into();
        let ids: Vec<&str> = app.visible_work_items().iter().map(|i| i.id.as_str()).collect();
        assert_eq!(ids, vec!["tsk-alpha"]);
    }

    /// tsk-64z D8: Esc (`filter_cancel`) clears the query; Enter
    /// (`filter_submit`) leaves input mode but keeps it applied.
    #[test]
    fn filter_cancel_clears_query_filter_submit_keeps_it() {
        let mut app = App::empty();
        app.activate_filter();
        app.filter_push_char('x');
        app.filter_submit();
        assert!(!app.filter_input_active);
        assert_eq!(app.filter_query, "x");

        app.activate_filter();
        app.filter_backspace();
        app.filter_cancel();
        assert!(!app.filter_input_active);
        assert_eq!(app.filter_query, "");
    }

    struct FakeRegistry(HashMap<String, PaneIdentity>);

    impl PaneRegistry for FakeRegistry {
        fn scan_panes(&self) -> Result<Vec<PaneSnapshot>, crate::pane_scan::PaneScanError> {
            Ok(self
                .0
                .iter()
                .map(|(task_id, identity)| PaneSnapshot {
                    pane_id: identity.pane_id.clone(),
                    tab_id: identity.tab_id.clone(),
                    label: Some(task_id.clone()),
                    focused: false,
                })
                .collect())
        }

        fn has_labeled_pane(&self, _label: &str) -> Result<bool, crate::pane_scan::PaneScanError> {
            Ok(false)
        }
    }

    #[test]
    fn pane_registry_refresh_pane_state_maps_found_and_orphaned_tasks() {
        let mut app = App::empty();
        app.in_process = vec![
            InProcessTask {
                id: "tsk-a".into(),
                title: "A".into(),
                pane: None,
            },
            InProcessTask {
                id: "tsk-b".into(),
                title: "B".into(),
                pane: None,
            },
        ];
        let mut found = HashMap::new();
        found.insert(
            "tsk-a".to_string(),
            PaneIdentity {
                pane_id: "wS:p1".into(),
                tab_id: "wS:t1".into(),
            },
        );
        let registry = FakeRegistry(found);

        app.refresh_pane_state(&registry);

        assert_eq!(
            app.in_process[0].pane,
            Some(PaneIdentity {
                pane_id: "wS:p1".into(),
                tab_id: "wS:t1".into(),
            })
        );
        assert_eq!(app.in_process[1].pane, None);
    }

    struct FixedLabelRegistry(Vec<PaneSnapshot>);

    impl PaneRegistry for FixedLabelRegistry {
        fn scan_panes(&self) -> Result<Vec<PaneSnapshot>, crate::pane_scan::PaneScanError> {
            Ok(self.0.clone())
        }

        fn has_labeled_pane(&self, _label: &str) -> Result<bool, crate::pane_scan::PaneScanError> {
            Ok(false)
        }
    }

    /// tsk-3q8z defect 1: a REUSED pane still carries the previous
    /// occupant's label the instant it is scanned, before the new worker
    /// boots. That stale label's task id is no longer `doing` (the old
    /// item already moved on), so the pane must stay pending — retiring it
    /// here is exactly the bug that let herdr stack a second launch on top.
    #[test]
    fn retire_settled_pending_panes_keeps_a_reused_panes_stale_label_pending() {
        let mut app = App::empty();
        app.pending_worker_panes.insert("wS:pReused".to_string());
        // No item is `doing` -- the old occupant already returned.
        let registry = FixedLabelRegistry(vec![PaneSnapshot {
            pane_id: "wS:pReused".into(),
            tab_id: "wS:t1".into(),
            label: Some("tsk-old-occupant".into()),
            focused: false,
        }]);

        app.refresh_pane_state(&registry);

        assert!(
            app.pending_pane_ids().contains(&"wS:pReused".to_string()),
            "a pane labeled with a non-doing id must stay pending, not retire"
        );
    }

    /// The fresh-claim case: once the label's task id IS `doing`, the pane
    /// has genuinely settled and retires.
    #[test]
    fn retire_settled_pending_panes_drops_a_pane_once_its_label_is_doing() {
        let mut app = App::empty();
        app.pending_worker_panes.insert("wS:pNew".to_string());
        app.refresh_from_fgos(&FakeSource {
            triage: vec![triage_row("tsk-new-claim", "doing", Some(1))],
        });
        let registry = FixedLabelRegistry(vec![PaneSnapshot {
            pane_id: "wS:pNew".into(),
            tab_id: "wS:t1".into(),
            label: Some("tsk-new-claim".into()),
            focused: false,
        }]);

        app.refresh_pane_state(&registry);

        assert!(
            !app.pending_pane_ids().contains(&"wS:pNew".to_string()),
            "a pane labeled with a doing id has genuinely settled and must retire"
        );
    }

    /// A pane that vanished from the scan entirely (closed) still retires,
    /// same as before this fix.
    #[test]
    fn retire_settled_pending_panes_drops_a_pane_that_vanished_from_the_scan() {
        let mut app = App::empty();
        app.pending_worker_panes.insert("wS:pGone".to_string());
        let registry = FixedLabelRegistry(vec![]);

        app.refresh_pane_state(&registry);

        assert!(!app.pending_pane_ids().contains(&"wS:pGone".to_string()));
    }

    /// tsk-3q8z defect 2: `pending_discover_pane` settles by the same rule
    /// as `pending_worker_panes` -- once the pane id it names is no longer
    /// tracked there (gone from the scan, or its label resolved to a real
    /// `doing` claim), it clears too.
    #[test]
    fn retire_settled_pending_discover_pane_clears_once_the_shared_pane_settles() {
        let mut app = App::empty();
        app.pending_worker_panes.insert("wS:pDiscover".to_string());
        app.pending_discover_pane = Some("wS:pDiscover".to_string());
        // The pane vanished from the scan -- retire_settled_pending_panes
        // drops it from pending_worker_panes, and the discover-specific
        // field must follow.
        let registry = FixedLabelRegistry(vec![]);

        app.refresh_pane_state(&registry);

        assert_eq!(app.pending_discover_pane, None);
    }

    /// While the shared pane is still genuinely pending, the discover-
    /// specific field must not clear early.
    #[test]
    fn retire_settled_pending_discover_pane_stays_set_while_the_shared_pane_is_still_pending() {
        let mut app = App::empty();
        app.pending_worker_panes.insert("wS:pDiscover".to_string());
        app.pending_discover_pane = Some("wS:pDiscover".to_string());
        let registry = FixedLabelRegistry(vec![PaneSnapshot {
            pane_id: "wS:pDiscover".into(),
            tab_id: "wS:t1".into(),
            label: Some("fgos-auto-discover-tsk-2ja".into()),
            focused: false,
        }]);

        app.refresh_pane_state(&registry);

        assert_eq!(
            app.pending_discover_pane,
            Some("wS:pDiscover".to_string()),
            "the synthetic auto-discover label never maps to a real task id, so it never appears \
             in doing_item_ids() -- the pane must stay pending until the real launched session claims"
        );
    }
}
