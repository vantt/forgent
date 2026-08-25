# tsk-5et — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/merge.mjs"]}
```

## Failing-test-first proof

`test/runner/merge.test.mjs`'s new test, run against the pre-fix version
of `src/runner/merge.mjs` (`git show HEAD~1:src/runner/merge.mjs`, swapped
in temporarily, then restored — working tree confirmed clean against
`HEAD` afterward):

```
error: Entry 'f.txt' not uptodate. Cannot merge.
fatal: There is no merge to abort (MERGE_HEAD missing).
✖ performCatchUp pre-merge-refusal fixture returns merge-refused outcome without conflictedFiles (74.461958ms)
  Error: Command failed: git merge --abort
  fatal: There is no merge to abort (MERGE_HEAD missing).

      at genericNodeError (node:internal/errors:985:15)
      at wrappedFn (node:internal/errors:539:14)
      at checkExecSyncError (node:child_process:925:11)
      at execFileSync (node:child_process:961:15)
      at file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5et-qfW0Aq/src/runner/merge.mjs:1679:9
      at withMergeEphemeralWorktree (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5et-qfW0Aq/src/runner/worktree.mjs:1259:26)
      at performCatchUp (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5et-qfW0Aq/src/runner/merge.mjs:1636:16)
```

This is not a mere assertion mismatch — it is the actual pre-fix crash:
`performCatchUp`'s own inline `git merge --abort` call, attempted after a
pre-merge refusal that never created `MERGE_HEAD`, throws exactly this
uncaught error. This is the live reproduction of the defect
`CONTEXT.md`/`plan.md` described from static reading alone.

Same test, same repo, post-fix (`src/runner/merge.mjs` at `HEAD`):

```
error: Entry 'f.txt' not uptodate. Cannot merge.
✔ performCatchUp pre-merge-refusal fixture returns merge-refused outcome without conflictedFiles (65.795871ms)
```

## Full item verify command (step 3, already run by the out-of-process worker)

```
node --test test/runner/merge.test.mjs
```

Result: 107 tests, 0 fail (worker's own run); re-confirmed above for the
two specific before/after states of the one new test this evidence
targets.
