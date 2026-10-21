//! RFC 8785 marshaling; the number and string rules live in `fgos-canonical-json`.
use crate::{check, error};
use napi::Result;
use napi_derive::napi;
use serde_json::Value;

#[napi(namespace = "canonicalJson", js_name = "canonicalJson")]
pub fn canonical_json(value: Value) -> Result<String> {
    check()?;
    fgos_canonical_json::canonical_json(&value).map_err(error)
}
