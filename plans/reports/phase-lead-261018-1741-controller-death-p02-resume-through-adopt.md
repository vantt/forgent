# Phase lead report: controller-death p02, resume through adopt

Branch `controller-death/p02-resume` (commits eb4778c6c, a742c101a). Status: DONE_WITH_CONCERNS.

## What changed
- `src/runner/execution/run.mjs`
  - `--resume` carries a stable admission identity (`dispatchRetryId`, recorded in unit.json before each dispatch) into `executeAssignment`. The existing `admitted.resumed` branch then returns the settled `result.json` of the attempt the dead controller left; no `runs/NN` is admitted, the agent does not run again, and the unit goes on (commit writes, reviewer, next round, unit-summary). No second adopt mechanism.
  - Attempts whose outcome the controller never recorded (supervisor-era, envelope present) are no longer treated as settled seats by `history()`: before, a settled attempt whose controller died was skipped and its writes were never committed.
  - Preflight `assertAttemptsResumable` (before any state change): adopt probe, `attempt-still-running` (names state, run dir, `fgos dispatch inspect`), `attempt-legacy-run`.
  - Attempt closed `abandoned-*` or `cancelled`: new attempt, `supersedesRunId` set to it.
  - `runUnit` installs `installCancelOnSignal` once per process (refcounted), uninstalls with the last unit. `cancelWaitMs` from the existing `readCancelWaitMs`.
- `src/runner/execution/unit-control.mjs` (new): unit-scoped run-control ledger (`<unitDir>/unit-control`), single controller per unit, dead holder taken over. Second `--resume` (or resume under the live run) gets `resume-in-progress`. Replaces the exclusive-mkdir idea: the admission CAS already numbers attempts; the seat covers the settled-reuse case that CAS does not. `unitControllerHeld(unitDir)` is the read-only liveness question for inspect (P03).
- Tests: `test/run-supervisor/resume-adopts.test.mjs` (7 cases: settled reuse + commit + agent once; still running refused, no side effect; abandoned-not-started superseded; commit failed after settle recommits without spawn; two resumes; no second supervisor for a bound attempt; Ctrl-C then resume supersedes). `direct-crash-matrix` case 2 now SIGINT (cancel, receipt cancelled, exit 130, resume line), 2b SIGTERM 143, case 1 keeps SIGKILL.
- `docs/architecture-manifest.json`: row for `unit-control.mjs`.

## Decisions
- No `controller.json`: liveness is the unit-control ledger (`inspectRunControl`), as the recut allowed.
- `legacy-run` is refused by name (contract + landed behavior), not rerun with a warning.
- A `cancelled` receipt is superseded on resume (Ctrl-C prints "chờ resume"; reusing the cancelled result would make resume a no-op). Contract unit-state.v1.json `resumeRule` lists only abandoned-*; P06 docs should add `cancelled`.
- D6 exclusive `mkdir`: dropped (see unit-control).
- Impact: `runUnit` LOW (callers: advanceWorkflowRun and its workflow callers).

## Review (Sonnet code-reviewer)
Four findings, all fixed: cancelled not superseded; crash between admission commit and run-dir rename (continuing now decided from the ledger); unit.json read before taking the seat; unchecked fresh-run seat and unguarded release. Test 3 kills in a few-ms window (8 tries), test 5 accepts "both succeed" when the loser arrives after the winner finished.

## Tests (FGOS_HOST_BIN = release build of this branch in a private target, env -u CLAUDE_CODE_SESSION_ID)
- 896 tests over `test/runner/execution/*`, loop/driver/operation-choice/credential/call-site/fanout, `test/cli/run-verb`, `test/docs/run-doors-doctrine`, `test/architecture`, all `test/run-supervisor/*`: 895 pass; the one failure (`loop.test.mjs` "real concurrency ... overlap in wall time") is timing under machine load (load 6) and passes 104/104 twice alone.
- `test/run-supervisor/resume-adopts.test.mjs` 7/7, `direct-crash-matrix` 13/13 (before adding test 7: 814/814 on the broad set).

## Open / for later phases
- Stale `failureCause`/`retryStopped`/`commit` remain on an attempt re-dispatched after `outcome` is cleared (reviewer note, minor).
- Automatic resume stays deferred; seam: unit-control ledger (dead-controller evidence) plus the admission CAS (single taker). P06 names it in the spec.
- P03 inspect: use `unitControllerHeld` for `unitState`.
- P05: resume-after-adopt crash cases can reuse `resume-adopts.test.mjs` helpers (`startResume`, `orphanBound`).
