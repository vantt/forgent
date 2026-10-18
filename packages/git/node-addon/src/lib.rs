//! One Node-API load for both foundations. No protocol decisions live here.
mod event_store;
mod git;
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
    Ok(
        json!({"addon": env!("CARGO_PKG_VERSION"), "git": env!("CARGO_PKG_VERSION"), "eventStore": env!("CARGO_PKG_VERSION"), "napi": 8}),
    )
}

#[napi_derive::module_exports]
fn init(_exports: napi::JsObject) -> Result<()> {
    check()
}
