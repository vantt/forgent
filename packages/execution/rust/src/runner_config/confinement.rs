//! The confinement of an executor entry, brought to the one policy shape the runner reads. Ported from
//! `normalizeLegacyConfinement` (`confinement/policies.mjs`) and `normalizeConfigConfinement` (`dispatch/config.mjs`).

use crate::js::truthy;
use serde_json::{json, Map, Value};

/// `value ?? default`: a missing or null field takes the default.
fn or_default(value: Option<&Value>, default: &str) -> Value {
    match value {
        None | Some(Value::Null) => json!(default),
        Some(other) => other.clone(),
    }
}

fn is_text(value: Option<&Value>, text: &str) -> bool {
    value.and_then(Value::as_str) == Some(text)
}

/// The legacy `{ privateHome, isolatedSession, ownWorktree }` flags, the short `{ home, session, workspace }`
/// form and a bare `controls` object, as a `confinement-policy.v1` policy; `None` for a value that is none of them.
/// A value already in the v1 shape (a `contract` and truthy `controls`) comes back as it is.
pub fn normalize_legacy_confinement(confinement: &Value) -> Option<Value> {
    let fields = confinement.as_object()?;
    let is_legacy = [
        "privateHome",
        "isolatedSession",
        "ownWorktree",
        "home",
        "session",
        "workspace",
    ]
    .iter()
    .any(|key| fields.contains_key(*key));
    let controls = confinement.get("controls");
    if !is_legacy {
        if is_text(confinement.get("contract"), "confinement-policy.v1") && truthy(controls) {
            return Some(confinement.clone());
        }
        let controls = controls.filter(|value| truthy(Some(value)))?;
        if !matches!(controls, Value::Object(_) | Value::Array(_)) {
            return None;
        }
        let control = |key: &str, default: &str| or_default(controls.get(key), default);
        let mut policy = Map::new();
        policy.insert("contract".into(), json!("confinement-policy.v1"));
        policy.insert(
            "controls".into(),
            json!({
                "hostWrite": control("hostWrite", "allow"),
                "hostRead": control("hostRead", "allow"),
                "networkEgress": control("networkEgress", "allow"),
                "process": control("process", "host"),
                "home": control("home", "host"),
                "session": control("session", "shared"),
                "workspace": control("workspace", "shared"),
            }),
        );
        let grants = match confinement.get("grants") {
            Some(listed @ Value::Array(_)) => listed.clone(),
            _ if is_text(controls.get("home"), "private") => json!([private_home_grant()]),
            _ => json!([]),
        };
        policy.insert("grants".into(), grants);
        if truthy(confinement.get("backend")) {
            policy.insert("backend".into(), confinement["backend"].clone());
        }
        if let Some(filter) = fields.get("networkFilter") {
            policy.insert("networkFilter".into(), filter.clone());
        }
        return Some(Value::Object(policy));
    }
    let controls_home = |text: &str| is_text(controls.and_then(|c| c.get("home")), text);
    let private_home = truthy(fields.get("privateHome"))
        || is_text(fields.get("home"), "private")
        || controls_home("private");
    let isolated_session = truthy(fields.get("isolatedSession"))
        || is_text(fields.get("session"), "isolated")
        || is_text(controls.and_then(|c| c.get("session")), "isolated");
    let own_worktree = truthy(fields.get("ownWorktree"))
        || is_text(fields.get("workspace"), "own")
        || is_text(controls.and_then(|c| c.get("workspace")), "own");
    let mut policy = Map::new();
    policy.insert("contract".into(), json!("confinement-policy.v1"));
    policy.insert(
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
    policy.insert(
        "grants".into(),
        if private_home {
            json!([private_home_grant()])
        } else {
            json!([])
        },
    );
    if truthy(confinement.get("backend")) {
        policy.insert("backend".into(), confinement["backend"].clone());
    }
    Some(Value::Object(policy))
}

fn private_home_grant() -> Value {
    json!({"resource": "private-home", "access": "read-write", "scope": "dispatch"})
}

/// One entry's `confinement`, replaced by its normalized policy; the declared backend always survives.
fn normalize_entry(entry: &mut Value) {
    let Some(declared) = entry.get("confinement").filter(|c| truthy(Some(c))) else {
        return;
    };
    let Some(mut normalized) = normalize_legacy_confinement(declared) else {
        return;
    };
    if let (Some(backend), Value::Object(policy)) = (
        declared.get("backend").filter(|b| truthy(Some(b))),
        &mut normalized,
    ) {
        policy.insert("backend".into(), backend.clone());
    }
    entry["confinement"] = normalized;
}

/// The runner config with the confinement of its default executor and of every named executor normalized.
pub(crate) fn normalize_config_confinement(config: &mut Value) {
    if let Some(executor) = config.get_mut("executor") {
        normalize_entry(executor);
    }
    if let Some(Value::Object(executors)) = config.get_mut("executors") {
        for executor in executors.values_mut() {
            normalize_entry(executor);
        }
    }
}
