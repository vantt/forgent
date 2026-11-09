---
phase: 23
title: "T5/T6 fix: a Unit-run record port; Workflow stops reading Execution's private files and stops settling or deleting Unit runs itself"
status: pending
depends_on: ["08 landed (unit-handoff.mjs writer order)", "07 and 09 landed if approved (unit-handoff.mjs, case-admission-port.mjs writer order; the settle shape); if they are handed off, this phase uses today's settle payload", "COOK's unit-run-result text (case admission port shape)"]
parallel: "T6 slot, after P08 and P09; beside P11 (file-disjoint)"
effort: ~1d
net_size: "Node: Execution about +60, Workflow about -70: about -10; Rust 0; tests moved, not grown (estimate)"
---

# Phase 23 - Unit-run record port (authority audit AU-13)

**Authority moved:** a Unit run's lifecycle and record (exists, settled, controller held, worktree, write scope, resumable, removable) are Execution's; Workflow keeps only "does a case still name this run". Execution becomes the only writer of a reservation's settle and the only remover of `.fgos/assignments/<unitRunId>`.

## Context

Workflow judges Execution's on-disk layout today:

| Site | What it judges |
|---|---|
| `src/workflow/unit-handoff.mjs` (`canResumeUnitRun`, `:478-489` on `308c314a0`) | reads `unit.json` to decide resumability |
| `src/workflow/case-runtime.mjs:73-89` | `reservationDead` reads `unit.json` `execution.status` and `unitControllerHeld`; `releaseDeadReservations` writes a `not-started` settle itself: a second writer beside Execution's `settleAdmission` |
| `src/workflow/case-close.mjs:181-211` | `KEEP_REASONS` (`unit-record-missing`, `controller-held`, `custody-held`, `unsettled`); prune then deletes directories under `.fgos/assignments` |

The write-scope read in `unit-handoff.mjs` (`:283`) goes with P07 (scope rule into Execution). Decision 73 (e) (plain `fgos run` retention) needs the same judgement for runs no case names and builds on this port. Decision 73 (b): a settled Unit run is never released as `not-started` by another process's hold; that rule moves with the code.

## Requirements

1. Execution exports a Unit-run record port (beside `src/runner/execution/case-admission-port.mjs` or in `unit-state.mjs`; step 1 picks the existing home): `unitRunFacts(unitRunId) -> { exists, settled, controllerHeld, worktree, writeScope, resumable }` and `removeUnitRun(unitRunId, { unless })` with the keep reasons as Execution's table. Versioned with `contract: { id, version }` (COOK §2 shape).
2. `canResumeUnitRun`, `reservationDead` and the keep-reasons table read `unitRunFacts`; prune calls `removeUnitRun`; Workflow keeps only "the whole case goes" (decision 73 c) and "a case still names this run".
3. The dead-reservation release asks `unitRunFacts` and settles through Execution's one settle door (the port's `settle`, same shape as P07 when P07 landed); Workflow's own `not-started` settle write goes.
4. No behaviour change: the same runs are kept, released and deleted for the same inputs.

## Files

**Modify:** the Execution module step 1 picks, `src/workflow/unit-handoff.mjs` (`canResumeUnitRun` only), `src/workflow/case-runtime.mjs`, `src/workflow/case-close.mjs`, `test/runner/execution/*` (receives the keep-reasons cases), `test/workflow/*prune*` and `*case-runtime*` (keep the case-level rule and one wiring case), `docs/architecture-manifest.json` only if a file is created.

**Delete:** Workflow's `unit.json` reads; `releaseDeadReservations`' own settle write; `KEEP_REASONS` in Workflow.

**Tests to retire:** the keep-reason cases move to `test/runner/execution/*` (moved, named in the commit body); Workflow's prune test keeps the "whole case goes" rule.

## Steps

1. `rg -n "unit\.json|unitControllerHeld|KEEP_REASONS|canResumeUnitRun|releaseDeadReservations|assignments" src/workflow`; list every site with `file:line`; confirm no other Workflow reader of the layout.
2. Red: the port's test over a staged run directory per keep reason; a Workflow case where a dead reservation is released through the port double (fails today: Workflow writes the settle).
3. Port; Workflow sites; deletions.

## Validation (focused)

FR `test/runner/execution/*` port tests, `test/workflow/*case-runtime*`, `*case-close*`, `*prune*`, resume tests; land gate. COOK reviews the port shape; WORK told (decision 73 e builds on it).

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| A prune deletes a run a case still names | L x H | `removeUnitRun` refuses when `unless` names it; Workflow passes the named set; the decision 73 (c) test stays |
| A race between two releases of one reservation | L x H | the settle door keeps decision 73 (b) "settle wins"; its test moves with it |

Rollback: revert the merge commit.
