# Iron Law evidence: tsk-2ie

Classification (`classifyIronLaw({ filesChanged, description })`, run at
`fgos-coding-implement` time against the item's own diff, the same function/module
list `approve`'s real gate uses — `src/evolve/iron-law.mjs`):

```json
{
  "required": true,
  "matchedFlags": ["schema"],
  "matchedModules": []
}
```

Test command (the item's own `work.verify`, run exactly as recorded, never
substituted): `npm test`

## Failing-before

The first full `npm test` run after implementing the `src/` changes
(`work.mjs`, `store.mjs`, `graph-harness.mjs`, `bin/fgos.mjs`) but before
updating the pre-existing test suite's own literal expectations — the
additive `supersededOut` key broke every test asserting `mergeReadiness`'s
full return shape via `deepStrictEqual`, a real, directly-caused red state:

```
test at test/state/graph-harness.test.mjs:43:1
✖ mergeReadiness: only proposed items are considered — todo/doing/done/blocked never appear in ready or waiting (1.372432ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    actual: { ready: [ 'e' ], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], mergeTier: { e: 'root-to-main' }, supersededOut: [] },
    expected: { ready: [ 'e' ], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], mergeTier: { e: 'root-to-main' } },
    operator: 'deepStrictEqual'
```

A second run, after fixing `test/state/graph-harness.test.mjs`'s literals
but before touching `test/cli/fgos.test.mjs`, surfaced the same real
failure one layer up, at the CLI's own `merge list` output assertion:

```
test/cli/fgos.test.mjs:7062
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    actual: { ready: [], waiting: [ 'leaf' ], conflicts: [], mergeSets: [], blockedOnSync: [], mergeTier: { leaf: 'root-to-main' }, supersededOut: [] },
    expected: { ready: [], waiting: [ 'leaf' ], conflicts: [], mergeSets: [], blockedOnSync: [], mergeTier: { leaf: 'root-to-main' } },
    operator: 'deepStrictEqual'
```

## Passing-after

Full suite, run exactly as `work.verify` records it (`npm test`), after
`test/state/graph-harness.test.mjs`'s and `test/cli/fgos.test.mjs`'s
literal expectations were updated to include `supersededOut`, plus the new
behavior-coverage tests (D2/D4 exclusion cases, `work.mjs` validation
cases, CLI `--superseded-by`/`--duplicates` round-trip cases):

```
ℹ tests 2269
ℹ suites 0
ℹ pass 2264
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 123229.473025
```

Baseline (pre-diff, same command, same test files, captured at
`fgos-coding-validating` time before any implementation started): 2238 tests,
2233 pass, 0 fail, 5 skipped. 31 new tests added by this diff, zero
regressions in either direction.
