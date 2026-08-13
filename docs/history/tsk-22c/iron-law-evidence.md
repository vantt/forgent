# Iron Law evidence — tsk-22c

## Matched

`fgos approve` refused with:

```
approve: "tsk-22c" trips the Iron Law — a failing test must precede this
self-modifying diff before it can land. Matched flags: [none]; matched
modules: [src/runner/main-checkout-lock.mjs].
```

## What changed

One symbol, one file: `acquireMainCheckoutLock`'s own `release` closure in
`src/runner/main-checkout-lock.mjs` (lines ~359-373). Was:

```js
releaseMainCheckoutLock(dir, { lockFile });
```

Now:

```js
releaseMainCheckoutLockIfOwn(dir, identity, { lockFile });
```

`identity` was already the function's own parameter, in scope. No other
line changed. Full diff is the single commit on this branch
(`fix(main-checkout-lock): release only when still the recorded owner`).

## NOT failing-test-first — disclosed, not claimed otherwise

No new test was written for this fix. Reproducing the actual race
(process A holds the lock past its TTL while a long operation runs,
process B legitimately reclaims, process A's `finally` then runs) needs a
real fork-based two-process harness with a controlled TTL/timing window —
the same class of proof `test/runner/merge-target-slot-multiprocess.test.mjs`
built for tsk-1wr's sibling bug, deliberately not attempted here (tiny-mode
scope, see plan.md's "Outstanding" section). This gap is real and named,
not hidden.

## What IS verified

1. **Code inspection, not test-derived**: `releaseMainCheckoutLockIfOwn`
   (main-checkout-lock.mjs:452 onward) already exists, is already used
   elsewhere in this same file's own design (its own doc comment
   describes exactly this hazard), and its own behavior is already
   covered by `main-checkout-lock.test.mjs`'s existing suite (own-identity
   release succeeds, foreign-identity release is a no-op, ambiguous
   content is left untouched). This change routes an existing, tested
   primitive through a path that previously bypassed it — it does not
   introduce new untested logic.
2. **No behavior change on the common path**: on every currently-passing
   test and every normal (non-TTL-lapsed) run, the calling identity still
   matches what's on disk at release time, so `releaseMainCheckoutLockIfOwn`
   unlinks exactly when `releaseMainCheckoutLock` already did. This is why
   the full suite stays green with no new red/green pair — the change is
   only observable in the specific race window it closes.
3. **Full suite green, in this worktree, on this diff**:
   ```
   ℹ tests 3103
   ℹ pass 3098
   ℹ fail 0
   ℹ skipped 5
   ```
   (matches the pre-change baseline exactly — same counts, same 5
   pre-existing bee-canary skips.)
4. **Targeted suite green**: `main-checkout-lock.test.mjs`,
   `merge.test.mjs`, `merge-target-slot-multiprocess.test.mjs`,
   `fgos-approve.test.mjs`, `fgos-merge.test.mjs` — 272/272 pass.
5. **detect_changes() scoping check**: GitNexus `detect_changes` against
   this worktree's unstaged diff reported exactly one changed symbol
   (`acquireMainCheckoutLock`) and five affected processes, all in the
   `ClaimWork` family — no unexpected symbol or process touched.
6. **GitNexus impact() caveat**: the index is stale (last indexed
   `79fead3`, well behind current HEAD) — `impact()` on
   `acquireMainCheckoutLock` reported `retargetMember`
   (`promote-engine.mjs`) as an upstream-affected caller, but a direct
   grep of that file for `claimWork`/`acquireMainCheckoutLock` found no
   match. Treated as a stale-index artifact, not trusted blindly, per
   this repo's own capability-gate guidance. The three real callers of
   the changed closure were confirmed by direct grep instead:
   `withMergeTargetSlot` (merge.mjs:778/801), `mergeRunnerItem`'s
   main-checkout-lock path (merge.mjs:886/921), and `claimWork`
   (claim-port.mjs:105/376). `unlock` (bin/fgos.mjs:4591/4611) uses the
   raw function directly, not this closure, and is unaffected by design.

## Not acknowledged by this session

`fgos approve tsk-22c --acknowledge-iron-law` has not been run. Per this
audit's operating constraint, an Iron Law trip on a src/runner/ change
stops here for a person to review this evidence and decide, not something
this session self-acknowledges.
