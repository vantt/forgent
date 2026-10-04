/// (D7) Gateway verb-chokepoint seam (tsk-7l9-2): the ONE trait a gateway
/// HTTP handler calls through to run an `fgos <verb>` invocation. This is a
/// new, sibling seam to (a) `WorkItemSource` above — the TUI's own
/// `fgos.rs` read calls stay on that port, untouched; a gateway route
/// calls this one instead, so both ultimately funnel through the same
/// "only ever spawn `fgos <verb>` as a subprocess, never link the core lib"
/// boundary D8 already locked, just via two different callers of the same
/// underlying CLI-shelling mechanism.
///
/// Deliberately synchronous (not `async fn`, which would need the
/// `async-trait` crate or a hand-rolled boxed future): `fgos.rs`'s own
/// `FgosCliSource` already shells out to `node bin/fgos.mjs` synchronously
/// via `std::process::Command`, so the concrete adapter
/// (`gateway::FgosCliGateway`) does the same. Axum route handlers run it
/// through `tokio::task::spawn_blocking` (see `gateway.rs`) so this
/// blocking call never stalls the async runtime's own worker threads.
pub trait VerbGateway: Send + Sync {
    /// Runs `fgos <args...> --dir <root>`, parses the resulting `fgos.v1`
    /// envelope on stdout, and returns its `data` field on exit 0 — or a
    /// `GatewayError` carrying the same closed category taxonomy CTR001's
    /// own `EXIT_CODES` defines (`src/state/store.mjs`) on a non-zero exit.
    fn run_verb(&self, args: &[String]) -> Result<serde_json::Value, crate::gateway::GatewayError>;
}
