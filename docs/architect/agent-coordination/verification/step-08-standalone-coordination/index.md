# Track: step-08-standalone-coordination

Plan: `plans/260901-1542-step08-standalone-coordination/plan.md`
Branch: `step-08-standalone-coordination`
Base ref: `75505c75812703b355f1291d618244c75a5d7b09`
Test command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`

## Baseline

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'` run at
BASE_REF, exit code 1. Full log:
`proofs/baseline-full-test-run.log`. 11 known baseline failures:

| # | Test | File | Cause class |
|---|---|---|---|
| 1 | ask/answer round-trip on a genuinely legacy durable-doing item (no claim) | `test/cli/fgos-intake-4.test.mjs:318` | assertion, unrelated (fgos ask/answer) |
| 2 | e2e pr-gate (a) runner item full loop | `test/e2e/pr-gate.test.mjs:226` | assertion, unrelated (PR-gate e2e) |
| 3 | e2e self-improve loop full contract (D1-D17) | `test/e2e/self-improve-loop.test.mjs:174` | assertion, unrelated (self-improve loop) |
| 4 | resolvePlan skips the risk-heavy gate (tsk-wve D1) | `test/intake/plan.test.mjs:953` | assertion, unrelated (intake plan) |
| 5 | resolvePlan skips requiring a verdict, mode "tiny" | `test/intake/plan.test.mjs:1198` | assertion, unrelated (intake plan) |
| 6 | resolvePlan skips for mode "small" | `test/intake/plan.test.mjs:1215` | assertion, unrelated (intake plan) |
| 7 | resolvePlan caller-supplied decompose verdict (D1) | `test/intake/plan.test.mjs:1588` | assertion, unrelated (intake plan) |
| 8 | codex-cli executor (LIVE) self-identification | `test/runner/codex-cli-glm-cli-live-executors.test.mjs:50` | live-executor timeout (120s) — **dispatch subject, watch in P00.2/P00.3** |
| 9 | herdr-spawn adapter interactiveMode premature idle (tsk-2rr) | `test/runner/herdr-spawn-adapter.test.mjs:222` | live-executor timeout (5s) — **dispatch subject, watch in P00.2/P00.3** |
| 10 | herdr-spawn adapter (LIVE) real agy-herdr binaries | `test/runner/herdr-spawn-adapter.test.mjs:562` | live-executor timeout (60s) — **dispatch subject, watch in P00.2/P00.3** |
| 11 | withLockRetry: numeric holderPid self qualifier (tsk-6uc) | `test/runner/lock-wait.test.mjs:161` | assertion, unrelated (runner lock-wait) |

This list may only shrink; any new failure beyond it blocks cell close.
Failures 8-10 touch `src/runner/dispatch/transport.mjs` (live executor
timeouts against real `codex-cli`/`agy-herdr` binaries/network — environment-
dependent, not logic failures) — P00.2/P00.3 touch dispatch files, so these
three get an explicit before/after comparison at those cells' close instead
of a blanket "unrelated" pass.

## Phase / Requirement Matrix

| Phase | Requirements | Status |
|---|---|---|
| 00 | R1-R11 | missing |
| 01 | R1-R8 | missing (depends on 00) |
| 02 | R1-R8 | missing (depends on 01) |
| 03 | R1-R8 | missing (depends on 02) |
| 04 | R1-R9 | missing (depends on 03) |
| 05 | R1-R8 | missing (depends on 04) |
| 06 | R1-R8 | missing (depends on 05) |
| 07 | R1-R8 | missing (depends on 06) |

No implementation exists yet for any phase; this is the initial audit for a
freshly opened track. No feature code exists to classify as done/partial/
drifted.

## Active Cell

none

## Next Action

prepare (P00.3)

## Cell Log

| Cell | Requirements | Status | Commit |
|---|---|---|---|
| P00.1 | Phase 00 R1, R2, R3, R4 | done | `33494fd6` |
| P00.2 | Phase 00 R5, R6, R7, R8 (+ R10 partial) | done | pending |

## Phase 00 Status

R1-R8 done (P00.1, P00.2). R10 partially done (fallbackExecutors marked
reserved-not-executed; `feature.yaml`'s stale `pi` entry deferred to a
follow-up — needs 3 test-fixture updates outside P00.2's core scope). R9,
remainder of R10 outstanding (P00.3).

P00.2 went through 3 rounds: Doer -> Reviewer (1 HIGH + 1 MEDIUM + 2 LOW,
all fixed) -> Red-Team (1 new HIGH, RT1, fixed) -> Red-Team re-check
(confirmed). Both HIGH findings were genuine governance-semantics gaps in
the self-hosted dispatch policy resolver — caught before merge.
