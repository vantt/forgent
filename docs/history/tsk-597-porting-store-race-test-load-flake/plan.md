# Plan: tsk-597 — tolerate a lock-timeout result in porting-store's race tests

Mode: **small** (direct-entry fallback). Flags: "existing covered
behavior" (the two race tests are real, load-bearing regression coverage
for tsk-1jp's own fix) + "weak proof around the area" (concurrency/timing
tests are inherently subtle) → 2 flags → arguably standard, but the
actual diff is a small, self-contained, test-only retry wrapper touching
one file — recorded as **small** since Shape's own size, not flag count
alone, is what the lane exists to communicate to a reader (`fgos-
routing`'s own mode gate: flag count is a floor, not a ceiling on
judgment for a genuinely small, well-bounded diff).

No `CONTEXT.md` — discovery verdict came back `clear`. Evidence base is
`RESEARCH.md`.

## Approach

**Confirmed (RESEARCH.md Round 1).** tsk-1jp's own product-side fix
(wrapping porting-store's read-check-append in one lock scope) is
confirmed on `main`. The remaining defect is the TEST's own
load-sensitivity: `test/state/porting-store.test.mjs`'s two race tests
(`addPorting`/`movePorting` "under concurrent OS processes") already use
`N = 8` — already at the same stampede-minimum tsk-3wn's own fix
established (`8 × 15` there), so there is no queue-depth slack left to
cut the way tsk-3wn cut `20 × 40 → 8 × 15`. tsk-1u7 is a cautionary
precedent (an assumed test-only issue turned out to be a real bug), not a
template — it does not apply here since tsk-1jp's own fix is already
independently confirmed real and landed.

**Fix: make the test tolerant of a `'lock-timeout'`-categorized result,
specifically, never any other failure shape.** `raceAcrossProcesses`'s
child script already forwards `err.category`
(`porting-store.test.mjs:55`). `EventLogError('lock-timeout')`
(`events.mjs:379`) is a stable, distinct category — an environmental "the
lock wasn't free within its budget" signal, never a statement about a
legitimate race outcome. Today a `'lock-timeout'` result fails the test's
own `assert.equal(f.category, 'validation'|'conflict', ...)` line
exactly like a real regression would, because the test cannot currently
tell the two apart. Add a bounded retry (fresh temp dir, up to 2 extra
attempts) around each race test, triggered ONLY when a `'lock-timeout'`
category appears among the results — never when the failure is a genuine
assertion violation (wrong success count, or a wrong category on an
expected loser). This preserves full sensitivity to a real regression
(a genuine race-condition reintroduction still fails on attempt 1 with a
`'validation'`/`'conflict'`-shaped wrong count or, if `tsk-1jp`'s own fix
regressed, TWO successes — neither of which is a `'lock-timeout'` and
neither triggers a retry).

**Why this differs from "just retry the red state" (`fgos-coding-
implement`'s own guidance).** That guidance is about a PRODUCTION
`return` verify retried blind, hoping the same uninvestigated red state
turns green — exactly the failure mode this item's own report describes
happening today at the merge gate. This fix is the opposite: it is what
makes that blind, uninvestigated retry unnecessary, by giving the TEST
itself a principled, narrowly-scoped, already-categorized signal to
distinguish "the environment was briefly too slow" from "the code is
actually broken" — never masking the latter.

**Why not exclude the tests from the merge-verify path instead** (the
item's own second suggested direction). Rejected: tsk-1u7's own story is
direct evidence that hastily removing a concurrency test's coverage on
every merge can hide a real regression. The lock-timeout-only retry
keeps full coverage on every merge while removing exactly the load-noise
component, at lower risk than reducing what runs.

**Proof point.** `impact-analysis`: not applicable — test-only change, no
`src/` symbol touched.

**Empirical constraint, stated plainly.** This machine has another live
session actively working right now (confirmed: `tsk-1yt` status `doing`;
this item's own claim waited ~137s on a real held `main-checkout.lock`).
Deliberately inducing heavy CPU/IO load to reproduce the exact flake was
not attempted, to avoid disrupting that session. The fix is grounded
instead in: (a) the already-defined, stable `'lock-timeout'` category
contract (`events.mjs:54-56`), (b) the item's own detailed real-incident
evidence (single test red, `errorClass verify-fail-post-merge`, isolated
run clean, retry clean, whole-suite ~3.4x slower), and (c) the arithmetic
case in RESEARCH.md finding 5 for why per-acquisition time (not queue
depth) is the plausible mechanism at N=8.

## Shape

One piece, pass-through (no split). File touched:
`test/state/porting-store.test.mjs`.

```js
// New helper, near raceAcrossProcesses:
async function raceAcrossProcessesTolerantOfLockTimeout(makeDir, storeCall, nProcesses, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const dir = makeDir();
    const results = await raceAcrossProcesses(dir, storeCall, nProcesses);
    const sawLockTimeout = results.some((r) => !r.ok && r.category === 'lock-timeout');
    if (!sawLockTimeout || attempt === maxAttempts) return { dir, results };
  }
}
```

Both race tests call this instead of `raceAcrossProcesses` directly,
passing a `() => tmpDir()`-shaped factory (each retry needs its own fresh
temp dir/store) and asserting against the returned `results` exactly as
today. `maxAttempts = 3` mirrors tsk-3wn's own "three consecutive clean
runs" proof-of-determinism scale, applied here as a retry ceiling rather
than a manual verification loop.

### Cases this needs to hold for

- No `'lock-timeout'` in the results (the common case) — behaves
  byte-identical to today, first attempt only.
- A `'lock-timeout'` on attempt 1, clean on attempt 2 — test passes,
  using attempt 2's results.
- `'lock-timeout'` on every attempt up to `maxAttempts` — test fails with
  the last attempt's own results, same assertion messages as today (never
  silently swallowed).
- A genuine regression (e.g. two successes, or a loser with an
  unexpected non-lock-timeout category) — fails on attempt 1, no retry
  triggered, identical failure surface to today.

## Verify

```bash
npm test
```

Regression floor. `test/state/porting-store.test.mjs`'s own two race
tests plus 2-3 new unit tests (added at Implement) exercising the retry
helper directly (a fake single-shot lock-timeout followed by success;
exhausting all attempts still failing) are all part of the suite `npm
test` already runs.

## Outstanding questions

None
