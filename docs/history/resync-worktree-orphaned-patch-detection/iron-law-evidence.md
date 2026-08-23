# tsk-jg4 — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/worktree.mjs"]
}
```

## Failing-test-first proof

`test/runner/worktree.test.mjs`'s new test, run against the pre-fix
version of `src/runner/worktree.mjs` (`git show HEAD~1:src/runner/
worktree.mjs`, swapped in temporarily, then restored via `git checkout --
src/runner/worktree.mjs`, confirmed clean):

```
✖ resyncWorktree refuses when a prior run left an orphaned patch file for this branch, without touching the worktree (71.881288ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception: must throw WorktreeError naming the orphaned patch path
```

(the sibling "different branch" test passes either way, since it asserts
a no-op — it isn't a proof point for the fix itself, only a guard against
over-matching).

Same tests, same repo, post-fix (`src/runner/worktree.mjs` at `HEAD`):

```
✔ resyncWorktree refuses when a prior run left an orphaned patch file for this branch, without touching the worktree
✔ resyncWorktree is unaffected by an orphaned patch file belonging to a DIFFERENT branch
```

Full `test/runner/worktree.test.mjs` run post-fix: 60 tests, 60 pass, 0 fail.

## Full item verify command (step 3, already run)

```
npm test
```

Result: 3192 tests, 3187 pass, 5 skipped, 0 fail.
