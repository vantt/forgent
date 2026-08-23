---
title: promote-to-component action (Layer 2)
item: tsk-3gx
---

# tsk-3gx — Plan: `promote-to-component`

## Mode

**high-risk.** Flags counted against the item: data model (mutates the
`parent` field, may create a new item and a new git branch),
audit/security (must land a real decision record; the whole point of the
item is preventing a state/git divergence), weak-proof area (branch
retargeting across items has no existing precedent in this codebase — see
Approach below for why the mechanism chosen borrows a *related* precedent
rather than reusing an identical one). On top of the flag count, D3
already names a concrete data-loss hazard (tsk-3au) as a hard gate on its
own — any one hard-gate flag forces high-risk regardless of count.

## Approach

**Chosen path: reuse `sync-root`'s existing merge primitive per member,
never a git rebase.**

`bin/fgos.mjs`'s `sync-root` action (`case 'sync-root'`, line ~2563) and
`src/runner/merge.mjs`'s `mergeRunnerItem`/`mergeRunnerItemLocked` already
implement almost exactly the mechanism D3 needs, one layer up: given a
branch and a target, check out an ephemeral worktree on the target
(`withMergeEphemeralWorktree`, `src/runner/worktree.mjs:433`), run `git
merge --no-commit --no-ff <branch>` there, detect real conflicts
(`mergeHeadExists`/abort-on-conflict), run the goal-check, and only on a
clean pass land a real commit — all under `acquireMainCheckoutLock`
(`main-checkout-lock.mjs`) for the whole window, and record a real
decision (`addDecision`) on success. This is the exact "dry-run, bail on
conflict, never force" shape D3 locks, already built and already
exercised in production.

`promote-to-component`'s own retarget step (b) calls this same primitive
once per member — `mergeRunnerItem(ephemeral.path, member, {...})` inside
`withMergeEphemeralWorktree(repoRoot, <integrationRootId>, ...)` — with
the integration branch as target instead of the member's already-known
parent. A conflict or a lock-held/verify-fail outcome from that call *is*
D3's bail condition; nothing new needs inventing to detect it.

**Alternative rejected: a real `git rebase`.** The item's own description
uses the word "rebase", but a rebase rewrites the member branch's own
commit history — exactly the class of destructive, hard-to-verify-safe
git operation tsk-3au's incident (an unchecked `git reset --hard` on a
shared checkout) warns against, and it would require building a whole new
conflict-detection/lock/verify path from scratch. A merge-based retarget
(git-native, additive, never rewrites the member's own branch) achieves
the same end state — the member's work is reachable from the integration
branch — without the history-rewrite risk, and reuses a primitive already
proven under concurrency. This plan treats "rebase/retarget" in the
item's own text as satisfied by the merge-based mechanism; the end
state D3 and the item's own step (c)/(d) care about (member's work really
present under the integration branch before `parent` is set) is identical
either way.

**D3's "active/dirty worktree" bail check**, the other half of the
threshold, is not something `mergeRunnerItem` covers today (it operates
against a fresh ephemeral worktree, not the member's own live worktree) —
this is new: before calling `mergeRunnerItem` for a given member, check
whether that member's own branch is currently checked out in a linked
worktree with uncommitted changes (`git worktree list --porcelain` +
`git status --porcelain` scoped to that worktree path, if one exists for
`branchNameFor(member.id)`). If so, bail that member per D3(ii) — report
it, do not touch it, move to the next member. This check is read-only and
new but small; no existing helper does it today (confirmed: no hits for
`worktree list` combined with a dirty-check in `src/runner/`).

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| Merge-based retarget (reused `mergeRunnerItem`) | Medium — mechanism is proven, but this is its first use outside `sync-root`'s own item-to-known-parent shape | Confirm a scripted 2-member promote against a disposable fixture branch pair produces the same `merged`/`conflict`/`verify-fail` outcomes `sync-root` already produces for the analogous case |
| New active/dirty-worktree bail check (D3.ii) | High — new code, the exact gap tsk-3au's incident exposed | Prove: (a) a member with a clean, non-checked-out branch proceeds; (b) a member whose branch is checked out in a worktree with uncommitted changes bails without touching git; (c) the check runs *before* any git mutation for that member, never after |
| Root creation (D1 "new item" path) | Medium | Prove the new root item is created via the existing `fgos add` path (no new item-creation mechanism), and its branch is created fresh from `detectTrunk` via the existing `createWorktree`/baseRef mechanism — not a new branch-creation code path |
| Per-member independence (partial success) | Medium | Prove: if member 2 of 3 bails (conflict or dirty-check), members 1 and 3 that succeeded still get `parent` set for real (step c only ever follows a real, successful step b for *that* member — see Assumptions) |
| `main-checkout.lock` coverage | Medium — concurrency, shared checkout | Prove the lock is held for each member's own merge window (already true by construction — inherited from `mergeRunnerItem`) and that the whole promote-to-component call is safe to run from the main checkout only (mirrors `sync-root`'s own `isMainWorktree` refusal) |
| Decision record (step d) | Low | Prove one `fgos decision` call lands per successful promote-to-component invocation, listing root id, method (new-item vs reuse-member), and the member outcomes (merged / bailed-conflict / bailed-dirty) |

Impact-analysis posture: **full** (`gitnexus` present, confirmed via `fgos
tool query --capability impact-analysis --status present` during
clarify). Blast-radius evidence for the retarget/lock reuse above can
lean on a real GitNexus query at validating time, not a self-report.

## Files likely touched

- `src/runner/merge.mjs` — new export, e.g. `promoteToComponent(repoRoot,
  memberIds, opts)`, composing `mergeRunnerItem`/`withMergeEphemeralWorktree`
  per member plus the new dirty-worktree check. Reuses, does not
  duplicate, `sync-root`'s primitives.
- `bin/fgos.mjs` — new CLI case (`promote-to-component`), following
  `sync-root`'s own shape (`isMainWorktree` refusal, flag parsing, per-item
  outcome reporting), calling the new `merge.mjs` export and, per member,
  the existing `--parent`-setting path (`patch.parent = ...`, same code
  `edit --parent` already runs) only after that member's own merge lands.
- `src/state/work.mjs` — no schema change (confirmed: `parent` already
  supports exactly this relationship; `mergeAfter`/`deps` unaffected).
- Test file for the new action (co-located with existing `merge.mjs`/CLI
  test conventions — exact path deferred to execution, not a plan-time
  decision).

## Order

`fgos graph --what-if tsk-3gx --json` reports `unblocksTransitive: 0` —
nothing downstream is waiting on this item, so there is no
cross-item urgency shaping build order; order below is purely internal:

1. Precondition/validation (D2): confirm every passed id is flat (no
   `parent`) and connected via `deps`/`mergeAfter`. Fail closed before any
   mutation if not.
2. Resolve root (D1): either the caller-designated existing member, or
   create a fresh item (`fgos add`) + fresh branch off `detectTrunk`.
3. Per member (D3, sequential, independent per member — see Assumptions):
   a. dirty/active-worktree check — bail this member if active;
   b. `mergeRunnerItem`-based merge into the integration branch — bail
      this member on conflict/verify-fail;
   c. on real success only, set `parent` for that member via the existing
      edit path.
4. One decision record (step d) summarizing the whole invocation's
   outcomes across all members.

## Split decision

**No split.** The four steps are one honest, atomic-per-member action —
splitting them into separate work items would recreate exactly the
danger the item exists to prevent: state (`parent`) claiming a lineage
before git reality backs it up. `fgos graph --what-if` confirms no
external item depends on partial delivery here, so there is no
parallelism benefit to splitting either.

## Assumptions

- **Per-member independence is the intended atomicity unit, not a single
  N-way transaction across all members.** Grounded in the item's own
  description ("với từng item thành viên... rebase/retarget... hoặc báo
  không an toàn") and D3, both phrased per-member. Partial success (some
  members promoted, others left flat with a reported reason) is an
  acceptable, expected outcome — not a failure requiring rollback of the
  members that did succeed. Not asked back to `fgos-coding-exploring`: doesn't
  change scope/acceptance, only clarifies an already-per-member-shaped
  mechanism.
- **New-root branch seeds from `detectTrunk`, uniformly** — even the
  member that "suggested" the grouping goes through the same per-member
  merge step (b) as every other member; there is no special-cased "seed"
  member that skips the merge. Keeps exactly one code path for both D1
  branches (new-item vs reuse-member) — the only difference is how the
  integration branch/item initially comes into existence. Not asked back:
  implementation choice, does not change the final state (all members'
  work reachable from the integration branch) or acceptance criteria.
