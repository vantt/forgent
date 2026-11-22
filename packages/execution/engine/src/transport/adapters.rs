//! Executor adapter names and metadata, the dispatch-depth and case environment, and the environment a worker
//! starts from.
//!
//! The adapter registry is data: the two adapters the transport knows and what each one's recovery profile
//! needs. A worker's ambient environment is an allowlist, not a denylist: `worker-env-allowlist.v1.json` names
//! what a seat may start with, with the reason for each; everything else of its controller's environment stays
//! behind, and the state root is pinned so a worker with a sandbox HOME still shares the machine-scope locks.

use std::sync::OnceLock;

use serde_json::{json, Map, Value};

pub const DEFAULT_ADAPTER: &str = "cli-spawn";
pub const HERDR_ADAPTER: &str = "herdr-spawn";
pub const EXECUTOR_ADAPTER_NAMES: [&str; 2] = [DEFAULT_ADAPTER, HERDR_ADAPTER];

// The dispatch depth and the case a worker was launched into are read by layers above the engine too.
pub use fgos_execution::dispatch_env::{
    case_context_env, current_dispatch_depth, dispatch_depth_of, CASE_ID_ENV, CASE_RESERVATION_ENV,
    DISPATCH_DEPTH_ENV, MAX_DISPATCH_DEPTH,
};
pub const STATE_ROOT_ENV: &str = "FGOS_STATE_ROOT";

/// What an adapter's recovery profile needs to know about it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AdapterMetadata {
    pub locus: &'static str,
    pub prepared_invocation_contract: &'static str,
    pub receipt_contract: &'static str,
}

impl AdapterMetadata {
    pub fn to_json(self) -> Value {
        json!({
            "locus": self.locus,
            "preparedInvocationContract": self.prepared_invocation_contract,
            "receiptContract": self.receipt_contract,
        })
    }
}

pub fn adapter_metadata(name: &str) -> Option<AdapterMetadata> {
    match name {
        DEFAULT_ADAPTER => Some(AdapterMetadata {
            locus: "local-process",
            prepared_invocation_contract: "exact-v1",
            receipt_contract: "confinement-adapter-receipt.v1",
        }),
        HERDR_ADAPTER => Some(AdapterMetadata {
            locus: "herdr-pane",
            prepared_invocation_contract: "exact-v1",
            receipt_contract: "herdr-adapter-receipt.v1",
        }),
        _ => None,
    }
}

struct Allowlist {
    names: Vec<String>,
    prefixes: Vec<String>,
}

fn allowlist() -> &'static Allowlist {
    static LIST: OnceLock<Allowlist> = OnceLock::new();
    LIST.get_or_init(|| {
        let text =
            include_str!("../../../../run-supervisor/contracts/worker-env-allowlist.v1.json");
        let doc: Value = serde_json::from_str(text).expect("worker-env-allowlist.v1.json is JSON");
        let collect = |list: &str, key: &str| -> Vec<String> {
            doc[list]
                .as_array()
                .map(|all| {
                    all.iter()
                        .filter_map(|e| e[key].as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default()
        };
        Allowlist {
            names: collect("names", "name"),
            prefixes: collect("prefixes", "prefix"),
        }
    })
}

/// The environment an executor-launched agent starts from: the names the allowlist contract lists, nothing
/// else, plus the pinned state root when `state_root` is known. A name added to the caller's environment
/// tomorrow does not reach a seat until someone names it in the contract.
pub fn worker_base_env<'a>(
    base_env: impl IntoIterator<Item = (&'a str, &'a str)>,
    state_root: Option<&str>,
) -> Vec<(String, String)> {
    let list = allowlist();
    let mut out: Vec<(String, String)> = base_env
        .into_iter()
        .filter(|(name, _)| {
            list.names.iter().any(|n| n == name)
                || list.prefixes.iter().any(|p| name.starts_with(p.as_str()))
        })
        .map(|(name, value)| (name.to_string(), value.to_string()))
        .collect();
    if let Some(root) = state_root {
        out.retain(|(name, _)| name != STATE_ROOT_ENV);
        out.push((STATE_ROOT_ENV.to_string(), root.to_string()));
    }
    out
}

/// [`worker_base_env`] over this process's own environment, pinned to the state root it resolves.
pub fn worker_base_env_of_process() -> Vec<(String, String)> {
    let vars: Vec<(String, String)> = std::env::vars().collect();
    let (root, _) = fgos_holder_lock::state_root::state_root();
    worker_base_env(
        vars.iter().map(|(k, v)| (k.as_str(), v.as_str())),
        Some(&root.to_string_lossy()),
    )
}

/// The executor's declared `env` with `${NAME}` taken from `base` (a name `base` lacks becomes empty); entries
/// whose value is not a string are dropped.
pub fn resolve_executor_env(
    raw: &Value,
    base: &dyn Fn(&str) -> Option<String>,
) -> Map<String, Value> {
    let mut resolved = Map::new();
    let Some(entries) = raw.as_object() else {
        return resolved;
    };
    for (key, value) in entries {
        if let Some(text) = value.as_str() {
            resolved.insert(key.clone(), Value::String(expand(text, base)));
        }
    }
    resolved
}

fn expand(text: &str, base: &dyn Fn(&str) -> Option<String>) -> String {
    let mut out = String::new();
    let mut rest = text;
    while let Some(start) = rest.find("${") {
        match rest[start + 2..].find('}').filter(|end| *end > 0) {
            Some(end) => {
                out.push_str(&rest[..start]);
                out.push_str(&base(&rest[start + 2..start + 2 + end]).unwrap_or_default());
                rest = &rest[start + 2 + end + 1..];
            }
            None => {
                out.push_str(&rest[..start + 2]);
                rest = &rest[start + 2..];
            }
        }
    }
    out.push_str(rest);
    out
}
