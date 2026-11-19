# Phase 15: doctor rows, confinement

Wave 5. Depends on: 7b, 8b, 10. Effort 2d. First doctor phase and first host user of the engine: restores the parity
tables (P12). Cut-over phase: run the re-sync step of the phase-lead rules first.

## Context

Nine `bridge:S6a` rows are judged by Node bodies in `src/setup/registrations.mjs` (re-read on `f031ab0c8`; imports at
`:48-58` (policies, backend registry, probe harness, cleanup), `:67-69` (capability config), `:79-80` (provider
capacity, credential renewal); bodies and registrations `:1595-2244`): `confinement-policies-declared`,
`confinement-backend-registry-readable` (fix, `:1734`), `confinement-orphaned-resources-reaped` (fix, `:1781`),
`credential-copies-retained` (fix, `:1964`), `confinement-bwrap-platform`, `confinement-probe-freshness`,
`confinement-blind-read`, `confinement-strict-readiness`, `confinement-herdr-maturity`. Three of the five bridged fixes
are these rows' (registry `fixes`; the other two are `runtime-socket-dir`, phase 17, and `workflow-case-bindings`,
S6b). `src/setup/checks.mjs:21` re-exports `checkConfinementHerdrMaturity`. The "packaging doctor judgments" door row
(`docs/architecture-manifest.json:1555-1571`: pattern alternative `checkBwrapAvailable` at `:1558`, debt at `:1566-1567`)
carries `checkBwrapAvailable` (`registrations.mjs:830`) as debt `retiredBy: S6a`. Host doctor engine and S4/S5 row
wiring: `apps/fgos/src/wiring/doctor/` (since base it also holds `supervision.rs`, `observe.rs`, `config.rs`). The
host does not depend on the engine yet (`apps/fgos/Cargo.toml` `[dependencies]` `:7-46`). Measured-count proofs pin
the split: `test/setup/registrations.test.mjs:1177-1185` (S6a/S6b/S7 bridged rows `[32, 6, 7]`, 71 Rust rows, 5
bridged and 25 Rust fixes) and `apps/fgos/src/wiring/doctor/mod.rs:546-558`. Setup/doctor gate (AGENTS.md): a repair
only when safe and about readiness; reporting stays on the component's own verb.

## Requirements

- `apps/fgos/Cargo.toml` gains `fgos-execution-engine` (V10; no other wave-5 phase edits it).
- `apps/fgos/src/wiring/doctor/confinement.rs` judges the nine rows and runs the three fixes over engine modules
  `confinement::{policy,request,driver,cleanup}` and `credentials`; `mod.rs` registers them.
- Registry: the nine rows move to `inRust`; owner no longer `bridge:S6a`; `layers` names no Node module for them.
- `registrations.mjs`: the nine bodies, the three fixes, `checkBwrapAvailable`, and the imports only they used are
  deleted; `src/setup/checks.mjs` drops its `checkConfinementHerdrMaturity` re-export; in the same change the
  "packaging doctor judgments" row drops its `checkBwrapAvailable` debt and pattern alternative (V4).
- The measured-count proofs (`test/setup/registrations.test.mjs:1177-1185`, `apps/fgos/src/wiring/doctor/mod.rs:546-558`)
  move by the nine rows and three fixes.
- Parity: restore `test/rust-host/parity-cases/doctor.cases.mjs` from `9772db47d^` (cut to these nine rows, then grown
  by phase 17), and the runner `test/rust-host/verb-parity.test.mjs` from `56c909b09^` (S5's close, `56c909b09`, deleted
  it); run against the base release on the integration branch only (P12).
- S4 doctor fixtures stay.
- Row tests: one Rust test per row outcome class in the module's unit tests (no `cli_tests.rs` edit).

## Steps

1. Re-sync from main (`src/setup`, confinement paths); report table.
2. Red: Rust row tests; parity table for the nine rows (green on the Node base, red on the host until wired).
3. Wire; flip registry; delete Node bodies and the door debt; green parity and tests.
4. Retire Node row tests to the Rust owners (report table): `test/setup/{confinement-doctor-checks,bwrap-check,credential-copies-retained-check}.test.mjs`
   and the row cases in `test/runner/{dispatch-confinement-backend-p03,dispatch-confinement-blind,dispatch-confinement-p05,provider-credential-renewal}.test.mjs`
   (they import `checkConfinementProbeFreshness` `:76`, `checkConfinementBlindRead` `:33`,
   `checkConfinementHerdrMaturity` `:26`, `fixCredentialCopiesRetained` `:41` from `registrations.mjs`).

## Footprint

`apps/fgos/Cargo.toml`, `apps/fgos/src/wiring/doctor/confinement.rs`, `apps/fgos/src/wiring/doctor/mod.rs`,
`packages/distribution/contracts/doctor-registry.v1.json`, `src/setup/registrations.mjs`, `src/setup/checks.mjs`,
`test/setup/**`, `test/runner/dispatch-confinement-backend-p03.test.mjs`, `test/runner/dispatch-confinement-blind.test.mjs`,
`test/runner/dispatch-confinement-p05.test.mjs`, `test/runner/provider-credential-renewal.test.mjs`,
`test/rust-host/verb-parity.test.mjs`, `test/rust-host/parity-cases/**`, `docs/architecture-manifest.json`.

## Validation

`cargo test -p fgos` (doctor tests); `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs` (integration
only) plus `test/setup/checks*.test.mjs`, the registry exact-set test and `test/architecture.test.mjs`;
`fgos doctor --json` (dev host) shows the nine rows judged with no Node child for them; lead-rules gates.

## Risk and rollback

Risk: a fix removes a resource Node would have kept (credential copies). Parity table includes the fix paths on a
fixture with a pending copy. Rollback: revert; the Node bodies return.
