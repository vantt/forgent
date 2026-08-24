# tsk-5zv — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedFlags: ["audit"]`, `matchedModules: ["bin/fgos.mjs", "src/runner/promote-engine.mjs"]`.

## Test command

`node --test test/cli/fgos-post-merge.test.mjs test/runner/promote-engine.test.mjs` (the four new tests), plus the full `npm test`.

## Failing-before (real transcript excerpt, source reverted to pre-fix `bin/fgos.mjs`/`promote-engine.mjs`, new tests kept)

Since the new tests were added in the same commit as the fix (323d1b92), the
failing-before proof was produced by temporarily reverting only the two
source files to the parent commit (`490c5fc2`, before the fix) while keeping
the new tests, running them, then restoring the fix commit's source files
before continuing:

```
✖ cleanup (to blocked branch) releases main-checkout lock held by caller session (tsk-5zv) (583.081289ms)
  AssertionError [ERR_ASSERTION]: cleanup -> blocked must release the session lock early
  true !== false

✖ cleanup (to done branch) releases main-checkout lock held by caller session (tsk-5zv) (897.47014ms)
  AssertionError [ERR_ASSERTION]: cleanup -> done must release the session lock early
  true !== false

✖ compound releases main-checkout lock held by caller session (tsk-5zv) (632.236997ms)
  AssertionError [ERR_ASSERTION]: compound must release the session lock early after addOutcome
  true !== false

✖ retargetMember retries on lock-held and succeeds once the lock clears (withLockRetry wrap) (86.825677ms)
  Error [MergeError]: cannot merge "fgw/member-a": main checkout is locked by pid other-session (held 0s, expires in 2m59s).
      at mergeRunnerItem (src/runner/merge.mjs:911:11)
      at src/runner/promote-engine.mjs:73:5
      at retargetMember (src/runner/promote-engine.mjs:72:24)

ℹ tests 68
ℹ suites 0
ℹ pass 64
ℹ fail 4
ℹ skipped 0
```

Exactly the 4 new tests fail against the pre-fix source; every other test
in both files still passes — the tests are genuinely exercising the bug,
not vacuous.

## Passing-after (real transcript excerpt, fix commit's source restored)

```
ℹ tests 68
ℹ suites 0
ℹ pass 68
ℹ fail 0
ℹ skipped 0
```

Full `npm test` after: `tests 3874 / pass 3869 / fail 0` (5 skipped, none failing).

## What changed

- `bin/fgos.mjs` — `case 'cleanup'` calls `releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id)` at both settling points (`to: 'blocked'`, `to: 'done'`); `case 'compound'` calls it right after `addOutcome`. Mirrors `case 'return'`'s already-shipped `tsk-45z` pattern.
- `src/runner/promote-engine.mjs` — `retargetMember`'s `mergeRunnerItem` call is now wrapped in `withLockRetry(() => mergeRunnerItem(...), { waitMs: undefined })`, matching the `runMerge` wrapper `src/verbs/merge/approve.mjs`/`src/verbs/merge/sync-root.mjs` already use — closes the contention asymmetry for `promote-to-component` (D1, `docs/history/tsk-5zv/CONTEXT.md`).
- `test/cli/fgos-post-merge.test.mjs` / `test/runner/promote-engine.test.mjs` — three CLI-level release-timing tests and one retry-on-lock-held unit test, added in the fix commit itself.
