---
phase: 9
title: "`gateway start|stop|status` native"
status: completed
effort: 2d
wave: B
step: S3
blockedBy: [0]
flipAfter: [1]
---

# Phase 09: `gateway` native

> Note (2026-11-15, phase 00 decisions): the recursion-guard fix and the `--locked` cargo build are made outside this
> port, on branch `cook/gateway-guard-fix`; this phase does not carry them (the guard text below is background only).
> S23-Q4 is decided (b): `gateway start` is refused off Unix; the CHANGELOG line is "`fgos gateway start` is refused
> off Unix with a message saying so; it never worked there."

The one door for the gateway's lifecycle (AGENTS.md "Starting the fgos gateway", tsk-31v) moves from Node
(`src/runner/gateway-control.mjs`, 400 lines, verb-only) into the host (D8). The gateway binary itself
(`apps/fgos-gateway`) is unchanged. Only the host uses the control code after the flip, so it lives in
`apps/fgos/src/wiring/gateway_control.rs`, on the lower doors it needs (holder-lock `gateway` lock, Durable File
through the D10 edge, process spawn and identity, the host's Event Store trigger door).

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s3-p09`. Report slug `s3-p09-gateway`.

## Context

- Registry `src/cli/command-registry.mjs:2235-2263`: `start`, `stop`, `status`; `store: 'none'`, `mutatesStore: ['start', 'stop']`.
- Arm `bin/fgos.mjs:3579-3600`: `start` with `repoRoot = path.dirname(dir)`, `stop`/`status` with `dir`; every
  `GatewayControlError` -> `StoreError('validation')` (exit 4); missing sub via `requireSubVerb`.
- `src/runner/gateway-control.mjs`: `REGISTRY_FILE` `.fgos/gateway.json` :37; port from `readMachineConfig` (:34, :156);
  `acquireGatewayLock` :103 (120 s); `startGateway` :187 (`cargo build --release --bin fgos-gateway` with
  `cwd: apps/fgos-gateway` :211; detached spawn with the log fd and the inherited env :233-238; wait for "listening on");
  `stopGateway` :309 (SIGTERM by identity, then `maintainEventStore(..., { shutdown: true })` :359); `gatewayStatus` :373
  (`GET http://127.0.0.1:<port>/v1/contract`, 3 s, :387); `replaceDurably` for the registry.
- The Node payload runs with `FGOS_RUST_HOST_RECURSION_GUARD=1` (`apps/fgos/src/legacy_exec.rs:249`), so today's gateway
  inherits it and its `fgos_command` calls of legacy verbs (`packages/herdr-fgos-common/rust/src/fgos.rs:403-411`) hit the
  guard on the legacy lane (`apps/fgos/src/main.rs:283`); 00 F11 confirms live.
- Rust: `fgos_process::mapped::spawn_detached` (`packages/process/rust/src/mapped.rs:194`, `cfg(unix)`,
  `lib.rs:15-16`; an env-removal list), process identity and signal (`control.rs:103`), holder-lock port, Durable File
  (new edge for `apps/fgos`, D10), `invocation_doors::EventStoreLifecycle::trigger` (`apps/fgos/src/invocation_doors.rs:51-99`).
- The `doors` row "global fgOS directory" carries `apps/fgos-gateway/src/gateway.rs` as debt (its `home_dir` seam): not touched here.

## Requirements

1. `apps/fgos/src/wiring/gateway_control.rs`: `start`, `stop`, `status` with Node's outcomes and refusals (through D3,
   category validation, exit 4). The build runs `cargo build --release --bin fgos-gateway` in `apps/fgos-gateway`
   through the process door (00 F11: argv, env, the refusal when `cargo` is missing); the port from the machine config
   through `fgos-config` (as `readMachineConfig`); the spawn through `spawn_detached` with the log file (the guard removal is done by `cook/gateway-guard-fix`, not here);
   the registry through Durable File (same shape); the probe a plain HTTP/1.1 `GET /v1/contract` over
   `std::net::TcpStream` with the 3 s timeout (unless 00 F11 finds a client the host already links); `stop` signals by
   identity, then the shutdown seal through `EventStoreLifecycle::trigger` with `Policy { shutdown: true, .. }` only
   (no publish: `end` stays false), outside the gateway lock, also when the stop fails (as Node's `finally`).
2. Off Unix, per S23-Q4 (b): `start` refuses with a clear message and `stop`/`status` work. The process crate is not touched.
3. Host: operations `gateway.start|stop` (write) and `gateway.status` (read), projector (no flags), `NATIVE_SUBCOMMANDS`,
   annotation `{ owner_path: "apps/fgos" }`, `native: true`; `apps/fgos/Cargo.toml` gains `fgos-durable-file` if 08 has
   not landed it yet (the step lead commits `Cargo.lock`).
4. Parity `gateway.cases.mjs` (fresh repo per entry): status with no registry; status with a stale registry (dead pid);
   stop with nothing running; start refused when already running (a fixture listener); missing/unknown sub. A real
   `start` (cargo build) is not a parity case: `gateway_control.rs` tests prove it with a stub binary path handed to the
   start function by its caller (the CLI passes the built one; no env switch).
5. Delete: `src/runner/gateway-control.mjs` and its `manifest.files` entry, the arm, `test/runner/gateway-control.test.mjs`
   (19) and `test/cli/fgos-gateway.test.mjs` (6) once every case has an owner; their `suite-baseline.json` rows (26, 325).
6. `doors` row "control the gateway process": patterns `gateway\.json`, `export function (?:startGateway|stopGateway|gatewayStatus)\b`,
   `['"]--bin['"],\s*['"]fgos-gateway['"]`; allowed `apps/fgos/src/wiring/gateway_control.rs` (and any other product
   file 00 finds naming the registry, with its reason).

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| status, stop, start, identity check, lock (19) | `test/runner/gateway-control.test.mjs` | `gateway_control.rs` unit tests (stub binary, local listener) |
| no sub, unknown sub, fresh-repo status and stop, start refusal (5) | `test/cli/fgos-gateway.test.mjs` | `routing.rs` sub faults (generic) + one `cli_tests.rs` case (fresh-repo `status`) |
| manifest sub enum | `fgos-gateway.test.mjs` | `fgos-manifest.test.mjs` (registry data) |

## Files

- Create: `apps/fgos/src/wiring/gateway_control.rs`, `gateway.cases.mjs` (deleted by 12).
- Modify: `apps/fgos/src/wiring/mod.rs`, `apps/fgos/Cargo.toml` (D10, if first), host files per the recipe,
  `apps/fgos/tests/cli_tests.rs`, `bin/fgos.mjs`, `docs/architecture-manifest.json`, `test/suite-baseline.json`, census;
  the process crate is not touched (S23-Q4 = b).
- Delete: `src/runner/gateway-control.mjs`, `test/runner/gateway-control.test.mjs`, `test/cli/fgos-gateway.test.mjs`.

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos --all-targets -- -D warnings`;
  `cargo test -p fgos`; msvc and darwin `cargo check -p fgos`
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/cli/fgos-manifest.test.mjs test/rust-host/command-routes.test.mjs test/cli/subcommand-flag-drift.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
- `cargo test -p fgos-gateway`; manual once on fg-server2 through `npm run fgos:dev -- gateway start|status|stop`, plus a
  `POST /v1/sessions` against the started gateway (report the output).

## Risk and rollback

- A stuck `cargo build` or listener wait blocks the CLI (L x M): the same timeouts as Node, named constants.
- A gateway started by the old Node path is stopped by the new one (M x L): same registry and identity rule.
- Rollback: revert the phase.
