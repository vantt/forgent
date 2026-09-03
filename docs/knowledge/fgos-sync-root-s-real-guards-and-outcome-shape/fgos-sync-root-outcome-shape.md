---
framework: diataxis
mode: reference
---
# `fgos sync-root`'s real guards and outcome shape

`fgos sync-root <root-id>` (`bin/fgos.mjs`, `tsk-50i`, child of `tsk-3bn`)
merges a root branch's tip into its target without changing the root
item's own status/stage.

## Preconditions checked before any mutation

1. `<root-id>` must resolve to a real work item.
2. Must run from the actual main checkout — refuses with a validation
   error from a linked worktree, same guard shape as
   `promote-to-component`.
3. `fgw/<root-id>` must exist as a real branch — refuses with "nothing to
   sync" if not.
4. The target branch (`main`/trunk, or `fgw/<parent>` if the root itself
   has a `parent` — supporting nested trees) must exist if it isn't
   trunk.
5. The same Iron Law gate `approve` applies to a runner-sourced item runs
   here too — "refuse before any git mutation" — requiring
   `--acknowledge-iron-law` when tripped.
6. (tsk-66t) For a root with **no** `parent` only — the branch that merges
   directly on the shared main checkout, never the `item.parent` branch
   below which merges in a throwaway ephemeral worktree — the same
   clean-tree gate `approve`'s own local-merge branch already applies
   (`isMainTreeClean`/`buildOwnFileSet`) refuses before any git mutation
   if the shared checkout carries an uncommitted foreign change. Closes a
   real silent-data-loss gap: without this gate, a dirty checkout let
   `git commit --no-edit` (`mergeRunnerItem`, `merge.mjs`) sweep another
   session's staged changes into the merge commit.

## Outcome shape

| `outcome` | Meaning | Extra fields |
|---|---|---|
| `blocked`, `reason: 'merge-conflict'` | `git merge --no-commit --no-ff` conflicted; merge aborted, target unchanged | `target`, `branch` |
| `blocked`, `reason: 'fgos-write-rejected'` | the branch staged a change under `.fgos/` (ADR0020 violation); merge aborted | `target`, `branch`, `paths` |
| `blocked`, `reason: 'verify-fail'` | goal-check failed on the staged merge; merge aborted, target unchanged | `target`, `branch`, `exitStatus`, `output` |
| `synced` | real success | `target`, `branch`, `seq` (the decision event's sequence), `output` |

A no-parent root that trips precondition 6 above never reaches this table
at all — like the Iron Law/branch-existence preconditions, it throws a
`StoreError('validation')` before `runAndReport` is ever called, so there
is no `sync-root`-level `outcome` for it. `fgos merge next`'s own caller
catches this one specifically and reports it as `blocked: 'dirty-tree'`
(see `docs/explanation/why-merge-next-auto-syncs-blockedonsync-roots.md`).

## The locked contract: status/stage stays untouched on success

```js
// Success — status/stage of `id` is deliberately UNTOUCHED (the
// locked contract). Only a real decision record marks this sync
// happened, same append door `fgos decision` itself uses.
const { event } = addDecision(dir, {
  text: `sync-root: merged ${branch} into ${targetBranch} at ${currentHead(mergeRoot)}`,
  rationale: `fgos sync-root ${id} — closes the drift window this item's own design exists to prevent`,
  id,
});
return { id, mode: 'sync-root', outcome: 'synced', target: targetBranch, branch, seq: event.seq, output: result.check.output };
```

A successful sync only ever appends a decision record — never moves the
root item's own status or stage. This is deliberate: `sync-root` exists
purely to close the drift window between `fgw/<root>` and its target,
independent of whatever stage the root item itself is actually at.

## Nested roots reuse the same ephemeral-worktree machinery as approve

```js
if (item.parent) {
  return await withMergeEphemeralWorktree(repoRoot, item.parent, async (ephemeral) => runAndReport(ephemeral.path, repoRoot));
}
return await runAndReport(repoRoot);
```

When the root itself has a `parent` (a nested tree), `sync-root` merges
through the same ephemeral-worktree helper `approve`'s leaf-into-root
path uses — `repoRoot` (the real main checkout) is passed separately as
the lock root, while the ephemeral worktree is the actual git-op cwd,
the same `lockRoot`-vs-`repoRoot` split `tsk-2eq` fixed for `approve`.

## A real lesson from execution: the planned verify command was wrong

```
verify command corrected: plan.md's original (node --test
test/runner/merge.test.mjs) never actually exercises sync-root's own
logic, which lives entirely in bin/fgos.mjs's new case, not in
merge.mjs (sync-root reuses merge.mjs's existing exports as-is, adds no
new ones). Real coverage lives in test/cli/fgos.test.mjs's new
sync-root section (7 tests), plus fgos-help.test.mjs/
fgos-manifest.test.mjs which catch the new verb's registry/usage-string
wiring.
```

The plan's verify command was locked before the actual file-boundary
decision — all new logic living in `bin/fgos.mjs`'s CLI case, not in
`merge.mjs` (which `sync-root` only reuses as-is, adding no new
exports) — had actually been made during execution. Caught and
corrected mid-implementation rather than shipped with a verify command
that would pass without ever exercising the real new code.
