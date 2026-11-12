---
phase: 29
title: "`refused` has one meaning: a seat's own fact; a refused seat is never infrastructure"
status: landed
depends_on: [09, 20]
parallel: "P30 edits run.mjs and assignment-runner.mjs; this phase touches neither"
---

# Phase 29 - `refused` one meaning - Execution (T5) / Workflow (T6)

**Authority moved:** none moved. Execution (`infrastructure()`, `src/runner/execution/outcome.mjs`) is the one owner of "a refused seat is never infrastructure"; Workflow only reads `infrastructure`.

## Context

Contract section 4 names `refused { reason, detail, paths? }` as a seat-level fact. Workflow also wrote `refused` as the outcome of a step ended by an admission refusal, and `isRerunnable` kept its own `.some(result.refused)` check beside the `infrastructure` fact.

## Requirements

1. A refused seat is never infrastructure: per attempt (outcome `policy-refusal`, already held) and per unit (`infrastructure()` false when any result carries `refused`; before, a unit refused before any brief ended `not-started` and read as infrastructure).
2. `isRerunnable` reads `infrastructure` only; an old entry without it goes through `legacy-ledger-read.mjs`, which answers terminal for a refused seat.
3. Workflow's step outcome `refused` becomes `admission-refused` (writer `refuseUnit`, `runner.mjs`; the folds of `step.fail` and `workflow.fail` read an old `refused` through `legacyStepOutcomeOf`). `unitFailureReason` still reads the seat's `refused` for the failure text.
4. `case-projection.mjs` reads `NOT_STARTED_OUTCOME` from the outcome module.

## Files

`src/runner/execution/outcome.mjs`, `src/workflow/{store,legacy-ledger-read,runner,case-projection}.mjs`, the contract row for `infrastructure`; tests: `test/cli/execution-outcome-exit-codes.test.mjs` (owns the invariant), `test/workflow/legacy-ledger-read.test.mjs`, `test/workflow/workflow-store-ledger.test.mjs`.

## Validation

Focused tests, architecture and doc-health tests, census scan, full `npm test`. Rollback: revert the merge commit.
