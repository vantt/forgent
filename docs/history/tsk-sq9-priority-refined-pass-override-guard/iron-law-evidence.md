# Iron Law evidence: tsk-sq9

`classifyIronLaw` result against this item's real committed diff
(`trunk...fgw/tsk-sq9`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

Matched module: `bin/fgos.mjs` — a core module, so evidence is required
even though this change is two small additive call sites (per CONTEXT.md
D3/plan.md's Approach).

## Verify command

```
node --test test/intake/plan.test.mjs test/cli/fgos-edit.test.mjs
```

## Failing-test-first proof

The new regression test (`test/intake/plan.test.mjs`, `resolvePlan skips
its priority overwrite when a priority-override decision is on record,
writes normally otherwise`) run against `src/intake/plan.mjs` BEFORE the
fix (the pre-commit `HEAD~1` version, with `resolvePlan`'s refined pass
still calling `editWork` unconditionally):

```
✖ resolvePlan skips its priority overwrite when a priority-override decision is on record, writes normally otherwise (19.012306ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1

✖ failing tests:

test at test/intake/plan.test.mjs:425:1
✖ resolvePlan skips its priority overwrite when a priority-override decision is on record, writes normally otherwise (19.012306ms)
  AssertionError [ERR_ASSERTION]: the human-set value must survive the refined pass

  10000 !== 42

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-sq9-zhcByQ/test/intake/plan.test.mjs:441:10)
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: 10000,
    expected: 42,
    operator: 'strictEqual',
    diff: 'simple'
```

The same test run AFTER restoring the fix (the real committed
`src/intake/plan.mjs`):

```
✔ resolvePlan skips its priority overwrite when a priority-override decision is on record, writes normally otherwise (16.477282ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Full item verify command, green:

```
✔ (139 tests total across test/intake/plan.test.mjs + test/cli/fgos-edit.test.mjs)
ℹ tests 139
ℹ pass 139
ℹ fail 0
```

Full repo suite (`npm test`), also green, no regressions:

```
ℹ tests 3124
ℹ pass 3119
ℹ fail 0
ℹ skipped 5
```
