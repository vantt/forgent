# Iron Law Evidence — main-checkout-reset-ancestor-check-guard

## Classification

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/runner/main-checkout-reset-guard.mjs"]}
```

## Scoped Test Command

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/main-checkout-reset-guard.test.mjs'
```

## Red Transcript (Failing Test Before Implementation)

When running the new test assertions in `test/runner/main-checkout-reset-guard.test.mjs` with implementation changes stashed, 2 tests failed as expected:

```
✖ failing tests:

test at test/runner/main-checkout-reset-guard.test.mjs:28:1
✖ refuses a destructive main-checkout reset when reset would discard committed commits and unconfirmed (1.334806ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception.
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/test/runner/main-checkout-reset-guard.test.mjs:29:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:911:18)
      at Test.postRun (node:internal/test_runner/test:1465:19)
      at Test.run (node:internal/test_runner/test:1390:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:911:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    operator: 'throws',
    diff: 'simple'
  }

test at test/runner/main-checkout-reset-guard.test.mjs:39:1
✖ refuses reset when tree is dirty AND would discard committed commits and unconfirmed (3.23327ms)
  AssertionError [ERR_ASSERTION]: The validation function is expected to return "true". Received false
  
  Caught error:
  
  UnsafeMainCheckoutResetError: Main checkout has uncommitted changes (full git status, not just the files you meant to touch) — refusing to reset --hard without --confirm. Review the status output, then re-run with --confirm once you are sure none of it belongs to another in-flight session.
```

## Green Transcript (Passing Test After Implementation)

Restoring the implementation files and re-running the exact same test command:

```
✔ refuses a destructive main-checkout reset when the tree is dirty and unconfirmed (3.705989ms)
✔ allows the reset once the caller has confirmed after seeing full git status (0.378236ms)
✔ allows the reset outright when the tree is already clean (0.270032ms)
✔ refuses a destructive main-checkout reset when reset would discard committed commits and unconfirmed (0.605113ms)
✔ refuses reset when tree is dirty AND would discard committed commits and unconfirmed (1.699602ms)
✔ allows resetting behind committed commits once confirmed (0.338843ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 157.497303
```
