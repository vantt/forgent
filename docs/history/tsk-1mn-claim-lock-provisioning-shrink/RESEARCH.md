# Research: tsk-1mn — claimWork holds main-checkout.lock across synchronous npm ci

## Round 1 — 2026-08-14 (discovery stage)

**Asked:** Does the current code still match Finding 2's description
(`claimWork` holds `main-checkout.lock` across synchronous `provisionDependencies`
with no heartbeat)? What is the concrete, provably-safe fix — shrink the
hold, or add a heartbeat like `withMergeTargetSlot`'s?

**Checked:**
- `src/runner/claim-port.mjs:97-378` (`claimWork`) — read directly. Lock
  acquired line 105 (`acquireMainCheckoutLock(dir, {identity: process.pid,
  ttlMs: DEFAULT_TTL_MS, releaseOnExit: true})`), released only in the
  function's own `finally` (line 376, `lockResult.release()`).
- `src/runner/worktree.mjs:394-445` (`finishWorktreeSetup`), `:451-498`
  (`createWorktree`), `:844-870` (`createClaimWorktree`), `:634-670`
  (`resyncClaimWorktree`) — read directly.
- `src/runner/main-checkout-lock.mjs:1-5` (module header) — read directly:
  "Guards against the STR65 clobbering failure mode: two concurrent writers
  racing this checkout's own `.git/index`."
- `src/runner/loop.mjs` — grepped for `acquireMainCheckoutLock`: no match.
  The runner's own dispatch worktree creation (`createDispatchWorktree`,
  called from `loop.mjs`) never holds this lock at all.
- GitNexus `impact` cross-checked against a plain grep (posture: degraded,
  same stale-index caveat as tsk-18k) — its own call-graph flows for
  `acquireMainCheckoutLock` list exactly two live callers: `ClaimWork` and
  `WithMergeTargetSlot`. Matches the grep-confirmed picture directly (no
  false-negative this round, unlike tsk-18k's).

**Found:**
1. Confirmed exactly as described: `createClaimWorktree` → `createWorktree`
   (only when `isolate: true`, the `pick`/`fgos take --id` claim path, never
   the runner's own `createDispatchWorktree`) → `finishWorktreeSetup` →
   `provisionDependencies` (synchronous `npm ci`/`npm install`,
   `execFileSync`), all while `claimWork`'s own lock (acquired line 105) is
   still held — no heartbeat anywhere in `claim-port.mjs`.
2. **A timer-based heartbeat cannot work here at all** (confirmed by
   reading `provisionDependencies`, worktree.mjs:97-105: `execFileSync`,
   fully synchronous, blocks the whole event loop for its duration). Unlike
   `mergeRunnerItemLocked` (async, has `await` yield points, which is what
   lets `withMergeTargetSlot`'s `setInterval` heartbeat actually fire during
   the hold), nothing can run — including a `setInterval` callback — while
   `execFileSync` blocks. The ONLY fix that can actually close this gap is
   shrinking the hold, never renewing it. The report's own "release (or
   renew)" phrasing is not two equally-viable options for this call site.
3. **Every `repoRoot`-touching git operation `createClaimWorktree` makes
   (`git branch`, `git worktree add`, `relocateOrphanedCheckout`) already
   completes before `finishWorktreeSetup` is ever called** — confirmed by
   reading `createWorktree`'s own body: the `if (!relocated) { ... git(...)
   ... }` block (worktree.mjs:472-493) and the `reused`/`relocated` branch
   both fully resolve before `finishWorktreeSetup(worktreePath, branch)` at
   line 495. `finishWorktreeSetup` itself (`.fgos/` strip + provisioning)
   touches ONLY `worktreePath` (the new, isolated worktree directory) —
   never `repoRoot`'s own `.git/index`, the exact resource
   `main-checkout-lock.mjs`'s own header names as this lock's actual
   protection target. This means releasing the lock at the exact boundary
   between "git setup against repoRoot" and "`.fgos/` strip + provisioning
   against `worktreePath`" is provably safe — not a judgment call, a direct
   consequence of what each operation actually touches.
4. `resyncClaimWorktree` (the REATTACH path for an existing branch/checkout,
   `createClaimWorktree`'s `existing` branch, line 852-855) never calls
   `finishWorktreeSetup`/`provisionDependencies` at all (confirmed by
   reading its full body, worktree.mjs:634-670: `git reset --hard` +
   `stripFgosAfterReset`, no npm anywhere) — this bug does not reach that
   path, matches Finding 2's own citation exactly (only `createWorktree`'s
   fresh-checkout path).
5. `createDetachedMergeWorktree` (the merge flow's ephemeral worktree,
   `withMergeEphemeralWorktree`'s own helper) ALSO calls
   `finishWorktreeSetup` — but that call site's own lock hold
   (`withMergeTargetSlot`, merge.mjs) is async and DOES have a working
   heartbeat (`HEARTBEAT_INTERVAL_MS`, confirmed during tsk-18k's own
   research round). That path has no TTL-starvation gap to close and is
   explicitly out of this item's scope — any fix here must leave it
   byte-identical.

**Decided (from evidence above, not a re-derivation of what the item
description already states):** shrink the hold via a narrow, opt-in
`beforeProvision` callback threaded through `createWorktree`/
`createClaimWorktree` (default: no-op, so `createDetachedMergeWorktree` and
`createDispatchWorktree` stay byte-identical), fired at the exact boundary
identified in finding 3 above. `claimWork` passes
`() => lockResult.release()` — safe to call early because
`lockResult.release()` (main-checkout-lock.mjs, tsk-45z's own closure) is
idempotent, so the existing outer `finally { lockResult.release(); }` stays
in place unconditionally as a safety net for every other exit path (no
worktree creation reached the callback, `isolate: false`, etc.) with no
double-release risk.

**Remaining open:** none. The description's own coupling note (implement
alongside tsk-18k, closing one without the other still leaves the other's
failure mode reachable) is already satisfied structurally: tsk-18k merged
into `fgw/tsk-25r` before this item was claimed (confirmed: this branch's
own `git log` shows `Merge branch 'fgw/tsk-18k' into HEAD` as its own tip),
so this item's fix builds on top of tsk-18k's already-landed identity fix,
not in parallel with it.

**Verify (real, runnable):**
```
node --test test/runner/worktree.test.mjs test/runner/claim-port.test.mjs
```
(existing suites covering both touched modules; two new cases added to
`worktree.test.mjs` proving the `beforeProvision` seam's own ordering
contract directly.)
