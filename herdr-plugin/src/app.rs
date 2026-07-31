use crate::pane_scan::PaneIdentity;
use crate::ports::{PaneRegistry, WorkItemSource};

pub struct WorkItem {
    pub id: String,
    pub title: String,
    pub goal_tier: String,
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
        }
    }

    pub fn select_next(&mut self) {
        if self.work_items.is_empty() {
            return;
        }
        let next = match self.selected {
            Some(i) => (i + 1) % self.work_items.len(),
            None => 0,
        };
        self.selected = Some(next);
    }

    pub fn select_previous(&mut self) {
        if self.work_items.is_empty() {
            return;
        }
        let prev = match self.selected {
            Some(0) | None => self.work_items.len() - 1,
            Some(i) => i - 1,
        };
        self.selected = Some(prev);
    }

    pub fn selected_id(&self) -> Option<&str> {
        self.selected
            .and_then(|i| self.work_items.get(i))
            .map(|item| item.id.as_str())
    }

    /// Full row for the currently selected work item — the detail modal
    /// needs the title and goal tier, not just the id `selected_id` gives.
    pub fn selected_work_item(&self) -> Option<&WorkItem> {
        self.selected.and_then(|i| self.work_items.get(i))
    }

    /// A live poll can shrink or grow `work_items`; keep the cursor inside
    /// bounds rather than pointing at a row that no longer exists.
    fn clamp_selection(&mut self) {
        if self.work_items.is_empty() {
            self.selected = None;
        } else if let Some(i) = self.selected {
            if i >= self.work_items.len() {
                self.selected = Some(self.work_items.len() - 1);
            }
        } else {
            self.selected = Some(0);
        }
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
                },
                WorkItem {
                    id: "tsk-19y-2".into(),
                    title: "Wire real fgOS data into the dashboard".into(),
                    goal_tier: "mvp".into(),
                },
                WorkItem {
                    id: "tsk-19y-3".into(),
                    title: "Pick orchestration action".into(),
                    goal_tier: "milestone".into(),
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
                self.work_items = rows
                    .into_iter()
                    .map(|row| WorkItem {
                        id: row.id,
                        title: row.title,
                        goal_tier: row.goal_tier.unwrap_or_else(|| "none".into()),
                    })
                    .collect();
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
    use std::collections::HashMap;

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
