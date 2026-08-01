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
