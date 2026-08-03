# Iron Law evidence — tsk-3ik-4

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "$root" "tsk-3ik-4"
```

Result: `{"required":true,"matchedModules":["src/runner/dispatch.mjs"]}`

## Why `required: true` fires anyway — false positive, root-caused

`changedFiles` diffs `main...fgw/tsk-3ik-4` — this item's branch forked
from `fgw/tsk-3ik`'s tip AFTER `tsk-3ik-1` and `tsk-3ik-3` (both real
`src/runner/dispatch.mjs` changes) had already merged into it. `main`
itself has not yet absorbed `fgw/tsk-3ik` (the root item's own branch
merges to `main` later, once every child is done) — so the diff against
`main` still includes those two already-delivered siblings' work, not
just this item's own commit.

This item's OWN commit touches exactly one file:

```
$ git show 0b58205 --stat
 docs/how-to/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md | 109 +++++++++++++++++++++
 1 file changed, 109 insertions(+)
```

Confirmed via `git diff <branchHeadAtTake>..HEAD --stat` — identical single
file, zero code touched. `src/runner/dispatch.mjs` appearing in
`matchedModules` is entirely inherited sibling history, the same kind of
non-issue `tsk-53h`'s own `iron-law-evidence.md` documented for a different
root cause (a `HEAVY_KEYWORDS` description substring false-positive) —
here the mechanism is different (inherited `matchedModules`, not a
description-keyword match) but the conclusion is the same: no real
runtime-code risk in this item's own diff.

## No failing-test-first story applies

This item adds one new markdown how-to doc — no code, no behavior change,
nothing to demonstrate red-before-green against. Same shape `tsk-53h`'s own
evidence file already established for a doc-only diff.

## Item's own verify command

```
node --test 'test/**/*.test.mjs'
```

(see commit for full transcript — run before `fgos return`)
