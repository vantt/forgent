# Phase 08: confinement driver, cleanup, probes

Wave 3. Depends on: 3. Lands after 07. Effort 2.5d. Library only (engine module `confinement::driver`).

## Context

`src/runner/dispatch/confinement/`: `drivers/bwrap.mjs` (745: `prepareBwrapSync`, calls credential renewal's
`copyCredentialFiles` at provisioning), `cleanup.mjs` (554: attempt ownership markers, kept credential homes,
orphan judgement and removal), `attestation-store.mjs` (355), `backend-registry.mjs` (378: machine registry file,
schema `confinement-backend-registry.v1`), `probes/harness.mjs` (859: falsification probes, peer-run-hidden). Process
containment primitives stay in `fgos-process` (`packages/process/rust/src/containment/linux.rs`); this module builds
the bwrap argv and runs the probes through the process door. Doctor rows `confinement-backend-registry-readable`,
`confinement-orphaned-resources-reaped`, `credential-copies-retained`, `confinement-bwrap-platform`,
`confinement-probe-freshness`, `confinement-blind-read`, `confinement-herdr-maturity` use it (phase 15).

## Requirements

- `packages/execution/engine/src/confinement/driver/` ports them; the credential copy at provisioning calls the
  `credentials` module through the trait fixed in the skeleton (phase 10 implements it; tests here use a real temp
  login fixture through that trait's fs implementation once 10 lands, a fake trait implementation before).
- The bwrap smoke test for a named binary lives here (it replaces Node `checkBwrapAvailable`, debt of the "packaging
  doctor judgments" door row; phase 15 switches the rows).
- `/proc` reads go through `fgos-process` (door row "process facts: read /proc").
- Golden vectors `packages/execution/contracts/confinement-driver.v1.json` for argv construction and cleanup judgement;
  probe harness tested on Linux with a real `bwrap` when present (skipped by capability, not by env switch: the test
  asks the backend registry, as doctor does).

## Steps

Record vectors; red `engine/tests/confinement_driver.rs`; port; green; report.

## Validation

`cargo test -p fgos-execution-engine --test confinement_driver`; clippy; msvc and aarch64-apple-darwin check.

## Risk and rollback

Risk: orphan cleanup deletes a live home. Port the judgement as is; vectors include a live-owner case. Rollback: revert.
