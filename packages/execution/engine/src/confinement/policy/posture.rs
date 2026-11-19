//! A binding posture mapped onto the one confinement path. Whether a candidate can really apply it on this machine
//! is the executor model's decision (`fgos_execution::executor_model::resolve_posture_invocation`).

use serde_json::{json, Value};

use super::legacy::resolve_confinement_policy;

/// What a binding's posture resolves to: the policy id, the policy, and the requirement a confinement request
/// takes.
#[derive(Debug, Clone, PartialEq)]
pub struct ResolvedPosture {
    pub posture: &'static str,
    pub policy_id: &'static str,
    pub policy: Option<Value>,
}

impl ResolvedPosture {
    /// `{ mode: 'required', policyId, policy }`, shaped for building a confinement request.
    pub fn requirement(&self) -> Value {
        json!({ "mode": "required", "policyId": self.policy_id, "policy": self.policy })
    }
}

/// Anything but `workspace-write` resolves read-only; the backend driver builds the argv from the policy's grants,
/// nothing here assembles sandbox arguments.
pub fn resolve_posture(posture: Option<&str>, custom_policies: Option<&Value>) -> ResolvedPosture {
    let (posture, policy_id) = if posture == Some("workspace-write") {
        ("workspace-write", "workspace-write")
    } else {
        ("read-only", "host-write-denied")
    };
    ResolvedPosture {
        posture,
        policy_id,
        policy: resolve_confinement_policy(policy_id, custom_policies),
    }
}
