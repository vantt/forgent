# Iron Law evidence: tsk-4jf

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff (post-commit, `a871c78`) returned `required: true` —
`matchedModules: ["bin/fgos.mjs"]` (self-modifying: this item edits the
CLI's own `case 'cleanup':` dispatch), `matchedFlags: []`.

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

## Failing-test-first proof

Test command: `node --test --test-name-pattern="cleanup is a no-op" test/cli/fgos.test.mjs`.

**Before the fix** (source files reverted to `48f9252`, the commit
immediately before this item's implementation — `bin/fgos.mjs`,
`src/state/cleanup-harness.mjs`, `src/state/cleanup-pool.mjs`): the new
test asserts that `cleanup` on an item whose TTL alone hasn't elapsed
stays at status `cleanup` with zero new events. The old `case 'cleanup':`
parked ANY failing check (including TTL-not-elapsed alone) straight to
`blocked`, so the assertion on the resulting status failed. Real
transcript:

```
✖ cleanup is a no-op — writes zero work.move events and stays at cleanup — when only TTL has not elapsed and the D8 checks pass (401.379314ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'blocked'
  - 'cleanup'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4jf-Ypnajw/test/cli/fgos.test.mjs:8499:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.start (node:internal/test_runner/test:1191:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:385:17) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'blocked',
    expected: 'cleanup',
    operator: 'strictEqual',
    diff: 'simple'
  }
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

**After the fix** — `assessCleanupReadiness` (`src/state/cleanup-harness.mjs`)
returns `{ ready, notReadyYet, failed }` instead of `{ ready, reasons }`,
and `bin/fgos.mjs`'s `case 'cleanup':` parks `blocked` only when `failed`
is non-empty; `notReadyYet` alone (TTL not elapsed) is now a no-op — no
`moveWork` call, item stays at `cleanup`. Same test, real transcript:

```
✔ cleanup is a no-op — writes zero work.move events and stays at cleanup — when only TTL has not elapsed and the D8 checks pass (384.933137ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Full suite after the fix (the item's own recorded `verify` command run in
full — `node --test test/state/cleanup-harness.test.mjs
test/state/cleanup-pool.test.mjs test/cli/fgos.test.mjs`): **553 tests,
553 pass, 0 fail, 0 cancelled, 0 skipped**.
