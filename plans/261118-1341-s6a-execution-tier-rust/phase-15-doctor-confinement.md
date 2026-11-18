# Phase 15: doctor rows, confinement

Wave 5. Depends on: 7b, 8b, 10. Effort 2d. First doctor phase and first host user of the engine: restores the parity
tables (P12). Cut-over phase: run the re-sync step of the phase-lead rules first.

## Context

Nine `bridge:S6a` rows are judged by Node bodies in `src/setup/registrations.mjs` (imports at `:47-57`, `:80`):
`confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped`
(fix), `credential-copies-retained` (fix), `confinement-bwrap-platform`, `confinement-probe-freshness`,
`confinement-blind-read`, `confinement-strict-readiness`, `confinement-herdr-maturity`. The "packaging doctor
judgments" door row carries `checkBwrapAvailable` in `registrations.mjs` as debt `retiredBy: S6a`. Host doctor engine
and S4/S5 row wiring: `apps/fgos/src/wiring/doctor/`. The host does not depend on the engine yet
(`apps/fgos/Cargo.toml:8-37`). Setup/doctor gate (AGENTS.md): a repair only when safe and about readiness; reporting
stays on the component's own verb.

## Requirements

- `apps/fgos/Cargo.toml` gains `fgos-execution-engine` (V10; no other wave-5 phase edits it).
- `apps/fgos/src/wiring/doctor/confinement.rs` judges the nine rows and runs the two fixes over engine modules
  `confinement::{policy,request,driver,cleanup}` and `credentials`; `mod.rs` registers them.
- Registry: the nine rows move to `inRust`; owner no longer `bridge:S6a`; `layers` names no Node module for them.
- `registrations.mjs`: the nine bodies, `checkBwrapAvailable`, and the imports only they used are deleted; in the same
  change the "packaging doctor judgments" row drops its `checkBwrapAvailable` debt and pattern alternative (V4).
- Parity: restore `test/rust-host/parity-cases/doctor.cases.mjs` from `9772db47d^` (cut to these nine rows, then grown
  by phase 17), and the runner `test/rust-host/verb-parity.test.mjs` if S5's close deleted it (its last version); run
  against the base release on the integration branch only (P12).
- S4 doctor fixtures stay.
- Row tests: one Rust test per row outcome class in the module's unit tests (no `cli_tests.rs` edit).

## Steps

1. Re-sync from main (`src/setup`, confinement paths); report table.
2. Red: Rust row tests; parity table for the nine rows (green on the Node base, red on the host until wired).
3. Wire; flip registry; delete Node bodies and the door debt; green parity and tests.
4. Retire Node row tests in `test/setup/` to the Rust owners (report table).

## Validation

`cargo test -p fgos` (doctor tests); `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs` (integration
only) plus `test/setup/checks*.test.mjs`, the registry exact-set test and `test/architecture.test.mjs`;
`fgos doctor --json` (dev host) shows the nine rows judged with no Node child for them; lead-rules gates.

## Risk and rollback

Risk: a fix removes a resource Node would have kept (credential copies). Parity table includes the fix paths on a
fixture with a pending copy. Rollback: revert; the Node bodies return.
