# fgOS gateway MCP surface — plan

Item: `tsk-7l9-3`. Builds directly on `CONTEXT.md`'s locked D1 (execute's
generated code is Rust-native scripting, not an embedded JS engine) and the
parent item's D7-D10 (`docs/history/fgos-interface-daemon/CONTEXT.md`) —
gateway is the sole `fgos <verb>` chokepoint, gateway/orchestrator/TUI stay
inside one `herdr-fgos` binary using the existing hexagonal ports, and the
MCP surface is part of that same gateway adapter (D8: "gateway's REST/RPC/
MCP surface"), never a separate process.

Mode: **high-risk**

Flag count against `fgos-routing`'s Mode gate: **audit/security** (this
item's whole point is a new same-process code-execution surface —
`execute` runs LLM-generated scripting code against bound Rust functions;
D9/D1 already settled that no *new privilege* is granted over today's
CLI/Bash trust model, but "new code-execution surface" is still the
textbook audit/security flag and is explicitly named in the Mode gate's own
hard-gate list — this alone forces high-risk regardless of count),
**external systems** (three new crates never used anywhere in this repo
today: `rmcp`, `mcpkit-axum`, and a scripting-engine crate), **public
contracts** (a brand-new MCP tool surface — `search`/`execute` — consumed
by external agent clients, joining the CTR family the parent's D10 already
established for the REST contract), **weak proof around the area** (first
MCP server and first embedded scripting engine in this codebase — no
existing precedent to lean on, unlike the REST gateway which reused
`tsk-3t9`'s hexagon directly). 4 flags, one of them hard-gate — high-risk
either way (`plugins/fgOS/skills/fgos-routing/SKILL.md` Mode gate).

No lane was handed off in this session's own Orient step (this session was
dispatched directly by `fgos-coding-driving` from `fgos-coding-exploring`,
not routed through `fgos-routing` first) and `plan.md` did not already
exist — direct-entry fallback, `fgos-routing`'s own Mode-gate subsection
applied fresh, as above.

## Approach

**Chosen path.** Extend `herdr-plugin`'s existing gateway adapter
(`herdr-plugin/src/gateway.rs`, `tsk-7l9-2`, delivered) with a sibling
module, `herdr-plugin/src/mcp.rs`, rather than a new process or a new
`main.rs` launch mode. `gateway.rs`'s `build_router` already returns one
`axum::Router` serving the REST surface on `DEFAULT_PORT` (4170); `mcp.rs`
mounts the MCP transport onto that SAME router (`mcpkit-axum` is
purpose-built for exactly this — "MCP-over-HTTP via Axum", `into_router()`
nesting it under a path like `/mcp` alongside other routes, confirmed
against its own `docs.rs` page during this validating pass) rather than
spawning a second listener or a stdio-transport subprocess. This is what
lets `herdr-fgos gateway`'s existing single-process launch (`main.rs`'s
existing `gateway` dispatch, untouched) cover MCP for free — no new CLI
mode, no second `AppState`, one hexagon per D8.

**Correction found during `fgos-coding-validating`'s reality gate:**
`CONTEXT.md`'s own Scout evidence said `mcpkit-axum` matches "the
gateway's existing axum 0.7 stack" — checked directly against
`mcpkit-axum`'s `docs.rs` page here, that claim is false: it requires
`axum ^0.8`, not `0.7`. `axum` 0.8's own release notes carry a real
breaking change reaching beyond the MCP feature itself: route
path-parameter syntax moved from `:id`/`*rest` to `{id}`/`{*rest}`, and
the OLD syntax now panics at router-build time instead of silently
working. `gateway.rs` declares 10 routes using the old syntax today
(`/work/:id`, `/work/:id/move`, `/work/:id/ask`, `/work/:id/answer`,
`/work/:id/take`, `/work/:id/return`, `/work/:id/approve`,
`/work/:id/reject`, `/rollup/:id`, `/sessions/:sessionId`,
`/sessions/:sessionId/slots` — `herdr-plugin/src/gateway.rs:693-709`,
read fresh this pass). No breaking change was found for `State`,
`middleware::from_fn_with_state`, or `Json` — the handler bodies
(`AxPath` extraction inside each handler) are unaffected, only the
router's own route-string literals need the `:x` → `{x}` rewrite. This
folds into phase 1 below as a bounded, mechanical, fully test-covered
migration (baseline confirmed this pass: `cargo test --manifest-path
herdr-plugin/Cargo.toml` passes 152 tests across 4 suites today — the
same suite re-run after the rewrite is the proof point that behavior did
not change) — never a reason to abandon `mcpkit-axum` or the "one
router" architecture above, just a real prerequisite step this plan did
not originally carry.

`search` reads the same OpenAPI spec `gateway.rs`'s existing
`get_contract` handler already serves (`docs/contracts/fgos-gateway-api-v1.yaml`,
`CTR010`) — no new data source, just a second way to reach data the
gateway already exposes. `execute` runs against a curated set of bound
Rust functions that call into the SAME route handlers `gateway.rs`
already defines (`post_work`, `get_ready`, `post_work_move`, etc.) —
never a raw HTTP round-trip to itself and never a new path into
`fgos <verb>` beyond `spawn_fgos_verb` (D7's chokepoint, unchanged).

**Scripting crate: `rhai`, picked here** (`CONTEXT.md`'s own "Out of
scope" note explicitly defers this exact choice to `fgos-coding-planning` —
this is that decision, cited under D1). Two real candidates exist for a
Rust-embeddable scripting language: `rhai` (pure Rust, no C toolchain,
purpose-built for embedding, `#[export_module]` binding ergonomics) and
`mlua` (Lua bindings, FFI-based, needs either a system Lua via
`pkg-config` or the `vendored` feature that builds Lua from C source at
compile time). Both crate claims checked directly against their own
GitHub READMEs during this validating pass: Rhai's dependency list is
Rust-only (`smallvec`, `thin-vec`, `num-traits`, `once_cell`, `ahash`,
`bitflags`, `smartstring`) with only "relatively little `unsafe` code...
for performance reasons"; `mlua`'s own README states it "contains a huge
amount of unsafe code" and explicitly "does not provide absolute safety
even without using `unsafe`" — `mlua`'s vendored-C dependency (or system
Lua requirement) reintroduces exactly the "extra runtime layer to embed
and maintain" D1 rejects a JS engine for — Rhai avoids that entirely and
stays pure Rust end to end, consistent with D1's own rationale, not just
its letter. The trade-off is LLM code-generation
fluency: Lua has far more training-data representation than Rhai. This is
mitigated, not eliminated, by Rhai's own design goal of staying
syntactically close to Rust/JS (familiar shape to any model that already
writes those well) and by the MCP tool description itself carrying a short
syntax/API primer — the same shape Code Mode's own pattern already needs
regardless of target language, since the model has never seen the
gateway's bound-function surface before either way.

**Alternatives rejected:**
- A separate MCP server binary/process — rejected, contradicts D8
  (gateway/orchestrator/TUI stay inside one `herdr-fgos` binary; a second
  binary reopens the boundary `tsk-3t9`'s hexagon already closed).
- JS/TS generated code via an embedded JS engine (`rquickjs`, narrower
  than the `boa`/`deno_core` D9 already excludes) — rejected per this
  item's own D1: no sandbox requirement exists to justify the extra
  runtime layer.
- One MCP tool per gateway REST endpoint (~16 tools mirroring
  `build_router`'s route list) — rejected per the parent D9: Code Mode's
  actual point is exactly 2 tools cutting round-trips, not one-tool-per-
  endpoint.
- `mlua` over `rhai` — rejected per the scripting-crate reasoning above
  (vendored-C dependency contradicts D1's own "no extra runtime layer"
  rationale).

**Files likely touched:**
- `herdr-plugin/Cargo.toml` — bump `axum` `0.7` → `0.8` (required for
  `mcpkit-axum`, see correction above), add `rmcp`, `mcpkit-axum`, `rhai`
- `herdr-plugin/src/gateway.rs` — rewrite the 10 existing `:id`/
  `:sessionId` route declarations to `{id}`/`{sessionId}` (axum 0.8
  syntax, mechanical, no handler-body changes), then mount the MCP
  transport onto the existing router inside `build_router`
- `herdr-plugin/src/mcp.rs` — new module: MCP server scaffolding, `search`
  tool (phase 1), `execute` tool + Rhai bound-function context (phase 2)
- `herdr-plugin/src/lib.rs` — register `pub mod mcp;`

**Order.** Single item, no sibling ids — `fgos graph --what-if <id> --json`
has nothing real to run against — noted here rather than silently skipped.
Ordering instead follows direct dependency: phase 2 (`execute`) needs the
MCP server scaffolding phase 1 stands up (transport, tool registration,
`search`) to exist first; phase 1 has no dependency on phase 2 and is
provably useful alone (an MCP client can already discover the gateway's
capability surface via `search` before `execute` exists). `fgos graph
--json` (whole-repo run, above) shows `tsk-7l9-3` inside a live component
with `tsk-7l9`/`tsk-7l9-1`/`tsk-7l9-2` already delivered — nothing there
changes this item's own internal ordering.

**Impact-analysis posture:** `degraded` (re-checked at
`fgos-coding-validating`'s re-entry pass, 2026-08-13T11:48Z: GitNexus is
registered and `present` — `fgos tool query --capability impact-analysis
--status present` returns the `gitnexus` provider — but its index is
stale, flagged behind current HEAD (last indexed `c0cedaa`, 15 commits
back, including `90274891` which added the `herdr-plugin/gateway.rs`
surface this item's own `mcp.rs` extends). Downgraded here from the
`full` posture an earlier pass recorded, per this repo's own
impact-analysis capability gate — `present` alone never means fresh.
Named plainly rather than silently carried forward: this does not block
readiness because, as before, both phases below are net-new modules with
no existing callers, so blast-radius evidence has nothing to contradict
regardless of index freshness — no proof point below leans on it either
way.

**Single-item, no split (human decision, 2026-08-13).** `fgos plan
--verdict decompose` with the 2-piece split below (phase 1 as
`tsk-7l9-3-1`, phase 2 as `tsk-7l9-3-2`) hit `src/intake/plan.mjs`'s
`footprintOverlapAmong` hard gate twice in a row on the identical
conflict: both pieces declare `herdr-plugin/Cargo.toml` and
`herdr-plugin/src/mcp.rs` in their footprint, since phase 2 genuinely
extends the same `mcp.rs` module phase 1 creates and adds its own crate
line to the same `Cargo.toml`. Checked directly against
`src/intake/plan.mjs:794-812`: this gate is re-derived fresh from
`verdict.children`'s footprint arrays on every call, carries no
bypass-detection constant (unlike `keywordRiskGate`/`blastRadiusGate`
elsewhere in the same file), and its own code comment says it clears only
once a human's answer leads the next call to propose a genuinely
non-overlapping footprint shape — a plain confirmation to proceed cannot
satisfy it, only a different footprint shape can. Re-slicing the
footprint apart (e.g. hoisting `mcp.rs`/`Cargo.toml` into a third piece)
would be artificial: the module and its one dependency line are the
smallest real unit either phase touches. The user decided instead to stop
splitting: this item stays a single work item (`tsk-7l9-3`, no children),
still `high-risk` lane/review, implemented as one pass with the same two
phases below done as two separate commits for traceability, rather than
as two separate work items. `fgos plan --verdict pass-through` is the verb
that carries this (`src/cli/command-registry.mjs:195`'s own example:
`fgos plan build-cli --verdict pass-through --reason "single-piece, no
split needed"`) — it moves the item straight to `executing` without
touching `footprintOverlapAmong` at all, since no children are proposed.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `axum` 0.7 → 0.8 bump + route-syntax rewrite (required for `mcpkit-axum`, found during this validating pass — see Approach correction above) | medium (mechanical, but touches every existing route) | baseline `cargo test --manifest-path herdr-plugin/Cargo.toml` already confirmed 152/152 passing this pass; the same 152 must still pass after the `:x`→`{x}` rewrite, with no other diff in `gateway.rs` handler bodies |
| MCP server scaffolding (`rmcp` + `mcpkit-axum` mounted onto the existing axum router) | medium | `cargo test --manifest-path herdr-plugin/Cargo.toml` passes with a new test asserting the MCP transport advertises exactly 2 tools (`search`, `execute`); existing REST routes/tests (`tsk-7l9-2`'s) still pass unchanged |
| `search` tool (queries the OpenAPI contract) | light | integration test: `search`'s MCP response matches the same spec `GET /contract` already serves, byte-for-byte on the parsed structure |
| `execute`'s bound-function context (Rhai binding, D1) | high (security-adjacent — audit/security hard-gate flag) | a script calling a bound function succeeds and its effect matches calling that same `fgos <verb>` directly; a script attempting anything outside the bound-function allowlist (e.g. raw filesystem/process access Rhai doesn't expose by default) fails cleanly — proves the "no new privilege beyond today's CLI/Bash trust model" boundary D9 promises, never assumes it |
| Scripting crate pick (`rhai`, decided above under D1) | medium | `cargo build --release --manifest-path herdr-plugin/Cargo.toml` succeeds with `rhai` added (no C toolchain / vendored-build step introduced — confirms the "pure Rust end to end" claim above); a trivial script calling one bound function runs end to end inside a `#[tokio::test]` |

## Shape

Two phases, matching the implementation plan below. Concrete cases to
prove against, scaled to `high-risk`:

- **Empty/boundary** — `search` with a query matching nothing returns an
  empty result, not an error; `execute` with an empty/no-op script returns
  cleanly rather than hanging the connection.
- **Existing behavior** — `tsk-7l9-2`'s existing REST routes and their
  tests are untouched; the MCP transport is additive on the same router,
  never a replacement.
- **Concurrent access** — multiple simultaneous `execute` calls behave the
  same as concurrent REST requests already do today (axum's own
  per-request handling; no new shared mutable state introduced beyond what
  `AppState`/`spawn_fgos_verb` already serialize through).
- **Partial failure** — a script that errors mid-run surfaces a clean MCP
  tool-error response to the client; it never panics the gateway process
  or leaves a half-applied `fgos <verb>` call (D7's chokepoint already
  gives every verb call its own atomic outcome; `execute` must not bypass
  that by, e.g., catching a panic mid-verb-spawn).

## Implementation plan (single item, no split)

One work item (`tsk-7l9-3`), one `executing` pass, two phases done as two
separate commits on `fgw/tsk-7l9-3` for traceability — not two work items.
Combined footprint across both phases: `herdr-plugin/Cargo.toml`,
`herdr-plugin/src/mcp.rs`, `herdr-plugin/src/lib.rs`,
`herdr-plugin/src/gateway.rs`.

**Phase 1 (commit 1) — MCP server scaffolding + search tool on the fgOS
gateway.** D1: the MCP surface stays Rust-native end to end (`rmcp` +
`mcpkit-axum`, no embedded JS engine) — mounted onto `herdr-fgos`'s
existing axum router (`herdr-plugin/src/gateway.rs`'s `build_router`)
rather than a new process, matching D1's own "no extra runtime layer to
embed or maintain" rationale. Includes the axum 0.7→0.8 bump and the
mechanical `:id`→`{id}` route-syntax rewrite `mcpkit-axum` requires
(found during `fgos-coding-validating`'s reality gate, cited under this
same D1 since it is a prerequisite of the D1-mandated crate choice).
`search` queries the same OpenAPI contract `gateway.rs`'s existing
`get_contract` handler already serves.
- Verify: `cargo test --manifest-path herdr-plugin/Cargo.toml && cargo
  build --release --manifest-path herdr-plugin/Cargo.toml`
- Footprint: `herdr-plugin/Cargo.toml`, `herdr-plugin/src/mcp.rs`,
  `herdr-plugin/src/lib.rs`, `herdr-plugin/src/gateway.rs`
- Risk: standard

**Phase 2 (commit 2) — MCP execute tool: Rhai bound-function context
against gateway routes.** D1: `execute`'s generated code is Rust-native
scripting (`rhai`, picked in this plan's own Approach section under D1)
bound to the gateway's own route handlers, never fgOS core directly —
still funnels through `gateway.rs`'s `spawn_fgos_verb` chokepoint (parent
D7). No new privilege beyond today's CLI/Bash trust model (parent D9) —
the bound-function allowlist is exactly `gateway.rs`'s existing route
set, nothing wider. Builds directly on phase 1's MCP scaffolding
(same-commit-history dependency, not a cross-item `deps` edge, since both
phases live in one item).
- Verify: `cargo test --manifest-path herdr-plugin/Cargo.toml && cargo
  build --release --manifest-path herdr-plugin/Cargo.toml`
- Footprint: `herdr-plugin/Cargo.toml`, `herdr-plugin/src/mcp.rs`
- Risk: heavy (security-adjacent — audit/security hard-gate flag, see
  Mode above)

Ordering follows the same direct dependency the earlier 2-piece split
used: phase 2 (`execute`) needs the MCP server scaffolding phase 1 stands
up (transport, tool registration, `search`) to exist first; phase 1 has
no dependency on phase 2 and is provably useful alone (an MCP client can
already discover the gateway's capability surface via `search` before
`execute` exists).

## Assumptions

- The MCP transport mounts on the SAME port/router the REST gateway
  already serves (4170) rather than a second port -- confirmed during this
  validating pass against `mcpkit-axum`'s own `docs.rs` page: it exposes
  `into_router()` specifically to nest into an existing app under a path
  like `/mcp`, alongside other routes. What remains unproven until piece 1
  is actually implemented is the exact `McpRouter`/`into_router()` call
  shape against this repo's own `AppState`/`Router<AppState>` type -- a
  normal implementation-time detail, not a planning-level risk.
- `execute`'s bound-function allowlist mirrors `gateway.rs`'s existing
  authenticated route set one-for-one (same routes `search`/REST already
  expose) rather than a narrower or wider set -- CONTEXT.md's own D1/D9
  give no reason to diverge, and a narrower allowlist is free to add later
  without breaking this shape.
- Auth: the MCP surface reuses the SAME per-machine token
  (`~/.fgos/config.json`'s `gateway.token`, parent D4/D5) the REST surface
  already requires via `require_token` -- no second auth mechanism, since
  both surfaces sit on the same `AppState`/router.

## Outstanding questions

None
