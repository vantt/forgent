---
type: how-to
title: How to reconstruct fgOS tracking state after an operator mistake discards .fgos/events.jsonl mid-session
tags: []
timestamp: 2026-08-10T00:00:00.000Z
source_capture_ids: [tsk-4cx]
framework: diataxis
mode: how-to
---
# How to reconstruct fgOS tracking state after an operator mistake discards `.fgos/events.jsonl` mid-session

Use this when a work item's own event history (its `work.add` and every
transition after it) is missing from `.fgos/events.jsonl`, but the real
code the item describes is already merged into `main` and verifiable on
git — not a merge conflict inside the file (see
`docs/how-to/resolve-an-events-jsonl-merge-conflict.md` for that case),
but the file's content itself having been silently overwritten.

## A real instance

`tsk-4cx`'s own entire original event history, including its `work.add`,
was silently discarded when an operator ran `git checkout fgw/tsk-2c2 --
.` from the main checkout by mistake — a git command that rewrites the
whole working tree, including `.fgos/events.jsonl`, back to whatever that
other branch's copy of the file contained:

> "RECONSTRUCTED after an operator error rolled back .fgos/events.jsonl
> on main mid-session (git checkout fgw/tsk-2c2 -- . run from the main
> checkout by mistake), which silently discarded this item's entire
> original event history including its work.add."
> — real `work.decision`, id `tsk-4cx`

This is the same class of hazard `AGENTS.md` already names for the main
checkout generally (tsk-3au/tsk-4hk) and that
`docs/explanation/events-jsonl-lost-update-race-under-concurrent-session-writes.md`
documents as root cause B (`.fgos/events.jsonl` being git-tracked in the
one shared checkout) — this instance broadens the known trigger from
"another session's automated git operation" to "any git command that
touches the whole working tree run from the main checkout by mistake",
including a plain `git checkout <branch> -- .`, not only `reset --hard`.

## Steps

1. **Confirm the real work is already safe before touching tracking
   state.** Do not re-verify or redo the implementation. Check the item's
   own real commits are present on `main` (or its merge branch) and that
   the code they describe is actually there:

   > "The real work was never affected — already merged into main before
   > the incident, verified here: commits 2268dee1 (plan), 2df78044
   > (fix+test), a45fedc8 (merge), and 'ALLOWED_FILES_ENTRIES' confirmed
   > present in test/docs/launcher-vocabulary-guard.test.mjs on main."
   > — real `work.decision`, id `tsk-4cx`

   If the code is not actually present, this is not a tracking-only
   incident — stop and treat it as real lost work instead.

2. **Re-create the tracking record to match the already-real outcome,
   not to repeat the work.** Write a `work.decision` (or equivalent)
   stating plainly that this is a reconstruction, naming the operator
   mistake that caused it, and pointing at the concrete commit hashes
   that prove the work already landed:

   > "This record re-creates the fgOS tracking state to match that
   > already-real, already-verified outcome; it does not repeat or
   > re-verify the implementation."
   > — real `work.decision` rationale, id `tsk-4cx`: "shortest honest path
   > to restore bookkeeping for work that is already safely done and
   > merged, without fabricating a redundant git merge for an
   > already-merged branch"

3. **Never fabricate a second merge for an already-merged branch.**
   The item's own branch was already merged before the incident — the
   fix here is bookkeeping only. Re-running `approve`/`merge` against a
   branch whose commits are already on `main` would either no-op or
   create a spurious duplicate merge; neither is what this recovery
   needs.

## Related

- `docs/explanation/events-jsonl-lost-update-race-under-concurrent-session-writes.md`
  — the broader "why" this class of loss happens (root cause B:
  `.fgos/events.jsonl` git-tracked in the one shared main checkout).
- `docs/how-to/resolve-an-events-jsonl-merge-conflict.md` — the sibling
  procedure for the different case of a git merge *conflict* corrupting
  `seq`, rather than a whole-tree checkout silently discarding content.
- `AGENTS.md`'s own documented main-checkout hazard (tsk-3au/tsk-4hk).
