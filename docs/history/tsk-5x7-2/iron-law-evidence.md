# Iron Law Evidence for `tsk-5x7-2`

## Classification

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs","src/runner/dispatch/cli.mjs","src/runner/dispatch/plan.mjs","src/runner/dispatch/resolve.mjs"]}
```

## Failing Test Output (Red)

Command executed:
`node --test test/runner/egress-governance.test.mjs`

Transcript excerpt:
```text
✖ declared egress: glm executor keeping command "claude" but setting ANTHROPIC_BASE_URL to OpenRouter fails when allowCrossProvider is missing (0.844895ms)
✖ declared egress: glm executor with ANTHROPIC_BASE_URL and allowCrossProvider: true passes gate and carries governance descriptor (0.668601ms)
✖ declared egress: native claude executor resolves same-provider governance descriptor (0.194341ms)
✖ declared egress: non-Claude command (agy) with allowCrossProvider: true resolves cross-provider governance descriptor (0.177358ms)
ℹ tests 4
ℹ suites 0
ℹ pass 0
ℹ fail 4
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 64.502213

✖ failing tests:

test at test/runner/egress-governance.test.mjs:7:1
✖ declared egress: glm executor keeping command "claude" but setting ANTHROPIC_BASE_URL to OpenRouter fails when allowCrossProvider is missing (0.844895ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception.
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5x7-2-yyXcDx/test/runner/egress-governance.test.mjs:23:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.start (node:internal/test_runner/test:1191:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:385:17) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    operator: 'throws',
    diff: 'simple'
  }
```

## Passing Test Output (Green)

Command executed:
`node --test test/runner/egress-governance.test.mjs`

Transcript excerpt:
```text
✔ declared egress: glm executor keeping command "claude" but setting ANTHROPIC_BASE_URL to OpenRouter fails when allowCrossProvider is missing (0.835582ms)
✔ declared egress: glm executor with ANTHROPIC_BASE_URL and allowCrossProvider: true passes gate and carries governance descriptor (0.502927ms)
✔ declared egress: native claude executor resolves same-provider governance descriptor (0.104239ms)
✔ declared egress: non-Claude command (agy) with allowCrossProvider: true resolves cross-provider governance descriptor (0.096533ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 67.970071
```
