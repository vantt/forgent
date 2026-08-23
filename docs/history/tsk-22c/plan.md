# plan.md — tsk-22c: main-checkout-lock release() can reap a legitimate reclaimer's lock

Mode: tiny

## What this closes (narrow slice only)

tsk-22c's own text frames itself as an unsolved investigation ("git commit
--no-edit fails, exit 9, verify passed, cause never found"). A post-hoc audit
of the tsk-51m merge-conductor batch (2026-08-13, decision seq 15156 on this
item) surfaced two independent, verified race conditions on the exact
main-checkout-lock path `mergeRunnerItem` uses for a root's own approve/
sync-root into `main`:

1. `acquireMainCheckoutLock` at `merge.mjs:886` leaves `allowSelfRecognition`
   at its default `true` (unlike `withMergeTargetSlot`, which tsk-1wr set to
   `false`) — two independent OS processes sharing one inherited env session
   id read as "the same writer" and do not exclude each other.
2. `lock.release()` (`merge.mjs:801`, `:921`) calls the unconditional
   `releaseMainCheckoutLock` (blind unlink) rather than
   `releaseMainCheckoutLockIfOwn`. If this call's own TTL lapses mid-merge
   (tsk-51m's own problem statement: measured ~185s hold vs a 180s TTL at
   the time) and a different session legitimately reclaims the lock, this
   call's `finally` still unconditionally deletes whatever lock file is
   present when it exits — including that legitimate reclaimer's live
   record.

Only (2) is in scope for this item. (1) needs an actual identity-model
decision (a per-call token vs the session-wide id the pre-commit hook's
child process must still recognize to avoid self-deadlocking on its own
commit) — not a one-line change, and reversing tsk-1wr's own recorded
"Locked decision" to leave main-checkout.lock's self-recognition alone
needs a person's sign-off first. Left open; not claimed as closed here.

## Fix

Single call site, not two: `acquireMainCheckoutLock`'s own `release`
closure (`main-checkout-lock.mjs:359-368`, the thing `lock.release()`
actually calls everywhere) currently reads:

```js
const release = () => {
  if (released) return;
  released = true;
  ...
  releaseMainCheckoutLock(dir, { lockFile });
};
```

Changed to call `releaseMainCheckoutLockIfOwn(dir, identity, { lockFile })`
instead — the exact primitive `main-checkout-lock.mjs:421-450` already
documents as built for this: "a caller ... cannot assume the lock it sees
is still its own ... blindly unlinking in that case would delete a
genuinely live different session's lock". `identity` is already in scope
(the function's own parameter). Ignores the returned status
(`released`/`no-lock`/`not-owner`/`ambiguous`) — on every one of those
outcomes this call's own job (releasing what might be its lock) is done;
nothing further to do on any of them at this call site.

This single change fixes all THREE current hold-then-release-after-work
callers uniformly: `withMergeTargetSlot` (`merge.mjs:801`), `mergeRunnerItem`'s
main-checkout-lock path (`merge.mjs:921`), and `claimWork`
(`claim-port.mjs:376`, explicitly routed through this same closure per its
own tsk-45z comment) — rather than editing each call site separately.
`unlock`'s case (`bin/fgos.mjs:4611`) is UNCHANGED and intentionally so: it
calls the raw `releaseMainCheckoutLock` directly, immediately after its own
acquire with no wrapped work in between ("reclaimed as a side effect of the
acquire attempt then immediately released") — no TTL-lapse window exists
there, so the unconditional unlink is correct for that verb's actual intent
(clear the lock unconditionally) and untouched by this fix.

No behavior change on the common path (a caller is still the owner when it
releases): `releaseMainCheckoutLockIfOwn` re-reads the lock file and only
unlinks when the recorded identity still strictly equals `identity` —
exactly what was already true whenever `releaseMainCheckoutLock` succeeded
correctly before.

## Verify

```
npm test
```

Red before: no repro test exists for this narrow race (constructing it
needs a real TTL lapse mid-hold, not attempted here — same class of
fork-based real-process proof `merge-target-slot-multiprocess.test.mjs`
used for tsk-1wr, out of scope for a tiny-mode item). This fix is verified
by code inspection against `releaseMainCheckoutLockIfOwn`'s own existing
unit coverage (`main-checkout-lock.test.mjs`) plus the full suite staying
green — not by a new red-then-green test. Documented explicitly in the
Iron Law evidence rather than silently claimed.

## Outstanding — left open, not solved by this item

- Finding (1) above: the self-recognition sibling gap on root->main merges.
  Needs a person to decide whether to reverse tsk-1wr's "Locked decision"
  and what identity mechanism replaces it.
- Heartbeat renewal failure (`renewMainCheckoutLockIfOwn`'s return value,
  discarded at `merge.mjs:793`/`912`) is never checked — even after this
  fix, a process that silently lost the lock mid-hold keeps running its
  remaining git operations unprotected. This fix only stops that process
  from destroying the NEW legitimate holder's lock record on its own exit;
  it does not stop the underlying double-writer window once TTL has
  already lapsed. A real fix for that needs the heartbeat to abort the
  held operation on renewal failure — a larger, riskier change, not
  attempted here.
- `withLockRetry` not actually covering `withMergeTargetSlot` (`bin/fgos.mjs`
  call sites wrap it outside the retry) — separate bug, separate footprint
  (`bin/fgos.mjs`'s `approve`/`sync-root` cases), not touched by this item.
- tsk-22c's own original mystery (git commit exit 9) may or may not be
  fully explained by finding (1)+(2) together — this item only closes (2).
  If the symptom recurs after this fix ships, that is evidence (1) is the
  real remaining cause, not proof this fix was wrong.
