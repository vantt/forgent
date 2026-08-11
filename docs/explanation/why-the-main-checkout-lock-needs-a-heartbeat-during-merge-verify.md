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
