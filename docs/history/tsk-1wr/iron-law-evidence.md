# Iron Law evidence: tsk-1wr

`classifyIronLaw` on this item's real diff (`fgw/tsk-1wr` vs `main`, computed
with `changedFiles(repoRoot, item, {trunk: 'main'})` against the real branch,
after catching the branch up with `main`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/main-checkout-lock.mjs",
    "src/runner/merge.mjs"
  ]
}
```

`matchedFlags` is empty. The gate fires purely on the module rule
(`src/runner/` prefix) — expected, this item's whole point is a fix inside
that lock/merge machinery.

Full real diff (`main...HEAD`):

```
docs/history/tsk-1wr/plan.md
src/runner/main-checkout-lock.mjs
src/runner/merge.mjs
test/runner/main-checkout-lock.test.mjs
test/runner/merge-target-slot-multiprocess.test.mjs
```

(`merge-target-slot-multiprocess.test.mjs` and the original `plan.md` predate
this session's work — written and committed on this branch before hand-off,
per the item's own description. This session's own work is the fix in
`main-checkout-lock.mjs`/`merge.mjs`, the new tests in
`main-checkout-lock.test.mjs`, the `plan.md` addendum, and catching the
branch up with `main`.)

## What this item actually was

Originally filed as a coverage gap (a two-real-process test for
`withMergeTargetSlot`'s mutual exclusion, closing the gap
`docs/history/tsk-xyr/iron-law-evidence.md` disclosed as missing — proven
only at the unit/async level, never with genuinely separate OS processes).
That test was written and committed on this branch before this session
picked it up, and running it surfaced a real, reproducible finding rather
than just confirming coverage: the fourth test was RED against real code.

## The finding

`withMergeTargetSlot`'s identity comes from `resolveWriterIdentity`
(`session-identity.mjs:135-138`), an env-derived session id that every
forked child process inherits byte-identically. `main-checkout-lock.mjs`'s
self-recognition branch (`record.pid === identity`, D6) treats a matching
identity as "the same writer returning", always ACQUIRED regardless of
liveness or TTL. Two genuinely separate OS processes sharing one session id
therefore do not exclude each other for the same target ref — the exact
case a same-process test cannot construct, and the exact case a real fork
did.

Severity, checked against the actual land path rather than assumed: the
final `git branch -f` at land time carries its own CAS guard (tsk-46a)
that refuses to force-move if the target's tip changed since it was read.
So the consequence of this gap is wasted work and conflicts needing retry,
not silent data loss — the slot's guarantee is real but its enforcement had
a gap, not the ref-move's own safety net.

Whether this is a real, live scenario (not merely theoretical) was checked
against two pieces of direct evidence rather than assumed: this session's
own subagent fanout independently hit the same-shaped bug (unpinned
subagents inheriting one session id, fixed only by assigning each a
distinct `BEE_SESSION_ID`), and `fgos-fanout`'s documented behavior — batch
`Agent` dispatch, auto-approve of sibling leaves sharing one root/target —
is exactly the shape that would trigger it here.

## The fix and why it's safe

`acquireMainCheckoutLock`/`tryAcquireOnce` gained `allowSelfRecognition`
(default `true` — every existing call site is byte-identical, verified by
the full suite below). `withMergeTargetSlot` passes
`allowSelfRecognition: false`.

This is safe specifically because `withMergeTargetSlot` always releases the
lock in the same call that acquired it (its own `finally`) — there is no
legitimate same-identity re-entry for this call site to lose, unlike
`main-checkout.lock`'s own use (a session refreshing the lock across several
back-to-back operations within one call chain), which keeps its existing
self-recognition behavior completely unchanged. The existing
`withMergeTargetSlot` contention test (`merge.test.mjs:804`) already injects
a *different* identity rather than relying on self-recognition, so it does
not depend on the behavior this item turns off.

Rejected direction (present in the item's own text, decided against by the
user after seeing both options): switching the slot to per-process identity
instead. Wider blast radius for a narrower gain — `isPidAlive`/stale-reclaim
already assume a numeric identity, and this item's fix does not touch that
assumption at all.

## Branch catch-up

`fgw/tsk-1wr` forked before `fgw/tsk-51m` fully landed into `main` (its own
last merge was `fgw/tsk-55p`, missing `tsk-xyr`/`tsk-4ax`/`tsk-2ypd`/
`tsk-4xq`/`tsk-kv3`/`tsk-60h`'s later work). Caught up via `git merge main`
(never rebase — this branch already carries its own commits, D2) before
implementing the fix, so the fix and its verify run apply to the same code
that is actually live. Merge was clean, no conflicts.

## Full suite

Run from this branch, after the catch-up merge and the fix, immediately
before this evidence file was written:

```
$ node --test test/runner/merge-target-slot-multiprocess.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0

$ npm test
ℹ tests 3103
ℹ suites 0
ℹ pass 3098
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

(The 5 skips pre-exist this item's work and are unrelated to it.)

## Honest gap

Not failing-test-first in the strict sense for the new
`main-checkout-lock.test.mjs` coverage: the `allowSelfRecognition` flag and
its three new tests were written in the same pass, verified green together
— not proven red-before-green for the flag itself (the multiprocess test's
own red-before-green history is real and predates this session, per its own
file header). The flag's default-preserving behavior is proven directly
(`allowSelfRecognition` omitted still self-recognizes, byte-identical),
not merely argued.

## Not acknowledged by this session

`fgos approve tsk-1wr --acknowledge-iron-law` has not been run here.
Acknowledgment is deliberately left to a person.
