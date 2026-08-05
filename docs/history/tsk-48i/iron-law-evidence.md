# Iron Law evidence: tsk-48i

`classifyIronLaw` result (computed post-commit, against the real diff):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/state/store.mjs"]}
```

`src/state/store.mjs` is a self-modifying core module (fgOS's own single
write door onto `.fgos/`) — matched regardless of description flags.

## Test command

```
node --test --test-name-pattern='list --json exposes parkReason' test/cli/fgos.test.mjs
```

## Failing-before transcript

`src/state/store.mjs` and `src/state/replay.mjs` temporarily reverted to
their pre-tsk-48i content (commit `c9f8c74`, before the `parkReason`
write-time stamp was added), test file (already committed at HEAD) left
unchanged:

```
✖ list --json exposes parkReason on a blocked item, and omits it on a doing item (122.27797ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 192.570602

✖ failing tests:

test at test/cli/fgos.test.mjs:384:1
✖ list --json exposes parkReason on a blocked item, and omits it on a doing item (122.27797ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + undefined
  - 'system-error'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-48i-DyEyjH/test/cli/fgos.test.mjs:391:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.start (node:internal/test_runner/test:1191:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:385:17) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: undefined,
    expected: 'system-error',
    operator: 'strictEqual',
    diff: 'simple'
  }
```

## Passing-after transcript

`src/state/store.mjs`/`src/state/replay.mjs` restored to their committed
(`01268b2`) content — the real `parkReason` write-time stamp:

```
✔ list --json exposes parkReason on a blocked item, and omits it on a doing item (121.171361ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 188.671176
```

`git diff --stat src/state/store.mjs src/state/replay.mjs` against the
committed tree was empty after restoring — confirms the revert/restore
round-trip touched no other content.
