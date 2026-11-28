//! Record sources that project state owned elsewhere: head liveness (Identity + Session Host), the plan
//! lifecycle (git history and the program board log) and the trunk's commits by kind. Observe stores none of it;
//! each query reads the owner again.

pub mod head_state;
pub mod main_commits;
pub mod plan_history;
pub mod plan_text;

use fgos_observe::record::registry::EmbeddedDeclaration;

pub const HEAD_STATE_KIND: &str = "fgos.head.state";
pub const PLAN_STATUS_KIND: &str = "fgos.plan.status";
pub const PLAN_ACTIVITY_KIND: &str = "fgos.plan.activity";
pub const MAIN_COMMIT_KIND: &str = "fgos.main.commit";

/// The declaration of the four kinds in this module, for the composition root's embedded list.
pub const SOURCES_DECLARATION: EmbeddedDeclaration = EmbeddedDeclaration {
    label: "fgos-host-sources",
    json: include_str!("../../../observe-kinds.json"),
};

#[cfg(test)]
mod tests;
