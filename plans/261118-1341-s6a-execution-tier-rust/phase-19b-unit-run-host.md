# Phase 19b: unit run host composition

Wave 9, second of three serial phases (19 -> 19b -> 19c). Depends on: 19. Effort 2d. Rust only, no route change: the host
composes the ports that engine `unit_run`, the assignment runner and settlement ask for, so 19c can serve `fgos run` from them.

## Context

Phase 18 landed engine `unit_run` as a library over ports; phases 14 and 16b landed settlement and the assignment runner over
ports too. Nothing in `apps/fgos` supplies the host side of those ports yet. Phase 19 gave the Node seam and the launcher.

## Requirements

- `apps/fgos/src/wiring/unit_run_host/**` (new): host implementations of the `unit_run` ports: persona pin, input resolution,
  door choices, unit file read and check, unit control, pinned accounts, admission generations, report digest, unit summary,
  current attempt, adopt state.
- The assignment runner's `ExecutePorts` and `SeatPorts`, `TerminalPrep` and `CredentialRenewal` (phase 10) host adapters.
- The `PaneScreen` adapter: settlement pane read through the host terminal.
- The real `BundledSqlite` engine and the phase-9 account locks supplied to phase 14's `ConfinementHomes` finalizer.
- Lock domains: any `declare_domain` / `clear_domain` on the attempt lock or the cwd lease happens before the handle is lent
  (both fail on a lent handle; OPC note 2026-11-19).
- `apps/fgos/src/wiring/mod.rs` registers the module; `apps/fgos/Cargo.toml` gains the engine dependency (one writer of
  that file in this plan since phase 15). `packages/execution/engine/src/**` is edited only to fix port trait signatures.
- Test: `apps/fgos/tests/unit_run_host.rs` drives each host port against a real temp repo and temp `.fgos`, no mocks.

## Footprint

`apps/fgos/src/wiring/unit_run_host/**`, `apps/fgos/src/wiring/mod.rs`, `apps/fgos/Cargo.toml`,
`apps/fgos/tests/unit_run_host.rs`, `packages/execution/engine/src/**` (signature fixes only).

## Steps

1. Re-sync from main; report table of ports versus host adapters.
2. Red: `unit_run_host.rs` per port.
3. Implement adapters; wire `BundledSqlite` and account locks into `ConfinementHomes`.
4. Gates: `cargo test -p fgos --test unit_run_host`, `cargo test -p fgos-execution-engine`, clippy `-D warnings`.

## Validation

`cargo test -p fgos --test unit_run_host`; `cargo test -p fgos-execution-engine`; `node scripts/run-tests.mjs
test/architecture.test.mjs`.

## Risk and rollback

Risk: port trait signature fixes ripple into engine tests; keep them mechanical. Rollback: revert the phase (nothing routes to it).
