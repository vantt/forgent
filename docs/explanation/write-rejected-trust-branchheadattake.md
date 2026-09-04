---
authoritative_for: mergeRunnerItemLocked's fgos-write-rejected restore trusting main's HEAD only for merge=union .fgos/ paths, permanently blocking sync-root/approve for a stale worker branch whose non-union .fgos/ paths are frozen-but-untouched since branchHeadAtTake — confirmed live merging fgw/tsk-25b (branch frozen 13 days)
---

# A worker branch that never touched `.fgos/` still got blocked as if it had

`tsk-4s6` fixed a bug in `mergeRunnerItemLocked`'s (`src/runner/merge.mjs`)
`fgos-write-rejected` restore step: it only trusted restoring a conflicting
`.fgos/` path to main's HEAD when that path was `merge=union`-attributed.
Any non-union `.fgos/` path (`config.json`, the legacy `events.jsonl`
baseline) permanently blocked `sync-root`/`approve` once main grew past
what a stale worker branch's `.fgos/` snapshot looked like at fork — even
when the worker branch had never intentionally touched that path at all.

## Confirmed live, not theoretical

Merging `fgw/tsk-25b` (a branch frozen 13 days, `.fgos/config.json` and
`.fgos/events.jsonl` untouched since fork): `sync-root` reported
`blocked/fgos-write-rejected` with paths `[.fgos/config.json,
.fgos/events.jsonl, .fgos/events.jsonl.backup-tsk-1lv-4-dedup-fix-20260817]`.

This could not be fixed on the worker-branch side at all — verified by
direct attempt:

- ADR0020's pre-commit hook (`stagedFgosChangesOnWorkerBranch`,
  `stagedFgosDeletions`) refuses ANY staged `.fgos/` change or deletion on
  a worker branch, in either direction.
- Deleting the stale path from main doesn't work either —
  `stagedFgosDeletions` blocks `.fgos/` deletions unconditionally, on any
  branch.

## Partial fix first, then the real one

Two more append-only logs (`changelog-nag-history.jsonl`,
`entropy-history.jsonl`) got `merge=union` coverage in `.gitattributes` as
a safe, narrow partial fix. That doesn't cover everything though:
`config.json` is structured (not union-safe by nature), and the legacy
`events.jsonl` baseline was deliberately retired from union coverage per
`tsk-4gi` and is still load-bearing per `src/state/replay.mjs` — neither
can be fixed by widening `merge=union`.

## What shipped

A second, narrower trust criterion was added alongside
`isMergeUnionPath`: `isUnchangedSinceBranchHeadAtTake(repoRoot, branch,
relPath, branchHeadAtTake)` — restoring to main's HEAD is also safe when
the branch's own current blob for that `.fgos/` path is git-identical to
the blob at the item's own recorded `branchHeadAtTake`. That proves zero
intentional branch-side edit, not merely "differs from main today":

```js
function isUnchangedSinceBranchHeadAtTake(repoRoot, branch, relPath, branchHeadAtTake) {
  if (!branchHeadAtTake) return false;
  try {
    const atTake = git(repoRoot, ['rev-parse', `${branchHeadAtTake}:${relPath}`]).trim();
    const atBranchHead = git(repoRoot, ['rev-parse', `${branch}:${relPath}`]).trim();
    return atTake === atBranchHead;
  } catch {
    return false;
  }
}
```

The restore guard now reads `!isMergeUnionPath(...) &&
!isUnchangedSinceBranchHeadAtTake(...)` — the existing union-path restore
path is untouched; this is an additive second trust route, not a
replacement.

This restore happens on `repoRoot`'s own staged index during the merge
attempt itself, before any commit lands anywhere — so ADR0020's
worker-branch guards never apply to this fix; it needs no worker-branch
commit at all.
