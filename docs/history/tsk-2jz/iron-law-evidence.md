# tsk-2jz — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{
  "required": true,
  "matchedFlags": ["data loss"],
  "matchedModules": []
}
```

## Failing-test-first proof

The 3 new tests in `test/state/cleanup-harness.test.mjs`, run against the
pre-fix version of `src/state/cleanup-harness.mjs` (`git show
1da500ee~1:src/state/cleanup-harness.mjs`, swapped in temporarily via
`git checkout -- src/state/cleanup-harness.mjs` afterward — working tree
confirmed byte-identical to `HEAD` via `git diff HEAD -- src/state/cleanup-
harness.mjs` returning empty):

```
✖ checkMergeStillResolves: rescue-merge case (blind spot 2) resolves ok:true via main-ancestry fallback (151.75872ms)
  AssertionError [ERR_ASSERTION]: main-ancestry fallback must resolve child whose rescue merge landed on main

  false !== true

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jz-Dw5HED/test/state/cleanup-harness.test.mjs:794:10)
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: 'strictEqual',
    diff: 'simple'

✖ checkMergeStillResolves: clean synthetic rebase-rehash case (blind spot 1) resolves ok:true via content-equivalence fallback (184.705659ms)
  AssertionError [ERR_ASSERTION]: content-equivalence fallback must resolve clean rebase-rehash with matching patch-id

  false !== true

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jz-Dw5HED/test/state/cleanup-harness.test.mjs:821:10)
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: 'strictEqual',
    diff: 'simple'

✔ checkMergeStillResolves: negative case — sha NOT an ancestor of main and NO patch-id twin stays ok:false (no data-loss masking) (126.199971ms)

ℹ tests 3
ℹ pass 1
ℹ fail 2
```

The negative case (the one that specifically proves the fix cannot mask a
genuine loss) already passed pre-fix, as expected — it asserts existing
`ok:false` behavior the fix leaves untouched, not new behavior.

Same 3 tests, same repo, post-fix (`src/state/cleanup-harness.mjs` at
`HEAD`, `1da500ee`):

```
✔ checkMergeStillResolves: rescue-merge case (blind spot 2) resolves ok:true via main-ancestry fallback (139.027472ms)
✔ checkMergeStillResolves: clean synthetic rebase-rehash case (blind spot 1) resolves ok:true via content-equivalence fallback (169.584168ms)
✔ checkMergeStillResolves: negative case — sha NOT an ancestor of main and NO patch-id twin stays ok:false (no data-loss masking) (132.791947ms)

ℹ tests 3
ℹ pass 3
ℹ fail 0
```

## Full item verify command (step 3, already run, independently re-run by the driver)

```
npm test -- test/state/cleanup-harness.test.mjs && node bin/fgos.mjs recheck-blocked --dir "$root" --json
```

Targeted run (`node --test test/state/cleanup-harness.test.mjs`, since
`npm test`'s script hardcodes the full `test/**/*.test.mjs` glob and
ignores extra CLI args): 48 tests, 0 fail. Full-suite run (what `npm test`
actually executes): 3780 tests, 3775 pass, 0 fail, 5 skipped.

`recheck-blocked` (run from this worktree, so the fixed code is what
executes — read-only, no item state mutated): `tsk-5sr` now surfaces
under `resolvable` (`"root's own branch fgw/tsk-5sr is also an ancestor
of HEAD"` — the main-ancestry fallback). `tsk-3cx` and `tsk-25b` remain
under `stillBlocked`, matching `docs/history/tsk-2jz/plan.md`'s revised
(round-2) expectation exactly: their real evidence had decayed since the
item's own original investigation, and their genuine current content
divergence is exactly what both fallbacks correctly still refuse to mask.
