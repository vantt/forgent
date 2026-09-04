---
authoritative_for: whether dispatch execute()'s main-checkout lock (acquireMainCheckoutLock, src/runner/dispatch/cli.mjs) serializes independent worktree-isolated out-of-process dispatches too broadly — audited and confirmed already per-cwd since tsk-64hk, not a real bottleneck; the item's own premise did not hold
---

# A suspected over-broad lock, audited and confirmed already fine

`tsk-2e7` set out to audit whether dispatch `execute()`'s main-checkout
lock (`acquireMainCheckoutLock`, `src/runner/dispatch/cli.mjs:487-517`)
serializes ALL out-of-process dispatch — including items that are already
worktree-isolated and fully independent of each other by footprint — with
no distinction between phases that genuinely touch the main checkout (per
ADR0020's `.fgos/` rules) and phases that only touch an item's own
worktree.

## What the audit found

The premise did not hold. `dispatch execute()`'s main-checkout lock at
`cli.mjs:488` is already per-cwd since `tsk-64hk` — it does not serialize
independent worktree-isolated items against each other. The two remaining
`acquireMainCheckoutLock` call sites that ARE global
(`claim-port.mjs`, `merge.mjs:906`) correctly stay global — they operate on
shared state that genuinely needs whole-repo serialization, unlike
`execute()`'s per-item worktree phase.

## What shipped

No code change. The item's own action was: re-run the cited verify to
reconfirm the finding, then return — the audit finding itself (written
into `docs/history/tsk-2e7-main-checkout-lock-scope/{plan.md,
RESEARCH.md}`) is the deliverable. This closes the open question
`tsk-2e7`'s own description raised without widening any lock scope, which
the item explicitly flagged as risky to do without first confirming which
phases actually need the lock.

## Related, not duplicated

Related to `tsk-6ci` (same `main-checkout.lock` subsystem), but a
different axis: `tsk-6ci` addressed visibility/ETA while waiting on the
lock; this item asked whether the lock serializes too broadly in the first
place. Both concluded independently — this item's answer is "no, already
correctly scoped."

## A pre-existing test flake surfaced and was resolved in-flight

The first `return` attempt on this item hit a known pre-existing test
flake (the `fanoutBatchExecutorCli` overlapping-windows test, the same
flake `tsk-5v3` fixed on main after this branch had already forked).
Cherry-picking that test-only fix and re-verifying resolved it — not a
finding of this item's own audit, noted here only because it delayed the
return.
