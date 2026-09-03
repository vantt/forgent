---
authoritative_for: spawnWorker idleTimeoutMs resets-on-every-chunk test flake, real-timer margin widening, tsk-vuj concurrent-suite failure incident
---

# A too-tight real-timer margin in a dispatch test caused a real wasted retry cycle

`tsk-2y1` closed a real, live-confirmed test flake:
`test/runner/dispatch.test.mjs`'s `"spawnWorker: idleTimeoutMs resets on
every chunk"` test used real wall-clock timing against a real spawned
subprocess — a 400ms `idleTimeoutMs` budget against a 150ms real tick
interval — instead of mocked/fake timers. The margin depended on actual
OS process scheduling, not a deterministic clock, so it was prone to
spurious failure purely under system load.

## Confirmed live, with a real measured cost

During `tsk-vuj`'s own work (2026-08-20), this exact test failed inside a
concurrent full `npm test` run — `fgos return`'s own re-verify hit a
`DispatchError` worker-timeout, killed at 400ms with no output — but
passed cleanly when re-run in isolation (`node --test --test-name-
pattern`), completing in 1038ms with comfortable margin. This directly
caused an extra ~5-6 minute `fgos return` diagnose-and-retry cycle (move
`blocked` → `doing`, return again) — a cost that would recur for any
future item whenever real system load happened to coincide with this
test running as part of a concurrent verify.

## What shipped

The simpler of the two fix directions the item's own description named:
widened the timing margin rather than switching to mocked/fake timers.
`idleTimeoutMs` in the test moved from 400ms to 700ms, still safely below
the ~750ms total runtime but with a much larger cushion against the
150ms tick interval — the assertion still genuinely proves the idle timer
resets per chunk (rather than firing on total elapsed time), just with
enough slack to absorb real scheduling jitter under concurrent load.
