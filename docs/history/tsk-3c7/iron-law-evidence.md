# Iron Law evidence — tsk-3c7

## classifyIronLaw result (at approve time)

```json
{"required": true, "matchedFlags": [], "matchedModules": ["bin/fgos.mjs", "src/state/store.mjs"]}
```

Genuine module match, not a keyword false-positive: this item's own diff
touches `bin/fgos.mjs` (new `schedule` CLI case) and `src/state/store.mjs`
(new `computedSchedule` wrapper), both on the D10+D14 self-modifying-
capable module list (`src/evolve/iron-law.mjs`'s `MODULE_RULES`).

Full changed-file set: `bin/fgos.mjs`, `src/cli/command-registry.mjs`,
`src/state/graph-metrics.mjs`, `src/state/store.mjs`,
`test/state/graph-metrics.test.mjs` — implementation commit `8266e59`
("feat(tsk-3c7): add computed-parallel-wave-schedule
(computeSchedule/detectCycles)"), parent commit `823bf86`.

## Test command

```bash
node --test test/state/graph-metrics.test.mjs
```

## Failing before

Real execution: a temporary git worktree checked out at `823bf86` (the
commit immediately before `8266e59`), with only the NEW test file
(`git show 8266e59:test/state/graph-metrics.test.mjs`) copied in against
the OLD `src/state/graph-metrics.mjs` (no `computeSchedule`/`detectCycles`
yet):

```
$ node --test test/state/graph-metrics.test.mjs
file:///.../test/state/graph-metrics.test.mjs:3
import { ..., detectCycles, computeSchedule } from '../../src/state/graph-metrics.mjs';
SyntaxError: The requested module '../../src/state/graph-metrics.mjs' does not provide an export named 'computeSchedule'
...
✖ test/state/graph-metrics.test.mjs (32.073978ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

## Passing after

Same scratch worktree, `src/state/graph-metrics.mjs` replaced with the
`8266e59` version (the real implementation):

```
$ node --test test/state/graph-metrics.test.mjs
✔ detectCycles: an acyclic deps graph has zero cycles
✔ detectCycles: a self-dep is reported as its own one-element cycle
✔ detectCycles: a real 2-item cycle (a depends on b, b depends on a) is found regardless of status
✔ detectCycles: a dep pointing at an id with no matching work item is skipped, not a cycle
✔ computeSchedule: two ready items with disjoint footprints land in the same wave
✔ computeSchedule: two ready items sharing a footprint path are DEFERRED to separate waves, never refused
✔ computeSchedule: an item with no declared footprint never conflicts, packs into the earliest wave
✔ computeSchedule: a non-ready item (unmet dep) never appears in any wave
ℹ tests 60
ℹ pass 60
ℹ fail 0
```

The scratch worktree used to capture this was created and removed for
this evidence run only (`git worktree add`/`remove --force` against the
already-committed `823bf86`/`8266e59` commits) — no working-tree state was
altered.
