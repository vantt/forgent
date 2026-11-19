//! Output shapes; field names follow `output` in the contract file.

use serde::Serialize;

/// One ordering edge: `from` waits for `to`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Edge {
    pub from: String,
    pub to: String,
    pub kind: String,
}

/// One step of a cycle: the id and the kind of the edge leaving it (the last step is the closing edge).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CycleStep {
    pub id: String,
    pub kind: String,
}

/// A non-trivial strongly connected component with its canonical shortest cycle.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CycleEntry {
    pub members: Vec<String>,
    pub edges: Vec<Edge>,
    pub cycle: Vec<String>,
    pub cycle_kinds: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum DanglingSource {
    Edge,
    Exclusion,
}

/// An edge or exclusion pair that names an id that is not a node.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct DanglingEntry {
    pub source: DanglingSource,
    pub index: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub a: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub b: Option<String>,
    pub missing: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Layer {
    pub index: usize,
    pub nodes: Vec<String>,
}

/// In `layer`, `partner` was the first node already placed that is excluded with the deferred node.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct DeferralReason {
    pub layer: usize,
    pub partner: String,
}

/// A node placed later than its earliest possible layer. `reasons` lists the layers in which the node was
/// ready and held out by an exclusion; it is empty when the node waited only because a dependency was deferred.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeferralEntry {
    pub node: String,
    pub earliest: usize,
    pub placed_at: usize,
    pub reasons: Vec<DeferralReason>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct CriticalPath {
    pub depth: usize,
    pub path: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Group {
    pub size: usize,
    pub nodes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Groups {
    pub group_count: usize,
    pub groups: Vec<Group>,
}

/// Every fact about one graph. `layers`, `deferrals` and `critical_path` are `None` when a cycle exists.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Analysis {
    pub cycles: Vec<CycleEntry>,
    pub dangling: Vec<DanglingEntry>,
    pub layers: Option<Vec<Layer>>,
    pub deferrals: Option<Vec<DeferralEntry>>,
    pub critical_path: Option<CriticalPath>,
    pub groups: Groups,
}
