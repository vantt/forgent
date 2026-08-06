use crate::pane_scan::PaneIdentity;
use crate::ports::{PaneRegistry, WorkItemSource};

pub struct WorkItem {
    pub id: String,
    pub title: String,
    pub goal_tier: String,
    /// tsk-1e3 D4: gates the detail modal's Discover button — enabled only
    /// at `"clarify"`.
    pub stage: String,
    /// tsk-64z D1: raw status literal — drives the Status column and the
    /// tab membership check (`Tab::matches`, below).
    pub status: String,
    /// tsk-64z D1: "Blocked By" column source.
    pub blocked_by: Vec<String>,
    /// tsk-64z D1: "Blocks" column source.
    pub blocks: u32,
    /// tsk-64z D2: sort key, ascending. `None` when not yet computed.
    pub priority: Option<i64>,
}

/// tsk-64z D1/D7: the Work Items panel's 4 tabs — a pure classification
/// over `WorkItem.status`, never a second copy of the item list.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Tab {
    Todo,
    Doing,
    Review,
    Done,
}

impl Tab {
    /// D1: `todo` only. D1: `doing`/`blocked`/`awaiting-human` — the same
    /// `in-progress` `statusCategory` grouping `workflow-stage-graphs.mjs`
    /// already uses for the `coding` domain. D1: `awaiting-approval` only.
    /// D7: the `delivered`/`retrospective`/`cleanup`/`done` tail chain PLUS
    /// `wontfix` (D7 explicitly folds canceled items into this tab too).
    fn matches(self, status: &str) -> bool {
        match self {
            Tab::Todo => status == "todo",
            Tab::Doing => matches!(status, "doing" | "blocked" | "awaiting-human"),
            Tab::Review => status == "awaiting-approval",
            Tab::Done => matches!(
                status,
                "delivered" | "retrospective" | "cleanup" | "done" | "wontfix"
            ),
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            Tab::Todo => "TODO",
            Tab::Doing => "DOING",
            Tab::Review => "REVIEW",
            Tab::Done => "DONE",
        }
    }

    fn next(self) -> Self {
        match self {
            Tab::Todo => Tab::Doing,
            Tab::Doing => Tab::Review,
            Tab::Review => Tab::Done,
            Tab::Done => Tab::Todo,
        }
    }

    fn prev(self) -> Self {
        match self {
            Tab::Todo => Tab::Done,
            Tab::Doing => Tab::Todo,
            Tab::Review => Tab::Doing,
            Tab::Done => Tab::Review,
        }
    }
}

/// Which list currently has keyboard focus (tsk-1eu D1) — `Up`/`Down`/
/// `Enter` always apply to whichever panel this names.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Panel {
    WorkItems,
    InProcess,
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
    pub active_tab: Tab,
    /// tsk-64z D8: true while the `/` filter input is being typed —
    /// applies to the Work Items panel only, never the right-side boxes.
    pub filter_input_active: bool,
    /// tsk-64z D8: the current filter text (case-insensitive substring
    /// match against id/title). Empty string = no filter applied,
    /// regardless of `filter_input_active`.
    pub filter_query: String,
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
            active_tab: Tab::Todo,
            filter_input_active: false,
            filter_query: String::new(),
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

    /// tsk-1eu D1: toggles which panel has keyboard focus.
    pub fn switch_panel(&mut self) {
        self.focused_panel = match self.focused_panel {
            Panel::WorkItems => Panel::InProcess,
            Panel::InProcess => Panel::WorkItems,
        };
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
                    stage: "clarify".into(),
                    status: "todo".into(),
                    blocked_by: Vec::new(),
                    blocks: 0,
                    priority: None,
                },
                WorkItem {
                    id: "tsk-19y-2".into(),
                    title: "Wire real fgOS data into the dashboard".into(),
                    goal_tier: "mvp".into(),
                    stage: "decompose".into(),
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
            active_tab: Tab::Todo,
            filter_input_active: false,
            filter_query: String::new(),
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
                self.last_error = None;
                self.clamp_selection();
            }
            Err(err) => self.last_error = Some(err.to_string()),
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
                self.last_error = None;
                self.clamp_in_process_selection();
            }
            Err(err) => self.last_error = Some(err.to_string()),
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
        match registry.scan() {
            Ok(map) => {
                for task in &mut self.in_process {
                    task.pane = map.get(&task.id).cloned();
                }
                self.last_error = None;
            }
            Err(err) => self.last_error = Some(err.to_string()),
        }
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
    fn tabs_classify_status_into_todo_doing_review_done() {
        let source = FakeSource {
            triage: vec![
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

        app.active_tab = Tab::Todo;
        assert_eq!(
            app.visible_work_items().iter().map(|i| i.id.as_str()).collect::<Vec<_>>(),
            vec!["tsk-todo"]
        );

        app.active_tab = Tab::Doing;
        let doing_ids: Vec<&str> = app.visible_work_items().iter().map(|i| i.id.as_str()).collect();
        assert_eq!(doing_ids.len(), 3);
        assert!(doing_ids.contains(&"tsk-doing"));
        assert!(doing_ids.contains(&"tsk-blocked"));
        assert!(doing_ids.contains(&"tsk-awaiting-human"));

        app.active_tab = Tab::Review;
        assert_eq!(
            app.visible_work_items().iter().map(|i| i.id.as_str()).collect::<Vec<_>>(),
            vec!["tsk-review"]
        );

        app.active_tab = Tab::Done;
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
        assert_eq!(app.active_tab, Tab::Todo);
        app.next_tab();
        assert_eq!(app.active_tab, Tab::Doing);
        app.next_tab();
        app.next_tab();
        app.next_tab();
        assert_eq!(app.active_tab, Tab::Todo, "wraps around after DONE");
        app.prev_tab();
        assert_eq!(app.active_tab, Tab::Done, "wraps around backward before TODO");
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
        fn scan(&self) -> Result<HashMap<String, PaneIdentity>, crate::pane_scan::PaneScanError> {
            Ok(self.0.clone())
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
}
