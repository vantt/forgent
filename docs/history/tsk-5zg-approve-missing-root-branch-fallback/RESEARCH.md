# tsk-5zg — RESEARCH.md

## Round 1 (2026-08-13)

**Asked:** Does `bin/fgos.mjs`'s `approve` verb (leaf->root branch, the
`merge-base --is-ancestor` ancestor-check) guard against a missing
`fgw/<rootId>` branch yet, and is there a concrete verify command that
proves it?

**Checked:**
- `bin/fgos.mjs:46` — import line. Confirmed `createBranchRef` is now
  imported alongside the pre-existing `branchNameFor`/`branchExists`:
  `import { branchNameFor, branchExists, createBranchRef,
  withMergeEphemeralWorktree, provisionDependencies } from
  '../src/runner/worktree.mjs';`
- `bin/fgos.mjs:3421-3430` — the `if (rootId !== id)` branch, right after
  `const rootBranch = branchNameFor(rootId);` and before the
  `withMergeTargetSlot`/ancestor-check that used to crash raw:
  ```js
  if (!branchExists(repoRoot, rootBranch)) {
    createBranchRef(repoRoot, rootId, { baseRef: 'main' });
  }
  ```
  This mirrors the exact fallback `createDetachedMergeWorktree` already
  applies at its own later call site (`src/runner/worktree.mjs:830-834`,
  the fix tsk-6ch shipped) — same `createBranchRef(repoRoot, id, {
  baseRef: 'main' })` shape, same idempotent no-op-if-exists guard
  (`worktree.mjs:374-392`, `branchExists` check before `git branch`).
- `test/cli/fgos-approve.test.mjs:372` — a new regression test exists:
  `'approve of a leaf whose root branch was never created (root only
  ever driven by a live session/pick, never the runner dispatch loop
  that creates fgw/<rootId> early per D17): falls back to creating it
  from main instead of crashing raw on the ancestor-check'`. Verified
  directly (not taken on faith): stashing the `bin/fgos.mjs` fix and
  re-running this one test reproduces the exact reported crash —
  `fatal: Not a valid object name fgw/no-early-branch-root` — proving
  the test is a real regression guard, not a vacuous pass. With the fix
  restored, the full `test/cli/fgos-approve.test.mjs` suite passes
  (64/64) and the full `npm test` suite passes (3149/3154, 0 fail, 5
  pre-existing skips, same skip count as main).

**Found:** The fix described in the item's own text is present and
proven — not just claimed. A concrete, already-passing, already-proven-
to-catch-the-regression verify command exists:
`node --test test/cli/fgos-approve.test.mjs`.

**Still open:** Nothing — this closes the item's only open question.

## Verdict

`clear` — `verify: "node --test test/cli/fgos-approve.test.mjs"`
