# Phase 08: confinement driver, backend registry, attestation

Wave 3. Depends on: 3. Effort 1.5d. Library only (engine module `confinement::driver`). Split from the old phase 8
(2 891 Node lines); 8b follows in wave 4.

## Context

`src/runner/dispatch/confinement/`: `drivers/bwrap.mjs` (762: `prepareBwrapSync` `:578`, calls credential renewal's
`copyCredentialFiles` at provisioning), `backend-registry.mjs` (378: machine registry file, schema
`confinement-backend-registry.v1`), `attestation-store.mjs` (355). 1 495 lines on `f031ab0c8` (1 478 on `b5b237534`; `bwrap.mjs` now binds the head
`mailbox-record` and read-only `peer-sessions` resources, `42e7a0c3c`, `5b751154c`). Process containment primitives stay in
`fgos-process` (`packages/process/rust/src/containment/linux.rs`); this module builds the bwrap argv and runs it
through the process door. Doctor rows `confinement-backend-registry-readable`, `confinement-bwrap-platform`,
`confinement-herdr-maturity` use it (phase 15).

## Requirements

- `packages/execution/engine/src/confinement/driver/` ports them; the credential copy at provisioning calls the
  `credentials` module through the trait fixed in the skeleton (phase 10 implements it; tests here use a fake trait
  implementation until 10 lands, then a real temp login fixture).
- The bwrap smoke test for a named binary lives here (it replaces Node `checkBwrapAvailable`, `src/setup/registrations.mjs:830`, used at `:2002,2089`; phase 15 switches the
  rows and removes the debt).
- `/proc` reads go through `fgos-process` (door row "process facts: read /proc"; the `bwrap.mjs` debt entry goes in
  phase 21, which deletes the file).
- Golden vectors under `packages/execution/contracts/confinement-driver/` (argv construction incl. the head resource binds, registry reads) recorded
  by `test/golden-recorders/confinement-driver.recorder.mjs`.

## Steps

Commit the recorder; record vectors; red `engine/tests/confinement_driver.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test confinement_driver`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: bwrap argv drift exposes a path. Vectors pin argv per policy. Rollback: revert.
