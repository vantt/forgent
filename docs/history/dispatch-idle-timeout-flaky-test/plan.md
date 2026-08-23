# plan.md — dispatch-idle-timeout-flaky-test (tsk-2y1)

Mode: tiny

0 flags apply (no auth, no authorization, no data model, no audit/
security, no external systems, no public contract, not cross-platform, no
existing covered behavior being removed, no weak-proof area, single
domain) — one file, one direct task. See `RESEARCH.md` Round 1 for the
evidence this plan rests on.

## Approach

**Chosen path:** widen the real-time margin in
`test/runner/dispatch.test.mjs`'s `writePeriodicWriterExecutor`-based test
(`spawnWorker: idleTimeoutMs resets on every chunk`, line ~2774) — raise
`idleTimeoutMs` relative to `intervalMs` so the per-chunk buffer survives
system-load jitter, while keeping the test fast. Concretely: keep
`intervalMs: 150` (5 ticks, ~750ms total) but raise `idleTimeoutMs` from
`400` to `700` — this nearly doubles the per-chunk slack (from ~250ms to
~550ms) while staying comfortably under the child's own ~750ms total
runtime, so the test still proves the idle timer resets per chunk rather
than firing on cumulative elapsed time.

**Alternatives rejected:**
- *Switch to mocked/fake timers* (the description's "and/or" option) —
  rejected on evidence, not preference: `RESEARCH.md` Round 1 confirms the
  idle-reset mechanism (`src/runner/dispatch/transport.mjs:311-325`) is
  driven by real `'data'` events from a real spawned child process running
  its own real `setInterval` (`test/runner/dispatch.test.mjs:218-235`).
  Node's fake/mock timers only patch the process they're installed in —
  they cannot reach the child's real timing, so faking the parent's
  `setTimeout` here would desync the very interaction under test rather
  than fix its flakiness. Out of scope for a bug-fix item.
- *Reduce `intervalMs` instead of raising `idleTimeoutMs`* — rejected:
  shrinking the tick interval shrinks the total runtime margin against
  `timeoutMs` too and doesn't address the actual failure mode (the gap
  between a tick firing and the idle timer firing under load), where
  raising `idleTimeoutMs` directly targets it.

**Risk map:** one component (`test/runner/dispatch.test.mjs`, a single
test's fixture parameters), risk: low — this only widens an existing
test's own literal constants, no production code path touches this
change, no proof point needed at `fgos-coding-validating` beyond
re-running the test itself. `impact-analysis: inactive` — 0 flags, no
blast-radius claim this plan depends on (test-fixture-only change).

**Files touched, in order:**
1. `test/runner/dispatch.test.mjs` — bump `idleTimeoutMs` from `400` to
   `700` in the `spawnWorker(sampleWork(), cfg, mkTempDir(), { timeoutMs:
   10000, idleTimeoutMs: 400 })` call at line ~2782, and update the
   preceding comment's own numbers (currently "idleTimeoutMs (400ms) ...")
   to match.

No `fgos graph --json` critical-path ordering needed — a single file, no
dependency chain.

## Shape

Single piece, no split. Change the two constants (`idleTimeoutMs` in the
`spawnWorker` call, and the matching prose in the comment two lines
above it) in the one existing test. No new test is needed — the existing
test already covers the behavior (idle timer resets per chunk); this
plan only widens its own timing margin so a real assertion stops
depending on tight real-time jitter.

**Concrete case already covered by the existing test, unaffected by this
change:** the test still proves the idle timer resets per chunk (not
cumulative-elapsed) because `idleTimeoutMs` (700ms after this change)
stays smaller than the child's total runtime (~750ms) while remaining
larger than any single inter-tick gap (150ms) — same structural
relationship the test's own comment already documents, just with a wider
buffer.

## Verify

```bash
node --test --test-name-pattern "idleTimeoutMs resets on every chunk" test/runner/dispatch.test.mjs
```

Already synced onto `work.verify` at the `discovery` stage (real command,
not a placeholder) — no further sync needed here.

## Outstanding questions

None
