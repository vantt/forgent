# Iron Law evidence — tsk-30v

`classifyIronLaw` result against the real committed diff (`src/runner/merge.mjs`'s `changedFiles`, root = main checkout):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/loop.mjs",
    "src/state/workflow-stage-graphs.mjs"
  ]
}
```

## Test command

```
node --test test/intake/discovery.test.mjs
```

## Failing-before

Restored `src/intake/discovery.mjs`, `src/state/workflow-stage-graphs.mjs`,
and `src/runner/loop.mjs` to their pre-tsk-30v committed content
(`git show HEAD~1:<path>` for each, HEAD~1 = the commit right before this
item's implementation commit), kept the new/updated test file, ran the
command above:

```
✖ resolveDiscovery advances to planning when docsRef points at a real, non-empty CONTEXT.md, with no verdict required (tsk-30v D2/D6: trust-signal skip is a clear verdict, skips exploring) (6.019286ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'exploring'
  - 'planning'

✖ resolveDiscovery advances to planning on a caller-supplied clear verdict at discovery (tsk-30v D2/D6: clear skips exploring) (3.191616ms)
✖ resolveDiscovery advances discovery -> planning on a caller-supplied clear verdict, skipping exploring (tsk-30v D2/D6, nextDiscoveryEdge) (1.266822ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'exploring'
  - 'planning'

✖ resolveDiscovery at discovery advances to exploring AND parks in awaiting-human on a caller-supplied unclear verdict (tsk-30v D2/D3: unclear no longer parks in place) (1.967015ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'discovery'
  - 'exploring'

✖ resolveDiscovery on a caller-supplied clear verdict with no verify falls back to a placeholder distinct from the retired P14 sentinel (1.323964ms)
✖ resolveDiscovery still advances normally on a caller-supplied clear verdict when work.status is not awaiting-human (tsk-60r D1, unchanged behavior) (1.158543ms)
✖ resolveDiscovery still updates priority on a legacy-invalid item shape — editWork's scoped validation (tsk-1ne) grandfathers the untouched field instead of blocking the patch (1.243082ms)

ℹ tests 31
ℹ suites 0
ℹ pass 24
ℹ fail 7
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

The old `nextDiscoveryEdge`/`resolveDiscovery` (pure stage-based edge pick,
verdict never consulted at `discovery`) cannot satisfy the new
verdict-driven tests: a clear verdict still lands on `exploring` instead of
skipping to `planning`, and an unclear verdict leaves `stage` at
`discovery` instead of advancing it to `exploring`.

## Passing-after

Restored the real tsk-30v committed content for all three files, reran the
same command:

```
ℹ tests 31
ℹ suites 0
ℹ pass 31
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

`git status --short src/intake/discovery.mjs src/state/workflow-stage-graphs.mjs src/runner/loop.mjs`
confirmed all three files were restored byte-identical to the committed
version before continuing (no stray diff left behind by this
evidence-gathering swap). The full item verify
(`npm test && node --test test/intake/discovery.test.mjs`) was also run
green against the real committed tree (2957 pass, 0 fail, 5 pre-existing
skips across the whole suite) before this file was written.
