# Plan — gateway `/v1` route prefix (tsk-4uh)

Mode: **standard** (2 flags — public contracts, existing covered behavior —
per `fgos-routing`'s Mode-gate; no `CONTEXT.md`/`exploring` round happened,
this item's own `fgos discover` verdict was `clear`, so this plan traces its
claims to `RESEARCH.md` and this repo's own source instead).

## Approach

**Chosen path:** wrap `build_router`'s returned `Router` in
`herdr-plugin/src/gateway.rs` (currently `:698-724`) with `.nest("/v1", ...)`,
and update the 6 existing inline test `.uri(...)` call sites in the same
file's `#[cfg(test)] mod tests` (`:802,820,842,865,885,900`) to their
`/v1`-prefixed equivalents, so the crate's own test suite proves the fix
rather than merely not catching a regression it introduces.

**Why this path:** `RESEARCH.md` (docs/history/gateway-v1-route-prefix/) round
1 confirms two independent sources — the OpenAPI contract's `servers.url`
(`docs/contracts/fgos-gateway-api-v1.yaml:54-59`) and the gateway's own
startup log (`gateway.rs:739`) — already agree the code is the outlier; the
fix makes the code match both rather than changing either declaration.

**Alternative rejected:** strip `/v1` from the contract and the startup log
instead of adding the prefix in code. Rejected because `tsk-54j`'s web
dashboard is already spec'd as "an independent client calling gateway's REST
API" against the `/v1`-prefixed contract — moving the contract instead of
the code would just relocate the same mismatch to a different, larger
surface (a not-yet-written client) instead of closing it now, while the
fable audit's own Finding 1 evidence (`plans/reports/gateway-audit-
260814-2110-fable-hidden-bugs-report.md`) already treats the contract as the
correct source.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `build_router`'s route table (`gateway.rs:698-724`) | low — one well-understood `axum::Router::nest` wrapper, no route logic changes | `cargo test --manifest-path herdr-plugin/Cargo.toml` after the change |
| The 6 existing inline tests (`:802,820,842,865,885,900`) | medium if any is missed — a partially-updated set silently leaves some 404ing | full `cargo test` run showing ALL tests pass, not just a new one; `RESEARCH.md` round 1 already enumerated all 6 sites by line number so none is missed by omission |
| `/contract` route staying unauthenticated after nesting | medium — nesting could accidentally move `/contract` under the same `.route_layer(require_token)` gate it currently sits outside of (`gateway.rs:718-723`: `Router::new().route("/contract", ...).merge(authenticated)` — `/contract` is built OUTSIDE `authenticated`, then merged) | the existing `returns_contract_without_auth`-shaped test (`:865`, updated to `/v1/contract`) must keep passing with no `Authorization` header; the nest wrapper must go around the OUTER merged router (contract + authenticated together), not around `authenticated` alone, so both keep their existing auth posture relative to each other |

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` reports GitNexus `present`
(`mcp:gitnexus`). Direct query attempted: `impact({target: "build_router",
file_path: "herdr-plugin/src/gateway.rs"})` and `context({name: "run"})`
both returned "not found" — GitNexus's index carries zero indexed symbols
for this Rust file (the same class of gap CLAUDE.md's own gate names for
large/complex files, here apparently the whole `herdr-plugin` Rust crate
rather than one file). Cross-checked per the gate's own instruction: direct
`rg`/`Read` of `gateway.rs` (this plan's own Approach/Risk-map sections)
already establishes `build_router`'s only caller in this file is `run()`
(`gateway.rs:733`), and `run()` itself is `pub fn` called from `main.rs`'s
own gateway-mode dispatch (not re-verified line-by-line here — out of this
single-file fix's footprint) — blast radius for a route-table-only change is
bounded to this one file's own request routing, confirmed by direct read
rather than by GitNexus's graph.

## Files touched

- `herdr-plugin/src/gateway.rs` — only file. No split; see below.

## Split decision

**No split.** One honest piece of work: a single `.nest()` wrapper plus
updating the 6 test call sites it makes stale, all in one file, already at
`standard` lane. `fgos graph --json`'s `criticalPath`/`topUnblock` do not
include `tsk-4uh` or any gateway-audit sibling — this item is an independent
leaf, ordering among the 9 gateway-audit siblings follows the audit report's
own severity ranking (this is Finding 1, high) rather than graph-derived
unblock value.

## Outstanding questions

None
