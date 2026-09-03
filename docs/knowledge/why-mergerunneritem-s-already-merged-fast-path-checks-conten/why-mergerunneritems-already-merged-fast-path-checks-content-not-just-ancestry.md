---
framework: diataxis
mode: explanation
---
# Why `mergeRunnerItem`'s already-merged fast path checks content, not just ancestry

`mergeRunnerItemLocked`'s `isAlreadyMerged` fast path
(`src/runner/merge.mjs:701-707`, added by `tsk-3yl` D1) could mark an
item `done` without actually merging when the branch was already an
ancestor of `HEAD` — it skipped the real
`git merge --no-commit --no-ff` and just ran verify, returning
`outcome: 'merged'`. The bug: `isAlreadyMerged`'s bare `is-ancestor`
check only proves the branch's commit is reachable from `ref` via
parent-chain linkage — it says nothing about whether the resulting tree
still carries the branch's actual changes.

## The real failure shape

A manually-resolved `git merge -s ours` (or any history rewrite that
keeps `branch` as a parent while discarding its content) makes `branch` a
real ancestor while dropping 100% of what it introduced —
reproduced empirically against this exact function. `isAlreadyMerged`
alone can't tell that apart from a genuine, content-preserving merge.

## Why the short-circuit itself couldn't just be dropped

Removing the fast path entirely was considered and explicitly rejected
during clarify: it would reintroduce `tsk-3yl`'s original crash —
`git commit --no-edit` failing with `"nothing to commit"` on a genuine
retry-after-partial-approve-failure — trading one real bug for
reintroducing an already-fixed one.

## The fix — `branchContentMismatch`

Instead of trusting bare ancestry, the fast path now also checks whether
the paths `branch` actually introduced are still reflected in `ref`'s
current tree:

```js
// tsk-15k: whether the paths `branch` actually introduced (relative to its
// own true fork point, found via the EARLIEST merge commit on the
// `branch..ref` ancestry path) are still reflected in `ref`'s current tree.
// `isAlreadyMerged`'s bare `is-ancestor` check only proves branch's commit
// is reachable from `ref` (parent-chain linkage) — it says nothing about
// whether the resulting tree still carries branch's actual changes. A
// manually-resolved `git merge -s ours` (or any history rewrite that
// keeps branch as a parent while discarding its content) makes branch a
// real ancestor while dropping 100% of what it introduced — reproduced
// empirically against this exact function. Returns the list of
// mismatched paths (empty = parity holds, safe to trust the ancestry
// alone).
//
// Deliberately does NOT use `merge-base(branch, ref)` directly for the
// "before" state — that resolves trivially to branch's own tip once branch
// is already an ancestor of ref, which would make every check pass
// vacuously. Instead finds the specific merge commit that first brought
// branch into ref's history and uses ITS first parent (the mainline tip
// immediately before that merge landed) as the real fork point. No merge
// commit found (a fast-forward, never produced by this codebase's own
// `--no-ff` merges) means there was nothing to discard in the first place —
// trusts ancestry unchanged, matching pre-existing behavior.
function branchContentMismatch(repoRoot, branch, ref) {
  const mergeCommits = git(repoRoot, ['log', '--merges', '--ancestry-path', '--reverse', '--format=%H', `${branch}..${ref}`])
    .split('\n').filter((line) => line !== '');
  if (mergeCommits.length === 0) return [];
  const firstMerge = mergeCommits[0];
  let base;
  try {
    base = git(repoRoot, ['merge-base', branch, `${firstMerge}^1`]).trim();
  } catch {
    return []; // no shared history to diff against — fail open, nothing to compare
  }
  const introducedPaths = git(repoRoot, ['diff', '--name-only', `${base}..${branch}`])
    .split('\n').filter((p) => p !== '');
  if (introducedPaths.length === 0) return [];
  const changedByMerge = new Set(
    git(repoRoot, ['diff', '--name-only', `${firstMerge}^1`, firstMerge, '--', ...introducedPaths])
      .split('\n').filter((p) => p !== ''),
  );
  return introducedPaths.filter((p) => !changedByMerge.has(p));
}
```

Empty return means parity holds — safe to trust the ancestry check
alone, matching pre-existing behavior. A non-empty return means real
content was discarded despite the branch being a technical ancestor.

## Why compare against the merge commit, not `ref`'s current tree

A later refinement (`tsk-107`, folded into the same function) changed
what the mismatch check compares against: the merge commit's own content
at the moment it landed, not `ref`'s *current* tree. A later, unrelated,
already-merged branch touching the same path makes `ref`'s tree
legitimately differ from `branch`'s own tree forever after — that's not
discarded content, just two branches sharing a file. The real
`-s ours`-style discard signature is narrower: the merge commit itself
made no change to that path relative to its own first parent, even
though `branch`'s diff touched it. Comparing against the merge commit
itself, not the ever-moving current tree, is what makes that distinction
possible.

## Risk classification and why it mattered

This item was planned at **high-risk**, not the default `standard`, on
four counted flags: **audit/security** (a false `done` on unmerged
divergent content is a data-integrity failure in the engine's own
bookkeeping — main is reported to contain content it does not actually
contain), **public contracts** (`mergeRunnerItem`'s outcome shape is
consumed by `bin/fgos.mjs`'s approve path; the fix couldn't silently
change what existing callers read from a `'merged'` outcome),
**existing covered behavior** (the fast path was already exercised by
two passing tests, both required to stay green), and **weak proof** (no
test existed before this session constructing a false-positive scenario
for this exact path). Any one audit/security flag alone triggers the
high-risk gate; this item had four.
