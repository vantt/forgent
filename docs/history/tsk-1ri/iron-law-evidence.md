# Iron Law evidence: tsk-1ri

`classifyIronLaw` result (computed post-commit, against the real
committed diff `trunk...fgw/tsk-1ri`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

`bin/fgos.mjs` is a self-modifying core module (the CLI entry point every
`fgos <verb>` invocation runs through) — matched regardless of description
flags.

## Test command

```
node --test --test-name-pattern='fgos setup initializes' test/setup/checks.test.mjs
```

## Failing-before transcript

`bin/fgos.mjs` temporarily reverted to its pre-tsk-1ri content
(`git show 4bd8035:bin/fgos.mjs`, the commit immediately before this
item's own `c521cee`), test file (already committed at HEAD) left
unchanged:

```
✖ fgos setup initializes ~/.fgos/config.json with the full default shape (tsk-1ri D1) when it does not exist (10527.50292ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 10588.231834

✖ failing tests:

test at test/setup/checks.test.mjs:553:1
✖ fgos setup initializes ~/.fgos/config.json with the full default shape (tsk-1ri D1) when it does not exist (10527.50292ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + undefined
  - '/tmp/setup-cli-global-config-home-xut2zE/.fgos/config.json'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-1ri-k2LMsj/test/setup/checks.test.mjs:560:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.start (node:internal/test_runner/test:1191:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:385:17) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: undefined,
    expected: '/tmp/setup-cli-global-config-home-xut2zE/.fgos/config.json',
    operator: 'strictEqual',
    diff: 'simple'
  }
```

## Passing-after transcript

`bin/fgos.mjs` restored to its committed (`c521cee`) content — the real
`globalConfigPath`/`globalConfigCreated`/`globalConfigAddedKeys` fields
added by this item:

```
✔ fgos setup initializes ~/.fgos/config.json with the full default shape (tsk-1ri D1) when it does not exist (10261.294331ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 10319.125031
```

`git diff --stat bin/fgos.mjs` against the committed tree was empty after
restoring — confirms the revert/restore round-trip touched no other
content.
