# Iron Law evidence — tsk-34n

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "$root" "tsk-34n"
```

Result (post-commit, real diff): `{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}`

`src/runner/dispatch.mjs` matches `MODULE_RULES`'s `src/runner/` prefix
rule — this item edits 5 real call sites plus adds the new
`resolveCapacityAndOverrides` function directly in that file.

## Failing-test-first proof

**Red** (`src/runner/dispatch.mjs` temporarily reverted to its
pre-this-item state via `git checkout 4542d72b~1 -- src/runner/dispatch.mjs`,
the commit immediately before this item's own implementation commit):

```
file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-34n-L25X26/[eval1]:3
import { resolveCapacityAndOverrides } from './src/runner/dispatch.mjs';
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module './src/runner/dispatch.mjs' does not provide an export named 'resolveCapacityAndOverrides'
```

**Green** (`git checkout HEAD -- src/runner/dispatch.mjs`, restoring the
real fix, same assertion):

```
OK
```

`git status --short src/runner/dispatch.mjs` after restore: clean, no
diff.

## Full suite

`npm test`: 3474 pass / 0 fail (up from the `tsk-pdg` baseline of 3459 —
18 new tests added for `resolveCapacityAndOverrides`, `prefer`/`overrides`
shape validation, load-time symmetry, and end-to-end
`spawnWorker`/`executeCapacityCli`/`decideCapacityCli` resolution via
`capabilities.<name>.prefer`).

## Live migration proof (D3)

Real `.fgos/config.json` migrated: `capacities.fgos-coding-implement`
(the duplicate) deleted, `"for": ["fgos-coding-implement"]` added to
`agy`, `capabilities["fgos-coding-implement"] = {description, prefer:
"agy"}` registered. Loaded successfully under the new validation rules
(`ensureRunnerConfigForDir` against the real main checkout, no throw).

Externally-observed behavior confirmed byte-identical to before
migration (the whole point — a config-modeling refactor, not a behavior
change), against the real live config:

```
native session (hasLiveTaskAccess:true): {"mechanism":"out-of-process","configured":true}
headless --work (hasLiveTaskAccess:false): {"mechanism":"out-of-process","configured":true,"capacityId":"fgos-coding-implement"}
```

Matches `tsk-pdg`'s own pre-migration evidence exactly.
