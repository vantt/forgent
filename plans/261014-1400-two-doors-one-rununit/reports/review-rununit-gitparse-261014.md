# Review: rununit-gitparse (one git path parser, -z everywhere)

Reviewer: independent code-reviewer (not the author). Read-only on code.
Diff: `git diff main...HEAD` = one commit `5609e31e3` (15 files, +360/-177).

## Scope

- `src/util/git-paths.mjs` (new): `nulPaths`, `statusPaths`, `nameStatusPaths`
- Callers: `src/runner/merge.mjs`, `src/runner/dispatch/settlement.mjs`,
  `src/runner/execution/commit-unit-work.mjs`, `src/runner/worktree.mjs`,
  `src/runner/claim-liveness.mjs`, `src/state/postland-drift.mjs`,
  `bin/fgos.mjs` (`changedFilesSince`), worker prompt Iron Law snippet
- Traced consumers: `src/verbs/merge/approve.mjs` (pre-check `:720`, land
  re-check via `merge.mjs:1903`), `src/verbs/merge/sync-root.mjs:275`,
  `bin/fgos.mjs` return gate `:3467` and `main-checkout-reset` `:4280`,
  `src/runner/dispatch/cli.mjs:173,787,899`, `src/runner/iron-law-gate.mjs:58`,
  `src/runner/frozen-judge.mjs`

## Overall assessment

The parser itself is correct: `-z` status records, the rename/copy source
field, `R100\0old\0new\0` name-status triples, and the trailing-slash strip all
check out against git's documented formats and against live repos. The
rename-as-both-halves change moves every gate in the fail-safe direction
(more paths own / more paths touched), which is the right direction for
Iron Law, the clean-tree gate and post-land drift. One real regression: the
switch to `--untracked-files=all` in `isWorkingTreeClean` makes the
approve/sync-root/return/reset gates throw a raw `ENOBUFS` on a repo with a
large untracked, non-ignored directory, where `main` answered in 7 bytes.

## High

### H1. `isWorkingTreeClean` now throws `ENOBUFS` on a large untracked directory (approve, sync-root, return, main-checkout-reset)

`src/runner/merge.mjs:211` adds `--untracked-files=all`; `git()` (`merge.mjs:96`)
runs with Node's default 1 MiB `maxBuffer` (the file's own comment at `:83-88`
says no `--name-only`-class call passes one). Before, git collapsed an
untracked directory to one `?? dir/` line; now it prints every file in it.

Reproduced (scratch repo, 20 000 empty untracked files under
`gen/some/deep/generated/outputs/`, nothing tracked dirty):

```
git status --porcelain | wc -c                              -> 7
git status --porcelain=v1 -z --untracked-files=all | wc -c  -> 1228894
isWorkingTreeClean(repo, null)                       -> THROW ENOBUFS
isWorkingTreeClean(repo, new Set(['src/a.mjs']))     -> THROW ENOBUFS
```

On `main` the second call returned `true` (unrelated untracked dir is
ignorable) and the first `false`. Failure scenarios:

- `fgos approve <root>` in a project (mission #1) with an unignored
  `venv/`, `dist/`, data or generated dir of roughly 17k+ files: the pre-check
  at `approve.mjs:720` throws a raw `spawnSync git ENOBUFS` instead of either
  proceeding or the "not clean" `StoreError`. Same at `sync-root.mjs:275` and
  the `return` gate (`bin/fgos.mjs:3469`, via subtree scope when the dir is
  under `cwd`).
- Worse timing: the land-step re-check `merge.mjs:1903` runs *after* the CAS
  verify (minutes) under `main-checkout.lock`. If the untracked tree grows past
  the limit during verify (another session generating output), the whole
  verified merge is thrown away with an opaque error.
- `fgos main-checkout-reset` (`bin/fgos.mjs:4280`) throws before it can report
  dirtiness, on exactly the dirty trees it exists to recover.

Fix options (pick one):
1. Keep `--untracked-files=normal` and treat a collapsed `dir/` entry as own
   when any own path starts with `dir/` (one prefix scan over `ownFileSet`).
   Cheapest, keeps output tiny, preserves the fix for the "own file inside a
   new directory" case the new test covers.
2. Keep `-uall` but pass an explicit large `maxBuffer` and map `ENOBUFS` to a
   named `StoreError`, the way `diffFailureMessage` already does for diffs.

Add a test that a few thousand untracked files under one directory with a
small `maxBuffer` (or option 1's prefix rule) does not throw.

Note: `commit-unit-work.mjs:121` and `settlement.mjs:164` already used `-uall`
with the default buffer before this commit (pre-existing). `safeGitStatusFiles`
swallows the throw and returns `[]` (fail-open: settlement sees "no changes").
Not introduced here, but the shared parser makes this the natural place to fix
all three call sites together.

## Medium

### M1. Worker prompt Iron Law snippet imports a module that in-flight worktrees do not have

`src/runner/prompt-templates/worker-prompt-skill-pointer.txt:39` adds
`import { statusPaths } from './src/util/git-paths.mjs'`. The prompt is
rendered by the activated release, but the snippet runs in the worker's own
worktree, checked out from trunk at take time. Any item claimed before this
commit lands (or a branch forked from an older root) gets
`ERR_MODULE_NOT_FOUND` from the classification command. A worker that reads a
crash as "nothing printed" may skip the evidence step; approve's own gate still
catches it later, so the cost is a wasted round, not a bypass.
Fix: inline the six-line parse in the snippet (it is a prompt, not a module),
or accept and note the transition window. The `prompt-templates.test.mjs`
change only string-matches the template; nothing executes the snippet.

### M2. Test coverage stops at the helpers; the gates the brief names are not exercised with quoted or renamed paths

New tests prove `changedFiles`, `isWorkingTreeClean`, `nextFreeDecisionId`,
`postLandDrift` and `checkoutDirtyPaths`. Not covered:
- `bin/fgos.mjs` `changedFilesSince` / `return` gate with a Vietnamese or
  renamed own path (the ownFileSet it builds and the footprint advisory).
- `branchContentMismatch` and `mergedTreeAlreadyVerified` with renames or
  quoted names (the pathspec behavior in L2 is untested).
- `--diff-filter=U` readers (`resolveFgosOnlyConflict`, `performCatchUp`
  `conflictedFiles`) with a quoted conflicted path.
- `isIgnorableStatusPath`'s `normalizePath` collision (`a\b` vs `a/b`, edge
  spaces) - the comment states the behavior, no test pins it.
- The rewritten rename test in `test/runner/merge.test.mjs` cleans its tmp repo
  only on success (`fs.rmSync` at the end, not `t.after`), unlike the new files.

### M3. `diff.relative=true` makes the subtree clean-tree gate fail open (pre-existing, same path-identity class)

`changedFiles` (`merge.mjs:385`) and `changedFilesSince` (`bin/fgos.mjs:204`)
run `git diff --name-only` without `--no-relative`. With a user's
`diff.relative=true` and a cwd below the top level (the STR60 subtree case the
`return` gate exists for), diff prints `x.js` while porcelain status prints
`sub/x.js`, so the own path never matches and an own dirty file is ignored.
Reproduced: branch edits `sub/x.js`, working tree dirties it again,
`changedFiles(sub) -> ['x.js']`,
`isWorkingTreeClean(sub, ownSet, {scope:'subtree'}) -> true` (should be
`false`). Not introduced by this diff, but this diff claims "one rule decides
what a path is"; add `--no-relative` to every `diff --name-only/-status`
reader (or set it inside `nulPaths` callers' arg builder).

## Low

### L0. `--show-prefix` is `.trim()`ed in the function this diff rewrote
`merge.mjs:209`: a subdirectory whose name starts or ends with a space loses
it, so `' sub/.fgos/events.jsonl'` no longer matches the `.fgos` exemption
and the subtree gate blocks on `.fgos`-only dirt. Reproduced:
`isWorkingTreeClean('<repo>/ sub', null, {scope:'subtree'}) -> false`
with only ` sub/.fgos/events.jsonl` untracked. Fail-safe direction, rare;
same edge-space class the commit fixes elsewhere. Fix: strip only the
trailing newline (`.replace(/\n$/, '')`).

### L1. `branchContentMismatch` passes raw path names as pathspecs
`merge.mjs:1105`: `-- ...introducedPaths`. Now that names arrive byte for byte
(fixing the old false positive where a quoted name matched nothing), glob
characters in a name (`*`, `?`, `[`) act as wildcards and can only widen
`changedByMerge` (hiding a real discard); a name starting with `:` is parsed
as pathspec magic and makes git fail. Pre-existing class, newly reachable.
Fix: `--literal-pathspecs` (or `GIT_LITERAL_PATHSPECS=1`) on that call.

### L2. Rename source in `branchContentMismatch` can raise a new false "discarded content"
With `--no-renames`, a branch rename `a -> b` lists `a`. If main had already
deleted or renamed `a` before the merge, the merge commit does not touch `a`
and it is reported as discarded (`verify-fail`, `merge.mjs:1251`). Same shape
already existed for a plain branch-side delete, so rare; mention only.

### L3. Footprint/frozen-judge advisories now report rename sources
`bin/fgos.mjs:3357,3467` feed rename sources into `footprintDiffHits` /
`frozenJudgeHits`. A footprint naming only the destination now gets an
advisory hit for the source. Intended per the commit comment ("a path moved
out of the footprint still counts as touched") and advisory-only (STR63), so
no blocking change; moving a test file away is now visible, which is a gain.

### L4. Missed or parallel readers
- `src/workflow/runner.mjs:271` already reads `-z --no-renames` but splits
  `'\0'` itself instead of `nulPaths` - functionally fine, contradicts the
  module header's "every reader ... parses the answer here".
- `core/skills/distill/scripts/distill.mjs:383` `ls-files` split on `\n`
  (skill script, outside `src/`/`bin/`; quoted names would mis-match).
- Remaining non-`-z` status calls (`worktree.mjs:393,894,1062`,
  `session.mjs:647`, `merge.mjs:1568`, `workflow/runner.mjs:324`,
  `bin/fgos.mjs:4301`, `drift-status.mjs:78`) only test emptiness, `??`, or
  column 2, or print for humans; none parse a path. Correctly left alone.

### L5. `status.showUntrackedFiles=no` users now see untracked files block
The explicit `--untracked-files=all` overrides that config. Only the
`ownFileSet === null` caller (`main-checkout-reset`) changes outcome
(reports dirty, needs `--confirm`). Arguably correct; no action.

## Verified non-issues

- `statusPaths`: `entry.length < 4` cannot drop a real record (`XY p` minimum);
  the source field is consumed by index, never parsed as a record; `Set` +
  `filter(Boolean)` handles a truncated trailing rename.
- `nameStatusPaths`: copy/rename take two fields, `U`/`T`/`M`/`A`/`D` one;
  matches the deleted `namesFromDiffStatus` semantics (it already took both
  halves) minus the quoting/trim bugs.
- `isIgnorableStatusPath` + `normalizePath`: both sides normalize the same way;
  a collision (`a\b` dirty vs own `a/b`, or edge-space twins) resolves to
  "own", which blocks: fail-safe. Status paths are top-level relative in
  porcelain v1 regardless of cwd, so the subtree prefix logic is unchanged.
- `checkoutDirtyPaths` trailing-slash strip: `dispatch/cli.mjs:169`
  `insideWorkspace` uses `path.resolve`, which ignores the slash; the
  lost-path diff at `:899-903` compares before/after from the same function.
  Only observable change is the warning text (`plans` vs `plans/`), and the
  one test asserting it was updated.
- `claim-liveness`: rename source `statSync` fails and is skipped; a copy
  source (needs `status.renames=copies`) only adds an old mtime. No effect.
- Iron Law (`iron-law-gate.mjs:58`, `classifyIronLaw` does no I/O): a rename
  out of a gated module now trips the gate where `main` missed it. Fail-safe.
- Approve/sync-root ownFileSet grows by rename sources: more blocking, never
  less. The land re-check `merge.mjs:1903` stays consistent with the pre-check.
- `performCatchUp` `conflictedFiles` keeps its array shape.

## Verification run

- `env -u CLAUDE_CODE_SESSION_ID node --test test/util/git-paths.test.mjs
  test/runner/merge-quoted-paths.test.mjs test/runner/merge.test.mjs
  test/runner/prompt-templates.test.mjs
  test/runner/dispatch-stray-write-attribution.test.mjs`: 138/138 pass.
- Broader: 53 test files touching approve/return/sync-root/merge/settlement/
  commit-unit-work/claim-liveness/postland (`--test-concurrency=8`): 7
  failures in 6 CLI files (`fgos-iron-law-gate`, `fgos-merge`,
  `fgos-post-merge{,-3,-4}`, `fgos-read-5`), all harness-level (`git commit`
  "nothing to commit", item still `todo`). Re-run serially: 128 pass, 0 fail.
  Load flakes, not this diff. (The glob also picked up JSON fixtures, which
  "fail" as non-test files; ignored.)
- ENOBUFS reproduction: scratch repo under the session scratchpad, script
  importing `isWorkingTreeClean` from this worktree.

## Recommended actions

1. H1: bound the untracked read (prefix-match collapsed `dir/` against
   ownFileSet, or explicit `maxBuffer` + named error) and add a test.
2. M1: inline the parse in the worker snippet, or document the transition.
3. M2: add a `return`-gate and a `branchContentMismatch` test with a
   Vietnamese and a renamed path; pin the `normalizePath` collision.
4. M3: `--no-relative` on every `diff --name-only/--name-status` reader.
5. L0: stop trimming `--show-prefix`.
6. L1: `--literal-pathspecs` on the `branchContentMismatch` diff.
7. L4: move `workflow/runner.mjs:271` onto `nulPaths`.

## Note on worktree state

During this review another agent left uncommitted edits in this worktree
(`test/runner/merge-quoted-paths.test.mjs`, `test/util/git-paths.test.mjs`,
plus `reports/redteam-rununit-gitparse-261014.md`). They are not mine. They add
tests for the >1 MiB untracked listing, `diff.relative`, and a
space-prefixed subdirectory, which independently match H1, M3 and L0 above.
My earlier test runs may have included some of those edits; the H1/M3/L0
reproductions were standalone scripts against committed `src/`.

## Unresolved questions

- Is a fgOS-managed project expected to carry large unignored untracked trees
  in the main checkout? If never, H1 drops to Medium, but the land-step
  re-check makes the failure expensive when it does happen.

Status: DONE_WITH_CONCERNS
Summary: Parser and rename-as-both-halves semantics are correct and fail-safe across Iron Law, clean-tree, postland and settlement callers; one confirmed regression, `--untracked-files=all` in `isWorkingTreeClean` throws ENOBUFS (approve/sync-root/return/reset) on a large untracked dir where main answered in 7 bytes.
Concerns: H1 needs a fix before landing; M1 transition crash in the worker Iron Law snippet; M3 pre-existing fail-open under diff.relative is the same path-identity class and cheap to close here; gate-level tests for return/branchContentMismatch with quoted or renamed paths are missing.
