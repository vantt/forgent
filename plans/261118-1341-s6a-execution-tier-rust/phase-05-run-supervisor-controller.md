# Phase 05: run supervisor controller half in Rust

Wave 2. Depends on: 0; plan 1045 phase 6 on `main` (D4). Effort 2.5d. Library only: no caller switches here.

## Context

The run supervisor crate (`packages/run-supervisor/rust`, 4 907 lines) owns the attempt process after handover; the
controller half that hands over is Node (`src/run-supervisor/`, 2 050 lines without the post-receipt steps and
`payload-root.mjs`): `direct-launch.mjs` (408, builds the v3 envelope at `:209`, carries 1045 P6's
`lanes: {ceiling, waitMs}`), `run-lock.mjs` (392, lease and run control ledger, `inspectRunControl:309`),
`cwd-lock.mjs` (99), `cancel-registry.mjs` (135), `cancel-opt-in.mjs`, `runtime-dir.mjs` (111), `trust-store.mjs`
(688, codex/agy/claude folder trust), `gate-kill-grace.mjs`, `client.mjs` (134, `adoptScan`, `sweepAttempts`),
`protocol.mjs`, `dispatch-error.mjs`. The post-receipt steps (`steps/*`, `attempt-step.mjs`, `stray-writes.mjs`,
`worker-artifacts.mjs`, `step-support.mjs`) need engine code and move in phase 14 (P9). Spec:
`docs/platform/run-supervisor/spec.md`.

Prior art in Rust (V11): `adoptScan` already only spawns the Rust adopt route (`src/run-supervisor/client.mjs:99-106`;
`packages/run-supervisor/rust/src/adopt.rs:142,174`, `--scan`); `dispatch-cwd` is already a holder-lock resource
(`packages/holder-lock/rust/src/fence.rs:865`; `cwd-lock.mjs:10-14`).

## Requirements

- New module tree `packages/run-supervisor/rust/src/controller/` (`launch`, `lease`, `cwd_lock`, `cancel`,
  `runtime_dir`, `trust_store`, `config` for `dispatch.gateKillGraceMs`/`cancelWaitMs` through `fgos-config`, `sweep`,
  `adopt_scan`), each porting the Node module named in phase 00's port map, behaviour unchanged (RUL104).
- `adopt_scan` calls `adopt::adopt_one` in process: not a port, no second judgement. `cwd_lock` takes the existing
  `dispatch-cwd` resource through `fgos-holder-lock` (V11).
- Feature split for the addon read (P15): `lease` (run control ledger read and write, `inspect_run_control`) builds
  with `fgos-durable-file`, `fgos-process`, `fgos-holder-lock`, `fgos-canonical-json` only; `fgos-terminal-control`
  and `fgos-session-host` become optional dependencies of the default feature `supervise` that gates every other
  module. Prior art: `fgos-identity` `default-features = false, features = ["directory"]`
  (`packages/run-supervisor/rust/Cargo.toml:13`). `cargo check -p fgos-run-supervisor --no-default-features --features lease`
  passes.
- `fgos-config` added to `packages/run-supervisor/rust/Cargo.toml` (V10; not a dependency today, `:8-17`).
- The `lib.rs` `pub mod controller;` line and the feature gates are this phase's; 1045 P10's `head_request.rs` is not
  touched.
- `lanes` envelope field and `workerSlots.ceiling`/`laneWaitSec` reads exactly as 1045 P6 landed them.
- Trust store keeps codex's own byte order (`sortedJson`, component-boundary Canonical JSON exception) and the
  mode-preserving write.
- Golden vectors under `packages/run-supervisor/contracts/controller/` recorded by
  `test/golden-recorders/run-supervisor-controller.recorder.mjs` (committed).
- No dependency on any Execution crate.

## Steps

1. Read 1045 P6 as landed (envelope fields, lane config reads). Commit the recorder; record vectors.
2. Red tests `packages/run-supervisor/rust/tests/controller_*.rs`; feature split; port; green.
3. Report the Node modules now twinned (deleted in phase 20) and their tests' future owner.

## Validation

`cargo test -p fgos-run-supervisor`; `cargo check -p fgos-run-supervisor --no-default-features --features lease`;
clippy, msvc, aarch64-apple-darwin checks; `cargo tree -p fgos-run-supervisor` shows no Execution crate, and with
`--no-default-features --features lease` no terminal-control or session-host.

## Risk and rollback

Risk: 1045 P6 not landed, or lands with a different field shape. Gate: do not start before it is on `main`.
Risk: trust-store byte order. Vectors include codex fixtures. Risk: the feature split touches modules 1045 P10 edits
(`head_request.rs` stays under `supervise`; later lander rebases). Rollback: revert (no caller uses the module yet).
