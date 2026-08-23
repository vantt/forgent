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
| D2 | The race-test's session-count parameter should be scaled to **≥20 concurrent `fgos` processes** — the user's real minimum concurrent-window count (8 windows observed live, ~15-20 typical) — as headroom for the ablation proof (D1), not because real write-contention has been observed at that level (measured: it has not, see scout evidence below). Any close-out must run the D1 ablation at ≥20 concurrent processes, not just the test's current 6. |

## Pinned terms

- **Scenario (a)**: a genuine race window in `acquireEventsLock`/
  `tryAcquireEventsLockOnce` (`src/state/events.mjs:203-292`) that can
  produce duplicate/out-of-order `seq` values under real concurrent load.
- **Scenario (b)**: the lock is correct; the test's synthetic load (6 forked
  processes × 40 back-to-back appends, no delay, on a machine already
  saturated by two parallel full-suite runs) exceeds any load the lock needs
  to survive in real operation, making the test itself the fragile part.
- **"Normal operation"**: per D2, the D1 ablation proof must be run at ≥20
  concurrent `fgos` processes (session-count headroom), not the L3
  write-contention threshold — measured real write pattern (below) does not
  show that threshold crossed.

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
  right now; user reports 8 windows minimum, ~15-20 typical in real usage.
- `.fgos/events.jsonl` measured directly (557 events, 2026-07-16 to
  2026-07-29): 42% of consecutive-event gaps are under 1s, but inspecting
  the 195 pairs under 50ms shows 170 (87%) share the SAME item id (one verb
  call writing several related events back to back — e.g. `work.add` of N
  children, or `work.move`+`work.outcome` in one transition — single
  process, not contention) and the remaining 25 cross-id pairs match a
  single script/loop editing several sibling items sequentially (e.g.
  `work.edit tsk-3oa → tsk-4mo → tsk-1nu → tsk-2r4`, ~46ms apart each,
  2026-07-28T10:20:03). **No pair in 557 events shows two independent
  processes writing at genuinely the same instant.** L3's reopen threshold
  ("nhiều agent ghi đồng thời như tải chính", `docs/platform-foundations.md`
  line 92-95) requires real concurrent WRITE contention, distinct from
  concurrent SESSION count — measured data shows session count is high
  (D2) but write bursts remain effectively single-writer-at-a-time. L3 is
  NOT triggered by this item; user also confirms no felt write-side
  bottleneck, only test-side flakiness. This also further supports D1
  leaning toward (b): the test's synchronized-to-the-millisecond 6×40 burst
  doesn't resemble any real write pattern observed in 13 days of usage.

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
  slow/flaky for everyone — implementation choice, left to `fgos-coding-planning`.
- If scenario (a) is confirmed (a real race under ≥20-concurrency load): the
  specific code fix to `acquireEventsLock`/`tryAcquireEventsLockOnce` —
  implementation work, left to `fgos-coding-planning`.
- If scenario (b) is confirmed: whether the remedy is loosening the test's
  threshold/retry, or excluding this test from the default full-suite run
  (behind a flag) — the item's own description already poses both as valid
  options; picking between them is implementation/workflow judgment left to
  `fgos-coding-planning`, informed by whatever the D1 reproduction actually shows.
