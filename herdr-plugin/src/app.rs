use crate::ports::WorkItemSource;

pub struct WorkItem {
    pub id: String,
    pub title: String,
    pub goal_tier: String,
}

/// D4: an fgOS item with `status: doing` — always "doing" by definition, so
/// no separate status field is carried here.
pub struct InProcessTask {
    pub id: String,
    pub title: String,
}

pub struct App {
    pub work_items: Vec<WorkItem>,
    pub in_process: Vec<InProcessTask>,
    pub last_error: Option<String>,
    /// Plain row index — no ratatui type in the domain (D2). The render
    /// adapter (`ui.rs`) converts this to its own widget state at draw
    /// time.
    pub selected: Option<usize>,
    /// Set right after a pick pane is opened, cleared on the next
    /// keypress — a one-line status confirmation, never a blocking modal.
    pub pick_status: Option<String>,
}

impl App {
    pub fn empty() -> Self {
        Self {
            work_items: Vec::new(),
            in_process: Vec::new(),
            last_error: None,
            selected: None,
            pick_status: None,
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
            }],
            last_error: None,
            selected: None,
            pick_status: None,
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
                    })
                    .collect();
                self.last_error = None;
            }
            Err(err) => self.last_error = Some(err.to_string()),
        }
    }
}
