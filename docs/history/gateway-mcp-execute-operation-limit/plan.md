# Plan — MCP execute operation/output limit (tsk-1qe)

Mode: **small** (0 Mode-gate flags fire — D9's own sandbox-privilege scope
is explicitly NOT reopened by this item, `RESEARCH.md` cites the real
vendored Rhai API rather than guessing, and no existing test covers this
exact failure mode today — but the fix bounds a shared engine used by
every `execute` call, warranting more than a one-line `tiny` note).

## Approach

**Chosen path:** call `Engine::set_max_operations(500_000)` in
`build_engine` (`mcp.rs:179`), and cap the shared print/debug output buffer
by total bytes (256 KiB) so an accidental print-loop can't grow memory
unbounded even before the operation cap trips.

**Why these two, not one:** `RESEARCH.md` round 1 confirms both gaps are
real and independent — `set_max_operations` bounds CPU/thread time (an
empty `loop {}`), the output cap bounds memory (`loop { print("x") }`) —
fixing only one leaves the other reachable by a different one-line script.

**Why 500,000 operations:** no canonical default exists in Rhai's own API
(`RESEARCH.md`); reasoned from this module's own real usage shape — every
bound function (`list_work`/`submit_work`/etc.) executes in Rust, so a
legitimate multi-call Code-Mode script needs very few real Rhai-level
operations, while 500,000 still gives wide headroom for any native Rhai
control flow a real script might do, and fails an accidental infinite loop
in well under a second (Rhai executes a plain loop body at roughly millions
of ops/sec).

**Explicitly NOT reopening D9** (`docs/history/fgos-gateway-mcp-surface/
CONTEXT.md`, which deprioritizes sandbox *privilege* hardening for v1):
this fix is availability-only (an ordinary generation bug, not a privilege
escape) — no new function is registered, no existing allowlist boundary
changes.

**Alternative rejected:** `on_progress` with a wall-clock deadline (fable's
alternative suggested direction). `set_max_operations` is the simpler,
purpose-built API for exactly this case (an operation-count budget, not a
time budget) and needs no extra closure/state — a wall-clock deadline would
duplicate `tsk-4lf`'s own timeout mechanism for a different, CPU-bound
failure mode that an operation cap already closes more directly.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `set_max_operations(500_000)` | low — single documented API call, well-defined failure mode (`ErrorTooManyOperations`) already folds into `run_script`'s existing `Err` path | new test: `let x = 0; loop { x += 1; }` (the finding's own example) returns `Err` promptly instead of hanging |
| Output-buffer byte cap | low — additive change to `on_print`/`on_debug`, does not alter the success path's existing shape for any script under the cap | new test: a script whose `print` output would exceed the byte cap does not grow the returned string past the cap |
| Existing legitimate multi-call scripts | low — `RESEARCH.md`'s own reasoning: bound-function calls cost Rhai little; 500,000 ops and 256 KiB both sit well above any real Code-Mode script's actual usage | existing `mcp::tests` suite (execute-bound-function tests) stays green under the new caps |

**Impact-analysis posture: degraded** (same GitNexus gap as the prior three
gateway-audit items for this crate; cross-checked via `RESEARCH.md`'s
direct read of the vendored Rhai source and `mcp.rs`'s real call sites
instead).

## Files touched

- `herdr-plugin/src/mcp.rs` — only file. No split.

## Split decision

**No split.** One honest piece: two small, independent caps in the same
function. `fgos graph --json`'s `criticalPath`/`topUnblock` do not include
`tsk-1qe` or any gateway-audit sibling; ordering follows the audit report's
severity ranking (Finding 4, medium, fourth in the queue).

## Outstanding questions

None
