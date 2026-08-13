# Iron Law evidence — tsk-280

`classifyIronLaw` result against the committed diff
(`git diff main...HEAD -- bin/fgos.mjs`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

## Failing-test-first proof

Command: `node --test test/cli/fgos-move.test.mjs --test-name-pattern
'skip-return-guard|awaiting-approval on a|NON-"doing"'`

**Before** (the `move` guard's implementation diff in `bin/fgos.mjs`
reverse-applied via `git apply -R`, all test files kept as committed):

```
✖ move --to awaiting-approval on a "doing" item is REFUSED without --skip-return-guard, no event written
  AssertionError: Expected "actual" to be strictly unequal to: 0
  (the move succeeded with exit 0 -- no guard fired)

✖ move --to awaiting-approval with --skip-return-guard proceeds despite "doing" status, and logs the reason to the decision log
  AssertionError: override must be recorded to the decision log
  (no decision was logged, because no guard/override path exists yet)

✖ move --to awaiting-approval on a "doing" item refuses even with an EMPTY --skip-return-guard value (validation, not a silent bypass)
  AssertionError: Expected "actual" to be strictly unequal to: 0
  (an empty --skip-return-guard was accepted -- there was no flag to parse at all)

ℹ tests 10
ℹ pass 7
ℹ fail 3
```

(the 4th new test, "on a NON-doing item is never gated", passed even
before the fix — expected, since it asserts behavior the guard was never
meant to change)

**After** (implementation re-applied, matching the committed state
exactly):

```
✔ move --to awaiting-approval on a "doing" item is REFUSED without --skip-return-guard, no event written
✔ move --to awaiting-approval with --skip-return-guard proceeds despite "doing" status, and logs the reason to the decision log
✔ move --to awaiting-approval on a "doing" item refuses even with an EMPTY --skip-return-guard value (validation, not a silent bypass)
✔ move --to awaiting-approval on a NON-"doing" item is never gated by the return-guard check

ℹ tests 10
ℹ pass 10
ℹ fail 0
```

Full `npm test` (all 3173 tests) also green after re-applying — 3168
pass, 0 fail, 5 skipped (unrelated, pre-existing).
