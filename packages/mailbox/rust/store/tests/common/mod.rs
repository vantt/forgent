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

/// The mailbox contracts directory; the one place the tests name it.
pub fn contracts_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../contracts")
}

/// The adapters contract inside [`contracts_dir`].
pub const ADAPTERS_CONTRACT: &str = "adapters.v1.json";

/// The recorded hook fixtures, one directory per CLI.
pub fn hook_fixtures_dir() -> PathBuf {
    contracts_dir().join("fixtures").join("hooks")
}

/// The file names inside one CLI's fixture directory, as
/// `scripts/record-mailbox-hook-fixtures.mjs` writes them.
pub mod files {
    pub const STOP: &str = "stop.json";
    pub const STOP_CONTINUED: &str = "stop-continued.json";
    pub const POST_TOOL_USE: &str = "post-tool-use.json";
    pub const POST_TOOL_USE_SUBAGENT: &str = "post-tool-use-subagent.json";
    pub const STOP_AGENT_HEAD: &str = "stop-agent-head.json";
    pub const POST_TOOL_USE_AGENT_HEAD: &str = "post-tool-use-agent-head.json";
    pub const ACCEPTED_STOP: &str = "accepted-stop.json";
    pub const ACCEPTED_POST_TOOL_USE: &str = "accepted-post-tool-use.json";
    pub const ENV: &str = "env.json";
    pub const VECTORS: &str = "vectors.json";
}

/// The fixture directory of one CLI.
pub fn fixture_dir(adapter: Adapter) -> PathBuf {
    hook_fixtures_dir().join(adapter.word())
}

/// A JSON fixture of one CLI.
pub fn fixture(adapter: Adapter, file: &str) -> Value {
    let text = std::fs::read_to_string(fixture_dir(adapter).join(file))
        .unwrap_or_else(|e| panic!("{} {file}: {e}", adapter.word()));
    serde_json::from_str(&text).unwrap()
}

/// The vectors of one CLI whose `kind` is `kind`.
pub fn vectors(adapter: Adapter, kind: &str) -> Vec<Value> {
    fixture(adapter, files::VECTORS)["vectors"]
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
