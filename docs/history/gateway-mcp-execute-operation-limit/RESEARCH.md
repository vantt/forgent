# Research — MCP execute operation/output limit (tsk-1qe)

## Round 1 — 2026-08-14

**Asked:** does Rhai (vendored source, `~/.cargo/registry/.../rhai-1.25.1`)
really default to unlimited operations as the finding claims, what's the
real API to bound it, what error does it produce, and is there a canonical
recommended limit value.

**Checked:**
- `rhai-1.25.1/src/api/limits.rs:173-176` — real API:
  `Engine::set_max_operations(&mut self, operations: u64)`, `0` = unlimited.
- `rhai-1.25.1/src/api/limits.rs:105` — `EngineLimits`'s own `Default` impl:
  `num_operations: None` — confirms the finding's claim: an engine built
  with `Engine::new()` (`mcp.rs:179`, unchanged) really is unbounded today.
- `rhai-1.25.1/src/types/error.rs:97` — hitting the limit produces
  `EvalAltResult::ErrorTooManyOperations(Position)`, whose `Display` reads
  "Too many operations" (`:176`) — folds cleanly into `run_script`'s
  existing `Err(err) => ... format!("{err}")` path (`mcp.rs:322-326`) with
  no new error-handling shape needed.
- `rhai-1.25.1/src/api/limits.rs` / `config.rs` — no built-in recommended
  default constant; the limit is genuinely a caller-chosen budget, not a
  documented canonical number. Reasoned choice, not measured: this MCP
  surface's own bound functions (`list_work`/`submit_work`/`get_work`/
  `move_work`/`graph`/...) each execute in Rust, not counted heavily by
  Rhai's own op-counter beyond the call expression itself — a legitimate
  Code-Mode script (module doc: search then a handful of bound calls,
  `mcp.rs:1-4`) needs very few real Rhai-level operations; a native Rhai
  loop over returned data could plausibly need thousands. 500,000 gives
  wide headroom for any plausible legitimate control flow while still
  failing an accidental infinite loop in well under a second (Rhai
  executes a plain loop body at roughly millions of ops/sec).
- `mcp.rs:183-185` (`on_print`/`on_debug` closures) — currently push every
  line to a shared `Arc<Mutex<Vec<String>>>` with no cap; `run_script`
  (`:308-329`) joins the whole buffer into the final response string.
  Capping by total captured bytes (not line count) is the safer bound
  against one very long single `print()` call, not just many short ones.

**Still open:** none.
