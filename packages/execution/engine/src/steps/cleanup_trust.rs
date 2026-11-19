//! cleanup-trust: take back the codex or agy folder-trust entry the controller wrote into an agent's trust store
//! before it launched the attempt, so the store does not grow one entry per attempt.
//!
//! The controller writes `controller/trust-context.json` only when it wrote such an entry itself; an entry a
//! person vouched for is never named there and is never removed. A claude entry is never taken back: a record of
//! one, left by an older release, is answered `not-removed`. Removing an entry that is already gone is a success;
//! a store that cannot be read or written keeps the entry, and the step says `remove-failed`.

use std::path::{Path, PathBuf};

use fgos_run_supervisor::controller::trust_store::{remove_agy_trust, remove_codex_trust};
use serde_json::{json, Value};

use super::{StepOutcome, StepResult};

pub fn trust_context_file() -> PathBuf {
    Path::new("controller").join("trust-context.json")
}

fn read_context(run_dir: &Path) -> Option<Value> {
    let text = std::fs::read_to_string(run_dir.join(trust_context_file())).ok()?;
    serde_json::from_str(&text).ok()
}

pub fn cleanup_trust(run_dir: &Path) -> StepResult {
    let done = |detail: Value| Ok(StepOutcome::Done(detail));
    let Some(context) = read_context(run_dir) else {
        return done(json!({"trust": "none-written"}));
    };
    let text = |key: &str| context.get(key).and_then(Value::as_str).map(str::to_string);
    let (Some(kind), Some(target), Some(project)) =
        (text("kind"), text("target"), text("projectPath"))
    else {
        return done(json!({"trust": "context-unusable"}));
    };
    let removed = match kind.as_str() {
        "codex-toml" => remove_codex_trust(Path::new(&target), &project),
        "agy" | "agy-json" => remove_agy_trust(Path::new(&target), &project),
        _ => return done(json!({"trust": "not-removed", "kind": kind})),
    };
    match removed {
        Ok(true) => done(json!({"trust": "removed", "kind": kind})),
        Ok(false) => done(json!({"trust": "already-gone", "kind": kind})),
        Err(err) => done(json!({"trust": "remove-failed", "kind": kind, "code": err.code})),
    }
}
