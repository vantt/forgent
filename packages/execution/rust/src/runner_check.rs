//! The runner's semantic config check: the rules of the effective runner section that compare two fields, or a
//! field with a catalog or registry. Ported from `validateRunnerConfigShape` (`src/runner/dispatch/config.mjs`)
//! and every rule it calls. The config door has already refused every type, enum, range, required and unknown-key
//! rule against the runner schema, so the check reads a value of the right shape; it never reads the machine.
//!
//! A refusal keeps the class name, the optional `code` and the text of today's Node error, and carries the
//! `path`, `paths` and `detail` Node sets on it, so a caller can point at the file and line the value came from.

// The refusal carries the positions Node's error carries; it is built once, on the cold path of a refused config.
#![allow(clippy::result_large_err)]

use crate::accounts::{is_cli_key, is_inside, validate_provider_account_inventory};
use crate::executor_model::{capability_confinement, ModelError};
use fgos_convention::packaged_rules;
use serde_json::{Map, Value};
use std::fmt;
use std::net::Ipv6Addr;
use std::str::FromStr;

// ---- the refusal -----------------------------------------------------------------------------------------

/// A refusal of the check: the error as the vectors state it, plus where it points (Node's `RunnerConfigError`
/// `path`/`paths`/`detail`, set only where Node sets them; a later caller attributes the message to a file and
/// line from them).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RunnerCheckError {
    pub error: ModelError,
    pub path: Option<String>,
    pub paths: Vec<String>,
    pub detail: Option<String>,
}

impl RunnerCheckError {
    fn plain(error: ModelError) -> Self {
        RunnerCheckError {
            error,
            path: None,
            paths: Vec::new(),
            detail: None,
        }
    }

    fn config(message: String) -> Self {
        Self::plain(ModelError::runner(message))
    }

    /// A refusal that names the one config path it is about and what is wrong there.
    fn at_path(message: String, path: String, detail: String) -> Self {
        RunnerCheckError {
            error: ModelError::runner(message),
            paths: vec![path.clone()],
            path: Some(path),
            detail: Some(detail),
        }
    }
}

impl From<ModelError> for RunnerCheckError {
    fn from(error: ModelError) -> Self {
        Self::plain(error)
    }
}

impl fmt::Display for RunnerCheckError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.error.fmt(f)
    }
}

impl std::error::Error for RunnerCheckError {}

type Check = Result<(), RunnerCheckError>;

// ---- reading the JSON the way the Node code reads it -----------------------------------------------------

/// ECMAScript's whitespace, which is not Rust's: it holds the byte order mark and not the next-line character.
fn js_space(c: char) -> bool {
    matches!(c, '\u{0009}'..='\u{000d}' | '\u{0020}' | '\u{00a0}' | '\u{1680}' | '\u{2000}'..='\u{200a}' | '\u{2028}' | '\u{2029}' | '\u{202f}' | '\u{205f}' | '\u{3000}' | '\u{feff}')
}

fn js_trim(text: &str) -> &str {
    text.trim_matches(js_space)
}

/// A number as ECMAScript writes it: a whole value has no fraction.
fn js_number(number: &serde_json::Number) -> String {
    if let Some(whole) = number.as_i64() {
        return whole.to_string();
    }
    if let Some(whole) = number.as_u64() {
        return whole.to_string();
    }
    match number.as_f64() {
        Some(x) if x.is_finite() && x.fract() == 0.0 && x.abs() < 1e21 => format!("{x:.0}"),
        Some(x) => format!("{x}"),
        None => number.to_string(),
    }
}

/// `JSON.stringify(value)` for a value that may be absent (`undefined`).
fn js_json(value: Option<&Value>) -> String {
    match value {
        None => "undefined".to_string(),
        Some(Value::Null) => "null".to_string(),
        Some(Value::Bool(flag)) => flag.to_string(),
        Some(Value::Number(number)) => js_number(number),
        Some(Value::String(text)) => serde_json::to_string(text).unwrap_or_default(),
        Some(Value::Array(items)) => format!(
            "[{}]",
            items
                .iter()
                .map(|item| js_json(Some(item)))
                .collect::<Vec<_>>()
                .join(",")
        ),
        Some(Value::Object(fields)) => format!(
            "{{{}}}",
            fields
                .iter()
                .map(|(key, item)| format!(
                    "{}:{}",
                    serde_json::to_string(key).unwrap_or_default(),
                    js_json(Some(item))
                ))
                .collect::<Vec<_>>()
                .join(",")
        ),
    }
}

/// A value as a template literal writes it (`${value}`).
fn js_display(value: Option<&Value>) -> String {
    match value {
        None => "undefined".to_string(),
        Some(Value::Null) => "null".to_string(),
        Some(Value::Bool(flag)) => flag.to_string(),
        Some(Value::Number(number)) => js_number(number),
        Some(Value::String(text)) => text.clone(),
        Some(Value::Array(items)) => items
            .iter()
            .map(|item| match item {
                Value::Null => String::new(),
                other => js_display(Some(other)),
            })
            .collect::<Vec<_>>()
            .join(","),
        Some(Value::Object(_)) => "[object Object]".to_string(),
    }
}

/// ECMAScript truthiness of a value that may be absent.
fn js_truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::Bool(flag)) => *flag,
        Some(Value::Number(number)) => number.as_f64().is_some_and(|x| x != 0.0 && !x.is_nan()),
        Some(Value::String(text)) => !text.is_empty(),
        Some(_) => true,
    }
}

/// A key that is present and not null (the reading of `??`).
fn present<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    value.get(key).filter(|found| !found.is_null())
}

fn str_of<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key).and_then(Value::as_str)
}

fn fields_of(value: Option<&Value>) -> impl Iterator<Item = (&String, &Value)> {
    value.and_then(Value::as_object).into_iter().flatten()
}

fn is_entry(value: &Value) -> bool {
    value.is_object() || value.is_array()
}

/// A non-empty string once trimmed (`typeof x === "string" && x.trim()`).
fn is_filled(value: Option<&Value>) -> bool {
    value
        .and_then(Value::as_str)
        .is_some_and(|text| !js_trim(text).is_empty())
}

/// `Number.isInteger`: a JSON number with no fraction, however it was written.
fn js_integer(value: &Value) -> Option<f64> {
    value.as_f64().filter(|x| x.is_finite() && x.fract() == 0.0)
}

// ---- the capability catalog (`runner.capabilities`) ------------------------------------------------------

fn capabilities_of(runner: &Value) -> Option<&Map<String, Value>> {
    runner.get("capabilities").and_then(Value::as_object)
}

/// Whether the catalog registers `name`: an entry of its own, or an entry that lists it in `aliases`.
fn is_registered(runner: &Value, name: &Value) -> bool {
    let Some(section) = capabilities_of(runner) else {
        return false;
    };
    if name
        .as_str()
        .is_some_and(|key| section.get(key).is_some_and(is_entry))
    {
        return true;
    }
    section.values().any(|entry| {
        entry
            .get("aliases")
            .and_then(Value::as_array)
            .is_some_and(|aliases| aliases.contains(name))
    })
}

/// The scopes of a taste table (`roles`, `personas`): the entries that are plain objects, in declared order.
fn taste_scopes<'a>(
    runner: &'a Value,
    table: &str,
) -> impl Iterator<Item = (&'a String, &'a Value)> {
    fields_of(runner.get(table)).filter(|(_, scope)| scope.is_object())
}

/// Every `prefer` the binding reads, with where it sits: `capabilities.<name>`, `roles.<role>` or
/// `personas.<name>`.
fn prefer_sites(runner: &Value) -> Vec<(&Value, String)> {
    let mut sites = Vec::new();
    for (name, entry) in fields_of(runner.get("capabilities")) {
        if let Some(prefer) = entry.get("prefer").filter(|_| entry.is_object()) {
            sites.push((prefer, format!("capabilities.{name}")));
        }
    }
    for table in ["roles", "personas"] {
        for (key, scope) in taste_scopes(runner, table) {
            if let Some(prefer) = scope.get("prefer") {
                sites.push((prefer, format!("{table}.{key}")));
            }
        }
    }
    sites
}

// ---- the policies of confinement -------------------------------------------------------------------------

const BUILTIN_POLICY_IDS: [&str; 2] = ["host-write-denied", "workspace-write"];

const CONFINEMENT_MODES: [&str; 3] = ["required", "preferred", "unconfined"];

/// The control axes of a policy and the values each may take, in the order the policy lists them.
const CONTROL_AXES: [(&str, &[&str]); 7] = [
    ("hostWrite", &["deny", "allow"]),
    ("hostRead", &["deny", "blind", "allow"]),
    ("networkEgress", &["deny", "filtered", "allow"]),
    ("process", &["isolated", "host"]),
    ("home", &["private", "host"]),
    ("session", &["isolated", "shared"]),
    ("workspace", &["own", "shared"]),
];

const GRANT_ACCESS_LEVELS: [&str; 3] = ["read-write", "write", "read"];

fn policy_error(message: String) -> ModelError {
    ModelError::confinement_policy(message)
}

fn unknown_key(label: &str, key: &str) -> ModelError {
    policy_error(format!(
        "runner config ({label}) contains unknown key \"{key}\"."
    ))
}

/// A CIDR block in its canonical spelling: the address with the host bits cleared (IPv4) or lower-cased (IPv6).
fn canonicalize_cidr(value: &str, label: &str) -> Result<String, ModelError> {
    let invalid = || policy_error(format!("runner config ({label}) invalid CIDR \"{value}\"."));
    if !value.contains('/') {
        return Err(invalid());
    }
    let parts: Vec<&str> = value.split('/').collect();
    if parts.len() != 2 {
        return Err(invalid());
    }
    let (address, prefix_text) = (parts[0], parts[1]);
    if prefix_text.is_empty() || !prefix_text.bytes().all(|b| b.is_ascii_digit()) {
        return Err(policy_error(format!(
            "runner config ({label}) invalid CIDR prefix \"{prefix_text}\"."
        )));
    }
    let prefix: u64 = prefix_text.parse().unwrap_or(u64::MAX);

    let octets: Vec<&str> = address.split('.').collect();
    if octets.len() == 4
        && octets
            .iter()
            .all(|o| !o.is_empty() && o.bytes().all(|b| b.is_ascii_digit()))
    {
        if prefix > 32 {
            return Err(policy_error(format!(
                "runner config ({label}) IPv4 CIDR prefix must be between 0 and 32, got {prefix}."
            )));
        }
        let numbers: Vec<u64> = octets
            .iter()
            .map(|o| o.parse().unwrap_or(u64::MAX))
            .collect();
        if numbers.iter().any(|n| *n > 255) {
            return Err(policy_error(format!(
                "runner config ({label}) invalid IPv4 octet in \"{value}\"."
            )));
        }
        let ip = numbers.iter().fold(0u32, |acc, n| (acc << 8) | *n as u32);
        let mask = if prefix == 0 {
            0
        } else {
            u32::MAX << (32 - prefix as u32)
        };
        let canonical = ip & mask;
        return Ok(format!(
            "{}.{}.{}.{}/{prefix}",
            (canonical >> 24) & 255,
            (canonical >> 16) & 255,
            (canonical >> 8) & 255,
            canonical & 255
        ));
    }

    if is_ipv6(address) {
        if prefix > 128 {
            return Err(policy_error(format!(
                "runner config ({label}) IPv6 CIDR prefix must be between 0 and 128, got {prefix}."
            )));
        }
        return Ok(format!("{}/{prefix}", address.to_lowercase()));
    }
    Err(invalid())
}

/// An IPv6 address as `net.isIPv6` reads it: the address, with an optional `%zone`.
fn is_ipv6(text: &str) -> bool {
    match text.split_once('%') {
        Some((address, zone)) => !zone.is_empty() && Ipv6Addr::from_str(address).is_ok(),
        None => Ipv6Addr::from_str(text).is_ok(),
    }
}

/// `networkFilter` of a policy: a closed shape (a deny default and a list of exact allow rules).
fn validate_network_filter_shape(filter: &Value, label: &str) -> Result<(), ModelError> {
    let Some(filter_fields) = filter.as_object() else {
        return Err(policy_error(format!(
            "runner config ({label}) must be an object."
        )));
    };
    if let Some(key) = filter_fields
        .keys()
        .find(|key| !["defaultAction", "allow"].contains(&key.as_str()))
    {
        return Err(unknown_key(label, key));
    }
    if filter_fields.get("defaultAction").and_then(Value::as_str) != Some("deny") {
        return Err(policy_error(format!(
            "runner config ({label}) \"defaultAction\" must be \"deny\", got: {}.",
            js_json(filter_fields.get("defaultAction"))
        )));
    }
    let Some(allow) = filter_fields.get("allow").and_then(Value::as_array) else {
        return Err(policy_error(format!(
            "runner config ({label}) \"allow\" must be an array of allowlist rules."
        )));
    };

    let mut seen_rules: Vec<String> = Vec::new();
    for (index, rule) in allow.iter().enumerate() {
        let rule_label = format!("{label}.allow[{index}]");
        let Some(rule_fields) = rule.as_object() else {
            return Err(policy_error(format!(
                "runner config ({rule_label}) must be an object."
            )));
        };
        if let Some(key) = rule_fields
            .keys()
            .find(|key| !["protocol", "destination", "ports"].contains(&key.as_str()))
        {
            return Err(unknown_key(&rule_label, key));
        }
        let protocol = rule_fields.get("protocol").and_then(Value::as_str);
        if protocol != Some("tcp") && protocol != Some("udp") {
            return Err(policy_error(format!(
                "runner config ({rule_label}) \"protocol\" must be \"tcp\" or \"udp\", got: {}.",
                js_json(rule_fields.get("protocol"))
            )));
        }
        let Some(destination) = rule_fields.get("destination").and_then(Value::as_object) else {
            return Err(policy_error(format!(
                "runner config ({rule_label}) \"destination\" must be an object."
            )));
        };
        let destination_label = format!("{rule_label}.destination");
        if let Some(key) = destination
            .keys()
            .find(|key| !["kind", "value"].contains(&key.as_str()))
        {
            return Err(unknown_key(&destination_label, key));
        }
        let kind = destination.get("kind").and_then(Value::as_str);
        if kind != Some("dns") && kind != Some("cidr") {
            return Err(policy_error(format!(
                "runner config ({destination_label}) \"kind\" must be \"dns\" or \"cidr\", got: {}.",
                js_json(destination.get("kind"))
            )));
        }
        if !is_filled(destination.get("value")) {
            return Err(policy_error(format!(
                "runner config ({destination_label}) \"value\" must be a non-empty string."
            )));
        }
        let mut destination_value = destination["value"]
            .as_str()
            .unwrap_or_default()
            .to_string();
        // DNS is an exact normalized name, never a wildcard.
        if kind == Some("dns") && destination_value.contains('*') {
            return Err(policy_error(format!(
                "runner config ({destination_label}) DNS destination \"{destination_value}\" must not contain wildcard \"*\"."
            )));
        }
        if kind == Some("cidr") {
            destination_value = canonicalize_cidr(&destination_value, &destination_label)?;
        }

        let Some(ports) = rule_fields
            .get("ports")
            .and_then(Value::as_array)
            .filter(|ports| !ports.is_empty())
        else {
            return Err(policy_error(format!(
                "runner config ({rule_label}) \"ports\" must be a non-empty array of port numbers."
            )));
        };
        let mut seen_ports: Vec<f64> = Vec::new();
        for port in ports {
            let Some(number) = js_integer(port).filter(|n| (1.0..=65535.0).contains(n)) else {
                return Err(policy_error(format!(
                    "runner config ({rule_label}) port {} must be an integer between 1 and 65535.",
                    js_json(Some(port))
                )));
            };
            if seen_ports.contains(&number) {
                return Err(policy_error(format!(
                    "runner config ({rule_label}) duplicate port {} in allowlist.",
                    js_display(Some(port))
                )));
            }
            seen_ports.push(number);
        }
        seen_ports.sort_by(f64::total_cmp);
        let fingerprint = format!(
            "{}:{}:{destination_value}:{}",
            protocol.unwrap_or_default(),
            kind.unwrap_or_default(),
            seen_ports
                .iter()
                .map(|n| format!("{n:.0}"))
                .collect::<Vec<_>>()
                .join(",")
        );
        if seen_rules.contains(&fingerprint) {
            return Err(policy_error(format!(
                "runner config ({rule_label}) duplicate allow rule entry."
            )));
        }
        seen_rules.push(fingerprint);
    }
    Ok(())
}

/// A confinement policy declared in `runner.confinementPolicies`: a closed shape of controls, grants and, for a
/// filtered network, the filter.
fn validate_confinement_policy_shape(policy: &Value, label: &str) -> Result<(), ModelError> {
    let Some(fields) = policy.as_object() else {
        return Err(policy_error(format!(
            "runner config ({label}) must be an object."
        )));
    };
    const ALLOWED_KEYS: [&str; 4] = ["contract", "controls", "grants", "networkFilter"];
    if let Some(key) = fields
        .keys()
        .find(|key| !ALLOWED_KEYS.contains(&key.as_str()))
    {
        return Err(policy_error(format!(
            "runner config ({label}) contains unknown key \"{key}\". Allowed keys: {}.",
            ALLOWED_KEYS.join(", ")
        )));
    }
    if fields.get("contract").and_then(Value::as_str) != Some("confinement-policy.v1") {
        return Err(policy_error(format!(
            "runner config ({label}) \"contract\" must be \"confinement-policy.v1\", got: {}.",
            js_json(fields.get("contract"))
        )));
    }
    let Some(controls) = fields.get("controls").and_then(Value::as_object) else {
        return Err(policy_error(format!(
            "runner config ({label}) \"controls\" must be an object."
        )));
    };
    let axis_names: Vec<&str> = CONTROL_AXES.iter().map(|(name, _)| *name).collect();
    if let Some(key) = controls
        .keys()
        .find(|key| !axis_names.contains(&key.as_str()))
    {
        return Err(policy_error(format!(
            "runner config ({label}.controls) contains unknown control \"{key}\". Allowed controls: {}.",
            axis_names.join(", ")
        )));
    }
    for (name, legal) in CONTROL_AXES {
        let Some(value) = controls.get(name) else {
            return Err(policy_error(format!(
                "runner config ({label}.controls) is missing required control \"{name}\"."
            )));
        };
        if !value.as_str().is_some_and(|text| legal.contains(&text)) {
            return Err(policy_error(format!(
                "runner config ({label}.controls.{name}) must be one of {}, got: {}.",
                legal.join("/"),
                js_json(Some(value))
            )));
        }
    }
    let Some(grants) = fields.get("grants").and_then(Value::as_array) else {
        return Err(policy_error(format!(
            "runner config ({label}) \"grants\" must be an array."
        )));
    };
    let mut seen_resources: Vec<&str> = Vec::new();
    for (index, grant) in grants.iter().enumerate() {
        let grant_label = format!("{label}.grants[{index}]");
        let Some(grant_fields) = grant.as_object() else {
            return Err(policy_error(format!(
                "runner config ({grant_label}) must be an object."
            )));
        };
        const ALLOWED_GRANT_KEYS: [&str; 4] = ["resource", "access", "scope", "optional"];
        if let Some(key) = grant_fields
            .keys()
            .find(|key| !ALLOWED_GRANT_KEYS.contains(&key.as_str()))
        {
            return Err(policy_error(format!(
                "runner config ({grant_label}) contains unknown key \"{key}\". Allowed keys: {}.",
                ALLOWED_GRANT_KEYS.join(", ")
            )));
        }
        if !is_filled(grant_fields.get("resource")) {
            return Err(policy_error(format!(
                "runner config ({grant_label}) \"resource\" must be a non-empty string."
            )));
        }
        let resource = grant_fields["resource"].as_str().unwrap_or_default();
        if seen_resources.contains(&resource) {
            return Err(policy_error(format!(
                "runner config ({grant_label}) duplicate resource grant for \"{resource}\"."
            )));
        }
        seen_resources.push(resource);
        if !grant_fields
            .get("access")
            .and_then(Value::as_str)
            .is_some_and(|access| GRANT_ACCESS_LEVELS.contains(&access))
        {
            return Err(policy_error(format!(
                "runner config ({grant_label}) \"access\" must be one of {}, got: {}.",
                GRANT_ACCESS_LEVELS.join("/"),
                js_json(grant_fields.get("access"))
            )));
        }
        if grant_fields.get("scope").and_then(Value::as_str) != Some("dispatch") {
            return Err(policy_error(format!(
                "runner config ({grant_label}) \"scope\" must be \"dispatch\", got: {}.",
                js_json(grant_fields.get("scope"))
            )));
        }
        if grant_fields
            .get("optional")
            .is_some_and(|flag| !flag.is_boolean())
        {
            return Err(policy_error(format!(
                "runner config ({grant_label}) \"optional\" must be a boolean when present."
            )));
        }
    }
    if controls.get("networkEgress").and_then(Value::as_str) == Some("filtered") {
        let Some(filter) = fields.get("networkFilter") else {
            return Err(policy_error(format!(
                "runner config ({label}) \"networkFilter\" is required when networkEgress is \"filtered\"."
            )));
        };
        validate_network_filter_shape(filter, &format!("{label}.networkFilter"))?;
    } else if fields.contains_key("networkFilter") {
        return Err(policy_error(format!(
            "runner config ({label}) \"networkFilter\" is only permitted when networkEgress is \"filtered\"."
        )));
    }
    Ok(())
}

/// The `confinement` of one capability: a mode, and for a confined mode the policy it names.
fn validate_capability_confinement_shape(
    confinement: &Value,
    label: &str,
) -> Result<(), ModelError> {
    let Some(fields) = confinement.as_object() else {
        return Err(policy_error(format!(
            "runner config ({label}) must be an object."
        )));
    };
    let mode = fields.get("mode");
    let Some(mode_name) = mode
        .and_then(Value::as_str)
        .filter(|name| CONFINEMENT_MODES.contains(name))
    else {
        return Err(policy_error(format!(
            "runner config ({label}) \"mode\" must be one of {}, got: {}.",
            CONFINEMENT_MODES.join("/"),
            js_json(mode)
        )));
    };
    if mode_name == "unconfined" {
        if let Some(key) = fields
            .keys()
            .find(|key| !["mode", "allowInvocationOverride"].contains(&key.as_str()))
        {
            return Err(policy_error(format!(
                "runner config ({label}) contains disallowed key \"{key}\" for mode \"unconfined\"."
            )));
        }
        if fields
            .get("allowInvocationOverride")
            .is_some_and(|flag| flag != &Value::Bool(false))
        {
            return Err(policy_error(format!(
                "runner config ({label}) \"allowInvocationOverride\" must be false or omitted when mode is \"unconfined\"."
            )));
        }
        if fields.contains_key("policy") {
            return Err(policy_error(format!(
                "runner config ({label}) \"policy\" is forbidden when mode is \"unconfined\"."
            )));
        }
    } else {
        if let Some(key) = fields
            .keys()
            .find(|key| !["mode", "policy", "allowInvocationOverride"].contains(&key.as_str()))
        {
            return Err(unknown_key(label, key));
        }
        if !is_filled(fields.get("policy")) {
            return Err(policy_error(format!(
                "runner config ({label}) \"policy\" must be a non-empty string when mode is \"{mode_name}\"."
            )));
        }
        if fields
            .get("allowInvocationOverride")
            .is_some_and(|flag| !flag.is_boolean())
        {
            return Err(policy_error(format!(
                "runner config ({label}) \"allowInvocationOverride\" must be a boolean when present."
            )));
        }
    }
    Ok(())
}

/// The confinement rules that compare a capability with the policies and the strict flag.
fn check_confinement_against_policies(runner: &Value, source_label: &str) -> Check {
    let strict = runner
        .get("confinement")
        .and_then(|section| section.get("strict"))
        == Some(&Value::Bool(true));
    let policies = runner.get("confinementPolicies").and_then(Value::as_object);
    for (policy_id, policy_doc) in fields_of(runner.get("confinementPolicies")) {
        if BUILTIN_POLICY_IDS.contains(&policy_id.as_str()) {
            return Err(RunnerCheckError::config(format!(
                "runner config ({source_label}.confinementPolicies) cannot redefine built-in policy \"{policy_id}\"."
            )));
        }
        validate_confinement_policy_shape(
            policy_doc,
            &format!("{source_label} confinementPolicies.{policy_id}"),
        )?;
    }
    let names: Vec<&String> = fields_of(runner.get("capabilities"))
        .map(|(name, _)| name)
        .collect();
    for name in &names {
        let confinement = capability_confinement(runner, name);
        let mode = confinement
            .and_then(|c| c.get("mode"))
            .and_then(Value::as_str);
        if mode == Some("required") || (strict && mode == Some("preferred")) {
            let policy_id = confinement.and_then(|c| c.get("policy"));
            let known = policy_id.and_then(Value::as_str).is_some_and(|id| {
                BUILTIN_POLICY_IDS.contains(&id) || policies.is_some_and(|all| all.contains_key(id))
            });
            if !known {
                let shown = js_display(policy_id);
                return Err(RunnerCheckError::config(if strict {
                    format!("runner config ({source_label} capabilities.{name}) references unknown policy \"{shown}\" in strict mode (confinement-policy-missing).")
                } else {
                    format!("runner config ({source_label} capabilities.{name}) mode \"required\" references unknown policy \"{shown}\".")
                }));
            }
        }
    }
    if !strict {
        return Ok(());
    }
    if names.is_empty() {
        return Err(RunnerCheckError::config(format!(
            "runner config ({source_label}) strict mode requires explicit capabilities declared (confinement-policy-missing)."
        )));
    }
    for name in names {
        let declared = capability_confinement(runner, name)
            .and_then(|c| c.get("mode"))
            .is_some_and(|mode| js_truthy(Some(mode)));
        if !declared {
            return Err(RunnerCheckError::config(format!(
                "runner config ({source_label} capabilities.{name}) missing required explicit confinement in strict mode (confinement-policy-missing)."
            )));
        }
    }
    Ok(())
}

/// Project config cannot define or override the machine's backend instances.
fn reject_project_backend_override(runner: &Value, source_label: &str) -> Check {
    if runner.get("confinementBackends").is_some()
        || runner
            .get("runner")
            .is_some_and(|inner| inner.get("confinementBackends").is_some())
    {
        return Err(ModelError::confinement_backend_registry(format!(
            "runner config ({source_label}) cannot define or override \"confinementBackends\" \u{2014} machine backend instance deployment config is managed at the machine level (confinement-backend-registry-forbidden)."
        ))
        .into());
    }
    Ok(())
}

// ---- executors -------------------------------------------------------------------------------------------

const CONFINEMENT_FLAGS: [&str; 3] = ["privateHome", "isolatedSession", "ownWorktree"];

/// Why a runner-level key is gone: no schema node describes it, so only a refusal can say what replaces it.
const REMOVED_RUNNER_KEYS: [(&str, &str); 4] = [
    ("readOnlyExecutorRedirects", "read-only posture is enforced by OS confinement; delete the key."),
    ("placementPolicy", "read-only posture is enforced by OS confinement; delete the key."),
    ("models", "use \"modelPolicies.<provider>.<tier>\" instead."),
    ("rigorToTier", "rigor no longer chooses a tier; delete the key and declare \"tier\" per capability, role, persona or seat."),
];

const LAUNCH_FIELD_WHY: &str = "Declare it on the invocation that launches (executors.<id>.invocations[]), the one place a launch field lives.";

/// Declarations of an executor entry that no longer mean anything, and why, in the order they are checked.
const REMOVED_EXECUTOR_FIELDS: [(&str, &str); 12] = [
    ("receipt", "It had one legal value and no reader anywhere in the repo. The rule it stood for -- a round concludes only from a file the receiver wrote -- is not configurable and never was; it is what the herdr round does unconditionally."),
    ("trustStore", "Declare it on \"interactiveMode\" instead, which is where the adapter reads it. It used to be declared at the executor level and read from interactiveMode, so its one validated kind guarded a field nothing consulted."),
    ("command", LAUNCH_FIELD_WHY),
    ("args", LAUNCH_FIELD_WHY),
    ("adapter", LAUNCH_FIELD_WHY),
    ("env", LAUNCH_FIELD_WHY),
    ("permissionMode", LAUNCH_FIELD_WHY),
    ("promptDelivery", LAUNCH_FIELD_WHY),
    ("interactiveMode", LAUNCH_FIELD_WHY),
    ("liveOutput", LAUNCH_FIELD_WHY),
    ("resourceBindings", LAUNCH_FIELD_WHY),
    ("readOnlyRedirect", "readOnlyRedirect was retired. Read-only posture is enforced by OS confinement (Phase 6)."),
];

const RIGOR_OVERRIDES_WHY: &str =
    "express per-tier models in runner.modelPolicies.<family> instead.";

/// Why `credentialStore` is not a valid declaration, or None when it is.
fn credential_store_problem(store: &Value) -> Option<String> {
    const KEYS: [&str; 4] = ["use", "homeEnv", "files", "sessionDir"];
    let Some(fields) = store.as_object() else {
        return Some("must be an object {use, homeEnv, files?, sessionDir?}".to_string());
    };
    if let Some(key) = fields.keys().find(|key| !KEYS.contains(&key.as_str())) {
        return Some(format!(
            "contains unknown key \"{key}\" (allowed: {})",
            KEYS.join(", ")
        ));
    }
    if !fields
        .get("use")
        .and_then(Value::as_str)
        .is_some_and(is_cli_key)
    {
        return Some(
            "\"use\" must name a login store, a lowercase key such as \"codex\" or \"pi\""
                .to_string(),
        );
    }
    let env_name = fields
        .get("homeEnv")
        .and_then(Value::as_str)
        .is_some_and(|name| {
            let mut chars = name.chars();
            chars
                .next()
                .is_some_and(|c| c.is_ascii_alphabetic() || c == '_')
                && chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
        });
    if !env_name {
        return Some("\"homeEnv\" must be an environment variable name".to_string());
    }
    if let Some(files) = fields.get("files") {
        let list = files.as_array().filter(|list| {
            !list.is_empty()
                && list.iter().all(|f| {
                    f.as_str()
                        .is_some_and(|f| !js_trim(f).is_empty() && is_inside(f))
                })
        });
        let Some(list) = list else {
            return Some(
                "\"files\" must be a non-empty list of relative paths without \"..\"".to_string(),
            );
        };
        if list
            .iter()
            .enumerate()
            .any(|(i, file)| list[..i].contains(file))
        {
            return Some("\"files\" must not repeat a path".to_string());
        }
    }
    if let Some(dir) = fields.get("sessionDir") {
        if !dir
            .as_str()
            .is_some_and(|d| !js_trim(d).is_empty() && is_inside(d))
        {
            return Some("\"sessionDir\" must be a relative path without \"..\"".to_string());
        }
    }
    None
}

/// `permissionMode: "bypass"` hands the worker an agent that will not ask before acting, which is only
/// defensible when the worker is confined. The refusal names the missing flag.
fn check_bypass_is_confined(
    invocation: &Value,
    label: &str,
    executor_confinement: Option<&Value>,
) -> Check {
    if str_of(invocation, "permissionMode") != Some("bypass") {
        return Ok(());
    }
    let empty = Value::Object(Map::new());
    let confinement = present(invocation, "confinement")
        .or(executor_confinement.filter(|c| !c.is_null()))
        .unwrap_or(&empty);
    let controls = |key: &str| {
        confinement
            .get("controls")
            .and_then(|c| c.get(key))
            .and_then(Value::as_str)
    };
    let present_flags = [
        confinement.get("privateHome") == Some(&Value::Bool(true))
            || controls("home") == Some("private"),
        confinement.get("isolatedSession") == Some(&Value::Bool(true))
            || controls("session") == Some("isolated"),
        confinement.get("ownWorktree") == Some(&Value::Bool(true))
            || controls("workspace") == Some("own"),
    ];
    let missing: Vec<&str> = CONFINEMENT_FLAGS
        .iter()
        .zip(present_flags)
        .filter(|(_, present)| !present)
        .map(|(flag, _)| *flag)
        .collect();
    if missing.is_empty() {
        return Ok(());
    }
    Err(RunnerCheckError::config(format!(
        "runner config ({label}) declares \"permissionMode\": \"bypass\" without full confinement -- missing {}. A worker that never asks before acting is only defensible when it is confined, so bypass requires {} to all be true.",
        missing.join(", "),
        CONFINEMENT_FLAGS.join(", ")
    )))
}

/// The rules of one invocation that read beyond its own fields: its tools against the catalog, its store against
/// the confinement.
fn check_invocation(
    runner: &Value,
    invocation: &Value,
    label: &str,
    executor_confinement: Option<&Value>,
    canonical_path: &str,
) -> Check {
    if invocation.get("resourceBindings").is_some() {
        let detail = "\"resourceBindings\" was removed. Declare the login store the invocation reads as \"credentialStore\": { \"use\": <cli>, \"homeEnv\": <variable> }.".to_string();
        return Err(RunnerCheckError::at_path(
            format!("runner config ({label}) {detail}"),
            format!("{canonical_path}.resourceBindings"),
            detail,
        ));
    }
    check_bypass_is_confined(invocation, label, executor_confinement)?;
    if str_of(invocation, "via") == Some("mcp") {
        for capability in fields_of(present(invocation, "tools")).map(|(name, _)| name) {
            if !is_registered(runner, &Value::String(capability.clone())) {
                return Err(RunnerCheckError::config(format!(
                    "runner config ({label}) \"tools\" key \"{capability}\" is not declared in \"capabilities\" \u{2014} add it there first."
                )));
            }
        }
    }
    if let Some(store) = invocation.get("credentialStore") {
        if let Some(problem) = credential_store_problem(store) {
            return Err(RunnerCheckError::config(format!(
                "runner config ({label}) \"credentialStore\" {problem}."
            )));
        }
        let confinement =
            present(invocation, "confinement").or(executor_confinement.filter(|c| !c.is_null()));
        if str_of(invocation, "via") != Some("cli")
            || !js_truthy(confinement.and_then(|c| c.get("backend")))
        {
            return Err(RunnerCheckError::config(format!(
                "runner config ({label}) declares \"credentialStore\" without a confinement backend. A store is handed to the launch through its private home, so only a confined \"cli\" invocation can read one; an unconfined invocation reads its store through \"env\"."
            )));
        }
    }
    Ok(())
}

/// The rules of one `executors.<id>` entry that read beyond its own fields.
fn check_executor_entry(runner: &Value, executor: &Value, label: &str, executor_id: &str) -> Check {
    let removed = REMOVED_EXECUTOR_FIELDS
        .iter()
        .copied()
        .chain([("rigorOverrides", RIGOR_OVERRIDES_WHY)]);
    for (field, why) in removed {
        if executor.get(field).is_some() {
            let detail = format!("\"{field}\" was removed. {why}");
            return Err(RunnerCheckError::at_path(
                format!("runner config ({label}) {detail}"),
                format!("runner.executors.{executor_id}.{field}"),
                detail,
            ));
        }
    }
    // `for` describes `kind: "tool"` executors; on an agent it is inert and `fgos doctor` names it.
    if let Some(purposes) = executor.get("for").and_then(Value::as_array) {
        for purpose in purposes {
            if !is_registered(runner, purpose) {
                return Err(RunnerCheckError::config(format!(
                    "runner config ({label}) \"for\" entry \"{}\" is not declared in \"capabilities\" \u{2014} add it there first.",
                    js_display(Some(purpose))
                )));
            }
        }
    }
    let mut seen_ids: Vec<&Value> = Vec::new();
    let invocations = executor.get("invocations").and_then(Value::as_array);
    for (index, invocation) in invocations.into_iter().flatten().enumerate() {
        check_invocation(
            runner,
            invocation,
            &format!("{label} invocations[{index}]"),
            executor.get("confinement"),
            &format!("runner.executors.{executor_id}.invocations[{index}]"),
        )?;
        let Some(id) = invocation.get("id") else {
            continue;
        };
        if seen_ids.contains(&id) {
            return Err(RunnerCheckError::config(format!(
                "runner config ({label}) \"invocations\" declares \"id\": \"{}\" more than once \u{2014} each invocation id must be unique within one executor.",
                js_display(Some(id))
            )));
        }
        seen_ids.push(id);
    }
    Ok(())
}

/// Advisory, load-time: an executor that declares neither `providerModel` nor `provider`, and whose `via:"cli"`
/// invocation yields no usable command, has no reliable way to name its provider family. Never a refusal.
fn provider_family_warning(executor_id: &str, executor: &Value) -> Option<String> {
    if executor.get("providerModel").is_some() || executor.get("provider").is_some() {
        return None;
    }
    let invocations = executor.get("invocations").and_then(Value::as_array);
    // Every declared invocation being non-CLI (mcp only) needs no command.
    if invocations.is_some_and(|list| {
        !list.is_empty() && list.iter().all(|inv| str_of(inv, "via") != Some("cli"))
    }) {
        return None;
    }
    let cli_command = invocations
        .and_then(|list| list.iter().find(|inv| str_of(inv, "via") == Some("cli")))
        .and_then(|inv| inv.get("command"))
        .and_then(Value::as_str);
    if cli_command.is_some_and(|command| !js_trim(command).is_empty()) {
        return None;
    }
    Some(format!(
        "fgos: executor \"{executor_id}\" declares no \"providerModel\"/\"provider\" and no invocation yields a command \u{2014} its resolved provider family may be unreliable/inconsistent across dispatch code paths. Declare \"providerModel\" explicitly."
    ))
}

/// What a prefer site names must exist: the executor, and the invocation id when it pins one.
fn check_prefer_targets(runner: &Value, source_label: &str) -> Check {
    for (prefer, site) in prefer_sites(runner) {
        let site_name = format!("{source_label} {site}");
        // A single id or object is a list of one; a list holds ids and `{executor, invocation}` pins.
        let candidates: Vec<&Value> = match prefer {
            Value::Array(list) => list.iter().collect(),
            single => vec![single],
        };
        for candidate in candidates {
            let (executor, invocation) = match candidate {
                Value::String(_) => (Some(candidate), None),
                other => (other.get("executor"), other.get("invocation")),
            };
            let named = js_display(executor);
            let registered = executor
                .map(|id| match id {
                    Value::String(key) => key.clone(),
                    other => js_display(Some(other)),
                })
                .and_then(|key| runner.get("executors").and_then(|all| all.get(&key)))
                .filter(|entry| js_truthy(Some(entry)));
            let Some(registered) = registered else {
                return Err(RunnerCheckError::config(format!(
                    "runner config ({site_name}) \"prefer\" names \"{named}\" but no such executor is registered."
                )));
            };
            if let Some(invocation) = invocation {
                let declared = registered
                    .get("invocations")
                    .and_then(Value::as_array)
                    .is_some_and(|list| list.iter().any(|inv| inv.get("id") == Some(invocation)));
                if !declared {
                    return Err(RunnerCheckError::config(format!(
                        "runner config ({site_name}) \"prefer\" names invocation \"{}\" on executor \"{named}\" but no such invocation id is declared on it.",
                        js_display(Some(invocation))
                    )));
                }
            }
        }
    }
    Ok(())
}

/// A persona is named by the bare name inside its `agent.<name>.yaml`, under Convention's agent-name rule.
fn persona_name_is_valid(name: &str) -> bool {
    let rules = packaged_rules();
    rules
        .definition_file("agent-file")
        .and_then(|file| rules.identifier(&file.name_identifier))
        .is_some_and(|rule| rule.check(name).is_ok())
}

fn check_persona_names(runner: &Value, source_label: &str) -> Check {
    for (key, _) in taste_scopes(runner, "personas") {
        if !persona_name_is_valid(key) {
            return Err(RunnerCheckError::config(format!(
                "runner config ({source_label} personas) key {} must be a persona name (a lowercase letter, then lowercase letters, digits or \"-\").",
                js_json(Some(&Value::String(key.clone())))
            )));
        }
    }
    Ok(())
}

// ---- patterns and loops ----------------------------------------------------------------------------------

/// Where a refusal about `runner.patterns` or `runner.loops` points: the label its text shows and the canonical
/// config path it names.
struct Site<'a> {
    label: &'a str,
    canonical_prefix: &'a str,
}

impl Site<'_> {
    fn fail(&self, rel_path: &str, detail: &str, code: Option<&'static str>) -> RunnerCheckError {
        let path = if rel_path.is_empty() {
            self.canonical_prefix.to_string()
        } else {
            format!("{}.{rel_path}", self.canonical_prefix)
        };
        let shown = if rel_path.is_empty() {
            self.label.to_string()
        } else {
            format!("{}.{rel_path}", self.label)
        };
        let mut error = ModelError::runner(format!("runner config ({shown}) {detail}"));
        error.code = code;
        RunnerCheckError {
            error,
            paths: vec![path.clone()],
            path: Some(path),
            detail: Some(detail.to_string()),
        }
    }

    /// A refusal that names two paths: the text shows their common dotted parent.
    fn fail_across(&self, rel_paths: [&str; 2], detail: &str) -> RunnerCheckError {
        let parent = common_dotted_parent(rel_paths);
        let shown = if parent.is_empty() {
            self.label.to_string()
        } else {
            format!("{}.{parent}", self.label)
        };
        RunnerCheckError {
            error: ModelError::runner(format!("runner config ({shown}) {detail}")),
            path: None,
            paths: rel_paths
                .iter()
                .map(|rel| {
                    if rel.is_empty() {
                        self.canonical_prefix.to_string()
                    } else {
                        format!("{}.{rel}", self.canonical_prefix)
                    }
                })
                .collect(),
            detail: Some(detail.to_string()),
        }
    }
}

/// The leading dotted segments two paths share.
fn common_dotted_parent(paths: [&str; 2]) -> String {
    paths[0]
        .split('.')
        .zip(paths[1].split('.'))
        .take_while(|(a, b)| a == b)
        .map(|(a, _)| a)
        .collect::<Vec<_>>()
        .join(".")
}

const RETIRED_GATED_NAME: &str = "research-fan-out-gated";

/// Retired `runner.patterns` keys as a dotted path under `patterns`, and the instruction that replaces each.
const RETIRED_PATTERN_KEYS: [(&str, &str); 4] = [
    ("defaultRule", "delete the key"),
    (
        "reviewed.maxRounds",
        "use runner.loops.reviewed.maxRounds instead",
    ),
    (
        "reviewed.checkersByRigor",
        "use runner.loops.reviewed.checkersByRigor instead",
    ),
    (
        RETIRED_GATED_NAME,
        "use runner.patterns.research-fan-out instead",
    ),
];

/// Names that cannot name a pattern.
const RESERVED_PATTERN_NAMES: [&str; 2] = ["seatBinding", "defaultRule"];

/// The roles a declared seat may take.
const SEAT_ROLES: [&str; 5] = ["producer", "synthesizer", "reviewer", "red-team", "judge"];

/// The seat ids the runner writes results for itself, refused with their own code.
const RESERVED_SEAT_IDS: [&str; 2] = ["verify", "verifier"];

/// A declared seat the check refuses: Seat Resolver's stable code, where it sits relative to the list, and why.
struct SeatProblem {
    code: &'static str,
    at: String,
    detail: String,
}

/// Why `seat` is not a seat id under Convention's rule, in the words Node's seat id check gives.
fn seat_id_problem(seat: Option<&Value>) -> Option<String> {
    let rule = packaged_rules()
        .identifier("seat-id")
        .expect("the packaged convention rules carry the seat-id rule");
    let verdict = match seat.and_then(Value::as_str) {
        Some(text) => rule.check(text),
        None => Err("invalid-identifier"),
    };
    match verdict {
        Ok(()) => None,
        Err("reserved-identifier") => Some(format!(
            "\"{}\" is reserved ({})",
            js_display(seat),
            rule.reserved.join(", ")
        )),
        Err(_) => Some(format!(
            "{} must be 1-{} characters: a lowercase letter, then lowercase letters, digits or \"-\"",
            js_json(seat),
            rule.max_length
        )),
    }
}

/// A declared seat list (`[{ seat, role, persona? }]`): the rules Seat Resolver applies to declared seats.
fn check_declared_seats(raw: &Value) -> Result<(), SeatProblem> {
    let problem =
        |code: &'static str, at: String, detail: String| Err(SeatProblem { code, at, detail });
    let Some(seats) = raw.as_array().filter(|list| !list.is_empty()) else {
        return problem(
            "invalid-seats",
            String::new(),
            "must be a non-empty array of { seat, role }".into(),
        );
    };
    let mut seen: Vec<&str> = Vec::new();
    for (index, entry) in seats.iter().enumerate() {
        let Some(fields) = entry.as_object() else {
            return problem(
                "invalid-seats",
                format!("[{index}]"),
                "must be an object { seat, role, persona?, tier? }".into(),
            );
        };
        if let Some(key) = fields
            .keys()
            .find(|key| !["seat", "role", "persona", "tier"].contains(&key.as_str()))
        {
            return problem(
                "invalid-seats",
                format!("[{index}].{key}"),
                format!(
                    "has unknown key \"{key}\"; a seat declares only seat, role, persona and tier"
                ),
            );
        }
        let seat = fields.get("seat");
        let seat_name = seat.and_then(Value::as_str);
        if let Some(name) = seat_name.filter(|name| RESERVED_SEAT_IDS.contains(name)) {
            return problem(
                "param-invalid",
                format!("[{index}].seat"),
                format!(
                    "\"{name}\" is a reserved seat id; reserved: [{}]",
                    RESERVED_SEAT_IDS.join(", ")
                ),
            );
        }
        if let Some(detail) = seat_id_problem(seat) {
            return problem("invalid-seat-id", format!("[{index}].seat"), detail);
        }
        let name = seat_name.unwrap_or_default();
        if seen.contains(&name) {
            return problem(
                "duplicate-seat",
                format!("[{index}].seat"),
                format!("\"{name}\" is declared twice in this unit"),
            );
        }
        seen.push(name);
        let role = fields.get("role");
        if !role
            .and_then(Value::as_str)
            .is_some_and(|r| SEAT_ROLES.contains(&r))
        {
            return problem(
                "invalid-seat-role",
                format!("[{index}].role"),
                format!(
                    "must be one of [{}], got {}",
                    SEAT_ROLES.join(", "),
                    js_json(role)
                ),
            );
        }
        if fields.get("persona").is_some() && !is_filled(fields.get("persona")) {
            return problem(
                "invalid-seats",
                format!("[{index}].persona"),
                "must be a non-empty string".into(),
            );
        }
    }
    Ok(())
}

/// The rules of `runner.patterns` that read beyond its own fields: a retired key says what replaced it, a
/// reserved name cannot name a pattern, and a declared seat list is Seat Resolver's to judge.
fn validate_runner_patterns_shape(patterns: &Value, label: &str) -> Check {
    let site = Site {
        label,
        canonical_prefix: "runner.patterns",
    };
    let retired: Vec<(String, &str)> = RETIRED_PATTERN_KEYS
        .iter()
        .filter(|(dotted, _)| {
            let mut current = patterns;
            let segments: Vec<&str> = dotted.split('.').collect();
            segments.iter().all(|segment| match current {
                Value::Object(fields) => match fields.get(*segment) {
                    Some(next) => {
                        current = next;
                        true
                    }
                    None => false,
                },
                _ => false,
            })
        })
        .map(|(dotted, instruction)| (format!("runner.patterns.{dotted}"), *instruction))
        .collect();
    if !retired.is_empty() {
        let mut messages: Vec<String> = Vec::new();
        for (key, instruction) in &retired {
            let message = format!("runner config ({label}): {key} was retired; {instruction}.");
            if !messages.contains(&message) {
                messages.push(message);
            }
        }
        let joined = messages.join("\n");
        let mut error = ModelError::runner(joined.clone());
        error.code = Some("config-key-retired");
        return Err(RunnerCheckError {
            error,
            path: None,
            paths: retired.into_iter().map(|(key, _)| key).collect(),
            detail: Some(joined),
        });
    }
    for (name, entry) in fields_of(Some(patterns)) {
        if name == "seatBinding" {
            continue;
        }
        if RESERVED_PATTERN_NAMES.contains(&name.as_str()) {
            return Err(site.fail(
                name,
                &format!("uses reserved name \"{name}\" as a pattern name."),
                None,
            ));
        }
        let Some(seats) = entry
            .get("defaults")
            .and_then(|defaults| defaults.get("seats"))
        else {
            continue;
        };
        if let Err(seat) = check_declared_seats(seats) {
            return Err(site.fail(
                &format!("{name}.defaults.seats{}", seat.at),
                &seat.detail,
                Some(seat.code),
            ));
        }
    }
    Ok(())
}

/// The rigors, weakest first.
const RIGOR_VALUES: [&str; 4] = ["low", "standard", "high", "critical"];

/// The integer parameters of each loop's parameter table (the loop modules declare them as code; only
/// `reviewed` reads an integer, its round limit). A bound may name only a parameter listed here.
fn integer_params_of(loop_name: &str) -> &'static [&'static str] {
    match loop_name {
        "reviewed" => &["maxRounds"],
        _ => &[],
    }
}

/// The rules of `runner.loops` that read beyond its own fields: a bound names a parameter its loop reads, `min`
/// does not exceed `max`, and the checkers of each rigor include those of every weaker rigor.
fn validate_runner_loops_shape(loops: &Value, label: &str) -> Check {
    let site = Site {
        label,
        canonical_prefix: "runner.loops",
    };
    for (loop_name, loop_entry) in fields_of(Some(loops)) {
        if let Some(by_rigor) = loop_entry.get("checkersByRigor").and_then(Value::as_object) {
            let ordered: Vec<&str> = RIGOR_VALUES
                .iter()
                .copied()
                .filter(|rigor| by_rigor.contains_key(*rigor))
                .collect();
            for pair in ordered.windows(2) {
                let (weaker, stronger) = (pair[0], pair[1]);
                let stronger_list = by_rigor[stronger].as_array();
                for checker in by_rigor[weaker].as_array().into_iter().flatten() {
                    if !stronger_list.is_some_and(|list| list.contains(checker)) {
                        return Err(site.fail_across(
                            [
                                &format!("reviewed.checkersByRigor.{weaker}"),
                                &format!("reviewed.checkersByRigor.{stronger}"),
                            ],
                            &format!(
                                "is not cumulative: \"{stronger}\" does not include checker \"{}\" from weaker rigor \"{weaker}\".",
                                js_display(Some(checker))
                            ),
                        ));
                    }
                }
            }
        }
        let readable = integer_params_of(loop_name);
        for (param, bound) in fields_of(loop_entry.get("bounds")) {
            if !readable.contains(&param.as_str()) {
                return Err(site.fail(
                    &format!("{loop_name}.bounds.{param}"),
                    &format!("is not a parameter read by the \"{loop_name}\" loop."),
                    None,
                ));
            }
            let (min, max) = (bound.get("min"), bound.get("max"));
            if let (Some(low), Some(high)) =
                (min.and_then(Value::as_f64), max.and_then(Value::as_f64))
            {
                if low > high {
                    return Err(site.fail_across(
                        [
                            &format!("{loop_name}.bounds.{param}.min"),
                            &format!("{loop_name}.bounds.{param}.max"),
                        ],
                        &format!(
                            "min ({}) must be <= max ({}).",
                            js_display(min),
                            js_display(max)
                        ),
                    ));
                }
            }
        }
    }
    Ok(())
}

// ---- generated paths -------------------------------------------------------------------------------------

/// One write-scope entry in its canonical spelling, or the refusal in the words of Node's write-scope reader.
/// `./docs`, `docs/` and `docs//` are one entry; only `*` (within a segment) and `**` (a whole segment) are glob.
fn canonicalize_write_entry(raw: &str) -> Result<String, String> {
    let trimmed = js_trim(raw);
    let show = js_json(Some(&Value::String(raw.to_string())));
    if trimmed.starts_with('/') {
        return Err(format!(
            "write entry must be repo-relative, got absolute path {show}."
        ));
    }
    if trimmed.contains(['\\', '\0']) {
        return Err(format!(
            "write entry must not contain a backslash or NUL byte, got: {show}."
        ));
    }
    let mut segments: Vec<&str> = Vec::new();
    for segment in trimmed.split('/').filter(|s| !s.is_empty() && *s != ".") {
        // Consecutive `**` say nothing more than one, and each extra one multiplies matching work.
        if segment == "**" && segments.last() == Some(&"**") {
            continue;
        }
        segments.push(segment);
    }
    if segments.is_empty() {
        return Err(format!(
            "write entry must name a path inside the repo, got: {show}."
        ));
    }
    if segments.contains(&"..") {
        return Err(format!(
            "write entry must not contain a \"..\" segment, got: {show}."
        ));
    }
    if segments[0].starts_with(':') {
        return Err(format!(
            "write entry must not start with \":\" (git pathspec magic), got: {show}."
        ));
    }
    if let Some(loose) = segments.iter().find(|s| s.contains("**") && **s != "**") {
        return Err(format!(
            "\"**\" must be a whole path segment, got segment {} in {show}.",
            js_json(Some(&Value::String((*loose).to_string())))
        ));
    }
    let joined = segments.join("/");
    // `docs /` joins to `docs `; read it again so the canonical form is a fixed point.
    if joined == js_trim(&joined) {
        Ok(joined)
    } else {
        canonicalize_write_entry(&joined)
    }
}

/// The rules of `runner.generatedPaths` the schema cannot state: `from` must open with a literal directory (a
/// bare `**` or a leading glob would widen every unit's scope) and every entry must read as a write-scope entry.
fn validate_generated_paths_shape(generated: &Value, label: &str) -> Check {
    for (i, entry) in generated.as_array().into_iter().flatten().enumerate() {
        let from = entry.get("from");
        let from_text = from.and_then(Value::as_str);
        let canonical = match from_text {
            Some(text) => canonicalize_write_entry(text),
            None => Err(format!(
                "write entry must be a string, got: {}.",
                js_json(from)
            )),
        }
        .map_err(|why| {
            RunnerCheckError::config(format!(
                "runner config ({label}) generatedPaths[{i}].from: {why}"
            ))
        })?;
        if canonical
            .split('/')
            .next()
            .is_some_and(|first| first.contains('*'))
        {
            return Err(RunnerCheckError::config(format!(
                "runner config ({label}) generatedPaths[{i}].from must start with a literal directory, got {}.",
                js_json(from)
            )));
        }
        for (j, also) in entry
            .get("also")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .enumerate()
        {
            let checked = match also.as_str() {
                Some(text) => canonicalize_write_entry(text).map(|_| ()),
                None => Err(format!(
                    "write entry must be a string, got: {}.",
                    js_json(Some(also))
                )),
            };
            checked.map_err(|why| {
                RunnerCheckError::config(format!(
                    "runner config ({label}) generatedPaths[{i}].also[{j}]: {why}"
                ))
            })?;
        }
    }
    Ok(())
}

// ---- the check -------------------------------------------------------------------------------------------

/// The rules of the effective runner config that compare two fields, or a field with a catalog or registry.
/// `source_label` names where the config came from, as a refusal shows it. Ok carries the advisory warnings Node
/// prints with `console.warn` (`warnIfProviderFamilyUnreliable`), text identical, never a refusal.
pub fn check_runner_config(
    runner: &Value,
    source_label: &str,
) -> Result<Vec<String>, RunnerCheckError> {
    let mut warnings = Vec::new();
    for (key, why) in REMOVED_RUNNER_KEYS {
        if runner.get(key).is_some() {
            return Err(RunnerCheckError::config(format!(
                "runner config ({source_label}) declares retired \"{key}\": {why}"
            )));
        }
    }
    check_persona_names(runner, source_label)?;
    for (name, _) in fields_of(runner.get("capabilities")) {
        if let Some(confinement) = capability_confinement(runner, name) {
            validate_capability_confinement_shape(
                confinement,
                &format!("{source_label} capabilities.{name}.confinement"),
            )?;
        }
    }
    for (executor_id, executor) in fields_of(runner.get("executors")) {
        check_executor_entry(
            runner,
            executor,
            &format!("{source_label} executors.{executor_id}"),
            executor_id,
        )?;
        warnings.extend(provider_family_warning(executor_id, executor));
    }
    check_prefer_targets(runner, source_label)?;
    validate_provider_account_inventory(runner, source_label)?;
    if let Some(patterns) = runner.get("patterns") {
        validate_runner_patterns_shape(patterns, &format!("{source_label} patterns"))?;
    }
    if let Some(loops) = runner.get("loops") {
        validate_runner_loops_shape(loops, &format!("{source_label} loops"))?;
    }
    if let Some(generated) = runner.get("generatedPaths") {
        validate_generated_paths_shape(generated, source_label)?;
    }
    reject_project_backend_override(runner, source_label)?;
    check_confinement_against_policies(runner, source_label)?;
    Ok(warnings)
}
