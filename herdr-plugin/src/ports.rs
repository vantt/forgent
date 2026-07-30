use std::io;
use std::time::Duration;

use crate::app::App;
use crate::fgos::{DoingRow, FgosError, TriageRow};

/// (a) fgOS data source seam (tsk-3t9 D1) — the domain asks for rows
/// through this trait instead of importing `crate::fgos` directly.
pub trait WorkItemSource {
    fn fetch_triage(&self) -> Result<Vec<TriageRow>, FgosError>;
    fn fetch_doing(&self) -> Result<Vec<DoingRow>, FgosError>;
}

/// (b1) herdr pane-orchestration seam (tsk-3t9 D1) — swappable
/// independently of the render seam below.
pub trait PaneOrchestrator {
    fn open_pick_pane(&self, id: &str) -> io::Result<()>;
}

/// Domain-level input the render adapter translates real terminal events
/// into — the domain and `main.rs`'s event loop never see a
/// `crossterm::event::KeyCode` directly.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UiEvent {
    Up,
    Down,
    Pick,
    Quit,
}

/// (b2) TUI render-framework seam (tsk-3t9 D1) — owns the terminal's
/// lifecycle (init/teardown) and the domain-to-widget conversion (D2: the
/// adapter, not `App`, holds any ratatui-specific selection state).
pub trait TerminalUi {
    fn draw(&mut self, app: &mut App) -> io::Result<()>;
    fn poll_event(&mut self, timeout: Duration) -> io::Result<Option<UiEvent>>;
}
