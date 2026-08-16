# CONTEXT: lock-wait's progress line never prints, and it busy-spins at the tail

Item: `tsk-mgb`. Written retroactively (same structural gap as this scan's
other items). Personally reproduced by this session multiple times while
working the rest of this same backlog: every `fgos pick` blocked on lock
contention printed nothing but a stray `TimeoutNegativeWarning`, exactly
matching this item's own evidence.

## Locked decisions

- **D0 (bug 1 — progress line).** Root cause confirmed by reading
  `src/runner/lock-wait.mjs:76` in full: the print guard is `delayMs > 0
  && elapsedMs >= originalRemainingTtlMs`. On the default (no explicit
  `waitMs`) path, `budgetMs === originalRemainingTtlMs` (:56). `delayMs =
  min(scheduleValue, budgetMs - elapsedMs)` (:67) — once `elapsedMs >=
  originalRemainingTtlMs` (== `budgetMs`), `budgetMs - elapsedMs <= 0`, so
  `delayMs <= 0`. The two conjuncts are mutually exclusive by construction
  on this path: `delayMs > 0` requires `elapsedMs < budgetMs`, but the
  second conjunct requires `elapsedMs >= budgetMs`. Never both true. The
  gate's own doc comment (:68-75, tsk-2rf D4) explains its INTENT: print
  only once a wait extends PAST where the old default behavior would
  already have given up — a real, reasonable goal for the *explicit-
  `waitMs`* case (where `budgetMs > originalRemainingTtlMs`, so that
  window genuinely exists). But applied unconditionally, it silences the
  progress line entirely on the default path, which has no such "extended"
  region to begin with — exactly the path most likely to need feedback
  (every `pick`/`take`/`approve` without `--wait`).
- **D1 (bug 2 — busy-spin).** Once `elapsedMs` exceeds `budgetMs` (but not
  yet `budgetMs + BOUNDARY_GRACE_MS`, the intentional 250ms landing window
  documented at :9-17), `budgetMs - elapsedMs` goes negative. `delayMs =
  min(scheduleValue, negative)` is negative. `setTimeout(resolve,
  negativeMs)` — Node clamps a negative delay to ~0-1ms (confirmed live
  this session, `TimeoutNegativeWarning: X is a negative number. Timeout
  duration was set to 1.`) instead of the single, deliberate "one more
  attempt landing just past the boundary" the 250ms grace window's own
  doc comment describes. Every subsequent loop iteration recomputes the
  same negative `delayMs`, so the loop calls `fn()` (a full `claimWork`
  attempt) back-to-back with near-zero real delay until `elapsedMs`
  finally crosses `budgetMs + BOUNDARY_GRACE_MS` — measured at 233 full
  attempts for a 3-second wait in the scan report.
- **D2.** Fix for both, in the same small change: once `budgetMs -
  elapsedMs` is no longer positive, sleep out exactly what's left of the
  250ms grace window (`max(0, budgetMs + BOUNDARY_GRACE_MS - elapsedMs)`)
  instead of the schedule-derived (possibly negative) delay — this
  guarantees exactly one more bounded sleep before the exhaustion check's
  next pass, never a busy-spin. Then simplify the print guard to `delayMs
  > 0` alone (drop the `elapsedMs >= originalRemainingTtlMs` conjunct) —
  with D2's own delay fix, `delayMs > 0` now correctly covers every real
  sleep on both the default and explicit-`waitMs` paths, including the
  final grace-window sleep, with no separate "extended wait" gate needed.
- **D3.** Existing tests (`test/runner/lock-wait.test.mjs`) checked in
  full: none assert on `stderr` content, and the two budget-exhaustion
  tests (`:30-44`, `:109-126`) only assert loose lower bounds on call
  count (`calls >= 2`, `calls >= 1`) — both still satisfied under the
  fixed delay computation (worked through by hand: the short-budget test,
  900ms budget + 250ms grace, now makes exactly 4 calls instead of an
  unbounded busy-spin count; still `>= 2`). No existing test needs
  editing.

## Outstanding questions

None
