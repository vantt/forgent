//! The runner config a unit run records (`snapshotRunnerConfig`), read by the engine and the Node addon alike.

use serde_json::{json, Value};
use sha2::{Digest, Sha256};

fn truthy(v: &Value) -> bool {
    match v {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::Number(n) => n.as_f64().is_some_and(|f| f != 0.0 && !f.is_nan()),
        Value::String(s) => !s.is_empty(),
        _ => true,
    }
}

/// The runner config a unit run records, and the hash of what seat choice and the run read from it
/// (`snapshotRunnerConfig`). The account inventory is read live at every bind and launch, never recorded.
pub fn snapshot_runner_config(cfg: &Value) -> Value {
    let or = |key: &str, empty: Value| cfg.get(key).filter(|v| truthy(v)).cloned().unwrap_or(empty);
    let filtered = json!({
        "defaults": or("defaults", json!({})),
        "maxTier": cfg.get("maxTier").filter(|v| !v.is_null()).cloned().unwrap_or(Value::Null),
        "tierFallback": or("tierFallback", json!({})),
        "capabilities": or("capabilities", json!({})),
        "roles": or("roles", json!({})),
        "personas": or("personas", json!({})),
        "loops": or("loops", json!({})),
        "patterns": or("patterns", json!({})),
        "modelPolicies": or("modelPolicies", json!({})),
        "executors": or("executors", json!({})),
        "governance": or("governance", Value::Null),
    });
    let hash: String = Sha256::digest(js_json(&filtered).as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect();
    let mut runner = cfg.as_object().cloned().unwrap_or_default();
    runner.shift_remove("llmAccounts");
    runner.shift_remove("providers");
    json!({ "hash": hash, "runner": runner })
}

/// `JSON.stringify` of a value: serde writes integers, strings and key order as JavaScript does; a float with no
/// fraction is written as JavaScript writes it (`1`, not `1.0`).
fn js_json(value: &Value) -> String {
    fn normalize(v: &Value) -> Value {
        match v {
            Value::Number(n) if n.is_f64() => {
                let f = n.as_f64().unwrap_or_default();
                if f.fract() == 0.0 && f.abs() < 1e21 {
                    json!(f as i64)
                } else {
                    v.clone()
                }
            }
            Value::Array(a) => Value::Array(a.iter().map(normalize).collect()),
            Value::Object(o) => {
                Value::Object(o.iter().map(|(k, v)| (k.clone(), normalize(v))).collect())
            }
            other => other.clone(),
        }
    }
    serde_json::to_string(&normalize(value)).unwrap_or_default()
}
