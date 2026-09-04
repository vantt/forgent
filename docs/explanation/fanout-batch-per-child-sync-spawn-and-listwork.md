---
authoritative_for: fanoutBatchExecutorCli's per-child listWork(fgosDir) reread inside the batch dispatch loop instead of reusing the once-read slotsView; the rejected non-blocking-git-attestation sub-fix that breaks a pinned synchronous-throw contract; the false-positive merge-integrity-check bypass this item's own approve hit (same pattern as tsk-gb3/tsk-52p)
---

# One narrow fix landed from a three-part fanout-batch performance proposal — the other two stayed out for good reasons

`tsk-2ewi` investigated three efficiency issues in
`fanoutBatchExecutorCli` (`src/runner/dispatch/cli.mjs`, ~731-847):
per-child `execFileSync('fgos pick <id>')`/`execFileSync('fgos return
<id>')` subprocess spawns (blocking, ~100-300ms+ cold-start each), a
per-child `listWork(fgosDir)` full-state reread inside the batch loop
instead of once for the whole batch, and synchronous-blocking git
attestation. Only the second issue shipped as a real fix in this item.

## Sub-fix 1 — shipped

`fanoutBatchExecutorCli`'s per-child map body read `listWork(fgosDir)`
fresh for every candidate in the batch, even though the batch's slots view
had already been read once before the loop. The fix reuses that once-read
`slotsView` instead:

```diff
- const workItem = listWork(fgosDir).work[candidateId];
+ const workItem = slotsView.work[candidateId];
```

## Sub-fix 2 — investigated and rejected this round

Making git attestation non-blocking (async) was rejected after a reality-gate
check in `fgos-coding-validating`: converting `resolveExecutorCommand`
(or its callers, `spawnWorker`/`executeExecutorCli`) to async breaks a
pinned synchronous-throw contract — `dispatch.test.mjs:2867-2871` asserts
`spawnWorker throws a RunnerConfigError ... before any spawn`, and any
async function's thrown errors become rejected Promises, not sync throws,
regardless of which caller is converted. The git subprocess cost itself is
single-digit ms, dwarfed by the item's own cited ~100-300ms+ cold Node
pick/return starts — disproportionate risk for the ROI. Dropped from this
item's scope.

## Sub-fix 3 — named follow-up, not attempted

In-process `pick`/`return` (importing directly instead of spawning a child
CLI process) stays an open follow-up proof point. The item's own
description flags this explicitly as a design-check, not a mechanical fix:
confirming `pick`/`return` don't rely on the process isolation a subprocess
spawn currently provides incidentally (the same lesson a separate `agy`
cwd-bug incident already surfaced) needs to happen before this is safe to
attempt.

## Same drive, another confirmed instance of the missing-evidence pattern

This item's own out-of-process worker (`agy`/gemini) committed the sub-fix
1 change but returned an `iron-law-evidence.md` with only the passing-after
transcript, no failing-before — the driver had to reproduce the real
before/after recipe by hand. This is the third live-confirmed instance
documented on [`tsk-3ys`](worker-prompt-iron-law-evidence-timing.md); not
repeated in full here.

## The merge itself hit a known false-positive integrity check

Landing this item's merge required working around a separate, already-known
bug: `approve --acknowledge-iron-law` parked on a merge-integrity check that
produced the same false-positive shape already confirmed on `tsk-gb3`
(tracked as `tsk-52p`). After confirming the real git-level merge had
already landed correctly on main (commit `c7b83ba6`, with the
`slotsView` reuse present and correct), the item's status was corrected
`blocked → delivered` via a direct `fgos move`, under the same standing
user authorization already covering this exact bypass pattern. Not this
item's own bug — named here because it happened during this item's own
landing, and `tsk-52p` is the tracked fix for the underlying false
positive.
