# Iron Law evidence: tsk-6at

`classifyIronLaw` result on the real committed diff:
`{"required":true,"matchedFlags":["migration"],"matchedModules":[]}`.

`migration` matched from this item's own description text (referring to
the JSON `--write-baseline` regen the review checked for staleness, not a
schema/DB migration — same word that also tripped the `validateApprove`
gate's hard-gate keyword floor at planning, human-confirmed there before
implementation started; see `docs/history/tsk-6at-citation-drift-review-round/plan.md`'s
own Gate note).

## Test command

```
node --test --test-name-pattern="not silently absorbed" test/scripts/check-decision-citation-drift.test.mjs
```

## Failing before the fix (real transcript)

Ran against the pre-fix `scripts/check-decision-citation-drift.mjs`
(`HEAD~1`, membership-only `findNewFindings`) with the new test already in
place:

```
✖ a genuinely new Nth occurrence of an already-duplicated key is not silently absorbed (tsk-6at: count consumption, not membership) (2.623915ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 66.06226

✖ failing tests:

test at test/scripts/check-decision-citation-drift.test.mjs:495:1
✖ a genuinely new Nth occurrence of an already-duplicated key is not silently absorbed (tsk-6at: count consumption, not membership) (2.623915ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  0 !== 1

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-6at-N98EnN/test/scripts/check-decision-citation-drift.test.mjs:533:12)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.start (node:internal/test_runner/test:1191:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:385:17) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 0,
    expected: 1,
    operator: 'strictEqual',
    diff: 'simple'
  }
```

## Passing after the fix (real transcript)

Ran against the committed post-fix script (count-consumption
`findNewFindings`):

```
✔ a genuinely new Nth occurrence of an already-duplicated key is not silently absorbed (tsk-6at: count consumption, not membership) (1.895616ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 70.730303
```

Full suite, same command as the item's own `verify`
(`node --test test/scripts/check-decision-citation-drift.test.mjs`): 30/30
pass post-fix.
