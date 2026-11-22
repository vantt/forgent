//! The declared stamp of an Assignment: `mutation`, `evidence.required`, `resultKind` and `onAdvance` from its
//! resolved role and operation. It owns the single declared mapping; a read-only check reads the `mutation` it
//! stamps and never re-derives it.
//!
//! A per-operation evidence requirement is named for the operations the Work layer interprets; every other
//! operation falls back to what its mutation says: read-only reports, mutating verifies.

use serde_json::{json, Value};

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
