# Iron Law evidence: tsk-53o

`classifyIronLaw` result (computed post-commit, against the real diff):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/goal-check.mjs",
    "src/runner/loop.mjs",
    "src/runner/recovery.mjs"
  ]
}
```

`src/runner/goal-check.mjs`/`src/runner/loop.mjs`/`src/runner/recovery.mjs`/
`bin/fgos.mjs` are self-modifying core runner modules — matched regardless
of description flags.

## Test command

```
node --test --test-name-pattern="on a timeout, and kills the process" test/runner/goal-check.test.mjs
```

## Failing-before transcript

`src/runner/goal-check.mjs` temporarily reverted to its pre-tsk-53o content
(commit `7888eec`, before the `timedOut` field was added), test file
(already committed at HEAD, carrying the new `timedOut` assertion) left
unchanged:

```
✖ runGoalCheck resolves (never throws/rejects) {passed:false, status:null} on a timeout, and kills the process (206.693551ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1575.900269

✖ failing tests:

test at test/runner/goal-check.test.mjs:71:1
✖ runGoalCheck resolves (never throws/rejects) {passed:false, status:null} on a timeout, and kills the process (206.693551ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + undefined
  - true

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-53o-xdy7Gl/test/runner/goal-check.test.mjs:93:10)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async Test.run (node:internal/test_runner/test:1332:7)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:385:3) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: undefined,
    expected: true,
    operator: 'strictEqual',
    diff: 'simple'
  }
```

## Passing-after transcript

`src/runner/goal-check.mjs` restored to its committed (`781dc1d`)
content — the real `timedOut` field:

```
✔ runGoalCheck resolves (never throws/rejects) {passed:false, status:null} on a timeout, and kills the process (204.945261ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1579.498229
```

`git diff --stat src/runner/goal-check.mjs` against the committed tree was
empty after restoring — confirms the revert/restore round-trip touched no
other content.
