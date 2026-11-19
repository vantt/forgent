//! Pure normalizer of the Assignment snapshot fields: `mutation`, `evidence.required`, `resultKind` and
//! `onAdvance`. It owns the single declared mapping from role and operation to those stamps; a read-only check
//! reads the `mutation` it stamps and never re-derives it.
//!
//! A per-operation evidence requirement is named for the operations the Work layer interprets; every other
//! operation falls back to what its mutation says: read-only reports, mutating verifies.

use serde_json::{json, Value};

use super::Refusal;

pub const NORMALIZER_VERSION: &str = "1";

/// Roles whose declared Assignments are read-only regardless of operation.
pub const READ_ONLY_ROLES: [&str; 3] = ["reviewer", "researcher", "advisor"];

/// Operations known to mutate the repo regardless of role.
pub const KNOWN_MUTATING_OPS: [&str; 3] = ["implement-item", "fix-verify-red", "scoped-subtask"];

/// Operations known to be read-only regardless of role.
pub const READ_ONLY_OPS: [&str; 7] = [
    "validate-plan",
    "resolve-question",
    "scout-blast-radius",
    "shape-plan",
    "lock-decisions",
    "judge-ambiguity",
    "compound-learn",
];

const EVIDENCE_REQUIRED_BY_OPERATION: [(&str, &str); 6] = [
    ("validate-plan", "reported"),
    ("review-item", "reported"),
    ("scout-blast-radius", "reported"),
    ("scoped-subtask", "verified"),
    ("implement-item", "verified"),
    ("fix-verify-red", "verified"),
];

const RESULT_KIND_BY_OPERATION: [(&str, &str); 2] = [
    ("validate-plan", "gate-verdict"),
    ("review-item", "review-verdict"),
];

const ON_ADVANCE_BY_OPERATION: [(&str, &str); 1] =
    [("validate-plan", "derive-plan-verdict-from-plan-md")];

fn lookup(table: &[(&'static str, &'static str)], key: &str) -> Option<&'static str> {
    table.iter().find(|(name, _)| *name == key).map(|(_, v)| *v)
}

/// The stamp of a declared assignment.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DeclaredStamp {
    pub mutation: &'static str,
    pub evidence_required: &'static str,
    pub result_kind: &'static str,
    pub on_advance: Option<&'static str>,
}

impl DeclaredStamp {
    pub fn evidence(&self) -> Value {
        json!({ "required": self.evidence_required })
    }

    pub fn to_json(&self) -> Value {
        let mut out = json!({
            "mutation": self.mutation,
            "evidence": self.evidence(),
            "resultKind": self.result_kind,
        });
        if let Some(on_advance) = self.on_advance {
            out["onAdvance"] = json!(on_advance);
        }
        out
    }
}

fn classify_declared_mutation(role: &str, operation: &str) -> &'static str {
    if KNOWN_MUTATING_OPS.contains(&operation) {
        return "mutating";
    }
    if READ_ONLY_ROLES.contains(&role) || READ_ONLY_OPS.contains(&operation) {
        return "read-only";
    }
    "mutating"
}

/// Stamp a DECLARED assignment from its resolved role (default `implementer`) and operation id.
pub fn stamp_declared_assignment(role: Option<&str>, operation: &str) -> DeclaredStamp {
    let role = role.unwrap_or("implementer");
    let mutation = classify_declared_mutation(role, operation);
    let read_only = mutation == "read-only";
    DeclaredStamp {
        mutation,
        evidence_required: lookup(&EVIDENCE_REQUIRED_BY_OPERATION, operation)
            .unwrap_or(if read_only { "reported" } else { "verified" }),
        result_kind: lookup(&RESULT_KIND_BY_OPERATION, operation).unwrap_or(if read_only {
            "advisory"
        } else {
            "work-product"
        }),
        on_advance: lookup(&ON_ADVANCE_BY_OPERATION, operation),
    }
}

/// Stamp an INLINE assignment from its already-validated contract: `{ mutation, evidence: { required } }`. A
/// `mutating` contract is held a second time to the engine-reserved protocol-operation stamp, so this can never
/// itself let an unstamped one through; `carries_protocol_stamp` is the contract module's answer for the
/// contract's constraints.
pub fn stamp_inline_assignment(
    contract: &Value,
    carries_protocol_stamp: bool,
) -> Result<Value, Refusal> {
    let mutation = contract.get("mutation").and_then(Value::as_str);
    let required = contract
        .get("evidence")
        .and_then(|evidence| evidence.get("required"))
        .and_then(Value::as_str);
    let Some(mutation @ ("read-only" | "mutating")) = mutation else {
        return Err(Refusal::new(
            "assignment-normalizer: inline contract missing/invalid \"mutation\" after normalization (must be \"read-only\" or \"mutating\", ADR-006 §6)",
        ));
    };
    if mutation == "mutating" && !carries_protocol_stamp {
        return Err(Refusal::new(
            "assignment-normalizer: inline contract mutation \"mutating\" carries no engine-reserved protocol-operation stamp -- rejected as a second, defensive gate (ADR-006 §6 / Phase 01 mutation-unlock R6a)",
        ));
    }
    let Some(required @ ("reported" | "verified")) = required else {
        return Err(Refusal::new(
            "assignment-normalizer: inline contract missing/invalid \"evidence.required\" after normalization",
        ));
    };
    Ok(json!({ "mutation": mutation, "evidence": { "required": required } }))
}
