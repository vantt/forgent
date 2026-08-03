# tsk-18a — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs", "src/runner/merge.mjs"]
}
```

## Failing-test-first proof

`test/runner/merge.test.mjs`'s new test, run against the pre-fix version
of `src/runner/merge.mjs` (`git show HEAD~1:src/runner/merge.mjs`, swapped
in temporarily, then restored — working tree confirmed clean against
`HEAD` afterward):

```
✖ mergeRunnerItem reports "merge-failed-unclassified" (not "conflict") when the merge fails without ever creating MERGE_HEAD (40.912954ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'conflict'
  - 'merge-failed-unclassified'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-18a-5RbnVP/test/runner/merge.test.mjs:377:10)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async Test.run (node:internal/test_runner/test:1332:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:911:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'conflict',
    expected: 'merge-failed-unclassified',
    operator: 'strictEqual',
    diff: 'simple'
  }
```

Same test, same repo, post-fix (`src/runner/merge.mjs` at `HEAD`):

```
✔ mergeRunnerItem reports "merge-failed-unclassified" (not "conflict") when the merge fails without ever creating MERGE_HEAD (62.888662ms)
```

## Full item verify command (step 3, already run)

```
test -f docs/history/tsk-18a-merge-conflict-misclassification/repro-notes.md && node --test test/runner/merge.test.mjs test/cli/fgos.test.mjs
```

Result: 521 tests, 0 fail.
