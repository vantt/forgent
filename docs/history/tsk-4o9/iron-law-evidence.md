# Iron Law evidence — tsk-4o9

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-4o9`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/runner/goal-check.mjs"]}
```

Matched via the `bin/fgos.mjs` exact-path rule and the `src/runner/`
prefix rule (`src/evolve/iron-law.mjs`).

## Verify command

```
node --test test/runner/goal-check.test.mjs test/cli/fgos.test.mjs && npm test
```

## RED — pre-fix (`src/runner/goal-check.mjs` and `bin/fgos.mjs` at
commit `a9b1b81d`, the commit immediately before this item's
implementation landed)

```
$ node --test --test-name-pattern="detachedWorktreeFgosHint" test/runner/goal-check.test.mjs
✖ test/runner/goal-check.test.mjs
  SyntaxError: The requested module '../../src/runner/goal-check.mjs' does not
  provide an export named 'detachedWorktreeFgosHint'
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

## GREEN — post-fix (working tree restored to the real committed state,
`git diff --stat` against the commit confirmed empty before this run)

```
$ node --test test/runner/goal-check.test.mjs
ℹ tests 14
ℹ pass 14
ℹ fail 0

$ node --test test/cli/fgos.test.mjs
ℹ tests 580
ℹ pass 580
ℹ fail 0
```

Full `npm test` was also run clean against the final committed state
before `fgos return`.
