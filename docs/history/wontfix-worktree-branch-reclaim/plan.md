Mode: high-risk

Flags counted (fgos-routing Mode gate): **data loss** (hard-gate — this
change force-deletes real git branches/commits that were never merged
anywhere; a wontfix item is "valid, never going to be done" but its
commits are still real, unmerged work product) and **existing covered
behavior** (`startupReap`/`listLeftovers` in `src/runner/loop.mjs` already
has dedicated test coverage in `test/runner/worktree.test.mjs` and
`test/runner/loop.test.mjs`, and another module — `cleanup-harness.mjs` —
documents an invariant about how many places force-delete a branch, which
this change adds a third to). One hard-gate flag alone forces high-risk
regardless of total count.

## Decisions this plan honors

- RESEARCH.md round 1 (docs/history/wontfix-worktree-branch-reclaim/RESEARCH.md):
  a `wontfix -> cleanup` FSM edge (fix direction #1 from the item's own
  description) is foreclosed — `tsk-2ub` D2 already considered and
  rejected widening `wontfix`'s doors to the
  `delivered/retrospective/cleanup/done` chain. This plan only pursues fix
  direction #2 (a dedicated, no-TTL-wait reclaim).
- Decision logged at discovery (`fgos decision`, `touches:tsk-4dk`): this
  item stays independently needed regardless of `tsk-4dk`'s own outcome
  (that item's execution-gap/cron framing doesn't cover wontfix's
  structural zero-doors-out gap).

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` reports
GitNexus `present`. But `mcp__gitnexus__list_repos` shows the indexed copy
of this repo (`/home/vantt/projects/forgentX`) is **1047 commits behind
HEAD** — a real staleness the `present` status alone doesn't surface
(CLAUDE.md's gate: "present" only means installed, never that the index is
fresh). Posture recorded honestly as **degraded**: cross-checked the blast
radius directly via `grep -rn` instead of trusting a 1047-commit-stale
graph.

Cross-check result: `startupReap` (`src/runner/loop.mjs:374`) has exactly
one caller, itself (`loop.mjs:1130`, the runner's own dispatch loop).
`listLeftovers` (`src/runner/worktree.mjs:1342`) is called only from
inside `startupReap` (`loop.mjs:442`) and from its own direct unit tests
(`test/runner/worktree.test.mjs`). No other production caller exists — a
narrow, well-contained change surface.

The one real cross-module dependency found: `src/state/cleanup-harness.mjs`
(lines 96-110, the `checkMergeStillResolves` doc comment) states a branch
"in this codebase, is ONLY ever force-deleted in two guarded places:
loop.mjs's zero-ahead prune ... and merge.mjs's cleanupMergedBranch" — and
its own "missing ref → fall back to HEAD, assume safe" logic for a leaf
item's root branch leans on that closed set. This plan adds a **third**
force-delete path (wontfix-status branches with commits ahead), which
means the new prune must never fire while the wontfix item still has open
descendants depending on its branch ref — see the guard below. Without
that guard, a wontfix'd ROOT with still-open children would have its
`fgw/<rootId>` branch deleted out from under them, breaking their own
future `checkMergeStillResolves` (targetRef missing, falls back to `HEAD`,
which their own unmerged branch is never an ancestor of — a false "lost"
report for children that never actually lost anything).

## Approach

**Chosen path:** extend `startupReap`'s existing `listLeftovers` sweep
(`src/runner/loop.mjs`, ~line 440-461) with a status-aware branch: for
each leftover `fgw/<id>` branch, look up `id`'s current `status` in the
already-loaded `view.work`. If `status === 'wontfix'` AND the item has no
open descendant (same guard `frontier.mjs`'s `hasOpenDescendant` already
implements — reuse it, never re-derive), force-delete the branch/worktree
via the same mechanism the real `cleanup` verb already uses
(`cleanupMergedBranch`, `src/runner/merge.mjs:1336` — `reclaimOrphanedCheckout`
+ `git branch -D`), regardless of `aheadCount`. Every other branch
(non-wontfix, or wontfix-but-anchored) keeps today's exact behavior
(`aheadCount === 0` → prune, `aheadCount > 0` → keep, logged as "a
proposal, never auto-deleted").

**Repo-fit correction (fgos-coding-validating Reality Gate round 1):**
`hasOpenDescendant` (`src/state/frontier.mjs:314`) and the map it needs
(`indexChildrenByParent`, `frontier.mjs:193`) are both bare `function`,
not `export function` today — neither is actually importable from
`loop.mjs` as this plan originally implied. Both are pure, already-tested
functions; the fix is additive only (add the `export` keyword to each,
zero behavior change to either), not a re-implementation. Added to Files
touched below.

**Why here, not a new dedicated verb/module:** `listLeftovers` already
IS the "which `fgw/<id>` branches are leftover" query, called from the one
site (`startupReap`) that already runs unconditionally on every runner
loop pass, already git-mutating (it already force-deletes zero-ahead
branches), and already reads `view.work` for the `hasStillNeededDescendant`
check right next to where this new branch belongs. A second, parallel
sweep would duplicate the leftover-branch enumeration and the
worktree/branch-deletion mechanics for no real benefit — YAGNI.

**Why no TTL wait (unlike `cleanup`):** per the item's own description and
finding (1) in RESEARCH.md, there is no merged code a wontfix branch's TTL
grace period would let anyone "catch on main before it's gone" — the
content was never merged in the first place. The zero-ahead prune
directly above already deletes with no TTL for the analogous "nothing of
value here" case; this mirrors that precedent rather than inventing a new
one.

**Alternatives rejected:**
- FSM edge `wontfix -> cleanup` (fix direction #1) — rejected, contradicts
  the locked `tsk-2ub` D2 decision (see RESEARCH.md finding 1).
- Reusing the `cleanup` verb's own gate (`assessCleanupReadiness`) via a
  synthetic path — rejected, its three checks (TTL anchored to a
  `retrospective -> cleanup` event, retrospective-content, merge-resolves)
  are all built for the `delivered -> ... -> done` chain and would either
  spuriously fail-closed (retrospective content never exists for wontfix)
  or spuriously pass without checking anything real (merge-resolves against
  a take-time sha that was never actually merged) — see RESEARCH.md
  finding 2.
- A brand-new dedicated reclaim verb/module — rejected as unnecessary
  duplication of `startupReap`'s already-existing sweep + `cleanupMergedBranch`
  mechanics (YAGNI); the one wrinkle (no TTL, wontfix-aware) is small
  enough to be a conditional branch in the existing sweep, not a reason
  for a parallel system.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| Force-deleting a wontfix branch/worktree with real unmerged commits | High (data loss, hard-gate) — but intentional: wontfix means the work is deliberately, permanently abandoned, and `git branch -D` leaves the commit in the local reflog (not instantly unrecoverable) | A test asserting `listLeftovers`'s new wontfix branch, WITH commits ahead and no open descendants, is force-deleted exactly like today's zero-ahead case |
| A wontfix ROOT with still-open (non-terminal) children whose branches point at `fgw/<rootId>` | Medium — breaks `checkMergeStillResolves`'s "missing ref, fall back to HEAD" assumption for those children if pruned too early (see Impact-analysis posture above) | A test asserting a wontfix item WITH an open (`todo`/`doing`/`blocked`/`awaiting-human`) child is NOT pruned, using the same `hasOpenDescendant` guard `frontier.mjs` exports |
| Regressing today's existing `listLeftovers` behavior (zero-ahead prune, non-zero-ahead keep, for every non-wontfix branch) | Low — the new branch is additive and status-gated, but `test/runner/worktree.test.mjs`'s existing 3 tests must still pass unchanged | Run `node --test test/runner/loop.test.mjs test/runner/worktree.test.mjs` before/after; the existing 3 `listLeftovers` tests and `startupReap`'s own tests must stay green with zero edits to their assertions |
| A checked-out or dirty linked worktree for a wontfix item (a person still has it open) | Low-medium — `reclaimOrphanedCheckout`/`removeWorktree` already refuse or handle a dirty tree per their own existing contract; this plan does not change that contract, only what triggers the call | No new proof needed beyond confirming (by reading, not re-testing) that `cleanupMergedBranch`'s existing warning-collection shape (`warnings.push(...)`, never throws) is preserved when called from this new site too |

Files touched, in order:
1. `src/state/frontier.mjs` — export `hasOpenDescendant` (line 314) and
   `indexChildrenByParent` (line 193); no behavior change to either.
2. `src/runner/loop.mjs` — `listLeftovers`'s consuming loop inside
   `startupReap` (~line 440-461): add the wontfix + no-open-descendant
   branch, importing `hasOpenDescendant`/`indexChildrenByParent` from
   `../state/frontier.mjs` and `cleanupMergedBranch` from `./merge.mjs`.
3. `test/runner/loop.test.mjs` — new test(s) for the wontfix-prune and
   wontfix-with-open-child-kept cases (the file the item's own `verify`
   field already names).

No change needed to `src/runner/worktree.mjs` (`listLeftovers` itself stays
a pure, status-agnostic query — the status-aware decision belongs in its
caller, `startupReap`, which already has `view.work` loaded) or to
`src/state/status-fsm.mjs`/`cleanup-harness.mjs` (fix direction #1 is
foreclosed, per above).

## Split

No split. This is one coherent, scoped piece — a single conditional branch
in one already-existing sweep function plus its tests, not a multi-part
feature. Per YAGNI/KISS, decomposing a change this size into separate work
items would be pure ceremony.

## Outstanding questions

None
