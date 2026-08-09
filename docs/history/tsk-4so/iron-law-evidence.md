# Iron Law evidence: tsk-4so

`classifyIronLaw` result (computed post-commit, against the real diff):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/state/store.mjs"]}
```

`bin/fgos.mjs` and `src/state/store.mjs` are self-modifying core modules —
matched regardless of description flags.

## Test command

```
node --test --test-name-pattern='frontierAcrossSteps' test/state/frontier.test.mjs
node --test --test-name-pattern='ready --step|conflicts verb: items at DIFFERENT stages|conflicts verb: a clarify-stage item' test/cli/fgos.test.mjs
```

(Full item verify: `node --test test/cli/fgos.test.mjs && node --test
test/state/graph-metrics.test.mjs && npm test` — 2630 pass / 0 fail / 5
skip, see `fgos return`'s own re-verify below.)

## Failing-before (real transcript, `src/state/frontier.mjs`/`src/state/
store.mjs`/`bin/fgos.mjs` reverted to commit `2af68dc`, pre-implementation
— test files left at HEAD, already committed)

```
$ node --test --test-name-pattern='frontierAcrossSteps' test/state/frontier.test.mjs
file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4so-4V8FHT/test/state/frontier.test.mjs:3
import { frontier, frontierAcrossSteps, FRONTIER_ORDER_VERSION, isResolvedStatus } from '../../src/state/frontier.mjs';
                   ^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/state/frontier.mjs' does not provide an export named 'frontierAcrossSteps'
✖ test/state/frontier.test.mjs (34.863707ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

```
$ node --test --test-name-pattern='ready --step|conflicts verb: items at DIFFERENT stages|conflicts verb: a clarify-stage item' test/cli/fgos.test.mjs
✖ ready --step Clarify returns only clarify-stage items, not the default Execute frontier (278.487409ms)
✖ conflicts verb: items at DIFFERENT stages sharing a footprint are flagged (the real gap: a single-step frontier never saw this) (328.952824ms)
✖ conflicts verb: a clarify-stage item and an executing-stage item sharing a footprint are also flagged (326.068121ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
  + []
  - [ { a: 'atclarify', b: 'atexecuting', shared: [ 'src/shared.mjs' ], suggestions: [Array] } ]
ℹ tests 3
ℹ pass 0
ℹ fail 3
```

(`ready with no --step defaults to Execute` — the regression-safety test
proving old callers stay byte-identical — correctly did NOT fail here; it
asserts pre-existing behavior, not the new capability, so it was excluded
from this name-pattern run by design.)

## Passing-after (`git checkout HEAD -- src/state/frontier.mjs
src/state/store.mjs bin/fgos.mjs` — clean restore, empty diff confirmed)

```
$ node --test --test-name-pattern='frontierAcrossSteps' test/state/frontier.test.mjs
✔ frontierAcrossSteps: an item is never duplicated even though a missing `stage` field matches every step (0.213967ms)
✔ frontierAcrossSteps: default steps are Clarify+Divide+Execute; a narrower explicit list only unions those (0.158451ms)
✔ frontierAcrossSteps: empty view yields an empty array, no error (0.097074ms)
✔ frontierAcrossSteps re-sorts the unioned set by FRONTIER_ORDER_VERSION's own tie-break, not by step-array concatenation order (0.158441ms)
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

```
$ node --test --test-name-pattern='ready --step|conflicts verb: items at DIFFERENT stages|conflicts verb: a clarify-stage item' test/cli/fgos.test.mjs
✔ ready --step Clarify returns only clarify-stage items, not the default Execute frontier (367.207863ms)
✔ conflicts verb: items at DIFFERENT stages sharing a footprint are flagged (the real gap: a single-step frontier never saw this) (335.638324ms)
✔ conflicts verb: a clarify-stage item and an executing-stage item sharing a footprint are also flagged (330.43385ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

Full `test/cli/fgos.test.mjs` after: 570 pass / 0 fail. Full `npm test`
after: 2630 pass / 0 fail / 5 skip.

## What changed

`src/state/frontier.mjs` — new `frontierAcrossSteps(view, steps =
['Clarify', 'Divide', 'Execute'])`: unions `frontier(view, {step})` per
step, deduped by id, re-sorted once with `compareReadyOrder`.

`src/state/store.mjs` — `readyWork(dir, {step})` passes `step` through to
`frontier`; `footprintConflicts(dir)` now scopes to
`footprintOverlapAmong(frontierAcrossSteps(...))` instead of the
single-step `footprintOverlap(...)`. `footprintOverlap(view)` itself is
untouched — other decision docs (merge-standardization D4-revised,
parallel-decomposition-footprint-avoidance) cite its Execute-only
single-step behavior by name as its own contract.

`bin/fgos.mjs` — `case 'ready'` reads `flags.step` and passes it through;
`case 'conflicts'` is unchanged (the new behavior lives entirely inside
`footprintConflicts`).

Locked at `docs/history/execution-fanout/CONTEXT-tsk-4so.md` (D1) and
`docs/history/execution-fanout/plan-tsk-4so.md`.
