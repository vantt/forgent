# Phase 05: run supervisor controller half in Rust

Wave 2. Depends on: 0; plan 1045 phase 6 on `main` (D4). Effort 2.5d. Library only: no caller switches here.

## Context

The run supervisor crate (`packages/run-supervisor/rust`, 4 907 lines) owns the attempt process after handover; the
controller half that hands over is Node (`src/run-supervisor/`, 2 698 lines): `direct-launch.mjs` (408, builds the v3
envelope at `:209`, carries 1045 P6's `lanes: {ceiling, waitMs}`), `run-lock.mjs` (392, lease), `cwd-lock.mjs`,
`cancel-registry.mjs`, `cancel-opt-in.mjs`, `runtime-dir.mjs`, `trust-store.mjs` (688, codex/agy/claude folder trust),
`gate-kill-grace.mjs`, `client.mjs` (`adoptScan`, `sweepAttempts`), `protocol.mjs`, `dispatch-error.mjs`,
`step-support.mjs`. The post-receipt steps (`steps/*`, `attempt-step.mjs`, `stray-writes.mjs`, `worker-artifacts.mjs`)
need engine code and move in phase 14 (P9). Spec: `docs/platform/run-supervisor/spec.md`.

## Requirements

- New module tree `packages/run-supervisor/rust/src/controller/` (`launch`, `lease`, `cwd_lock`, `cancel`,
  `runtime_dir`, `trust_store`, `config` for `dispatch.gateKillGraceMs`/`cancelWaitMs` through `fgos-config`, `sweep`,
  `adopt_scan`), each porting the Node module named in phase 00's port map, behaviour unchanged (RUL104).
- The `lib.rs` `pub mod controller;` line is this phase's (the crate's `lib.rs` is outside the engine skeleton);
  footprint note: `packages/run-supervisor/rust/src/lib.rs` is edited by this phase only in wave 2; 1045 P10's
  `head_request.rs` is not touched.
- `lanes` envelope field and `workerSlots.ceiling`/`laneWaitSec` reads exactly as 1045 P6 landed them.
- Trust store keeps codex's own byte order (`sortedJson`, component-boundary Canonical JSON exception) and the
  mode-preserving write.
- Golden vectors under `packages/run-supervisor/contracts/controller/` recorded from the Node modules.
- No dependency on any Execution crate.

## Steps

1. Read 1045 P6 as landed (envelope fields, lane config reads). Record vectors from Node (phase 00 section 7).
2. Red tests `packages/run-supervisor/rust/tests/controller_*.rs`; port; green.
3. Report the Node modules now twinned (deleted in phase 20) and their tests' future owner.

## Validation

`cargo test -p fgos-run-supervisor`; clippy, msvc, aarch64-apple-darwin checks; `cargo tree` shows no Execution crate.

## Risk and rollback

Risk: 1045 P6 not landed, or lands with a different field shape. Gate: do not start before it is on `main`.
Risk: trust-store byte order. Vectors include codex fixtures. Rollback: revert (no caller uses the module yet).

Footprint addendum: `packages/run-supervisor/rust/src/lib.rs` (one `pub mod` line).
