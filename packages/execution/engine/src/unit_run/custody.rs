//! The Execution doors over a worktree's custody: the per-worktree dispatch lease belongs to
//! `fgos-run-supervisor` (`controller::cwd_lock`); this module only adds the unit run's shape on top of it.

use std::path::Path;

use fgos_holder_lock::{Handle, LockScope};
use fgos_run_supervisor::controller::cwd_lock::{admit_successor, record_custody_handoff};
use fgos_run_supervisor::controller::error::DispatchError;
use serde_json::{json, Value};

pub use fgos_execution::custody::{custody_held, worktree_key, WORKTREE_ADMIN_SCOPE};

/// Run `body` as the successor holder of `worktree`'s custody: admitted before the body starts, the hand-off
/// recorded on the object the body returns once it ends, released whichever way it ends (the handle drops). A
/// body that panics records no hand-off. The body returns an object: a hand-off that cannot be recorded adds a
/// `custody-handoff-not-recorded` warning to its `warnings`.
pub fn run_under_custody<F>(
    worktree: &Path,
    fgos_dir: &Path,
    body: F,
) -> Result<Value, DispatchError>
where
    F: FnOnce(&Handle) -> Value,
{
    let scope = LockScope::seeded(Vec::new())
        .map_err(|e| DispatchError::new("lock-registry-invalid", e.to_string()))?;
    let custody = admit_successor(&scope, fgos_dir, worktree)?;
    let mut result = body(&custody);
    if let Some(warning) = record_custody_handoff(Some(&custody)) {
        if let Some(object) = result.as_object_mut() {
            let mut warnings = object
                .get("warnings")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default();
            warnings.push(warning);
            object.insert("warnings".into(), json!(warnings));
        }
    }
    Ok(result)
}
