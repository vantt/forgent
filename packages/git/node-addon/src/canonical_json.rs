//! RFC 8785 over JSON text; the number and string rules live in `fgos-canonical-json`.
use crate::{check, error};
use napi::{Error, Result, Status};
use napi_derive::napi;
use serde_json::Value;

#[napi(namespace = "canonicalJson", js_name = "canonicalJson")]
pub fn canonical_json(text: String) -> Result<String> {
    check()?;
    let value: Value = serde_json::from_str(&text)
        .map_err(|e| Error::new(Status::InvalidArg, format!("canonical-json-not-json: {e}")))?;
    fgos_canonical_json::canonical_json(&value).map_err(error)
}
