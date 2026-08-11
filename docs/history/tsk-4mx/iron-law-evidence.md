# Iron Law evidence — tsk-4mx

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-4mx`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/state/store.mjs"]}
```

Matched via the `src/state/store.mjs` exact-path rule (`src/evolve/iron-law.mjs`).

## Verify command

```
node --test test/state/store.test.mjs && npm test
```

## RED — pre-fix (`src/state/store.mjs` at commit `18b90ab8`, the commit
immediately before this item's implementation landed)

```
$ node --test --test-name-pattern="tsk-4mx" test/state/store.test.mjs
✖ writeView writes state.json via a temp-file-then-rename, never a direct writeFileSync onto it (tsk-4mx)
  AssertionError [ERR_ASSERTION]: no writeFileSync call may target state.json directly
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

## GREEN — post-fix (working tree restored to the real committed state,
`git diff --stat` against the commit confirmed empty before this run)

```
$ node --test test/state/store.test.mjs
ℹ tests 52
ℹ pass 52
ℹ fail 0
```

Full `npm test` was also run clean against the final committed state
before `fgos return`.

## Note on scope correction

This item's own `CONTEXT.md` D4 (`docs/history/tsk-5nj-state-json-write-
only-cost/CONTEXT.md`) records a self-correction found while implementing:
the originally-planned "move refreshView's write inside the lock" half of
this fix turned out to already be true (fixed once before, under
`tsk-1q5`) — a misread of a historical fix-description comment, not a
live gap. This item's real, committed diff is exactly the atomic-write
half, confirmed against the actual pre-fix code above.
