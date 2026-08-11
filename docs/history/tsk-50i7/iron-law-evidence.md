# tsk-50i7 — Iron Law evidence

## classifyIronLaw result (against the real committed diff, `trunk...fgw/tsk-50i7`)

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/merge.mjs"]}
```

## Test command (item's own recorded `verify`)

```
node --test test/runner/merge.test.mjs -t "carries the real"
```

## Before (red) — `src/runner/merge.mjs` reverted to the pre-fix commit (`git checkout a2824688 -- src/runner/merge.mjs`), test file left in place with the new tsk-50i7 case

```
✖ mergeRunnerItem carries the real "git commit" stderr/status on its thrown MergeError, not just the generic wrapper message (54.348678ms)
  AssertionError [ERR_ASSERTION]: the real git stderr must reach the caller, not just the generic execFileSync wrapper message
      at TestContext.<anonymous> (test/runner/merge.test.mjs:655:10)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async Test.run (node:internal/test_runner/test:1332:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:911:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    expected: /refused by test hook for stderr-pinning/,
    operator: 'match',
    diff: 'simple'
  }

ℹ tests 63
ℹ suites 0
ℹ pass 62
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

This is the exact reported gap, reproduced live: the thrown `MergeError`'s
`.stderr` is `undefined` — only the generic `execFileSync` wrapper message
reaches the caller, never the real git failure reason (here, the injected
`"refused by test hook for stderr-pinning"` pre-commit hook output).

## After (green) — `src/runner/merge.mjs` restored to the committed fix (`git checkout HEAD -- src/runner/merge.mjs`)

```
ℹ tests 63
ℹ suites 0
ℹ pass 63
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Working tree confirmed byte-identical to the committed fix after restore
(`git status --short -- src/runner/merge.mjs test/runner/merge.test.mjs` →
empty). Full `npm test` also run clean on the committed fix beforehand:
2823 pass, 0 fail, 5 skipped (pre-existing, unrelated).
