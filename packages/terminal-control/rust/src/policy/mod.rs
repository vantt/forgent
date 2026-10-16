//! Pluggable placement policy (`placement-policy.v1.json`): a pure,
//! deterministic function from measured geometry to a placement decision.
//! It never changes ownership or lifecycle and never closes a pane.

use crate::driver::{Direction, Rect, TabGeometry};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupPane {
    pub key: String,
    pub tab_id: String,
    pub pane_id: String,
    pub rect: Rect,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub role_hint: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Limits {
    pub min_cols: u32,
    pub min_rows: u32,
    pub max_panes_per_tab: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaceRequest {
    pub label: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub role_hint: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaceInput {
    pub group_key: String,
    pub tabs: Vec<TabGeometry>,
    pub group_panes: Vec<GroupPane>,
    pub request: PlaceRequest,
    pub limits: Limits,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Placement {
    Split {
        anchor_key: String,
        direction: Direction,
        ratio: f64,
    },
    NewTab {},
    Unsupported {
        reason: String,
    },
}

/// A placement policy, chosen by `terminal.layout.policy`.
pub trait PlacementPolicy {
    fn name(&self) -> &'static str;
    fn place(&self, input: &PlaceInput) -> Placement;
}
