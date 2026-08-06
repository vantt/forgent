# tsk-2u9 — Iron Law evidence

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "$root" "tsk-2u9"
```

Result: `{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}`

## Test command

```
node --test --test-name-pattern="tsk-2u9" test/cli/fgos.test.mjs
```

(the item's own recorded `verify`, minus the vacuous-pass-safe shell
wrapper around it)

## Failing-before (source fix stashed, new tests in place)

```
✖ list --id scopes every id-keyed view section to just the requested item, excluding another item's data (tsk-2u9 D1/D2) (707.298962ms)
✔ list --id leaves the tools registry untouched -- it is keyed by tool name, not by item id (tsk-2u9 D2) (259.48796ms)
ℹ tests 2
ℹ suites 0
ℹ pass 1
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

✖ list --id scopes every id-keyed view section to just the requested item, excluding another item's data (tsk-2u9 D1/D2)
  AssertionError [ERR_ASSERTION]: item-b's decision must be excluded
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2u9-Iilrxi/test/cli/fgos.test.mjs:583:10)
```

## Passing-after (fix restored)

```
✔ list --id scopes every id-keyed view section to just the requested item, excluding another item's data (tsk-2u9 D1/D2) (712.361623ms)
✔ list --id leaves the tools registry untouched -- it is keyed by tool name, not by item id (tsk-2u9 D2) (247.333984ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Full repo-wide `test/cli/fgos.test.mjs` suite also confirmed green
post-fix: `556 pass / 0 fail`.

## Method note

Unlike the `git stash push -u` before/after pattern other iron-law-evidence
docs in this repo use, this before/after pair was captured directly across
this item's own implementation sequence: the failing-before transcript was
captured with both new tests already written but `bin/fgos.mjs`'s
`list --id` handler still unfixed (the `scopedById`/`decisions`-filter
change had not yet been made); the passing-after transcript was captured
immediately after making that change, before committing. `classifyIronLaw`
itself was re-run post-commit (`filesChanged` includes `bin/fgos.mjs` only
once the fix is actually committed — the classify this skill ran during
Implement, before committing, incorrectly reported `required: false` /
`matchedModules: []` because `changedFiles` had nothing committed yet to
see; re-running it after the commit is what produced the correct
`required: true` result above, discovered when `fgos approve` independently
computed the same classify and disagreed).
