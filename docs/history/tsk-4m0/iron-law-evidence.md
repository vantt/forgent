# Iron Law evidence — tsk-4m0

`classifyIronLaw` on this item's changed files returned `required: true`,
matched flags `["data loss", "delete"]` (no matched modules) — the item's
own description mentions data-loss-adjacent language (orphaned claims,
force-remove) even though the actual code change is a pure ordering fix
with no deletion/data-loss behavior of its own.

## Test command

```
node --test test/runner/claim-port.test.mjs
```

## Failing-before transcript

Captured by stashing only `src/runner/claim-port.mjs` (keeping the new
tests) and running the two new tests against the unfixed code:

```
$ node --test --test-name-pattern="tsk-4m0 D1" test/runner/claim-port.test.mjs

✖ claimWork reverts the todo->doing claim back to todo when createClaimWorktree fails, instead of orphaning the item in doing (tsk-4m0 D1) (27.584019ms)
✖ claimWork reverts a branch-take blocked->doing claim back to blocked when createClaimWorktree fails (tsk-4m0 D1) (43.436996ms)
ℹ tests 2
ℹ pass 0
ℹ fail 2

✖ failing tests:

test at test/runner/claim-port.test.mjs:229:1
✖ claimWork reverts the todo->doing claim back to todo when createClaimWorktree fails, instead of orphaning the item in doing (tsk-4m0 D1) (27.584019ms)
  AssertionError [ERR_ASSERTION]: a failed worktree creation must leave the item claimable again, not stuck in doing

  'doing' !== 'todo'

    at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4m0-shQU1T/test/runner/claim-port.test.mjs:241:10)
  {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: 'doing',
    expected: 'todo',
    operator: 'strictEqual'
  }

test at test/runner/claim-port.test.mjs:247:1
✖ claimWork reverts a branch-take blocked->doing claim back to blocked when createClaimWorktree fails (tsk-4m0 D1) (43.436996ms)
  AssertionError [ERR_ASSERTION]: a failed worktree creation on a branch-take must revert back to blocked, not fall through to todo

  'doing' !== 'blocked'

    at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4m0-shQU1T/test/runner/claim-port.test.mjs:264:10)
  {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: 'doing',
    expected: 'blocked',
    operator: 'strictEqual'
  }
```

## Passing-after transcript

Fix restored (`git stash pop`), full file re-run:

```
$ node --test test/runner/claim-port.test.mjs

✔ claimWork reclaims a stale hook-written (string-identity) lock past DEFAULT_TTL_MS, instead of failing lock-ambiguous forever (31.631133ms)
✔ claimWork throws a categorized ClaimError (not an uncategorized crash) when a fresh hook-written lock is still within DEFAULT_TTL_MS (14.367555ms)
✔ claimWork throws a categorized ClaimError (unreadable/corrupt lock content, not a hook-shaped string-identity record) — genuinely ambiguous, fails closed (13.011668ms)
✔ claimWork on a claim-lock §3b-marked release preserves the ORIGINAL branchHeadAtTake on reclaim, instead of recomputing to the tip that already includes the pre-release commit (tsk-2zv) (45.428893ms)
✔ claimWork on an UNMARKED todo-with-branch reclaim (e.g. reject) still recomputes branchHeadAtTake fresh, never preserving a stale value (tsk-2zv D3) (43.86243ms)
✔ claimWork isolates a leaf whose dep is "wontfix" without throwing deps-not-merged (D1: wontfix satisfies the merge-guard, same as done) (38.298178ms)
✔ claimWork still refuses to isolate a leaf whose dep is only "blocked" (D1 does not over-broaden the merge-guard past done/wontfix) (16.092297ms)
✔ claimWork rejects a runner claim on an item already claimed (doing) by a live session claim, and leaves the session claim untouched (tsk-49a) (28.46678ms)
✔ claimWork reverts the todo->doing claim back to todo when createClaimWorktree fails, instead of orphaning the item in doing (tsk-4m0 D1) (21.018103ms)
✔ claimWork reverts a branch-take blocked->doing claim back to blocked when createClaimWorktree fails (tsk-4m0 D1) (46.017058ms)
ℹ tests 10
ℹ pass 10
ℹ fail 0
```
