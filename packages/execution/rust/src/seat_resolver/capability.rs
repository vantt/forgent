//! The slice of the capability catalog (`runner.capabilities`) the seat rules read: per field, never an entry.
//! Two lookups: the exact key, then its `<prefix>:*` entry (the text before the first colon).

use super::value::{get, str_at};
use serde_json::Value;

const RIGOR_VALUES: [&str; 4] = ["low", "standard", "high", "critical"];

/// Rank of a rigor on the one scale: low 1 .. critical 4.
pub fn rigor_rank(rigor: &str) -> Option<u8> {
    RIGOR_VALUES
        .iter()
        .position(|r| *r == rigor)
        .map(|i| i as u8 + 1)
}

fn is_entry(value: &Value) -> bool {
    value.is_object() || value.is_array()
}

fn section(cfg: &Value) -> Option<&serde_json::Map<String, Value>> {
    get(cfg, "capabilities")
        .filter(|v| is_entry(v))
        .and_then(Value::as_object)
}

/// The entries that apply to a capability, most specific first: exact key, then `<prefix>:*`.
fn entries_of<'a>(cfg: &'a Value, capability: Option<&str>) -> Vec<(String, &'a Value)> {
    let Some(capability) = capability.filter(|c| !c.is_empty()) else {
        return Vec::new();
    };
    let Some(section) = section(cfg) else {
        return Vec::new();
    };
    let keys = match capability.split_once(':') {
        Some((prefix, _)) => vec![capability.to_string(), format!("{prefix}:*")],
        None => vec![capability.to_string()],
    };
    keys.into_iter()
        .filter_map(|key| {
            let entry = section.get(&key).filter(|v| is_entry(v))?;
            Some((key, entry))
        })
        .collect()
}

/// The first defined `minCheckers` (an empty list is defined: it clears the default) with its key.
pub fn min_checkers_of<'a>(
    cfg: &'a Value,
    capability: Option<&str>,
) -> Option<(String, &'a Value)> {
    entries_of(cfg, capability)
        .into_iter()
        .find_map(|(key, entry)| entry.get("minCheckers").map(|m| (key, m)))
}

/// The exact entry's `minCheckers`, raw.
pub fn own_min_checkers_of<'a>(cfg: &'a Value, name: Option<&str>) -> Option<&'a Value> {
    exact_entry(cfg, name)?.get("minCheckers")
}

/// The exact entry's `verify`, raw.
pub fn capability_verify_of<'a>(cfg: &'a Value, capability: Option<&str>) -> Option<&'a Value> {
    exact_entry(cfg, capability)?.get("verify")
}

fn exact_entry<'a>(cfg: &'a Value, name: Option<&str>) -> Option<&'a Value> {
    let name = name?;
    section(cfg)?.get(name).filter(|v| is_entry(v))
}

/// The unit's own `capability` string.
pub fn capability_of(unit: &Value) -> Option<&str> {
    str_at(unit, "capability")
}
