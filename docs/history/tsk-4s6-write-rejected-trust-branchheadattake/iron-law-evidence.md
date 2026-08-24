# Iron Law evidence — tsk-4s6

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-4s6`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/merge.mjs"]
}
```

Verify command: `node --test test/runner/merge.test.mjs`

## Failing-test-first proof

The new test — `'mergeRunnerItem merges cleanly when a non-union .fgos/
path auto-merges to a value differing from HEAD, but the branch's own
field is unchanged since branchHeadAtTake (tsk-4s6)'` — run against
`src/runner/merge.mjs` at its state immediately BEFORE this item's fix
(the committed docs-only parent commit, `6ad3259f`), with only the test
file changed:

```
=== PRE-FIX (should FAIL) ===
✖ mergeRunnerItem merges cleanly when a non-union .fgos/ path auto-merges to a value differing from HEAD, but the branch's own field is unchanged since branchHeadAtTake (tsk-4s6) (100.517979ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'fgos-write-rejected'
  - 'merged'

      at TestContext.<anonymous> (file:///.../test/runner/merge.test.mjs:1716:10)
```

Same test, same repo, `src/runner/merge.mjs` restored to the real fix
(`isUnchangedSinceBranchHeadAtTake` + the widened restore-loop gate):

```
=== POST-FIX (should PASS) ===
✔ mergeRunnerItem merges cleanly when a non-union .fgos/ path auto-merges to a value differing from HEAD, but the branch's own field is unchanged since branchHeadAtTake (tsk-4s6) (119.031837ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Full suite, post-fix (`node --test test/runner/merge.test.mjs`):

```
ℹ tests 103
ℹ suites 0
ℹ pass 103
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

## Two rejected test shapes, kept as evidence of why the accepted shape is the real bug

1. **Branch simply never touches the path.** Passed identically with and
   without the fix — proved the test exercised nothing (git's own merge
   never even stages a diff for that path when `theirs == base`).
2. **Single-line file, both sides edit that one line.** A genuine content
   `CONFLICT` (git throws), which this fix's restore loop never reaches
   at all (it only runs after a *clean* merge that still leaves a staged
   diff) — failed even with the fix applied, for the wrong reason
   entirely.

The accepted shape (multi-field file, non-overlapping edits, enough
separating context lines for git to treat them as independent hunks)
reproduces the real, live bug this item was filed against: `fgw/tsk-25b`,
`docs/history/tsk-4s6-write-rejected-trust-branchheadattake/RESEARCH.md`
point 5.
