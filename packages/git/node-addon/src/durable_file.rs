//! Durable file marshaling: bytes, mode and the install evidence cross; the protocol stays in `fgos-durable-file`.
use crate::check;
use fgos_durable_file::{
    install_once_with_mode, replace_durably_with_mode, InstallError, Installed,
};
use napi::bindgen_prelude::Buffer;
use napi::{Error, Result};
use napi_derive::napi;
use std::path::Path;

fn word(installed: Option<Installed>) -> &'static str {
    match installed {
        Some(Installed::Created) => "created",
        Some(Installed::AlreadyExists) => "already-exists",
        None => "none",
    }
}
/// The message names the step that failed and carries the effect (`installed`) and any retained temporary.
fn failure(e: InstallError) -> Error {
    let temporary = e
        .temporary
        .as_ref()
        .map(|t| t.to_string_lossy().into_owned());
    Error::from_reason(serde_json::json!({"cause": e.to_string(), "installed": word(e.installed), "temporary": temporary}).to_string())
}

#[napi(namespace = "durableFile", js_name = "replaceDurably")]
pub fn replace_durably(
    dir: String,
    name: String,
    bytes: Buffer,
    mode: u32,
) -> Result<&'static str> {
    check()?;
    replace_durably_with_mode(Path::new(&dir), &name, &bytes, mode)
        .map(|i| word(Some(i)))
        .map_err(failure)
}

#[napi(namespace = "durableFile", js_name = "installOnce")]
pub fn install_once(dir: String, name: String, bytes: Buffer, mode: u32) -> Result<&'static str> {
    check()?;
    install_once_with_mode(Path::new(&dir), &name, &bytes, mode)
        .map(|i| word(Some(i)))
        .map_err(failure)
}
