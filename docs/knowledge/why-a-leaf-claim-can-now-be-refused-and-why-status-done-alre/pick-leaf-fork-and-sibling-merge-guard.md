---
type: explanation
title: Why a leaf claim can now be refused, and why status:done already proves the merge happened
tags: [claim, pick, leaf, worktree, baseRef, deps]
timestamp: 2026-07-29T10:43:51.000Z
source_capture_ids: [tsk-3t4]
framework: diataxis
mode: explanation
---
# Why a leaf claim can now be refused, and why status:done already proves the merge happened

`tsk-3t4` was filed against a real dogfood incident (decision 0018,
`tsk-1wd` → `tsk-1wd-3`, 2026-07-28): a leaf item's worktree, forked from
`main`, was missing sibling files that had never been merged into the
root's own branch. The item's own request was: make `pick` fork a leaf
from its root's branch (`fgw/<rootId>`), the same split `approve`/`review`
already use, instead of always forking from `main`.

## The premise turned out to be half-stale

Reading the code before touching it (`docs/history/pick-leaf-baseref-guard/CONTEXT.md`,
D1) found that `claim-port.mjs`'s `claimWork` already computed exactly this
split — `resolveRoot`/`isLeaf`/`rootBranch`/`baseRef` — landed the same day
the dogfood incident happened, in a *different* item's commits
(`d924b2d`, then refined by `268b172`). Both `take` and `pick` already
route through the same `claimWork`, and `createWorktree` already honors
`baseRef` when it's set. The literal bug the item described — "pick always
forks from main" — was gone before the item was ever picked up.

What survived scouting further was narrower and more specific:

1. No regression test proved the *positive* path — a leaf forking from an
   **existing** `fgw/<rootId>` tip, not the already-tested fallback (no
   root branch yet → fork from HEAD).
2. The runner's own autonomous dispatch loop never hits the dogfood
   scenario at all — it's FIFO, one item at a time, gated by
   `frontier.mjs`'s `depsReady` (every dep must already be `status:
   'done'`). The gap is specific to session `pick --id`, which
   deliberately bypasses frontier/stage membership for an explicit id
   (claim-lock §3a) — nothing stopped picking a leaf whose dep hadn't been
   approved and merged into the root branch yet, which is exactly what
   happened to `tsk-1wd-3`.

## `status: 'done'` on a leaf already proves the merge

The guard added for gap 2 doesn't walk git history to prove a dep's
content actually landed on the root branch — it just checks
`deps.every(dep => status === 'done')`, reusing the exact predicate
`frontier.mjs` already uses for the runner's own dispatch gate. That's
sufficient because of how a leaf item reaches `done` at all: `approve`'s
leaf path (`bin/fgos.mjs`'s `rootId !== id` branch) only calls
`moveWork(..., to: 'done', ...)` *after* a successful merge into
`fgw/<rootId>` — a merge conflict or a failed post-merge verify routes to
`blocked` instead, never `done`. So a dep reading `status: 'done'` is not
a hopeful signal; it's already proof the merge happened, with no extra git
walk needed.

## Why the guard runs before the claim, not after

The guard checks and refuses *before* `moveWork` commits the claim to
`doing`, on purpose. `268b172` had already fixed a structurally identical
bug once: `claimWork` used to pass `createWorktree` a `baseRef` naming a
branch that didn't exist yet, and `createWorktree`'s failure came *after*
`moveWork` had already committed the doing-claim — orphaning the item in
`doing` with no branch, no worktree, and no automatic recovery
(`startupReap` skips human/session claims by design). Refusing the new
sibling-merge-ordering guard before that same commit point keeps a
rejected claim a clean no-op instead of repeating that exact failure mode
for a different cause.

## Why `take` doesn't need the same guard

`take` (`isolate: false`) never calls `createWorktree` — the human
continues working in whatever checkout is already active in `repoRoot`,
and the claim only records `branchHeadAtTake`/`headAtTake` as bookkeeping
for `return`'s later progress check. Since no new branch is physically
forked from a possibly-incomplete `baseRef`, the missing-sibling-content
failure mode literally cannot happen through `take` — extending the guard
there would reject claims for a scenario that can't occur.

## Related

- `docs/history/pick-leaf-baseref-guard/CONTEXT.md` — the locked clarify
  decisions (D1, D2) and the scout evidence behind them.
- `docs/history/pick-leaf-baseref-guard/plan.md` — the mode/approach/risk
  map this fix was built against.
- `docs/explanation/fgos-choke-point-pattern.md` — the broader survey this
  item's own choke-point (`claimWork`) was already a confirmed instance of;
  a different, wider question than this doc's specific mechanism.
