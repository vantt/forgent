# tsk-4l1 — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["src/runner/worktree.mjs"]`, `matchedFlags: []`.

## Test command

Item's own recorded verify:

```
node --test test/runner/worktree.test.mjs
```

## Failing-before (real transcript excerpt, before this item's implementation)

Produced by temporarily stashing only `src/runner/worktree.mjs` (`git stash
push -- src/runner/worktree.mjs`) while keeping this item's new test in
place, then rerunning the exact verify command:

```
✖ createClaimWorktree's dirty-and-behind refusal points at the stale-vs-real diagnostic recipe (58.187897ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /docs\/how-to\/tell-a-stale-worktree-index-apart-from-real-uncommitted-work\.md/. Input:

  `refusing to resync claim worktree "/tmp/fgos-worktree-test-dir-WkDXMq/resync-dirty-behind-hint-bX59Vo" on "fgw/resync-dirty-behind-hint" — its last-synced commit (b15d947bed34118492df56792b2375e5835d615a) is behind the branch's current tip (062d2c1a715e303fda1b8bd484f21cc991b77b1d, likely from a child merge landing since this worktree was last synced) and the tree has uncommitted changes. Commit or discard the work in "/tmp/fgos-worktree-test-dir-WkDXMq/resync-dirty-behind-hint-bX59Vo" before claiming "fgw/resync-dirty-behind-hint" again — never auto-reset over uncommitted work.`

  expected: /docs\/how-to\/tell-a-stale-worktree-index-apart-from-real-uncommitted-work\.md/,
  operator: 'match',
```

## Passing-after (real transcript excerpt, after restoring the implementation)

`git stash pop` restored `src/runner/worktree.mjs`'s implementation, then
the same verify command was rerun:

```
✔ createClaimWorktree's dirty-and-behind refusal points at the stale-vs-real diagnostic recipe (106.893924ms)
ℹ tests 61
ℹ suites 0
ℹ pass 61
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
