//! The key-addressed upper port (`terminal-control.port.v1.json`).
//!
//! Every operation can answer `Unsupported` and `Unknown`; the core never
//! guesses and never turns `Unknown` into gone or closed.

use crate::driver::AgentFacts;
use serde::{Deserialize, Serialize};

/// Display data written to the terminal and the record; never read back to
/// decide anything.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Display {
    pub label: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub agent: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
}

/// Identity of a process root: what `launch` returns and `inspect` reports.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessIdentity {
    pub pid: u32,
    pub start_time: String,
    pub boot_id: String,
    pub pgid: u32,
}

/// Identity of the multiplexer server the records belong to.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerIncarnation {
    pub host: String,
    pub boot_id: String,
    pub pid_ns: String,
    pub pid: u32,
    pub start_time: String,
    pub endpoint: String,
}

impl ServerIncarnation {
    /// Directory name of this incarnation under `<stateRoot>/terminal/<driver>/`.
    pub fn id(&self) -> String {
        format!("{}-{}-{}", self.boot_id, self.pid, self.start_time)
    }
}

/// A pane the core handed out for a key.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Slot {
    pub tab_id: String,
    pub pane_id: String,
}

/// Why an operation could not answer for sure.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "result", rename_all = "kebab-case")]
pub enum Refusal {
    /// The driver lacks a capability (or the multiplexer is absent).
    Unsupported { capability: String, detail: String },
    /// Driver timeout, unreadable output, incarnation mismatch, missing record.
    Unknown { reason: String },
}

impl std::fmt::Display for Refusal {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Refusal::Unsupported { capability, detail } => write!(f, "{capability} unsupported: {detail}"),
            Refusal::Unknown { reason } => f.write_str(reason),
        }
    }
}

/// Where a slot came from; the core only ever closes `Allocated` ones.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Origin {
    Allocated,
    Attached,
}

/// A slot handed out by `allocate` or `attach`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Allocation {
    pub slot: Slot,
    pub origin: Origin,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AllocateRequest {
    pub key: String,
    pub group_key: String,
    pub display: Display,
    /// How many panes the caller's batch opens in all, when it knows; the
    /// placement policy uses it to size the batch's panes equally.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub group_size: Option<u32>,
    /// Working directory of the new pane's shell.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cwd: Option<String>,
    /// Environment of the new pane's shell.
    #[serde(default, skip_serializing_if = "std::collections::BTreeMap::is_empty")]
    pub env: std::collections::BTreeMap<String, String>,
}

/// The foreground process a launch is expected to become, when it is not the
/// launched command itself (a launcher script that `exec -a`s the real one).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ExpectedProcess {
    pub argv0: String,
    pub command: String,
    #[serde(default)]
    pub args: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct LaunchSpec {
    pub command: String,
    #[serde(default)]
    pub args: Vec<String>,
    pub cwd: String,
    #[serde(default)]
    pub env: std::collections::BTreeMap<String, String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expect: Option<ExpectedProcess>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LaunchOutcome {
    Launched(ProcessIdentity),
    /// Nothing was proven to run. The `launch-requested` marker stays, so the
    /// slot is kept and never launched into again.
    NotStarted { reason: String },
}

/// What `send` did with the input.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SendOutcome {
    Sent,
    /// Nothing was typed: the pane's foreground is its shell, or no program
    /// could be identified there. A shell would run the text as commands.
    ForegroundNotAgent { reason: String },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Disposition {
    Close,
    Retain,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReleaseOutcome {
    Released { disposition: Disposition },
    /// The core could not prove it may close the pane, so it kept it.
    KeptUnknown { reason: String },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PaneState {
    Live,
    Gone,
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Inspection {
    pub pane: PaneState,
    pub foreground: Option<ProcessIdentity>,
    pub activity: Option<crate::driver::Activity>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CapabilitiesReport {
    pub driver: String,
    pub capabilities: Vec<String>,
    pub server_incarnation: Option<ServerIncarnation>,
    pub anchor_pane: AnchorPane,
    /// The socket the driver talks to; `None` when it cannot be named.
    pub socket_path: Option<String>,
    /// Present only when the caller asked for it.
    pub agents: Option<AgentFacts>,
}

/// What a `capabilities` caller asks beyond the always-given answer.
#[derive(Debug, Clone, Copy, Default)]
pub struct CapabilitiesAsk<'a> {
    /// The pane the caller named as its anchor.
    pub anchor_pane: Option<&'a str>,
    /// Also read the agent kinds and integration hooks (two more driver reads).
    pub agents: bool,
}

/// Whether the pane a caller named as its anchor can be resolved by the driver.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "state", rename_all = "lowercase")]
pub enum AnchorPane {
    /// The caller named none.
    Absent,
    Resolved,
    Unresolvable { reason: String },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FindingKind {
    #[serde(rename = "allocated-not-launched-bare-shell")]
    AllocatedNotLaunchedBareShell,
    #[serde(rename = "retain-expired")]
    RetainExpired,
    #[serde(rename = "stale-incarnation")]
    StaleIncarnation,
    #[serde(rename = "unknown")]
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Finding {
    pub key: String,
    /// The pane the finding is about, so a person can find it; `None` when no record names one.
    pub pane_id: Option<String>,
    pub kind: FindingKind,
    pub detail: String,
}
