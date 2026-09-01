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
| 00 | R1-R11 | done |
| 01 | R1-R8 | R1-R4 done; R5-R8 outstanding (P01.2) |
| 02 | R1-R8 | missing (depends on 01) |
| 03 | R1-R8 | missing (depends on 02) |
| 04 | R1-R9 | missing (depends on 03) |
| 05 | R1-R8 | missing (depends on 04) |
| 06 | R1-R8 | missing (depends on 05) |
| 07 | R1-R8 | missing (depends on 06) |

## Active Cell

none

## Next Action

prepare (P01.2)

## Cell Log

| Cell | Requirements | Status | Commit |
|---|---|---|---|
| P00.1 | Phase 00 R1, R2, R3, R4 | done | `33494fd6` |
| P00.2 | Phase 00 R5, R6, R7, R8 (+ R10 partial) | done | `7957f6f3` |
| P00.3 | Phase 00 R9, R10, R11 | done | `454ecb56` |
| P00.4 | provider-family derivation fix (closes Phase 00) | done | `45137208` |
| P01.1 | Phase 01 R1, R2, R3, R4 | done | pending |

## Phase 00 Status

**CLOSED.** R1-R11 across P00.1-P00.4. R11's glm-cli half remains a
permanent, honestly-documented partial (live-executor timeout, not a stop
gate — see P00.3.md Review). P00.4 fixed the provider-family derivation
disagreement (3 registered executors, then a 4th live one discovered by
its own Red-Team — `gitnexus`) with a loud advisory warning rather than a
risky full-parity fix; one residual, currently-latent gap remains
(bare-shape executor with a non-Claude command) and is intentionally
mitigated, not eliminated — documented in P00.4.md's Gaps section.

P00.2 went through 3 rounds: Doer -> Reviewer (1 HIGH + 1 MEDIUM + 2 LOW,
all fixed) -> Red-Team (1 new HIGH, RT1, fixed) -> Red-Team re-check
(confirmed). Both HIGH findings were genuine governance-semantics gaps in
the self-hosted dispatch policy resolver — caught before merge.

P00.3 went through 2 fix rounds: Doer -> Reviewer (1 HIGH pre-existing/
deferred to P00.4 + 1 MEDIUM, MEDIUM fixed) -> Red-Team (2 HIGH + 2 MEDIUM:
an off-by-one and a false-positive in the new duplicate-flag detector, both
fixed; this index.md's missing P00.4 entry, fixed directly by the
Coordinator; a third `deriveProviderFamily`-family instance in
`transport.mjs`, folded into P00.4) -> Red-Team re-check (confirmed).

## Phase 01 Status (in progress)

**P01.1 CLOSED** (Phase 01 R1-R4): created `src/runner/coordination/{schema,store,replay}.mjs`
(manifest/event store matching `coordination-session.md` exactly, reusing
`state/events.mjs`'s cross-process lock and `assignment.mjs`'s
`buildAssignment`/`claimAssignmentId`); direct `mission-lite.mjs` cutover
(deleted, minimal-surface edits to `assignment.mjs`/`assignment-runner.mjs`/
`cli.mjs`/`dispatch.mjs`, `isMissionLite` renamed `isReadOnlyMode`). Went
through 2 full Doer->Reviewer->Red-Team->Fixer->Red-Team-recheck rounds,
both on genuine crash-safety bugs in the idempotent-Assignment-claim
mechanism: round 1 fixed a duplicate-Assignment-on-crash-retry bug; round 2
(triggered by Red-Team finding the round-1 fix itself incomplete) fixed a
"phantom never-registered Assignment" self-healing gap and a taskKey-hash
collision bug — the Fixer also self-caught and fixed a third latent bug
(duplicate event on an inner crash window) while verifying its own round-2
fix. One trivial LOW (unguarded JSON.parse on a torn claim-file write)
deferred as a named one-line follow-up, not blocking.

Next: P01.2 (Phase 01 R5-R8 — session engine, dynamic consult, resume/
idempotency, live agent-led proof through real `cli-spawn` workers).

## Cell P00.4 (done, closes Phase 00)

**Scope**: fix the `deriveProviderFamily` call-site disagreement —
live-confirmed during P00.3's codex-cli proof
(`assignment-policy.mjs:201` calls it with one argument, defaulting
`resolvedCommand` to `'claude'`; `resolve.mjs:429` calls it with the
executor's real command — the two disagree for any registered executor with
no `providerModel`/`provider` field whose real command isn't a Claude CLI
command). Confirmed live to affect exactly 3 of 12 currently registered
executors: `codex-cli`, `codex-herdr`, `herdr`. Creates a real
governance-bypass risk: a `disallowedProviders` config naming one of these
by its true command-derived family would silently fail to block it. P00.3's
Red-Team found a third instance of the same root-cause family:
`transport.mjs:163`'s stderr banner reads the dead `executor.provider`
config field (0/12 executors set it) instead of the already-correct
`governance.providerFamily` — fold into this cell's scope too. Smallest fix
direction (per P00.3's Reviewer): pass the executor's real resolved command
as `deriveProviderFamily`'s second argument at `assignment-policy.mjs:201`,
mirroring the already-correct sibling call. **Do not close Phase 00 (do not
mark plan.md's Phase 00 row done) until this cell closes or is explicitly
re-scoped by the maintainer.** Source: `P00.3.md`'s Review section (HIGH
finding) and Red-Team section (MEDIUM finding #4).
