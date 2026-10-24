# Phase 02: `activityUnitOf`, the Workflow export that hands the Core an activity's unit

Depends on: nothing (independent of 01, can run first or any time before 08). Blocks: 08. Effort: 1.5h. Risk: Low.

Run as (fgos-cook): activity `implement-item`, capability `code:implement`, pattern `reviewed` (by hand), rigor `standard`, one slice. `--verify "node scripts/run-tests.mjs test/workflow/case-admission-port.test.mjs test/architecture.test.mjs"`.

## Context links

- Spec section 6 (reuse, one owner), section 9.2 row "`--case --activity` without a selector", scenario S2.
- Prior art reused: `readCase(mainRoot, caseId)` (`src/workflow/case-admission-port.mjs:45`) already folds the ledger into `projection.guide`, whose `activities` carry the free `unit` object (`src/workflow/guide-schema.mjs:202-209`); `domains/coding/workflows/feature.yaml:144-145` writes `unit: { pattern: reviewed }`.
- Constraint: the Execution Core never imports the Workflow (`test/architecture.test.mjs`); `bin/fgos.mjs` is the one caller (phase 08). The AdmissionPort gains no operation.

## Requirements

1. `activityUnitOf({ mainRoot, caseId, activity })` is a named export of `src/workflow/case-admission-port.mjs` and returns `{ pattern, params }` (params defaults to `{}`) from the case's pinned workflow snapshot (the guide in the ledger, not the live workflow file).
2. It returns `null` when: the case directory does not exist (admission, not this function, names that refusal), the activity is missing, the activity has no `unit`, `unit.pattern` is not a non-empty string (`{ kind: integrate }`), or the activity is playbook-derived (`unit` is `{ step, units }`).
3. It validates nothing about the params (the Core refuses `param-unknown` and the rest on every carrier).
4. It reads without taking `advance`; a case that closes in between is irrelevant here.

## Files (writes)

- `src/workflow/case-admission-port.mjs` (add the export; `createCaseAdmissionPort` unchanged)
- `test/workflow/case-admission-port.test.mjs` (owning proof, extend)
- `packages/git/contracts/mutation-census.v1.json` (regenerate)

## Steps

1. Add the function next to `readCase`; reuse `caseDirOf` for the missing-case branch.
2. Tests in the existing file: a conductor-case fixture (the file already builds cases; for a non-coding shape reuse its local workflow fixture helper) with five activities: with `unit: { pattern, params }`, with `unit: { kind: integrate }`, without `unit`, playbook-derived, and an unknown activity id; plus a missing case id. Assert the null/non-null table of requirement 2.
3. Regenerate the census.

## Verify

The narrow command above. No full gate.

## Risks and mitigations

- Reading a closed or half-written ledger throws from `readEvents`: use the same retry as `readCase`; only the missing-directory case returns null, everything else propagates (a corrupt ledger must not look like "no unit").
- Layering: the function must not be imported by anything under `src/runner/`; `test/architecture.test.mjs` already guards it.

## Rollback

Revert the commit (additive export, no caller until phase 08).

## Acceptance

S2 owned here: `test/workflow/case-admission-port.test.mjs`. (Chain falls to `solo` is asserted in phase 05; this proof only owns the export.)
