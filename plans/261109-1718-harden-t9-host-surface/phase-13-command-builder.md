---
phase: 13
title: "One shim-or-refuse command builder for the gateway, the dashboard and the common crate; no node fallback"
status: pending
depends_on: ["none (shim-root landed for the `is_confined` lines: re-read `fgos.rs` after it lands)"]
parallel: "gateway/dashboard lane; beside P12, P14 (P14's call-site switch waits for this phase), P15"
effort: ~0.5d
net_size: "Node 0; Rust about -100 (builder +15, three node branches -45, three fallback tests -50, dashboard -20); tests included"
---

# Phase 13 - One command builder (T9-08; L-10; decision 10)

## Context

Three Rust places build a `fgos` command by hand and fall back to `node <root>/bin/fgos.mjs`: `apps/fgos-gateway/src/gateway.rs:345-363` (`resolve_fgos(root).unwrap_or_else(|_| root.join("bin/fgos.mjs"))`, then `Command::new("node")` at `:359`), `herdr-dashboard/src/main.rs:210-230`, and `packages/herdr-fgos-common/rust/src/fgos.rs:375-411` (the silent fallback also fires when confinement fails: red-team F10). Decision 10 already declares the direct-node channel unsupported for the process, lock and identity verbs (`AGENTS.md` ownership boundary: `process-door-not-shipped`), so the fallback is a path to a refusal.

Reused: `herdr_fgos_common::fgos::resolve_fgos` and its `is_confined` check; the workspace shim.

## Requirements

1. `herdr_fgos_common::fgos::fgos_command(root, args) -> io::Result<Command>`: runs the workspace shim, or returns a named refusal ("run `fgctl init`"), never `node <root>/bin/fgos.mjs`. `resolve_fgos`'s silent node fallback on a failed confinement goes.
2. `herdr-dashboard/src/main.rs` and `fgos.rs`'s own call sites use it. `gateway.rs` switches in P14's step (one writer on that file); this phase leaves `gateway.rs` untouched.
3. The gateway maps the refusal to 503 with the `fgctl init` hint (done in P14 with the switch).

## Files

**Create:** none.

**Modify:** `packages/herdr-fgos-common/rust/src/fgos.rs`, `herdr-dashboard/src/main.rs`, their tests.

**Delete:** the node branches in those two files; three `bin/fgos.mjs` fallback tests (`rg -n "bin/fgos.mjs" herdr-dashboard packages/herdr-fgos-common --glob '*.rs'` finds them: behaviour removed by decision 10).

**Tests to retire:** the three fallback tests above: the behaviour (a node fallback) was removed; the new owners are the `fgos.rs` unit cases below.

## Red tests first

`fgos.rs` unit tests: shim present gives a shim command; no shim gives a refusal naming `fgctl init`; an unconfined shim gives a refusal (today: a node command).

## Net size

Rust about -100.

## Steps

1. Callers by `rg` of `resolve_fgos`, `fgos_command`, `Command::new("node")` over `apps packages herdr-dashboard`, `file:line`.
2. Red tests; builder; dashboard; delete fallback tests.
3. `cargo test` of the two crates; run the dashboard binary headless smoke if one exists, else report none.

## Validation (focused)

`cargo test -p herdr-fgos-common -p herdr-dashboard` (names from the manifests); clippy `-D warnings`; compile check msvc and apple-darwin; land gate. Coordinate the `is_confined` lines with the shim-root lead (it landed first).

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A machine without the shim loses dashboard actions | L x M | the refusal names the fix; the same machine could not run Node-only verbs anyway |
| Gateway compile break between this phase and P14's switch | L x L | the old function stays public until P14 switches the call, then is deleted in P14 |

## Rollback

Revert the merge commit.

## Done when

Red then green; `rg -n "bin/fgos.mjs" herdr-dashboard/src packages/herdr-fgos-common/rust/src` only comments.
