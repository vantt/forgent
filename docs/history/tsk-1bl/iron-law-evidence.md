# Iron Law evidence: tsk-1bl

`classifyIronLaw({ filesChanged, description })` against this item's final
diff (`bin/fgos.mjs:1907-1939`'s own classifier, `src/evolve/iron-law.mjs`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs", "src/state/store.mjs"]
}
```

`filesChanged` (`changedFiles(repoRoot, item)`, `trunk...fgw/tsk-1bl`):
`bin/fgos.mjs`, `docs/history/stage-status-driving-coordination/CONTEXT.md`,
`docs/history/stage-status-driving-coordination/plan.md`,
`plugins/fgOS/skills/stale/SKILL.md`, `src/state/graph-metrics.mjs`,
`src/state/store.mjs`, `test/cli/fgos.test.mjs`,
`test/state/graph-metrics.test.mjs`.

## Test command

```
node --test test/state/graph-metrics.test.mjs
node --test --test-name-pattern "postDelivery" test/cli/fgos.test.mjs
```

(subset of the item's own whole-item verify, `npm test && grep -n
classifyStalePostDelivery src/state/graph-metrics.mjs` — both commands
below are exactly the new tests this item added, isolated from the rest of
the green 2586-test suite for a clean before/after pair.)

## Failing-test-first proof

**Before** (`src/state/graph-metrics.mjs`, `src/state/store.mjs`,
`bin/fgos.mjs` reverted to `HEAD~1`, i.e. the tree before this item's
implementation commit; test files at `HEAD`, i.e. already carrying this
item's new tests):

```
$ node --test test/state/graph-metrics.test.mjs
file:///.../test/state/graph-metrics.test.mjs:3
import { ..., classifyStalePostDelivery, STALE_POST_DELIVERY_DEFAULTS, ... } from '../../src/state/graph-metrics.mjs';
SyntaxError: The requested module '../../src/state/graph-metrics.mjs' does not provide an export named 'STALE_POST_DELIVERY_DEFAULTS'
ℹ tests 1
ℹ pass 0
ℹ fail 1

$ node --test --test-name-pattern "postDelivery" test/cli/fgos.test.mjs
✖ stale verb: postDelivery is additive — existing stale/thresholds shape is unchanged, postDelivery.stale is a sibling field
  TypeError: Cannot read properties of undefined (reading 'stale')
✖ stale verb: a just-delivered item is NOT flagged in postDelivery (well within the 3d threshold)
  TypeError: Cannot read properties of undefined (reading 'stale')
ℹ tests 2
ℹ pass 0
ℹ fail 2
```

**After** (`git checkout HEAD -- src/state/graph-metrics.mjs
src/state/store.mjs bin/fgos.mjs`, restoring this item's real
implementation commit):

```
$ node --test test/state/graph-metrics.test.mjs
ℹ tests 52
ℹ pass 52
ℹ fail 0

$ node --test --test-name-pattern "postDelivery" test/cli/fgos.test.mjs
✔ stale verb: postDelivery is additive — existing stale/thresholds shape is unchanged, postDelivery.stale is a sibling field
✔ stale verb: a just-delivered item is NOT flagged in postDelivery (well within the 3d threshold)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

Full suite (`npm test`, state+cli+runner+e2e) at the same `HEAD`: 2586
tests, 2581 pass, 5 pre-existing skips (unrelated to this item), 0 fail.
