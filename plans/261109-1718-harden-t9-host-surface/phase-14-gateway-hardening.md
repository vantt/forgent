---
phase: 14
title: "Gateway: loopback by default, caller recorded on every request, Rhai execute limits, concurrency cap, file reads that cannot follow a link, bounded JWKS client"
status: pending
depends_on: ["none for everything but the call-site switch, which waits for P13 on main"]
parallel: "gateway lane; sole writer of gateway.rs, mcp.rs, cf_access.rs and core/config-standard/gateway.yaml; beside P12, P13, P15"
effort: ~1d
net_size: "Node 0; Rust about +60 (Rhai limits and cap +20, small items +15, loopback default and caller record +25); tests included"
---

# Phase 14 - Gateway hardening (T9-09, T9-17, owner decision 81 Q2, red-team F5/F11; L-9)

## Context

Reads in `26d42ca98`:

- **Default bind.** `core/config-standard/gateway.yaml:7-8` sets `bind: 0.0.0.0` ("reachable on the LAN and Tailscale by design"); the gateway serves plain HTTP; one bearer token grants every verb (submit, approve, `/runner/tick`); `gateway.rs:1298-1311` warns when the bind is not loopback and starts anyway. The cf-access path (`gateway.rs:462-474`) accepts a valid assertion and drops the identity, so nothing records who called.
- **Rhai `execute`.** `apps/fgos-gateway/src/mcp.rs:215` sets only `set_max_operations(500_000)`; `apps/fgos-gateway/Cargo.toml:42` `rhai = { version = "1", features = ["serde"] }` keeps default features, so the file module resolver is present and string, array and map sizes are unbounded (X13, accepted from code; the owning test settles it on the first run). `spawn_blocking` per verb handler and `post_runner_tick` are unbounded.
- **Small items (T9-17).** `gateway.rs:863` `read_to_string(resolved.join(name))` follows a file link; `with_static_serving(..., Path::new("static"))` (`:1318`) is relative to cwd; `CfAccessVerifier` builds `reqwest::Client::new()` with no timeout (`apps/fgos-gateway/src/cf_access.rs:118` region).
- **`fgos_command` switch.** `gateway.rs:345-363` still builds the node fallback (P13 ships the builder).

Owner decision 81 Q2: the gateway binds `127.0.0.1` by default; exposing it on the network takes an explicit `--bind`/config; every request records its caller. Not taken: the dashboard's `--dangerously-skip-permissions` default (`herdr-dashboard/src/pick.rs:89-100`) stays; the arbitration's "refuse non-loopback without CF/TLS" clause is not added (plan unresolved questions 1 and 2).

## Requirements

1. **Default.** `gateway.yaml` `bind: 127.0.0.1` with its `@fgos:doc` line rewritten (non-loopback is an explicit choice; LAN and Tailscale users set `gateway.bind`). The non-loopback warning (`gateway.rs:1300`) stays. No `--bind` flag is added (plan unresolved question 1).
2. **Caller recorded.** Every mutating request records its caller in the verb's `--source`: the Cloudflare Access identity when that credential passed, else a short fingerprint of the bearer token (never the token). Read-only requests are not recorded (no new log); the record is the existing `--source` of the verb.
3. **Rhai limits (L-9).** `set_max_string_size`, `set_max_array_size`, `set_max_map_size`, `set_max_call_levels`, `set_max_expr_depths`, `DummyModuleResolver` (no `import`), and a wall-clock bound on `execute`. The module comment at `mcp.rs:229-233` already says only bound functions are reachable: this removes a capability nobody intended and grants nothing (not a reopening of the sandbox decision).
4. **Concurrency cap.** A `tower` concurrency limit on the authenticated router (bounds `spawn_blocking` per request).
5. **T9-17.** Canonicalize the file and recheck the prefix before `read_to_string`; serve the embedded bundle only (no cwd-relative `static`); the `CfAccessVerifier` client gets a timeout and a 30 s negative JWKS cache.
6. **Call-site switch.** `gateway.rs:345-363` uses `fgos_command` (P13); the refusal maps to 503 with the `fgctl init` hint; the old `resolve_fgos` fallback usage ends here.

## Files

**Create:** none.

**Modify:** `apps/fgos-gateway/src/gateway.rs`, `apps/fgos-gateway/src/mcp.rs`, `apps/fgos-gateway/src/cf_access.rs`, `apps/fgos-gateway/Cargo.toml` (only if a `tower` feature is needed), `core/config-standard/gateway.yaml`, `CHANGELOG.md` (one line: the gateway binds loopback by default; set `gateway.bind` for the network), `docs/platform/config/spec.md` section 8 if it states the default (DOC told; check with `rg -n "0.0.0.0" docs/platform/config`).

**Delete:** the node fallback construction at `gateway.rs:345-363`.

**Tests to retire:** the gateway tests that assert the node-fallback command (`rg -n "bin/fgos.mjs" apps/fgos-gateway/src --glob '*.rs'` at test sites); `gateway.rs:1334` keeps its working-dir proof. Behaviour removed by decision 10.

## Red tests first

- `mcp.rs`: the doubling-string script ends in a script error, not an abort or memory growth; one `import` is refused.
- `gateway.rs`: default config yields a loopback bind; a request authenticated by CF identity records that identity; a bearer request records a fingerprint and never the token; a file link in the resolved dir is not followed; a request flood does not exceed the concurrency limit.
- `cf_access.rs`: a stalled JWKS endpoint times out; a failed fetch is negatively cached for 30 s.

## Net size

Rust about +60 (limits and cap +20, small items +15, loopback and caller record +25); config 1 line; tests included in the Rust figure.

## Steps

1. Callers by `rg` of `GatewayConfig`, `DEFAULT_BIND`, `load_gateway_config`; check the Rhai default feature set (`cargo tree -e features -p fgos-gateway | rg rhai`) and record whether it is bounded by default (open question 2 of the arbitration).
2. Red tests; limits; cap; caller record; file reads; default.
3. Switch the call site after P13 is on main.
4. Guide text for LAN and Tailscale machines (one config line) handed to P16 before this lands.

## Validation (focused)

`cargo test -p fgos-gateway`, clippy `-D warnings`, msvc and apple-darwin compile check; `fgos gateway start`, `fgos gateway status` (reachability on loopback) through the one door (`AGENTS.md`: never a hand-rolled process; stop what you started); land gate.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A LAN or Tailscale user loses access after the default flips | M x M | CHANGELOG and the guide (one config line) before landing; the warning path unchanged for explicit non-loopback |
| The `--source` fingerprint collides with a consumer parsing `--source` | L x L | `rg` of `--source` consumers in step 1 |
| The concurrency cap starves a long `execute` | L x M | the cap is a count of in-flight requests, the wall-clock bound is per `execute`; both values named in the test |

## Rollback

Revert the merge commit and re-activate the previous release; a machine that needs LAN sets `gateway.bind` either way.

## Done when

Red then green; `fgos gateway status` reports a loopback bind on a clean config; guide section drafted.
