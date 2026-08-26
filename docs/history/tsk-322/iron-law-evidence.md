# Iron Law Evidence — tsk-322

## Matched Modules
- `src/runner/dispatch/cli.mjs`

## Matched Flags
- `audit`

## Verification Command
`node --test test/runner/dispatch.test.mjs`

## Failing-test-first proof

Reverse-applied only the `src/runner/dispatch/cli.mjs` half of commit
`082ddf27` (keeping the new tests in `test/runner/dispatch.test.mjs`),
then ran the new tests against the pre-fix code:

```
✖ dispatch CLI: --repo-root alone with process.cwd() resolving to a DIFFERENT main checkout refuses with a clear error, no worker spawned (135.52831ms)
  AssertionError [ERR_ASSERTION]: Expected "actual" to be strictly unequal to: 0
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-322-OX2Uki/test/runner/dispatch.test.mjs:2509:10)
...
ℹ tests 339
ℹ pass 338
ℹ fail 1
```

Re-applied the `cli.mjs` change (tree returned to exactly the committed
state, confirmed via `git status --short`), reran the full suite:

```
ℹ tests 339
ℹ suites 0
ℹ pass 339
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 12559.923841
```

Full suite (all 339 cases, not just the 4 new ones) run independently by
the driver both before writing this evidence and as the final `fgos
return` re-verify — zero regressions.
