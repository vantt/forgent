#![allow(dead_code)]
#[path = "../../../core/tests/common/support.rs"]
mod support;
// Each test file uses a part of the shared support.
#[allow(unused_imports)]
pub use support::{config_section, limits_contract, SeqIds};

use fgos_mailbox::hook::{Adapter, HookEvent};
use serde_json::Value;
use std::path::PathBuf;

pub const ADAPTERS: [Adapter; 3] = [Adapter::Claude, Adapter::Codex, Adapter::Agy];

/// The fixture directory of one CLI.
pub fn fixture_dir(adapter: Adapter) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../contracts/fixtures/hooks")
        .join(adapter.word())
}

/// A JSON fixture of one CLI.
pub fn fixture(adapter: Adapter, file: &str) -> Value {
    let text = std::fs::read_to_string(fixture_dir(adapter).join(file))
        .unwrap_or_else(|e| panic!("{} {file}: {e}", adapter.word()));
    serde_json::from_str(&text).unwrap()
}

/// The vectors of one CLI whose `kind` is `kind`.
pub fn vectors(adapter: Adapter, kind: &str) -> Vec<Value> {
    fixture(adapter, "vectors.json")["vectors"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|v| v["kind"] == kind)
        .cloned()
        .collect()
}

pub fn event(flag: &Value) -> HookEvent {
    HookEvent::from_flag(flag.as_str().unwrap()).unwrap()
}

/// The stdin bytes a vector describes: a fixture file (optionally with keys
/// set, or cut at half its length), inline JSON, or raw text.
pub fn vector_input(adapter: Adapter, vector: &Value) -> Vec<u8> {
    if let Some(text) = vector["text"].as_str() {
        return text.as_bytes().to_vec();
    }
    let mut value = match vector["file"].as_str() {
        Some(file) => fixture(adapter, file),
        None => vector["json"].clone(),
    };
    if let Some(set) = vector["set"].as_object() {
        for (key, v) in set {
            value[key] = v.clone();
        }
    }
    let bytes = serde_json::to_vec(&value).unwrap();
    if vector["truncate"] == true {
        bytes[..bytes.len() / 2].to_vec()
    } else {
        bytes
    }
}

/// The core's limits as the contract states them.
pub fn limits() -> fgos_mailbox_core::Limits {
    serde_json::from_value(support::config_section(&support::limits_contract())).unwrap()
}

/// The hook's limits as the contract states them.
pub fn hook_limits() -> fgos_mailbox::hook::HookLimits {
    serde_json::from_value(support::config_section(&support::limits_contract())).unwrap()
}
