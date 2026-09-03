# Cell 6.1 — planning.validate-plan Fake Executor Happy Path

Status: done (test-only cell)
Date: 2026-08-30
Cell brief: `current-cell.md` (Cell 6.1)

## Goal

Composed happy path: planning Work item -> runOnce selects `validate-plan`
-> Assignment via fake executor -> `agent-result.json` READY + `agent-report.md`
-> RunResult `done/reported` -> driver consumes verdict; Work moves only via
engine verbs; the Assignment never moves Work.

## Result

`runOnce` already composes the whole path — the cell is TEST-ONLY. Three
happy-path tests were written first and passed on the first run with zero
production changes. Nothing was broken to force red.

## Why it composes (code paths, read-only)

- `src/runner/dispatch/operation-choice.mjs:530` — planning rules pick
  `validate-plan` / `dispatch: 'assignment'` when plan.md exists
  (`hasPlanMd`, :31), the task-spec file exists at
  `domains/<domain>/task-specs/validate-plan.md`, and no prior RunResult
  intervenes.
- `src/runner/loop.mjs:1520-1532` — the plan sweep runs
  `executeDriverOperationChoice` awaited, then on `outcome.canAdvanceEdge`
  calls `resolvePlan(dir, id, config, 'runner', ...)` — the same engine verb
  the interactive driver uses.
- `src/runner/dispatch/operation-choice.mjs:1578` (`executeDriverOperationChoice`)
  builds the Assignment, awaits `executeAssignment`, and interprets the fresh
  RunResult inline — so dispatch, run, and verdict consumption complete in ONE
  runOnce pass.
- `src/runner/dispatch/assignment-runner.mjs:722-808` — read-only
  classification: claim `done` + substantive worker report -> `done/reported`;
  `agent-result.json` is the worker's structured claim (never listed as a
  control-plane artifact), `evidence.json`/`result.json` are runner-written.
- `src/intake/plan.mjs:678-692` — resolvePlan's runner branch (no caller
  verdict) advances only via plan.md's own tiny/small mode pass-through
  (`moveStage` planning -> executing); otherwise a conservative `noop`.
- `src/runner/loop.mjs:1004-1113` — after the edge, the drain run's own
  claim/worktree/worker/verify/settle path (all engine verbs) carries the item
  to `awaiting-approval`.

## Tests added (test/runner/loop.test.mjs, fixtures reuse :2736 + :83 patterns)

Shared fixture `setupValidatePlanFixture`: temp repo + validate-plan task-spec
stub + real `src/index.mjs` citation target + committed `docsRef/plan.md` +
seeded planning/todo item; `writeValidatePlanHappyExecutor` answers assignment
prompts with a READY claim + substantive report and (for the edge test) the
primary worker prompt with a committed output.txt.

1. `Cell 6.1 happy path: runOnce dispatches planning.validate-plan to a fake
   executor and stores a done/reported RunResult` — runs/01 `result.json` is
   `done`/`reported`; without a tiny/small mode line resolvePlan conservatively
   no-ops and the item stays planning/todo (the Assignment never moved Work).
2. `...driver consumes READY+reported and feeds the existing planning edge
   through engine verbs only` — with `Mode: tiny` in plan.md: log shows
   `after READY validation (pass-through)`, Work lands executing +
   awaiting-approval, and log ordering proves the stage move happened via
   resolvePlan AFTER the assignment settled.
3. `...run evidence is complete and the verdict artifact is a worker artifact,
   never a control-plane file` — `assignment.json` at the assignment root;
   runs/01 carries run.json, agent-result.json, agent-report.md, result.json,
   evidence.json; evidence lists exactly the worker artifacts
   (agent-report/agent-result) and no control-plane file.

Note: the brief listed `assignment.json` inside runs/01; the actual Step 03
layout (assignment-runner.mjs:516-528, immutable-input contract) stores it at
the assignment root. The test asserts the real layout.

Note: the brief allowed "a conservative stop if the edge is not reachable
in-test" — the edge IS reachable via plan.md's tiny/small mode declaration
(plan.mjs:678-692), so test 2 exercises the real pass-through; test 1's
Work-untouched assertions cover the conservative runner-noop stop.

## Commands run (one line each)

- `node --test --test-name-pattern "Cell 6.1 happy path" test/runner/loop.test.mjs` —
  3/3 pass on FIRST run, before any production change (test-only cell).
- `node --test test/runner/loop.test.mjs` — 87/87 (84 + 3 new), none weakened.
- `node --test test/runner/operation-choice.test.mjs` — 98/98.
- `node --test test/runner/assignment-dispatch.test.mjs` — 12/12.
- `node --test test/runner/assignment-runresult.test.mjs` — 22/22.
- `node --test test/e2e/runner-loop.test.mjs` — 15/15.
- `node --test test/cli/fgos-stage.test.mjs` — 19/19.

## Files touched

- `test/runner/loop.test.mjs` — 3 happy-path tests + 2 fixture helpers.
- Production code: NONE (no glue change needed; loop.mjs:1520 already wired).

## Status

done

## Gaps

- Only single-pass consumption is asserted (dispatch -> run -> interpret in one
  runOnce). The cross-pass variant (a SECOND runOnce re-reading the persisted
  RunResult via `findLatestAssignmentRunResult` -> canAdvanceEdge) also
  composes by the same rules but is not asserted here — cheap to add in 6.2.
- Negative cases (no-evidence stop, failed stop, insufficient evidence, NOT
  READY -> shape-plan) are cell 6.2 scope by design.
- Test 2's tail (executing -> awaiting-approval) rides the existing drain-run
  primary path already covered by the e2e suite; it is composition evidence,
  not new primary-path coverage.

## Close-out (coordinator, 2026-08-30)

Final status: **done**. Red-team verdict: 3 exploitable / 2 refuted — all three
exploits live in PRE-EXISTING production paths (classification, staleness
guards, read-back), outside this test-only cell's scope. Cell claims hold:
happy path composes via real engine verbs, Work untouched by the Assignment.

Red-team findings deferred to Cell 6.2 as MANDATORY scope:

1. isSubstantiveEvidenceRef (assignment-runner.mjs:82-115) counts any
   prefix-matching string (evidence:/diff:/verify:/...) as a worker report —
   no existence check. Forger claim without agent-report.md classifies
   done/reported.
2. Cross-pass staleness guards (operation-choice.mjs:113-127, :443-458)
   compare mtimes the worker controls (cwd = repoRoot -> utimesSync plan.md) —
   stale V1 verdict consumed after plan.md edited to V2; no re-dispatch.
3. No read-back re-validation: forged/edited result.json consumed cross-pass
   (schema + report existence checked only at classification time).

Fix guidance (red-team minimal): content hash of plan.md recorded in
result.json for staleness; existence-check companion report before
reported; re-validate claim schema + report existence at consumption time.
Lifecycle bounding noted: false advance requires plan.md tiny/small
pass-through; non-tiny plans noop.
