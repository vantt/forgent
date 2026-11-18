# Phase 15: doctor rows, confinement

Wave 4. Depends on: 7, 8. Effort 2d. First doctor phase: restores the parity tables (P12).

## Context

Nine `bridge:S6a` rows are judged by Node bodies in `src/setup/registrations.mjs` (imports at `:47-57`, `:80`):
`confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped`
(fix), `credential-copies-retained` (fix), `confinement-bwrap-platform`, `confinement-probe-freshness`,
`confinement-blind-read`, `confinement-strict-readiness`, `confinement-herdr-maturity`. The "packaging doctor
judgments" door row carries `checkBwrapAvailable` in `registrations.mjs` as debt `retiredBy: S6a`. Host doctor engine
and S4/S5 row wiring: `apps/fgos/src/wiring/doctor/`. Setup/doctor gate (AGENTS.md): a repair only when safe and about
readiness; reporting stays on the component's own verb.

## Requirements

- `apps/fgos/src/wiring/doctor/confinement.rs` judges the nine rows and runs the two fixes over engine modules
  `confinement::{policy,driver}` and `credentials` (phase 10 landed in wave 3); `mod.rs` registers them.
- Registry: the nine rows move to `inRust`; owner no longer `bridge:S6a`; `layers` names no Node module for them.
- `registrations.mjs`: the nine bodies, `checkBwrapAvailable`, and the imports only they used are deleted; the
  "packaging doctor judgments" debt entry is removed by phase 22 (one writer of `doors`), noted in the report.
- Parity: restore `test/rust-host/parity-cases/doctor.cases.mjs` from `9772db47d^` (cut to these nine rows, then grown
  by phase 17), and the runner `test/rust-host/verb-parity.test.mjs` if S5's close deleted it (its last version); run
  against the base release on the integration branch only (P12).
- S4 doctor fixtures stay.
- Row tests: one Rust test per row outcome class in `apps/fgos/tests/` or the module's unit tests (no `cli_tests.rs`
  edit; that file belongs to 1, 19, 21).

## Steps

1. Red: Rust row tests; parity table for the nine rows (green on the Node base, red on the host until wired).
2. Wire; flip registry; delete Node bodies; green parity and tests.
3. Retire Node row tests in `test/setup/` to the Rust owners (report table).

## Validation

`cargo test -p fgos` (doctor tests); `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs` (integration
only) plus `test/setup/checks*.test.mjs` and the registry exact-set test; `fgos doctor --json` (dev host) shows the
nine rows judged with no Node child for them; lead-rules gates.

## Risk and rollback

Risk: a fix removes a resource Node would have kept (credential copies). Parity table includes the fix paths on a
fixture with a pending copy. Rollback: revert; the Node bodies return.
