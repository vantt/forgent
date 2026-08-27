# plan.md — tsk-52p

Mode: small

## Approach

`branchContentMismatch` (`src/runner/merge.mjs:1096-1130`) runs only on
the already-merged fast path of `mergeRunnerItemLocked` (`src/runner/
merge.mjs:1272-1277`, gated by `isAlreadyMerged`) — a re-approve of a
branch already an ancestor of HEAD. It compares `introducedPaths`
(`base..branch` diff) against `changedByMerge` (the merge commit's own
diff against its first parent), flagging any path present in the former
but absent from the latter as discarded content.

The bug: a worker branch's own `.fgos/` diff (e.g. the documented
recovery in `docs/how-to/fix-fgos-write-rejected-merge-block.md` —
restoring `.fgos/` paths to the branch's own frozen pre-merge versions
after merging main in) always shows up in `introducedPaths`, but by
design (ADR0020, and the `tsk-4gi`/`tsk-4s6` restore-to-target's-own-
content mechanics a few dozen lines above in the same file) never shows
up in `changedByMerge` — main's `.fgos/` content is always restored to
its own pre-merge state right after the merge lands. That legitimate,
permanent divergence was flagged as discarded content on every
re-approve.

Rejected alternative: gating the `.fgos/` exclusion on `isMergeUnionPath`
(mirroring `resolveFgosOnlyConflict`'s own gate) — rejected because that
gate exists to protect a real, non-append-only `.fgos/` write from being
silently discarded during an ACTUAL conflict-resolution merge action.
Here, the check is read-only (never resolves or discards anything) and
ADR0020 already guarantees categorically that no worker branch can ever
legitimately reflect main's live `.fgos/` content, union-declared or
not — so an unconditional path-prefix exclusion is the correct, narrower
fix, not a copy of a gate built for a different purpose.

Risk map: `light`. The exclusion narrows an existing check (fewer paths
get flagged, never more) and is scoped to one function with one caller,
already exercised by 4 existing regression tests in the same test file
covering adjacent `.fgos/` merge behavior (`tsk-4gi`, `tsk-4s6`,
`fgos-write-rejected`, `merge=union` divergence). Proof point: a new
regression test reproducing the exact false-positive shape (already
written and green — see Shape below), plus the full existing suite.

Files touched:
1. `src/runner/merge.mjs` — `branchContentMismatch`'s `introducedPaths`
   filter gains a `.fgos/` exclusion.
2. `test/runner/merge.test.mjs` — new regression test.
3. `docs/history/branch-content-mismatch-fgos-exclusion/plan.md` — this
   file.

## Shape

Already implemented and verified in this same session (`small`/`tiny`
lane, one honest piece — no split):

- `src/runner/merge.mjs`: `introducedPaths` now filters out `.fgos` and
  any path starting with `.fgos/` before the `changedByMerge` comparison
  runs, so those paths can never be flagged regardless of what the merge
  commit did or did not touch.
- `test/runner/merge.test.mjs`: added `mergeRunnerItem does not
  false-flag an already-merged branch over a legitimate .fgos/
  divergence (tsk-52p regression)`, mirroring the existing `tsk-4gi`
  union-divergence test's setup (a `merge=union .fgos/` log path that
  diverges between branch and main) but exercising the SECOND
  `mergeRunnerItem` call on the now-already-merged branch — the exact
  `branchContentMismatch` fast path the bug lives on. Confirmed
  reproducing the false positive against the pre-fix code, and green
  after the fix.
- Full suite (`npm test`): 4236 passed, 0 failed, 5 skipped (pre-existing
  skips, unrelated to this change).

## Outstanding questions

None
