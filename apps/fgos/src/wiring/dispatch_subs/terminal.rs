//! The terminal-control route asked in process, built from the same envelope the route process reads: one place for
//! the dispatch reads that scan allocations and the probe that closes the pane a round left open.

use fgos_execution_engine::transport::terminal_slot::resolve_herdr_bin;
use fgos_terminal_control::route::CoreParts;
use serde_json::{json, Map, Value};
use std::time::Instant;

/// The route is asked with the timeout the doctor's terminal rows use.
const ROUTE_TIMEOUT_MS: u64 = 15_000;

/// The route's core parts for the herdr endpoint `env` names (its `HERDR_*` variables; empty is this process's own
/// endpoint), or why the core cannot be built.
pub(crate) fn route_parts(env: Map<String, Value>) -> Result<CoreParts, String> {
    let lookup = |key: &str| std::env::var(key).ok();
    let envelope = json!({
        "herdrBin": resolve_herdr_bin(None, &lookup),
        "env": env,
        "config": {},
        "timeoutMs": ROUTE_TIMEOUT_MS,
    });
    CoreParts::from_envelope(&envelope, Instant::now()).map_err(|refusal| refusal.message)
}
