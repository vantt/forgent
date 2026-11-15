---
phase: 9
title: "`gateway start|stop|status` native"
status: pending
effort: 2d
wave: B
step: S3
blockedBy: [0]
flipAfter: [1]
---

# Phase 09: `gateway` native

The one door for the gateway's lifecycle (AGENTS.md "Starting the fgos gateway", tsk-31v) moves from Node
(`src/runner/gateway-control.mjs`, 400 lines, verb-only) into the host. The gateway binary itself
(`apps/fgos-gateway`) is unchanged. Only the host uses the control code after the flip, so it lives in
`apps/fgos/src/wiring/gateway_control.rs`, on the lower doors it needs (holder-lock `gateway` lock, Durable File,
process spawn and identity, Event Store maintain).

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s3-p09`. Report slug `s3-p09-gateway`.

## Context

- Registry `src/cli/command-registry.mjs:2235-2263`: `start`, `stop`, `status`; `store: 'none'`, `mutatesStore: ['start', 'stop']`.
- Arm `bin/fgos.mjs:3579-3600`: `start` with `repoRoot = path.dirname(dir)`, `stop`/`status` with `dir`; every
  `GatewayControlError` -> exit 4; missing sub via `requireSubVerb`.
- `src/runner/gateway-control.mjs`: `REGISTRY_FILE` `.fgos/gateway.json` :37; `acquireGatewayLock` :103 (120 s);
  `startGateway` :187 (`cargo build --release --bin fgos-gateway` :211, detached spawn with the log fd :233-238, wait
  for "listening on"); `stopGateway` :309 (SIGTERM by identity, then `maintainEventStore(..., { shutdown: true })` :359);
  `gatewayStatus` :373 (`GET http://127.0.0.1:<port>/v1/contract`, 3 s, :387); `replaceDurably` for the registry.
- Rust: `fgos_process::mapped::spawn_detached` (`packages/process/rust/src/mapped.rs:194`, env removal list),
  process identity and signal (`control.rs:103`), holder-lock port, Durable File, `lifecycle::maintain`.
- The `doors` row "global fgOS directory" carries `apps/fgos-gateway/src/gateway.rs` as debt (its `home_dir` seam):
  not touched here.

## Requirements

1. `apps/fgos/src/wiring/gateway_control.rs`: `start`, `stop`, `status` with Node's outcomes and refusals. The build
   runs `cargo build --release --bin fgos-gateway` from the repo root through the process door (00 F11: the exact
   argv, env and the refusal when `cargo` is missing); the spawn through `spawn_detached` with the log file; the
   registry through Durable File (same shape); the HTTP probe a plain HTTP/1.1 `GET /v1/contract` over
   `std::net::TcpStream` with the 3 s timeout (no new crate edge, unless 00 F11 finds a client the host already links);
   `stop` signals by identity and runs the shutdown maintain outside the gateway lock.
2. Host: operations `gateway.start|stop` (write) and `gateway.status` (read), projector (no flags), `NATIVE_SUBCOMMANDS`,
   annotation `{ owner_path: "apps/fgos" }`, `native: true`.
3. Parity `gateway.cases.mjs` (fresh repo per entry): status with no registry; status with a stale registry (dead pid);
   stop with nothing running; start refused when already running (a fixture listener); missing/unknown sub. A real
   `start` (cargo build) is not a parity case: it is proven once in `gateway_control.rs` tests with a stub binary path
   the build step is given by its caller (no env switch: the function takes the binary path; the CLI passes the
   built one).
4. Delete: `src/runner/gateway-control.mjs`, the arm, `test/runner/gateway-control.test.mjs` (19) and
   `test/cli/fgos-gateway.test.mjs` (6) once every case has an owner; their `suite-baseline.json` rows (325).
5. `doors` row "control the gateway process": patterns `gateway\.json`, `export function (?:startGateway|stopGateway|gatewayStatus)\b`,
   `--bin fgos-gateway`; allowed `apps/fgos/src/wiring/gateway_control.rs`, `src/cli/command-registry.mjs` (reason:
   description text), and any doc-free product file 00 finds naming the registry with its reason.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| status, stop, start, identity check, lock (19) | `test/runner/gateway-control.test.mjs` | `gateway_control.rs` unit tests (stub binary, local listener) |
| no sub, unknown sub, fresh-repo status and stop, start refusal (5) | `test/cli/fgos-gateway.test.mjs` | `routing.rs` sub faults (generic) + one `cli_tests.rs` case (fresh-repo `status`) |
| manifest sub enum | `fgos-gateway.test.mjs` | `fgos-manifest.test.mjs` (registry data) |

## Files

- Create: `apps/fgos/src/wiring/gateway_control.rs`, `gateway.cases.mjs` (deleted by 12).
- Modify: `apps/fgos/src/wiring/mod.rs`, host files per the recipe, `apps/fgos/tests/cli_tests.rs`, `bin/fgos.mjs`,
  `docs/architecture-manifest.json`, `test/suite-baseline.json`, census.
- Delete: `src/runner/gateway-control.mjs`, `test/runner/gateway-control.test.mjs`, `test/cli/fgos-gateway.test.mjs`.

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos --all-targets -- -D warnings`; `cargo test -p fgos`;
  msvc and darwin `cargo check -p fgos` (detached spawn is `cfg(unix)`, `packages/process/rust/src/lib.rs:15-16`:
  off Unix the verb answers Node's behaviour there, 00 F11)
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/cli/fgos-manifest.test.mjs test/rust-host/command-routes.test.mjs test/cli/subcommand-flag-drift.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
- Manual once on fg-server2 through `npm run fgos:dev -- gateway start|status|stop` (report the output).

## Risk and rollback

- A stuck `cargo build` or listener wait blocks the CLI (L x M): the same timeouts as Node, named constants.
- A gateway started by the old Node path is stopped by the new one (M x L): same registry and identity rule.
- Rollback: revert the phase.
