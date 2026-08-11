# Root's long-lived claim worktree drifts from its own branch after a child merge (tsk-2cd)

## Feature boundary

Fix the gap where a root/parent item's long-lived claim worktree (stood up
by `fgos pick`, where a session may be sitting doing real work) silently
falls out of sync with its own `fgw/<rootId>` branch every time `fgos
approve` merges a leaf child into that branch. `git rev-parse HEAD` run
inside that worktree correctly reports the branch's current tip, but the
worktree's actual checked-out files/index remain frozen at whatever commit
they were last synced to — so a `verify` run from inside that worktree
silently runs against stale code. Not in scope: a repair/doctor command for
worktrees already caught in this stale state right now (this item is
forward-looking — designing the guard that prevents future occurrences);
not in scope: the merge-time clobber problem for a *kept-open* (not
actively claimed) worktree — that is a separate, already-closed item (see
Canonical references below).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Root cause: `withMergeEphemeralWorktree`'s `git branch -f <branch> <endCommit>` ref-move (`src/runner/worktree.mjs:652`) advances `fgw/<rootId>` in the shared `.git` dir without touching any *other* worktree already checked out on that same branch. `HEAD` in the root's long-lived claim worktree is a symbolic ref that resolves live (so `git rev-parse HEAD` looks current), but the worktree's index/working files are never re-checked-out — they stay at whatever commit they were last actually synced to. This supersedes the item's own original suspicion (`createWorktree`'s branch-reuse force-reclaim path) — that mechanism was replaced by `createDetachedMergeWorktree` specifically to fix a prior, different bug (see D3/Canonical references) and is no longer what runs during a leaf→root merge. Confirmed by the person filing this item. |
| D2 | Fix scope includes correcting the stale `bin/fgos.mjs:2836-2845` inline comment (the "force-reclaims" claim itself at line 2842), which currently misattributes the drift to the old force-reclaim mechanism. Small, directly tied to this bug's own root cause — left uncorrected it would mislead the next reader chasing this same symptom. Confirmed by the person filing this item. Line range corrected from the item's own original `2798-2804` citation during `fgos-coding-validating`'s repo-fit check (tsk-2cd) — the file has moved since that description was written; re-grep before editing rather than trusting either citation blind. |
| D3 | The required guard behavior (already specified in the item's own description, formalized here for traceability, not re-derived): before a claimed worktree is used to run verify, check it against its branch's current tip — `git merge-base --is-ancestor <worktree's HEAD> <branch tip>` to prove no commits would be lost, then `git status` on the **whole tree** (never just files of interest) to prove it is clean. Auto-resync (`git reset --hard <branch tip>`) only when BOTH hold. If the tree has real uncommitted changes, or the ancestor check fails, refuse and report to the person — never auto-reset blind. This mirrors the existing main-checkout safety discipline (`docs/how-to/safely-reset-the-main-checkout.md`, `src/runner/main-checkout-reset-guard.mjs`) but must be its own guard, not a reuse of that module — that module's job is protecting the main checkout specifically, a different target. |

No open product-facing gray areas remain beyond D1-D3 — the item's own
description already specified the safety discipline in full; this pass's
job was confirming the actual mechanism (D1) and formalizing scope (D2).

## Pinned terms

- "long-lived claim worktree" — the worktree `fgos pick`/`createClaimWorktree`
  stands up for a claimed item, meant to stay open and usable for the
  duration of a session's work (as opposed to a merge-time *ephemeral*
  worktree, which is created and destroyed within a single `approve` call).
- "drift" — the specific state where a worktree's branch ref (as read via
  `git rev-parse HEAD`) has advanced past the commit the worktree's actual
  index/working files were checked out to, with no real uncommitted local
  changes involved (the apparent `git status` diffs are index-vs-moved-HEAD
  noise, not genuine local edits).

## Scout paths and evidence cited

- `bin/fgos.mjs:2793-2853` — `approve`'s leaf→root merge path; calls
  `withMergeEphemeralWorktree(repoRoot, rootId, ...)`; the stale comment at
  `2836-2845` (force-reclaims claim at 2842) is D2's target — re-grep
  before editing, line numbers drift as the file changes.
- `src/runner/worktree.mjs:596-658` — `createDetachedMergeWorktree` +
  `withMergeEphemeralWorktree`; line 652 (`git branch -f`) is D1's exact
  culprit.
- `src/runner/worktree.mjs:451-498` — `createWorktree`'s reuse/relocate
  path; NOT the current mechanism for merge (superseded), still the
  mechanism `pick`/`take`'s own reclaim uses for a genuinely abandoned
  checkout — left untouched by this item, per D1's scope note.
- `src/runner/worktree.mjs:575-586` — `createClaimWorktree`, the reattach
  path (`reattachableCheckout`) `fgos pick` uses when re-claiming an item
  whose worktree is still standing; one of the two candidate guard
  placement points the item's own description names (left to
  `fgos-coding-planning` to choose, per D3's placement being an implementation
  concern, not a product one).
- `docs/how-to/safely-reset-the-main-checkout.md`,
  `src/runner/main-checkout-reset-guard.mjs` — the safety-discipline
  pattern D3's guard must follow (whole-tree status, ancestor-proof before
  any reset, refuse over blind reset) without reusing that module directly
  (different protected target).

## Canonical references

- `docs/history/merge-worktree-reclaim-clobbers-kept-checkout/CONTEXT.md` —
  the prior item whose D1 ("approve/merge's ephemeral-worktree creation
  must never move or destroy an existing checkout of the target branch")
  drove the `createDetachedMergeWorktree` + `git branch -f` design that
  this item's D1 identifies as the actual drift source. This item is best
  understood as the flip side of that fix: solving the destroy/clobber
  problem via a ref-only update avoided ever touching another worktree's
  checkout, but a ref-only update also means no other worktree on that
  branch ever gets told to resync.

## Outstanding questions deferred to planning

- Guard placement: `fgos pick`'s `reused:true` reattach path vs the start
  of `fgos-coding-implement` (or both) — implementation choice, item's own
  description already frames both as viable candidates.
- Exact shape of the "refuse and report" surface (return value / exit
  code / friction record) when D3's guard finds real uncommitted work or a
  failed ancestor check — implementation choice.
- Verify command for this item — currently unset (`"chưa xác định — P15 bổ
  sung"`), left to whichever stage defines it.

## Impact-analysis posture

`impact-analysis: full` — GitNexus registered and `present`, freshly
checked this session (`fgos tool query --capability impact-analysis
--status present`).
