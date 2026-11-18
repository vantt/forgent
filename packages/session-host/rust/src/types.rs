//! The request and answer types of the contract `session-host/host-port.v1.json`.

use fgos_terminal_control::port::{ProcessIdentity, Slot};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HostKind {
    Terminal,
}

/// Where a session runs. `display` is written to the screen only, never read back.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Placement {
    pub host: HostKind,
    pub key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub display: Option<Value>,
}

/// Allocate the slot of a terminal placement without starting anything in it: what a controller that
/// builds its command only afterwards (the run supervisor's gate) needs before it can `launch`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OpenRequest {
    pub host: HostKind,
    pub key: String,
    #[serde(default)]
    pub group_key: Option<String>,
    #[serde(default)]
    pub beside: Option<String>,
    /// How many panes the caller's batch opens in all, when it knows; sizes the batch's panes equally.
    #[serde(default)]
    pub group_size: Option<u32>,
    pub cwd: String,
    #[serde(default)]
    pub env: BTreeMap<String, String>,
    #[serde(default)]
    pub display: Option<Value>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RefusalKind {
    Unsupported,
    Unknown,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum RefusalCode {
    HostUnsupportedHere,
    PlacementUnknown,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Refusal {
    pub result: RefusalKind,
    pub code: RefusalCode,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    /// The Terminal Control capability the driver lacks, when an `unsupported` answer comes from there.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub capability: Option<String>,
}

impl Refusal {
    pub fn unsupported(code: RefusalCode, detail: impl Into<String>) -> Self {
        Refusal {
            result: RefusalKind::Unsupported,
            code,
            detail: Some(detail.into()),
            capability: None,
        }
    }

    pub fn unknown(code: RefusalCode, detail: impl Into<String>) -> Self {
        Refusal {
            result: RefusalKind::Unknown,
            code,
            detail: Some(detail.into()),
            capability: None,
        }
    }
}

/// What `open` answers: the placement, and its slot: the one this call allocated, or the one a live key's
/// pane already holds (absent only when that slot could not be read back).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum OpenAnswer {
    Opened {
        placement: Placement,
        slot: Option<Slot>,
    },
    Refused(Refusal),
}

/// What `launch` answers: the launched process root, or that nothing was proven to run (the slot is
/// then kept and never launched into again), or a refusal.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LaunchAnswer {
    Launched(ProcessIdentity),
    NotStarted { reason: String },
    Refused(Refusal),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Liveness {
    Live,
    Gone,
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AliveAnswer {
    pub result: Liveness,
    pub detail: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FrontAnswer {
    Fronted,
    Refused(Refusal),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Retirement {
    Close,
    Retain,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RetireAnswer {
    Retired,
    Refused(Refusal),
}

/// A key as the contract shapes it: `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`.
pub fn valid_key(key: &str) -> bool {
    let bytes = key.as_bytes();
    !bytes.is_empty()
        && bytes.len() <= 128
        && bytes[0].is_ascii_alphanumeric()
        && bytes
            .iter()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'.' | b'_' | b'-'))
}
