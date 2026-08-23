# Iron Law evidence: tsk-6uc

Classified against the real committed diff (`963debe4...4ea17d8e`,
`src/runner/lock-wait.mjs` + `test/runner/lock-wait.test.mjs`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/lock-wait.mjs"]
}
```

`src/runner/lock-wait.mjs` matched a protected module — no risk flag
matched (no auth/data/audit-security keyword in the diff or description).

Verify command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
test/runner/lock-wait.test.mjs`

## Failing-before

`test/runner/lock-wait.test.mjs`'s three new cases (self-qualifier
numeric match, other-qualifier numeric mismatch, self-qualifier string
match) run against the pre-fix `src/runner/lock-wait.mjs` (commit
`963debe4`, before this item's `4ea17d8e`) — all three fail, proving the
tests actually exercise the new behavior rather than passing vacuously:

```
✖ withLockRetry: renders self qualifier when numeric holderPid equals process.pid (tsk-6uc) (1151.334649ms)
  AssertionError [ERR_ASSERTION]: numeric holderPid equal to process.pid must render the self qualifier
      at TestContext.<anonymous> (file:///.../test/runner/lock-wait.test.mjs:177:10)
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: '==',
    diff: 'simple'

✖ withLockRetry: renders other qualifier when numeric holderPid is different from process.pid (tsk-6uc) (1150.654157ms)
  AssertionError [ERR_ASSERTION]: numeric holderPid different from process.pid must render the other qualifier
      at TestContext.<anonymous> (file:///.../test/runner/lock-wait.test.mjs:199:10)
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: '==',
    diff: 'simple'

✖ withLockRetry: renders self qualifier when string holderPid equals env session id (tsk-6uc) (1150.8913ms)
  AssertionError [ERR_ASSERTION]: string holderPid matching env session id must render the self qualifier
      at TestContext.<anonymous> (file:///.../test/runner/lock-wait.test.mjs:229:10)
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: '==',
    diff: 'simple'
```

## Passing-after

Same test file, against the real committed fix (`4ea17d8e`, current
`HEAD`):

```
ℹ tests 13
ℹ suites 0
ℹ pass 13
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

All 13 cases pass — the 10 pre-existing cases (unaffected by this
change) plus the 3 new self/other-qualifier cases above.
