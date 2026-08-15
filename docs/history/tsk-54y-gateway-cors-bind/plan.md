# plan.md — tsk-54y: gateway CORS layer + configurable bind address

Mode: **high-risk**

Flag count/which applied (per `fgos-routing`'s Mode gate): 2 flags —
**audit/security** (hard-gate flag on its own per the Mode gate table: this
item changes the gateway's network exposure surface — bind address moves
from a hardcoded loopback-only default toward a configurable one that can
be `0.0.0.0`, which is precisely the threat-model change
`docs/history/herdr-web-dashboard/CONTEXT.md` D6/D7 and this feature's own
D13 already reasoned about) and **existing covered behavior** (`build_router`
carries 9 direct downstream test/process hits per the impact scan below —
CRITICAL risk rating from `gitnexus impact`). A hard-gate flag alone forces
`high-risk` regardless of total count, per the Mode gate table
(`fgos-routing` §Mode gate: "4+ flags, or any hard-gate flag ... →
high-risk").

`impact-analysis: full` — `fgos tool query --capability impact-analysis
--status present` returns gitnexus `status: present` (2026-08-15,
confirmed fresh in this same session). Ran `mcp__gitnexus__impact` against
both functions this item touches:

- `run` (upstream): risk `LOW`, 1 direct hit (`require_token`, a helper
  process, not a test) — the bind-address line is inside `run`, so this
  confirms the blast radius of the bind change itself is narrow.
- `build_router` (upstream): risk `CRITICAL`, 9 direct hits across two
  clusters — 8 of the 9 are named `gateway.rs` test functions
  (`unauthenticated_request_to_a_gated_route_is_rejected`,
  `authenticated_request_reaches_the_verb_chokepoint`,
  `a_malformed_query_string_returns_the_same_error_envelope_every_other_
  error_uses`, etc. — see `gitnexus://repo//home/vantt/projects/forgentX/
  processes` for the full flow list). This is where the CORS layer attaches
  (`.layer(...)`), so every one of those 9 tests re-exercises the router
  after the change and is the proof surface for "did adding `CorsLayer`
  break anything existing," not a list of things expected to change.

## Approach

**Chosen path:** add `tower-http = { version = "0.7", features = ["cors"] }`
to `herdr-plugin/Cargo.toml` (D5a — CORS absent today, confirmed by
`RESEARCH.md` round 1: `rg 'Cors|CorsLayer'` on `gateway.rs` = 0 hits, no
`tower-http` dependency at all). Version corrected from an initial `0.6`
guess to `0.7` by a real tier-A probe at this validating pass: `cd
herdr-plugin && cargo add tower-http --features cors --dry-run` resolved
cleanly against this crate's existing dependency graph (axum 0.8.9, tower
0.5.3) and picked `tower-http v0.7.0` — real cargo-resolver output, not
model knowledge (see Feasibility matrix below). Attach a permissive
`CorsLayer` (`Any`
origin/method/header — no cookie-based auth exists per D13's own Bearer
choice, so a wildcard `Access-Control-Allow-Origin` carries none of the
credentialed-CORS risk a cookie scheme would) inside `build_router`
(`gateway.rs:875`), the router assembly entry point every one of the 9
tests above already exercises.

For the bind half (D5b): replace the hardcoded
`([127, 0, 0, 1], config.port).into()` at `gateway.rs:933` with a
`SocketAddr`-typed `bind` field added to `GatewayConfig`/`GatewaySection`
(`gateway.rs:52-62`), following the `herdr-gateway` reference precedent
(`RESEARCH.md` round 1): the reference stores a full `host:port` socket
address string (`config.example.json:2`, `"bind_addr": "0.0.0.0:8787"`),
not a separate host string alongside the existing `port` field — copying
that shape keeps `port` meaningful as today's config key while adding
`bind` (host-only, e.g. `"0.0.0.0"` or `"127.0.0.1"`) as the new one,
defaulting to `0.0.0.0` per this feature's own locked D7
(`docs/history/herdr-web-dashboard/CONTEXT.md`) and this plan-realignment's
own D5b. When the resolved bind IP is not loopback, log a `tracing::warn!`
exactly like the reference's `src/main.rs:242-248` idiom — this repo
already depends on `tracing` (used elsewhere in `herdr-plugin`), so no new
crate is needed for the warning itself.

**Alternatives rejected:**
- A separate `host` + `port` pair mirroring `bind` as two config fields —
  rejected in favor of the reference's single `bind_addr`-shaped socket
  string, because splitting them invites an inconsistent state (a `bind`
  set but `port` left at a stale default) that the reference's single
  field structurally avoids. Kept as a labeled assumption below since
  `CONTEXT.md` D5b names "bind address cấu hình được" without specifying
  the exact field shape — not material enough to hand back for (the
  outcome — LAN-reachable when non-default, warns when non-loopback — is
  identical either way).
- Restrictive CORS (an explicit origin allowlist) — rejected: the web
  client's origin is not fixed (D2: whichever machine has static-serving
  enabled becomes the host, `RESEARCH.md` — no fixed hostname), and there
  is no cookie/credentialed request in play (D13 locks Bearer-only, no
  cookie), so a wildcard carries no CSRF-via-cookie risk. Revisit if a
  cookie-based auth layer is ever added (same threshold D13 itself already
  names).

**Files touched:** `herdr-plugin/src/gateway.rs` (CorsLayer attach in
`build_router`, `GatewayConfig`/`GatewaySection` bind field, `run`'s
hardcoded addr), `herdr-plugin/src/main.rs` (only if `run`'s signature or
call site needs a bind-related change — TBD at Execute, likely untouched
since `run` already reads `GatewayConfig` opaquely), `herdr-plugin/Cargo.toml`
(new `tower-http` dependency).

**Order:** single item, no ordering dependency on other pieces of this
plan — `fgos graph --json`'s `criticalPath`/`topUnblock` is not consulted
for internal ordering since there is no split (see Decide the split,
below) and this item has no `deps` of its own.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| CORS layer attach in `build_router` | Medium — CRITICAL-risk function per impact scan, but the change itself is additive (`.layer()`), not a rewrite | Dependency compatibility already proven at THIS validating pass: `cd herdr-plugin && cargo add tower-http --features cors --dry-run` resolves cleanly (`tower-http v0.7.0` against the existing `axum 0.8.9`/`tower 0.5.3` graph, zero conflicts reported) — real resolver output, not assumed. Remaining proof (that `.layer()` doesn't regress behavior): all 9 existing `gateway.rs` test functions listed above still pass after the change (they already run through `build_router`); `cargo test --lib gateway` is the item's own verify and covers exactly this file |
| Bind config field shape (`GatewayConfig`/`GatewaySection`) | Low — additive struct field, `Option`-wrapped like `port` already is, defaults preserve today's `127.0.0.1` behavior when unset (herdr-gateway demo-config precedent: loopback stays the safe fallback) | A new unit test asserting `load_gateway_config` resolves the documented default (`0.0.0.0`) when the field is absent, and resolves an explicit override when present — both cheap, both in-file |
| Non-loopback warning | Low — logging only, no behavior change | Manual/unit check that `tracing::warn!` fires when the resolved bind IP is not loopback (mirrors the reference's own test coverage pattern at `herdr-gateway/src/main.rs` if one exists — check at Execute; if the reference has no direct unit test for this, a narrow one here is still cheap and proves D7's own "cảnh báo khi không phải loopback" clause) |

Every entry above is Low/Medium, and each has a concrete proof point
already named — no medium/high entry is left without one, per this skill's
own gate (`CONTEXT.md` D4/D5 apply: undo cost is low — a config field and a
log line, no data migration, no external contract change — and no
reversible alternative removes the question entirely since the exposure
change (non-loopback bind) is D7's own locked intent, not an open
question).

## Decide the split

One honest piece of work — no split. Both halves (CORS, bind) touch the
same function/config surface (`build_router`, `GatewayConfig`) and were
already scoped together as one item by the plan-realignment's own D5,
which explicitly bundles them ("Hai việc trên herdr-plugin/src/gateway.rs
mà không ai đang sở hữu"). Splitting them would double the review/verify
overhead for two changes that share one small blast radius (LOW risk for
the bind half's own function, and the CORS half rides on the same
`build_router` edit point).

## Verify

Item's existing verify (`cd herdr-plugin && cargo test --lib gateway`) is
already real, runnable, and targets exactly this file — synced at
discovery time (round 1, `fgos discover --verify "cd herdr-plugin &&
cargo test --lib gateway"`). No change needed here; new unit tests for the
bind-field default/override and the non-loopback warning get added under
this same `--lib gateway` test target at Execute, so the verify command
does not need to change to cover them.

## Outstanding questions

None
