# Iron Law evidence: tsk-386

`classifyIronLaw` result against the real committed diff (`fgw/tsk-25r...fgw/tsk-386`,
this item's parent-root trunk):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/runner/loop.mjs","src/runner/worktree.mjs"]}
```

## Test command

```
node --test test/runner/worktree.test.mjs
```

## Failing-before (pre-fix `worktree.mjs`, `createBranchRef`'s default still literal `'main'`)

Temporarily swapped `src/runner/worktree.mjs` back to its content at commit
`d3567500` (immediately before the implementation commit `c727b439`) and
reran the test file — including the two new cases this item added. Both
fail with the EXACT failure scenario Finding 8 describes — a real `git
branch` command failing because there is no branch literally named `main`
on a `master`-trunk repo:

```
✖ tsk-386: createBranchRef with no baseRef at all resolves through detectTrunk on a master-trunk repo, never a hardcoded "main"
  Error [WorktreeError]: git branch failed creating ref "fgw/master-trunk-item" from "main": Command failed: git branch fgw/master-trunk-item main
  fatal: Not a valid object name: 'main'.
      at createBranchRef (.../src/runner/worktree.mjs:385:11)

✖ tsk-386: withMergeEphemeralWorktree's own createBranchRef fallback resolves through detectTrunk on a master-trunk repo (the exact Finding 8 failure scenario)
  Error [WorktreeError]: git branch failed creating ref "fgw/never-dispatched-master" from "main": Command failed: git branch fgw/never-dispatched-master main
  fatal: Not a valid object name: 'main'.
      at createBranchRef (.../src/runner/worktree.mjs:385:11)
      at createDetachedMergeWorktree (.../src/runner/worktree.mjs:1024:5)
      at withMergeEphemeralWorktree (.../src/runner/worktree.mjs:1074:20)
```

The second stack trace is the literal Finding 8 failure scenario reproduced
directly: `withMergeEphemeralWorktree` → `createDetachedMergeWorktree`'s own
fallback → `createBranchRef` → a real, uncaught `git branch` failure.

## Passing-after (post-fix `worktree.mjs` restored)

```
ℹ tests 67
ℹ suites 0
ℹ pass 67
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Full suite passes, including both new master-trunk tests and every
pre-existing test (the "main"-pinned `withMergeEphemeralWorktree falls back
to createBranchRef (seeded from main)" test still passes unchanged — "main"
remains one of `detectTrunk`'s own resolution candidates).

## Full item verify (post-fix)

```
node --test test/runner/worktree.test.mjs test/runner/merge.test.mjs test/runner/loop.test.mjs test/cli/fgos-approve.test.mjs
```

289/289 pass (confirmed earlier in this same implementation pass).
