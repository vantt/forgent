# events-lock-concurrency-race — CONTEXT

## Feature boundary

tsk-3ld: `test/state/events.test.mjs:225` ("appendEvent under concurrent OS
processes yields unique, gapless, strictly-increasing seqs") fails
intermittently (~30% of runs) only when run under artificially heavy machine
load (two full test suites in parallel). Isolated runs are clean. This item
covers determining whether that flake exposes a real race in
`src/state/events.mjs`'s `.fgos/events.lock` (scenario a), or whether the
test's induced load is more sensitive than any load the lock needs to
survive in real operation (scenario b) — and closing the gap accordingly.
Out of scope: `tsk-3wr` (illegible test names) and `tsk-34y` (quantify
redundant tests) — thematically related ("test suite quality") but not a
hard dependency, per the item's own description; this item does not touch
either.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Proof bar for closing (a) vs (b): reuse the same ablation technique already validated in `docs/specs/work-state.md` RUL10 at implementation time — stash the `events.lock` patch, run the fork-based race test (`test/state/events.test.mjs:225`) at the load level that reproduces today's flake, confirm it reliably goes RED (proves the race exists without the lock at that load); restore the patch, run again at the same load. If the patched version reliably goes GREEN at that load across repeated runs, that closes the item as (b) — test-oversensitivity, not a lock bug. If the patched version also goes red (even occasionally) under that load, that's (a) — a real race, and the lock needs a fix. |
| D2 | The "normal operation" baseline this item must protect against is explicitly **≥20 concurrent `fgos` worktrees/processes** capable of calling `appendEvent` — raised from the ~10 worktrees observed live in this repo at claim time (`git worktree list`). Any close-out (either "confirmed safe, test is oversensitive" or "fixed the lock") must be validated safe at that concurrency level, not just today's observed ~10. |

## Pinned terms

- **Scenario (a)**: a genuine race window in `acquireEventsLock`/
  `tryAcquireEventsLockOnce` (`src/state/events.mjs:203-292`) that can
  produce duplicate/out-of-order `seq` values under real concurrent load.
- **Scenario (b)**: the lock is correct; the test's synthetic load (6 forked
  processes × 40 back-to-back appends, no delay, on a machine already
  saturated by two parallel full-suite runs) exceeds any load the lock needs
  to survive in real operation, making the test itself the fragile part.
- **"Normal operation"**: per D2, ≥20 concurrent `fgos` worktrees/processes,
  not just the ~10 seen live today.

## Scout evidence cited

- `test/state/events.test.mjs:218-287` — the race test itself: forks 6 real
  child processes (`N_PROC = 6`, `N_APPEND = 40`), synchronizes them to a
  shared start instant via `Atomics.wait`, then asserts every appended `seq`
  is unique/gapless/strictly-increasing. Comment at 218-224 explicitly notes
  this is a "spike-confirmed" real cross-process race, deliberately
  reproduced via forced load since a single-event-loop in-process test can't
  expose it.
- `src/state/events.mjs:23-51` (design comment) and `:203-292`
  (`tryAcquireEventsLockOnce`/`acquireEventsLock`) — the lock is a
  wx-atomic-create + stale-pid-reclaim primitive, a third independent
  instance of the same pattern already proven in `loop.mjs`'s
  `acquireRunnerLock` and `session.mjs`'s `acquireSessionsLock`. Blocking
  retry-with-timeout policy (2s timeout / 10ms retry), deliberately not the
  non-blocking backoff `acquireRunnerLock` uses, because `appendEvent` must
  eventually succeed.
- `docs/specs/work-state.md` RUL10 annotation (~line 977) — documents that at
  implementation time, the same ablation technique (patch removed → race
  test reliably 2/2 red; patch restored → green) was already used to prove
  the lock design correct. Also states the design is only revisited "when
  multiple agents writing concurrently becomes the main load" — a threshold
  the doc frames as not yet reached.
- `git worktree list` at claim time — showed ~10 active `fgw/*` worktrees
  right now, i.e. real concurrent multi-session `fgos` usage already exists
  in this repo today, in tension with RUL10's "not yet reached" framing.
  Per D2, the user wants the bar set higher still: ≥20 concurrent.

## Canonical references

- `src/state/events.mjs` — lock implementation (`acquireEventsLock`,
  `tryAcquireEventsLockOnce`, `appendEvent`, `withEventsLock`).
- `test/state/events.test.mjs:225-287` — the flaky race test.
- `docs/specs/work-state.md` RUL10 and its two annotations (append-lock
  history, store-atomic-rmw follow-up).

## Outstanding questions deferred to planning

- Whether the race-test's own parameters (`N_PROC`/`N_APPEND`, currently
  6×40) should be scaled toward the ≥20-concurrency bar (D2) as part of
  proving D1, and how to do that without making the default `npm test` run
  slow/flaky for everyone — implementation choice, left to `fgos-planning`.
- If scenario (a) is confirmed (a real race under ≥20-concurrency load): the
  specific code fix to `acquireEventsLock`/`tryAcquireEventsLockOnce` —
  implementation work, left to `fgos-planning`.
- If scenario (b) is confirmed: whether the remedy is loosening the test's
  threshold/retry, or excluding this test from the default full-suite run
  (behind a flag) — the item's own description already poses both as valid
  options; picking between them is implementation/workflow judgment left to
  `fgos-planning`, informed by whatever the D1 reproduction actually shows.
