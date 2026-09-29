# Phase 5 (Unit P5) — dispatch.claim decision report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/P5`,
worktree `.claude/worktrees/dispatch-engine-liveness-p5-dispatch-claim-decision`,
base `main@4bfc0962b` (post-Phase 6).

Audit finding S5 (MEDIUM): `dispatch.claim` is a "two half-mechanisms dead
end" — the real production file is always 0 bytes with no holder identity,
so `dispatch reconcile plan --action clear-assignment-claim` could never
actually resolve a refusal against it.

## Decision: delete `dispatch.claim` and `clear-assignment-claim`

Read the real code fresh rather than assuming the audit's tentative
framing. `admitRunAttempt`'s M1 in-flight check (`assignment-runner.mjs`) —
now that Phase 2 added `isCliSpawnRunStillWorking` — genuinely subsumes
`dispatch.claim`'s original in-flight-race job for both same-process (no
`await` between admission-commit and control-acquire on a fresh dispatch)
and cross-process (real `fs.linkSync` CAS, `run-lock.mjs`) callers.
Confirmed `clear-assignment-claim`'s target file is provably always
0 bytes in production (no writer ever populates `{pid, startTime}`), so
that reconcile door could never have resolved a refusal anyway — matches
audit S5 exactly, independent of the redundancy argument.

Two further real gaps surfaced only once the full test suite (and a
2-round `kongming` consult) forced them into the open, both now closed —
see "Design forks" below.

## Files changed

- `src/runner/coordination/session-engine.mjs` — deleted both claim
  writers (`createAndExecuteSessionTask`'s `dispatch.claim`,
  `retrySessionTask`'s `retry-${attempt}.claim`). `createAndExecuteSessionTask`
  now opts into `admitRunAttempt`'s new `refuseIfSettled: true` on its fresh
  (non-retry) dispatch path and self-heals by linking a sibling's
  already-settled result on that specific refusal; both functions translate
  `admitRunAttempt`'s `RunnerConfigError('admission-run-in-flight')` back
  into the exact `CoordinationError` shape/message the retired claim files
  used to throw, so every existing caller (dag-scheduler.mjs's
  `outcomeFor`, any code matching `instanceof CoordinationError`) keeps
  working unchanged.
- `src/runner/dispatch/assignment-runner.mjs` — `admitRunAttempt` gains two
  additive, opt-in-only changes (zero effect on any caller that doesn't
  pass them): (1) `refuseIfSettled` option — refuses (`run-already-settled`)
  a fresh admission over an already-SETTLED current attempt, closing a
  distinct race `admitRunAttempt`'s pre-existing M1 check structurally
  cannot close alone (a settled prior attempt is exactly what a legitimate
  retry is supposed to admit fresh over — see Design fork 1 below); (2) the
  committed admission record now stamps `admittedBy` (this process's own
  `buildRunControlHolder` identity) into the SAME atomic CAS commit, and
  M1's in-flight check additionally treats "the admitting process is still
  alive, and no real control record has been acquired yet" as a live
  signal (see Design fork 2 below).
- `src/runner/dispatch/reconciliation-planner.mjs` — deleted
  `clear-assignment-claim`/`planClearAssignmentClaim`/
  `applyClearAssignmentClaim`/`assignmentClaimFile`, and the
  `findCoordinationSessionOwningAssignment`/`isWithinDir` imports that
  existed only to serve them. `planReconciliation` now treats
  `clear-assignment-claim` like any other unrecognized action name
  (`refused`, `"unsupported reconciliation action"`), never a half-working
  door.
- Tests updated: `test/runner/coordination-session-engine.test.mjs`,
  `test/runner/coordination-recovery-and-quorum.test.mjs` (added a new real
  SIGKILL-based recovery test — spawns a real child process running
  `retrySessionTask`, kills it before `result.json` exists, confirms a
  second attempt is refused by `admitRunAttempt` while the detached worker
  survives, confirms recovery succeeds once the worker is confirmed dead,
  via the ordinary retry path, no special reconcile action), replaced the
  now-inapplicable `retry-${attempt}.claim` crash-fixture test with it),
  `test/runner/dispatch-reconciliation.test.mjs` (removed 8 tests for the
  deleted action, added 1 confirming the plain "unsupported action"
  refusal), `test/cli/dispatch-reconcile.test.mjs` (same, at the CLI
  layer).

Left `src/verbs/dispatch/recover.mjs`'s `clearDispatchClaimForRecoveredDriver`
untouched (out of this phase's file-ownership scope, and its behavior stays
correct — it will just permanently no-op reporting `blocked: 'no assignment
claim exists'`, since no writer will ever create that file again). Flagging
as a residual cleanup item, not a defect: `src/cli/command-registry.mjs`'s
`action` field description and `src/verbs/dispatch/reconcile.mjs:21`'s own
refusal-message example list, plus `docs/how-to/operate-dispatch-runtime-
inspection-and-reconciliation.md` and `docs/specs/runner.md`, still name
`clear-assignment-claim` as a valid action — all outside this phase's
file-ownership scope (owned by other work or docs surfaces), all now
harmless (calling the action just gets a plain "unsupported" refusal), but
worth a follow-up doc/CLI-help pass.

## Design forks hit during implementation (both escalated to `kongming`, both resolved)

**Fork 1 — "late duplicate over an already-settled sibling."** Discovered
via the full suite: `test/runner/coordination-dag-concurrency.test.mjs`'s
cross-process "identical concurrent writers" test failed because
`admitRunAttempt`'s pre-existing M1 check only ever blocks an *unsettled*
sibling (correctly — a settled prior attempt is what a legitimate retry
must admit fresh over), so a genuinely slower cross-process sibling that
started long after the first had already settled+linked got admitted fresh
too, wastefully re-executed, and crashed uncaught on `linkResult`'s
`duplicate-ref` refusal. `dispatch.claim`'s own permanence ("never removed
on success") used to close this by accident. Fix: the new opt-in
`refuseIfSettled` admission option (used only by `createAndExecuteSessionTask`'s
fresh dispatch path, never by `retrySessionTask`).

**Fork 2 — "genesis race before either sibling has any liveness signal."**
Still failed after Fork 1's fix, with the SAME test: two real racing
processes reached admission for the identical Assignment before *either*
had acquired real run control (`acquireRunControl`, a separate, later step
inside `executeAssignment`), so neither's admission ever failed the M1
in-flight check (no settled result, no control record, no live detached
worker yet), and both were legitimately admitted as attempts 01 and 02.
`dispatch.claim` used to close this because it was created *before* the
session lock's early release, transitively ordering all first-time
dispatchers through that lock. Considered and rejected two alternatives
(both vetted with `kongming` and found wanting): (a) a new short-lived
marker file — reintroduces a crash-leak needing its own clearing door; (b)
a session-lock pre-check — a read-then-act race, not actually atomic.
Landed on: stamp the admitting process's own `buildRunControlHolder`
identity (`admittedBy`) into the SAME atomic CAS record `admitRunAttempt`
already publishes (zero extra writes, zero extra locks), and extend M1 to
treat "the admitter is still alive, and no real control record exists yet"
as an in-flight signal — consulted *only* when `!priorControl.controlEpoch`
(no real control ledger entry exists at all), so it can never override or
go stale against the real control ledger once one exists. Verified via the
same cross-process test, 3 consecutive clean runs.

Reverted along the way: an earlier attempt to close Fork 1/2 by having
`dag-scheduler.mjs`'s `outcomeFor` also recognize `RunnerConfigError`
directly (a broader, less precise change than translating the specific
`admission-run-in-flight` refusal back to `CoordinationError` at the
session-engine boundary) — dropped once the boundary translation made it
unnecessary, per `kongming`'s explicit KISS/layering-doctrine advice.

## Tests

- Targeted: `coordination-session-engine.test.mjs` (67 incl. the reworked
  duplicate-dispatch race), `coordination-recovery-and-quorum.test.mjs`
  (incl. the new real SIGKILL recovery test and the reworked concurrent
  retry race), `dispatch-reconciliation.test.mjs`,
  `dispatch-reconciliation-import-graph.test.mjs`, `cli/dispatch-reconcile
  .test.mjs`, `dispatch-operability-production-door.test.mjs`,
  `verbs/dispatch-recovery.test.mjs`, `verbs/coordination-run-driver-steps
  .test.mjs` — 241/241 pass.
- `coordination-dag-concurrency.test.mjs` (the test that surfaced both
  design forks) — 9/9 pass, reran 3x clean (not flaky).
- Explicitly re-verified per Lead's request: `test/runner/assignment-
  dispatch.test.mjs`'s Phase 2 "S1 live probe" (SIGKILL a runner, confirm a
  fresh admission is refused while its detached worker survives) and
  Phase 6's S6/S8 atomic-write/settlement-ordering tests — 81/81 pass,
  confirming every existing `admitRunAttempt` caller that does not pass the
  two new opt-in options is provably unaffected.
- Full suite (`env -u CLAUDE_CODE_SESSION_ID npm test`): 7995 tests, 7922
  pass, 0 fail, 8 skipped, 65 todo.

## Next

Lead independently re-verifies the new `admitRunAttempt` option logic
against the real settlement/CAS code before merging, per this track's
established discipline. Residual doc/CLI-help staleness noted above is a
follow-up, not a blocker.
