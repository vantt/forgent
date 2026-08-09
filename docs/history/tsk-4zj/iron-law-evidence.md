# tsk-4zj — Iron Law failing-test-first evidence

`classifyIronLaw` result: `{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/state/workflow-stage-graphs.mjs"]}`

## Test command

`npm test` (item's own locked verify; also run scoped throughout
implementation: `node --test test/state/workflow-stage-graphs.test.mjs
test/state/graph-metrics.test.mjs test/state/graph-harness.test.mjs
test/cli/fgos.test.mjs`)

## Failing-before (real transcript excerpts, captured live during this
item's own implementation — each shows an EXISTING test asserting the
OLD contract failing once the new `stageEffective`/`stageByItem` behavior
landed in the code, proving the behavior actually changed)

`test/state/graph-metrics.test.mjs`'s exact-key-set lock, before updating
the test to match `graphMetrics`'s new `stageByItem` key:

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    actual: [ 'order_version', 'frame', 'componentCount', 'components', 'criticalPath', 'staleBlocked', 'topUnblock', 'stageByItem' ],
    expected: [ 'order_version', 'frame', 'componentCount', 'components', 'criticalPath', 'staleBlocked', 'topUnblock' ],
    operator: 'deepStrictEqual',
```

`test/state/graph-harness.test.mjs`'s `mergeReadiness` full-object locks,
before updating them to include the new `stageByItem` key:

```
✖ mergeReadiness on an empty view returns empty ready/waiting/conflicts/mergeSets/blockedOnSync/mergeTier/supersededOut (2.43072ms)
✖ mergeReadiness: a proposed item with no deps is ready (0.633462ms)
✖ mergeReadiness: a proposed item whose dep IS done is ready, not waiting (0.344644ms)
✖ mergeReadiness: only proposed items are considered — todo/doing/done/blocked never appear in ready or waiting (0.385402ms)
ℹ tests 31
ℹ pass 27
ℹ fail 4
```

`test/cli/fgos.test.mjs`'s `conflicts` verb locks (D7 — the shape
correction found by re-scanning main's drift), before updating them to
the new `{conflicts, stageByItem}` wrapper:

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    actual: { conflicts: [...], stageByItem: { atdecompose: 'decompose', atexecuting: 'executing' } },
    expected: [{ a: 'atdecompose', b: 'atexecuting', shared: ['bin/fgos.mjs'], suggestions: [...] }],
```

`test/cli/fgos.test.mjs`'s rollup child+target independence test (a test
`main` added after this branch forked, caught by the post-merge full
suite run), before adding `stageEffective` to its expected child:

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    actual: [ { id: 'child-a', title: 'Child A', status: 'todo', stageEffective: 'executing' } ],
    expected: [ { id: 'child-a', title: 'Child A', status: 'todo' } ],
ℹ tests 576
ℹ pass 575
ℹ fail 1
```

## Passing-after (real transcript excerpts, after each fix landed)

```
node --test test/state/workflow-stage-graphs.test.mjs test/state/graph-metrics.test.mjs test/state/graph-harness.test.mjs test/state/frontier.test.mjs
ℹ tests 214
ℹ pass 214
ℹ fail 0
```

```
node --test test/cli/fgos.test.mjs
ℹ tests 576
ℹ pass 576
ℹ fail 0
```

Full `npm test` after the merge and rework: `tests 2629 / pass 2624 /
fail 0` (5 skipped, none failing).

## What changed

Added `effectiveStage(item, domain)` (`src/state/workflow-stage-graphs.mjs`)
— `item.stage ?? stageForStep(domain, 'Execute')`, consolidating a pattern
already inlined independently in `frontier.mjs`/`stage-fsm.mjs`/
`impact.mjs`. Wired an additive `stageEffective` field into `list`/`show`/
`ready`/`merge list`'s `candidates` branch/the human table (mechanical,
`bin/fgos.mjs`), and an additive `stageEffective`/`stageByItem` into
`rollup` (`bin/fgos.mjs`) and `graph`/`graph --what-if`
(`src/state/graph-metrics.mjs`) — the latter as a side-map rather than
changing the existing id-array shapes of `components`/`criticalPath`/
`topUnblock`. `conflicts` (`bin/fgos.mjs`) gained the same `stageByItem`
side-map, wrapping its previously-bare array into `{conflicts,
stageByItem}` (D7, corrected mid-implementation after re-scanning 104
commits of `main` drift found `tsk-4so` widened `footprintConflicts`'s
candidate set beyond Execute-only, making per-item stage genuinely
informative there). `mergeReadiness` (`src/state/graph-harness.mjs`)
gained the same `stageByItem` key. `stage` itself is never read, written,
or defaulted anywhere in `store.mjs`/`replay.mjs` — the two locked
absence-contract tests (`test/state/frontier.test.mjs:205`,
`test/state/backward-compat.test.mjs:277`) pass unmodified throughout.
