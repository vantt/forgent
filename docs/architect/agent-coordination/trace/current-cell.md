# Current Cell - 6.1 planning.validate-plan Fake Executor Happy Path

Status: open
Date: 2026-08-30
Cell trace file: `docs/architect/agent-coordination/trace/step-06-cell-1-validate-plan-happy-path.md`

## Goal

Prove the composed happy path end to end: a real planning Work item (committed
plan.md) goes through `runOnce` -> driver selects `planning.validate-plan`
-> Assignment runs via fake executor -> worker writes `agent-result.json`
(READY verdict) + `agent-report.md` -> RunResult is `done/reported` -> driver
consumes the verdict -> Work moves only via existing engine verbs; the
Assignment itself never moves Work.

## Non-Goals

- No negative cases (cell 6.2), no live smoke (cell 6.3), no executing-stage ops.
- No workflow YAML change, no FSM/store change, no new modules.
- No Step 7, Mission, Herdr-truth, Job/scheduler.
- No commit (user decides).

## Must-Read Files

- this file
- `docs/architect/agent-coordination/step-06-work-attached-team-adoption.md` sections 3 (slice 6.1), 5 (evidence table), 6 (tests)
- `src/runner/loop.mjs` around line 1520 (validate-plan assignment dispatch + verdict consumption)
- `test/runner/loop.test.mjs` line ~2736 (existing cwd-selection test = fixture template)
- `test/runner/assignment-dispatch.test.mjs` line ~83 (existing fake-executor execution test)

## May-Inspect Files

- `src/runner/dispatch/operation-choice.mjs` (planning selection rules)
- `src/runner/dispatch/assignment-runner.mjs` (reported classification)
- `domains/coding/task-specs/validate-plan.md` (verdict vocabulary)

## Do-Not-Touch Files

- workflow YAML, FSM modules, `src/state/store.mjs`, `operation-choice.mjs` resolvers
- docs other than the cell trace; `.fgos/` outside test-created temp dirs

## Tests To Add First (failing before implementation)

1. runOnce happy path: planning Work (docsRef + committed plan.md, no open blockers)
   -> runOnce dispatches validate-plan Assignment to fake executor
   -> executor writes valid `agent-result.json` (verdict READY) + `agent-report.md`
   -> RunResult `status: done`, `confidence: reported`.
2. Same scenario: driver consumes READY + reported and feeds the existing
   planning edge (or a conservative stop if the edge is not reachable in-test) —
   assert Work stage/status changed only through engine verbs, and the
   assignment did not set status/stage itself.
3. Assert evidence: `.fgos/assignments/<asgn_*>/runs/01/` contains
   `assignment.json`, `run.json`, `agent-result.json`, `agent-report.md`,
   `result.json`, `evidence.json`; verdict artifact is NOT a control-plane file.

## Acceptance Criteria

- New happy-path tests added and passing; they fail (red) before any needed glue change.
- If runOnce already composes the path (expected, per loop.mjs:1520), the cell may be test-only — say so in the trace.
- Regression green: loop (84+), operation-choice (98), assignment-dispatch (12),
  assignment-runresult (22), e2e runner-loop (15), fgos-stage (19).
- No weakening of existing tests.

## Bug Taxonomy (findings classify into)

- Work lifecycle authority leak; evidence false-success; no-evidence/failed
  advances Work; dirty-before counted as evidence; primary path regression;
  operation legality bypass; missing positive/negative tests; trace/proof gap.

## Trace Update Requirements

- Doer updates `step-06-cell-1-validate-plan-happy-path.md`: goal, code paths,
  commands + one-line results, status, gaps. Under 150 lines, no long stdout.
