# tsk-1i3 — Iron Law evidence

Classification (`classifyIronLaw` against the real committed diff,
`trunk...fgw/tsk-1i3`): `required: true`, `matchedFlags: ["sự cố"]`,
`matchedModules: []`.

Changed files (`changedFiles`):
- `.githooks/pre-commit`
- `docs/history/tsk-1i3-merge-content-precedence-overwrite/CONTEXT.md`
- `docs/history/tsk-1i3-merge-content-precedence-overwrite/RESEARCH.md`
- `docs/history/tsk-1i3-merge-content-precedence-overwrite/plan.md`
- `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`

## Test command

```
node --test --test-name-pattern="tsk-1i3" test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs
```

## Failing-before (pre-fix `.githooks/pre-commit`, i.e. commit
`594f5c0acb6821cfeff17e3ba31b0cee9a72e9ae`, the parent of the real fix
commit)

```
✖ tsk-1i3: a commit on main branch staging a .fgos/*.jsonl modification with fewer lines than HEAD is refused (472.713346ms)
✔ tsk-1i3: a commit on main branch staging a .fgos/*.jsonl modification with equal-or-more lines succeeds (520.599128ms)
✔ tsk-1i3: a brand-new .fgos/* file addition is not refused (274.636616ms)
ℹ tests 3
ℹ pass 2
ℹ fail 1

✖ failing tests:

test at test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs:382:1
✖ tsk-1i3: a commit on main branch staging a .fgos/*.jsonl modification with fewer lines than HEAD is refused (472.713346ms)
  AssertionError [ERR_ASSERTION]: commit staging regressed line count on main must be refused
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-1i3-3a1htu/test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs:394:10)
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: 0,
    expected: 0,
    operator: 'notStrictEqual',
```

This is the real vulnerability this item exists to close: with the
pre-fix hook, a commit on `main` staging a `.fgos/events.jsonl`
modification that regresses from 5 lines to 2 lines (matching the real
incident's own shape, `e921fdb4`, which dropped `events.jsonl` from ~352
more lines to fewer) is **not refused** (`result.status === 0`).

## Passing-after (real fix commit `fc6de76edbee98a2975eefe312e64dcbb02dbb2c`)

```
✔ tsk-1i3: a commit on main branch staging a .fgos/*.jsonl modification with fewer lines than HEAD is refused (260.305785ms)
✔ tsk-1i3: a commit on main branch staging a .fgos/*.jsonl modification with equal-or-more lines succeeds (225.001247ms)
✔ tsk-1i3: a brand-new .fgos/* file addition is not refused (141.413802ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

## Method

The worker (dispatched out-of-process, `agy`/`gemini-3.6-flash-medium`)
committed the implementation and its own tests together in one commit
(`fc6de76e`) and reported all tests green, but did not itself produce a
failing-before transcript in the required shape. The driver (this
session) generated the evidence above independently after confirming the
worker's commit was real (`git log -1`, `git show --stat`, direct read of
the diff): swapped `.githooks/pre-commit` back to its exact pre-fix
content (`git show 594f5c0a:.githooks/pre-commit`), re-ran the new tests
(red, above), restored the real fixed file
(`git show fc6de76e:.githooks/pre-commit`), re-ran (green, above), then
confirmed `git status`/`git diff --stat` showed no residual change beyond
the ADR0020-expected `.fgos/` worktree deletions — the working tree
matches the real committed fix exactly, byte for byte.

Full suite (`npm test`), independently re-run by the driver after
restoring the fix: matches the worker's own reported 1805-passing count
for the full e2e run and 3795 for the whole suite; not re-pasted here in
full (verify already re-confirmed via the narrower e2e file above, and
`fgos return` below re-runs the item's real `verify` command itself
before trusting anything).
