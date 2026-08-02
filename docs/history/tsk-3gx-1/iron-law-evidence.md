# Iron Law evidence — tsk-3gx-1

`classifyIronLaw` on this item's final diff (evaluated via `sync-root
tsk-3gx` at the root's own return-time check, same function/module list
`approve` itself uses) returned `required: true`, matched modules
`["src/runner/promote-preflight.mjs", "src/runner/worktree.mjs"]` (no
matched keyword flags) — both paths fall under `src/runner/`, a
self-modifying-capable module prefix.

## Test command

```
node --test test/runner/promote-preflight.test.mjs test/runner/worktree.test.mjs
```

## Failing-before transcript

Captured by temporarily reverting the fix in place — moving
`src/runner/promote-preflight.mjs` aside entirely and reverting the two
`export` keywords this item added to `findCheckoutPath`/`isCheckoutDirty`
in `src/runner/worktree.mjs` back to module-private — while keeping the
new test file, then running it against the unfixed tree:

```
$ node --test test/runner/promote-preflight.test.mjs

node:internal/modules/esm/resolve:271
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'/home/vantt/projects/forgentX/.claude/worktrees/tsk-3gx-VezetV/src/runner/promote-preflight.mjs'
imported from
'/home/vantt/projects/forgentX/.claude/worktrees/tsk-3gx-VezetV/test/runner/promote-preflight.test.mjs'
    code: 'ERR_MODULE_NOT_FOUND'

Node.js v24.18.0
✖ test/runner/promote-preflight.test.mjs (40.245309ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

## Passing-after transcript

Restored `src/runner/promote-preflight.mjs` and the two `export`
keywords, then reran the same test file plus the full existing
`worktree.test.mjs` suite (confirming the two newly-exported functions
introduced no regression for their existing caller,
`reclaimOrphanedCheckout`):

```
$ node --test test/runner/promote-preflight.test.mjs test/runner/worktree.test.mjs

✔ preflightRetarget: safe when both branches exist, neither active, no conflict
✔ preflightRetarget: unsafe with reason missing-branch when member branch does not exist
✔ preflightRetarget: unsafe with reason missing-branch when target branch does not exist
✔ preflightRetarget: unsafe with reason active-checkout when member branch has a dirty live checkout
✔ preflightRetarget: safe when member branch has a live but clean checkout (not "active" per D3)
✔ preflightRetarget: unsafe with reason merge-conflict when both branches edit the same lines
✔ preflightRetarget: never mutates repo state (no new commits, branches, or worktrees left behind)
✔ branchNameFor is deterministic per id
✔ createWorktree makes a fresh branch fgw/<id> from HEAD when none exists
[... 30 more pre-existing worktree.test.mjs cases, all passing ...]
ℹ tests 39
ℹ pass 39
ℹ fail 0
```

Full suite (`npm test`) also confirmed green at 2240/2240 before this
item was returned (see the item's own `fgos return tsk-3gx-1` history).
