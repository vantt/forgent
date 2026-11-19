//! Verification command resolution for collaboration loops: a unit's own `verify`, else its capability's.
//! Nothing else supplies one, so a unit without either is not verified, and says so.

use crate::seat_resolver::value::truthy;
use crate::seat_resolver::{capability_verify_of, VERIFY_SEAT};
use serde_json::{json, Value};

/// The verify command of a unit: its own `verify`, else its capability's; `None` unless a non-blank string.
pub fn verify_command_of(unit: &Value, cfg: &Value) -> Option<String> {
    let own = unit.get("verify").filter(|v| truthy(v));
    let capability = unit.get("capability").and_then(Value::as_str);
    let command = own.or_else(|| capability_verify_of(cfg, capability));
    command
        .and_then(Value::as_str)
        .filter(|c| !c.trim().is_empty())
        .map(str::to_string)
}

/// Whether a verify command exists on the unit or its capability.
pub fn has_verify_command(unit: &Value, cfg: &Value) -> bool {
    verify_command_of(unit, cfg).is_some()
}

/// The seat result of one verify round, from what the `verify` hook answered: `{ pass: true }`, findings, or an
/// infrastructure failure (the check did not run to an end, so it is an `execution-failure` that a resume runs
/// again; `infrastructureReason` says how it did not end: `timeout` or `not-run`).
pub fn verify_seat_result(answer: Option<&Value>, round: u64) -> Value {
    let field = |key: &str| answer.and_then(|a| a.get(key));
    if field("pass").is_some_and(truthy) {
        return json!({ "seat": VERIFY_SEAT, "round": round, "outcome": "pass", "findings": [] });
    }
    if let Some(reason) = field("infrastructure").filter(|v| truthy(v)) {
        let mut out = json!({
            "seat": VERIFY_SEAT, "round": round, "outcome": "execution-failure",
            "infrastructure": true, "infrastructureReason": reason,
        });
        if let Some(error) = field("error") {
            out["error"] = error.clone();
        }
        return out;
    }
    let findings = field("findings")
        .filter(|f| truthy(f))
        .cloned()
        .unwrap_or_else(|| json!(["Verification failed"]));
    json!({ "seat": VERIFY_SEAT, "round": round, "outcome": "findings", "findings": findings })
}
