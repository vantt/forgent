---
contract: plan-v1
title: "A second coding workflow guide for bugfix"
status: draft
priority: P1
blockedBy: []
footprint:
  - plans/261121-1314-coding-bugfix-guide/**
  - domains/coding/workflows/bugfix.yaml
  - domains/coding/compiled.json
  - test/state/workflow-multiplicity.test.mjs
base: 0606fb659bad0208920004f7710743f506c0cc88
source:
  - docs/discussions/workflow-engine/DISCUSSION.md
  - tsk-1pv
created: 2026-11-21
---

# A second coding workflow guide for bugfix

## Outcome
A second coding workflow guide, `coding/bugfix`, selected with `--guide coding/bugfix`, providing a streamlined path for bugfixes that is shorter than `coding/feature`:
- Defined in `domains/coding/workflows/bugfix.yaml` and compiled into `domains/coding/compiled.json`.
- At `decisions-locked`, it specifies `SHOULD validate-plan` only (with `MAY [scout-blast-radius, shape-plan]`), bypassing unnecessary shape-plan overhead when a bug's root cause and fix are already known.
- At `plan-validated`, it specifies `SHOULD implement-item` with the reason that the cause is shown first, keeping `fix-verify-red` as a `MAY`.
- All eleven activity names (including `implement-item`, `validate-plan`, `judge-ambiguity` required by `propose`) and seven milestones are preserved without introducing new mechanisms or unnecessary diagnose activities (honoring D1, D2, D3, D4).
- The Work lifecycle wiring and `workflowFor` remain untouched (D2).

## Acceptance criteria
1. `domains/coding/workflows/bugfix.yaml` exists with `kind: guide`, purpose "Take one coding item from one bug to an approved, integrated fix, cause shown before the edit, with proof at each step that matters.", and the exact difference table settled in D3/D4.
2. `domains/coding/compiled.json` is recompiled with `npm run build:domains`, and `npm run build:domains -- --check` exits 0 (`domain-registry-compiled` doctor check green).
3. `fgos workflow propose --guide coding/bugfix` on a one-slice bug plan returns no `guide-activity-missing`.
4. `test/state/workflow-multiplicity.test.mjs` is extended to assert `Object.keys(coding.workflows).sort()` contains both `'bugfix'` and `'feature'`, while `workflowFor` remains empty and `resolveWorkflow(coding, 'bug')` continues resolving to `feature`.
5. Full node test suite for touched files passes: `node --test test/state/workflow-multiplicity.test.mjs` and `node --test test/state/domain-registry-compiled.test.mjs`.

## Non-goals
- Altering the Work lifecycle engine or hardcoded stage names in `src/runner/operation-choice.mjs` (retained until cutover per D2).
- Modifying `workflowFor` in `domains/coding/registry.yaml` (Work items continue using default `feature`).
- Adding a new "diagnose" activity (per D4, cause-proof is carried by `fix-verify-red` and `scout-blast-radius`).
- Touching the supervisor or orchestration-skeleton tier (supervisor owns actors and time, workflow owns work detail per D1).

## Prior art (reused, and what was missing)
- Reused:
  - The guide tier schema and validation in `src/workflow/guide-schema.mjs` and `src/workflow/definition.mjs`.
  - The eleven existing activities and seven milestones from `domains/coding/workflows/feature.yaml`.
  - The domain compilation pipeline in `scripts/build-domain-registry.mjs` and `src/util/domain-compile.mjs`.
  - The multi-workflow selection mechanism tested in `test/state/workflow-multiplicity.test.mjs`.
- What was missing:
  - The second workflow file `domains/coding/workflows/bugfix.yaml` in the coding domain pack.
  - Recompiled `domains/coding/compiled.json` reflecting the second workflow.
  - Unit test coverage in `test/state/workflow-multiplicity.test.mjs` asserting both `feature` and `bugfix` exist under `coding.workflows`.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Coding bugfix workflow guide and tests](phase-01-coding-bugfix-guide.md) | - | domains/coding/workflows/bugfix.yaml, domains/coding/compiled.json, test/state/workflow-multiplicity.test.mjs | 1 | ready |

## Owner questions
None. (All open points resolved and locked in `docs/discussions/workflow-engine/DISCUSSION.md` decisions D1-D4).

## Risks and rollback
- Risk: A YAML syntax error or schema violation in `bugfix.yaml` could break domain registry compilation or doctor checks. Proof point: `npm run build:domains -- --check` and `test/state/domain-registry-compiled.test.mjs` are run as immediate gate.
- Rollback: Revert the landing commit; `domains/coding/workflows/bugfix.yaml` is deleted and `domains/coding/compiled.json` is restored to single-workflow state.
