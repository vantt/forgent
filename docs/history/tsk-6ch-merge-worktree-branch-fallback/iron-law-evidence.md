# tsk-6ch — Iron Law evidence

`classifyIronLaw` result against the real committed diff
(`git diff trunk...fgw/tsk-6ch`'s file set, `changedFiles` in
`src/runner/merge.mjs`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/worktree.mjs"]}
```

Files changed: `docs/history/tsk-6ch-merge-worktree-branch-fallback/CONTEXT.md`,
`docs/history/tsk-6ch-merge-worktree-branch-fallback/plan.md`,
`src/runner/worktree.mjs`, `test/runner/worktree.test.mjs`.

## Test command

```
node --test test/runner/worktree.test.mjs
```

## Failing-before proof

Before the fix (`createDetachedMergeWorktree`'s body restored to its
pre-fix `throw`-on-missing-branch form, new test kept as-is), the new
fallback test fails with exactly the original bug's error:

```
✖ withMergeEphemeralWorktree falls back to createBranchRef (seeded from main) instead of throwing when fgw/<id> was never created early (28.337062ms)
  Error [WorktreeError]: cannot create ephemeral merge checkout — branch "fgw/never-dispatched" does not exist.
      at createDetachedMergeWorktree (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-6ch-9779La/src/runner/worktree.mjs:737:11)
      at withMergeEphemeralWorktree (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-6ch-9779La/src/runner/worktree.mjs:766:20)
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-6ch-9779La/test/runner/worktree.test.mjs:449:24)
    errorClass: 'worktree-fail',
    category: 'worktree-fail',
    branch: 'fgw/never-dispatched'
```

The sibling regression test (`already-existing fgw/<id> branch untouched
by the fallback`) passed both before and after — it exercises the
unchanged already-exists path, not the fix itself.

## Passing-after proof

With the real fix restored, the full suite passes, including both new
cases:

```
✔ withMergeEphemeralWorktree falls back to createBranchRef (seeded from main) instead of throwing when fgw/<id> was never created early (49.521431ms)
✔ withMergeEphemeralWorktree leaves an already-existing fgw/<id> branch untouched by the fallback (checkout at its real tip, not reset to main) (59.014334ms)
...
ℹ tests 44
ℹ suites 0
ℹ pass 44
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
