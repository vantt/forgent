# tsk-62d — Iron Law evidence

`classifyIronLaw` (real run, post-commit, against the item's own actual
`changedFiles`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/prompt-templates/judge-scout-instructions.txt"
  ]
}
```

`filesChanged`: `.fgos-runner.json`, `docs/history/tsk-62d-judge-scout-capability/CONTEXT.md`,
`docs/history/tsk-62d-judge-scout-capability/plan.md`,
`docs/how-to/add-a-scoped-allowedtools-override-for-a-nested-executor-call.md`,
`src/intake/plan.mjs`, `src/intake/discovery.mjs`,
`src/intake/judge-executor.mjs`, `src/runner/prompt-templates/judge-scout-instructions.txt`,
`test/intake/judge-executor.test.mjs`.

Test command (the item's own `verify`, scoped to the new coverage for the
failing-before/passing-after pair below):

```
node --test --test-name-pattern="executors.judge" test/intake/judge-executor.test.mjs
```

## Failing before (pre-fix `judge-executor.mjs`, real new tests against it)

`src/intake/judge-executor.mjs` temporarily reverted to commit `8f293a0`
(the last commit before this item's implementation — `spawnAttempt` calling
`resolveExecutorCommand(cfg, { prompt, model })` with no `tier`), the new
test file (with the `executors.judge` coverage already written) run against
it as-is:

```
✖ runJudgeExecutor resolves through cfg.executors.judge when present, ahead of the base cfg.executor (34.599558ms)
✔ runJudgeExecutor falls back to the base cfg.executor when cfg.executors.judge is absent (29.670684ms)
ℹ tests 2
ℹ pass 1
ℹ fail 1

✖ failing tests:

test at test/intake/judge-executor.test.mjs:304:1
✖ runJudgeExecutor resolves through cfg.executors.judge when present, ahead of the base cfg.executor (34.599558ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

  + null
  - {
  -   clear: true,
  -   verify: 'from judge override'
  - }

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-62d-KyPMtQ/test/intake/judge-executor.test.mjs:314:10)
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: null,
    expected: { clear: true, verify: 'from judge override' },
    operator: 'deepStrictEqual',
    diff: 'simple'
```

## Passing after (real, committed `judge-executor.mjs` restored)

```
✔ runJudgeExecutor resolves through cfg.executors.judge when present, ahead of the base cfg.executor (22.871327ms)
✔ runJudgeExecutor falls back to the base cfg.executor when cfg.executors.judge is absent (20.434931ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

`git status --porcelain -- src/intake/judge-executor.mjs` was empty
immediately after restoring — the working file matches the real committed
`b4708fd` content byte-for-byte, no leftover from the temporary revert.
