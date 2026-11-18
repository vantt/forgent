//! Record sources that project state owned elsewhere: head liveness (Identity + Session Host) and the plan
//! lifecycle (git history and the program board log). Observe stores none of it; each query reads the owner again.

pub mod head_state;
pub mod plan_history;
pub mod plan_text;

use fgos_observe::record::registry::EmbeddedDeclaration;

pub const HEAD_STATE_KIND: &str = "fgos.head.state";
pub const PLAN_STATUS_KIND: &str = "fgos.plan.status";
pub const PLAN_ACTIVITY_KIND: &str = "fgos.plan.activity";

/// The declaration of the three kinds in this module, for the composition root's embedded list.
pub const SOURCES_DECLARATION: EmbeddedDeclaration = EmbeddedDeclaration {
    label: "fgos-host-sources",
    json: include_str!("../../../observe-kinds.json"),
};

#[cfg(test)]
mod tests;
