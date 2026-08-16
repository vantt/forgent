# Iron Law evidence — tsk-pdg

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "$root" "tsk-pdg"
```

Result (post-commit, real diff): `{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}`

`src/runner/dispatch.mjs` matches `MODULE_RULES`'s `src/runner/` prefix
rule — this item edits `decideCapacityDispatchMechanism` directly.

## Failing-test-first proof

**Red** (`src/runner/dispatch.mjs` temporarily reverted to its
pre-this-item state via `git checkout bda57ab5~1 -- src/runner/dispatch.mjs`,
the commit immediately before this item's own implementation commit,
running this item's own `verify` assertion against it):

```
node:internal/modules/run_main:107
    triggerUncaughtException(
    ^

AssertionError [ERR_ASSERTION]: 'in-process' == 'out-of-process'
    at file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-pdg-CFzu0u/[eval1]:5:8
    ...
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: 'in-process',
  expected: 'out-of-process',
  operator: '==',
  diff: 'simple'
}
```

This is the real bug being fixed, caught red-handed: a cli-spawn-shaped
capacity (`command: 'agy'`) with a live-Task-access caller resolved
`in-process` — silently never invoking `agy` at all.

**Green** (`git checkout HEAD -- src/runner/dispatch.mjs`, restoring the
real fix, same assertion):

```
OK
```

`git status --short src/runner/dispatch.mjs` after restore: clean, no
diff — the revert/restore cycle left the committed file byte-identical.

## Full suite

`npm test` (full run, real, against the fixed code): 3459 pass / 0 fail —
matches the pre-change baseline exactly (RESEARCH.md's exhaustive scan of
`test/runner/dispatch.test.mjs`'s 28 `hasLiveTaskAccess: true` sites
predicted zero existing tests would need changes; confirmed).
