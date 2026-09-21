# 3.13/4.11 flake corpus investigation: found and fixed a live production bug

**Date:** 2026-09-21
**Scope:** `plans/reports/test-suite-cost-brainstorm-260920.md` items 3.13
(historical fault corpus) and 4.11 (flake tax accounting).

## What was read

5 existing flake-incident docs in `docs/history/`:
`events-lock-concurrency-test-flake`, `tsk-1dsz-coexistence-canary-footprint-flake`,
`tsk-1u7-session-lock-contention-flake`, `tsk-4fx-concurrency-test-lock-timeout-flake`,
`tsk-597-porting-store-race-test-load-flake`.

## Two threads, not one

**A — TOCTOU lock-file race (the real find).** `fs.openSync(lockPath, 'wx')`
followed by a *separate* `fs.writeSync` leaves a window where the lock file
exists but is empty; a concurrent reader landing in that window sees
unparseable content, misjudges a live holder as a stale crash leftover, and
reclaims (deletes) a lock another process still legitimately holds. Found
and fixed twice already in this repo — `src/state/events.mjs`'s
`tryAcquireEventsLockOnce` (tsk-3ld) and `src/runner/session.mjs`'s
`tryAcquireOnce` (tsk-1u7), both via the same remedy: write the pid to a
per-attempt temp file, then `fs.linkSync` it onto the real lock path
(`link()` never exposes a partially-written target — POSIX-atomic by
construction). tsk-1u7's own plan.md explicitly named `src/runner/loop.mjs`'s
`acquireRunnerLock` — the function BOTH siblings' own doc comments say they
mirror the shape of — as the one sibling still carrying the original bug,
out of that item's scope. It was still there, unfixed, live in production
code, as of this investigation.

**B — shared `events.lock`/2000ms-budget contention.** Three separate
incidents (`events-lock-concurrency`, tsk-4fx, tsk-597) hit the same
mechanism and independently invented three different bespoke fixes (shrink
test N, batch-start children, retry-on-category). Real effort duplication,
but each fix is legitimately test-shape-specific — no shared helper exists,
and none is obviously wrong to have separately.

`tsk-1dsz-coexistence-canary-footprint-flake` never reproduced and closed
`wontfix` — no actionable pattern.

## Fix applied

Ported the identical `linkSync`-atomic-create pattern into
`acquireRunnerLock` (`src/runner/loop.mjs`), matching the two siblings'
existing shape exactly (temp file write, then atomic link, `EEXIST` falls
through to the existing stale-pid-reclaim logic, unchanged). Zero change to
the function's external contract (`{acquired, lockPath, release}` /
`{acquired: false, holderPid, ...}`).

A fourth candidate, `src/runner/dispatch/provider-capacity.mjs`'s
`withFileLock`, has the same syntactic shape (`openSync('wx')` + separate
write) but was traced and ruled out: it never reads its own lock file's
content back anywhere — no stale-reclaim decision is ever made from it, so
an empty-content read (even if it occurred) has no consequence. Left
unchanged; documented here as checked, not skipped.

## Test coverage

Added `test/runner/lock.test.mjs`'s "concurrent acquireRunnerLock from real
separate OS processes" test: 50 real child processes race the same lock
with a shared start barrier, the winner deliberately holds (sleeps) before
releasing so a loser observing a dead/stale holder while the real winner is
still alive is unambiguously the TOCTOU failure shape, not a legitimate
crash-cleanup. **Honest caveat**: the actual vulnerable window is two
syscalls wide (microseconds), so this test reproduces the pre-fix bug only
probabilistically — spot-checked manually at roughly half of ~15 repetitions
against the unfixed code, 0 failures across an equal number against the fix.
Not a deterministic regression gate; the fix's correctness rests primarily
on being the identical, twice-already-proven pattern and POSIX's `link()`
atomicity guarantee, not on this test alone.

Verified clean: `test/runner/lock.test.mjs` (9/9, several repeated runs),
`test/runner/loop.test.mjs` (103/103), `test/runner/operation-choice.test.mjs`
+ `test/runner/anti-loop.test.mjs` (183/183).

## Thread B — not pursued

No shared helper was built for the `events.lock` contention pattern (3
independent bespoke fixes). Each fix is genuinely shaped by its own test's
N/failure-signature; forcing a shared abstraction here without a concrete
fourth recurrence would be premature generalization. Left as a documented,
not actioned, observation.

## Remaining risk / explicit deferred work

- The concurrent-process regression test is probabilistic, not
  deterministic — a future regression in this exact function could pass CI
  by luck. No stronger deterministic reproduction technique was found
  within this investigation's scope.
- Thread B (events.lock contention) has no shared remedy; left as-is.
