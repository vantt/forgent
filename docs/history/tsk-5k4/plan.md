# plan.md — tsk-5k4: withLockRetry didn't actually wrap merge-target-slot

Mode: tiny

## The bug

`sync-root` (item.parent path) and `approve` (leaf-to-root path) both call
`withMergeTargetSlot(...)` — the ONLY call that can throw `code:'lock-held'`
on this path, since `mergeRunnerItem(...,{targetSlot:true})` (called from
inside `withMergeTargetSlot`'s own callback) skips its own lock acquire
entirely (`merge.mjs:844`'s early return). Both call sites had
`withMergeTargetSlot(...)` OUTSIDE `runMerge` (= `withLockRetry` unless
`--no-wait`), and only wrapped the inner `mergeRunnerItem` call in
`runMerge` — which can never throw `lock-held`. Net effect: the one call
that actually contends for the target slot bypassed retry-with-backoff
entirely and threw straight to the caller, contradicting
`withMergeTargetSlot`'s own docstring (`merge.mjs:753-759`): "Mirrors
mergeRunnerItem's own main-checkout-lock heartbeat/release shape below
exactly ... so withLockRetry ... transparently covers this too."

## Fix

Two call sites, `bin/fgos.mjs`:

- `approve`'s leaf-to-root path (~line 3434): wrapped the whole
  `withMergeTargetSlot(repoRoot, rootBranch, async () => { ... })` in
  `runMerge(() => ...)`.
- `sync-root`'s `item.parent` path (~line 3969): same wrap around
  `withMergeTargetSlot(repoRoot, targetBranch, async () => { ... })`.

Both closing parens updated from `});` to `}));` to match. No change to
either callback's body. The pre-existing inner `runMerge(() =>
mergeRunnerItem(...,{targetSlot:true}))` is left as-is — it was already a
no-op for lock-held purposes before this fix (never had anything to catch)
and removing it is out of scope (pre-existing, not something this fix
created).

`withLockRetry`'s own contract (`lock-wait.mjs`'s doc comment) already
covers this shape generally: "Wraps a whole claimWork/mergeRunnerItem call
rather than touching either function: both throw their lock error before
any state mutation, so retrying the entire call is equivalent to retrying
just the lock acquire." `withMergeTargetSlot` throws `lock-held` before
any mutation too (right at its own top, before the heartbeat/try block) —
same shape, now actually wired the same way.

## Verify

```
npm test
```

Red before: no repro test written. Constructing the real race (target-slot
genuinely contended by two processes, confirming the retry-with-backoff
message and eventual success/give-up) needs the same class of real
fork-based multi-process harness `merge-target-slot-multiprocess.test.mjs`
built for tsk-1wr — out of scope for a tiny-mode item; disclosed in the
Iron Law evidence rather than claimed.

## Not in scope

- The self-recognition sibling gap on main-checkout-lock (separate, larger
  finding from the same audit; needs a person's decision to reverse
  tsk-1wr's own locked decision).
- Any change to `withLockRetry` itself, or to `mergeRunnerItem`'s
  targetSlot-skip logic — both stay exactly as they were; only the two
  call sites' wrapping changed.
