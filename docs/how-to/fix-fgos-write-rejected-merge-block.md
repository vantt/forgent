---
type: how-to
title: How to fix a `fgos-write-rejected` merge block on a `.fgos/` change
tags: []
timestamp: 2026-07-30T00:00:00.000Z
source_capture_ids: [tsk-n4i-1, tsk-5vf]
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

## Example: `tsk-5vf` — the block stacks with a second, unrelated one

`tsk-5vf` hit this same block for a different reason than `tsk-n4i-1`: not a
live `events.jsonl` repair, but the item's *own new feature* — moving
project config from `.fgos-runner.json` into a new `.fgos/config.json` —
committing the freshly-created file straight onto the branch that also
carries the feature's code:

> `"errorClass":"fgos-write-blocked","layer":"state","detail":"fgw/tsk-5vf staged a change under .fgos/ (.fgos/config.json); merge aborted, main unchanged — ADR0020"`
> — real `work.friction` capture, id `tsk-5vf`

Same fix as above — `git rm --cached .fgos/config.json` (kept the physical
file on disk, untracked, for local re-verification) then a follow-up commit
removing it from the branch's tracked tree entirely:

> `git show --stat` of the offending commit: `.fgos/config.json | 42 ++++++++++` (new file, 42 insertions) alongside 14 legitimate source/test/doc files
> `git show --stat` of the fix commit right after: `.fgos/config.json | 42 -` (only the file's removal, nothing else touched)
> — real `git show` output, commits `26b5403` → `b59595c`, branch `fgw/tsk-5vf`

The general lesson step 3's "belongs on main as an operator action, never
bundled into the PR diff" already states, sharpened by this case: it
applies just as much to a file a feature is *introducing for the first
time* as it does to a repair of an existing `.fgos/` file — the ADR0020
wall does not distinguish "new" from "repaired," only "under `.fgos/`."

This item's `verify` also needed narrowing per step 5, but for a related,
independent reason worth naming separately: it checked `test -f
.fgos/config.json`, which cannot pass in `fgos return`'s disposable
detached worktree once the file is no longer committed (same reasoning as
step 5, applied to a file the branch creates rather than one it repairs):

> before: `"verify":"npm test -- test/runner/dispatch.test.mjs && grep -r 'mergeWithGlobalConfig' src/runner/dispatch.mjs && test -f .fgos/config.json && git show main:.fgos-runner.json >/dev/null 2>&1 && echo 'Migration path exists'"`
> after: `"verify":"npm install && npm test -- test/runner/dispatch.test.mjs && grep -r 'mergeWithGlobalConfig' src/runner/dispatch.mjs && node bin/fgos.mjs setup >/dev/null && test -f .fgos/config.json && git show main:.fgos-runner.json >/dev/null 2>&1 && echo 'Migration path exists'"`
> — real `work.edit` capture, id `tsk-5vf`

The fix here differs from a bare `npm test`: instead of dropping the
file-existence check, the verify command now *creates* the file live via
`node bin/fgos.mjs setup` before checking for it — proving the same
migration mechanism the item ships, without requiring the file to be a
committed branch artifact. The `npm install` prefix is this item's own
second, unrelated block stacking on the first: `tsk-5vf`'s branch merged in
concurrent work (`tsk-slq`) that added forgent's first-ever npm dependency
(`yaml`) after this item's branch had already forked — see
`docs/how-to/add-a-new-npm-dependency-to-forgent.md` step 2 for that half
of the fix in full. Two independently-caused blocks on the same item is not
a special case this recipe needs new steps for — each is fixed by its own
already-documented recipe, applied in turn.

## Example: `tsk-4eu` — the block recurs when the fix itself must edit `.fgos/config.json`

`tsk-4eu` differs from the two cases above: its own footprint legitimately
included `.fgos/config.json` — the fix moved a config block
(`executors.judge`) up to `capacities.judge-decompose`, so the live config
file itself was the intended target of the change, not an accidental
byproduct:

> `"footprint":["src/runner/dispatch.mjs",".fgos/config.json","test/runner/dispatch.test.mjs"]`
> — real work item footprint, id `tsk-4eu`

That produced the same `fgos-write-blocked` rejection as the cases above:

> `"errorClass":"fgos-write-blocked","layer":"state","detail":"fgw/tsk-4eu staged a change under .fgos/ (.fgos/config.json); merge aborted, main unchanged — ADR0020"`
> — real `work.friction` capture, id `tsk-4eu`

But two of the retry attempts right after that hit a *different* git
failure signature for the same underlying cause — `errorClass:
"merge-failed-unclassified"`, exit 128, from a dirty main-checkout working
tree rather than the branch's own staged commit:

> `"errorClass":"merge-failed-unclassified","layer":"state","detail":"git merge --no-commit --no-ff fgw/tsk-4eu failed without a real conflict (exit 128): error: Your local changes to the following files would be overwritten by merge:\n\t.fgos/config.json\nPlease commit your changes or stash them before you merge.\nAborting\n; merge aborted, main unchanged"`
> — real `work.friction` capture, id `tsk-4eu` (recorded twice, one retry apart)

The lesson this adds to the recipe above: when the fix genuinely needs a
`.fgos/` config change, that change still can't ride the branch's commit
(step 3–4 above apply exactly the same — restore the path, amend it out).
The config-file edit itself has to be re-applied as a separate operator
action directly against the main checkout, per step 5's existing rule —
and if a retry after a `fgos-write-blocked` block starts hitting
`merge-failed-unclassified` (exit 128, "local changes... would be
overwritten") on that same path instead of the clean ADR0020 message,
check the main checkout's own working tree for leftover uncommitted
changes to that path before re-attempting the merge.

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

A second capture, gathered the same way (`fgos doc-sources
docs/how-to/fix-fgos-write-rejected-merge-block.md`), links `tsk-5vf` to
this same doc path:

> ```json
> {
>   "id": "tsk-5vf",
>   "predicted": {"tier":"light","deps":0,"priorVisits":1,"role":"session","branchHeadAtTake":"3a7dc889d76eed5c5b8f52eaa33e9499025eb428"},
>   "actual": {"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":24},
>   "docType": "how-to",
>   "docPath": "docs/how-to/fix-fgos-write-rejected-merge-block.md"
> }
> ```
> — real `work.outcome` capture, id `tsk-5vf`

That capture's own work item is the task that introduced `.fgos/config.json`
as a brand-new file and, at first, committed it to the feature branch that
also carried the code creating it:

> "Di dời .fgos-runner.json (project-level config) vào .fgos/config.json — hoàn thành phần D1-amended"
> — real work item title, id `tsk-5vf`

If a later item hits this same block, the export skill accumulates its
capture here too, additively, without losing this section or anything
above it.

A third capture, gathered the same way (`fgos doc-sources
docs/how-to/fix-fgos-write-rejected-merge-block.md`), links `tsk-4eu` to
this same doc path:

> ```json
> {
>   "id": "tsk-4eu",
>   "predicted": {"tier":"standard","deps":0,"priorVisits":7,"role":"session","branchHeadAtTake":"77cf03c4fa835c5318e82274cfac67fd46b320d6"},
>   "actual": {"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":7},
>   "docType": "how-to",
>   "docPath": "docs/how-to/fix-fgos-write-rejected-merge-block.md"
> }
> ```
> — real `work.outcome` capture, id `tsk-4eu`

That capture's own work item is the task that hit this block while its fix
itself needed to move a config block within `.fgos/config.json`:

> "Bug: `executors.<key>` khong phai tier thi chet IM — hau qua that la judge-decompose cli-spawn chay khong co Read"
> — real work item title, id `tsk-4eu`
