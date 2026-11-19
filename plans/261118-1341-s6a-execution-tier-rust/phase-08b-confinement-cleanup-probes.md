# Phase 08b: confinement cleanup and probes

Wave 4. Depends on: 8. Effort 1.5d. Library only (engine module `confinement::cleanup`). Split from the old phase 8.

## Context

`src/runner/dispatch/confinement/cleanup.mjs` (554: attempt ownership markers, kept credential homes, orphan judgement
and removal; imports `stop-processes-inside` at `cleanup.mjs:13`, which phase 02 moves to `src/native/`) and `probes/harness.mjs` (860: falsification probes, peer-run-hidden). 1 414 lines on `f031ab0c8` (`harness.mjs` now joins
`.fgos` through `fgosDirFromRoot`, `691255ad0`; no behaviour change). Doctor rows `confinement-orphaned-resources-reaped` (fix),
`credential-copies-retained`, `confinement-probe-freshness`, `confinement-blind-read` use it (phase 15).

## Requirements

- `packages/execution/engine/src/confinement/cleanup/` ports both over phase 8's driver; process stops through
  `fgos-process` (no copy of `stop-processes-inside`).
- Golden vectors under `packages/execution/contracts/confinement-cleanup/` (cleanup judgement incl. a live-owner case)
  recorded by `test/golden-recorders/confinement-cleanup.recorder.mjs`; probe harness tested on Linux with a real
  `bwrap` when present (skipped by capability, not by env switch: the test asks the backend registry, as doctor does).

## Steps

Commit the recorder; record vectors; red `engine/tests/confinement_cleanup.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test confinement_cleanup`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: orphan cleanup deletes a live home. Port the judgement as is; vectors include a live-owner case. Rollback: revert.
