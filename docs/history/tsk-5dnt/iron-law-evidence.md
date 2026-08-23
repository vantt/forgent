# tsk-5dnt — Iron Law evidence

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "$root" "tsk-5dnt"
```

Result: `{"required":true,"matchedFlags":["migration"],"matchedModules":["bin/fgos.mjs"]}`

`matchedFlags: ["migration"]` is the same false positive already surfaced
and confirmed by a person at the `fgos-coding-validating` gate for this
same item: the word appears only in the item's own description, in prose
about a rejected alternative ("migrating call sites from `list --id` to
`show`"), never about an actual data/schema migration. `matchedModules`
correctly names `bin/fgos.mjs`, the one file this fix touches that sits
on the Iron Law's module list.

Run *after* `git add`/`git commit` (per
`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`'s
own false-negative lesson) — `changedFiles` needs the real committed
diff to see `bin/fgos.mjs` at all.

## Test command

```
node --test --test-name-pattern="list --id scopes every id-keyed view section" test/cli/fgos-read.test.mjs
```

(the item's own recorded `verify`)

## Failing-before (implementation reverted in the working tree, new test assertions in place)

`bin/fgos.mjs` was temporarily checked out from the pre-fix commit
(`git checkout HEAD~1 -- bin/fgos.mjs`) while the already-committed test
extension in `test/cli/fgos-read.test.mjs` stayed exactly as it ships —
the same before/after test code both times, so the failure is real
behavior, not a difference in what's being tested.

```
✖ list --id scopes every id-keyed view section to just the requested item, excluding another item's data (tsk-2u9 D1/D2) (1573.337349ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

✖ failing tests:

test at test/cli/fgos-read.test.mjs:300:1
✖ list --id scopes every id-keyed view section to just the requested item, excluding another item's data (tsk-2u9 D1/D2) (1573.337349ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    [
      'item-a',
  +   'item-b'
    ]

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5dnt-PBLcsC/test/cli/fgos-read.test.mjs:336:10)
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: [ 'item-a', 'item-b' ],
    expected: [ 'item-a' ],
    operator: 'deepStrictEqual',
    diff: 'simple'
```

`item-b`'s `callThreads` entry leaking into `item-a`'s scoped `list --id`
response — exactly the leak this item exists to close.

## Passing-after (fix restored via `git checkout HEAD -- bin/fgos.mjs`)

```
✔ list --id scopes every id-keyed view section to just the requested item, excluding another item's data (tsk-2u9 D1/D2) (1610.671297ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Full `test/cli/fgos-read.test.mjs` suite also confirmed green post-fix:
`100 pass / 0 fail`.

## Method note

Unlike `tsk-2u9`'s own capture (before/after taken across the live
implementation sequence, pre-commit), this item's red/green pair was
captured retroactively, after the implementation was already committed
(`0afa858`) — the same gap
`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`
names for `tsk-5cf`: `classifyIronLaw` run right after writing the code
but before committing came back `required:false` (empty `changedFiles`,
nothing committed yet beyond the parent's `plan.md`/`RESEARCH.md`
commit), so the evidence-production window closed before this doc was
written. Recovered honestly per that how-to's own recipe: `git checkout
HEAD~1 -- bin/fgos.mjs` reverts only the implementation file in the
working tree (the already-committed test file is untouched, so both runs
exercise identical test code), capture the real red transcript, then
`git checkout HEAD -- bin/fgos.mjs` restores the committed fix and the
green transcript is captured again to confirm nothing else changed in
between.
