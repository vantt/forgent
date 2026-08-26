# Iron Law Evidence for `tsk-5x7-3`

## Classification

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs","src/runner/dispatch/cli.mjs","src/runner/dispatch/plan.mjs","src/runner/dispatch/resolve.mjs","src/runner/dispatch/transport.mjs"]}
```

- **Item ID**: `tsk-5x7-3`
- **Description**: `herdr-spawn adapter: run the worker in a real Herdr pane, protocol untouched`
- **Gated Modules**: `src/runner/dispatch/transport.mjs`

## Failing Test Transcript (Red — without implementation)

```
✖ herdr-spawn adapter is registered in EXECUTOR_ADAPTERS and validated by loadRunnerConfig (5.341483ms)
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:

    assert.ok('herdr-spawn' in EXECUTOR_ADAPTERS)

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5x7-3-XrG9KL/test/runner/herdr-spawn-adapter.test.mjs:65:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.start (node:internal/test_runner/test:1191:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:385:17) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: '==',
    diff: 'simple'
  }

test at test/runner/herdr-spawn-adapter.test.mjs:90:1
✖ herdr-spawn adapter ALWAYS creates a fresh pane (hard constraint C1 / tsk-1nih) and never reuses (0.7943ms)
  TypeError: herdrSpawn is not a function
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5x7-3-XrG9KL/test/runner/herdr-spawn-adapter.test.mjs:113:22)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
```

## Passing Test Transcript (Green — with implementation)

```
✔ herdr-spawn adapter is registered in EXECUTOR_ADAPTERS and validated by loadRunnerConfig (0.872604ms)
✔ herdr-spawn adapter ALWAYS creates a fresh pane (hard constraint C1 / tsk-1nih) and never reuses (170.766533ms)
✔ herdr-spawn adapter respects MAX_DISPATCH_DEPTH nested dispatch cap (0.312638ms)
✔ herdr-spawn adapter handles timeout via DispatchError worker-timeout (105.4706ms)
✔ D2 hard constraint assertion: Herdr runtime signals alone NEVER mutate task status or state transitions (2.213603ms)
ℹ tests 322
ℹ suites 0
ℹ pass 322
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 12097.857118
```
