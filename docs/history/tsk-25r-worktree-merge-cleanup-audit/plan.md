# plan: tsk-25r — worktree claim/merge/cleanup lifecycle audit (parent, rollup)

Mode: standard (rollup of 9 already-`standard`-lane children; item's own
`tier`/`risk` are `heavy` — inherited from the highest-risk child,
tsk-18k, not re-derived here).

Flag count/lane: not independently re-derived — this item's own scope was
always "the sum of the 9 findings," and each child already went through
its own lane decision. No new flags apply at the parent level.

Direct-entry fallback: entered `planning` straight from this item's own
`clear` discovery verdict — no `CONTEXT.md`/exploring round exists for the
PARENT item itself (each child had its own). `RESEARCH.md` round 1 stands
in for it.

## Impact-analysis posture

Same as every child this session: gitnexus `present` but 172 commits
behind HEAD — **degraded**. Not leaned on here: the parent's own proof is
the combined REAL test run across all 9 findings' own test files (627
tests, all green together) — a direct integration check, not a
blast-radius query.

## Approach

**No new code.** Every line of the actual fix for all 9 findings already
landed via the 9 children, each with its own full discovery → planning →
validating → executing cycle, its own real evidence (including Iron Law
failing-before/passing-after transcripts where required), and its own
merge onto this item's branch (`fgw/tsk-25r`). This item's own job was
always to track/aggregate those 9 findings, never a tenth independent
piece of work — `RESEARCH.md` round 1 confirms no new ambiguity or gap
exists at the parent level once all 9 children are `delivered`.

**What this item's own pass actually adds:** the combined-suite proof run
(RESEARCH.md round 1) — confirming all 9 findings' own test files still
pass TOGETHER, not just individually in each child's own isolated
worktree. This is a real, non-trivial check: it is the first time all 9
fixes have been exercised in the same process/tree since the
`normalizePath` import in `graph-metrics.mjs` (tsk-2jn), the `detectTrunk`
import in `worktree.mjs` (tsk-386), and the `beforeProvision`/cleanup-wrap
changes to `worktree.mjs` (tsk-1mn, tsk-4yv) all now coexist in the SAME
file.

**Named, not silently worked around:** one pre-existing, unrelated test
failure (`test/runner/dispatch.test.mjs:651`, a gather-capacity gap in
this repo's own live `.fgos/config.json`) predates this entire batch —
confirmed against the commit at the very start of this session, before
any of the 9 children were claimed. Out of this item's scope; this item's
own verify deliberately targets the 9 findings' own real test surface
rather than the full `npm test` (which would perpetually and misleadingly
fail this item's own return for an unrelated, pre-existing reason).

## Risk map

| Component | How risky | Proof point |
|---|---|---: |
| All 9 fixes coexisting in the same merged tree | Medium — each was individually verified in its own worktree, never all together until this branch | Combined `node --test` run across all 9 findings' own test files (627 tests, 0 failures) |
| The one pre-existing, unrelated failure | N/A — not this item's own risk to carry | Confirmed pre-existing (not introduced by any of the 9 fixes), named plainly in `RESEARCH.md`, excluded from this item's own verify scope rather than silently masked |

## Shape

Single piece, no split — this item's own scope was always the rollup of
its 9 already-materialized, already-merged children.

Verify (already synced onto the item at discovery, real and runnable):
```
node --test test/runner/merge.test.mjs test/runner/merge-target-slot-multiprocess.test.mjs test/runner/main-checkout-lock.test.mjs test/runner/worktree-callsite-wrapper.test.mjs test/runner/worktree.test.mjs test/runner/claim-port.test.mjs test/state/cleanup-harness.test.mjs test/state/frontier.test.mjs test/state/graph-metrics.test.mjs test/cli/fgos-return.test.mjs test/cli/fgos-approve.test.mjs test/runner/loop.test.mjs test/runner/claim-liveness.test.mjs
```

## Outstanding questions

None
