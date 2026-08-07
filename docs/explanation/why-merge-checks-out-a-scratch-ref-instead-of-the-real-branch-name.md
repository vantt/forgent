# Why merge's ephemeral worktree checks out a scratch ref, not the real branch name

`tsk-5yp` found a real data-loss-shaped bug: approving/merging a child
into a root branch could silently destroy a *different*, deliberately
kept-open worktree checked out on that same root branch — even though
the branch's own git history stayed completely intact.

## The repro

1. Pick a root item (e.g. `tsk-2t6`), which stands up a worktree at
   `.claude/worktrees/<root>-<hash>` checked out on `fgw/<root>`.
2. `ExitWorktree` with `keep` — the tool reports "your work is preserved
   at ...".
3. From the main checkout, run `fgos approve` on 3 children in a row,
   each merging its own leaf branch into `fgw/<root>`.
4. `git worktree list` no longer shows the root's worktree at all. The
   directory is gone. Recovering it required manually running `git
   worktree add .claude/worktrees/<root>-<hash> fgw/<root>` — `EnterWorktree`
   couldn't recreate it, since the branch already existed and wasn't a
   fresh worktree case.

No commits or branch data were actually lost — `fgw/<root>` itself stayed
intact in git. But the "your work is preserved" message from `ExitWorktree`
turned out to be conditionally wrong: had that kept-open worktree had
real uncommitted changes sitting in it, this exact sequence would have
destroyed them for real.

## Root cause: `git` allows only one checkout per branch, and the merge machinery reused the wrong one

`approve` on a leaf whose resolved root differs from the leaf merges
through `withMergeEphemeralWorktree`, which needs a real working-tree
checkout of `fgw/<rootId>` to actually run the merge and verify. That
function calls `createWorktree`, and `createWorktree`'s reuse branch —
triggered whenever the target branch already exists — calls
`relocateOrphanedCheckout` instead of a plain `git worktree add`. That
relocate function physically `git worktree move`s **any existing
checkout of that branch, wherever it currently sits**, onto a fresh
`mkdtemp` throwaway path. It had no way to distinguish "a genuine
crash-orphaned checkout, safe to reclaim" from "a person's deliberately
kept-open worktree."

The only safety check on that relocate was dirtiness: a checkout with
real uncommitted changes gets refused outright (the merge throws instead
of running). **A clean kept-open worktree had no such protection** — it
looked, to the reclaim logic, exactly like an abandoned orphan ready to
be repurposed.

Once the merge/verify step finished, `withMergeEphemeralWorktree`'s own
cleanup deletes the ephemeral checkout it used — which, because of the
relocate above, was now physically the *same directory tree* that used
to be the kept-open worktree. The original path simply vanished from
`git worktree list`; only the git-worktree *registration* was destroyed,
never the branch or its commits, which is why "no data was lost" and
"the worktree disappeared" were both true at once.

This exposure wasn't specific to `approve` — the same `createWorktree`
reuse path is reachable from 4 call sites total: `approve`'s leaf→root
merge, two other merge/diff-against-parent paths, and
`promote-engine.mjs`'s `retargetMember`. Any of the four could reclaim
and destroy a kept-open worktree of their own target branch.

## Why `git` forced this collision in the first place

`relocateOrphanedCheckout` exists specifically *because* git structurally
forbids two worktrees checked out on the same branch simultaneously —
reusing the one allowed checkout (by moving it) was the original
workaround for that constraint, not an oversight. The bug was never "git
allows two checkouts and fgOS picked the wrong one" — it's that the
merge machinery needed a literal checkout of the exact branch name at
all, which is the one resource git only ever grants once.

## The fix: stop needing a literal checkout of the real branch name

Rather than add more special-casing to the relocate logic (which two
alternatives below show doesn't actually resolve the conflict), the
chosen fix removes the need for `withMergeEphemeralWorktree`'s call
chain to ever check out `fgw/<rootId>` by its real name at all:

The ephemeral merge checkout now checks out the branch's current tip
**commit** under a disposable, detached scratch state — never the real
branch name — runs the merge and verify exactly as before, and on
success **fast-forwards** `fgw/<rootId>`'s own ref to the resulting
commit (a plain ref update, which needs no exclusive checkout of
anything). On failure (conflict or verify-fail), nothing ever touched
the real branch or any existing checkout of it — same cleanup posture as
before.

Because the ephemeral worktree no longer needs the literal branch name,
the real branch's existing checkout — kept-open or not — is never
inspected, moved, or touched at all. This satisfies the locked rule by
construction for the expected case, rather than by adding a smarter
"is this really abandoned?" heuristic to the relocate path.

**Fallback for the case that can't avoid a literal checkout** (none
identified so far, but the rule has to hold even if one turns up): the
existing LIVE SESSION GUARD in `relocateOrphanedCheckout` already throws
rather than silently destroying the *calling session's own* checkout.
That same throw-not-destroy posture now extends to cover an existing
checkout that belongs to someone else too — any existing checkout of the
branch found at that point becomes a hard refusal, never a relocate.

## Why the two obvious alternatives were rejected

- **Relocate-then-restore-after**: allow the kept-open worktree to
  vanish from `git worktree list` temporarily during the merge, as long
  as it's always restored afterward — even on crash. Rejected by the
  person who filed this: they wanted zero window where the kept-open
  worktree is touched at all, not a crash-safe restore that still has a
  window where things could theoretically go wrong (a `finally`-based
  restore can itself fail).
- **Fail-fast whenever the target branch has any other live checkout**:
  refuse `approve` outright the moment the target branch has another
  worktree open. Rejected because it would contradict an existing,
  intentional design (`tsk-424`'s chained-worktree model): a root
  worktree is *meant* to stay open and usable while its children get
  merged into it one at a time. The scratch-ref approach above makes
  this refusal unnecessary in the common case, so `tsk-424`'s intended
  workflow stays intact rather than getting blocked by this fix.

## Scope: fixed at the shared primitive, not per call site

The fix lives entirely in `createWorktree`'s reuse path — the one
shared primitive all 4 exposed call sites consume identically. Patching
call sites individually was explicitly avoided: splitting the fix would
risk 3 of the 4 sites staying vulnerable while only one gets attention.
`pick`/`take`'s own reclaim-my-own-abandoned-worktree behavior (the
genuine crash-reclaim use case) stays untouched — it's a different,
intentional mechanism this item never targeted.

Full decision record: `docs/history/merge-worktree-reclaim-clobbers-kept-checkout/CONTEXT.md`
(D1) and `plan.md` (the scratch-ref-then-fast-forward implementation
approach, risk map, and the concrete regression cases proved against —
including the exact "3 approves in a row" repro shape).

## Second-order regression (`tsk-46a`): the fix traded a loud failure for a silent one under concurrency

Removing the literal-checkout requirement above closed the original
worktree-clobbering bug, but introduced a different, more dangerous
failure mode: **two concurrent merges into the same root branch can now
silently overwrite each other**, with no error, no conflict, and both
sessions reporting success.

**Why the old code accidentally serialized concurrent merges, and the
new code doesn't.** Before `tsk-5yp`'s fix, two sessions merging into the
same branch at nearly the same time would collide on git's own
one-checkout-per-branch constraint — one would hit an "already checked
out" or dirty-checkout guard and fail loudly. That serialization was
never designed; it was a side effect of needing the literal branch
checked out. Once the fix removed that need (each merge runs in its own
detached scratch checkout), the accidental mutual exclusion disappeared
along with it.

**The race, concretely**: `withMergeEphemeralWorktree` captures
`startCommit` — the branch's tip at that moment — *before* acquiring any
lock. The main-checkout lock only wraps the merge+commit step inside the
ephemeral checkout, then releases before control returns. The final
`git branch -f branch endCommit` that lands the result runs completely
outside any lock, with no check that the branch's live tip still equals
the `startCommit` this session captured. Two sessions (A and B) merging
different leaves into the same root at nearly the same time both capture
the same starting tip; both merge successfully in their own isolated
checkouts; whichever session's `branch -f` runs *second* silently
overwrites the branch, making the first session's real commit
unreachable — with both sessions still reporting `outcome: merged`.
Verified empirically with real git commands (two detached worktrees off
the same tip, force-moving the branch twice, then confirming via
`merge-base --is-ancestor` that the first commit was no longer reachable
from the final tip).

**The fix: a compare-and-swap check, not a wider lock.** Immediately
before the final `git branch -f`, the branch's live tip is re-read; the
force-move only proceeds if it still equals the `startCommit` captured
at the start. If the branch has moved, the merge is stale and must not
overwrite it. Widening the main-checkout lock to cover the *entire*
`withMergeEphemeralWorktree` call (including the merge/verify step
inside it, which can run a full test suite — seconds to minutes) was
explicitly rejected: the lock is a single *global*, not per-branch,
lock, explicitly designed to be held briefly — bottlenecking every
writer in the repo for however long one merge's verify step takes would
cost far more than the race actually costs. A CAS check matches the
fix's scope to the bug's real scope: one line, one race window.

**On a CAS mismatch, fail loudly — no automatic retry inside this
layer.** An automatic in-function retry would silently re-run the
merge's own goal-check/verify a second time — potentially expensive
(network calls, a full test suite) with zero visibility to the caller
that it happened twice. `merge-loop` already owns retry/stop semantics
for exactly this shape of failure (its "same item blocked twice in a
row" rule) — that is the correct layer to own retries, not a second, ad
hoc retry mechanism bolted onto `merge.mjs` itself.

Full decision record: `docs/history/merge-ephemeral-branch-force-race/CONTEXT.md`
(D1-D2).
