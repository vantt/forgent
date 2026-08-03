# tsk-k8u — Iron Law evidence

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "$root" "tsk-k8u"
```

Result: `{"required":true,"matchedFlags":["delete"],"matchedModules":[]}`

## Test command

```
node --test --test-name-pattern="tsk-k8u" test/cli/fgos.test.mjs test/runner/worktree.test.mjs
```

(subset of the item's own recorded `verify`, `npm test` — full suite ran
green separately: 2364 pass / 0 fail / 5 skipped)

## Failing-before (source fix stashed, new tests in place)

```
✖ take --id from --dir records headAtTake against the real root, not the worktree cwd (tsk-k8u D1/D2) (309.878255ms)
✖ pick --id from --dir stands up the worktree under --dir's own .claude/worktrees/, not the invoking worktree cwd's (tsk-k8u D1/D2) (269.607628ms)
✖ pick --id reattaches to its own already-existing worktree/branch when invoked FROM INSIDE that worktree via --dir, without crashing (tsk-k8u repro) (488.833893ms)
✔ reclaimOrphanedCheckout refuses (throws, does not remove) a checkout that resolves to repoRoot itself (tsk-k8u D1) (33.158701ms)
ℹ tests 4
ℹ pass 1
ℹ fail 3

✖ take --id from --dir records headAtTake against the real root, not the worktree cwd (tsk-k8u D1/D2)
  AssertionError [ERR_ASSERTION]: take --dir must record HEAD from --dir's root, not the worktree cwd
  + actual   'f2f7fe27496a80171af03ddf276a7371dfc550de'
  - expected '1c8b8ac6b72e183bdfa2f12cbfec92ec2ea1dabb'

✖ pick --id from --dir stands up the worktree under --dir's own .claude/worktrees/, not the invoking worktree cwd's (tsk-k8u D1/D2)
  AssertionError [ERR_ASSERTION]: pick --dir worktree path "/tmp/fgos-cli-wt-ucNMbv/.claude/worktrees/pick-via-dir-axELED" must live under --dir's own .claude/worktrees/, not the invoking cwd's

✖ pick --id reattaches to its own already-existing worktree/branch when invoked FROM INSIDE that worktree via --dir, without crashing (tsk-k8u repro)
  AssertionError [ERR_ASSERTION]: pick --dir from inside its own worktree failed: fgos: git worktree add failed for branch "fgw/reclaim-from-inside": spawnSync git ENOENT
```

The third failure's message (`spawnSync git ENOENT`) is the exact error
this item's own description names from the tsk-2ie repro — a live,
reproduced crash, not a hypothetical.

`reclaimOrphanedCheckout refuses...` (the `worktree.test.mjs` D1 guard
test) already passes here because it doesn't depend on `bin/fgos.mjs`'s
handler fix — it calls `reclaimOrphanedCheckout` directly, and D1's guard
was stashed along with the rest of `worktree.mjs`'s changes. Re-checked
below to confirm it also stays green post-fix, not just untouched.

(`fatal: '...' is a main working tree` on stderr, seen once per run, is
`removeWorktree`'s own best-effort cleanup in an unrelated passing test in
the same file — not part of this item's evidence.)

## Passing-after (fix restored)

```
✔ take --id from --dir records headAtTake against the real root, not the worktree cwd (tsk-k8u D1/D2) (292.699542ms)
✔ pick --id from --dir stands up the worktree under --dir's own .claude/worktrees/, not the invoking worktree cwd's (tsk-k8u D1/D2) (268.731495ms)
✔ pick --id reattaches to its own already-existing worktree/branch when invoked FROM INSIDE that worktree via --dir, without crashing (tsk-k8u repro) (484.514187ms)
✔ reclaimOrphanedCheckout refuses (throws, does not remove) a checkout that resolves to repoRoot itself (tsk-k8u D1) (29.775298ms)
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

## Method note

The before/after pair was captured by `git stash push -u -- bin/fgos.mjs
src/runner/worktree.mjs` (the two source files this item changes, keeping
the new/changed test files in the working tree), running the tests red,
then `git stash apply`+`git stash drop` to restore the fix and running the
same tests green — never a separate branch or a hand-edited revert, so the
"before" state is byte-identical to this item's own actual pre-fix diff.
