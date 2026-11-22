//! Pure normalizer of the Assignment snapshot fields: `mutation`, `evidence.required`, `resultKind` and
//! `onAdvance`. It owns the single declared mapping from role and operation to those stamps; a read-only check
//! reads the `mutation` it stamps and never re-derives it.
//!
//! A per-operation evidence requirement is named for the operations the Work layer interprets; every other
//! operation falls back to what its mutation says: read-only reports, mutating verifies.

use serde_json::{json, Value};

use super::Refusal;

// The declared mapping lives in `fgos-execution`; the inline stamp below holds a contract to it.
pub use fgos_execution::declared_stamp::{
    stamp_declared_assignment, DeclaredStamp, KNOWN_MUTATING_OPS, NORMALIZER_VERSION,
    READ_ONLY_OPS, READ_ONLY_ROLES,
};

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
