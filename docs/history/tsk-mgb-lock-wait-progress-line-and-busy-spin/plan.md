# Plan: fix lock-wait's dead progress line and tail busy-spin

Item: `tsk-mgb`. Mode: **small** — one function, both bugs share the same
root fix (the delay computation), two new regression tests. No design
question, no split.

## Approach

1. `src/runner/lock-wait.mjs`, `withLockRetry`: replace the delay
   computation so that once `budgetMs - elapsedMs` is no longer positive,
   it sleeps out the remaining `BOUNDARY_GRACE_MS` window instead of a
   possibly-negative schedule-derived value (`CONTEXT.md` D2). Simplify
   the print guard to `delayMs > 0` alone.
2. Tests (`test/runner/lock-wait.test.mjs`):
   - a new test proving the progress line DOES print on the default
     (no `waitMs`) path, by spying on `process.stderr.write` — the exact
     path the scan report found completely silent.
   - a new test proving the tail doesn't busy-spin: a deliberately tiny
     budget (so the old code's negative-delay busy-spin would be
     dramatic and easy to fail on) asserts an UPPER bound on call count,
     not just today's existing loose lower bound.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| Delay computation change | medium — touches the one function every `pick`/`take`/`approve` call path routes through on lock contention | Existing 8 tests in `test/runner/lock-wait.test.mjs` re-read in full and worked through by hand against the new computation (`CONTEXT.md` D3) — none break. New tests proven failing-test-first against the pre-fix code. |
| Print guard simplification | low — no test currently asserts on stderr content, so no existing test can regress | grep confirmed: no `stderr`/`console.error` assertion anywhere in the existing test file |
| Busy-spin fix doesn't change the exhaustion THROW timing/message | low | the exhaustion check itself (`elapsedMs >= budgetMs + BOUNDARY_GRACE_MS`) is untouched — only what happens in the sleep BETWEEN exhaustion checks changes |

Impact-analysis posture: `degraded` — GitNexus `present` (checked via
`fgos tool query --capability impact-analysis --status present`), index
stale. `src/runner/lock-wait.mjs` genuinely is on `MODULE_RULES`
(`src/runner/`), so Iron Law evidence with a real failing-test-first
transcript is the proof surface here, not a skip.

## Outstanding questions

None
