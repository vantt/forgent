---
authoritative_for: fgos-coding-driving Step 6/Step 4 worktree resync on re-entry, fgos resync-worktree verb, stale worktree after fan-out children merge
---

# The driving loop now resyncs a re-entered worktree instead of trusting it

`tsk-4gc` closed a real, 100%-reproducible bug: `fgos-coding-driving`'s
own loop skipped re-claiming a worktree whenever an item's `status` was
already `doing` before invoking the `executing`-stage skill — but that
bypass also skipped `resyncClaimWorktree`, which only ran through `fgos
pick`'s own reattach path.

## Confirmed live and 100% reproducible

On `tsk-17h` (2026-08-20): after both children (`tsk-17h-1`,
`tsk-17h-2`) were approved and merged into `fgw/tsk-17h`, re-entering the
parent's already-standing worktree left its index/working-tree stale
relative to the branch's new tip — `git status` showed the just-merged
files as *deleted*, even though `git log` correctly showed the new
commits reachable. Required a manual `git reset --hard HEAD` to resync.
This is the exact fan-out/pick sequential-then-merge-parent flow both
`/fgOS:pick` and `fgos-fanout` route through — any root/parent item
anchored by open children, then re-driven after those children are
approved, hits this every time.

## What shipped

`fgos-coding-driving`'s claim step is no longer a bare skip when
`status == 'doing'`. On the loop's first invocation of the
`executing`-stage skill: run a fresh `fgos pick` claim when not yet
claimed, **or run `fgos resync-worktree` (no claim/CAS involved) when
already claimed** — never a bare skip either way. Updated across all
render copies of both `SKILL.md` and `references/loop-mechanics.md`.
`resync-worktree` runs at most once per drive — never re-run on a
second-or-later invocation within the same drive, only at the genuine
first entry point.

This is the exact rule cited throughout this session's own retro-loop
run — every `/fgOS:retro-next` iteration's `fgos-coding-driving`
invocation followed this corrected Step 4/6 shape.
