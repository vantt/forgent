use serde_json::{Map, Value};

use crate::refusal::Refusal;
use crate::verdict::Class;
use crate::MAX_RULES;

pub(crate) const FLOOR: [&str; 5] = [
    "no-cycles",
    "no-dangling-edges",
    "claims-declared",
    "facts-not-truncated",
    "no-exclusion-in-one-layer",
];

/// A non-floor check the ruleset chose, with its class and parameter.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct Rule {
    pub check: &'static str,
    pub class: Class,
    pub max: Option<usize>,
}

pub(crate) fn object<'a>(
    v: &'a Value,
    field: &str,
    index: Option<usize>,
) -> Result<&'a Map<String, Value>, Refusal> {
    v.as_object()
        .ok_or_else(|| Refusal::new("input-not-object", field, index))
}

pub(crate) fn only_fields(
    m: &Map<String, Value>,
    allowed: &[&str],
    field: &str,
    index: Option<usize>,
) -> Result<(), Refusal> {
    match m.keys().find(|k| !allowed.contains(&k.as_str())) {
        Some(k) => Err(Refusal::new("unknown-field", format!("{field}.{k}"), index)),
        None => Ok(()),
    }
}

/// Validate a ruleset and return its non-floor rules in the order given. The floor is not returned: it always runs.
pub(crate) fn parse(ruleset: &Value) -> Result<Vec<Rule>, Refusal> {
    let top = object(ruleset, "ruleset", None)?;
    only_fields(top, &["rules"], "ruleset", None)?;
    let rules = top
        .get("rules")
        .and_then(Value::as_array)
        .ok_or_else(|| Refusal::new("input-not-object", "ruleset.rules", None))?;
    if rules.len() > MAX_RULES {
        return Err(Refusal::new(
            "limit-exceeded",
            "ruleset.rules",
            Some(MAX_RULES),
        ));
    }
    let mut seen: Vec<&str> = Vec::new();
    let mut out = Vec::new();
    for (i, raw) in rules.iter().enumerate() {
        let rule = object(raw, "ruleset.rules", Some(i))?;
        only_fields(
            rule,
            &["check", "class", "params"],
            "ruleset.rules",
            Some(i),
        )?;
        let name = rule
            .get("check")
            .and_then(Value::as_str)
            .ok_or_else(|| Refusal::new("check-unknown", "ruleset.rules.check", Some(i)))?;
        let known = FLOOR
            .iter()
            .chain(["declared-layers-valid", "max-layer-width"].iter())
            .find(|c| **c == name);
        let Some(&check) = known else {
            return Err(Refusal::new(
                "check-unknown",
                "ruleset.rules.check",
                Some(i),
            ));
        };
        if seen.contains(&check) {
            return Err(Refusal::new(
                "rule-duplicate",
                "ruleset.rules.check",
                Some(i),
            ));
        }
        seen.push(check);
        let params = match rule.get("params") {
            None => None,
            Some(p) => Some(
                object(p, "ruleset.rules.params", Some(i))
                    .map_err(|_| Refusal::new("param-invalid", "ruleset.rules.params", Some(i)))?,
            ),
        };
        if FLOOR.contains(&check) {
            if rule.contains_key("class") || params.is_some_and(|p| !p.is_empty()) {
                return Err(Refusal::new(
                    "floor-check-not-configurable",
                    "ruleset.rules",
                    Some(i),
                ));
            }
            continue;
        }
        let class = match rule.get("class").map(Value::as_str) {
            None => {
                if check == "max-layer-width" {
                    Class::Advisory
                } else {
                    Class::Blocking
                }
            }
            Some(Some("blocking")) => Class::Blocking,
            Some(Some("advisory")) => Class::Advisory,
            Some(_) => {
                return Err(Refusal::new(
                    "param-invalid",
                    "ruleset.rules.class",
                    Some(i),
                ))
            }
        };
        let mut max = None;
        if check == "max-layer-width" {
            if let Some(k) = params.and_then(|p| p.keys().find(|k| *k != "max")) {
                return Err(Refusal::new(
                    "param-unknown",
                    format!("ruleset.rules.params.{k}"),
                    Some(i),
                ));
            }
            max = Some(
                params
                    .and_then(|p| p.get("max"))
                    .and_then(Value::as_u64)
                    .filter(|m| *m >= 1)
                    .ok_or_else(|| {
                        Refusal::new("param-invalid", "ruleset.rules.params.max", Some(i))
                    })? as usize,
            );
        } else if let Some(k) = params.and_then(|p| p.keys().next()) {
            return Err(Refusal::new(
                "param-unknown",
                format!("ruleset.rules.params.{k}"),
                Some(i),
            ));
        }
        out.push(Rule { check, class, max });
    }
    Ok(out)
}

/// The policy identity is `{ source, sha256 }` as opaque strings, echoed verbatim.
pub(crate) fn parse_policy(policy: Option<&Value>) -> Result<Option<Value>, Refusal> {
    let Some(p) = policy else { return Ok(None) };
    let m = object(p, "policy", None)?;
    only_fields(m, &["source", "sha256"], "policy", None)?;
    for key in ["source", "sha256"] {
        if !m.get(key).is_some_and(Value::is_string) {
            return Err(Refusal::new("param-invalid", format!("policy.{key}"), None));
        }
    }
    Ok(Some(p.clone()))
}
