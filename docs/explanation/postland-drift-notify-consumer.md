---
authoritative_for: postLand.notify drift consumer, postLandDrift(), fgos doctor leaf-notify-drift check, fgos-coding-driving Orient surface for drift
---

# `postLand.notify` drift is now actually consumed, not just computed

`tsk-1el` closed a real gap: `tsk-2ypd` (D4) had already built the
mechanism to classify post-land drift into `notify` (live-session
branches) vs. `stale` (no live session) buckets, but nothing ever
consumed the `notify` side to tell a live session anything real — the
detection existed with no consumer wired to it.

## What "post-land drift" means here

When an item's branch merges (`outcome === 'merged'`) into its target,
any sibling/child branch still open against that same target can now
diverge from it in a real, file-overlapping way. `postLand`'s existing
classification (`detectPostLandDrift`, `tsk-2ypd`) already separated
`notify` (a live session owns the open branch) from `stale` (no live
session — protected passively by the merge catch-up gate instead).

## What shipped: `postLandDrift()`, a recompute-on-read consumer

`src/state/postland-drift.mjs`'s `postLandDrift(repoRoot, view, {trunk,
sessions})` (D1-D9, `docs/history/postland-drift-consumer/CONTEXT.md`):

- Gated strictly to items with a live session (`listSessions`) — this is
  the `notify` branch only; `stale` stays passively protected by the
  merge catch-up gate as before.
- For each candidate open leaf sharing a landed target
  (`openLeavesSharingTarget`), computes real path overlap: the merge-base
  between the leaf branch (`fgw/<id>`) and its target
  (`fgw/<parent>` or trunk), then diffs each side's changed files since
  that merge-base and intersects the two file sets.
- **Recompute-on-read, no merge-time persistence** (D3) — nothing is
  written at merge time; every check recomputes fresh from current git
  state.
- Silently skips a target branch that no longer exists by check time
  (D8) rather than erroring.

## Two real consumption surfaces wired

1. **`fgos doctor`'s `leaf-notify-drift` check**
   (`src/setup/registrations.mjs`) — reports every live-session branch
   with real drift against its target, naming the item, branch, target,
   and the specific overlapping files.
2. **`fgos-coding-driving`'s Orient surface** (`loop-mechanics.md`,
   mirrored across all skill-tree copies in a follow-up commit that
   completed a mirror the first pass missed) — the autonomous drive loop
   itself now surfaces drift during Orient, so a live session can
   self-adjust or re-sync before its own real-merge lands, rather than
   discovering the conflict only at merge time.

## A small citation-discipline fix bundled in

A follow-up commit in this item's own history
(`786f8c77`) removed a bare `D-`-prefixed decision-id citation that had
drifted outside its home `CONTEXT.md` — this repo's own decision-citation
convention requires content, not a bare id, in shippable prose outside
that one file.
