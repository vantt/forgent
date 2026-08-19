# iron-law-evidence.md — tsk-1ai

`classifyIronLaw` matched `src/runner/dispatch/config.mjs`/
`src/runner/dispatch/resolve.mjs` (self-modifying dispatch modules) —
`required: true`. Real failing-test-first proof below: the fix's own
commit (`8f967ca1`) reverted (source only, test file kept at its new
shape), test run captured RED, fix restored, test run captured GREEN.

## Command

```bash
node --test test/runner/dispatch.test.mjs
```

## RED (source reverted to `HEAD~1`, test file at its new `8f967ca1` shape)

```
ℹ tests 268
ℹ pass 266
ℹ fail 2

✖ failing tests:
✖ resolveExecutorAndOverrides resolves via "prefer" even when the preferred executor declares no "for" at all (D5 -- supersedes D2's own symmetry requirement) (0.190939ms)
✖ loadRunnerConfig accepts "prefer" naming a real executor that declares no matching "for" (D5 -- supersedes D2's own load-time symmetry check) (0.655011ms)
```

Real captured assertion for the first failure:

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected
+ null
- 'agy'
    at TestContext.<anonymous> (test/runner/dispatch.test.mjs:3333:18)
category: 'validation'
```

Real captured assertion for the second failure:

```
AssertionError [ERR_ASSERTION]: Got unwanted exception.
Actual message: "runner config (/tmp/fgos-dispatch-test-MCyBJh/prefer-no-for.json capabilities.fgos-coding-implement) \"prefer\" names \"agy\" but that executor does not declare \"for\" including \"fgos-coding-implement\" itself (symmetry required, D2)."
    at TestContext.<anonymous> (test/runner/dispatch.test.mjs:3453:10)
    at src/runner/dispatch/config.mjs:795:15
    at loadRunnerConfig (src/runner/dispatch/config.mjs:70:3)
```

Exactly the 2 tests whose assertion direction the fix flips — every other
test (266) already passed unchanged against the old code, confirming the
change is a strict relaxation with no other side effects.

## GREEN (source restored to `8f967ca1`)

```
ℹ tests 268
ℹ suites 0
ℹ pass 268
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

## Real config resolution, verified live against this branch's own committed code

The `.fgos/config.json` companion change (`capabilities["fgos-coding-
implement"] = {prefer: "agy"}`, `agy` itself carrying no `for`) cannot
land on `main` before this item's own code fix merges there — `main`'s
`resolve.mjs` still enforces the old symmetry requirement until then, so
applying the config change first would break every coding item's dispatch
resolution in the meantime (confirmed live: attempting it against `main`'s
own unfixed `resolve.mjs` threw the real pre-fix `RunnerConfigError`,
reverted immediately, never left on `main`). Verified instead against
THIS branch's own committed fix, using a synthetic `cfg` matching the
real intended shape exactly (`agy` with no `for` array at all,
`capabilities["fgos-coding-implement"].prefer: "agy"`):

```
agy.for: undefined
{ "executorId": "agy", "configured": true }
```

The actual `.fgos/config.json` edit lands as its own direct main-checkout
commit (ADR0020) immediately after this item's own code fix is approved —
same two-step sequencing tsk-1cn/tsk-1dsr's own config changes already
used.
