//! Mechanical JSON binding of the foundation leaf; no second matcher.
use crate::{check, error};
use napi::Result;
use napi_derive::napi;
use serde_json::{json, Value};
#[allow(dead_code)] // exported through N-API
#[napi]
pub fn write_scope(method: String, args: Value) -> Result<Value> {
    check()?;
    let strings =
        |key: &str| serde_json::from_value::<Vec<String>>(args[key].clone()).map_err(error);
    match method.as_str() {
        "canonicalize" => Ok(json!(fgos_write_scope::canonicalize(
            args["raw"]
                .as_str()
                .ok_or_else(|| error("write entry must be a string"))?
        )
        .map_err(error)?)),
        "canonicalizeAll" => Ok(json!(fgos_write_scope::canonicalize_all(&strings(
            "scope"
        )?)
        .map_err(error)?)),
        "matches" => Ok(json!(fgos_write_scope::matches(
            args["path"]
                .as_str()
                .ok_or_else(|| error("invalid query path"))?
                .as_bytes(),
            &strings("scope")?
        )
        .map_err(error)?)),
        "expand" => {
            let mappings = args["mappings"]
                .as_array()
                .ok_or_else(|| error("invalid mappings"))?
                .iter()
                .map(|m| {
                    Ok((
                        m["from"]
                            .as_str()
                            .ok_or_else(|| error("invalid mapping source"))?
                            .to_owned(),
                        serde_json::from_value(m["also"].clone()).map_err(error)?,
                    ))
                })
                .collect::<Result<Vec<_>>>()?;
            Ok(json!(fgos_write_scope::expand(
                &strings("scope")?,
                &mappings
            )
            .map_err(error)?))
        }
        _ => Err(error("unknown-write-scope-method")),
    }
}
