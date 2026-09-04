---
authoritative_for: assertPlanEvidence (src/state/store.mjs) refusing to let a heavy-risk work item reach "delivered" when the item never had its own fgw/<id> branch — the "child absorbed into parent" and pull-doored retroactive-sync shapes — because the check unconditionally did `git cat-file -e fgw/<id>:<path>` with no fallback to the current working tree
---

# A heavy-risk item with no branch of its own had no path to `delivered`

`tsk-2jg` fixed a bug found while retroactively syncing `tsk-28x`'s 12
children to reality after their code had already landed on `main` via the
parent's own single-commit implementation — each child never had its own
`fgw/<id>` branch, and `docs/history/tsk-28x/plan.md` covered every child's
phase under the *parent's* history dir, not each child's own.

## The two coupled problems

1. **`assertPlanEvidence` (`src/state/store.mjs:621`)** unconditionally ran
   `git cat-file -e fgw/<id>:<path>` to find a heavy-risk item's `plan.md`.
   For an item that never had its own `fgw/<id>` branch — this exact
   "child absorbed into parent" shape, or any item pull-doored via
   `take`/`return` per
   `docs/how-to/close-out-a-work-item-already-done-before-claim.md` — there
   is structurally no branch to check. A heavy-risk item in that shape
   could never reach `delivered` through the documented pull-door path,
   even when `docsRef` pointed at a real, existing `plan.md`.
2. **`classifySource` (`src/runner/merge.mjs:236`)** checks
   `branchExists(fgw/<id>)` FIRST, before `headAtTake`/`headAtReturn` — so
   creating a compensating `fgw/<id>` branch purely to satisfy problem 1's
   git-cat-file check flipped classification from `pull`/`legacy` to
   `runner`, dragging the item into the full leaf-into-root git merge
   machinery (`mergeRunnerItem`, `withMergeEphemeralWorktree`) instead of
   the lightweight pull-door verify-only path.

## Reproduced live, not theoretical

Creating `fgw/tsk-28x-1` at the current `main` tip (purely to satisfy the
plan.md gate) made `approve` try to merge it into the parent's own
`fgw/tsk-28x` branch — STALE since `tsk-28x`'s own merge into `main` days
earlier. The diff against that stale branch pulled in every `.fgos/` event
file that had landed on `main` since, tripping the ADR0020
`fgos-write-rejected` guard (no `.fgos/` mutation via a leaf merge) and
parking the item `blocked`. Net effect before the fix: a retroactively
synced heavy-risk item (`take` → `return --no-new-commits-ok`, code already
on `main`, no real branch ever existed) could reach `awaiting-approval`
but `approve` was a dead end either way — no branch failed the plan.md
check, and creating one broke merge classification instead.

## What shipped

A current-tree `fs.existsSync` fallback in `assertPlanEvidence`
(`src/state/store.mjs`): the function first checks whether `refs/heads/<branch>`
actually exists (`git rev-parse --verify --quiet`); if it does, plan.md
detection stays exactly as before (`git cat-file -e` against that branch —
correct pre-merge, when the branch isn't yet in `repoRoot`'s checkout); if
it doesn't, detection falls back to `fs.existsSync` against the current
working tree. This mirrors how the pull-door verify-only path in
`approve.mjs` already re-runs verify against the current tree rather than
a branch. The error message also now names which location was checked
(`on branch "<branch>"` vs. `in current tree (no branch "<branch>")`), so a
future refusal is self-explanatory instead of implying a branch that was
never expected to exist.

`classifySource`'s separate branch-existence-first ordering hazard (problem
2 above) was explicitly deferred, not fixed here — this item scoped to one
function (`assertPlanEvidence`) plus its stale doc comment and regression
tests, confirmed via `/fgOS:answer` as a deliberate pass-through (heavy-risk
items require human confirmation before a plan is applied without splitting;
the human confirmed no split was needed).

## Landing

Merged into `main` at `8e952d76` (merge of `fgw/tsk-2jg`). Verify: 81/81
tests passing across `test/state/store.test.mjs`,
`test/verbs/merge/approve.test.mjs`, `test/cli/fgos-approve.test.mjs`, with
Iron Law evidence (required real red/green transcripts) recorded at
`docs/history/tsk-2jg/iron-law-evidence.md`.

## What this unblocks

The 12 `tsk-28x` children that surfaced this bug were left parked at
`awaiting-approval` (a real, re-verified status, not fabricated) during
this item's own work, rather than forced further through the then-broken
`approve` path — they can now proceed through `approve` normally with this
fix in place.
