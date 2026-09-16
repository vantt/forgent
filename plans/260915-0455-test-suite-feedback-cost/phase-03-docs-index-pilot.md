# P03 - Docs Index State-Fixture Pilot

**Capability:** `code:implement`

**Depends on:** P02

## Purpose

Measure whether replacing repeated reads of the repository's large live Work
store with an explicit small fixture removes the docs-index outlier without
weakening real-docs coverage, per TFC-D06.

## Read First

`decision-lock.md`, `reports/green-baseline.md`,
`test/report/enduser-index.test.mjs`, the docs-index implementation, and the
prior JUnit profile.

## File Lease

- May edit: `test/report/enduser-index.test.mjs`
- May add: focused fixture helper under `test/report/helpers/` and
  `reports/docs-index-pilot.md`
- Must not edit: docs-index production behavior or real docs content

## Requirements

R1. Measure the test file before mutation with retained raw output.
R2. Keep scanning the real repository docs tree where that is the asserted
   boundary; change only the Work-state input that causes repeated 10.8 MB folds.
R3. Seed a minimal fixture using the real persisted event/state shape needed to
   resolve one compound capture.
R4. Make the `sourceCaptureId` assertion unconditional and preserve all prior
   assertions, missing-quadrant behavior, idempotency, and restore behavior.
R5. Measure identical commands after mutation and report wall/CPU change against
   the pre-registered threshold.

## Adversarial Checks

- A fabricated object bypassing the real store reader.
- `--dir` accidentally moving docs discovery away from the real tree.
- Conditional assertions or missing fixture capture yielding a vacuous pass.
- Tests racing while renaming a real docs quadrant or restoring the manifest.

## Verification

```sh
node --test test/report/enduser-index.test.mjs
npm test
```

## Acceptance

All old assertions remain, `sourceCaptureId` is unconditional, focused and full
suites are green, before/after artifacts are retained, and the report returns
`expand`, `revise`, or `stop`. A timing win below measured noise is `stop`.

## Risks And Rollback

Risk is replacing real integration coverage with a fabricated projection. If R2
or R3 cannot be proved, restore the original test implementation and retain a
`stop` report; do not adjust production docs-index behavior.

## Handoff

Commit only the proven pilot and its report. P04 may cite the baseline but may
not combine its timing with this pilot's result.
