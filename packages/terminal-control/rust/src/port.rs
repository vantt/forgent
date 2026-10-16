//! The key-addressed upper port (`terminal-control.port.v1.json`).
//!
//! Every operation can answer `Unsupported` and `Unknown`; the core never
//! guesses and never turns `Unknown` into gone or closed.

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
