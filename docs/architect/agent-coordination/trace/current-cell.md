# Current Cell - 6.2 planning.validate-plan Negative Cases + Red-Team Hardening

Status: open
Date: 2026-08-30
Cell trace file: `docs/architect/agent-coordination/trace/step-06-cell-2-validate-plan-negative.md`

## Goal

Prove validate-plan FAILS SAFE: every non-happy outcome stops or re-dispatches,
never advances Work on false evidence. Also close the 3 proven Cell 6.1
red-team exploits (mandatory scope, tests first):

1. Self-attested evidenceRefs must NOT classify `reported` without an on-disk
   companion report (assignment-runner.mjs isSubstantiveEvidenceRef :82-115).
2. Cross-pass staleness: plan.md edited after the verdict run must NOT be
   consumed. Replace/augment worker-controllable mtime guards
   (operation-choice.mjs :113-127, :443-458) with a plan.md content hash
   recorded runner-side at dispatch (in run.json or result.json), rechecked at
   consumption. utimesSync must not defeat it.
3. Read-back re-validation: a result.json/agent-result.json tampered after
   settle (schema-broken claim, or evidence refs pointing at now-missing
   files) must NOT be consumed cross-pass (findLatestAssignmentRunResult path).

## Non-Goals

- No workflow YAML change, no FSM/store change, no new modules.
- No executing-stage ops (6.4+), no live smoke (6.3), no Job/scheduler/Step 7.
- No commit (user decides).
- Cell 6.0 deferred-hardening list stays deferred.

## Must-Read Files

- this file
- `docs/architect/agent-coordination/step-06-work-attached-team-adoption.md`
  section 6 (negative test list for planning.validate-plan)
- `src/runner/dispatch/assignment-runner.mjs` :82-115, :365-447, :700-808
- `src/runner/dispatch/operation-choice.mjs` :100-130, :430-470,
  findLatestAssignmentRunResult + consumption site
- `test/runner/loop.test.mjs` :2840-2990 (cell 6.1 fixture helpers)

## May-Inspect Files

- `src/runner/loop.mjs` :1460-1560 (plan sweep + validate-plan hook)
- `domains/coding/task-specs/validate-plan.md` (NOT READY semantics)
- `src/intake/plan.mjs` :655-700

## Do-Not-Touch Files

- workflow YAML, FSM modules, `src/state/store.mjs`
- docs other than the cell trace; `.fgos/` outside test-created temp dirs
- cell-6.0 resolver gates (refs/heads qualification, mtime correlation)

## Tests To Add First (all red before implementation)

1. Claim `done` whose evidenceRefs are strings only (no agent-report.md on
   disk) -> RunResult NOT `reported`; driver must not consume; Work untouched.
2. Cross-pass staleness: verdict run on plan.md V1; edit plan.md to V2 after
   settle (AND a second variant using utimesSync to keep mtime identical);
   second runOnce -> stale verdict NOT consumed; validate-plan re-dispatched
   (runs/02) or conservative stop; Work never advances on the V1 verdict.
3. Read-back tamper: after a legit done/reported run, break result.json claim
   schema or delete agent-report.md; second runOnce -> NOT consumed; treated
   as no-evidence/failed stop; Work untouched.
4. No-evidence stop: executor writes nothing -> RunResult no-evidence ->
   runOnce stops cleanly, Work untouched, no crash.
5. Failed stop: malformed agent-result.json -> failed/failed -> stop,
   Work untouched.
6. NOT READY verdict routes per step-06 section 6 spec (shape-plan/stop, not
   advance); assert the exact documented routing.

## Acceptance Criteria

- Tests 1-3 (red-team) red before fix, green after; tests 4-6 document actual
  behavior — if any is already-green, mark it as such in the trace honestly.
- All 3 exploit fixes are production changes kept minimal (no new modules,
  no schema migration; run.json/result.json may gain one field).
- Regression green: loop (87+), operation-choice (98+new),
  assignment-runresult (22+new ok), assignment-dispatch (12),
  e2e runner-loop (15), fgos-stage (19). No weakened assertions.
- Cell 6.1 happy-path tests 3/3 still green (staleness hash must not break
  the legit same-content consume).

## Bug Taxonomy

- evidence false-success; no-evidence/failed advances Work; lifecycle
  authority leak; missing negative test; trace/proof gap.

## Trace Update Requirements

- Doer updates `step-06-cell-2-validate-plan-negative.md`: exploit->test->fix
  mapping, commands one-line each, status, gaps. Under 150 lines.
