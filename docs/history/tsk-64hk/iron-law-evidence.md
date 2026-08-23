# Iron Law evidence — tsk-64hk

`classifyIronLaw` result (`src/evolve/iron-law.mjs`, computed against the
real committed `trunk...fgw/tsk-64hk` diff via `changedFiles`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/dispatch/cli.mjs",
    "src/runner/main-checkout-lock.mjs"
  ]
}
```

Test command: `node --test --test-name-pattern="tsk-64hk" test/runner/dispatch.test.mjs test/runner/main-checkout-lock.test.mjs`

Reconstructed (the implementing worker committed the fix directly; this
session reproduced the failing-before state by temporarily reverting
`src/runner/dispatch/cli.mjs`/`src/runner/main-checkout-lock.mjs` to their
pre-fix content at `71926c68` — the commit right before the real fix
`e28de3b7` — running the already-committed new tests against that reverted
source, then restoring `HEAD`'s real content and re-running. `git status`
was clean before and after; `HEAD` never moved.

## RED (pre-fix source, real new tests)

```
✖ executeExecutorCli refuses a concurrent dispatch for the same cwd with DispatchError(dispatch-in-flight) (tsk-64hk) (405.361614ms)
  AssertionError [ERR_ASSERTION]: expected DispatchError
✖ executeExecutorCli refuses with DispatchError(dispatch-in-flight) when lock file content is corrupt/ambiguous (tsk-64hk) (20.120014ms)
  TypeError: dispatchLockFile is not a function
✖ test/runner/main-checkout-lock.test.mjs (29.988282ms)
  SyntaxError: The requested module '../../src/runner/main-checkout-lock.mjs' does not provide an export named 'dispatchLockFile'
ℹ tests 3
ℹ pass 0
ℹ fail 3
```

## GREEN (fixed source, same tests)

```
✔ executeExecutorCli refuses a concurrent dispatch for the same cwd with DispatchError(dispatch-in-flight) (tsk-64hk) (693.055488ms)
✔ executeExecutorCli refuses with DispatchError(dispatch-in-flight) when lock file content is corrupt/ambiguous (tsk-64hk) (25.551712ms)
✔ dispatchLockFile is injective and produces filesystem-safe lock filenames (tsk-64hk) (1.102896ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

Full pre-existing suite unaffected: `node --test test/runner/dispatch.test.mjs test/runner/main-checkout-lock.test.mjs` at `HEAD` — 332/332 (worker's own report, cross-checked by this session's own baseline run at discovery time: 268/268 on `dispatch.test.mjs` alone before this item's new tests existed).
