//! Lower port: multiplexer drivers that declare their capabilities
//! (`driver-capabilities.v1.json`). A driver error is `Unknown`, never
//! closed or gone.

pub mod herdr;

use crate::port::{Refusal, ServerIncarnation};
use serde::{Deserialize, Serialize};

/// Capability names, exactly as `driver-capabilities.v1.json` spells them.
pub const CAPABILITIES: [&str; 12] = [
    "tab.create",
    "pane.split",
    "pane.close",
    "pane.run",
    "send.text",
    "send.keys",
    "read.screen",
    "process.info",
    "activity.state",
    "label",
    "layout.geometry",
    "server.incarnation",
];

/// A rectangle in terminal cells.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Rect {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

/// Real size of a pane's pty when the driver can read it. The layout rect a
/// multiplexer reports can differ from the pty (measured on herdr with two
/// clients attached), so re-measuring prefers this when present.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct PtySize {
    pub cols: u32,
    pub rows: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaneGeometry {
    pub pane_id: String,
    pub rect: Rect,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pty: Option<PtySize>,
}

/// Measured geometry of one tab.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TabGeometry {
    pub tab_id: String,
    pub area: Rect,
    pub panes: Vec<PaneGeometry>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Direction {
    Right,
    Down,
}

/// A pane the driver created: its id and the tab it lives in.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatedPane {
    pub tab_id: String,
    pub pane_id: String,
}

/// Liveness of a pane as the driver sees it right now.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PaneLiveness {
    Live,
    Gone,
}

/// One foreground process of a pane.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ForegroundProcess {
    pub pid: u32,
    pub argv: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessInfo {
    pub shell_pid: u32,
    pub foreground_pgid: u32,
    pub foreground: Vec<ForegroundProcess>,
}

/// Agent activity of a pane, when the driver declares `activity.state`.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Activity {
    pub state: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub agent: Option<String>,
    /// Session id of the agent, when the driver knows it.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub session: Option<String>,
    /// What the driver's screen detector sees; present only when asked for.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<ActivityDetail>,
}

/// The driver's own screen detector verdict for a pane.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityDetail {
    /// Detector state; absent when it gave no verdict.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub state: Option<String>,
    pub visible_blocker: bool,
    pub visible_idle: bool,
    pub visible_working: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub matched_rule: Option<String>,
    /// Text typed in the agent's prompt box and not yet submitted.
    pub prompt_text: String,
}

/// Outcome of a close that checked the server incarnation before and after.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CloseOutcome {
    Closed,
    /// The pane was already gone before the close.
    AlreadyGone,
}

pub type DriverResult<T> = Result<T, Refusal>;

/// What every multiplexer driver provides. One method per capability; a
/// driver without a capability returns `Refusal::Unsupported` for it.
pub trait TerminalDriver {
    /// Driver name, e.g. `herdr`.
    fn name(&self) -> &'static str;
    /// Declared capabilities, a subset of `CAPABILITIES`.
    fn capabilities(&self) -> Vec<&'static str>;
    fn server_incarnation(&self) -> DriverResult<ServerIncarnation>;

    fn tab_create(&self, label: &str, cwd: Option<&str>, env: &[(String, String)]) -> DriverResult<CreatedPane>;
    /// `ratio` is the share kept by the existing pane, as herdr measures it.
    fn pane_split(
        &self,
        anchor_pane: &str,
        direction: Direction,
        ratio: f64,
        cwd: Option<&str>,
        env: &[(String, String)],
    ) -> DriverResult<CreatedPane>;
    /// Close one pane only if `expected` is still the live server incarnation
    /// right before and right after the close; otherwise `Unknown`.
    fn pane_close(&self, pane: &str, expected: &ServerIncarnation) -> DriverResult<CloseOutcome>;
    fn pane_liveness(&self, pane: &str) -> DriverResult<PaneLiveness>;
    fn pane_run(&self, pane: &str, command_line: &str) -> DriverResult<()>;
    fn send_text(&self, pane: &str, text: &str, submit: bool) -> DriverResult<()>;
    fn send_keys(&self, pane: &str, keys: &[String]) -> DriverResult<()>;
    fn read_screen(
        &self,
        pane: &str,
        lines: Option<u32>,
        source: Option<&str>,
    ) -> DriverResult<String>;
    fn process_info(&self, pane: &str) -> DriverResult<ProcessInfo>;
    fn activity(&self, pane: &str) -> DriverResult<Activity>;
    /// The driver's own detector verdict for the pane (`activity.state`).
    fn activity_detail(&self, _pane: &str) -> DriverResult<ActivityDetail> {
        Err(Refusal::Unsupported { capability: "activity.state".into(), detail: format!("driver {} gives no detector detail", self.name()) })
    }
    fn label_pane(&self, pane: &str, label: &str) -> DriverResult<()>;
    /// Geometry of the tab holding `pane`.
    fn layout_geometry(&self, pane: &str) -> DriverResult<TabGeometry>;
}
