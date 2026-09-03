---
authoritative_for: dispatch execute per-item concurrency guard, dispatch-in-flight lock, duplicate out-of-process dispatch bug
---

# Why `dispatch.mjs execute` needed a per-item concurrency guard

`executeExecutorCli` (`src/runner/dispatch/cli.mjs`) had no guard against
two concurrent out-of-process dispatches racing against the same
worktree. Discovered live on `tsk-1z1`: a premature `ps`-based liveness
check fired a duplicate `agy` dispatch while the first was still
genuinely running — both processes then had free rein over the same
worktree with nothing to stop them stepping on each other.

## The precedent, and what fgOS actually needed

`tsk-64hk` cited two upstream `beehive`/`beegog` mechanisms as precedent
(`docs/distillery/sources/beehive.md`): `prepareDispatch`'s
claim-ownership refusal (refuses `not_claimed`/`not_owner` before ever
generating a dispatch payload) and a named-mutex lockfile-per-key
mechanism (`O_EXCL`, two-tier staleness). fgOS's actual scope needed was
narrower than beehive's full claims system — item-level claiming already
exists via `fgos pick`/`take`; only the **dispatch-level in-flight
guard** (nothing stopping a second dispatch from starting while a first
is still running against the same cwd) was missing.

## What shipped

Rather than inventing a new lock mechanism, `executeExecutorCli` reuses
the already-existing main-checkout lock primitive
(`acquireMainCheckoutLock`) at a new lock file keyed to the dispatch's
own `cwd` (`dispatchLockFile(cwd)`):

```js
const lockFile = dispatchLockFile(cwd);
const lockRes = acquireMainCheckoutLock(fgosDir, {
  identity, ttlMs: timeoutMs, now: Date.now(),
  releaseOnExit: true, lockFile,
});
if (lockRes.status === HELD) {
  throw new DispatchError('dispatch-in-flight',
    `dispatch for cwd "${cwd}" is already in flight (held for ${ageStr}).`, ...);
}
```

A second dispatch against the same `cwd` while the first is still running
is refused outright with a typed `dispatch-in-flight` error naming how
long the existing dispatch has been held — never silently allowed to race.
The lock's TTL is the dispatch's own `timeoutMs`, and `releaseOnExit:
true` frees it if the process exits abnormally. An `AMBIGUOUS` lock state
(corrupt/unparseable lock file) also refuses loudly rather than guessing.

## The lesson

When borrowing a mechanism from an upstream reference project, the scope
of what to actually build should be sized to the real local gap, not the
upstream system's full scope — fgOS already had the claim-ownership half
(via `fgos pick`/`take`); only the narrower dispatch-level in-flight guard
was missing, and reusing an already-proven local lock primitive
(`acquireMainCheckoutLock`) for it was simpler than porting beehive's own
separate named-mutex mechanism wholesale.
