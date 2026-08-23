# Merge's ephemeral-worktree reuse clobbers a kept-open worktree on the same branch

## Feature boundary

Fix the specific data-loss/UX gap where approving/merging into a branch that
already has a *different*, deliberately kept-open worktree (via
`ExitWorktree` "keep") silently destroys that worktree as a side effect of
the merge's own ephemeral-checkout plumbing. Not in scope: `pick`/`take`'s
own reclaim-my-own-abandoned-worktree behavior (crash reclaim) — that is a
different, intentional use case not implicated by this report.

## Repro (as filed, tsk-5yp)

1. Pick a root item (e.g. tsk-2t6), which stands up a worktree at
   `.claude/worktrees/<root>-<hash>`, checked out on `fgw/<root>`.
2. `ExitWorktree` with `keep` — tool reports "your work is preserved at
   ...".
3. From the main checkout, run `fgos approve` on 3 children in a row
   (tsk-2sl / tsk-2k1 / tsk-503), each merging its leaf branch into
   `fgw/<root>`.
4. `git worktree list` no longer shows the root's worktree. Directory is
   gone. No commits/branch data are lost (the branch itself is untouched
   in git), but the checkout has to be manually recreated
   (`git worktree add .claude/worktrees/<root>-<hash> fgw/<root>`) —
   `EnterWorktree` cannot recreate it since the branch already exists.

## Root cause (scout evidence)

- `approve` on a leaf whose resolved root differs from the leaf itself
  merges through `withMergeEphemeralWorktree(repoRoot, rootId, ...)`
  (`bin/fgos.mjs:2799`), which needs a real working-tree checkout of
  `fgw/<rootId>` to run the merge + verify.
- `withMergeEphemeralWorktree` → `createWorktree` (`src/runner/
  worktree.mjs:415`). When the branch already exists (`reused === true`),
  `createWorktree` calls `relocateOrphanedCheckout` (`worktree.mjs:312`)
  instead of `git worktree add` — this physically `git worktree move`s
  **any existing checkout of that branch**, wherever it is, onto a fresh
  `mkdtemp` throwaway path. It does not distinguish "genuine crash-orphan"
  from "a person's deliberately kept-open worktree."
- The only safety check on that relocate is dirtiness
  (`isCheckoutDirty`, `worktree.mjs:335`) — a checkout with real
  uncommitted changes is refused (throws), never moved. **A clean
  kept-open worktree has no such protection.**
- After the merge/verify finishes, `withMergeEphemeralWorktree`'s own
  `finally` (`worktree.mjs`, calls `removeWorktree`) deletes the ephemeral
  checkout — which, because of the relocate above, is now physically the
  same directory tree that used to be the kept-open worktree. Net effect:
  the original path vanishes from `git worktree list`, its git-worktree
  registration (not the branch, not any commit) is destroyed.
- `git` structurally forbids two worktrees checked out on the same branch
  at once — this is *why* `relocateOrphanedCheckout` exists (reuse the one
  allowed checkout rather than fail), and *why* this collision is
  unavoidable as long as the merge needs a literal checkout of that exact
  branch name.

**Scout finding that contradicts the item's own stated worry:** "if the
worktree had uncommitted work, it really would be lost" is not correct
under current code — `isCheckoutDirty` already refuses to relocate a dirty
checkout (approve fails loudly instead). The actual gap is narrower: a
**clean** kept-open worktree.

**Shared exposure — not approve-only.** `withMergeEphemeralWorktree` (and
therefore this same `createWorktree` reuse-path exposure) is called from
4 sites total (confirmed via GitNexus + grep):
- `bin/fgos.mjs:2799` — `approve`'s leaf→root merge
- `bin/fgos.mjs:3150` — a merge/diff-against-parent path
- `bin/fgos.mjs:3371` — another merge path
- `src/runner/promote-engine.mjs:72` — `retargetMember`

Any of these can currently reclaim/destroy a kept-open worktree of their
target branch. A correct fix belongs at the shared primitive, not one call
site.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Approve/merge's ephemeral-worktree creation must never move or destroy an existing checkout of the target branch, even temporarily — regardless of whether that checkout is clean or dirty. If avoiding that touch is technically infeasible for a given path, approve/merge must fail loudly with a clear error instead of silently reclaiming. Confirmed by the person filing this item (see decision log, D1). Scope: the merge-time ephemeral-checkout paths listed above (all 4 `withMergeEphemeralWorktree` call sites) — not `pick`/`take`'s own self-reclaim-my-abandoned-worktree behavior, which is a different, intentional use case. |

Rejected alternatives (presented, not chosen):
- **Relocate-then-restore**: allow temporary displacement (worktree
  vanishes from `git worktree list` mid-merge) as long as it's always
  restored afterward, even on crash. Rejected — the person wants zero
  window where the kept-open worktree is touched at all, not a
  crash-safe restore.
- **Fail-fast, require closing the worktree first**: refuse approve
  outright whenever the target branch has another live worktree.
  Rejected — this would contradict the existing tsk-424 chained-worktree
  design intent (a root worktree is meant to stay open and usable while
  its children get merged), so it was not the direction chosen.

## Pinned terms

- "kept-open worktree" — a worktree the session explicitly told
  `ExitWorktree` to `keep` (as opposed to `remove`), still registered in
  `git worktree list`, not currently the cwd of any live session.
- "genuine crash-orphan" — a checkout of a branch registered in `git
  worktree list` whose owning process/session no longer exists and whose
  tree is clean (per the existing DATA-LOSS GUARD doc in `worktree.mjs`).

## Scout paths cited

- `bin/fgos.mjs:2549-2830` (`approve` case, the leaf→root merge branch and
  its own acknowledged-assumption comment at `bin/fgos.mjs:2788-2790`)
- `src/runner/worktree.mjs:180-480` (`reclaimOrphanedCheckout`,
  `relocateOrphanedCheckout`, `createWorktree`)
- `src/runner/worktree.mjs:578` (`withMergeEphemeralWorktree`)
- `src/runner/promote-engine.mjs:72` (`retargetMember`)

## Impact-analysis posture

`impact-analysis: full` — GitNexus present and freshly checked this
session (`mcp__gitnexus__*` tools available; used to confirm
`withMergeEphemeralWorktree`'s 4 call sites above).

## Outstanding questions deferred to planning

- Exact mechanism to satisfy D1 given git's one-checkout-per-branch limit
  (e.g. merge on a scratch branch/commit and fast-forward the target ref
  instead of literally checking out the target branch) — implementation
  choice, left to `fgos-coding-planning`.
- Whether a shared helper/guard should be added once, at the primitive
  level, so all 4 call sites inherit the fix automatically, vs. patched
  per call site — left to `fgos-coding-planning`.
- Verify command for this item (currently unset) — left to whichever
  stage defines it (this item's `verify` field is still "chưa xác định").
