# Phase 07b: confinement request and authority

Wave 4. Depends on: 7. Effort 1.5d. Library only (engine module `confinement::request`). Split from the old phase 7.

## Context

`src/runner/dispatch/confinement/request.mjs` (536: request assembly from policy, resources and executor facts) and
`authority.mjs` (1 057: posture, nested-dispatch depth, env for the worker). 1 593 lines on `f031ab0c8` (1 559 on
`b5b237534`). New since the base (session verb plan): `controlDeliveryOf`, `ownWorktreeUnavailable` and
`seatSessionDir` (`authority.mjs`; `7185f8375`, `a8b1f6229`, `ae00671c9`, `c75720662`): the secretary head's bypass
invocation in the main checkout it is granted and the head write door's session directory. Doctor row `confinement-strict-readiness` judges with them
(phase 15). The request type is the one phase 3 fixed in `confinement/mod.rs`.

## Requirements

- `packages/execution/engine/src/confinement/request/` ports both over phase 7's `policy`.
- Golden vectors under `packages/execution/contracts/confinement-request/` recorded by
  `test/golden-recorders/confinement-request.recorder.mjs`, including nested-dispatch refusal, the worker env and the three new functions above (head-only bypass binding).

## Steps

Commit the recorder; record vectors; red `engine/tests/confinement_request.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test confinement_request`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: a nested dispatch is no longer refused (trust boundary). Vectors cover every depth and posture case. Rollback:
revert the module.
