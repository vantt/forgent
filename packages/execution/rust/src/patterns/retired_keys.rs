//! Runner config keys that moved or were retired, tracked in one place, and the sentence that says so.

use serde_json::{json, Value};

pub const RETIRED_GATED_NAME: &str = "research-fan-out-gated";
/// Names no pattern may take.
pub const RESERVED_PATTERN_NAMES: [&str; 2] = ["seatBinding", "defaultRule"];
pub const SEAT_BINDING_MARKER_PATH: &str = "runner.patterns.seatBinding.schema";

/// A retired key and what replaces it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RetiredKey {
    pub key: &'static str,
    pub replacement: Option<&'static str>,
    pub instruction: &'static str,
}

/// The retired keys, in the order the check reports them.
pub const RETIRED_CONFIG_KEYS: [RetiredKey; 4] = [
    RetiredKey {
        key: "runner.patterns.defaultRule",
        replacement: None,
        instruction: "delete the key",
    },
    RetiredKey {
        key: "runner.patterns.reviewed.maxRounds",
        replacement: Some("runner.loops.reviewed.maxRounds"),
        instruction: "use runner.loops.reviewed.maxRounds instead",
    },
    RetiredKey {
        key: "runner.patterns.reviewed.checkersByRigor",
        replacement: Some("runner.loops.reviewed.checkersByRigor"),
        instruction: "use runner.loops.reviewed.checkersByRigor instead",
    },
    RetiredKey {
        key: "runner.patterns.research-fan-out-gated",
        replacement: Some("runner.patterns.research-fan-out"),
        instruction: "use runner.patterns.research-fan-out instead",
    },
];

/// One retired key found in a config.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RetiredFinding {
    pub key: String,
    pub replacement: Option<String>,
    pub instruction: String,
}

impl RetiredFinding {
    fn of(meta: &RetiredKey) -> Self {
        RetiredFinding {
            key: meta.key.to_string(),
            replacement: meta.replacement.map(str::to_string),
            instruction: meta.instruction.to_string(),
        }
    }

    pub fn to_json(&self) -> Value {
        json!({ "key": self.key, "replacement": self.replacement, "instruction": self.instruction })
    }
}

fn table_entry(key: &str) -> Option<&'static RetiredKey> {
    RETIRED_CONFIG_KEYS.iter().find(|meta| meta.key == key)
}

/// The sentence for a retired key: `<key> was retired; <instruction>`. `item` is a dotted path or a finding-like
/// object `{ key, instruction? }`; the instruction is `instruction_override`, then the item's own, then the table's,
/// then "delete the key". An absent or empty item gives the empty sentence.
pub fn format_retired_key_sentence(
    item: Option<&Value>,
    instruction_override: Option<&str>,
) -> String {
    let item = match item {
        None | Some(Value::Null) | Some(Value::Bool(false)) => return String::new(),
        Some(Value::String(s)) if s.is_empty() => return String::new(),
        Some(v) => v,
    };
    let (key, own): (String, Option<String>) = match item {
        Value::String(s) => (s.clone(), None),
        other => (
            other
                .get("key")
                .map_or("undefined".to_string(), |k| match k {
                    Value::String(s) => s.clone(),
                    v => v.to_string(),
                }),
            other
                .get("instruction")
                .and_then(Value::as_str)
                .filter(|i| !i.is_empty())
                .map(str::to_string),
        ),
    };
    let instruction = instruction_override
        .map(str::to_string)
        .or(own)
        .or_else(|| table_entry(&key).map(|meta| meta.instruction.to_string()))
        .unwrap_or_else(|| "delete the key".to_string());
    format!("{key} was retired; {instruction}")
}

fn match_dotted_path(path: &str) -> Vec<RetiredFinding> {
    RETIRED_CONFIG_KEYS
        .iter()
        .find(|meta| {
            path == meta.key
                || path
                    .strip_prefix(meta.key)
                    .is_some_and(|rest| rest.starts_with('.'))
        })
        .map(|meta| vec![RetiredFinding::of(meta)])
        .unwrap_or_default()
}

/// The retired keys `input` carries: a dotted path, or a pattern map whose nested keys are checked. Anything else
/// carries none.
pub fn detect_retired_pattern_keys(input: Option<&Value>) -> Vec<RetiredFinding> {
    match input {
        Some(Value::String(path)) if !path.is_empty() => match_dotted_path(path),
        Some(Value::Object(_)) => {
            let input = input.unwrap_or(&Value::Null);
            let mut findings: Vec<RetiredFinding> = Vec::new();
            for meta in &RETIRED_CONFIG_KEYS {
                let Some(subpath) = meta.key.strip_prefix("runner.patterns.") else {
                    continue;
                };
                let mut current = input;
                let mut matched = true;
                let segments: Vec<&str> = subpath.split('.').collect();
                for (i, segment) in segments.iter().enumerate() {
                    match current.as_object().and_then(|o| o.get(*segment)) {
                        Some(next) => {
                            if i == segments.len() - 1 {
                                break;
                            }
                            current = next;
                        }
                        None => {
                            matched = false;
                            break;
                        }
                    }
                }
                if matched && !findings.iter().any(|f| f.key == meta.key) {
                    findings.push(RetiredFinding::of(meta));
                }
            }
            findings
        }
        _ => vec![],
    }
}
