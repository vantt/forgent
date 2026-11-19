//! The legacy confinement flags (`privateHome`, `isolatedSession`, `ownWorktree`) and loose `controls` objects,
//! normalised into the canonical policy document at the boundary; and the lookup of a policy by id.

use serde_json::{json, Map, Value};

use super::js::{coalesce, truthy};
use super::shape::builtin_policy;

const LEGACY_KEYS: [&str; 6] = [
    "privateHome",
    "isolatedSession",
    "ownWorktree",
    "home",
    "session",
    "workspace",
];

fn private_home_grant() -> Value {
    json!({ "resource": "private-home", "access": "read-write", "scope": "dispatch" })
}

/// Normalizes legacy `{ privateHome, isolatedSession, ownWorktree }` flags (and `controls` without the contract
/// stamp) into a confinement policy document; a document that already carries the contract passes through as is.
/// `None` when the input names nothing it can read.
pub fn normalize_legacy_confinement(confinement: &Value) -> Option<Value> {
    let object = confinement.as_object()?;
    let is_legacy = LEGACY_KEYS.iter().any(|key| object.contains_key(*key));

    if !is_legacy {
        let controls = object.get("controls");
        if object.get("contract").and_then(Value::as_str) == Some("confinement-policy.v1")
            && truthy(controls)
        {
            return Some(confinement.clone());
        }
        let controls = controls.filter(|c| matches!(c, Value::Object(_) | Value::Array(_)))?;
        let axis = |name: &str, default: &str| {
            coalesce(controls.get(name), None)
                .cloned()
                .unwrap_or_else(|| json!(default))
        };
        let grants = match object.get("grants") {
            Some(grants @ Value::Array(_)) => grants.clone(),
            _ if controls.get("home").and_then(Value::as_str) == Some("private") => {
                json!([private_home_grant()])
            }
            _ => json!([]),
        };
        let mut out = Map::new();
        out.insert("contract".into(), json!("confinement-policy.v1"));
        out.insert(
            "controls".into(),
            json!({
                "hostWrite": axis("hostWrite", "allow"),
                "hostRead": axis("hostRead", "allow"),
                "networkEgress": axis("networkEgress", "allow"),
                "process": axis("process", "host"),
                "home": axis("home", "host"),
                "session": axis("session", "shared"),
                "workspace": axis("workspace", "shared"),
            }),
        );
        out.insert("grants".into(), grants);
        if truthy(object.get("backend")) {
            out.insert("backend".into(), object["backend"].clone());
        }
        if let Some(filter) = object.get("networkFilter") {
            out.insert("networkFilter".into(), filter.clone());
        }
        return Some(Value::Object(out));
    }

    let nested = |name: &str| {
        object
            .get("controls")
            .and_then(|c| c.get(name))
            .and_then(Value::as_str)
    };
    let word =
        |name: &str, expected: &str| object.get(name).and_then(Value::as_str) == Some(expected);
    let private_home = truthy(object.get("privateHome"))
        || word("home", "private")
        || nested("home") == Some("private");
    let isolated_session = truthy(object.get("isolatedSession"))
        || word("session", "isolated")
        || nested("session") == Some("isolated");
    let own_worktree = truthy(object.get("ownWorktree"))
        || word("workspace", "own")
        || nested("workspace") == Some("own");

    let mut out = Map::new();
    out.insert("contract".into(), json!("confinement-policy.v1"));
    out.insert(
        "controls".into(),
        json!({
            "hostWrite": "allow",
            "hostRead": "allow",
            "networkEgress": "allow",
            "process": "host",
            "home": if private_home { "private" } else { "host" },
            "session": if isolated_session { "isolated" } else { "shared" },
            "workspace": if own_worktree { "own" } else { "shared" },
        }),
    );
    out.insert(
        "grants".into(),
        if private_home {
            json!([private_home_grant()])
        } else {
            json!([])
        },
    );
    if truthy(object.get("backend")) {
        out.insert("backend".into(), object["backend"].clone());
    }
    Some(Value::Object(out))
}

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
