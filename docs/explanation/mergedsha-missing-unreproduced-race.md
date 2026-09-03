---
authoritative_for: mergedSha missing on a real delivered event (tsk-5dk), unreproduced race, approve-fault-log diagnostic instrumentation
---

# A real merge landed without `mergedSha` — unreproduced, now instrumented to catch it next time

`tsk-5dk`'s real merge commit (`a5a13e76`, on `main`) landed correctly —
content right, 3111 tests green — but its `delivered` event never carried
`mergedSha`/`mergedInto`. `fgos list --id tsk-5dk --json` read `mergedSha:
null` while `git log` showed the merge had genuinely happened. `tsk-64o`
investigated this. **The bug was never reproduced — this documents what
was tried, what's ruled out, and the new instrumentation watching for it
to recur.**

## Not a functional regression

The real merge landed on `main`; the item only falls into the
already-designed "historical item with no sha" bucket — the
`delivered`-not-on-trunk check's own git-derived fallback still covers it
(`docs/specs/work-state.md` Data Dictionary #28/#29). But `tsk-5dk` was
supposed to be a case WITH a real sha per its own design, so this is a
genuine, unexplained gap — not merely a known-graceful degradation.

## What's ruled out

- **A close-timing race at the git-commit layer.** `tsk-22c` (an
  unrelated item, merged somewhere concurrently in the repo) landed 2.5
  minutes away from `tsk-5dk`'s own merge — not a tight race at that
  layer.
- **The code path itself being broken.** `resolveRefSha` +
  `moveDeliveredOrRecordFault` (`bin/fgos.mjs`/`src/state/store.mjs`)
  were rebuilt and exercised twice independently — once cloning the
  repo's real `.fgos/events.jsonl` and reproducing the exact
  `skipRedundantChecks` branch `tsk-5dk` went through (root-into-main,
  "verify skipped: the merged tree is identical to..." fast path) — and
  **both times `mergedSha` wrote correctly.**

## What's different about the real environment vs. every repro attempt

Both failed repro attempts ran with **no other session/process
concurrently active on the same repo** — the opposite of `tsk-5dk`'s real
environment, where multiple real sessions share one main checkout at
once. The unverified hypothesis: `withLockRetry`/the main-checkout lock
may have a rare window where a read of branch/ref state doesn't reflect
the true main-checkout state at the moment of write, under real
concurrent multi-session load — **a hypothesis, not a conclusion.**

## What shipped: diagnostic instrumentation, not a fix

No verify existed for this item beyond "the new logging runs, doesn't
break `npm test`" — the phenomenon itself doesn't reproduce on demand, so
there was nothing to prove fixed. `recordApprovePostSuccessFault`
(`src/cli/approve-fault-log.mjs`, an append-only side log independent of
`events.lock` so it can still write even under lock contention) is now
called at all three points `mergedSha`/`mergedInto` get resolved or
written in `src/verbs/merge/approve.mjs`: the unconditional success path,
the error path, and the GitHub-merge path. Next time this phenomenon
recurs — on `tsk-5dk` or any other item — there will be real evidence to
trace instead of the blind reasoning this investigation had to rely on.

## For a future investigator

If you see `mergedSha: null` on an item whose real merge clearly landed:
check `resolveFgosFile(dir, FGOS_FILE.APPROVE_FAULT_LOG)`'s log first —
it may now hold the trace this investigation was missing. If it's empty
too, the bug is even rarer/subtler than the diagnostic coverage assumed,
and that itself is worth recording as a finding.
