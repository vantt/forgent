//! One Node-API load for both foundations. No protocol decisions live here.
mod event_store;
pub use event_store::{open_store, resolve_event_store, event_store_facts, mint_event_store_machine_id, ensure_event_store_refspecs};
mod git;
pub use git::{close_git_loan, ensure_git_fetch_mapping, git_fetch_mappings, initialize_git_wal, inspect_git, mint_git_loan, prepare_git_driver_directories, take_git_handover};
mod single_load;
use napi::{Error, Result};
use napi_derive::napi;
use serde_json::{json, Value};

fn check() -> Result<()> {
    single_load::check().map_err(Error::from_reason)
}
fn error(e: impl std::fmt::Display) -> Error {
    Error::from_reason(e.to_string())
}
#[napi]
pub fn versions() -> Result<Value> {
    check()?;
    let mut contracts = fgos_git::contract_versions();
    // Read the Event Store's own envelope contract, not this addon's package version.
    let envelope: Value = serde_json::from_str(include_str!(
        "../../../event-store/contracts/envelope.v4.schema.json"
    ))
    .map_err(error)?;
    contracts["eventStore"] = envelope["properties"]["v"]["const"].clone();
    Ok(
        json!({"addon": env!("CARGO_PKG_VERSION"), "git": fgos_git::VERSION, "eventStore": env!("CARGO_PKG_VERSION"), "napi": 8, "contracts": contracts}),
    )
}

#[napi_derive::module_exports]
fn init(_exports: napi::JsObject) -> Result<()> {
    check()
}
