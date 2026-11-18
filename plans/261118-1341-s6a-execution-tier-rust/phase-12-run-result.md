# Phase 12: run result and evidence

Wave 3. Depends on: 3. Effort 1.5d. Library only (engine module `run_result`).

## Context

`src/runner/dispatch/`: `run-result.mjs` (1 139: write and read the Run Result, v2 and v3 readers),
`evidence-attribution.mjs` (250), `agent-result-claim-contract.mjs` (113). Outcome types already live in Rust
(`fgos-run-result`, `packages/run-result/rust`; Node reaches them through the addon's `runResult` namespace).
`docs/platform/runner/contracts/unit-run-result.md` is the contract.

## Requirements

- `packages/execution/engine/src/run_result/` ports the writer, readers and attribution over `fgos-run-result`; no
  second outcome type.
- Golden vectors under `packages/execution/contracts/run-result/` recorded by
  `test/golden-recorders/run-result.recorder.mjs`: written bytes per outcome class, reader answers for v2 and v3
  fixtures, attribution of stray writes; readers replay the phase 00 corpus (F13).
- A run result Rust writes is read by the previous Node release (reverse-read fixture for phase 22, F12).

## Steps

Commit the recorder; record vectors; red `engine/tests/run_result.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test run_result`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: readers of old run records (v2) break `dispatch show-run`/`inspect` after cutover. Vectors include v2 and v3
fixtures and the corpus. Rollback: revert.
