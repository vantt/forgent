---
authoritative_for: checkMergeStillResolves false blocked-on-cleanup for decomposed parents, rebase-rehash blind spot, orphan-branch-rescue blind spot, main-ancestry and content-equivalence fallbacks
---

# Two confirmed blind spots in `checkMergeStillResolves`, each with a real living reproduction case

`tsk-2jz` diagnosed and partially fixed two real, git-verified blind
spots in `checkMergeStillResolves` (`src/state/cleanup-harness.mjs`)
that produce **permanent false "blocked" verdicts** for decomposed
parents, with no legitimate FSM/CLI recovery path.

## Blind spot 1 — rebase-rehash

A child's `branchHeadAtReturn` sha is frozen at return time. If the
parent's own worktree branch is later rebased (e.g. to catch up with a
sibling), the child's originally-merged commit gets rewritten to a new
hash with identical content — `git merge-base --is-ancestor` correctly
reports the **old** sha as unreachable even though equivalent content is
still present under the new hash. Confirmed for
[`tsk-3cx`](retro-next-shared-driving.md) (child `tsk-2sr`: recorded sha
`93d8e653` vs. current identical-patch commit `7cd06e83`) and `tsk-25b`
(child `tsk-3um`: recorded sha `18ecdd32` vs. current superset-patch
commit `a20c69ef`) — verified via `git reflog show <branch>` (showing
`rebase (continue) (finish)` entries) plus a direct patch diff confirming
identical/superset content, same commit message and author date.

## Blind spot 2 — orphan-branch rescue bypasses the parent

A child item's status machine can go `awaiting-approval → delivered` via
a manual `fgos move` with no merge commit ever created, leaving its
branch permanently unmerged into its parent's branch. A separate rescue
item can then land that orphaned branch straight onto `main` via its
**own** branch, deliberately bypassing the original parent's branch
(documented precedent: `tsk-13z`, applied again by `tsk-1l9` to land
`tsk-64h` and `tsk-2t5`). The child's content **is** safely on `main`,
but the DECOMPOSED-PARENT FALLBACK still checks the child's original sha
against `fgw/<originalParentId>` and fails, with no way to know the
child was deliberately re-parented. Confirmed for
[`tsk-5sr`](discover-stage-graph-post-audit-cleanup.md) (child `tsk-64h`:
sha `7d6ae519` **is** an ancestor of `main` via `tsk-1l9`'s own rescue
merge, but is not and never will be an ancestor of `fgw/tsk-5sr`).

## No self-heal path — proven, not assumed

The FSM's only nominal recovery cycle (`blocked → delivered →
retrospective → cleanup`) was actually attempted on `tsk-3cx` and
immediately re-hit the byte-identical false block (0d TTL elapsed, same
stale sha) — confirming cycling the status machine never refreshes the
frozen `branchHeadAtReturn` field.

## What shipped — scoped down after the reality gate caught an overclaim

The first planning round assumed a single content-match fallback would
resolve both blind spots. Live testing against the item's own cited real
shas found this false: it only cleanly resolved blind spot 2 (via
main-ancestry, not content match), and did not cleanly resolve 2 of the
3 named repro cases for blind spot 1 — some cited evidence had decayed
since the item's own original investigation. The plan was corrected
before shipping to scope only what was actually proven.

`checkAncestry` gained two ordered fallbacks when a direct ancestry check
fails: **(1) main-ancestry fallback** — check if the sha reached `HEAD`
directly, resolving blind spot 2's rescue-merge case; **(2) content-
equivalence fallback** — `git rev-list --count --cherry-pick --right-
only --no-merges <ref>...<sha>` against both `targetRef` and `HEAD`,
returning `ok: true` when the count is zero (content is present under a
different commit), addressing a clean rebase-rehash. If both fallbacks
fail, the function still reports `ok: false` and points at `git reflog
show <targetRef>` — an intentional limitation, since ancestry/content
checks genuinely cannot distinguish a rebase that also changed content
via conflict resolution from a real force-push loss.

## Living reproduction cases, deliberately untouched

`tsk-5sr`, `tsk-3cx`, and `tsk-25b` were explicitly named to remain
parked `blocked` as living reproduction cases — this item's own
instructions said not to touch their state as part of the fix, verifying
instead against fresh reproductions or these three directly.
