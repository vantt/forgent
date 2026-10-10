---
phase: 2
title: "Unit association before dispatch"
status: pending
budget: "<= 50 added src lines; 0 new files; one new event type unit.started in the existing workflow journal"
stop: 2026-10-11
---

# Phase 02: unit association before dispatch

## Context

- [plan.md](plan.md); `docs/specs/runner.md:3134` ("Workflow store ghi `unitRunId` trên `unit.complete`") and `:1441` (resume of a `reviewed` round keeps settled seats).
- Today: `unit.scheduled` (`src/workflow/runner.mjs:432-443`) -> `runUnit` (`:450`) -> `unit.complete` with `unitRunId` (`:468-481`). Store: `src/workflow/store.mjs:178-193`. Resume skips only `completed` (`runner.mjs:392-394`).
- `runUnit` already resumes by id and reuses settled seats: `src/runner/execution/run.mjs:160-195,283`, `unit-run-history.mjs:95`.
- `unit.json` written before any seat: `run.mjs:241-256`.

## Requirements

- The Unit run id is in the workflow journal before the first seat can start.
- Advancing a run whose unit is `running` with a known id resumes that Unit run (`resumeUnitRunId`), never allocates a new one.
- A unit with writes reuses its recorded worktree/branch (`uState.worktreePath`/`branch`) instead of calling `createWorkflowWorktree` again (today a second call fails and silently falls back to the shared worktree, `runner.mjs:420-429`).
- A unit `running` without an id (died before `unit.json`) runs fresh, as today.

## Files

- Modify: `src/runner/execution/run.mjs` (optional `onUnitRunCreated(unitRunId)` called once right after `unit.json` is written, new runs only), `src/workflow/runner.mjs` (record `unit.started {stepId, unitId, unitRunId}` from the callback; resume branch), `src/workflow/store.mjs` (project `unitRunId` onto the running unit).
- Tests: `test/workflow/workflow-runner.test.mjs`.
- Docs: `docs/specs/runner.md:3134` line updated (id recorded at start, completed on `unit.complete`). No CHANGELOG (internal) unless owner wants it.
- Delete/leave: no `prepareUnitRun` split, no deterministic hash id, no history scan (frozen-branch parts not reused).

## Steps

1. Impact analysis on `runUnit`, `advanceWorkflow` (or the function owning `runner.mjs:392-489`), `projectWorkflowState`.
2. Callback in `runUnit`; event + projection; resume branch passes `resumeUnitRunId`, `repoRoot`, recorded worktree.
3. Test T2: executor stub settles seat A, the controller "dies" (advance aborted after A's result, no `unit.complete`), resume -> same unit-run id, seat A not dispatched again, seats B.. dispatched once, `unit.complete` carries the same id.
4. Spec line; independent review; merge.

## Done

T2 green, run by Lead on a clean checkout, plus `npm test`.

## Risks / rollback

- In-flight seat at death: resume goes through dispatch reconcile, which is session-blind until P03. Until then a live seat may be judged unknown and re-run (today's behaviour, not worse).
- `resumeUnitRunId` refuses `stanceOptions`; runner must not pass them on resume.
- Rollback: revert; old journals without `unit.started` behave as today.
