# Phase 14: settlement and post-receipt steps

Wave 4. Depends on: 5, 10, 12. Effort 2d. Library only (engine modules `settlement`, `steps`).

## Context

`src/runner/dispatch/settlement.mjs` (907) settles an attempt into the Run Result and the account lease. The run
supervisor runs post-receipt steps through `attempt_step.rs`, which today finds `node` on `PATH` and runs
`src/run-supervisor/attempt-step.mjs` with `steps/settle-attempt.mjs` (259), `steps/cleanup-trust.mjs`,
`steps/finalize-home.mjs` (stages a renewed login only), plus `stray-writes.mjs`, `worker-artifacts.mjs`,
`step-support.mjs`. P9: the steps run in Rust, composed from the engine in host wiring; `fgos-run-supervisor` gains no
engine dependency (phase 19 wires `attempt_step.rs` to the host route).

## Requirements

- `packages/execution/engine/src/settlement/` ports settlement over phase 12 (`run_result`) and phase 09 (`accounts`).
- `packages/execution/engine/src/steps/` ports the three steps, stray-write attribution and worker artifacts, each a
  function the host's attempt-step route will call with the envelope and receipt the supervisor passes today (same
  receipt files, same idempotence: a step re-run after a crash finds its receipt).
- finalize-home calls phase 10's staging; cleanup-trust calls phase 05's trust store.
- Golden vectors under `packages/execution/contracts/settlement/` recorded by
  `test/golden-recorders/settlement.recorder.mjs`; integration test runs each step twice (idempotence); receipt files
  Rust writes are read by the previous Node release (reverse-read fixture for phase 22, F12).

## Steps

Commit the recorder; record vectors; red `engine/tests/settlement.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test settlement`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: an adopted attempt (`fgos internal adopt`) started by a Node-era controller meets Rust steps. Landing
precondition nothing in flight; receipt file shapes pinned by vectors. Rollback: revert.
