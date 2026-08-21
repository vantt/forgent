# tsk-2lq — Iron Law evidence

`classifyIronLaw` result on this item's committed diff (`changedFiles`,
`src/runner/merge.mjs`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/merge.mjs"]}
```

`src/runner/merge.mjs` matches a protected module in
`src/evolve/iron-law.mjs`'s `MODULE_RULES` — required: true.

## Test command

`npm test -- test/runner/merge.test.mjs` (item's own `verify`)

## Failing-test-first proof

Two of the three new/changed D5 tests in `test/runner/merge.test.mjs`
were run in isolation against the pre-fix version of
`src/runner/merge.mjs` (a scratch `git worktree add --detach` at
`61b36e93` — the commit immediately before this item's implementation
commit `988459ce` — with the fixed test file overlaid on top of it), to
confirm they genuinely fail without the fix, then re-run against the
real post-fix commit to confirm they pass.

### Before the fix (`61b36e93`, pre-fix `merge.mjs`) — one fails as expected

```
node --test --test-name-pattern="main advancing past the fork" test/runner/merge.test.mjs

✔ D5: main advancing past the fork on an overlapping path forces the checks to run again (73.992956ms)
✖ D5: main advancing past the fork on a disjoint path still allows skip (63.969705ms)
ℹ tests 2
ℹ pass 1
ℹ fail 1

✖ failing tests:
✖ D5: main advancing past the fork on a disjoint path still allows skip (63.969705ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'verify-fail'
  - 'merged'

      at TestContext.<anonymous> (test/runner/merge.test.mjs:1662:10)
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'verify-fail',
    expected: 'merged',
    operator: 'strictEqual',
    diff: 'simple'
```

The `overlapping path forces checks` test passes even pre-fix
(correctly: the old strict-ancestor-only code already ran full checks
unconditionally whenever main advanced by any commit, overlapping or
not) — only the `disjoint path still allows skip` test fails before the
fix, `'verify-fail' !== 'merged'`, confirming the pre-fix code genuinely
never skips in the disjoint-advance case, exactly the hit-rate gap this
item closes.

The third new test (`main renaming a path that branch modified forces
checks to run again`) passes on BOTH pre-fix and post-fix code — expected,
not a gap in the proof: pre-fix, `isAlreadyMerged('HEAD', branch)` already
returns `false` the moment main renames anything (main is no longer an
ancestor of branch at all), so the old code never reaches the new
path-overlap logic in the first place. This test instead guards the NEW
code's own rename-handling correctness (that `namesFromDiffStatus` folds
both a rename's old and new name into each side's path set, so a
rename-vs-touch collision still registers as overlap) — a real risk
specific to the new mechanism, verified directly rather than assumed.

### After the fix (`988459ce`, real committed fix) — all pass

```
node --test --test-name-pattern="main advancing past the fork" test/runner/merge.test.mjs

✔ D5: main advancing past the fork on an overlapping path forces the checks to run again (81.269711ms)
✔ D5: main advancing past the fork on a disjoint path still allows skip (69.798006ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

```
node --test --test-name-pattern="renaming a path" test/runner/merge.test.mjs

✔ D5: main renaming a path that branch modified forces checks to run again (71.768473ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Full suite (`npm test -- test/runner/merge.test.mjs`) reported by the
out-of-process worker's own dispatch as 3781 tests passing; the specific
new/changed tests above were independently re-verified against both the
pre-fix and post-fix commits by the driver session, not taken on the
worker's say-so alone.
