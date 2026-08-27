---
framework: diataxis
mode: explanation
---
# Why `promote-engine` merges members instead of rebasing them

`promote-to-component`'s original plan described the mutating step as
"rebase/retarget từng nhánh" — rebase each member branch onto the shared
integration branch. The real implementation
(`src/runner/promote-engine.mjs`, `tsk-3gx-2`) does something different:
it merges each member's branch into the integration branch, reusing
`sync-root`'s own already-proven primitive (`mergeRunnerItem`/
`withMergeEphemeralWorktree`) instead of a destructive rebase.

```js
// promote-engine.mjs — tsk-3gx-2: the mutating half of `promote-to-component`
// (docs/history/promote-to-component/CONTEXT.md/plan.md). Resolves or
// creates the shared integration branch (D1), then merges each member's own
// branch into it — reusing `sync-root`'s own battle-tested primitive
// (`mergeRunnerItem`/`withMergeEphemeralWorktree`) instead of a destructive
// rebase (plan.md's Approach). Gated per member by `promote-preflight.mjs`'s
// read-only D3 judgment; a member preflight already flagged unsafe is never
// even attempted.
```

## Why merge over rebase

Rebase rewrites a branch's commit history — every commit gets a new
hash, and anything else that already referenced the old commits (another
session's checkout, a cached diff, an in-progress worktree) becomes
stale or orphaned. A merge, by contrast, is additive: the original
commits stay exactly where they are, and a new merge commit ties the
history together. Given `sync-root`'s merge machinery
(`mergeRunnerItem`) was already battle-tested by that item, reusing it
here avoided introducing a second, riskier restructuring mechanism for
essentially the same "combine two branches" problem.

## The integration branch: reuse or create, uniformly

```js
/**
 * D1: resolve the shared integration branch for `rootId`. Reuses
 * `fgw/<rootId>` as-is if it already exists (D1's "promote an existing
 * member" path — that member's own branch IS the integration branch,
 * untouched here). Otherwise creates it fresh as a ref only, seeded from
 * `detectTrunk` (D1's "new item" path, uniformly — plan.md's Assumptions:
 * no special-cased "seed" member, every member including one that inspired
 * the grouping goes through the same `retargetMember` call below).
 */
export function resolveIntegrationBranch(repoRoot, rootId) {
  return createBranchRef(repoRoot, rootId, { baseRef: detectTrunk(repoRoot) });
}
```

There's no special-cased "seed member" whose branch simply *becomes* the
integration branch by fiat — even the member that originally inspired
the grouping goes through the exact same `retargetMember` merge call as
every other member. This keeps the logic uniform: one code path, no
"first member is different" edge case to reason about or test
separately.

## Per-member gating: preflight first, never attempt an unsafe merge

```js
export async function retargetMember(repoRoot, memberItem, rootId, opts = {}) {
  if (!isMainWorktree(repoRoot)) {
    throw new Error(
      `retargetMember: refusing to run from "${repoRoot}" — this must run from the main checkout, which a linked worktree structurally is not.`,
    );
  }
  if (memberItem.id === rootId) {
    return { id: memberItem.id, outcome: 'skipped', reason: 'is-root' };
  }
  const preflight = preflightRetarget(repoRoot, memberItem.id, rootId);
  if (!preflight.safe) {
    return { id: memberItem.id, outcome: 'bailed', reason: preflight.reason, detail: preflight.detail };
  }
  const result = await withMergeEphemeralWorktree(repoRoot, rootId, (ephemeral) =>
    mergeRunnerItem(ephemeral.path, memberItem, opts.timeoutMs ? { timeoutMs: opts.timeoutMs, lockRoot: repoRoot } : { lockRoot: repoRoot }),
  );
  if (result.outcome !== 'merged') {
    return {
      id: memberItem.id,
      outcome: 'blocked',
      reason: result.outcome,
      detail: result.check?.output ?? (result.paths ? `staged .fgos write: ${result.paths.join(', ')}` : null),
    };
  }
  return { id: memberItem.id, outcome: 'merged' };
}
```

`preflightRetarget` (`tsk-3gx-1`'s own read-only judgment) is called
first, and a member it flags unsafe is never even attempted — the
mutating half of this action never gets a chance to touch a member that
the read-only half already ruled out. Same `isMainWorktree` discipline
`sync-root` already established: this creates and tears down real
ephemeral worktrees, which only makes sense from the actual main
checkout, never a linked worktree.

## Scope boundary: this module never sets `parent`

```
SCOPE BOUNDARY: this module never sets a member's `parent` field and
never records a decision — those only happen after a REAL git success,
which is `tsk-3gx-3`'s (the CLI action layer's) job, "chỉ khi git thành
công thật mới set field parent" (the item's own description).
```

`retargetMember` returns an outcome (`merged`, `blocked`, `bailed`,
`skipped`) — it never writes any fgOS state itself. Setting a member's
`parent` field only happens in `tsk-3gx-3`'s CLI action layer, and only
after this function reports a real, confirmed `merged` outcome — never
on say-so, matching the atomic git-before-state ordering `tsk-3gx`'s own
design locked (D3 in `judgeDecompose`'s split rationale).
