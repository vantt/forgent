# Iron Law evidence: tsk-3ti-1

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the real committed diff:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/dispatch/cli.mjs"
  ]
}
```

## Verify command

```bash
npm test
```

## Failing-before / passing-after transcript

**Before** (commit `930b7e5e`, `src/runner/dispatch/cli.mjs`): `executorIdForWork` declared
`(work, stage, role)` — 3 parameters, with `role` never read in the body, and a
JSDoc comment claiming a `(domain, stage, role)` resolution key that did not exist.

**After** (commit `9d08a070`): the dead `role` parameter and its false JSDoc claim
are removed — `executorIdForWork` now declares `(work, stage)`, arity 2.

The regression test added in the same commit asserts the real function arity:

```javascript
assert.equal(executorIdForWork.length, 2);
```

This assertion is a direct, mechanical proof of failing-before/passing-after —
`Function.prototype.length` on the pre-fix 3-parameter declaration is `3`, which
fails `assert.equal(executorIdForWork.length, 2)` deterministically; the fix
changes the arity to `2`, which the same assertion now proves.

Verified with the real test suite:
```
$ node --test test/runner/dispatch.test.mjs
✔ executorIdForWork respects stage parameter and work.stage property, and has length 2 (dead role param removed) (0.072328ms)
```

Full suite: `npm test` — 3727/3727 passing on the merged branch.
