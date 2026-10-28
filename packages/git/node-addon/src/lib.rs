//! One Node-API load for both foundations. No protocol decisions live here.
mod event_store;
pub use event_store::{event_store_branch_key, open_store, resolve_event_store, event_store_facts};
mod git;
pub use git::{close_git_loan, ensure_git_fetch_mapping, git_fetch_mappings, initialize_git_wal, inspect_git, inspect_git_worktree_recovery, mint_git_loan, prepare_git_driver_directories, take_git_handover};
mod single_load;
pub mod process;
pub mod holder_lock;
pub mod durable_file;
pub mod canonical_json;
pub mod session_identity;
pub mod marshal;
pub mod yaml;
pub mod config;
use napi::{Error, Result};
use napi_derive::napi;
use serde_json::{json, Value};
use std::sync::OnceLock;

fn check() -> Result<()> {
    single_load::check().map_err(Error::from_reason)
}
fn error(e: impl std::fmt::Display) -> Error {
    Error::from_reason(e.to_string())
}
#[napi]
pub fn versions() -> Result<Value> {
    check()?;
    // Computed once: the envelope schema and the vectors file do not change while the addon is loaded.
    static VERSIONS: OnceLock<std::result::Result<Value, String>> = OnceLock::new();
    VERSIONS
        .get_or_init(|| {
            let mut contracts = fgos_git::contract_versions();
            // Read the Event Store's own envelope contract, not this addon's package version.
            let envelope: Value = serde_json::from_str(include_str!("../../../event-store/contracts/envelope.v4.schema.json")).map_err(|e| e.to_string())?;
            contracts["eventStore"] = envelope["properties"]["v"]["const"].clone();
            Ok(json!({
                "addon": env!("CARGO_PKG_VERSION"), "git": fgos_git::VERSION, "eventStore": env!("CARGO_PKG_VERSION"), "napi": 8, "contracts": contracts,
                "process": process::contract_version().map_err(|e| e.to_string())?,
                // The crates carry the workspace version; the canonical vectors are the `canonical.v1` file.
                "durableFile": env!("CARGO_PKG_VERSION"), "canonicalJson": 1, "holderLock": 1, "sessionIdentity": 1, "yaml": 1, "config": 3,
            }))
        })
        .clone()
        .map_err(error)
}

#[napi_derive::module_exports]
fn init(_exports: napi::JsObject) -> Result<()> {
    check()
}
