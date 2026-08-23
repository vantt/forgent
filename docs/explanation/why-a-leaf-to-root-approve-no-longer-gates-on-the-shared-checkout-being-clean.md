---
type: explanation
title: Why a leaf-to-root approve no longer gates on the shared checkout being clean
tags: [approve, merge, clean-tree, worktree-isolation]
source_capture_ids: [tsk-kv3]
authoritative_for: why a leaf-to-root approve no longer requires the shared main checkout to be clean, while a root-to-main approve still does
---
# Why a leaf-to-root approve no longer gates on the shared checkout being clean

A repo running many parallel sessions almost never has a clean main
checkout at any given instant — someone else's uncommitted worktree
sync, a regenerated stats line, an in-progress analysis. `tsk-kv3`
captured a real, observed incident where this made the merge conductor's
own unattended loop unable to run on its own: a 13-item merge tree got
blocked twice in one day, neither time for a reason related to the tree
actually being merged.

## Two real, unrelated blocks in one day

> "Lần một, tám file chưa commit thuộc một đợt orchestrator-worker-slots
> nằm trong cây chung, không item nào sở hữu chúng [...] approve từ chối
> với 'working tree is not clean' cho tới khi session kia tự commit. Lần
> hai, AGENTS.md và CLAUDE.md bẩn chỉ vì dòng thống kê GitNexus được công
> cụ sinh lại [...] cộng năm file untracked của một session đang phân
> tích merge-contention — lại chặn tiếp."
> — real `work.decision` capture, id `tsk-kv3`

Neither block was a real conflict with the merge actually in flight. Both
were the clean-tree gate firing on *someone else's* unrelated dirty
state, because the gate checked the whole shared checkout rather than
anything scoped to the item being merged.

## The fix: remove the gate where it protects nothing

The clean-tree check (`isMainTreeClean(repoRoot, ownFileSet)`,
`bin/fgos.mjs`'s `case 'approve'`) used to run once, ahead of the split
between a leaf→root merge and a root→main merge. Discovery (F4 in
`tsk-kv3`'s own `RESEARCH.md`) proved the leaf's actual merge runs
entirely inside a **detached ephemeral worktree**
(`withMergeEphemeralWorktree`) that never reads or writes the shared
checkout's own working tree at all — so gating a leaf merge on the shared
tree's cleanliness was protecting a resource that code path never
touches. The fix removed the gate from the leaf→root branch entirely and
kept it, unchanged, on the root→main branch — the one branch that
genuinely lands a merge on the shared checkout:

```
bin/fgos.mjs, case 'approve':
1. ownFileSet computed once, still ahead of the leaf/root split (needed by both)
2. leaf → root branch: no clean-tree check at all
3. root → main branch: the SAME check, same ownFileSet, re-added
   right before the merge attempt — byte-identical logic, only its
   location moved
```

`sync-root`'s own nested (`item.parent`) path already had no such gate —
confirmed by reading the code, not assumed — because its own original
clean-tree gate (`tsk-66t`) was already scoped correctly to the
no-parent, root-to-main-shaped branch from the start. Nothing there
needed to change.

## What this deliberately did not touch

Two adjacent questions came up during the same investigation and were
explicitly answered "not a bug, not this item's scope":

- **A many-child root's own clean-tree check still dilutes toward
  whole-tree.** A root's `ownFileSet` is the union of everything its
  children legitimately merged — for a root with many children, that
  union can end up covering most of the tree, so the gate starts to
  behave close to a whole-tree check even though it's still technically
  scoped by path. `tsk-598`'s own D2 principle ("block only on a real
  same-path collision between the item's own diff and another source's
  dirty state") means a collision there — e.g. a file touched by both a
  landed child and a concurrent session — is a genuine same-path
  conflict, not a false positive. This dilution is a real, named
  limitation of narrowing-by-path-set, left as a known constraint rather
  than reopened.
- **The fix landed in `bin/fgos.mjs`, not `merge.mjs`** — the underlying
  `isWorkingTreeClean`/`buildOwnFileSet` primitives (`tsk-598`) were
  already correct and already tested; the only real gap was *where*
  `approve` called them from.

## Why this matters beyond the one incident

This repo runs dozens of sessions in parallel by design (per-item
worktree isolation, `docs/explanation/worktree-isolation-axis-decision.md`).
Under that model, "the shared checkout is clean" is a rare, transient
state, not a normal resting state — so a gate that requires it,
anywhere it isn't load-bearing, effectively requires a person to notice
and clean up on the merge conductor's behalf before an unattended loop
can make progress. Narrowing the gate to exactly where it protects real
data (the shared checkout, only when a merge actually lands there) is
what lets the unattended merge loop actually run unattended.

## Related

- `docs/how-to/unify-a-duplicated-clean-tree-check-across-return-and-approve.md`
  — the sibling clean-tree check on the `return` path
- `docs/history/tsk-kv3-merge-clean-gate-shared-tree/RESEARCH.md` —
  the full F1–F8 discovery evidence this fix was built on
