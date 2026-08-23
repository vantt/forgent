# tsk-33w — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{
  "required": true,
  "matchedFlags": ["migration", "schema", "audit"],
  "matchedModules": ["src/runner/dispatch.mjs", "src/runner/loop.mjs"]
}
```

## Failing-test-first proof

Both new pinned tests, run with the two touched source files swapped back
to their pre-fix content (`git show d4ec236:src/runner/dispatch.mjs` /
`...loop.mjs`, the commit immediately before this item's implementation
commit `197f582`; restored afterward, working tree confirmed clean against
`HEAD`):

```
test at test/runner/dispatch.test.mjs:1482:1
✖ spawnWorker result carries command (the real spawned executable) alongside every existing field, additive only (33.944829ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + undefined
  - '/home/vantt/.nvm/versions/node/v24.18.0/bin/node'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-33w-wxrQqf/test/runner/dispatch.test.mjs:1489:10)
    ...
    actual: undefined,
    expected: '/home/vantt/.nvm/versions/node/v24.18.0/bin/node',
    operator: 'strictEqual',

test at test/runner/loop.test.mjs:351:1
✖ runOnce's capacity.dispatch audit event records the REAL spawned command even when a capacity declares a different provider label (tsk-33w D9: the audit must not lie when the two diverge) (114.134551ms)
  AssertionError [ERR_ASSERTION]: command must be the REAL spawned executable, not the label
  + actual - expected

  + undefined
  - '/home/vantt/.nvm/versions/node/v24.18.0/bin/node'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-33w-wxrQqf/test/runner/loop.test.mjs:382:10)
    ...
    actual: undefined,
    expected: '/home/vantt/.nvm/versions/node/v24.18.0/bin/node',
    operator: 'strictEqual',
```

Same tests, same repo, post-fix (`src/runner/dispatch.mjs`/`src/runner/
loop.mjs` restored to `HEAD`):

```
✔ spawnWorker result carries command (the real spawned executable) alongside every existing field, additive only
✔ runOnce's capacity.dispatch audit event records the REAL spawned command even when a capacity declares a different provider label (tsk-33w D9: the audit must not lie when the two diverge)
```

## Full item verify command (already run)

```
node --test test/runner/dispatch.test.mjs test/runner/loop.test.mjs
```

Result: 193 tests, 0 fail, 0 skipped.

Scoped to these two files rather than the full `npm test` — same reasoning
tsk-4eu recorded for this exact area: the full suite still carries one
pre-existing, unrelated failure (`test/docs/launcher-vocabulary-guard.
test.mjs`, flagging "orchestrator" vocabulary in docs this item never
touches, part of the separate in-flight tsk-2cw). Re-confirmed still
failing, unchanged by this item, before scoping `verify` down
(`fgos-coding-validating`'s own reality-gate pass for this item).
