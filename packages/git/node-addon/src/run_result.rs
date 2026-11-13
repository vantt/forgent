//! `runResult` namespace: the Node door to the Run Result outcome derivation of `fgos-run-result`.
use crate::{check, error};
use napi::{Error, Result, Status};
use napi_derive::napi;
use serde_json::Value;

/// The outcome `{category, reason}` of a classification given as JSON text.
#[napi(namespace = "runResult", js_name = "deriveOutcome")]
pub fn derive_outcome(classification: String) -> Result<Value> {
    check()?;
    let classification: Value = serde_json::from_str(&classification)
        .map_err(|e| Error::new(Status::InvalidArg, format!("run-result-not-json: {e}")))?;
    serde_json::to_value(fgos_run_result::derive_outcome(&classification)).map_err(error)
}

/// Whether a version-3 record's recorded category agrees with the category its classification derives.
#[napi(namespace = "runResult", js_name = "recordedCategoryAgrees")]
pub fn recorded_category_agrees(recorded: String, derived: String) -> Result<bool> {
    check()?;
    Ok(fgos_run_result::recorded_category_agrees(
        &recorded, &derived,
    ))
}
