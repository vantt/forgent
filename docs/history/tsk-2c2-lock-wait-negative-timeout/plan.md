---
type: plan
title: tsk-2c2 — clamp lock-wait's backoff delay to non-negative
tags: []
source_capture_ids: [tsk-2c2]
---

# tsk-2c2 — clamp lock-wait's backoff delay to non-negative

Mode: tiny (1 file, 1 root-cause line + 1 pure-function extraction for
testability — no gray area, no split candidate). No `CONTEXT.md` — intent
was clear at `clarify`, root cause already found and cited by line number
before this plan was written.

## Root cause (found before writing this plan, `src/runner/lock-wait.mjs:67`)

```js
const delayMs = Math.min(BACKOFF_SCHEDULE_MS[Math.min(attempt, BACKOFF_SCHEDULE_MS.length - 1)], budgetMs - elapsedMs);
```

The exhaustion check just above it (line 59) only throws once
`elapsedMs >= budgetMs + BOUNDARY_GRACE_MS` (a deliberate 250ms grace
window, per the file's own D-cited comment). Between `elapsedMs > budgetMs`
and that throw point, `budgetMs - elapsedMs` is negative, so `delayMs`
itself goes negative and flows straight into `sleep(delayMs)` →
`setTimeout(resolve, delayMs)`. Node clamps to 1ms and only warns — this
never breaks the retry (confirmed: `tsk-2au`'s own claim succeeded despite
hitting this exact warning) — but it's a real, reachable defect: the
intended output is 0 (already unlocked / already fresh-check time), not a
negative number silently deferred to a runtime clamp.

Reproduced twice, independently: `tsk-621`'s approve retries (`-1 is a
negative number`, this item's own original description) and `tsk-2au`'s
`fgos pick` (`-40 is a negative number`, this session).

## Approach

Extract the delay computation into its own exported pure function,
`computeDelayMs(attempt, budgetMs, elapsedMs)`, and clamp its result with
`Math.max(0, ...)`. Two reasons to extract rather than just adding
`Math.max(0, ...)` inline:

1. The bug is timing-dependent to reproduce through the real `withLockRetry`
   loop (needs `elapsedMs` to land in a ~250ms window past `budgetMs`) —
   flaky by construction with real timers. A pure function taking `attempt`/
   `budgetMs`/`elapsedMs` as plain numbers is exactly and reliably testable
   with no timing involved at all.
2. Matches this codebase's own established pattern for exactly this
   situation — `classifyIronLaw`, `canAutoApprove`, `computeSchedule`, etc.
   are all pure functions extracted from a larger flow specifically so they
   can be unit-tested without reproducing the whole surrounding process.

No behavior change for the non-negative case: `Math.max(0, x)` is a no-op
whenever `x >= 0`, which is every case except the boundary-grace window
this item exists to fix.

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| Extraction accidentally changes delay in the normal (non-negative) case | low | existing `test/runner/lock-wait.test.mjs` suite (8 tests, timing-sensitive, already covers retry/backoff/budget-exhaustion end to end) must still pass unchanged |
| Clamp itself could be wrong (e.g. off-by-one) | low | direct unit test: `computeDelayMs(0, 100, 140)` must equal `0` (mirrors the real `-40` case: `budgetMs=100, elapsedMs=140` in the loop's own variable names) |

Impact-analysis: not run — isolated pure-function extraction inside one
file, no call-graph question (`impact-analysis: inactive` for this item's
own scope, `withLockRetry`'s only caller sites are unaffected — same
signature, same external behavior for every already-tested case).

Files touched: `src/runner/lock-wait.mjs`, `test/runner/lock-wait.test.mjs`.

## Shape

1. In `src/runner/lock-wait.mjs`, extract the delay computation (currently
   inline at the loop's `delayMs` line) into:
   ```js
   export function computeDelayMs(attempt, budgetMs, elapsedMs) {
     const scheduled = BACKOFF_SCHEDULE_MS[Math.min(attempt, BACKOFF_SCHEDULE_MS.length - 1)];
     return Math.max(0, Math.min(scheduled, budgetMs - elapsedMs));
   }
   ```
   and call it from the loop: `const delayMs = computeDelayMs(attempt, budgetMs, elapsedMs);`
2. In `test/runner/lock-wait.test.mjs`, add a direct unit test importing
   `computeDelayMs` and asserting the clamp: a case reproducing the real
   `-40` observation (`budgetMs=100, elapsedMs=140` → must equal `0`, not
   `-40`), plus one case where the raw subtraction is already non-negative
   (proving the clamp is a true no-op there, not just always returning 0).

Proof surface: `node --test test/runner/lock-wait.test.mjs` (already the
item's own real, existing test file — the item's `verify` updates from its
original placeholder to this).

## Outstanding questions

None
