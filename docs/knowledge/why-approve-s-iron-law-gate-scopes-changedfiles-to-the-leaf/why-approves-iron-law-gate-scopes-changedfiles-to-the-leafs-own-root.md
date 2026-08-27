---
framework: diataxis
mode: explanation
---
# Why `approve`'s Iron Law gate scopes `changedFiles` to the leaf's own root

`classifyIronLaw` was returning `required: true` based on modules a leaf
child item merely *inherited* from an unmerged parent branch — not
modules its own commits actually touched. The evidence-read door then
looked for evidence keyed by the leaf's own id, so it couldn't find the
ancestor's real evidence even though it genuinely existed on the same
branch.

## The mechanism

`changedFiles` (`src/runner/merge.mjs`) diffs `trunk...fgw/<id>` (a
three-dot diff, which git resolves against the merge-base). A leaf item
branched from a parent branch that had already merged a *different*
sibling leaf therefore inherits every file that sibling touched, because
those commits are still on the parent branch between `trunk` and the
current leaf's tip.

## Live repro

`tsk-52g-2` (branched from `fgw/tsk-52g` at `b1aba62`, after sibling
`tsk-52g-1` had already merged into it): `git diff --name-only
b1aba62..HEAD` for the item's *own* commits showed exactly three files
(`decompose.mjs`, two `SKILL.md` files) — none matching
`MODULE_RULES` in `src/evolve/iron-law.mjs`. But `classifyIronLaw` run
against the full `trunk...branch` diff returned `matchedModules`
including `src/intake/classify.mjs`, `src/runner/loop.mjs`,
`src/state/store.mjs` — all three belonging to `tsk-52g-1`, which
already had its own real evidence recorded at
`docs/history/tsk-52g-1/iron-law-evidence.md`.

## Why the evidence door couldn't just be widened instead

The evidence-read door (`docs/history/tsk-5t3-iron-law-evidence-contract/
CONTEXT.md` D3) locks the evidence path to
`docs/history/<id>/iron-law-evidence.md` keyed by the item's *own* id,
not any ancestor's — so even though `tsk-52g-1`'s real evidence existed
on the same branch, `tsk-52g-2`'s own evidence lookup could never find
it. Every leaf child branched from an unmerged parent branch was
therefore wrongly Iron-Law-blocked for modules an ancestor had modified,
forced to write evidence pointing backward instead of real evidence for
its own commits.

## The fix — scope the diff itself, not the evidence lookup

```js
let runnerOwnDiff;
if (source === 'runner') {
  const rootIdForIronLaw = resolveRoot(view, id);
  runnerOwnDiff = changedFiles(
    repoRoot,
    item,
    rootIdForIronLaw !== id ? { trunk: branchNameFor(rootIdForIronLaw) } : {},
  );
  const ironLaw = classifyIronLaw({ filesChanged: runnerOwnDiff, description: item.description });
  ...
}
```

When the leaf's resolved root differs from its own id, `changedFiles`'
`trunk` override becomes the *root's own branch*
(`branchNameFor(rootIdForIronLaw)`) instead of the repo's real trunk —
so the diff only covers commits genuinely made on top of the root
branch, never anything the root branch itself already carried in from
`trunk`. This is the exact same leaf-vs-root split pattern (D3) already
applied at four other call sites in `bin/fgos.mjs` (`review`, `review
--github`, `approve`'s root-merge path, `catchup`) — this item just
brought the Iron Law gate's own call site in line with the existing
pattern, the fifth application, not a new mechanism.

## Why the evidence-chain-walk alternative was rejected

Correct diff scoping closes the false positive at its source — the leaf
no longer sees the ancestor's modules as "changed" at all, so it never
needs the ancestor's evidence in the first place. Walking an
ancestor-evidence chain at read time was considered and explicitly
rejected: it would have papered over the wrong diff instead of fixing
it, and left the underlying misattribution in place for anything else
that reads `changedFiles`' output.

## What still fails closed on purpose

If the root branch is missing at `changedFiles` time, the existing
`MergeError` fail-closed behavior is kept unchanged — no fallback to
`trunk` was added for that case. A missing root branch is a genuine
error state, not something safe to silently paper over with a
potentially wrong diff base.

## Where the answer to "how does the tree know the ancestor" came from

The clarify question this item resolved was whether a leaf's metadata
carries its ancestor's id or commit hash directly. It doesn't need to:
`item.parent` (already part of the work schema) holds the direct
parent's id, and `resolveRoot(view, id)`
(`src/runner/root-affinity.mjs`) walks that field up to the root. The
base commit itself is never computed by hand — `git diff --name-only
trunk...branch`'s three-dot form already resolves the merge-base
automatically; the fix only ever needed to change *which* branch name
gets passed as `trunk`.
