---
type: how-to
title: How to resolve an `fgos approve` merge-conflict caused by two branches claiming the same decision ID
tags: []
timestamp: 2026-07-29T15:26:46.000Z
source_capture_ids: [tsk-66l]
framework: diataxis
mode: how-to
---
# How to resolve an `fgos approve` merge-conflict caused by two branches claiming the same decision ID

Use this when `fgos approve <id>` reports `to: "blocked"`,
`reason: "merge-conflict"`, and the conflicted file turns out to be
`docs/decisions/0000-index.md` (or a `docs/decisions/NNNN-*.md` file itself)
— not a real disagreement about content, but two branches independently
picking the same "next free" decision ID while both were in flight.

## Before you start

- Decision IDs (`NNNN-slug.md`) are assigned by reading the highest existing
  number on disk and adding one — there is no central allocator. Two
  branches forked before either merged will both read the same "next free"
  number and both claim it, unless one merges before the other picks its ID.
- This is a *content-agnostic* conflict: the two decisions are usually about
  completely unrelated topics. The conflict is purely about the row-position
  and the number, not about what either decision actually says.

## Steps

1. **Confirm this is an ID collision, not a real disagreement.** Read the
   conflicted file's `<<<<<<< HEAD` / `=======` / `>>>>>>>` markers. If both
   sides are inserting a *different* row at the *same* line (not editing the
   same row's content), it's a collision, not a real merge dispute.

2. **Find the real next-free ID from `main`, not from your own branch's
   fork point.** Your branch's decision doc was drafted against a stale
   read:

   ```bash
   git ls-tree -r --name-only main -- docs/decisions/ \
     | grep -E "^docs/decisions/00[0-9]+-" | sort | tail -3
   ```

3. **Renumber your own branch's decision file** to the real next-free
   number — rename the file, and fix every internal reference (frontmatter
   `title`, the `# NNNN — ...` heading, any `superseded_by`/`supersedes`
   cross-reference, and your own prose citing the old number). Commit this
   renumbering as its own commit on your branch.

4. **Resolve the row-position conflict by hand, in a scratch worktree** (the
   original conflict still exists even after renumbering, because both
   branches inserted a row at the same position):

   ```bash
   git worktree add /tmp/<scratch>/resolve fgw/<id>
   cd /tmp/<scratch>/resolve
   git merge --no-commit --no-ff main
   # fix the conflict markers in docs/decisions/0000-index.md by hand,
   # keeping BOTH rows, in numeric order
   git add docs/decisions/0000-index.md
   git commit -m "merge(<id>): sync with main, resolve decision-index row conflict"
   npm test   # confirm nothing else broke from main's own advance
   cd - && git worktree remove /tmp/<scratch>/resolve
   ```

   Also force any `.fgos/*` paths in the merge back to `main`'s exact
   content (`git checkout main -- .fgos/`) before committing — a worktree
   made with plain `git worktree add` (not fgOS's own `createWorktree`)
   checks out `.fgos/` for real, and a line-based auto-merge on an
   append-only JSONL event log is not safe to trust even when git reports
   no conflict for it.

5. **Retry `fgos approve`.** If your branch now fully contains `main` (a
   fast-forward relationship), `fgos catchup <id>` itself will crash — see
   `tsk-28w` (filed separately: `catchup` doesn't handle the "nothing left
   to merge" case). Work around it directly instead:

   ```bash
   fgos move <id> --to proposed   # or --to awaiting-approval, whichever
                                   # string main's CURRENTLY-merged code
                                   # actually expects for this exact status
   fgos approve <id> [--acknowledge-iron-law]
   ```

## Why this exists

Decision IDs are a `next-free-integer` scheme (`scripts/next-doc-id.mjs`
formalizes the same pattern used by hand elsewhere) — cheap and sufficient
for a mostly-sequential workflow, but it has no cross-branch coordination.
Any two branches drafting a new decision doc concurrently, without one
merging first, will collide. The fix is always the same: renumber against
`main`'s real state, then resolve the resulting row-position conflict by
hand (git cannot auto-resolve two concurrent insertions at the same line).

## Real example

Item `tsk-66l` (renaming the FSM status value `proposed` to
`awaiting-approval`) drafted `docs/decisions/0023-*.md` against its own
branch's fork point. By the time it was ready to merge, `main` had
independently landed its own `docs/decisions/0023-uu-tien-san-pham-*.md`
(product-priority order, from a different item, `tsk-63c`) days earlier.

> `{"id":"tsk-66l","disposition":"blocked","errorClass":"merge-conflict","layer":"state","attempts":1,"detail":"git merge --no-commit --no-ff fgw/tsk-66l conflicted; merge aborted, main unchanged","ts":"2026-07-29T15:12:01.780Z"}`
> — real `work.friction` capture, id `tsk-66l`

The only real conflict was in `docs/decisions/0000-index.md`: both branches
had inserted a new row directly after the `0021` row. Renumbering `tsk-66l`'s
decision doc to `0024` (the real next-free number after main's own `0023`),
then manually merging `main` into the branch in a scratch worktree and
keeping both rows in order, resolved it. `fgos catchup tsk-66l` then failed
with an opaque `git commit` error (filed as `tsk-28w`) because the branch
already fully contained `main` by that point — `fgos move tsk-66l --to
proposed` followed by a plain `fgos approve tsk-66l --acknowledge-iron-law`
landed the merge cleanly on the next attempt.

> `{"id":"tsk-66l","predicted":{"tier":"light","deps":0,"priorVisits":0,"role":"session","headAtTake":"d82a3336aaa9bfeb1365070e42c7b981ccba20d5"},"actual":{"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":5}}`
> — real `work.outcome` capture, id `tsk-66l` (the eventual successful outcome)

## Second real example: caught by a post-merge audit, not at approve time

`tsk-60r4` (a scoped post-merge audit of the `tsk-2t9c`/`tsk-2t9c-1/2/3`/
`tsk-3vk`/`tsk-ogx` cluster landed 2026-08-16) found the same class of
collision, but in a shape this doc's step-2 recipe doesn't directly cover:
`docs/decisions/0032-iron-law-...md` (the Iron Law trunk-boundary decision)
and `docs/decisions/0032-multi-role-team-harness-...md` had both been
created independently, on different branches, both claiming `0032`. This
did NOT surface as a blocked `fgos approve` the way `tsk-66l`'s did —
because the two branches' merges into `main` also had *other*, real
file conflicts at the same time (`CHANGELOG.md`, `bin/fgos.mjs`,
`docs/specs/distribution.md`, `src/setup/registrations.mjs`,
`test/setup/checks.test.mjs`, from the concurrent `tsk-in1` `kind`/`via`
vocabulary migration touching the same files). A multi-file conflict
resolved entirely by hand is exactly the shape the auto-resolver in
`docs/explanation/merge-auto-resolves-decision-id-collision.md` declines
to touch (its own precondition requires the *only* conflicted path to be
the index file) — so the collision landed silently, resolved by whichever
side the person doing the manual multi-file resolve happened to keep, and
was only caught later by a dedicated post-merge audit item.

The fix followed the same rule as always — renumber the file with zero
existing citations (`rg` across the repo confirmed `0032` was never cited
pointing at the multi-role file; every existing `0032` reference meant Iron
Law), renamed it to `0033`, added the missing index row. The same audit
also caught a second, related error introduced by the same manual
multi-file resolve: a duplicated CHANGELOG bullet under two different
`## Added` headings, one contributed by each of the two merging branches.

**The lesson this adds**: a decision-ID collision doesn't only show up as
a blocked `approve` — when it rides along inside a larger multi-file merge
conflict that a person has to resolve by hand, it can land silently, and a
follow-up audit (not a mechanical check) is what catches it. Treat any
large hand-resolved multi-file merge as worth a `docs/decisions/`
grep-for-duplicate-number sweep afterward, not just a green `npm test`.

## Related

- `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md` — the
  sibling how-to for `approve`'s *other* common blocked reason
  (`verify-fail-post-merge`), including the same `blocked -> proposed`
  recovery edge used in step 5 here.
- `tsk-28w` — the `fgos catchup` crash on an already-merged branch,
  encountered and worked around in step 5.
- `docs/decisions/0000-index.md`'s own STR72 supersession convention — the
  same discipline (`supersedes`/`superseded_by`, both directions) that had
  to be renumbered alongside the file itself.
