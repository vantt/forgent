//! Executor resolution: the capability a dispatch is for, and (re-exported from `fgos-execution::executor_config`)
//! the executor block a name resolves to with the cross-provider governance gate on its egress.
//!
//! The registry lookup, the provider family and the capability catalog reads are `fgos-execution`'s
//! (`executor_model`); this module composes them and adds the capability resolution rules of the launch path. Which executor
//! a purpose runs on is Seat Binding's answer, never chosen here.

use crate::executor_model::{capability_confinement, registered_capability_of};
use serde_json::{json, Value};

use crate::js::truthy;

pub use crate::executor_model::lookup_executor;

/// The executor block a name resolves to and its egress gate are `fgos-execution`'s, the same answer `decide`
/// judges a dispatch by.
pub use crate::executor_config::{
    resolve_executor_config, CLAUDE_CLI_COMMANDS, EXECUTOR_CARRIES, EXECUTOR_MISSING_MESSAGE,
};

/// What the caller knows about what a dispatch is FOR.
#[derive(Debug, Clone, Default)]
pub struct CapabilityHints {
    pub candidates: Vec<String>,
    pub preferred: Option<String>,
    pub fallback_label: Option<String>,
}

/// What a dispatch resolves to: its capability, and the capability whose confinement policy anchors it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CapabilityDetails {
    pub capability: String,
    pub anchor_capability: Option<String>,
}

impl CapabilityDetails {
    pub fn to_json(&self) -> Value {
        json!({ "capability": self.capability, "anchorCapability": self.anchor_capability })
    }
}

/// JavaScript's default string order: UTF-16 code units.
fn js_sorted(mut items: Vec<String>) -> Vec<String> {
    items.sort_by(|a, b| a.encode_utf16().cmp(b.encode_utf16()));
    items
}

fn has_capability_entry(runner: &Value, name: &str) -> bool {
    runner
        .get("capabilities")
        .and_then(Value::as_object)
        .and_then(|section| section.get(name))
        .is_some_and(|entry| entry.is_object() || entry.is_array())
}

fn confinement_of<'a>(runner: &'a Value, capability: &str) -> Option<&'a Value> {
    capability_confinement(runner, capability)
}

fn confinement_is_required(runner: &Value, capability: &str) -> bool {
    confinement_of(runner, capability)
        .and_then(|confinement| confinement.get("mode"))
        .and_then(Value::as_str)
        == Some("required")
}

fn has_confinement(runner: &Value, capability: &str) -> bool {
    truthy(confinement_of(runner, capability))
}

/// The capabilities a tool executor serves; an agent executor serves none (its `for` is inert).
fn served_capabilities(executor: Option<&Value>) -> Vec<String> {
    let Some(executor) = executor.filter(|e| e.get("kind").and_then(Value::as_str) == Some("tool"))
    else {
        return Vec::new();
    };
    executor
        .get("for")
        .and_then(Value::as_array)
        .map(|list| {
            list.iter()
                .filter_map(Value::as_str)
                .map(|name| name.trim().to_string())
                .filter(|name| !name.is_empty())
                .collect()
        })
        .unwrap_or_default()
}

/// The canonical capability identity of a dispatch, independent of any Work item. An explicit purpose wins; else
/// a candidate with required confinement, then any configured confinement, then the preferred one, then a
/// registered capability, then the first sorted candidate.
pub fn resolve_capability_details_from_hints(
    runner: &Value,
    executor_id: Option<&str>,
    resolved_executor: Option<&Value>,
    purpose: Option<&str>,
    hints: &CapabilityHints,
) -> CapabilityDetails {
    let resolve_alias = |name: &str| -> String {
        if name.is_empty() {
            return String::new();
        }
        registered_capability_of(runner, &Value::String(name.to_string()))
            .unwrap_or(name)
            .to_string()
    };
    let explicit_purpose = purpose
        .map(str::trim)
        .filter(|text| !text.is_empty())
        .map(resolve_alias);

    let mut candidates: Vec<String> = Vec::new();
    let mut add = |name: String| {
        if !candidates.contains(&name) {
            candidates.push(name);
        }
    };
    hints.candidates.iter().cloned().for_each(&mut add);
    served_capabilities(resolved_executor)
        .into_iter()
        .for_each(&mut add);
    if let Some(id) = executor_id.filter(|id| !id.is_empty()) {
        add(id.to_string());
    }
    let normalized: Vec<String> = candidates
        .iter()
        .map(|c| resolve_alias(c))
        .filter(|c| !c.is_empty())
        .collect();

    let mut capability = explicit_purpose.unwrap_or_default();
    if capability.is_empty() && normalized.is_empty() {
        capability = hints
            .fallback_label
            .clone()
            .or_else(|| executor_id.map(str::to_string))
            .unwrap_or_else(|| "(unknown-capability)".to_string());
    }
    let pick = |matching: Vec<String>| js_sorted(matching).into_iter().next();
    let by = |test: &dyn Fn(&str) -> bool| -> Vec<String> {
        normalized.iter().filter(|c| test(c)).cloned().collect()
    };
    if capability.is_empty() {
        capability = pick(by(&|c| confinement_is_required(runner, c))).unwrap_or_default();
    }
    if capability.is_empty() {
        capability = pick(by(&|c| has_confinement(runner, c))).unwrap_or_default();
    }
    if capability.is_empty() {
        if let Some(preferred) = hints.preferred.as_ref().filter(|p| normalized.contains(p)) {
            capability = preferred.clone();
        }
    }
    if capability.is_empty() {
        capability = pick(by(&|c| has_capability_entry(runner, c))).unwrap_or_default();
    }
    if capability.is_empty() {
        capability = pick(normalized.clone()).unwrap_or_default();
    }

    let anchors: Vec<String> = normalized
        .iter()
        .filter(|c| **c != capability && has_confinement(runner, c))
        .cloned()
        .collect();
    let required: Vec<String> = anchors
        .iter()
        .filter(|c| confinement_is_required(runner, c))
        .cloned()
        .collect();
    let anchor_capability = pick(required).or_else(|| pick(anchors));
    CapabilityDetails {
        capability,
        anchor_capability,
    }
}
