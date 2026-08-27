---
framework: diataxis
mode: explanation
---
# Why `promote-preflight` uses `git merge-tree` instead of a real merge

`preflightRetarget` (`src/runner/promote-preflight.mjs`, `tsk-3gx-1`)
judges whether it's safe to retarget a member item's branch onto another
branch, as the read-only safety layer `promote-to-component` requires
before any real git mutation. It never commits, merges, or creates/
removes a worktree — the actual retarget is a separate module's job
(`tsk-3gx-2`), which only runs after this one returns `{ safe: true }`.

## The two conditions it checks

`docs/history/promote-to-component/CONTEXT.md`'s D3 names exactly two
conditions that make a retarget unsafe, applied read-only here — a real
merge conflict, or the member branch looking currently active elsewhere:

```js
export function preflightRetarget(repoRoot, memberId, targetId) {
  const memberBranch = branchNameFor(memberId);
  const targetBranch = branchNameFor(targetId);

  if (!branchExists(repoRoot, memberBranch)) {
    return { safe: false, reason: 'missing-branch', detail: `branch "${memberBranch}" does not exist` };
  }
  if (!branchExists(repoRoot, targetBranch)) {
    return { safe: false, reason: 'missing-branch', detail: `target branch "${targetBranch}" does not exist` };
  }

  const activity = checkoutActivity(repoRoot, memberBranch);
  if (activity.active) {
    return { safe: false, reason: 'active-checkout', detail: activity.detail };
  }

  const conflict = mergeConflictRisk(repoRoot, memberBranch, targetBranch);
  if (conflict.hasConflict) {
    return { safe: false, reason: 'merge-conflict', detail: conflict.detail };
  }

  return { safe: true };
}
```

## Why "active checkout" matters — the hazard this avoids

`tsk-3gx`'s own design cites the exact incident this guards against: a
destructive-adjacent operation on a checkout other work might be
touching concurrently (the same class of near-miss `tsk-3au` had already
warned about). `checkoutActivity` checks whether the member branch is
checked out in *any* worktree right now, and if so, whether that
checkout has real uncommitted changes:

```js
// D3(ii): true when `branch` is checked out in some worktree of `repoRoot`
// right now AND that checkout has real uncommitted changes. A branch that
// is not checked out anywhere, or is checked out but clean, is not
// "active" in D3's sense. Fails closed (active) on an unreadable worktree
// listing — mirrors `isCheckoutDirty`'s own fail-closed stance.
```

A branch simply checked out somewhere, but clean, is *not* considered
active — only real uncommitted work counts. And if the worktree listing
itself can't even be read, the function fails closed (treats it as
active) rather than risk proceeding blind — the same fail-closed stance
`isCheckoutDirty` already established elsewhere.

## Why conflict detection uses `merge-tree`, not a real merge attempt

The obvious way to check for a conflict is to attempt the merge and see
what happens — but that would touch the working tree, the index, and
`MERGE_HEAD`, exactly the kind of mutation a read-only preflight must
never perform. Instead:

```js
// D3(i): true when merging `branch` into `target` would conflict. Uses the
// classic 3-arg `git merge-tree <merge-base> <target> <branch>` (this
// repo's git is 2.34 — predates the 2.38 `--write-tree` mode) — that form
// never touches the working tree, the index, or `MERGE_HEAD`; it only
// prints the would-be merge result. Empirically confirmed on this git
// version: a real conflict embeds `<<<<<<<`/`=======`/`>>>>>>>` markers in
// the diff hunk; a clean auto-merge never does, regardless of whether
// files changed on both sides.
function mergeConflictRisk(repoRoot, branch, target) {
  const mergeBase = git(repoRoot, ['merge-base', target, branch]).trim();
  const output = git(repoRoot, ['merge-tree', mergeBase, target, branch]);
  const hasConflict = output.includes('<<<<<<<');
  return { hasConflict, detail: hasConflict ? output : null };
}
```

The classic 3-arg form of `git merge-tree` (`<merge-base> <target>
<branch>`) computes what a merge *would* produce without touching
anything real — no working tree, index, or `MERGE_HEAD` side effects.
This repo's git version (2.34) predates the newer `--write-tree` mode,
so the older 3-arg form was the one actually available and empirically
verified: a real conflict embeds `<<<<<<<`/`=======`/`>>>>>>>` markers
in the printed diff hunk, while a clean auto-merge never does — even
when files changed on both sides of the merge.

## Return contract

`{ safe: true }` on success, or
`{ safe: false, reason: 'missing-branch'|'active-checkout'|'merge-conflict', detail: string }`
on refusal — three distinct, named failure reasons, never a bare
boolean, so a caller (or a person reviewing a refused promotion) knows
exactly which of D3's conditions tripped.
