# Iron Law evidence — tsk-5k4

## Matched

`fgos approve` refused with:

```
approve: "tsk-5k4" trips the Iron Law — a failing test must precede this
self-modifying diff before it can land. Matched flags: [none]; matched
modules: [bin/fgos.mjs].
```

## What changed

Two call sites in `bin/fgos.mjs`, both in the same shape: wrapped an
existing `withMergeTargetSlot(...)` call in the existing `runMerge(...)`
(= `withLockRetry` unless `--no-wait`) that was already defined in the same
scope and already used elsewhere in the same case block. No new function,
no new import, no logic inside either callback touched — only where the
retry wrapper starts and where its extra closing paren lands. Full diff is
the single commit on this branch (`fix(fgos): wrap merge-target-slot
acquire in withLockRetry`).

## NOT failing-test-first — disclosed, not claimed otherwise

No new test was written. Reproducing the actual race (two real processes
contending for the same target's merge slot, confirming one gets
bounded-wait retry with backoff instead of an immediate throw) needs a
real fork-based two-process harness — the same class of proof
`test/runner/merge-target-slot-multiprocess.test.mjs` already built for
tsk-1wr's sibling bug on the same primitive, deliberately not attempted
here (tiny-mode scope; see plan.md's own "Not in scope" section).

## What IS verified

1. **Code inspection, not test-derived**: `withMergeTargetSlot` is the
   only call on this path capable of throwing `code:'lock-held'` — proven
   by reading `merge.mjs:844`'s own early-return for
   `targetSlot:true`, which skips `acquireMainCheckoutLock` entirely. The
   fix routes the ALREADY-EXISTING, already-tested `withLockRetry` (used
   correctly elsewhere in this same file for the plain main-checkout.lock
   path, e.g. `bin/fgos.mjs:2636`, `:2709`) around the call that can
   actually throw. No new retry logic was written — this fix corrects
   which call an existing, already-covered wrapper surrounds.
2. **No behavior change on the non-contended path**: when the slot isn't
   contended, `withMergeTargetSlot` never throws, so wrapping it in
   `runMerge` changes nothing observable — `fn()` resolves on the first
   attempt either way. This is why the full suite stays green with no new
   red/green pair.
3. **Full suite green, in this worktree, on this diff**:
   ```
   ℹ tests 3116
   ℹ pass 3111
   ℹ fail 0
   ℹ skipped 5
   ```
   (matches this branch's own pre-change baseline exactly.)
4. **Targeted suite green**: `fgos-approve.test.mjs`, `fgos-merge.test.mjs`,
   `merge.test.mjs`, `merge-target-slot-multiprocess.test.mjs` —
   211/211 pass, including the existing `--no-wait` tests
   (`fgos-approve.test.mjs:1252`, `fgos-merge.test.mjs:1065`) that exercise
   the sibling main-checkout.lock retry path and stay unaffected.
5. **Syntax/paren-matching verified mechanically, not just visually**: the
   two call sites span ~150-200 lines each between their opening
   `withMergeTargetSlot(...)` and matching close. Used a small
   depth-tracking script (handles strings/template literals/comments,
   not just brute paren counting) to locate the exact matching close paren
   before editing each site, then confirmed with `node --check bin/fgos.mjs`
   after each edit — both passed on the first attempt.

## Not acknowledged by this session

`fgos approve tsk-5k4 --acknowledge-iron-law` has not been run. Per this
audit's operating constraint, an Iron Law trip on a bin/fgos.mjs change
stops here for a person to review this evidence and decide, not something
this session self-acknowledges.
