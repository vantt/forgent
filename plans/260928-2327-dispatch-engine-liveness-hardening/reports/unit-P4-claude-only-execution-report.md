# Phase 4 (Unit P4) — Claude-only execution report

Worktree `.claude/worktrees/dispatch-engine-liveness-p4-provider-capacity-stale-reclaim`,
branch `unit/P4`, base `main@dc18f6bc0`.

Fixes S3 (audit MEDIUM): `provider-capacity.mjs`'s `withFileLock` stale-reclaim
race lost a lease 17/25 trials under concurrent contention against a
pre-seeded stale lock (dead pid).

## Root cause (confirmed against real source, not assumed from the audit prose)

`withFileLock` (`provider-capacity.mjs:262-301` pre-fix) judged the lock
holder dead (`!isPidAlive(holderPid)`) and unlinked it unconditionally, with
no re-check of the lock file's content between judgment and unlink. Two
contenders working from the SAME stale read could both decide to reclaim;
whichever unlinked second deleted the OTHER's freshly-created live lock,
letting both enter the critical section (`readState` → mutate → `writeState`)
concurrently. Each writer's `writeState` fully overwrites `state.json` from
its own in-memory snapshot, so whichever writer finishes last silently
erases the other's lease grant — the "selected N, leasesPersisted < N"
shape the audit measured.

## Fix

Chose `main-checkout-lock.mjs`'s **re-read-before-unlink** pattern
(`tryAcquireOnce`, `:308-319`) over `run-lock.mjs`'s link-publish+generation
ledger. Reasoning: the generation-ledger pattern is architecturally heavier
(an append-only, never-unlinked history designed for tracking historical
holders/control-epoch fencing across multiple consumers) than what a single
mutex-style critical section around one `state.json` needs. The audit itself
names the re-read pattern "adequate," and `main-checkout-lock.mjs`'s own
30-trial × 12-contender probe against the SAME pattern measured 0 multi-holder
outcomes — real evidence the narrowed window is practically closed, not just
theoretically smaller. Per KISS, picked the smaller diff that already has a
proven track record in this codebase over porting a heavier mechanism built
for a different problem.

`withFileLock` (`provider-capacity.mjs:295-373`): on EEXIST with a
judged-dead holder, re-reads the lock file immediately before `unlinkSync`
and only unlinks if content is byte-identical to what was judged dead. Changed
content means a competitor already reclaimed and re-acquired — leave it
alone and retry `openSync` instead of deleting a live lock out from under
its fresh holder.

Also closed the audit's own C2 gap named specifically for this lock
("pid-only, no start time"): the lock record now carries `startTime`
(Phase 1's `getProcessStartTime`), and dead-holder judgment routes through
Phase 1's consolidated `resolveHolderLiveness` judge instead of a bare
`isPidAlive` call — so a pid reused by an unrelated process after the real
holder died is correctly judged dead. Same treatment applied to lease
records (`reclaimDeadLeases`): lease writes now carry `processStartTime`,
and `pidDead` routes through the same judge. A lease written before this
fix (no `processStartTime`) reproduces the exact pre-fix behavior via the
judge's own documented fallback (alive pid, no recorded start time → `held`).

## Tests added (`test/runner/provider-capacity.test.mjs`)

1. **Pid-reuse unit test**: a lease recorded against a currently-live pid
   (this test process) but a fabricated, non-matching `processStartTime`
   is now correctly reclaimed rather than mistaken for the same holder
   (gated on `HAS_PROC_START_TIME`, matching `process-identity.test.mjs`'s
   own established Linux-only gating convention — asserts the pre-fix
   fail-closed-to-`held` behavior on hosts without `/proc`).
2. **Real multi-process race reproduction** (the audit's own probe shape):
   10 trials × 10 real forked child processes each calling the real
   `acquireProviderAccountLease` against one pre-seeded stale lock (a
   genuinely dead pid). Asserts every contender reported `selected` has a
   persisted lease in the final `state.json` — 0 lost, matching the audit's
   own control-run target.

   Two adjustments were needed to make this reproduce reliably rather than
   passing vacuously, both discovered and confirmed empirically before
   trusting the test:
   - **Startup-jitter synchronization**: an unsynchronized "fork N children,
     race them immediately" version measured only ~13% reproduction against
     the pre-fix code (fork/import startup jitter spreads contenders too far
     apart in wall-clock time to reliably collide on the same stale lock).
     Added an explicit `ready` → parent sends `go` → all children call
     `acquireProviderAccountLease` in the same tick barrier. Measured 67%
     (10/15) against the pre-fix code with this synchronization — a near
     exact match to the audit's own 68% (17/25).
   - **Keep contenders alive past acquisition**: a short-lived child that
     exits immediately after acquiring makes its own pid legitimately dead
     by the time a later contender's `reclaimDeadLeases` (Phase 2, unrelated
     to this fix) checks it — producing a false failure unrelated to the
     stale-lock TOCTOU race. Children now stay alive (an interval keep-alive)
     until the parent explicitly kills them after scoring the trial.

## Verification against the real pre-fix code (not assumed)

`git stash`'d the fix, ran the finished race test's own probe methodology
(informal driver, 15 trials): **10/15 (67%) failed** — matches the audit's
17/25 (68%) closely. `git stash pop` restored the fix, reran: **0/15
failed**. This confirms the test is a real regression check, not a
vacuously-passing one, following this track's own established discipline
(Phase 2's SIGKILL-revert-rerun proof, Phase 1's split-design correction).

## Test results

- Targeted file (`test/runner/provider-capacity.test.mjs`): 18/18 pass
  (was 16 pre-existing + 2 new). Race test itself: ~2.7s.
- Cross-check (`process-identity.test.mjs`,
  `dispatch-reconciliation-import-graph.test.mjs`,
  `run-lock-identity.test.mjs`): 42/42 pass — confirms the new
  `provider-capacity.mjs` → `process-identity.mjs` import doesn't violate
  any dispatch-core import-graph boundary.
- Full suite (`env -u CLAUDE_CODE_SESSION_ID npm test`): **8001 tests, 7928
  pass, 0 fail**, 8 skipped, 65 todo. Clean run, no regressions.

## Files modified

- `src/runner/dispatch/provider-capacity.mjs` — `withFileLock` re-read-before-
  unlink fix + `startTime`/`resolveHolderLiveness` migration; `reclaimDeadLeases`
  and lease-record writes migrated onto the same judge/field.
- `test/runner/provider-capacity.test.mjs` — 2 new tests (pid-reuse unit test,
  real multi-process stale-lock race reproduction).

No other files touched (`assignment-runner.mjs`, `session-engine.mjs`,
`reconciliation-planner.mjs`, `settlement.mjs`, `coordination/store.mjs`,
`cli.mjs`, `main-checkout-lock.mjs` all left exactly as the constraint
required).

## Unresolved questions

None. No genuinely uncertain design fork encountered — the re-read-before-
unlink vs. link-publish+generation choice was decidable directly from real
source (architectural fit + `main-checkout-lock.mjs`'s own probe evidence),
not a guess.
