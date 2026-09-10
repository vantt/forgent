# Phase 07 — Strict Readiness, Docs, And Closeout

Depends on: Phase 06 closed or live-proof blocker explicitly accepted by the Lead.

## Objective

Close the implementation track: strict readiness, docs, specs, changelog, setup
and doctor surfaces, full tests, and final evidence package.

## Requirements

- R1: Decide and record whether `runner.confinement.strict` can default true now
  or remains false with doctor readiness guidance. Do not flip true unless every
  committed capability anchor is explicit and supported.
- R2: Update specs with settled implementation facts:
  `docs/specs/confinement-authority.md`,
  `docs/specs/runner.md`,
  `docs/specs/distribution.md`,
  and any relevant reading-map/architecture-map rows.
- R3: Update end-user docs/how-to for configuring backend registry, reading
  attestation, running doctor, and interpreting refused/degraded/unconfined
  outcomes.
- R4: Update `CHANGELOG.md` under `## [Unreleased]` with user-visible changes.
- R5: Run `detect_changes()` / GitNexus equivalent before any commit if the Lead
  is committing; verify affected symbols and execution flows match this plan.
- R6: Run full suite:
  `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`.
- R7: Produce a final closeout report under this plan directory summarizing:
  implemented support matrix, open deferrals, proof artifacts, test results,
  doctor output, and exact strict-mode status.

## Files

Likely touch:

- `docs/specs/confinement-authority.md`
- `docs/specs/runner.md`
- `docs/specs/distribution.md`
- `docs/specs/reading-map.md`
- `docs/architecture-map.md`
- `docs/how-to/**`
- `docs/reference/dispatch-module-boundaries.md`
- `CHANGELOG.md`
- plan proof/closeout reports

## Verification

- Full test suite green or a reproducible environment blocker is recorded.
- Doctor output demonstrates setup/config/backend/probe readiness.
- Docs explain exact default support matrix and do not overclaim bwrap.
- No Work state changed as part of plan coordination.
- Capability annotation for this cell: `code:implement`.

