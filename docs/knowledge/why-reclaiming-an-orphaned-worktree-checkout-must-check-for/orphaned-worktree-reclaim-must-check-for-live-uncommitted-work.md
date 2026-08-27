---
framework: diataxis
mode: explanation
---
# Why reclaiming an orphaned worktree checkout must check for live uncommitted work first

`reclaimOrphanedCheckout` (`src/runner/worktree.mjs`) force-removes an
existing checkout of a branch before `createWorktree` reuses it — the
crash-reclaim path: a worker that died mid-run leaves a clean checkout
(its commit already landed) behind, and that checkout is safe to discard.

The bug this item tracked: the function never distinguished a genuine
crash-orphan (clean, safe to discard) from a checkout that is actually
still live — a person's own worktree, or a session mid-edit with real
uncommitted changes. `createWorktree` calls it unconditionally whenever
`branchExists(...) === true` (the "reused" branch path), and `approve`
merging a **leaf** item creates exactly such a reused ephemeral worktree
on its **root**'s branch (`fgw/<rootId>`) to do the merge. If that root's
branch already had a real, live checkout — someone's actual working
worktree — approving one of its children would silently wipe that live
checkout out from under them, no warning, no confirmation.

## The real incident that proved it

Dogfooded for real (decision 0018, item `tsk-1wd`, 2026-07-28): running
`approve tsk-1wd-1` (a leaf) made the ROOT's own worktree — the exact one
a session had been working in since the start — disappear immediately
after the command, discovered only by accident while `ls`-ing
`/tmp/fgos-worktrees/` for something else. Lucky that time: every commit
already lived on `fgw/tsk-1wd` (confirmed intact via `git log`), so no
code was lost — only the checkout directory, restored immediately with
`git worktree add`. Had that session not yet committed, this would have
been a real, silent data loss.

## The fix

`isCheckoutDirty` (checks `git status --porcelain`, excluding the
`.fgos` removal `createWorktree` itself performs as its own known
artifact — never real content) gates the force-remove: a dirty checkout
is refused instead of destroyed, propagating as a hard failure the caller
does not swallow, rather than silently discarding real work. `main`
already carries this exact fix (`src/runner/worktree.mjs`, comment `DATA-
LOSS GUARD (tsk-1os)`), landed independently of this item's own branch.

## A second lesson: this item's own bookkeeping drifted from reality

`fgw/tsk-1os` (the branch this work item's own record points at) is
itself now a stale fork — hundreds of files behind `main`, from before a
large unrelated restructuring. Diffing it against `main` on
`src/runner/worktree.mjs` specifically shows **zero difference**: the fix
is already byte-identical on both sides, landed through some other path.
This is the same shape `tsk-2ib` documents (`fgos approve` crashing when
re-run on a branch whose content is already fully present on `main`) —
here hit on what would have been the *first* `approve` attempt, not a
retry, because the fix arrived on `main` by an entirely different route
before this item was ever approved. Closed via `fgos move --to done`
(evidence-justified: the fix's presence on `main` was confirmed by
directly reading the file, not assumed) rather than risking that crash —
the same accepted workaround `tsk-2ib`'s own report already used for
`tsk-d3c`.
