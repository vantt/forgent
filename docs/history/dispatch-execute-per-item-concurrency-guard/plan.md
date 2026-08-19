# Plan — dispatch.mjs execute per-item concurrency guard (tsk-64hk)

Mode: standard

## Locked decisions this plan honors

No `CONTEXT.md` exists — discovery's own `clear` verdict skipped
`exploring`. Source of truth: this item's own `RESEARCH.md`
(`docs/history/dispatch-execute-per-item-concurrency-guard/RESEARCH.md`),
round 1.

## Approach

**Chosen path:** wrap `executeExecutorCli`'s existing self-execute branch
(`src/runner/dispatch/cli.mjs:217+`, the `out-of-process` path that
actually spawns an executor's adapter) in an acquire/release around
`main-checkout-lock.mjs`'s already-generic `acquireMainCheckoutLock`, keyed
by the caller's own `cwd` (already a function parameter, default
`process.cwd()` — no CLI/signature change needed):

1. Add `dispatchLockFile(cwd)` next to `mergeSlotLockFile(targetRef)` in
   `src/runner/main-checkout-lock.mjs`, mirroring its exact shape:
   `` `dispatch--${encodeURIComponent(cwd)}.lock` `` — `encodeURIComponent`
   over the whole cwd string for the same collision-free,
   filesystem-safe reason `mergeSlotLockFile`'s own doc comment already
   gives (RESEARCH.md round 1, `mergeSlotLockFile` citation).
2. In `executeExecutorCli`, immediately before the self-execute branch
   calls its adapter (the actual out-of-process spawn), acquire
   `acquireMainCheckoutLock(fgosDir, {identity: <a per-call token, e.g.
   \`${process.pid}:${Date.now()}\`>, ttlMs: <cover cfg.timeoutMs or the
   caller's own timeoutOverride>, releaseOnExit: true, lockFile:
   dispatchLockFile(cwd)})`. `fgosDir` is already computed in this
   function (`fgosDirFromRoot(root)`, existing code).
3. **`HELD`** — refuse before ever calling the adapter: throw a new typed
   error (`DispatchError('dispatch-in-flight', ...)`, matching the
   existing `DispatchError` shape `transport.mjs` already defines for
   `worker-timeout`/`worker-spawn-fail`) naming the cwd already locked and
   its holder's lock age — never silently queue/wait, per RESEARCH.md's
   own "told plainly, not silently serialized" conclusion.
4. **`ACQUIRED`** — proceed to the adapter call exactly as today, then
   release the lock in a `finally` (success or failure/timeout both
   release) — `release()` is already the returned closure, safe to call
   unconditionally (idempotent per its own `released` guard).
5. **`AMBIGUOUS`** — a corrupt/unparseable lock file for this cwd: fail
   closed the same way `main-checkout-lock.mjs`'s own D5 already documents
   for its primary use case — refuse with the same typed error rather than
   guessing the lock is free.

**Alternatives rejected:**

- Porting beehive's `store-lock-named-mutex` primitive from scratch (this
  item's own original submit text) — rejected: `main-checkout-lock.mjs`
  already IS that primitive, already proven three times over
  (loop.mjs/session.mjs/events.mjs lineage) plus this repo's own fourth
  instance, and already generalized via `lockFile`. Porting a second one
  would violate RUL11/DRY for zero added safety.
- Adding a new `--id`/`--work` CLI flag to key the lock explicitly instead
  of reusing `cwd` — rejected for THIS item's scope: `cwd` already
  uniquely identifies the dispatch target for the one real caller today
  (RESEARCH.md round 1, finding 1) with zero signature change. A future
  item can widen this if a genuine item-less-but-still-needs-locking
  caller ever appears — not invented here (YAGNI).
- Locking at the `spawnWorker` level instead of `executeExecutorCli` —
  rejected: `spawnWorker` (the automated `loop.mjs` runner path) was never
  the path that produced this item's own real incident; `executeExecutorCli`
  is the one a live interactive session drives directly and can genuinely
  re-invoke by mistake. `spawnWorker` calls its own adapter separately and
  is out of this item's proven-real scope; a follow-up can extend the same
  guard there if a real incident ever surfaces on that path too.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| Blast radius of editing `executeExecutorCli` | light — exactly one production call site (`src/runner/dispatch/cli.mjs:543`, `runDispatchCli`'s own `execute` branch); GitNexus `impact` returned a stale-index "not found" (posture: degraded), cross-checked directly via `grep -rn executeExecutorCli src/ test/` — confirmed no other production caller exists | grep output (RESEARCH.md-adjacent evidence above); `npm test`'s full green baseline (268/268) proves nothing else silently depends on today's unlocked behavior |
| Existing test-suite regression | standard — ~20+ existing tests in `test/runner/dispatch.test.mjs` directly exercise `executeExecutorCli`, none of which today concurrently invoke it twice for the same cwd, so none should observe the new lock at all in the ACQUIRED-then-released steady state | the item's own `verify` (baseline: `node --test test/runner/dispatch.test.mjs`, already confirmed green pre-change) re-run post-change must stay 268/268 green |
| The new guard itself doing what it claims | standard — a lock that never actually blocks a genuine second concurrent call would silently reproduce this item's own real incident | a new test: two concurrent `executeExecutorCli` calls with the same `cwd` against a fast fake/no-op adapter — assert exactly one runs the adapter, the other gets the typed `dispatch-in-flight` refusal before any adapter call |

Impact-analysis posture: **degraded** — `gitnexus impact` on `executeExecutorCli`
returned `impactedCount: 0`/"not found" (stale index against this branch),
cross-checked by direct `grep` (above) rather than trusted blind, per
`CLAUDE.md`'s own gate note on a suspicious zero-result.

**Files touched:** `src/runner/main-checkout-lock.mjs` (add
`dispatchLockFile`, small additive export, same shape as `mergeSlotLockFile`),
`src/runner/dispatch/cli.mjs` (`executeExecutorCli`'s self-execute branch —
acquire/release wrap), `src/runner/dispatch/transport.mjs` (new
`DispatchError` category, additive), `test/runner/dispatch.test.mjs` (new
concurrency test(s)).

**Order:** add `dispatchLockFile` first (pure, testable alone) → wrap
`executeExecutorCli` → add the concurrency test → run the full existing
suite to confirm no regression.

## Split decision

Pass-through — one honest piece of work. The lock-file helper and the
acquire/release wrap are two small, tightly coupled edits to the same
narrow chokepoint; splitting them into separate items would only add
coordination overhead for no independent value (neither is useful without
the other).

## Outstanding questions

None
