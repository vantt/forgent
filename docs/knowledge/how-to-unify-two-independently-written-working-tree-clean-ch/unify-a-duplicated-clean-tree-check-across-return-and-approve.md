---
type: how-to
title: How to unify two independently-written working-tree-clean checks into one scope-parameterized function
tags: []
timestamp: 2026-07-29T16:24:57.893Z
source_capture_ids: [choke-point-workingtree-clean-duplication]
framework: diataxis
mode: how-to
---
# How to unify two independently-written working-tree-clean checks into one scope-parameterized function

Use this when a survey (e.g. `docs/decisions/0022-fgos-choke-point-survey.md`)
flags two functions with the same name and the same `.fgos/`-exclusion logic,
but a real, deliberate difference in scope — here, `return`'s per-item
subtree check versus `approve`'s whole-repo check — as a choke-point worth
collapsing.

## Before you start

- Confirm the duplication is real, not just same-named: read both call
  sites' `git status` arguments. `bin/fgos.mjs`'s `isWorkingTreeClean(cwd)`
  (return) ran `git status --porcelain -- .` (subtree); `src/runner/merge.mjs`'s
  `isWorkingTreeClean(repoRoot)` (approve, imported as `isMainTreeClean`) ran
  `git status --porcelain` with no pathspec (whole-repo). Everything else —
  the `git rev-parse --show-prefix` prefix computation and the
  `isFgosOnlyStatusLine` exclusion call — was already byte-identical between
  the two.
- The only real difference between the two scopes is the pathspec argument
  passed to `git status --porcelain`. That is the signal that a single
  `scope` parameter, not a rewrite, is the right shape for the merge.

## Steps

1. **Pick the more complete implementation as the merge target.** The
   whole-repo version (`src/runner/merge.mjs`'s `isWorkingTreeClean`) already
   had the fuller doc comment and was already exported for cross-module
   reuse — extend it rather than the CLI-local one.

2. **Add a `scope` option, keep the default byte-identical to every existing
   caller.**

   ```js
   export function isWorkingTreeClean(repoRoot, ownFileSet = null, { scope = 'whole-repo' } = {}) {
     const prefix = git(repoRoot, ['rev-parse', '--show-prefix']).trim();
     const statusArgs = scope === 'subtree' ? ['status', '--porcelain', '--', '.'] : ['status', '--porcelain'];
     return git(repoRoot, statusArgs)
       .split('\n')
       .filter((line) => line.trim() !== '')
       .every((line) => isFgosOnlyStatusLine(line, prefix, ownFileSet));
   }
   ```

   Defaulting `scope` to `'whole-repo'` means every pre-existing caller
   (`approve`, and every existing test calling `isWorkingTreeClean(repoRoot)`
   with two or fewer arguments) keeps its exact prior behavior with zero
   changes at the call site.

3. **Turn the other implementation into a thin delegate**, instead of
   deleting it outright — the caller's own signature (`cwd`, `ownFileSet`)
   stays unchanged so nothing else in that file needs to change:

   ```js
   function isWorkingTreeClean(cwd, ownFileSet = null) {
     return isMainTreeClean(cwd, ownFileSet, { scope: 'subtree' });
   }
   ```

4. **Write a test that would fail on the old code, and prove it.** A
   parameterized merge is only really "the same logic, one path" if the new
   `scope` values actually produce the old, divergent behavior. Before
   trusting the merge, check the new test file out against the pre-fix
   commit in a disposable detached worktree and confirm at least one
   assertion goes red:

   ```bash
   git worktree add --detach /tmp/<scratch>/redcheck <pre-fix-commit>
   cp test/state/<new-test-file>.test.mjs /tmp/<scratch>/redcheck/test/state/
   (cd /tmp/<scratch>/redcheck && node --test test/state/<new-test-file>.test.mjs)
   git worktree remove --force /tmp/<scratch>/redcheck
   ```

   This is also the proof self-modifying-code changes to `bin/fgos.mjs` /
   `src/runner/merge.mjs` need before `fgos approve --acknowledge-iron-law`
   — the Iron Law check refuses those two paths without a real
   failing-test-first demonstration, not just an assertion that one exists.

## Why this exists

Two functions with an identical name, an identical exclusion helper, and an
identical prefix-computation strategy, differing only in one git pathspec
argument, are not a coincidence of independent authorship converging on the
same idea — they are one real concept (`isWorkingTreeClean`) that grew two
literal implementations because no one factored the pathspec choice into a
parameter the first time either was written. Once two callers need different
*scope* for the same *check*, scope belongs on the function's signature, not
duplicated across two functions that must be kept in sync by hand forever
after.

## Real example

Item `choke-point-workingtree-clean-duplication`, from
`docs/decisions/0022-fgos-choke-point-survey.md`'s ranked candidate #2,
confirmed the exact duplication described above and merged it into
`src/runner/merge.mjs`'s `isWorkingTreeClean(repoRoot, ownFileSet, { scope })`,
with `bin/fgos.mjs`'s own function reduced to a one-line delegate. The new
test file (`test/state/working-tree-clean-unified.test.mjs`) was checked out
against the pre-fix commit in a disposable worktree first — one assertion
failed there (a dirty file outside a subtree was NOT excluded, since the old
whole-repo-only code path had no subtree concept), confirming the test was
real proof rather than a tautology before `--acknowledge-iron-law` was used.

> `{"id":"choke-point-workingtree-clean-duplication","predicted":{"tier":"standard","deps":0,"priorVisits":1,"role":"session","branchHeadAtTake":"3dad0c2e7c8c9c421734cfb0963998abed7cc2c1"},"actual":{"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":1}}`
> — real `work.outcome` capture, id `choke-point-workingtree-clean-duplication`

## Related

- `docs/decisions/0022-fgos-choke-point-survey.md` — the survey that ranked
  this duplication as candidate #2, and now notes it as resolved with the
  commit that fixed it.
- `docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md`
  — a sibling how-to for a different `fgos approve` blocker, also covering
  the `--acknowledge-iron-law` flag this item's merge also required.
