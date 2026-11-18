# Phase 07b: confinement request and authority

Wave 4. Depends on: 7. Effort 1.5d. Library only (engine module `confinement::request`). Split from the old phase 7.

## Context

`src/runner/dispatch/confinement/request.mjs` (536: request assembly from policy, resources and executor facts) and
`authority.mjs` (1 023: posture, nested-dispatch depth, env for the worker). 1 559 lines. Doctor row `confinement-strict-readiness` judges with them
(phase 15). The request type is the one phase 3 fixed in `confinement/mod.rs`.

## Requirements

- `packages/execution/engine/src/confinement/request/` ports both over phase 7's `policy`.
- Golden vectors under `packages/execution/contracts/confinement-request/` recorded by
  `test/golden-recorders/confinement-request.recorder.mjs`, including nested-dispatch refusal and the worker env.

## Steps

Commit the recorder; record vectors; red `engine/tests/confinement_request.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test confinement_request`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: a nested dispatch is no longer refused (trust boundary). Vectors cover every depth and posture case. Rollback:
revert the module.
