//! Writer identity marshaling: the rule and the attempt-id contract live in `fgos-identity`.
use crate::{check, error};
use fgos_identity::{mint_attempt_writer_id, resolve_current, InvalidAttemptId};
use napi::Result;
use napi_derive::napi;
use serde_json::Value;
use std::path::Path;

/// `{ id, source }` for this process: its own env, process tree and pid, with `fgos_dir`'s registry confirming an env id.
#[napi(namespace = "sessionIdentity")]
pub fn resolve(fgos_dir: Option<String>) -> Result<Value> {
    check()?;
    serde_json::to_value(resolve_current(fgos_dir.as_deref().map(Path::new))).map_err(error)
}

/// `att-<attemptId>`; an unusable id fails with a message that starts with `invalid-attempt-id`.
#[napi(namespace = "sessionIdentity", js_name = "mintAttempt")]
pub fn mint_attempt(attempt: String) -> Result<String> {
    check()?;
    mint_attempt_writer_id(&attempt).map_err(|InvalidAttemptId| error(InvalidAttemptId::NAME))
}
