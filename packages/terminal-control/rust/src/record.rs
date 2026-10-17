//! The allocation record, its one-shot markers and the group hint
//! (`allocation-record.v1.json`). A record is never edited; state changes are
//! new markers.

use crate::port::{Disposition, Display, Origin, ProcessIdentity, ServerIncarnation};
use serde::{Deserialize, Serialize};

pub const VERSION: u32 = 1;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AllocationRecord {
    pub v: u32,
    pub key: String,
    pub group_key: String,
    pub driver: String,
    pub server_incarnation: ServerIncarnation,
    pub tab_id: String,
    pub pane_id: String,
    pub allocated_at: u64,
    pub display: Display,
    pub origin: Origin,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MarkerKind {
    LaunchRequested,
    Launched,
    Released,
}

impl MarkerKind {
    pub const ALL: [MarkerKind; 3] = [MarkerKind::LaunchRequested, MarkerKind::Launched, MarkerKind::Released];

    /// File-name part: `<key>.<suffix>.json`.
    pub fn suffix(self) -> &'static str {
        match self {
            MarkerKind::LaunchRequested => "launch-requested",
            MarkerKind::Launched => "launched",
            MarkerKind::Released => "released",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct LaunchRequestedMarker {
    pub v: u32,
    pub key: String,
    pub at: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct LaunchedMarker {
    pub v: u32,
    pub key: String,
    pub at: u64,
    pub identity: ProcessIdentity,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ReleaseMarkerOutcome {
    Closed,
    Retained,
    KeptUnknown,
    Unlinked,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ReleasedMarker {
    pub v: u32,
    pub key: String,
    pub at: u64,
    pub disposition: Disposition,
    /// Retain only: epoch ms, or `null` for kept until a person closes it.
    pub until: Option<u64>,
    pub outcome: ReleaseMarkerOutcome,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupHint {
    pub v: u32,
    pub group_key: String,
    pub tab_id: String,
    pub updated_at: u64,
}
