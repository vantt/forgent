# plan.md — tsk-2ep: resolve false .fgos/ merge conflicts in catchup/approve

## Status

Implemented, verified, returned.

## Problem

Two directions in `src/runner/merge.mjs` merge across the boundary
between a worker branch (`fgw/<id>`) and its target (`main` for
`mergeRunnerItemLocked`/approve, `target` for `performCatchUp`/catchup).
Neither side has any legitimate claim over the other's `.fgos/` state
(ADR0020), and `.gitattributes` declares `merge=union` for the
per-writer sharded event log (`.fgos/events/<writer-id>-<openTs>.jsonl`,
tsk-3ve/tsk-1wk) precisely so concurrent growth on that shard never
raises a real conflict.

`merge=union` only resolves MODIFY/MODIFY text conflicts — it never
resolves a MODIFY/DELETE (deletion is not handled by any content-merge
driver, regardless of attribute). A worker branch that at some point
recorded a DELETION of a shard path (confirmed reproducible via a
realistic scenario: an earlier catch-up/merge landed main's `.fgos/`
state onto the branch, then a manual `git rm --cached` "recovery" from
some earlier unrelated conflict stripped it back out and committed
that deletion) raises a real git conflict — `outcome: 'conflict'` from
both `performCatchUp` and `mergeRunnerItem` — the moment the calling
session's own subsequent event-append grows the same shard on the
other side. This is a false conflict manufactured entirely by the
calling session's own writes to its own shard, not a genuine content
dispute.

## Approach

Added `resolveFgosOnlyConflict(repoRoot, keepRef)` (`src/runner/merge.mjs`,
next to the existing `isMergeUnionPath` helper `mergeRunnerItemLocked`
already uses for the CLEAN-stage case, tsk-4gi): when a raw `git merge`
throws a real conflict, and every conflicted path is under `.fgos/` AND
declared `merge=union`, resolve each path by restoring it to `keepRef`'s
own committed version (or removing it if `keepRef` never had it),
instead of aborting. A single non-`.fgos/` conflicted path, or a
`.fgos/` path without that attribute, leaves the conflict completely
untouched — the caller still treats it as genuine (identical
restriction to `isMergeUnionPath`'s own gate, for the identical reason:
never silently discard a real, non-append-only `.fgos/` write).

Wired into both directions:
- `mergeRunnerItemLocked` (branch → main): `keepRef = 'HEAD'` — main's
  own committed side is always the one to trust.
- `performCatchUp` (target → branch): `keepRef = target` — main's own
  copy is always the one to trust; the item's branch has no legitimate
  claim over `.fgos/` at all.

Reordering the calling session's own event-append (moveWork) to run
strictly after all git-level merge work was considered first, but
`catchup.mjs`'s own `moveWork` call already runs after `performCatchUp`
returns — the actual gap was the missing conflict-tolerance in the
merge/diff-check layer itself, not a call-order bug in the calling
verb.

## Evidence

`test/runner/merge.test.mjs`:
- `performCatchUp resolves a stale deleted-.fgos-shard branch cleanly
  instead of a false modify/delete conflict (tsk-tr9 regression)`
- `mergeRunnerItem resolves a stale deleted-.fgos-shard branch cleanly
  instead of a false modify/delete conflict (tsk-tr9 regression)`

Both reproduce the exact modify/delete conflict against pre-fix code
(`outcome: 'conflict'`, confirmed via `git stash` A/B against the
unmodified source) and confirm `outcome: 'merged'` post-fix, with
main's own `.fgos/` state landing byte-identical to its pre-merge
content and the worker's real (non-`.fgos`) file still landing.

Full suite: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
'test/**/*.test.mjs'` — 3871 tests, 3866 pass, 0 fail, 5 skipped
(pre-existing environment-conditional skips, e.g. the bee-installation
canary).
