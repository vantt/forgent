//! The policy vocabulary and its shape rules: built-in policies, control axes and their strength order, and the
//! closed-schema checks for a policy, a network filter, a capability's confinement and an invocation override.
//!
//! Policies stay JSON documents (`serde_json::Value`, key order kept): they arrive from config and requests, and
//! the rules judge them the way the Node originals did, naming the config path and the rule in every refusal.

use std::net::Ipv6Addr;

use serde_json::{json, Map, Value};

use super::error::{refuse, ConfinementPolicyError};
use super::js::{coalesce, integer, non_blank, show, truthy};
use super::workspace_paths::{validate_workspace_paths, WORKSPACE_PATHS_RESOURCE};

type Checked = Result<(), ConfinementPolicyError>;

/// The ids of the built-in policies, in declaration order.
pub const BUILTIN_POLICY_IDS: [&str; 2] = ["host-write-denied", "workspace-write"];

pub const CONFINEMENT_MODES: [&str; 3] = ["required", "preferred", "unconfined"];

/// Control axes with their legal values, strongest first. The axis order is the order the checks report in.
pub const CONTROL_AXES: [(&str, &[&str]); 7] = [
    ("hostWrite", &["deny", "allow"]),
    ("hostRead", &["deny", "blind", "allow"]),
    ("networkEgress", &["deny", "filtered", "allow"]),
    ("process", &["isolated", "host"]),
    ("home", &["private", "host"]),
    ("session", &["isolated", "shared"]),
    ("workspace", &["own", "shared"]),
];

/// Grant access levels, widest first.
pub const GRANT_ACCESS_LEVELS: [(&str, u8); 3] = [("read-write", 3), ("write", 2), ("read", 1)];

fn axis_values(axis: &str) -> Option<&'static [&'static str]> {
    CONTROL_AXES
        .iter()
        .find(|(name, _)| *name == axis)
        .map(|(_, values)| *values)
}

/// Protection strength of a control value (the position from the weakest): `deny > allow`, `deny > blind > allow`,
/// `isolated > host`, and so on. `None` for a value the axis does not know.
fn control_rank(axis: &str, value: &str) -> Option<usize> {
    axis_values(axis)?
        .iter()
        .rev()
        .position(|v| *v == value)
        .map(|p| p + 1)
}

fn access_level(access: &str) -> Option<u8> {
    GRANT_ACCESS_LEVELS
        .iter()
        .find(|(name, _)| *name == access)
        .map(|(_, level)| *level)
}

fn grant(resource: &str, access: &str) -> Value {
    json!({ "resource": resource, "access": access, "scope": "dispatch" })
}

/// A built-in policy by id (spec: immutable, versioned, owned by fgOS), or `None`.
pub fn builtin_policy(id: &str) -> Option<Value> {
    let controls = json!({
        "hostWrite": "deny", "hostRead": "allow", "networkEgress": "allow",
        "process": "host", "home": "host", "session": "shared", "workspace": "shared",
    });
    let mut grants = vec![
        grant("run-output", "write"),
        grant("private-home", "read-write"),
        grant("executor-credentials", "read"),
    ];
    match id {
        "host-write-denied" => {}
        "workspace-write" => {
            grants.push(grant("workspace", "read-write"));
            grants.push(grant("workspace-git-metadata", "read"));
        }
        _ => return None,
    }
    Some(json!({ "contract": "confinement-policy.v1", "controls": controls, "grants": grants }))
}

/// Whether a confinement request asks for `hostRead: blind`, by override or by its policy.
pub fn request_is_blind(request: &Value) -> bool {
    fn host_read(v: Option<&Value>) -> Option<&str> {
        v.and_then(|v| v.get("controls"))
            .and_then(|c| c.get("hostRead"))
            .and_then(Value::as_str)
    }
    host_read(request.get("override")) == Some("blind")
        || host_read(request.get("requirement").and_then(|r| r.get("policy"))) == Some("blind")
}

fn canonicalize_cidr(value: &Value, label: &str) -> Result<String, ConfinementPolicyError> {
    let text = match value {
        Value::String(s) if s.contains('/') => s.as_str(),
        _ => {
            return refuse(format!(
                "runner config ({label}) invalid CIDR \"{}\".",
                plain(value)
            ));
        }
    };
    let parts: Vec<&str> = text.split('/').collect();
    if parts.len() != 2 {
        return refuse(format!("runner config ({label}) invalid CIDR \"{text}\"."));
    }
    let (ip, prefix_text) = (parts[0], parts[1]);
    if prefix_text.is_empty() || !prefix_text.chars().all(|c| c.is_ascii_digit()) {
        return refuse(format!(
            "runner config ({label}) invalid CIDR prefix \"{prefix_text}\"."
        ));
    }
    let prefix: u64 = prefix_text.parse().unwrap_or(u64::MAX);

    let octets: Vec<&str> = ip.split('.').collect();
    if octets.len() == 4
        && octets
            .iter()
            .all(|o| !o.is_empty() && o.chars().all(|c| c.is_ascii_digit()))
    {
        if prefix > 32 {
            return refuse(format!(
                "runner config ({label}) IPv4 CIDR prefix must be between 0 and 32, got {prefix}."
            ));
        }
        let nums: Vec<u64> = octets
            .iter()
            .map(|o| o.parse().unwrap_or(u64::MAX))
            .collect();
        if nums.iter().any(|n| *n > 255) {
            return refuse(format!(
                "runner config ({label}) invalid IPv4 octet in \"{text}\"."
            ));
        }
        let address = (nums[0] << 24 | nums[1] << 16 | nums[2] << 8 | nums[3]) as u32;
        let mask = if prefix == 0 {
            0
        } else {
            !0u32 << (32 - prefix as u32)
        };
        let canonical = address & mask;
        return Ok(format!(
            "{}.{}.{}.{}/{prefix}",
            (canonical >> 24) & 255,
            (canonical >> 16) & 255,
            (canonical >> 8) & 255,
            canonical & 255
        ));
    }

    if is_ipv6(ip) {
        if prefix > 128 {
            return refuse(format!(
                "runner config ({label}) IPv6 CIDR prefix must be between 0 and 128, got {prefix}."
            ));
        }
        return Ok(format!("{}/{prefix}", ip.to_lowercase()));
    }
    refuse(format!("runner config ({label}) invalid CIDR \"{text}\"."))
}

/// `net.isIPv6`: an IPv6 address, optionally with a `%zone`.
fn is_ipv6(text: &str) -> bool {
    let address = match text.split_once('%') {
        Some((address, zone)) => {
            let zone_ok = !zone.is_empty()
                && zone
                    .chars()
                    .all(|c| c.is_ascii_alphanumeric() || "-.:".contains(c));
            if !zone_ok {
                return false;
            }
            address
        }
        None => text,
    };
    address.parse::<Ipv6Addr>().is_ok()
}

/// A JSON value as `${value}` prints it in a template string.
fn plain(value: &Value) -> String {
    match value {
        Value::String(s) => s.clone(),
        other => show(Some(other)),
    }
}

fn check_keys(object: &Map<String, Value>, allowed: &[&str], label: &str, suffix: &str) -> Checked {
    for key in object.keys() {
        if !allowed.contains(&key.as_str()) {
            return refuse(format!(
                "runner config ({label}) contains unknown key \"{key}\".{suffix}"
            ));
        }
    }
    Ok(())
}

/// Closed schema validation for a network filter. A CIDR that is not canonical is rewritten in place, unless the
/// document is `frozen` (a shared definition), in which case it is refused.
pub fn validate_network_filter_shape(filter: &mut Value, label: &str, frozen: bool) -> Checked {
    let Some(object) = filter.as_object_mut() else {
        return refuse(format!("runner config ({label}) must be an object."));
    };
    check_keys(object, &["defaultAction", "allow"], label, "")?;
    if object.get("defaultAction").and_then(Value::as_str) != Some("deny") {
        return refuse(format!(
            "runner config ({label}) \"defaultAction\" must be \"deny\", got: {}.",
            show(object.get("defaultAction"))
        ));
    }
    let Some(Value::Array(rules)) = object.get_mut("allow") else {
        return refuse(format!(
            "runner config ({label}) \"allow\" must be an array of allowlist rules."
        ));
    };

    let mut seen_rules: Vec<String> = Vec::new();
    for (index, rule) in rules.iter_mut().enumerate() {
        let rule_label = format!("{label}.allow[{index}]");
        let Some(rule_object) = rule.as_object_mut() else {
            return refuse(format!("runner config ({rule_label}) must be an object."));
        };
        check_keys(
            rule_object,
            &["protocol", "destination", "ports"],
            &rule_label,
            "",
        )?;
        let protocol = rule_object.get("protocol").and_then(Value::as_str);
        if protocol != Some("tcp") && protocol != Some("udp") {
            return refuse(format!(
                "runner config ({rule_label}) \"protocol\" must be \"tcp\" or \"udp\", got: {}.",
                show(rule_object.get("protocol"))
            ));
        }
        let protocol = protocol.unwrap_or_default().to_string();

        let Some(destination) = rule_object.get_mut("destination").filter(|d| d.is_object()) else {
            return refuse(format!(
                "runner config ({rule_label}) \"destination\" must be an object."
            ));
        };
        let destination_label = format!("{rule_label}.destination");
        let destination_object = destination.as_object_mut().expect("checked above");
        check_keys(
            destination_object,
            &["kind", "value"],
            &destination_label,
            "",
        )?;
        let kind = destination_object.get("kind").and_then(Value::as_str);
        if kind != Some("dns") && kind != Some("cidr") {
            return refuse(format!(
                "runner config ({destination_label}) \"kind\" must be \"dns\" or \"cidr\", got: {}.",
                show(destination_object.get("kind"))
            ));
        }
        let kind = kind.unwrap_or_default().to_string();
        if !non_blank(destination_object.get("value")) {
            return refuse(format!(
                "runner config ({destination_label}) \"value\" must be a non-empty string."
            ));
        }
        let value = destination_object
            .get("value")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();
        // DNS is an exact normalized name, no wildcards.
        if kind == "dns" && value.contains('*') {
            return refuse(format!(
                "runner config ({destination_label}) DNS destination \"{value}\" must not contain wildcard \"*\"."
            ));
        }
        let mut value = value;
        if kind == "cidr" {
            let canonical = canonicalize_cidr(&Value::String(value.clone()), &destination_label)?;
            if frozen {
                if value != canonical {
                    return refuse(format!(
                        "runner config ({destination_label}) CIDR must be canonical: got \"{value}\", expected \"{canonical}\"."
                    ));
                }
            } else {
                destination_object.insert("value".to_string(), Value::String(canonical.clone()));
                value = canonical;
            }
        }

        let ports = match rule_object.get("ports") {
            Some(Value::Array(list)) if !list.is_empty() => list,
            _ => {
                return refuse(format!(
                    "runner config ({rule_label}) \"ports\" must be a non-empty array of port numbers."
                ));
            }
        };
        let mut seen_ports: Vec<i64> = Vec::new();
        for port in ports {
            let number = integer(port).filter(|n| (1..=65535).contains(n));
            let Some(number) = number else {
                return refuse(format!(
                    "runner config ({rule_label}) port {} must be an integer between 1 and 65535.",
                    show(Some(port))
                ));
            };
            if seen_ports.contains(&number) {
                return refuse(format!(
                    "runner config ({rule_label}) duplicate port {number} in allowlist."
                ));
            }
            seen_ports.push(number);
        }
        let mut sorted = seen_ports.clone();
        sorted.sort_unstable();
        let joined: Vec<String> = sorted.iter().map(i64::to_string).collect();
        let fingerprint = format!("{protocol}:{kind}:{value}:{}", joined.join(","));
        if seen_rules.contains(&fingerprint) {
            return refuse(format!(
                "runner config ({rule_label}) duplicate allow rule entry."
            ));
        }
        seen_rules.push(fingerprint);
    }
    Ok(())
}

/// Closed schema validation for a confinement policy document.
pub fn validate_confinement_policy_shape(policy: &mut Value, label: &str, frozen: bool) -> Checked {
    let Some(object) = policy.as_object() else {
        return refuse(format!("runner config ({label}) must be an object."));
    };
    let allowed = ["contract", "controls", "grants", "networkFilter"];
    for key in object.keys() {
        if !allowed.contains(&key.as_str()) {
            return refuse(format!(
                "runner config ({label}) contains unknown key \"{key}\". Allowed keys: {}.",
                allowed.join(", ")
            ));
        }
    }
    if object.get("contract").and_then(Value::as_str) != Some("confinement-policy.v1") {
        return refuse(format!(
            "runner config ({label}) \"contract\" must be \"confinement-policy.v1\", got: {}.",
            show(object.get("contract"))
        ));
    }
    let Some(controls) = object.get("controls").and_then(Value::as_object) else {
        return refuse(format!(
            "runner config ({label}) \"controls\" must be an object."
        ));
    };
    let names: Vec<&str> = CONTROL_AXES.iter().map(|(name, _)| *name).collect();
    for key in controls.keys() {
        if !names.contains(&key.as_str()) {
            return refuse(format!(
                "runner config ({label}.controls) contains unknown control \"{key}\". Allowed controls: {}.",
                names.join(", ")
            ));
        }
    }
    for (name, legal) in CONTROL_AXES {
        let Some(value) = controls.get(name) else {
            return refuse(format!(
                "runner config ({label}.controls) is missing required control \"{name}\"."
            ));
        };
        if !value.as_str().is_some_and(|v| legal.contains(&v)) {
            return refuse(format!(
                "runner config ({label}.controls.{name}) must be one of {}, got: {}.",
                legal.join("/"),
                show(Some(value))
            ));
        }
    }
    let Some(Value::Array(grants)) = object.get("grants") else {
        return refuse(format!(
            "runner config ({label}) \"grants\" must be an array."
        ));
    };

    let mut seen: Vec<&str> = Vec::new();
    for (index, entry) in grants.iter().enumerate() {
        let grant_label = format!("{label}.grants[{index}]");
        let Some(grant) = entry.as_object() else {
            return refuse(format!("runner config ({grant_label}) must be an object."));
        };
        let is_paths =
            grant.get("resource").and_then(Value::as_str) == Some(WORKSPACE_PATHS_RESOURCE);
        let allowed: &[&str] = if is_paths {
            &["resource", "access", "scope", "optional", "paths"]
        } else {
            &["resource", "access", "scope", "optional"]
        };
        for key in grant.keys() {
            if !allowed.contains(&key.as_str()) {
                return refuse(format!(
                    "runner config ({grant_label}) contains unknown key \"{key}\". Allowed keys: {}.",
                    allowed.join(", ")
                ));
            }
        }
        if !non_blank(grant.get("resource")) {
            return refuse(format!(
                "runner config ({grant_label}) \"resource\" must be a non-empty string."
            ));
        }
        let resource = grant
            .get("resource")
            .and_then(Value::as_str)
            .unwrap_or_default();
        if seen.contains(&resource) {
            return refuse(format!(
                "runner config ({grant_label}) duplicate resource grant for \"{resource}\"."
            ));
        }
        seen.push(resource);
        check_access(grant, &grant_label)?;
        if grant.get("scope").and_then(Value::as_str) != Some("dispatch") {
            return refuse(format!(
                "runner config ({grant_label}) \"scope\" must be \"dispatch\", got: {}.",
                show(grant.get("scope"))
            ));
        }
        if grant.get("optional").is_some_and(|v| !v.is_boolean()) {
            return refuse(format!(
                "runner config ({grant_label}) \"optional\" must be a boolean when present."
            ));
        }
        if is_paths {
            validate_workspace_paths(grant.get("paths"), &grant_label)?;
        }
    }

    let filtered = controls.get("networkEgress").and_then(Value::as_str) == Some("filtered");
    let has_filter = object.contains_key("networkFilter");
    if filtered {
        if !has_filter {
            return refuse(format!(
                "runner config ({label}) \"networkFilter\" is required when networkEgress is \"filtered\"."
            ));
        }
        let filter = policy.get_mut("networkFilter").expect("present");
        validate_network_filter_shape(filter, &format!("{label}.networkFilter"), frozen)?;
    } else if has_filter {
        return refuse(format!(
            "runner config ({label}) \"networkFilter\" is only permitted when networkEgress is \"filtered\"."
        ));
    }
    Ok(())
}

fn check_access(grant: &Map<String, Value>, grant_label: &str) -> Checked {
    if !grant
        .get("access")
        .and_then(Value::as_str)
        .is_some_and(|a| access_level(a).is_some())
    {
        let legal: Vec<&str> = GRANT_ACCESS_LEVELS.iter().map(|(name, _)| *name).collect();
        return refuse(format!(
            "runner config ({grant_label}) \"access\" must be one of {}, got: {}.",
            legal.join("/"),
            show(grant.get("access"))
        ));
    }
    Ok(())
}

/// Shape check for capability-level confinement configuration.
pub fn validate_capability_confinement_shape(confinement: &Value, label: &str) -> Checked {
    let Some(object) = confinement.as_object() else {
        return refuse(format!("runner config ({label}) must be an object."));
    };
    let mode = object.get("mode");
    let Some(mode_text) = mode
        .and_then(Value::as_str)
        .filter(|m| CONFINEMENT_MODES.contains(m))
    else {
        return refuse(format!(
            "runner config ({label}) \"mode\" must be one of {}, got: {}.",
            CONFINEMENT_MODES.join("/"),
            show(mode)
        ));
    };

    if mode_text == "unconfined" {
        for key in object.keys() {
            if key != "mode" && key != "allowInvocationOverride" {
                return refuse(format!(
                    "runner config ({label}) contains disallowed key \"{key}\" for mode \"unconfined\"."
                ));
            }
        }
        if object
            .get("allowInvocationOverride")
            .is_some_and(|v| v != &Value::Bool(false))
        {
            return refuse(format!(
                "runner config ({label}) \"allowInvocationOverride\" must be false or omitted when mode is \"unconfined\"."
            ));
        }
        if object.contains_key("policy") {
            return refuse(format!(
                "runner config ({label}) \"policy\" is forbidden when mode is \"unconfined\"."
            ));
        }
    } else {
        for key in object.keys() {
            if !["mode", "policy", "allowInvocationOverride"].contains(&key.as_str()) {
                return refuse(format!(
                    "runner config ({label}) contains unknown key \"{key}\"."
                ));
            }
        }
        if !non_blank(object.get("policy")) {
            return refuse(format!(
                "runner config ({label}) \"policy\" must be a non-empty string when mode is \"{mode_text}\"."
            ));
        }
        if object
            .get("allowInvocationOverride")
            .is_some_and(|v| !v.is_boolean())
        {
            return refuse(format!(
                "runner config ({label}) \"allowInvocationOverride\" must be a boolean when present."
            ));
        }
    }
    Ok(())
}

/// Validate an invocation-level confinement override: it may only harden posture or narrow grants; a downgrade is
/// refused. `base_policy` is the policy it narrows, `base_mode` the mode it may not weaken.
pub fn validate_override_confinement_shape(
    override_: &mut Value,
    base_policy: Option<&Value>,
    label: &str,
    base_mode: &str,
) -> Checked {
    let Some(object) = override_.as_object() else {
        return refuse(format!("runner config ({label}) must be an object."));
    };
    check_keys(
        object,
        &["controls", "networkFilter", "grants", "mode"],
        label,
        "",
    )?;

    if base_policy.is_none()
        && (object.contains_key("controls") || object.contains_key("networkFilter"))
    {
        return refuse(format!(
            "runner config ({label}) cannot override controls or networkFilter without a base policy."
        ));
    }

    if let Some(mode) = object.get("mode") {
        let text = mode.as_str();
        if text != Some("required") && text != Some("preferred") {
            return refuse(format!(
                "runner config ({label}) \"mode\" override must be \"required\" or \"preferred\", got: {}.",
                show(Some(mode))
            ));
        }
        if base_mode == "required" && text == Some("preferred") {
            return refuse(format!(
                "runner config ({label}) cannot downgrade mode from \"required\" to \"preferred\"."
            ));
        }
    }

    if let Some(controls) = object.get("controls") {
        let Some(controls) = controls.as_object() else {
            return refuse(format!(
                "runner config ({label}) \"controls\" must be an object."
            ));
        };
        for (axis, value) in controls {
            let Some(legal) = axis_values(axis) else {
                return refuse(format!(
                    "runner config ({label}.controls) unknown control axis \"{axis}\"."
                ));
            };
            if !value.as_str().is_some_and(|v| legal.contains(&v)) {
                return refuse(format!(
                    "runner config ({label}.controls.{axis}) must be one of {}, got: {}.",
                    legal.join("/"),
                    show(Some(value))
                ));
            }
            let base_value = base_policy
                .and_then(|b| b.get("controls"))
                .and_then(|c| c.get(axis.as_str()));
            if truthy(base_value) {
                let base_text = base_value.and_then(Value::as_str).unwrap_or_default();
                let base_rank = control_rank(axis, base_text);
                let override_rank = control_rank(axis, value.as_str().unwrap_or_default());
                if let (Some(base_rank), Some(override_rank)) = (base_rank, override_rank) {
                    if override_rank < base_rank {
                        return refuse(format!(
                            "runner config ({label}.controls.{axis}) override downgrade: \"{}\" is less protective than base policy \"{base_text}\".",
                            value.as_str().unwrap_or_default()
                        ));
                    }
                }
            }
        }
    }

    if let Some(grants) = object.get("grants") {
        let Some(grants) = grants.as_array() else {
            return refuse(format!(
                "runner config ({label}) \"grants\" must be an array."
            ));
        };
        let base_grants: Vec<&Value> = base_policy
            .and_then(|b| b.get("grants"))
            .and_then(Value::as_array)
            .map(|g| g.iter().collect())
            .unwrap_or_default();
        let mut seen: Vec<&str> = Vec::new();
        for (index, entry) in grants.iter().enumerate() {
            let grant_label = format!("{label}.grants[{index}]");
            let Some(grant) = entry.as_object() else {
                return refuse(format!("runner config ({grant_label}) must be an object."));
            };
            let allowed = ["resource", "access", "scope"];
            for key in grant.keys() {
                if !allowed.contains(&key.as_str()) {
                    return refuse(format!(
                        "runner config ({grant_label}) contains unknown key \"{key}\". Allowed keys: {}.",
                        allowed.join(", ")
                    ));
                }
            }
            if !non_blank(grant.get("resource")) {
                return refuse(format!(
                    "runner config ({grant_label}) \"resource\" must be a non-empty string."
                ));
            }
            let resource = grant
                .get("resource")
                .and_then(Value::as_str)
                .unwrap_or_default();
            if seen.contains(&resource) {
                return refuse(format!(
                    "runner config ({grant_label}) duplicate resource grant for \"{resource}\"."
                ));
            }
            seen.push(resource);
            check_access(grant, &grant_label)?;
            if grant.get("scope").and_then(Value::as_str) != Some("dispatch") {
                return refuse(format!(
                    "runner config ({grant_label}) \"scope\" must be \"dispatch\", got: {}.",
                    show(grant.get("scope"))
                ));
            }
            if base_policy.is_some() {
                // A later base grant of the same resource replaces an earlier one, as a map of them would.
                let base_grant = base_grants
                    .iter()
                    .rev()
                    .find(|g| g.get("resource").and_then(Value::as_str) == Some(resource));
                let Some(base_grant) = base_grant else {
                    return refuse(format!(
                        "runner config ({grant_label}) override cannot add new grant for \"{resource}\"."
                    ));
                };
                let wanted = grant
                    .get("access")
                    .and_then(Value::as_str)
                    .and_then(access_level);
                let base_access = base_grant.get("access").and_then(Value::as_str);
                if let (Some(wanted), Some(allowed)) = (wanted, base_access.and_then(access_level))
                {
                    if wanted > allowed {
                        return refuse(format!(
                            "runner config ({grant_label}) override cannot widen access for \"{resource}\" from \"{}\" to \"{}\".",
                            base_access.unwrap_or_default(),
                            grant
                                .get("access")
                                .and_then(Value::as_str)
                                .unwrap_or_default()
                        ));
                    }
                }
            } else {
                return refuse(format!(
                    "runner config ({grant_label}) override cannot add grant for \"{resource}\" without a base policy."
                ));
            }
        }
    }

    let effective_egress = coalesce(
        override_
            .get("controls")
            .and_then(|c| c.get("networkEgress")),
        base_policy
            .and_then(|b| b.get("controls"))
            .and_then(|c| c.get("networkEgress")),
    )
    .and_then(Value::as_str)
    .map(str::to_string);
    let override_filtered = override_
        .get("controls")
        .and_then(|c| c.get("networkEgress"))
        .and_then(Value::as_str)
        == Some("filtered");
    if override_filtered {
        if !truthy(override_.get("networkFilter")) {
            return refuse(format!(
                "runner config ({label}) \"networkFilter\" is required when networkEgress is \"filtered\"."
            ));
        }
        let filter = override_.get_mut("networkFilter").expect("present");
        validate_network_filter_shape(filter, &format!("{label}.networkFilter"), false)?;
    } else if override_.get("networkFilter").is_some() {
        if effective_egress.as_deref() != Some("filtered") {
            return refuse(format!(
                "runner config ({label}) \"networkFilter\" is only permitted when networkEgress is \"filtered\"."
            ));
        }
        let filter = override_.get_mut("networkFilter").expect("present");
        validate_network_filter_shape(filter, &format!("{label}.networkFilter"), false)?;
    }

    // The override's rules must sit inside the base filter's: same protocol and destination, a subset of its ports.
    let base_filter = base_policy.and_then(|b| b.get("networkFilter"));
    if truthy(override_.get("networkFilter")) && truthy(base_filter) {
        let base_rules: Vec<&Value> = base_filter
            .and_then(|f| f.get("allow"))
            .and_then(Value::as_array)
            .map(|r| r.iter().collect())
            .unwrap_or_default();
        let rules = override_
            .get("networkFilter")
            .and_then(|f| f.get("allow"))
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        for (index, rule) in rules.iter().enumerate() {
            let rule_label = format!("{label}.networkFilter.allow[{index}]");
            let destination = rule.get("destination");
            let same = |base: &&&Value| {
                base.get("protocol") == rule.get("protocol")
                    && base.get("destination").and_then(|d| d.get("kind"))
                        == destination.and_then(|d| d.get("kind"))
                    && base.get("destination").and_then(|d| d.get("value"))
                        == destination.and_then(|d| d.get("value"))
            };
            let Some(matching) = base_rules.iter().find(same) else {
                return refuse(format!(
                    "runner config ({rule_label}) override cannot add rule with destination \"{}\" ({}) not in base policy.",
                    plain(
                        destination
                            .and_then(|d| d.get("value"))
                            .unwrap_or(&Value::Null)
                    ),
                    plain(rule.get("protocol").unwrap_or(&Value::Null))
                ));
            };
            let permitted: Vec<&Value> = matching
                .get("ports")
                .and_then(Value::as_array)
                .map(|p| p.iter().collect())
                .unwrap_or_default();
            for port in rule
                .get("ports")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
            {
                if !permitted.iter().any(|p| js_equal(p, port)) {
                    return refuse(format!(
                        "runner config ({rule_label}) override cannot add port {} not permitted by base policy.",
                        plain(port)
                    ));
                }
            }
        }
    }
    Ok(())
}

/// Set membership as JavaScript compares numbers: `80` and `80.0` are one port.
fn js_equal(a: &Value, b: &Value) -> bool {
    match (integer(a), integer(b)) {
        (Some(x), Some(y)) => x == y,
        _ => a == b,
    }
}
