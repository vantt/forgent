# phase-2-routing-6 — recovery matrix + anti-loop counters

**Status:** [DONE]

**Outcome:** Added two pure runner libs — `src/runner/recovery.mjs` (8-class
recovery matrix incl. the reliability-panel additions `stale-doing` and
`state-conflict`, `resolveAction(errorClass, attempt)`, and
`resolveStaleDoing(hasCommit, verifyPassed)`) and `src/runner/anti-loop.mjs`
(`visitCount` derived from existing `work.move{to:'doing'}` events,
`hasExceededMaxVisits`, and an in-memory per-run `createMissBreaker`). 45 new
tests; suite is 183/183 green (baseline 138 + 45).

**Files touched:** `src/runner/recovery.mjs`, `src/runner/anti-loop.mjs`,
`test/runner/recovery.test.mjs`, `test/runner/anti-loop.test.mjs`.

**Full trace/evidence:** `.bee/cells/phase-2-routing-6.json`
(`trace.verification_evidence`, `trace.verify_output`).

**Commit:** `25e3999` — `feat(phase-2-routing-6): add runner recovery matrix + anti-loop counters`.
