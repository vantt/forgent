# tsk-jgs — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

## Failing-test-first proof

`test/e2e/resync-worktree-bare-invocation.test.mjs`'s new tests, run
against the pre-fix version of `bin/fgos.mjs` (`git show HEAD~1:bin/
fgos.mjs`, swapped in temporarily, then restored — working tree confirmed
byte-identical to `HEAD` afterward via `git diff --stat`):

```
✖ tsk-jgs: `fgos resync-worktree` run bare (no --dir) from inside a stale worktree resolves the main checkout and repairs it (97.968527ms)
  AssertionError [ERR_ASSERTION]: bare resync-worktree from inside the stale worktree must succeed -- got status 1, stderr:
  fgos: resync-worktree: could not read "/tmp/fgos-tsk-jgs-worktree-parent-4QRWHE/worktree"'s own HEAD reflog to determine what commit it was last synced to. Inspect "/tmp/fgos-tsk-jgs-worktree-parent-4QRWHE/worktree" by hand.

  1 !== 0

✔ tsk-jgs: `fgos resync-worktree --dir <mainRoot>` still works explicitly (unchanged behavior) (116.736131ms)
```

(the bare case fails with the exact "could not read HEAD reflog" message
the bug report reproduced; the explicit `--dir` case already passed
pre-fix, confirming the plan's own claim that path is unchanged behavior).

Same tests, same repo, post-fix (`bin/fgos.mjs` at `HEAD`):

```
✔ tsk-jgs: `fgos resync-worktree` run bare (no --dir) from inside a stale worktree resolves the main checkout and repairs it (118.306288ms)
✔ tsk-jgs: `fgos resync-worktree --dir <mainRoot>` still works explicitly (unchanged behavior) (116.82665ms)
```

## Full item verify command (step 3, already run)

```
npm test
```

Result: 3192 tests, 3187 pass, 5 skipped, 0 fail.
