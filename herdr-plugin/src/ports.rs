use std::collections::HashMap;
use std::io;
use std::time::Duration;

use crate::app::App;
use crate::fgos::{AfterDeliverRow, DoingRow, FgosError, MergeListSummary, NeedAnswerRow, TriageRow};
use crate::pane_scan::{PaneIdentity, PaneScanError};

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
/// workspace and maps task-id to pane identity. The domain never shells
/// out to `herdr` itself — only through this port.
pub trait PaneRegistry {
    fn scan(&self) -> Result<HashMap<String, PaneIdentity>, PaneScanError>;
}

/// (b1) herdr pane-orchestration seam (tsk-3t9 D1) — swappable
/// independently of the render seam below.
pub trait PaneOrchestrator {
    fn open_pick_pane(&self, id: &str) -> io::Result<()>;
    /// Opens a new agent pane running `/fgOS:discover <id>` (tsk-1e3 D4) —
    /// same shape as `open_pick_pane`, different slash command.
    fn open_discover_pane(&self, id: &str) -> io::Result<()>;
    /// Switches herdr's focus directly to an already-running pane
    /// (tsk-1eu D2), never opening a new one.
    fn focus_pane(&self, pane_id: &str) -> io::Result<()>;
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
