# Iron Law evidence — tsk-26r

Self-modifying diff: `bin/fgos.mjs` (the `return` verb's own branch-source
re-verify path). Failing-test-first proof, captured directly (not
reconstructed after the fact):

## Red (pre-fix)

With the `.fgos/` strip removed from `bin/fgos.mjs` (reverse-applying just
that hunk, test file left untouched):

```
$ node --test --test-name-pattern "branch-source" test/cli/fgos-return.test.mjs
✖ return on a branch-source take: the disposable detached verify worktree
  never carries a checked-out .fgos/ (ADR0020, tsk-26r — same strip
  createWorktree already does, applied to return's own ephemeral tmpWorktree)
  AssertionError [ERR_ASSERTION]: The input did not match the regular
  expression /awaiting-approval/. Input: ... "to": "blocked", ...
  "passed": false ...
ℹ tests 12
ℹ pass 11
ℹ fail 1
```

## Green (post-fix)

Restoring the `.fgos/` strip (`git checkout -- bin/fgos.mjs`, no other
change):

```
$ node --test --test-name-pattern "branch-source" test/cli/fgos-return.test.mjs
ℹ tests 12
ℹ pass 12
ℹ fail 0
```

## What the fix does

`bin/fgos.mjs`'s `return` verb creates an ephemeral, detached `tmpWorktree`
(`git worktree add --detach`) to re-run an item's verify command in
isolation on a branch-source claim. Unlike `createWorktree`
(`src/runner/worktree.mjs:573`), it never stripped its checked-out `.fgos/`
tracked files per ADR0020. The fix applies the identical `fs.rmSync`
strip, right after checkout and before verify runs, so this ephemeral
worktree's tree looks like every other worker worktree instead of
tripping `fgos-return.test.mjs`'s own main-checkout-cleanliness /
`.fgos`-dirty-tree exemption checks on a checked-out copy nothing here
ever needed.

## Full-suite context (unrelated to this fix)

A bare `node --test` full-suite run on this branch tip shows 3886/3893
non-herdr tests passing. The failures beyond the two already-tracked,
known pre-existing issues (`herdr-plugin/web/src/api/client.test.ts`,
`test/runner/claim-port.test.mjs`'s read-count assertion, tsk-3tb) were
individually bisected via `git stash` (this diff removed) and reproduce
identically without this change — confirmed pre-existing and unrelated:

- `test/cli/fgos-claim.test.mjs:159` and `:269` (git-hash mismatch)
- `test/cli/fgos-read.test.mjs:1632` (recheck-blocked)
- `test/cli/fgos-return.test.mjs:800` ("FIRST pick", noted inline in that
  file — this item's own `--verify` pattern, `"branch-source"`, never
  matches this test's title, for exactly this reason)
- `test/e2e/runner-loop.test.mjs:637`

None of these touch `.fgos/` worktree stripping or this item's changed
code path.
