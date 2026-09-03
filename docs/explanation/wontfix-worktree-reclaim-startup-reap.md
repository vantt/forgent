---
authoritative_for: wontfix worktree/branch reclaim, startupReap wontfix pruning, status-fsm wontfix has no outgoing edge
---

# `wontfix` items now get their worktree/branch reclaimed during startup reap

`tsk-3of` closed a real, standing resource leak: `status wontfix`
(`src/state/status-fsm.mjs` `TRANSITIONS`) has no outgoing edge at
all — three doors in (`blocked`/`todo`/`doing` → `wontfix`, plus
`awaiting-human` → `wontfix`) and zero doors out. Unlike a `delivered`
item, which routes through `retrospective → cleanup → done` and
`cleanup`'s own verb deletes the branch/worktree, a `wontfix` item never
reaches `cleanup` — its `.claude/worktrees/<id>` directory and `fgw/<id>`
branch had no automated reclaim path at all.

## Confirmed live, a standing gap not a one-off

`git worktree list` cross-referenced against `fgos list --all --json`
showed 6 orphaned `wontfix` worktrees at the time
(`tsk-1am`, `tsk-1fk`, `tsk-1y6`, `tsk-1z1`, `tsk-2lg`, `tsk-5nj`),
spanning branch commit dates across several days. This session hit it
directly closing `tsk-2vn` as `wontfix`: had to manually run `git
worktree remove --force` + `git branch -D` since no verb or skill did it.

## What shipped: reclaim inside `startupReap`, not a new FSM edge

Neither of the two directions the item's own description suggested
(a `wontfix → cleanup` FSM transition, or a dedicated no-TTL reclaim
verb) — instead, `src/runner/loop.mjs`'s existing `startupReap` (which
already walks `listLeftovers` on every runner start) gained a `wontfix`
branch: when a leftover branch's item status is `wontfix` **and** it has
no open descendant (`hasOpenDescendant`, exported from `frontier.mjs` for
this reuse), the branch is force-pruned via `cleanupMergedBranch`
immediately — no TTL wait, since a `wontfix` item's branch is
never-merged, abandoned work with no reason to sit around for
re-inspection the way a merged branch's TTL grace period exists for.

**The open-descendant guard matters**: a `wontfix` parent with a still-
open child is kept, not pruned — tested directly (`startup reap: a
wontfix branch with an open descendant is kept, not pruned`) alongside
the straightforward prune case (`startup reap: a wontfix branch with
real commits ahead and no open descendants is force-deleted`).

## Reclaim is reap-triggered, not retroactive on its own

This fix runs inside `startupReap` — it prunes on the *next* runner
start, not the instant an item flips to `wontfix`. Live orphans that
predate this fix are cleared only once a reap actually runs against
them; this doc does not claim every historical orphan is already gone,
only that the mechanism now exists and is tested to catch them going
forward.
