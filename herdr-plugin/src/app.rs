pub struct WorkItem {
    pub id: String,
    pub title: String,
    pub goal_tier: String,
}

pub struct InProcessTask {
    pub id: String,
    pub title: String,
    pub status: String,
}

pub struct App {
    pub work_items: Vec<WorkItem>,
    pub in_process: Vec<InProcessTask>,
}

impl App {
    /// Fake/hardcoded rows only — D6 defers real fgOS-CLI polling to a later item.
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
                id: "tsk-19y-1".into(),
                title: "Herdr plugin scaffold + mock/static dashboard TUI".into(),
                status: "doing".into(),
            }],
        }
    }
}
