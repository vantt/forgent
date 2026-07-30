---
type: how-to
title: How to fix a `fgos-write-rejected` merge block on a `.fgos/` change
tags: []
timestamp: 2026-07-30T00:00:00.000Z
source_capture_ids: [tsk-n4i-1]
---
# How to fix a `fgos-write-rejected` merge block on a `.fgos/` change

Use this when `fgos merge next` (or `fgos approve <id>`) refuses your item
with `outcome: "fgos-write-rejected"`, or when the item's own friction log
shows `errorClass: "fgos-write-blocked"`.

## Before you start

- This only happens because your item's branch (`fgw/<id>`) somehow
  committed a change under `.fgos/` — usually because a fix touched the
  live event log directly and got committed like ordinary source code.
- You need write access to that branch's own worktree to fix the commit.

## Why this is rejected, not just a warning

A worker's `fgw/<id>` branch must never carry a change under `.fgos/` — the
store's one write door is the `fgos` CLI run directly against the main
checkout, never a worker's own commit. This is quoted verbatim from the
merge code's own design comment, so it stays exact:

> "FGOS-WRITE-REJECTED (ADR0020): a worker's `fgw/<id>` branch must never
> carry a change under `.fgos/` — the store's single write door stays the
> `fgos` CLI verbs run against `repoRoot`, never a worker's own commit
> (`0005`). `worktree.mjs`'s `createWorktree` no longer checks out `.fgos/`
> into a worker's worktree at all (same ADR), so this should never trigger
> in practice — this check is the mechanical, trusted-side wall for the
> residual case (a worker `mkdir`s a fresh `.fgos/` itself and commits it)
> that a missing checkout alone can't prevent."
> — real source comment, `src/runner/merge.mjs` (`mergeRunnerItemLocked`)

The real friction this produced, captured against the item that hit it:

> `"errorClass":"fgos-write-blocked","layer":"state","detail":"fgw/tsk-n4i-1 staged a change under .fgos/ (.fgos/events.jsonl); merge aborted, fgw/tsk-n4i unchanged — ADR0020"`
> — real `work.friction` capture, id `tsk-n4i-1`

The merge itself is safely aborted before anything lands — `fgw/tsk-n4i`
(the target) is left exactly as it was. The item just moves to `blocked`
with `reason: "fgos-write-rejected"` instead of merging.

## Steps

1. **Confirm this is really the cause.** Re-run the merge and read the
   exact message:

   ```
   fgos merge next
   ```

   ```json
   { "picked": "<id>", "approve": { "to": "blocked", "reason": "fgos-write-rejected", "target": "fgw/<parent-or-main>", "paths": [".fgos/events.jsonl"] } }
   ```

   The `paths` array names exactly which `.fgos/` paths were staged — that
   is what you need to remove from the branch's commit.

2. **Re-claim the item and go back into its own commit.** `fgos pick <id>`
   reattaches the same branch (`branchExists` reuse) even from `blocked`:

   ```
   fgos pick <id>
   ```

3. **Restore the `.fgos/` path(s) to what they were before your commit.**
   Find the commit before yours on the branch, then check that path back
   out from it:

   ```
   git log --oneline
   git checkout <parent-commit> -- .fgos/events.jsonl
   git status --short
   ```

   You should see the `.fgos/` path staged as reverted, with your other,
   legitimate source/doc changes untouched.

4. **Amend the commit** (or add a follow-up commit) so the branch no longer
   carries any `.fgos/` diff at all:

   ```
   git commit --amend --no-edit
   git show --stat HEAD
   ```

   Confirm no path under `.fgos/` appears in the stat output.

5. **Fix the item's own `verify` command if it checked `.fgos/` state.** A
   verify command that reads `.fgos/events.jsonl` (or any other `.fgos/`
   path) relative to the branch's own checkout can never pass through
   `fgos return`'s re-verify for a branch-source item — that re-verify runs
   in a disposable *detached* worktree checked out at the branch's commit,
   which never carries `.fgos/` either (same ADR0020 exclusion). Narrow the
   verify to only what the branch itself can prove:

   ```
   fgos edit <id> --verify "npm test"
   ```

   Whatever real fix the `.fgos/` change was meant to make has to be
   applied separately, directly against the main checkout, as an operator
   action — never re-attempted through this branch.

6. **Re-run `npm test`, then return and merge again:**

   ```
   npm test
   fgos return <id>
   fgos merge next
   ```

## Example: real before/after from the store

The item that hit this (`tsk-n4i-1`) first returned with a commit that
included a renumbered `.fgos/events.jsonl` alongside legitimate source/doc
fixes — 7 files changed. After the fix above, the same logical work landed
as 6 files, with the `.fgos/` path gone entirely:

> `git show --stat` before: `7 files changed, 1205 insertions(+), 1138 deletions(-)` (includes `.fgos/events.jsonl`)
> `git show --stat` after: `6 files changed, 13 insertions(+), 10 deletions(-)` (no `.fgos/` path)
> — real `git show` output, commits `a0b53ac` → `bb4d07e`, branch `fgw/tsk-n4i-1`

Its `verify` field changed the same way:

> before: `"verify":"node -e \"...fs.readFileSync('.fgos/events.jsonl'...)...\" && ... && npm test"`
> after: `"verify":"npm test"`
> — real `work.edit` capture, id `tsk-n4i-1`

The second merge attempt succeeded at the git level (`Merge branch
'fgw/tsk-n4i-1' into fgw/tsk-n4i` landed cleanly) with no further
`fgos-write-rejected` block.

## Related

- `fgos check <id>` — shows the `fgos-write-blocked` friction entry quoted
  above, and any earlier attempts.
- The actual `.fgos/` data fix this item needed (a live `events.jsonl`
  repair) still has to happen — as a direct operator action against the
  main checkout, outside any branch. See
  `docs/history/live-events-seq-corruption/plan.md`'s "Correction during
  executing" section for the full reasoning.

## Document history (compound-learn capture linkage)

This doc's path (`docs/how-to/fix-fgos-write-rejected-merge-block.md`) is
linked to a real compound-learn capture, gathered via `fgos doc-sources
docs/how-to/fix-fgos-write-rejected-merge-block.md`:

> ```json
> {
>   "id": "tsk-n4i-1",
>   "predicted": {"tier":"heavy","deps":0,"priorVisits":1,"role":"session","branchHeadAtTake":"a0b53acb71176399ed1242aa1e5a9f0e5a70fa2d"},
>   "actual": {"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":2},
>   "docType": "how-to",
>   "docPath": "docs/how-to/fix-fgos-write-rejected-merge-block.md"
> }
> ```
> — real `work.outcome` capture, id `tsk-n4i-1`

That capture's own work item is the task that hit this exact block while
renumbering the live event log's corrupted `seq` values:

> "Renumber corrupted seq in live .fgos/events.jsonl + fix stale seq citations (tsk-n4i piece A)"
> — real work item title, id `tsk-n4i-1`

If a later item hits this same block, the export skill accumulates its
capture here too, additively, without losing this section or anything
above it.
