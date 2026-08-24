# tsk-6ci — RESEARCH.md

## Round 1 — 2026-08-24 (discovery)

**Asked:** Locate the current `main-checkout.lock` wait/poll implementation
(the code printing `"still waiting on main-checkout lock (holder pid <pid>,
Ns elapsed)"`). Need: (a) exact file/function + message format, (b) what
data is already available at each poll tick, (c) current poll
cadence/backoff, (d) whether an existing staleness heuristic is already
reachable from inside the wait loop.

**Checked (repo, `rg`/`Read`):**

- `rg -- "still waiting on main-checkout lock" src bin` → one hit:
  `src/runner/lock-wait.mjs:105`.
- `src/runner/lock-wait.mjs` (full read) — `withLockRetry(fn, { waitMs })`
  wraps a whole `claimWork`/`mergeRunnerItem` call with backoff. On each
  caught `err.code === 'lock-held'`, it prints the progress line only when
  it is about to sleep (`delayMs > 0`), using `err.holderPid` and its own
  locally-tracked `elapsedMs`. Backoff schedule: `BACKOFF_SCHEDULE_MS =
  [500, 1000, 2000]` ms, capped at 2s from the 3rd attempt on
  (`lock-wait.mjs:9`). Wait budget defaults to `remainingTtlMs` off the
  first thrown error, or an explicit `waitMs` ceiling when supplied.
- `src/runner/main-checkout-lock.mjs` (full read) — `acquireMainCheckoutLock`
  returns `{status: HELD, holderPid, lockAgeMs, remainingTtlMs}` on
  contention. A separate read-only verb, `inspectMainCheckoutLock` (used by
  `fgos lock-status`), already classifies a lock as `live`/`stale`/
  `ambiguous` from the same `lockAgeMs`/`ttlMs` math — but it is not called
  from inside `lock-wait.mjs`'s retry loop.
- `src/runner/claim-port.mjs:80-126` (`claimWork`) — on `HELD`, throws
  `ClaimError('lock-held', ..., { remainingTtlMs, holderPid, lockAgeMs })`
  (all three fields, already computed via `formatLockDurationMs`). This is
  `tsk-5z2`'s landed work (`docs/history/lock-status-visibility/CONTEXT.md`,
  confirmed delivered — D1-D6 locked, scope was the one-shot
  `ClaimError`/`unlock` refusal/`MergeError` messages).
  **`err.remainingTtlMs` and `err.lockAgeMs` are therefore ALREADY present
  on the exact error object `lock-wait.mjs`'s catch block destructures
  `err.holderPid` from — they are simply never read.**
- `src/runner/merge.mjs:786,913` — same pattern: `MergeError` for
  `lock-held` also carries `remainingTtlMs`/`holderPid`/`lockAgeMs`. Both
  `mergeRunnerItem` call sites `withLockRetry` wraps go through this path,
  so the same free data is available regardless of which caller
  (`claimWork` or `mergeRunnerItem`) is being retried.
- `docs/history/lock-status-visibility/CONTEXT.md` (tsk-5z2, delivered) —
  confirms scope was the immediate failure messages + `fgos lock-status`
  verb, never `lock-wait.mjs`'s own retry-loop progress line. No overlap.
- `docs/history/tsk-2qp-approve-lock-merge-commit-guard/` (status:
  `retrospective`, i.e. delivered) — a different concern entirely (lock's
  held span not covering the git merge/commit sequence). No scope overlap
  with this item's polling-visibility concern.
- `test/runner/lock-wait.test.mjs` exists — real verify target for a change
  scoped to `lock-wait.mjs`.

**Found:**

- The item's own "improvement direction" (surface an ETA, or a
  live-vs-stale framing) is achievable by *reading fields already computed
  and attached to the error object on every retry attempt* —
  `err.remainingTtlMs` (ETA to the lock's own TTL expiry, i.e. the point a
  waiter could reasonably switch from "likely fine" to "may be stale,
  consider fgos-unlock" framing) and `err.lockAgeMs`. No new
  instrumentation, no new call to `inspectMainCheckoutLock`/`fgos
  lock-status`, and no change to the backoff cadence itself is needed to
  close the gap the item describes — this is a narrow, contained fix to
  `lock-wait.mjs`'s existing progress-line print (line 104-106), reusing
  `formatLockDurationMs` (already imported transitively via the error
  construction, exported from `main-checkout-lock.mjs`) for formatting.
- The item's description cites the lock as expiring after "5 minutes" —
  stale; `DEFAULT_TTL_MS` is 3 minutes as of 2026-07-29 (confirmed
  `main-checkout-lock.mjs:110` + changelog comment). Not load-bearing for
  scope, just a citation to correct if referenced during planning.
- No duplicate/conflicting in-flight work found: `tsk-5z2` (message
  surfacing) and `tsk-mgb` (progress-line-print-cadence bugfix, referenced
  in `lock-wait.mjs`'s own comments) both already landed and cover
  adjacent-but-distinct gaps; this item's specific gap (the retry loop's
  own progress line never reading the ETA fields already on `err`) remains
  open.

**Still open:** none — evidence is sufficient to close discovery `clear`.
Exact wording/threshold for the "likely fine" vs "may be stale" framing
switch (e.g. whether to switch framing once `remainingTtlMs` drops below
some fraction of the TTL window) is an implementation-detail decision for
`planning`/`executing`, not a blocking ambiguity for discovery.
