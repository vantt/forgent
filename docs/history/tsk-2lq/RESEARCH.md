# tsk-2lq — RESEARCH

## Round 1 (2026-08-21, discovery stage)

**Asked:** merge.mjs's `mergedTreeAlreadyVerified` fast-path has a real-world
hit rate approaching zero on a busy shared trunk, because it requires `HEAD`
to still be an ancestor of `branch` (no unrelated commit may have landed on
main since return). Is there a straightforward, evidence-backed way to relax
this to "the item's own branch content specifically is unaffected by main's
advance", or is this a genuinely open design question needing a person?

**Checked:**

- `src/runner/merge.mjs:965-998` — `mergedTreeAlreadyVerified(repoRoot, item,
  branch)`. Two required conditions: (1) `branch` tip still equals
  `item.branchHeadAtReturn` (no unverified commit pushed after return), (2)
  `isAlreadyMerged(repoRoot, 'HEAD', branch)` — `HEAD` is an ancestor of
  `branch`, i.e. main has not advanced past the fork at all. Docblock at
  `:965-987` confirms this was verified empirically as sufficient but not
  necessary — deliberately conservative to avoid a false-positive skip.
- `src/runner/merge.mjs:1255` — call site inside `mergeRunnerItemLocked`,
  invoked AFTER `git merge --no-commit --no-ff branch` has already run
  (`:1163`) and the merge is staged but not committed. `HEAD`/branch tip are
  both untouched by `--no-commit`, so the check's answer is valid either side
  of the merge call (per the comment at `:1246-1248`).
- `src/runner/merge.mjs:1000-1057` — `branchContentMismatch(repoRoot, branch,
  ref)`, existing prior art in the SAME file (tsk-15k/tsk-107) for a related
  but distinct problem: given an ALREADY-merged branch, find the paths it
  introduced (relative to the true fork point, found via the first merge
  commit on `branch..ref`) and check whether those paths are still reflected
  in `ref`'s current tree — used to catch a `git merge -s ours`-style content
  discard while ancestry stays intact. This is NOT directly reusable as-is
  (it assumes a post-hoc already-merged state and locates the fork point via
  merge-commit history), but it establishes the exact git-diff-based pattern
  needed: `git diff --name-only <base>..<tip>` to get a path set, then
  compare path sets for overlap/content.
- For the PRE-merge case `mergedTreeAlreadyVerified` sits in, the fork point
  is directly available and unambiguous: `git merge-base branch HEAD` (no
  merge has landed yet, so there is exactly one relevant base, unlike
  `branchContentMismatch`'s harder problem of locating which of possibly
  several merge commits is the right one). From there: `introducedPaths =
  git diff --name-only <mergeBase>..<branchHeadAtReturn>` (what branch
  changed) and `mainAdvancedPaths = git diff --name-only <mergeBase>..HEAD`
  (what main changed since the fork). If the two path sets are disjoint, a
  standard git 3-way merge is guaranteed to carry each side's changes to
  paths only *that* side touched — the merged tree at `introducedPaths` is
  bytewise identical to `branchHeadAtReturn`'s tree there, independent of how
  far main has advanced, as long as main's advance never touched a path
  branch also touched. This is standard 3-way-merge semantics (a path
  changed by only one side never triggers a merge decision on that path);
  the existing `branchContentMismatch` function already relies on the same
  underlying git diff/name-only primitives elsewhere in this file, so this
  is not a new class of git operation for this codebase.
- `test/runner/merge.test.mjs:1611-1674` — existing D5 test suite for this
  function, 4 tests: skip fires when tree matches (`:1614`), skip does NOT
  fire once main advances past the fork even by an unrelated commit
  (`:1632`, `moved-on.txt` — this is the exact test whose expected outcome
  a fix must deliberately invert to `skip fires` when the touched path does
  not overlap branch's own footprint), skip does not fire on a branch tip
  that moved past `branchHeadAtReturn` (`:1648`), and skip never applies
  with no `branchHeadAtReturn` at all (`:1666`). All 4 give concrete,
  reusable fixtures (`initRepo`, `makeBranchWithCommit`,
  `configureInvariantChecks`, `tipOf`) for a fix's own new tests.

**Found:** the fix direction the item's own description proposes
("checking whether the item's own branch content specifically... is
unaffected, rather than requiring a strict fork-point ancestor
relationship") is not a genuinely open design question — it resolves to a
concrete, buildable mechanism using git primitives and a diff-path-overlap
pattern already established in the same file (`branchContentMismatch`,
tsk-15k), with an existing test harness ready to extend. No product/UX
judgment call is needed; this is a technical correctness question with a
grounded answer.

**Still open (belongs to planning, not a person):** exact function shape
(new helper vs. extending `mergedTreeAlreadyVerified` inline), whether to
special-case a rename (git diff path-name changes across the fork could
make a "same path" comparison miss a rename that only one side performed —
worth a plan-time decision on whether to treat a rename as overlap
conservatively, i.e. fail-closed to "run checks" when in doubt, matching
this function's own documented sufficient-not-necessary philosophy), and
which of the 4 existing D5 tests need updating vs. which stay as regression
fixtures for the strict-ancestor case still exercised via a path-overlap
scenario.

**Verdict:** `clear` — verify: `npm test -- test/runner/merge.test.mjs`
(existing suite, must extend green + new fixture-based tests for the
path-overlap-tolerant skip).
