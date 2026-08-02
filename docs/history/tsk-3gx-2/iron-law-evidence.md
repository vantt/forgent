# Iron Law evidence — tsk-3gx-2

`classifyIronLaw` on this item's final diff (evaluated the same way as
`tsk-3gx-1`, via `sync-root tsk-3gx` at the root's own return-time check)
returns `required: true`, matched module `["src/runner/promote-engine.mjs"]`
(no matched keyword flags) — the new file falls under `src/runner/`, a
self-modifying-capable module prefix.

## Test command

```
node --test test/runner/promote-engine.test.mjs
```

## Failing-before transcript

Captured by temporarily moving `src/runner/promote-engine.mjs` aside
entirely while keeping the new test file, then running it against the
unfixed tree:

```
$ node --test test/runner/promote-engine.test.mjs

node:internal/modules/esm/resolve:271
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'/home/vantt/projects/forgentX/.claude/worktrees/tsk-3gx-VezetV/src/runner/promote-engine.mjs'
imported from
'/home/vantt/projects/forgentX/.claude/worktrees/tsk-3gx-VezetV/test/runner/promote-engine.test.mjs'
    code: 'ERR_MODULE_NOT_FOUND'

Node.js v24.18.0
✖ test/runner/promote-engine.test.mjs (32.72574ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

## Passing-after transcript

Restored `src/runner/promote-engine.mjs`, then reran the same test file:

```
$ node --test test/runner/promote-engine.test.mjs

✔ resolveIntegrationBranch creates a fresh ref from trunk when rootId has no branch yet (D1 new-item path)
✔ resolveIntegrationBranch reuses an existing branch untouched (D1 reuse-member path)
✔ retargetMember merges a clean member branch into the integration branch, reports outcome merged
✔ retargetMember bails without touching git when preflight reports unsafe (merge conflict)
✔ retargetMember bails when the member branch has an active dirty checkout elsewhere (D3.ii)
✔ retargetMember reports outcome skipped when memberItem.id equals rootId, never attempts a self-merge
✔ retargetMember bails with reason missing-branch when the integration branch was never resolved (preflight catches it)
✔ retargetMember refuses to run from a linked worktree, mirroring sync-root's own discipline
ℹ tests 8
ℹ pass 8
ℹ fail 0
```

Full suite (`npm test`) also confirmed green at 2248/2248 before this item
was returned.
