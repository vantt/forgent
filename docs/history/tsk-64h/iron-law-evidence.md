# tsk-64h — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`,
`matchedModules: ["bin/fgos.mjs", "src/state/workflow-stage-graphs.mjs"]`,
`matchedFlags: []`.

## Test command

`npm test` (also run scoped, and it is the scoped pair that carries the
red-then-green proof below:
`node --test test/state/discover-pool.test.mjs test/setup/checks.test.mjs`)

## Failing-before (real transcript excerpt, written and run before any source edit)

Both test files were extended first, with no implementation change staged —
`src/state/discover-pool.mjs` still held its literal
`new Set(['clarify', 'discovery', 'exploring'])` and no
`work-stage-vocabulary` check existed.

`node --test test/state/discover-pool.test.mjs`:

```
✖ a stage:clarify item is never picked — the coding domain retired that stage entirely, so the discover verb would refuse it (0.895628ms)
✖ a triage-domain item at that domain's OWN Clarify-mapped stage is picked, even though no coding stage carries that name (0.243754ms)
✖ two domains in one view resolve their candidate stages independently, per item (0.178565ms)
```

with, for the triage-domain case:

```
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

  + null
  - {
  -   id: 'a',
  -   stage: 'triage'
  - }
```

`node --test test/setup/checks.test.mjs`:

```
✖ DOCTOR_CHECKS has exactly the three v1 checks from CONTEXT.md plus ... work-classification-vocabulary, work-stage-vocabulary, ... (1.864563ms)
✖ work-stage-vocabulary passes on an empty store (12.457597ms)
✖ work-stage-vocabulary passes for an item whose stage was never written (lazy Execute default) (11.342577ms)
✖ work-stage-vocabulary passes when every open item sits at a stage its domain registers (11.610448ms)
✖ work-stage-vocabulary fails and names an OPEN item sitting at a stage its domain retired (13.306569ms)
✖ work-stage-vocabulary judges each item against its OWN domain's stages, not the default domain's (12.370105ms)
✖ work-stage-vocabulary passes despite a retired stage on an already-resolved (done) item (12.705006ms)
✖ work-stage-vocabulary lists every violating id, not just the first (14.26043ms)
```

each of the seven behavior tests failing on the registry lookup itself:

```
  AssertionError [ERR_ASSERTION]: DOCTOR_CHECKS is missing "work-stage-vocabulary"
```

Eleven failures total (3 + 8) before the fix.

A fourth new pool test — "a coding-domain item parked at another domain's
stage name is never picked" — passed red-side too, and is kept
deliberately: it is the guard that the old literal happened to satisfy by
accident and the new per-item resolution must keep satisfying on purpose.

## Passing-after (real transcript excerpt, after the fix)

`node --test test/state/discover-pool.test.mjs`:

```
ℹ tests 16
ℹ suites 0
ℹ pass 16
ℹ fail 0
```

`node --test test/setup/checks.test.mjs`:

```
ℹ tests 78
ℹ suites 0
ℹ pass 78
ℹ fail 0
```

Full `npm test` after: `tests 2965 / pass 2960 / fail 0` (5 skipped, none
failing).

Six pre-existing `discover-pool.test.mjs` tests also went red on the fix
and were updated rather than weakened: every one of them built its fixture
at `stage: 'clarify'`, the exact stage `coding` retired, so they were
asserting the drift this item removes. Each moved to `discovery` (a real
coding stage) and still proves what it was written to prove — ordering by
`blocks`, the urgent tie-break, FIFO, the deps gate, and the open-child
anchor.

## What changed

- `discoverableStages` moved from `src/intake/discovery.mjs` to
  `src/state/workflow-stage-graphs.mjs`. It is a pure question about a
  domain's own `stages`/`stepMap`, and `src/state/discover-pool.mjs`
  (manifest layer `domain`) needs the same answer — it could not import it
  from a `use-case`-layer module without the upward import
  `test/architecture.test.mjs` forbids. `bin/fgos.mjs` and
  `discovery.mjs`'s own `nextDiscoveryEdge` now import it from the new
  home; the function body is unchanged.
- `src/state/discover-pool.mjs` resolves candidate stages per item, from
  that item's own domain, instead of holding a literal Set. The literal had
  drifted: it still listed `clarify`, which `coding` retired, so the pool
  admitted items `fgos discover` then refused with a `StoreError`.
- `src/setup/registrations.mjs` registers a new doctor check,
  `work-stage-vocabulary`, alongside the existing
  `work-classification-vocabulary`. Verified against the real store as
  well as the fixtures: `passed: true`, "every open item sits at a stage
  still registered by its domain".
