# Why the main-checkout lock needs a heartbeat during merge verify

`mergeRunnerItem` (`src/runner/merge.mjs`) acquires
`.fgos/main-checkout.lock` once, before its first git call, and holds it
across the entire `mergeRunnerItemLocked` call — including
`runGoalCheck`'s verify run. Staleness is judged by whichever session
calls `acquireMainCheckoutLock` *next*, comparing *its own* `ttlMs`
against the holder's recorded `record.ts`. Until this fix, the lock was
never refreshed while held, so its age was simply "how long ago it was
first acquired" — with no relationship to whether the holder was still
genuinely working.

## The bug this closes (tsk-4l8)

`DEFAULT_TTL_MS` is 180s (`src/runner/main-checkout-lock.mjs:80`).
`held = pidLive && withinTtl` — a lock reads as free once its age exceeds
`ttlMs`, *even for a holder whose process is still alive and still
working*, because `withinTtl` only looks at elapsed time, never at actual
liveness beyond the PID check.

Measured in practice: a real `npm test` run inside `runGoalCheck` took
184.93s — longer than the 180s TTL. Independently corroborated at 188.4s
and 180.9s (`docs/history/tsk-4l8-main-checkout-lock-ttl-verify-window/
RESEARCH.md`, cross-checked against `plans/reports/project-instability-
scan-260809-1608-ship-faster-stability-report.md:221-239`, finding 5). A
verify run that legitimately takes longer than the TTL made the lock look
abandoned to a second session mid-hold — letting that second session's
own merge or claim interleave with the first's still-in-progress one, on
the same shared working tree.

This is also the root cause behind two earlier symptom-level patches:
the `MERGE_HEAD` guards added in `merge.mjs:773-806` (`tsk-18a`,
`tsk-2j9`) treated the *effect* of two concurrent `git merge --no-commit`
calls landing on the same tree, not the TTL-vs-verify-window gap that let
them race in the first place.

## The fix: an identity-checked heartbeat, not a longer TTL

Simply raising `DEFAULT_TTL_MS` was rejected as a moving target — any
fixed number can be outrun by a slow enough verify again later. Instead,
`renewMainCheckoutLockIfOwn(dir, identity)` was added:

```js
export function renewMainCheckoutLockIfOwn(dir, identity, { now = Date.now() } = {}) {
  const record = readRecord();
  if (record === undefined) return { status: 'no-lock' };
  if (record === null) return { status: 'ambiguous' };
  if (record.pid !== identity) return { status: 'not-owner', holderPid: record.pid };

  const recheck = readRecord();
  if (recheck === undefined) return { status: 'no-lock' };
  if (recheck === null) return { status: 'ambiguous' };
  if (recheck.pid !== identity) return { status: 'not-owner', holderPid: recheck.pid };

  writeAtomicReplace(lockPath, JSON.stringify({ pid: identity, ts: now }));
  return { status: 'renewed' };
}
```

`mergeRunnerItem` now calls this on an interval for the whole duration it
holds the lock, so the recorded `ts` keeps advancing as long as the
holder is genuinely still alive and still working — the same self-
recognition refresh `tryAcquireOnce`'s own re-acquire-by-same-identity
path (D6) already performed, exposed here as a narrow, repeatable
primitive that skips that path's create-if-missing race handling and
exit/SIGINT listener registration.

Two properties this preserves deliberately:

- **A crashed session stops heartbeating.** Abandoned-lock self-healing
  is unchanged — the lock still goes stale and gets reclaimed exactly as
  before for a holder that actually died.
- **Never steals a lock, never renews one it doesn't hold.** The function
  reads the lock's recorded identity twice (before writing) and refuses
  — `not-owner`/`ambiguous`/`no-lock` — the moment it isn't an exact
  match, mirroring `releaseMainCheckoutLockIfOwn`'s own TOCTOU discipline:
  a competitor can reclaim the lock in the gap between this call's first
  read and its write, and that changed content must never be overwritten
  on a stale judgment.

## Scope

Confined to `mergeRunnerItem`'s own hold window
(`src/runner/main-checkout-lock.mjs`, `src/runner/merge.mjs`). The
sibling `HOOK_TTL_MS` constant used by the pre-commit hook
(`docs/history/tsk-1d9-pre-commit-hook-ttl-split/CONTEXT.md`) is a
separate, already-tuned consumer and was deliberately left untouched.

## The heartbeat closes the read side; the release side had its own gap (tsk-22c)

The heartbeat above stops a genuinely-still-working holder's lock from
*looking* abandoned. It does not, by itself, stop what happens when the
TTL lapses anyway — a real ~185s hold outrunning the ~180s TTL, the exact
measurement this doc's own bug section cites — and a second session
legitimately reclaims the lock mid-merge. The first session's own code
keeps running (this doc's "Outstanding" gap, still open: the heartbeat's
own return value is discarded at `merge.mjs:793`/`912`, so a renewal
failure is never noticed or acted on). When that first session eventually
finishes and calls `lock.release()`, the release closure
(`main-checkout-lock.mjs`'s own `release()`, what `lock.release()`
everywhere actually calls) used to call the unconditional
`releaseMainCheckoutLock` — a blind unlink of whatever lock file is
present at that moment, with no check for who currently owns it.

That is a second, independent bug from the read-side TOCTOU race this
doc's sibling (`main-checkout-lock-toctou-race.md`) fixes: not a torn
read on *acquire*, but an unconditional delete on *release* — the first
session's own stale release call destroying the second, legitimate
reclaimer's live lock record, on exit.

**Real incident this explains.** `tsk-22c` was filed as an unsolved
investigation: `fgos approve` failed twice with exit 9, `"verify passed
... but git commit failed"`, on an already stage-merged tree — no root
cause found at the time, because the error message didn't carry git's
real `stderr` yet (a separate bug, `tsk-50i7`, fixed after). A post-hoc
audit of a later merge-conductor batch (`tsk-51m`) surfaced this release-
side bug as one plausible explanation: if a second session's legitimate
reclaim landed in the exact window between the first session's TTL lapse
and its own `lock.release()` call, the first session's blind unlink would
delete the second session's live lock — a state consistent with, though
not conclusively proven to be, the original unexplained failure. The
item's own record is honest about that gap: this fix closes the release-
side hole either way, but whether it was *the* cause of the original
mystery, versus finding (1) below, was left explicitly unresolved.

**The fix.** The release closure now calls
`releaseMainCheckoutLockIfOwn(dir, identity, { lockFile })` instead —
the same ownership-checked primitive `renewMainCheckoutLockIfOwn` above
already mirrors ("never steals a lock, never renews one it doesn't
hold"). `releaseMainCheckoutLockIfOwn` re-reads the lock file and only
unlinks when the recorded identity still strictly equals the caller's own
— on every other outcome (`no-lock`/`not-owner`/`ambiguous`) it does
nothing, leaving whatever is currently there alone. No behavior changes
on the common path (a caller that is still the genuine owner at release
time): the recorded identity still matches, so the unlink still happens,
identically to before.

One swap fixed three call sites uniformly rather than each needing its
own edit: `withMergeTargetSlot` (`merge.mjs:801`), `mergeRunnerItem`'s own
main-checkout-lock path (`merge.mjs:921`), and `claimWork`
(`claim-port.mjs:376`, already routed through the same closure). `fgos
unlock`'s own call site (`bin/fgos.mjs`) was deliberately left calling the
raw unconditional `releaseMainCheckoutLock` — it reclaims a lock as a side
effect of its own acquire attempt and immediately releases it with no
work done in between, so no TTL-lapse window exists there; the
unconditional unlink is that verb's actual, correct intent (force-clear),
not an instance of this bug.

**What stayed open.** Two things this fix does not close: (1) a sibling
self-recognition gap (`acquireMainCheckoutLock` at `merge.mjs:886` leaves
`allowSelfRecognition` at its default `true`, unlike `withMergeTargetSlot`
which an earlier item set to `false` — two OS processes sharing one
inherited session id can still read as "the same writer") needs an actual
identity-model decision from a person, not a mechanical swap; and (2) the
heartbeat's own renewal-failure return value is still discarded, so a
session that silently loses the lock mid-hold keeps running its
remaining git operations unprotected — this fix only stops that session
from destroying the *new* legitimate holder's record on its own exit, it
does not stop the underlying double-writer window once the TTL has
already lapsed.
