//! The terminal-control route asked in process: its core built from the same envelope the route process reads,
//! through the one door the `terminal-control` route builds its core by (`CoreParts`). One place for the doctor's
//! terminal rows, the dispatch reads that scan allocations and the probe that closes the pane a round left open.

use fgos_execution_engine::transport::terminal_slot::resolve_herdr_bin;
use fgos_terminal_control::route::{ConfigRefusal, CoreParts};
use serde_json::{json, Map, Value};
use std::time::Instant;

/// The whole budget of one route question, as the Node client gave it.
pub(crate) const ROUTE_TIMEOUT_MS: u64 = 15_000;

/// The herdr endpoint and binary a route is asked through.
pub(crate) struct HostRoute {
    herdr_bin: String,
    env: Map<String, Value>,
}

impl HostRoute {
    /// The route for the herdr endpoint `env` names (its `HERDR_*` or anchor variables; empty is the caller's own
    /// endpoint), with the herdr binary found through `lookup`.
    pub(crate) fn new(env: Map<String, Value>, lookup: &dyn Fn(&str) -> Option<String>) -> Self {
        HostRoute {
            herdr_bin: resolve_herdr_bin(None, lookup),
            env,
        }
    }

    /// The route for `env`, with the herdr binary found through this process's environment.
    pub(crate) fn from_process(env: Map<String, Value>) -> Self {
        Self::new(env, &|key: &str| std::env::var(key).ok())
    }

    /// The herdr binary this route asks through.
    pub(crate) fn herdr_bin(&self) -> &str {
        &self.herdr_bin
    }

    /// The route's core parts under the `terminal` settings `config`, or why the core cannot be built.
    pub(crate) fn parts(&self, config: &Value) -> Result<CoreParts, ConfigRefusal> {
        let envelope = json!({
            "herdrBin": self.herdr_bin,
            "env": self.env,
            "config": config,
            "timeoutMs": ROUTE_TIMEOUT_MS,
        });
        CoreParts::from_envelope(&envelope, Instant::now())
    }
}
