---
authoritative_for: session-identity 3-hop pid-walk flaky test under heavy load, execFile timeout injection, third instance of the real-timer test-flake class
---

# A third real-timer flaky test, and a different fix shape than the first two

`tsk-5n6` closed a real, live-confirmed flake in
`test/util/session-identity.test.mjs`'s `"3-hop walk reaches the real
ancestor across a spawned process chain"` test — the **third** distinct
file hit by the same class of flake already tracked for
[`test/runner/dispatch.test.mjs` (`tsk-2y1`)](spawnworker-idletimeout-flaky-test-margin.md)
and `test/state/porting-store.test.mjs` (`tsk-597`): a test using real
wall-clock/process-scheduling timing, prone to spurious failure under
heavy system load.

## Confirmed live, twice, same day

During `tsk-1wdf`'s own return/approve/catchup cycle (2026-08-20), this
exact test failed twice during concurrent full-suite `npm test` runs
launched back-to-back under heavy load — once expecting a resolved pid
and getting `source: 'unresolved'` instead, then again with a different
pid pair. Both times it passed cleanly (24/24, ~400-1400ms) when the same
file was rerun in isolation immediately after. Confirmed a genuine
machine-timing flake, not a regression: nothing in either failing
session's diff touched `src/util/session-identity.mjs` or the pid-walk
machinery. Same cost shape as the other two instances: an unrelated
single-test failure inside a 3700+-test verify run parks a real,
unrelated item at `fgos approve`/`return` with a verify-fail reason,
forcing a manual diagnose-isolate-rerun-recover cycle that itself burns
another multi-minute full-suite run.

## What shipped — a different fix shape than `tsk-2y1`'s margin widening

Rather than widening a timing margin, the fix injects an explicit,
generous timeout into the pid-walk's own subprocess lookups: the test now
passes `resolveWriterIdentity` a custom `execFile` implementation
(`(file, args, options) => execFileSync(file, args, { ...options, timeout:
2000 })`) instead of relying on whatever default the function's own
internal `execFile` call used. Under heavy system load, the real `ps`/
`/proc` lookups the pid-walk depends on could apparently take long enough
to hit a short internal default and fall back to `unresolved` — the
2-second explicit timeout gives those lookups real headroom without
changing what the test actually asserts (the exact real ancestor pid
across a 3-hop spawned chain).

## The pattern across all three instances

Three separate items (`tsk-2y1`, `tsk-597`, `tsk-5n6`) each found and
fixed one real-timer-dependent test independently, in different files,
on different days, all traced to the same underlying class: a test
asserting exact behavior against real OS process/timer scheduling instead
of a deterministic clock or an injected timeout, made spurious purely by
concurrent system load rather than any real code regression. No single
item attempted a repo-wide sweep for more instances of this pattern —
each closed only the one instance it had live evidence for.
