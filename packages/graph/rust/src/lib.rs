//! Deterministic facts about a directed graph with typed edges and exclusion pairs; see docs/platform/graph/spec.md.
//!
//! The crate knows no file system, clock, process, path or Work item. A caller builds a [`Graph`] from the
//! JSON input of `packages/graph/contracts/graph.v1.json` and reads the facts back as an [`Analysis`].

mod analysis;
mod input;
mod output;

pub use input::{
    Graph, Refusal, EDGE_KINDS, MAX_EDGES, MAX_EXCLUSIONS, MAX_ID_BYTES, MAX_INPUT_BYTES, MAX_NODES,
};
pub use output::{
    Analysis, CriticalPath, CycleEntry, CycleStep, DanglingEntry, DanglingSource, DeferralEntry,
    DeferralReason, Edge, Group, Groups, Layer,
};

/// Parse one input document (JSON text) and compute every fact.
pub fn analyze_str(text: &str) -> Result<Analysis, Refusal> {
    Graph::from_str(text).map(|graph| graph.analyze())
}

/// Parse one already-decoded input document and compute every fact.
pub fn analyze_value(value: &serde_json::Value) -> Result<Analysis, Refusal> {
    Graph::from_value(value).map(|graph| graph.analyze())
}
