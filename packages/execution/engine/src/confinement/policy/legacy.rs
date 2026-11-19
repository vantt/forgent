//! The lookup of a confinement policy by id. Legacy flags (`privateHome`, `isolatedSession`, `ownWorktree`) and
//! loose `controls` are normalised by the runner config's one rule, re-exported here.

use serde_json::Value;

pub use fgos_execution::runner_config::normalize_legacy_confinement;

use super::js::truthy;
use super::shape::builtin_policy;

/// A policy by id: a built-in first (a custom policy never shadows one), else the custom map's entry.
pub fn resolve_confinement_policy(
    policy_id: &str,
    custom_policies: Option<&Value>,
) -> Option<Value> {
    if policy_id.trim().is_empty() {
        return None;
    }
    if let Some(policy) = builtin_policy(policy_id) {
        return Some(policy);
    }
    let custom = custom_policies?.as_object()?;
    custom.get(policy_id).filter(|p| truthy(Some(p))).cloned()
}
