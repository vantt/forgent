# tsk-4gi — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/merge.mjs"]
}
```

## Failing-test-first proof

`test/runner/merge.test.mjs`'s new regression test, run against the pre-fix
version of `src/runner/merge.mjs` (`git show d3e155a1969bbafe6d700f51e5c0132a5c2e997f:src/runner/merge.mjs`,
swapped in temporarily via a copy of the file, then restored — working tree
confirmed clean against the fixed commit afterward):

```
✖ mergeRunnerItem merges cleanly when a merge=union .fgos/ file genuinely diverges between branch and main (tsk-4gi regression) (426.391343ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'fgos-write-rejected'
  - 'merged'

      at TestContext.<anonymous> (test/runner/merge.test.mjs:1536:10)
      at async Test.run (node:internal/test_runner/test:1332:7)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:385:3) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'fgos-write-rejected',
    expected: 'merged',
    operator: 'strictEqual',
    diff: 'simple'
  }
```

Same test, same repo, post-fix (`src/runner/merge.mjs` with the
restore-then-recheck change applied):

```
✔ mergeRunnerItem merges cleanly when a merge=union .fgos/ file genuinely diverges between branch and main (tsk-4gi regression) (106.797081ms)
```

A second new regression test proves the fix does not weaken the existing
protection for a NON-union `.fgos/` path (e.g. `.fgos/config.json`) that
auto-merges cleanly on non-overlapping lines — this must still be refused,
and is, both before and after the fix (the fix gates the restore on
`isMergeUnionPath`, which this path fails):

```
✔ mergeRunnerItem still refuses a non-union .fgos/ path that auto-merges cleanly on non-overlapping lines (tsk-4gi: fix must not weaken this) (90.644535ms)
```

The pre-existing test `mergeRunnerItem refuses a branch that stages a
change under .fgos/ — main left byte-for-byte unchanged, outcome
"fgos-write-rejected"` (a brand-new `.fgos/events.jsonl` never committed on
target's own HEAD, no `.gitattributes` in that test's repo) also still
passes unchanged after the fix, for the same reason: a path with no HEAD
version to restore to is left staged as-is rather than silently discarded.

## Full item verify command (already run)

```
node --test test/runner/merge.test.mjs
```

Result: 98 tests, 0 fail.

## Full suite (bare `node --test`, no arguments)

Result: 3901 tests, 3889 pass, 7 fail — identical fail count/names both
before and after this fix (confirmed by reproducing each of the 7 on a
pristine worktree at this branch's own pre-fix base commit,
`d3e155a1969bbafe6d700f51e5c0132a5c2e997f`): 2 already-tracked
(`herdr-plugin/web/src/api/client.test.ts`; `test/runner/claim-port.test.mjs`'s
read-count assertion, tsk-3tb) plus 5 more (`fgos-claim.test.mjs` x2,
`fgos-read.test.mjs` x1, `fgos-return.test.mjs` x1,
`test/e2e/runner-loop.test.mjs` x1) that reproduce identically on the
pristine base commit and are unrelated to `src/runner/merge.mjs` — none of
them import or exercise it.
