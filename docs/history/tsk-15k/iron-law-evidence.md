# tsk-15k — Iron Law evidence

`classifyIronLaw` result on this item's committed diff (`changedFiles`,
`src/runner/merge.mjs`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/merge.mjs"]}
```

`src/runner/merge.mjs` is a self-modifying-capable module per
`src/evolve/iron-law.mjs`'s `MODULE_RULES` — required: true.

## Test command

`node --test test/runner/merge.test.mjs`

## Failing-test-first proof

The new regression test was run against the pre-fix version of
`src/runner/merge.mjs` (`git show HEAD~1:src/runner/merge.mjs`, i.e. the
commit immediately before this item's implementation commit) to confirm
it genuinely fails without the fix, then against the fixed version to
confirm it passes.

### Before the fix — fails as expected

```
✖ mergeRunnerItem does not report "merged" when an already-ancestor branch had its content discarded by an earlier "git merge -s ours" (36.792581ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'merged'
  - 'verify-fail'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-15k-pOfKuT/test/runner/merge.test.mjs:687:10)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async Test.run (node:internal/test_runner/test:1332:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:911:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'merged',
    expected: 'verify-fail',
    operator: 'strictEqual',
    diff: 'simple'
  }

ℹ tests 52
ℹ suites 0
ℹ pass 51
ℹ fail 1
```

Confirms the pre-fix code genuinely reports `outcome: 'merged'` for the
constructed false-done scenario — exactly the bug this item fixes, not a
hypothetical.

### After the fix — passes

```
ℹ tests 52
ℹ suites 0
ℹ pass 52
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Full `test/runner/merge.test.mjs` suite: 52/52 passing, including the new
test and both pre-existing tsk-3yl tests it sits alongside.

## Broader regression check

Full repo test suite (`node --test 'test/**/*.test.mjs'`): 2145/2152
passing. The 2 failures (`test/architecture.test.mjs`'s manifest-parity
check, `test/skills/fgos-mirror.test.mjs`'s mirror-parity check) are
confirmed pre-existing on `main` — unrelated to this item's scope
(`src/runner/merge.mjs`), not introduced by this change.
