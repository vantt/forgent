# Iron Law evidence — tsk-13m

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-13m`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/session-identity.mjs"]}
```

Matched via the `src/runner/` prefix rule (`src/evolve/iron-law.mjs`), not
a heavy-risk keyword.

## Verify command

```
node --test test/runner/session-identity.test.mjs test/state/events.test.mjs && npm test
```

## RED — pre-fix (`src/runner/session-identity.mjs` at commit `c51f01ff`,
the commit immediately before this item's implementation landed)

```
$ node --test --test-name-pattern="tsk-13m" test/runner/session-identity.test.mjs
✖ ppidOf passes a bounded timeout to execFileSync, so a hung ps command cannot block the caller forever (tsk-13m)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'undefined'
  - 'number'
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

## GREEN — post-fix (working tree restored to the real committed state,
`git diff --stat` against the commit confirmed empty before this run)

```
$ node --test test/runner/session-identity.test.mjs test/state/events.test.mjs
✔ ppidOf passes a bounded timeout to execFileSync, so a hung ps command cannot block the caller forever (tsk-13m)
ℹ tests 43
ℹ pass 43
ℹ fail 0
```

Full `npm test` was also run clean against the final committed state
before `fgos return`.
