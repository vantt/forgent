//! One Node-API load for both foundations. No protocol decisions live here.
mod event_store;
pub use event_store::{
    event_store_branch_key, event_store_facts, maintain_event_store, open_store, resolve_event_store,
};
mod git;
pub use git::{
    close_git_loan, ensure_git_fetch_mapping, git_fetch_mappings, initialize_git_wal, inspect_git,
    inspect_git_worktree_recovery, mint_git_loan, prepare_git_driver_directories,
    take_git_handover,
};
pub mod agent_protocol;
pub mod canonical_json;
pub mod config;
pub mod durable_file;
pub mod holder_lock;
pub mod marshal;
pub mod process;
pub mod run_result;
pub mod session_identity;
mod single_load;
pub mod yaml;
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
/// The driver on `state_root`; the Event Store owns the rule for a detached child whose root is gone.
fn driver_for(state_root: &str, detached: Option<bool>) -> Result<fgos_git::GitDriver> {
    fgos_event_store::resolve::driver(std::path::Path::new(state_root), detached.unwrap_or(false))
        .map_err(resolve_failure)
}
/// A refusal to build a store's authority as the addon's error: the one mapping every door shares.
pub(crate) fn resolve_failure(e: fgos_event_store::resolve::ResolveError) -> Error {
    use fgos_event_store::resolve::ResolveError;
    match e {
        ResolveError::StateRootGone | ResolveError::NoRepository => error(e.code()),
        ResolveError::Git(e) => operation(e),
        ResolveError::Machine(e) => error(e),
    }
}

/// A Git operation's refusal as the addon's error, with every field the driver reports (code,
/// cause, retryable, operation id, receipt, exit code, signal, stderr, detail): the one mapping
/// every addon door uses, so a caller sees the same error contract from any of them.
pub(crate) fn operation(e: fgos_git::OperationError) -> Error {
    error(
        json!({"code": e.code, "cause": e.cause, "retryable": e.retryable, "operationId": e.operation_id, "receipt": e.receipt, "exitCode": e.exit_code, "signal": e.signal, "stderr": e.stderr, "detail": e.detail}),
    )
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
                "durableFile": env!("CARGO_PKG_VERSION"), "canonicalJson": 1, "holderLock": 2, "sessionIdentity": 2, "yaml": 1, "config": 4, "runResult": 1, "agentProtocol": 1,
            }))
        })
        .clone()
        .map_err(error)
}

#[napi_derive::module_exports]
fn init(_exports: napi::JsObject) -> Result<()> {
    check()
}
