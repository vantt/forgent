# Iron Law evidence — tsk-f38

`classifyIronLaw({ filesChanged, description })` (`src/evolve/iron-law.mjs`),
run against the real changed-file set from `changedFiles` (`src/runner/merge.mjs`):

```json
{
  "required": true,
  "matchedFlags": ["schema"],
  "matchedModules": []
}
```

## Failing-test-first proof

Test: `test/state/workflow-stage-graphs.test.mjs`, the case
`skillForStage(DOMAINS.coding, "executing") resolves to fgos-coding-implement`.

**Before** (`src/state/workflow-stage-graphs.mjs`'s `skillMap.executing`
temporarily reverted to the old literal `'fgos-executing'`, test file left
at its already-updated state):

```
node --test test/state/workflow-stage-graphs.test.mjs
```

```
✖ skillForStage(DOMAINS.coding, "executing") resolves to fgos-coding-implement (0.153035ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'fgos-executing'
  - 'fgos-coding-implement'
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-f38-tAOj2Y/test/state/workflow-stage-graphs.test.mjs:107:10)
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'fgos-executing',
    expected: 'fgos-coding-implement',
    operator: 'strictEqual',
    diff: 'simple'
```

**After** (`skillMap.executing` restored to `'fgos-coding-implement'`):

```
node --test test/state/workflow-stage-graphs.test.mjs
```

```
ℹ tests 32
ℹ suites 0
ℹ pass 32
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 61.42006
```

## Full suite (item's own verify command, step 3)

```
npm test
```

```
ℹ tests 2473
ℹ suites 0
ℹ pass 2468
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 144860.105178
```
