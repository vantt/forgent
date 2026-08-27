# Iron Law evidence: tsk-52p

Classified against the committed diff (`src/runner/merge.mjs` + `test/runner/merge.test.mjs`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/merge.mjs"
  ]
}
```

`src/runner/merge.mjs` matched a protected module under `MODULE_RULES`.

Verify command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/merge.test.mjs`

## Failing-before

`test/runner/merge.test.mjs`'s regression case (`mergeRunnerItem does not false-flag an already-merged branch over a legitimate .fgos/ divergence (tsk-52p regression)`) run against pre-fix `src/runner/merge.mjs` fails, proving the test exercises the missing `.fgos/` exclusion in `branchContentMismatch`:

```
✖ mergeRunnerItem does not false-flag an already-merged branch over a legitimate .fgos/ divergence (tsk-52p regression) (215.803335ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'verify-fail'
  - 'merged'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-52p-YLcqCO/test/runner/merge.test.mjs:1685:10)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async Test.run (node:internal/test_runner/test:1332:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:911:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'verify-fail',
    expected: 'merged',
    operator: 'strictEqual',
    diff: 'simple'
  }

ℹ tests 110
ℹ suites 0
ℹ pass 109
ℹ fail 1
```

## Passing-after

Same test suite run against the committed fix (`bf083321`, HEAD):

```
ℹ tests 110
ℹ suites 0
ℹ pass 110
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6235.770017
```

All 110 test cases pass cleanly.
