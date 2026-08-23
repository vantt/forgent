# Iron Law evidence — tsk-3ik-1

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "$root" "tsk-3ik-1"
```

Result (post-commit, real diff against `main`): `{"required":true,"matchedModules":["src/runner/dispatch.mjs"]}`

`src/runner/dispatch.mjs` matches `MODULE_RULES`'s `src/runner/` prefix rule
(`src/evolve/iron-law.mjs:21`) — the same fact `fgos-coding-validating` already
verified against `docs/history/native-first-dispatch-doctrine-phase-4-unify-capacity-and-task-dispatch/plan.md`'s
own risk map before this item's own `decompose` fired.

## Failing-test-first proof

**Red** (`src/runner/dispatch.mjs` temporarily reverted to its pre-this-item
state via `git stash`, leaving the new tests in `test/runner/dispatch.test.mjs`
in place — same recipe `tsk-53h`'s own `iron-law-evidence.md` used):

```
$ node --test test/runner/dispatch.test.mjs
file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-3ik-1-4ndFkl/test/runner/dispatch.test.mjs:20
  decideCapacityCli,
  ^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/dispatch.mjs' does not provide an export named 'decideCapacityCli'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    ...
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

**Green** (implementation restored via `git stash apply`):

```
$ node --test test/runner/dispatch.test.mjs
...
ℹ tests 126
ℹ suites 0
ℹ pass 126
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2787.501174
```

All 20 new tests pass (`decideDispatchMechanism`, `decideCapacityDispatchMechanism`,
`decideCapacityCli`, the `decide` CLI subcommand, `forceCliSpawn` shape
validation) alongside every pre-existing test in this file — including the
exact-shape `assert.deepEqual` checks on `resolveCapacityCli`'s return value
(`test/runner/dispatch.test.mjs:1608`, `:1624`), confirming the new helper
functions are additive siblings and never altered `resolveExecutorConfig`/
`resolveCapacityCli`'s existing behavior or return shape.

## Impact analysis (before editing)

```
impact({target: "resolveExecutorConfig", direction: "upstream", file_path: "src/runner/dispatch.mjs"})
```

Result: **risk: CRITICAL**, 8 upstream symbols, 7 execution flows
(`judgeDecompose`, `judgeDiscovery`, `runJudgeExecutor`, `spawnWorker`,
`dispatchClaimedItem`, `resolveCapacityCli`), 2 modules (Intake, Runner).
User warned and confirmed proceeding per this repo's mandatory
CRITICAL-risk gate before any edit.

Given that blast radius, the implementation deliberately never edits
`resolveExecutorConfig`'s own body — `decideDispatchMechanism` and
`decideCapacityDispatchMechanism` are new, standalone, read-only sibling
functions in the same file that call nothing in the resolve path and are
called by nothing in it. The only touch to existing, already-hub code is
one small additive branch in `validateCapacityShape` (a new optional
`forceCliSpawn` boolean field, same pattern as the existing `agentType`/
`allowCrossProvider` fields right next to it) — confirmed safe by the 126/126
green run above, which includes every pre-existing `resolveExecutorConfig`/
`resolveCapacityCli`/`spawnWorker` test untouched.

## Item's own verify command

```
node --test test/runner/dispatch.test.mjs
```

```
ℹ tests 126
ℹ pass 126
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

## Full suite (regression check)

```
node --test 'test/**/*.test.mjs'
```

(see commit for full transcript — run before `fgos return`)
