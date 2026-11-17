//! The request and answer types of the contract `session-host/host-port.v1.json`.

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HostKind {
    Terminal,
    Direct,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    #[default]
    Worker,
    Head,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Delivery {
    Typed,
    Argument,
    File,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Opening {
    pub text: String,
    pub delivery: Delivery,
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

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StartRequest {
    pub host: HostKind,
    pub key: String,
    #[serde(default)]
    pub group_key: Option<String>,
    #[serde(default)]
    pub beside: Option<String>,
    pub cwd: String,
    #[serde(default)]
    pub env: BTreeMap<String, String>,
    pub command: String,
    #[serde(default)]
    pub args: Vec<String>,
    #[serde(default)]
    pub opening: Option<Opening>,
    #[serde(default)]
    pub display: Option<Value>,
    #[serde(default)]
    pub role: Role,
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
    HeadNeedsInteractiveHost,
    HostUnsupportedHere,
    OpeningDeliveryUnsupported,
    PaneNotReady,
    PlacementUnknown,
    KeyInUse,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Refusal {
    pub result: RefusalKind,
    pub code: RefusalCode,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

impl Refusal {
    pub fn unsupported(code: RefusalCode, detail: impl Into<String>) -> Self {
        Refusal {
            result: RefusalKind::Unsupported,
            code,
            detail: Some(detail.into()),
        }
    }

    pub fn unknown(code: RefusalCode, detail: impl Into<String>) -> Self {
        Refusal {
            result: RefusalKind::Unknown,
            code,
            detail: Some(detail.into()),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StartAnswer {
    Placed(Placement),
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

pub(crate) fn object(value: Value) -> Map<String, Value> {
    match value {
        Value::Object(map) => map,
        _ => Map::new(),
    }
}
