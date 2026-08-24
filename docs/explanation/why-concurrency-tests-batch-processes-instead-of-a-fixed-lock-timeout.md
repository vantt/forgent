---
type: explanation
title: Why concurrency tests batch processes instead of relying on a fixed lock timeout
tags: [testing, concurrency, flake, events-lock, contention]
source_capture_ids: [tsk-4fx, tsk-2va]
authoritative_for: why fgOS's concurrency tests batch spawned processes to reduce peak events.lock contention instead of scaling the lock-timeout budget
---
# Why concurrency tests batch processes instead of relying on a fixed lock timeout

`tsk-4fx`. During the worker-slot batch, up to four concurrency tests
(`test/state/store.test.mjs`, `test/state/porting-store.test.mjs`)
went red under machine load — measured at load average ~33, and green
again around ~20 — all timing out on a fixed 2000ms `events.lock`
acquisition.

## Confirming this was standing fragility, not a regression

An A/B check settled the question with evidence rather than assumption:
with the new test file moved entirely out of the tree, the *same* tests
still failed on the otherwise-unchanged tree. The flakiness predated the
change under review; it was not caused by it.

## Why "just a flaky test" undersells the real cost

Standing fragility here is expensive in two distinct ways: it costs a
real rerun every time someone happens to verify under load, and — the
sharper cost — it trains a reader to treat a few red concurrency tests as
background noise, which is exactly the condition under which a genuine
new failure gets waved through unnoticed.

## The fix: reduce peak contention, not stretch the timeout

Rather than scaling the lock-acquisition budget to whatever contention
happens to be observed (which just moves the same problem to a higher
load average), the fix batches the spawned test processes — capping how
many processes race for the same `events.lock` at once — to reduce peak
simultaneous contention directly. The comment landed in the test file
itself makes the reasoning explicit: process volume is kept well under
the lock's own 2s timeout (`events.mjs`'s `EVENTS_LOCK_TIMEOUT_MS`)
deliberately, because a higher process×edit count was tried and produced
genuine lock-timeout contention *unrelated* to the actual race the test
exists to reproduce — more processes made the test flakier without
making it a better proof of the thing it targets.

## Why this direction over a bigger timeout

A larger fixed timeout (or a timeout that scales with observed
contention) treats the symptom — this specific number of processes on
this specific machine happens to be slow right now — rather than the
actual cause, which is that the test's own process count was pushing
real contention past what the lock's design timeout was ever meant to
absorb. Capping batch size keeps the test's assertions meaningful (it
still genuinely races multiple processes against the same lock) while
keeping the race itself inside the timeout the lock is supposed to work
under in normal operation — the same target the fix intends production
code to actually meet.

## Follow-up: the task id itself didn't belong in the comments (`tsk-2va`)

`tsk-4fx`'s own merged commit left the literal string `"tsk-4fx"` inline
in four code-comment lines across the two affected test files (two
doc-comments describing the new `batchSize` param, two call-site
comments explaining why the flaky sites use `4`). That violates this
repo's own stable-code-artifacts rule: a plan/finding id in a code
comment rots as the codebase evolves, and the invariant should be
explained directly rather than pointed at by label — the item itself
already carries the full rationale. **Fix**: reword all four comments to
explain the invariant directly (why `batchSize` exists, why these
specific call sites use `4`) without citing the task id. The
`docs/history/tsk-4fx-.../RESEARCH.md` path references in the same
comments were kept — a real, permanent doc path is not the same class of
artifact as a bare task-id label.
