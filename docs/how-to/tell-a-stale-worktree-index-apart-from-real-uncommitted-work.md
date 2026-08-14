---
type: how-to
title: How to tell a stale worktree index apart from real uncommitted work
tags: []
timestamp: 2026-08-14T03:02:00.000Z
source_capture_ids: [tsk-4l1]
---
# How to tell a stale worktree index apart from real uncommitted work

Use this when `pick`'s claim-worktree resync refuses with "its last-synced
commit (...) is behind the branch's current tip (...) and the tree has
uncommitted changes" — before deciding whether to reset the worktree by
hand or carry the staged content forward with `fgos resync-worktree`.

## Before you start

- A claim worktree can silently drift when its branch is force-moved by an
  external operation (e.g. a sibling child's merge landing via
  `approve`'s leaf→root merge) without ever touching this worktree's own
  files/index. `pick`'s reattach step (`resyncClaimWorktree`,
  `src/runner/worktree.mjs`) correctly refuses to auto-reset over anything
  it cannot prove is safe — it cannot tell "stale artifact left over from
  the drift" apart from "real work you were in the middle of" from the
  outside, so it always fails closed and asks you to look.
- `fgos resync-worktree` is NOT a safe default answer here. It assumes the
  staged content is real work worth preserving (it captures it as a patch,
  resets to the branch's current tip, then reapplies the patch). Running it
  on a genuinely stale artifact risks reapplying that staleness on top of
  the new tip — the same corruption the guard exists to prevent. Decide
  which case you're in FIRST.

## Steps

1. **Read the refusal's own data.** The thrown error carries `lastSynced`
   (the commit this worktree's own `HEAD` reflog last recorded) and
   `branchTip` (the branch's real current tip). Note both.

2. **See what actually differs from the last real sync point.**

   ```bash
   git -C "<worktreePath>" diff <lastSynced> -- ':!.fgos'
   git -C "<worktreePath>" status --porcelain -- ':!.fgos'
   ```

   If both come back empty, the worktree was never dirty in the first
   place — re-run `pick`, the resync should now go through on its own.

3. **Walk backward through history for a byte-identical match.** A stale
   artifact is content that was already real, at some earlier point, just
   never advanced — so it will match some OLDER commit's tree exactly, even
   though it no longer matches `lastSynced`. Walk `lastSynced`'s own
   ancestry looking for that match:

   ```bash
   git -C "<worktreePath>" log <lastSynced> --format=%H | while read -r c; do
     if git -C "<worktreePath>" diff --quiet "$c" -- ':!.fgos'; then
       echo "MATCH: $c"
       break
     fi
   done
   ```

   - **A `MATCH` line prints** — the worktree's tracked content is
     byte-identical to a real, already-existing commit. This is confirmed
     staleness: safe to `git -C "<worktreePath>" reset --hard <branchTip>`
     by hand (the guard's own strip-`.fgos`-after-reset step,
     `stripFgosAfterReset`, is not run by a manual reset — remove
     `<worktreePath>/.fgos` yourself afterward, per ADR0020).
   - **No match within a reasonable depth (a few dozen commits back)** —
     treat this as real, unproven work. Commit it, or run `fgos
     resync-worktree` to carry it forward across the resync.

4. **Untracked files never match this check** — `git diff <commit>` never
   reports untracked (`??`) content, regardless of which commit it's
   compared against, so an untracked file surfacing in step 2 is always
   real (never explainable by staleness) and should just be committed or
   removed on its own merits.

## Related

- `docs/history/stale-worktree-index-guard/CONTEXT.md` — the pre-commit
  hook's own, unconditional staleness refusal (a different guard, scoped to
  the commit path rather than the claim path).
