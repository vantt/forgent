---
type: reference
title: `/fgOS:triage` table columns
tags: []
timestamp: 2026-07-30T00:59:26.000Z
source_capture_ids: [tsk-dus]
framework: diataxis
mode: reference
---

# `/fgOS:triage` table columns

`/fgOS:triage` (`plugins/fgOS/skills/triage/SKILL.md`, backed by `fgos
triage --json` → `rankImpact` in `src/state/impact.mjs`) renders every
ranked row as a markdown table with exactly these columns, in this order:

| Column | Source field | Meaning |
|---|---|---|
| `id` | `id` | the work item's id |
| `status` | `status` | raw status (`todo` \| `doing` \| `blocked` \| `awaiting-approval` \| `delivered` \| `retrospective` \| `cleanup` \| `done` \| `awaiting-human` \| `wontfix`), rendered as-is |
| `stage` | `stage` | `clarify` \| `decompose` \| `executing` \| `compound-learn` (defaults to `executing` when absent) |
| `blocked-by` | `blockedBy` | ids of OTHER still-open items this row directly waits on — comma-joined list, `-` when empty |
| `blocks` | `blocks` | count of OTHER still-open items that directly wait on this one |
| `tier` | `goalTier` | `mvp` \| `milestone` \| `-` when the item declares no tier |
| `title` | `title` | the item's title |

`status` is the full domain from `STATUSES` in `src/state/work.mjs` (see
`src/state/status-fsm.mjs` for the transition table between them):

- `todo` — not yet started, ready to be picked up.
- `doing` — claimed and actively being worked.
- `blocked` — parked, waiting on another item's dependency.
- `awaiting-approval` — a goal-check pass sitting on a branch, waiting on
  approval/merge.
- `delivered` — code accepted into the main tree (the sole trigger for
  RUL12's dependent-open).
- `retrospective` — the batched learning-synthesis step (formerly the
  `compound-learn` stage).
- `cleanup` — a TTL-bounded park while its worktree is reclaimed.
- `done` — terminal: actually completed.
- `awaiting-human` — parked waiting for a person to answer a question.
- `wontfix` — terminal: deliberately closed without being built
  (superseded, duplicate, admin decision), as opposed to `done`'s
  "actually completed".

`blocked-by` and `blocks` are two directions over the same unified graph
(`buildUnifiedEdges` in `src/state/dep-graph.mjs`: `deps` entries plus, for
a parent item, any still-open child naming it as `parent`):

- `blocks[Y]` counts every still-open `X` such that `X` depends on `Y`
  (an edge `X → Y`) — "how many other things wait on me."
- `blockedBy[X]` lists every still-open `Y` such that `X` depends on `Y` —
  "what am I still waiting on." For a parent item, this correctly lists
  its own still-open children (finishing the last one is what actually
  unblocks the parent), not just its `deps` entries.

A done item (only appears with `--all`) always renders `blocks: 0` and
`blocked-by: -` — a finished item can never block anything or be blocked
by anything.

The table used to also carry a `component` column (`isolated` /
`cluster of N`) — dropped when `status`/`blocked-by` were added, since it
wasn't part of what was actually asked for.
