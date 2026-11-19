//! One cell of `runner.modelPolicies.<family>.<tier>`: a model, a model served by a named pool (`model@pool`), a
//! model object `{model, pool?, effort?}`, or an ordered list of those. A pool is the service provider that bills
//! for the call; an entry without a pool belongs to the pool named after its family. The string form splits at the
//! last `@`, so a model id that itself contains `@` names its pool explicitly.

use serde_json::{json, Value};

/// The reasoning effort levels a tier cell or a request may name.
pub const REASONING_EFFORT_VALUES: [&str; 4] = ["low", "medium", "high", "max"];

const OBJECT_ENTRY_KEYS: [&str; 3] = ["model", "pool", "effort"];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TierCellEntry {
    pub model: String,
    pub pool: String,
    pub explicit_pool: bool,
    /// Present only when the cell declares one.
    pub effort: Option<String>,
}

impl TierCellEntry {
    pub fn to_json(&self) -> Value {
        let mut out =
            json!({ "model": self.model, "pool": self.pool, "explicitPool": self.explicit_pool });
        if let Some(effort) = &self.effort {
            out["effort"] = json!(effort);
        }
        out
    }
}

/// Parse one tier cell into its ordered entries. `family` is the pool an entry without one is served by. The error
/// names an empty list, an entry that is neither a string nor a model object, an empty model or pool, an unknown
/// object key, or an effort outside [`REASONING_EFFORT_VALUES`].
pub fn parse_tier_cell(cell: &Value, family: &str) -> Result<Vec<TierCellEntry>, String> {
    let list: Vec<&Value> = match cell {
        Value::Array(items) => items.iter().collect(),
        single => vec![single],
    };
    if list.is_empty() {
        return Err("a tier cell list must name at least one model".to_string());
    }
    list.into_iter()
        .map(|entry| match entry {
            Value::Object(_) => parse_object_entry(entry, family),
            _ => parse_string_entry(entry, family),
        })
        .collect()
}

fn parse_string_entry(entry: &Value, family: &str) -> Result<TierCellEntry, String> {
    let Some(text) = entry.as_str().filter(|text| !js_trim(text).is_empty()) else {
        return Err(format!(
            "a tier cell entry must be a non-empty string or a {{model, pool?, effort?}} object, got {}",
            stringify(entry)
        ));
    };
    let Some(at) = text.rfind('@') else {
        return Ok(TierCellEntry {
            model: text.to_string(),
            pool: family.to_string(),
            explicit_pool: false,
            effort: None,
        });
    };
    let model = js_trim(&text[..at]);
    let pool = js_trim(&text[at + 1..]);
    if model.is_empty() {
        return Err(format!(
            "tier cell entry {} names no model before \"@\"",
            stringify(entry)
        ));
    }
    if pool.is_empty() {
        return Err(format!(
            "tier cell entry {} names no pool after \"@\"",
            stringify(entry)
        ));
    }
    Ok(TierCellEntry {
        model: model.to_string(),
        pool: pool.to_string(),
        explicit_pool: true,
        effort: None,
    })
}

fn parse_object_entry(entry: &Value, family: &str) -> Result<TierCellEntry, String> {
    let object = entry.as_object().expect("an object entry");
    for key in object.keys() {
        if !OBJECT_ENTRY_KEYS.contains(&key.as_str()) {
            return Err(format!(
                "tier cell object {} has unknown key \"{key}\"; allowed keys: {}",
                stringify(entry),
                OBJECT_ENTRY_KEYS.join(", ")
            ));
        }
    }
    let non_empty = |key: &str| {
        object
            .get(key)
            .and_then(Value::as_str)
            .filter(|text| !js_trim(text).is_empty())
    };
    let Some(model) = non_empty("model") else {
        return Err(format!(
            "tier cell object {} must name a non-empty string \"model\"",
            stringify(entry)
        ));
    };
    if object.contains_key("pool") && non_empty("pool").is_none() {
        return Err(format!(
            "tier cell object {} \"pool\" must be a non-empty string when present",
            stringify(entry)
        ));
    }
    let effort = match object.get("effort") {
        None => None,
        Some(Value::String(level)) if REASONING_EFFORT_VALUES.contains(&level.as_str()) => {
            Some(level.clone())
        }
        Some(_) => {
            return Err(format!(
                "tier cell object {} \"effort\" must be one of {}",
                stringify(entry),
                REASONING_EFFORT_VALUES.join("/")
            ))
        }
    };
    let pool = non_empty("pool");
    Ok(TierCellEntry {
        model: model.to_string(),
        pool: pool.unwrap_or(family).to_string(),
        explicit_pool: pool.is_some(),
        effort,
    })
}

fn js_trim(text: &str) -> &str {
    text.trim_matches(crate::assignment::js_space)
}

/// `JSON.stringify`, compact.
fn stringify(value: &Value) -> String {
    serde_json::to_string(value).unwrap_or_default()
}
