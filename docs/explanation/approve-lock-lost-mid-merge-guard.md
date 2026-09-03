---
authoritative_for: fgos approve concurrent merge collision, lock-lost-mid-merge guard, heartbeatStorage AsyncLocalStorage, why abortMergeIfPossible is skipped on lock loss
---

# `fgos approve` now detects a lost lock mid-merge instead of failing with a raw git error

`tsk-2qp` closed a real concurrency bug: `fgos approve`'s main-checkout
lock did not guard its own `git merge`/`commit` sequence, so two
concurrent `approve` calls on different items could collide and fail
with a generic git error instead of a clear busy signal.

## Confirmed live

Approving `tsk-zl5` (2026-08-16 ~00:51): another session was
concurrently mid-approve on a different item (`tsk-bc7`) on the same
shared main checkout, its own commit step having left `MERGE_HEAD` set
and `tsk-bc7`'s files staged but not yet committed. The `tsk-zl5` approve
call was not blocked by any lock check up front — it ran the full
verify/merge sequence and only then failed at the raw `git commit` step,
exit code 9: `"verify passed... but 'git commit' failed"` — no mention of
the checkout being busy, no reference to the other item, no recognizable
category the caller could retry on (unlike `take`/`pick`'s already-clear
`lock-held`/`lock-ambiguous`, exit 7). `tsk-zl5` itself stayed safely at
`awaiting-approval` throughout — no state corruption — and retrying after
~90 seconds succeeded cleanly. Confirmed as a confusing failure mode, not
a data-loss one.

## What shipped: heartbeat-tracked lock loss, not a wider lock or a MERGE_HEAD precheck

Neither of the two directions the item's own description proposed
(widening the lock's held span, or detecting a pre-existing `MERGE_HEAD`
before starting) — instead, the existing lock-renewal heartbeat
(`withMergeTargetSlot`/`mergeRunnerItem`, `src/runner/merge.mjs`) now
tracks its own renewal outcome per call, threaded through the async
call stack via `AsyncLocalStorage` (`heartbeatStorage`). Immediately
before the actual `git commit`, the code checks whether the heartbeat's
last renewal returned anything other than `renewed` (not-owner,
ambiguous, or no-lock — another session reclaimed it) and, if so,
**returns `{outcome: 'lock-lost-mid-merge', branch}` without calling
`git commit` at all.**

## Why the merge is never aborted on lock loss — a deliberate safety choice

The fix explicitly does **not** call `abortMergeIfPossible` in this path.
If the lock was lost mid-merge, the working tree state may legitimately
belong to whichever session now holds the lock — tearing it up to
"clean up" would risk destroying that other session's real, in-progress
work. `lock-lost-mid-merge` is a clean, recognizable stop signal for the
caller to retry later, not a cleanup trigger.

## Verified with a real failing-test-first proof

Landed with genuine Iron Law evidence — a RED test reproducing the race
before the fix, GREEN after — rather than an after-the-fact assertion.
