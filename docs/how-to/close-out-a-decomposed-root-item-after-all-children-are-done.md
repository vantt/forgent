# Close out a decomposed root item after all its children are done

`tsk-2ta` was decomposed into four children (`tsk-2ta-1..4`). Once all four
were individually claimed, implemented, verified, compound-learned, and
merged, `fgos rollup tsk-2ta` reported `doneCount: 4, totalCount: 4` — but
the root item itself was still sitting at `status: "todo"`, and it never
appeared in `fgos merge list`'s `ready` array. A decomposed root item does
not close itself just because its children finished; it needs the same
claim → implement → verify → return → compound-learn → approve cycle any
other item goes through, run on the root id itself.

## The steps

1. Confirm the children are actually all done:
   ```
   fgos rollup <root-id> --json
   ```
   Look for `doneCount === totalCount`.

2. Claim the root item itself:
   ```
   fgos pick <root-id>
   ```
   (or `/fgOS:pick <root-id>` from inside a Claude Code session). This
   reuses the root's own `fgw/<root-id>` branch — the same branch every
   child already merged into — so its worktree already contains all the
   children's real work. There is nothing left to implement.

3. Run the root item's own `verify` command (`fgos list --id <root-id>
   --json` shows it — for a decomposed item this is usually the same
   check the children shared, e.g. confirming `CONTEXT.md` reflects the
   locked decisions). It should already pass, since the children already
   proved their own pieces.

4. Return it:
   ```
   fgos return <root-id>
   ```
   This is not a no-op even though nothing new was implemented — `return`
   checks for an advanced commit history relative to the branch's prior
   state, and a root item with real merged children has one (`aheadCount`
   reflects every child's commits, not zero).

5. `fgos compound <root-id> --doc-type <quadrant> --doc-path ...` — same
   compound-learn step every item goes through, run once more on the root.

6. `fgos approve <root-id>` (or `fgos merge next` if it's the top-ranked
   ready item) — merges the root's branch, carrying every child's already-
   merged commits, into its own target (parent branch, or `main` for a
   top-level root).

## Trap: a root's own branch can advance again AFTER you've already synced it to `main` once

Merging `fgw/<root-id>` into `main` once is **not a one-time event** — it
is a snapshot of that branch's tip at that moment. If the root item still
has other children in flight, and one of them merges into the root's
branch *after* your sync, `main` goes stale again for everything that
child brought in, even though `main` genuinely contained the root's
branch at some earlier point.

Real example: `tsk-64p` (parent of children `tsk-62v`, `tsk-slq`,
`tsk-5l2`, and `tsk-g18`) had its branch merged into `main` directly via
`git merge --no-ff fgw/tsk-64p` once, while only `tsk-62v` and `tsk-slq`
had landed on it. `tsk-g18` (parent: `tsk-64p`) merged into `fgw/tsk-64p`
*afterward*, through its own normal `fgos approve` cycle — correctly, per
this how-to's own topology (a child merges into its root's branch, not
`main`). But nothing re-synced `main` with `fgw/tsk-64p`'s new tip after
that. The result looked, from `main`, exactly like `tsk-g18`'s entire
implementation and test suite had vanished — `git log --oneline --all --
<path>` even listed the commit as if it were simply part of linear
history, because `--all` walks every ref/branch, not just `main`; the tell
was `git merge-base --is-ancestor <commit> main` returning false while the
same check against `fgw/tsk-64p` returned true. Nothing was lost — the
commits were exactly where `fgos approve` put them, on `fgw/tsk-64p` —
`main` was just never told to catch up a second time.

**The fix is the same sync, repeated**: `git merge --no-ff fgw/<root-id>`
into `main` again picks up everything the root's branch gained since the
last sync, cleanly (a real `git merge`, so it will conflict loudly instead
of silently dropping anything if two syncs' content actually overlaps).
Do this *every time* a new child lands on a root's branch that has
already been synced to `main` before — not just once, ever. Only run the
root item's own full claim → verify → return → compound → approve close-out
(the rest of this how-to) once **every one of its children is actually
`done`** — running it while a sibling child (like `tsk-5l2` above) is
still `todo` would prematurely mark the root `done` while more real work
is still headed for its branch.

**Before concluding code is missing from `main`, always check**:
```
git merge-base --is-ancestor <commit> main && echo "on main" || echo "not on main yet"
git branch -a --contains <commit>   # shows every branch/ref that DOES have it
```
A commit reachable from some other ref but not `main` is a sync gap, not
data loss — resist the instinct to reconstruct or re-implement work that
is provably still sitting on its own branch untouched.

## Why this doesn't happen automatically

Each child merges into the *root's own branch* (`fgw/<root-id>`), not
directly into `main` — that's what lets multiple children share one
integration branch before the whole feature lands. But merging children
into that branch only advances the branch; it says nothing about the root
item's own `status`/`stage` fields, which are a separate piece of state
`fgos rollup` can report on but not change. The root item is a real work
item like any other — it earns its own `done` the same way everything
else does, on purpose, since that final claim+verify+return+compound cycle
on the root is also where a synthesized, real-results-aware `CONTEXT.md`
(if a "write the summary" child didn't already do that) or a last
integration check has a natural place to happen.
