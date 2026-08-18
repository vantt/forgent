# Iron Law evidence — tsk-5gu

`classifyIronLaw` result against the committed diff
(`git diff main...HEAD -- bin/fgos.mjs`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

## Failing-test-first proof

Command: `node --test test/cli/fgos-intake.test.mjs --test-name-pattern 'verify'`

**Before** (implementation diff reverse-applied via `git apply -R`, test
file kept as committed):

```
✔ submit with no --tier/--kind/--risk flags is byte-identical to pre-feature behavior (regression proof) (191.319072ms)
✔ submit --tier heavy --kind bug --risk heavy overrides all three fields regardless of classify(text) (182.883539ms)
✔ submit with only --kind overrides just that field; tier and risk still come from classify(text) (195.504274ms)
✔ submit --tier override alone does not change risk -- risk still mirrors classify()'s own tier, not the override (190.306379ms)
✖ submit --verify "npm test" sets the item's own verify to that command, not the sentinel (187.660947ms)
✔ submit without --verify leaves verify at the sentinel, byte-identical to pre-feature behavior (191.432334ms)
...
ℹ tests 118
ℹ pass 117
ℹ fail 1

✖ failing tests:

test at test/cli/fgos-intake.test.mjs:1040:1
✖ submit --verify "npm test" sets the item's own verify to that command, not the sentinel (187.660947ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'chưa xác định — P15 bổ sung'
  - 'npm test'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5gu-b6PrN9/test/cli/fgos-intake.test.mjs:1046:10)
```

**After** (implementation diff re-applied, matching the committed state
exactly):

```
✔ submit --verify "npm test" sets the item's own verify to that command, not the sentinel
✔ submit without --verify leaves verify at the sentinel, byte-identical to pre-feature behavior
...
ℹ tests 118
ℹ pass 118
ℹ fail 0
```

Full `npm test` run (all 3169 tests) also green after re-applying — see
the implementation commit's own history.
