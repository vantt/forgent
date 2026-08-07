# Iron Law evidence — tsk-46a

`classifyIronLaw` result (`src/evolve/iron-law.mjs`), computed against this
item's own `changedFiles` right before returning:

```json
{"required":true,"matchedFlags":["mất dữ liệu"],"matchedModules":[]}
```

Test command: `node --test test/runner/merge.test.mjs`

## Failing-before

`src/runner/worktree.mjs` reverted to its pre-fix state (no CAS guard),
running only the new race test:

```
node --test --test-name-pattern="refuses to force-move" test/runner/merge.test.mjs

✖ withMergeEphemeralWorktree refuses to force-move the branch when it moved since this call started (concurrent merge already landed) -- the losing commit is never silently discarded (76.713816ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1

✖ failing tests:
test at test/runner/merge.test.mjs:899:1
✖ withMergeEphemeralWorktree refuses to force-move the branch when it moved since this call started (concurrent merge already landed) -- the losing commit is never silently discarded (76.713816ms)
  AssertionError [ERR_ASSERTION]: Missing expected rejection.
      at async TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-46a-bh2VlR/test/runner/merge.test.mjs:904:3)
```

"Missing expected rejection" is the pre-fix bug itself: the second,
stale-tip `branch -f` succeeds silently instead of being refused —
exactly the data-loss race the item describes.

## Passing-after

`src/runner/worktree.mjs` restored to the CAS-guarded version, same test:

```
node --test --test-name-pattern="refuses to force-move" test/runner/merge.test.mjs

✔ withMergeEphemeralWorktree refuses to force-move the branch when it moved since this call started (concurrent merge already landed) -- the losing commit is never silently discarded (76.115925ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Full item verify command, same (fixed) code:

```
node --test test/runner/merge.test.mjs

ℹ tests 60
ℹ pass 60
ℹ fail 0
```
