# tsk-2x9k — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["bin/fgos.mjs"]`, `matchedFlags: []`.

## Test command

`node --test test/state/graph-harness.test.mjs && npm test` (the item's own `verify`; also run scoped: `node --test test/cli/fgos.test.mjs`)

## Failing-before (real transcript excerpt, before this item's `test/cli/fgos.test.mjs` fix)

After `bin/fgos.mjs`'s `case 'merge'`/`sub === 'list'` was wired to compose the new `tree` field (`{ ...mergeReadiness(...), tree: mergeTree(...) }`), the full suite immediately caught a real, pre-existing exact-shape assertion in `test/cli/fgos.test.mjs` that the change had not yet accounted for:

```
test at test/cli/fgos.test.mjs:8414:1
✖ merge list: a proposed item whose dep is NOT done waits, never ready (459.885417ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
    {
      blockedOnSync: [],
      conflicts: [],
      mergeSets: [],
      mergeTier: { ... },
      supersededOut: [],
  +   tree: [
  +     {
  +       children: [],
  +       id: 'leaf',
  +       status: 'waiting',
  +       title: 'Leaf'
  +     }
  +   ],
      waiting: [ 'leaf' ]
    }
```

This is real evidence the `bin/fgos.mjs` wiring change actually took effect on `fgos merge list --json`'s real output — a change with no observable effect could not have broken this assertion.

## Passing-after (real transcript excerpt, after updating the 3 affected `test/cli/fgos.test.mjs` assertions to expect the new `tree` field)

```
ℹ tests 576
ℹ pass 576
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
```

(`test/cli/fgos.test.mjs`, full file.)

Full `node --test test/state/graph-harness.test.mjs && npm test` after: `tests 2757 / pass 2752 / fail 0` (5 skipped, pre-existing and unrelated).

## What changed

`src/state/graph-harness.mjs` gains `mergeTree(view, readiness, opts)` — groups every id `mergeReadiness` already surfaces in any bucket (`ready`/`waiting`/`blockedOnSync`/footprint-conflicted/`supersededOut`) by `item.parent` into a recursive tree, sorted at every level by `rankImpact`'s existing `blocks` descending. `mergeReadiness`'s own return shape is untouched (its 4 existing exact-`deepEqual` tests in `test/state/graph-harness.test.mjs` still pass unmodified).

`bin/fgos.mjs`'s `case 'merge'`/`sub === 'list'` composes the new field one layer up: `{ ...mergeReadiness(...), tree: mergeTree(...) }` — this is the actual self-modifying change that tripped the Iron Law gate. Three exact-shape assertions in `test/cli/fgos.test.mjs` (lines 8381, 8406, 8421) were updated to expect the new `tree` field with the correct value for each scenario.
