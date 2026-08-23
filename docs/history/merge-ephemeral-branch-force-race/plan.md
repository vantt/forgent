# Plan: fix branch -f race in withMergeEphemeralWorktree

Mode: high-risk

Flags counted (per `fgos-routing`'s Mode-gate, applied directly — no
Orient handoff reached this session, per `fgos-coding-planning`'s direct-entry
fallback): **data loss** (hard-gate — the bug silently discards a
committed merge with no error), **existing covered behavior** (touches
`withMergeEphemeralWorktree`, already exercised by
`test/runner/merge.test.mjs` and `test/runner/worktree-callsite-wrapper
.test.mjs`, and itself a recent tsk-5yp change), **weak proof around the
area** (concurrency races are inherently hard to prove — the item's own
description required a standalone experimental git script to demonstrate
it before this plan existed). 3 flags including one hard-gate → high-risk.

## Approach

Chosen path (CONTEXT.md D1): add a compare-and-swap (CAS) check on
`branch`'s live tip immediately before `git branch -f` in
`withMergeEphemeralWorktree` (`src/runner/worktree.mjs:639-658`) — read
the branch's current tip right before the force-move, only apply it when
that tip still equals the `startCommit` captured at the top of the
function. Scope stays exactly the same as today's lock (short, around
merge+commit only) — the CAS check is what closes the gap, not a longer
hold.

Rejected alternative (CONTEXT.md D1): widening `acquireMainCheckoutLock`'s
held duration to span the whole function. `acquireMainCheckoutLock`
(`src/runner/main-checkout-lock.mjs`) is one global lock for the entire
repo checkout, not scoped per branch — extending it over
`mergeRunnerItemLocked`'s verify step (`runGoalCheck`, can run tests/
builds, seconds to minutes) would serialize every writer in the repo for
that whole window, not just concurrent merges into the same root. Rejected
as disproportionate to the bug's actual scope (one unguarded ref move).

On a detected mismatch (CONTEXT.md D2): fail loudly through this module's
existing `WorktreeError` class (`errorClass: 'worktree-fail'`,
`.category: 'worktree-fail'`) — same error-class convention this file
already uses for every other worktree/branch failure
(`reclaimOrphanedCheckout`, `relocateOrphanedCheckout`,
`createDetachedMergeWorktree` all throw this way). No automatic retry
inside `withMergeEphemeralWorktree` or `mergeRunnerItem` — the caller
(`merge-loop`, or a person re-running `fgos approve`) owns retrying, per
D2's rationale.

### GitNexus impact-analysis posture

`impact-analysis: full` (GitNexus registered and `present`, checked fresh
in `fgos-coding-exploring`'s pass this session — see CONTEXT.md). Before editing
`withMergeEphemeralWorktree` at `fgos-coding-implement` time, run
`impact({target: "withMergeEphemeralWorktree", direction: "upstream"})`
per that skill's own MUST rule. Scout already confirmed the only caller is
`promote-engine.mjs`'s `retargetMember` (both the leaf-into-root and
root-into-main merge paths run through this one function) — the impact
call at implementation time re-confirms this against the live graph before
the edit lands, not a substitute for it.

## Files touched

- `src/runner/worktree.mjs` — add the CAS check inside
  `withMergeEphemeralWorktree`, immediately before the existing
  `git(repoRoot, ['branch', '-f', branch, endCommit])` call (currently
  line 652): read the branch's live tip (`git rev-parse branch` against
  `repoRoot`), compare to `worktree.startCommit`; on mismatch, throw
  `WorktreeError` instead of moving the ref.
- `test/runner/merge.test.mjs` — add a race-reproduction test that drives
  two real, concurrent merges into the same branch (mirroring the item's
  own already-verified experimental script: two detached checkouts of the
  same starting tip, each committing independently, both attempting to
  land on the same branch) and asserts: (a) the losing attempt fails
  loudly instead of silently overwriting, and (b) the winning attempt's
  commit stays reachable from the branch's final tip
  (`git merge-base --is-ancestor`). This is the plan's own verify command,
  below.

No split — this is one honest, bounded piece: a single guarded check plus
its regression test, both in code paths already covered by
`test/runner/merge.test.mjs`'s existing suite. `fgos graph tsk-46a --json`
was run; tsk-46a is not part of a multi-piece decomposition candidate
(its only dependency, tsk-5yp, is already merged to main), so
`topUnblock`/`criticalPath` comparison across split candidates does not
apply here.

## Order

1. `src/runner/worktree.mjs` — the CAS check itself (small, isolated;
   nothing downstream depends on it not existing yet).
2. `test/runner/merge.test.mjs` — the race-reproduction test proving it.

Per this skill's "leave execution alone" rule: Execute's own goal-check
and `return`'s re-verify are the existing mechanical proof path — this
plan does not redesign them, it only names the one command that proves
this item done (below).

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| CAS check correctness — timing of the re-read relative to the lock/checkout lifecycle | Medium — the whole bug is a narrow timing window; the fix must close exactly that window, not shift it | New race-reproduction test in `test/runner/merge.test.mjs` driving 2 real concurrent merges into one branch, asserting the first commit stays reachable from the final tip |
| Error surfacing to callers (`mergeRunnerItem`, `promote-engine.mjs`) | Low — reuses the existing `WorktreeError`/`errorClass`/`.category` convention already flowing through this file to its callers | Full `node --test test/runner/merge.test.mjs` green, including its existing error-path tests (`WorktreeError` category assertions already present in the suite) |
| Regression on the ordinary (non-racing) single-merge path | Low | Same full suite run — `merge.test.mjs`'s existing ~65 tests already cover the non-race merge/verify/error paths and must stay green |
| Blast radius of editing `withMergeEphemeralWorktree` | Confirmed narrow by scout (only caller: `promote-engine.mjs`'s `retargetMember`) — see GitNexus posture above | `impact()` call at `fgos-coding-implement` time, re-confirming against the live graph before the edit |

## Assumptions

- The existing `WorktreeError` class/category convention already used
  throughout `worktree.mjs` is sufficient to surface a CAS failure to
  `mergeRunnerItem`/`promote-engine.mjs` without a new error class or
  category — an implementation detail `CONTEXT.md` correctly left
  unaddressed (D2 fixes the *behavior*, "fail loudly," not the mechanism).
  `fgos-coding-validating` should confirm this holds by checking `merge.mjs`'s
  and `promote-engine.mjs`'s existing catch/surface paths for
  `WorktreeError` before treating it as proven.

## Verify

```
node --test test/runner/merge.test.mjs
```

Already recorded on the item (`fgos edit --verify`, set during
`fgos-coding-exploring`'s discover pass this session) and re-affirmed here as the
plan's own proof command — the new race-reproduction test above lives
inside this same file, so this command alone proves scope.
