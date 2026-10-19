# Phase 01 — Playbook order regression guard

## Context

- Spec RUL-WF-18 (observable order of every playbook identical to today), §8 row "`fgos workflow start <playbook>` … đường không được hồi quy", battery 12, §11.2 "Thứ tự playbook giữ nguyên trên mọi run đã lưu".
- Lead constraint: every phase runs the existing playbooks unchanged in observable order. Stored runs (`.fgos/workflow-runs/`, 92) are untracked, so CI cannot read them; the guard is a committed baseline produced from today's code.
- Harness to reuse: the fake echo worker and tmp-repo setup in `test/workflow/discussion-workflows.test.mjs:29-60` (and its siblings `architecture-advisory-workflow.test.mjs`, `business-discussion-workflow.test.mjs`).

## Requirements

- One test that runs each registered playbook (`core/workflows/*.yaml`: architecture-advisory, architecture-advisory-reopen, business-discussion, council-lite, delphi, group-cognition, nominal-group) plus `marketing/content-publish` (answering its gate) and one `--units` wave, in `--foreground`, with the fake worker, and asserts an **observable-order projection** equals a committed baseline.
- Observable-order projection (pure function of the event log + unit records): ordered list of `{stepId, unitId, pattern, blind, roles launched in order, seat count, gate parked/answered}` and the terminal status. Not timestamps, not ids, not event `seq` (later phases add event kinds; the projection ignores kinds it does not know, so the guard survives them).
- The baseline is generated once from current HEAD and committed; regenerating it is a reviewed act, never part of a later phase's diff unless that phase states why (none in this plan should).

## Files

- Create `test/workflow/playbook-observable-order.test.mjs`.
- Create `test/fixtures/workflow/playbook-observable-order.json` (baseline).
- Reuse, do not copy, the tmp-repo + echo worker setup: if no shared helper exists, extract it once into `test/helpers/workflow-fixture-repo.mjs` and point the three existing suites at it (DRY; same behaviour).

## Steps

1. Extract the shared fixture-repo helper (if absent) and switch the three suites to it; they must stay green unchanged in assertions.
2. Write the projection function inside the test file (it reads only `readWorkflowEvents` output and `.fgos/assignments/<unitRunId>/unit.json`).
3. Generate the baseline from HEAD; commit with the test.
4. Big-lead one-off (not CI): run the same projection over the 92 stored runs on the owner machine with a scratch script under `.fgos/runtime/tmp/` and confirm each stored run's step/unit/pattern/blind order matches its guide's baseline entry; record the result in the phase report. Repeat after phase 06.

## Tests

- New guard test (battery 12, order part).
- Existing: `test/workflow/*.test.mjs` unchanged and green.

## Risks / rollback

- Flaky timing in multi-seat playbooks: the projection orders seats by role order within a round, not by launch timestamp. If parallel seats have no defined order, record them as a set.
- Rollback: delete the two new files and the helper extraction; nothing else depends on them yet.

## Done when

Guard green on HEAD; stored-run cross-check recorded; full `npm test` green.
