#![allow(dead_code)]
use fgos_mailbox_core::Limits;
use serde_json::{Map, Value};

/// The limits contract, the only place the core's starting values live.
pub const LIMITS_CONTRACT: &str = include_str!("../../../../contracts/limits.v1.json");

pub fn limits_contract() -> Value {
    serde_json::from_str(LIMITS_CONTRACT).expect("the limits contract is valid JSON")
}

/// Folds the contract's dotted keys into the nested `mailbox` config section,
/// the shape a configuration reader hands to `Limits`.
pub fn config_section(contract: &Value) -> Value {
    let mut section = Map::new();
    for entry in contract["keys"]
        .as_array()
        .expect("contract has a keys list")
    {
        let key = entry["key"].as_str().expect("every key is a string");
        let path = key
            .strip_prefix("mailbox.")
            .expect("every key lives in the mailbox section");
        let mut node = &mut section;
        let mut parts = path.split('.').peekable();
        while let Some(part) = parts.next() {
            if parts.peek().is_none() {
                node.insert(part.to_string(), entry["default"].clone());
            } else {
                node = node
                    .entry(part.to_string())
                    .or_insert_with(|| Value::Object(Map::new()))
                    .as_object_mut()
                    .expect("a dotted prefix is an object");
            }
        }
    }
    Value::Object(section)
}

/// The limits as the contract states them.
pub fn spec_limits() -> Limits {
    serde_json::from_value(config_section(&limits_contract()))
        .expect("the contract fills every Limits field")
}
