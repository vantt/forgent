# tsk-dus: `/fgOS:triage` table — add status/blocked-by, drop component

## Feature boundary

`/fgOS:triage` (`plugins/fgOS/skills/triage/SKILL.md`) renders `fgos triage
--json`'s ranked rows as a markdown table. Today's columns: **id, blocks,
goalTier, stage, component, title**. This item changes that table to:
**id, status, stage, blocked-by, blocks, tier, title** — no other behavior
of the `triage` verb (ranking order, `--all` semantics, open-only default)
changes.

The underlying `rankImpact` (`src/state/impact.mjs`) already returns `id`,
`title`, `status`, `blocks`, `stage`, `goalTier`, `componentId`,
`componentSize`, `isIsolated` per row — `status` is already present in the
data and just needs rendering. `blocked-by` is new derived data the verb
does not currently compute; the skill/verb layer must add it in a later
stage. This decision doc only locks what the column means and looks like,
not how it gets computed in code — that is `fgos-coding-planning`'s job next.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `blocked-by` renders a **list of item ids** the row is waiting on (e.g. `tsk-a, tsk-b`), not a count. |
| D2 | `blocked-by` is computed over the **same unified deps+parent graph** `rankImpact` already uses for `blocks` — an item's unmet `deps` entries, plus (for a parent item) any still-open child naming it as `parent`. |
| D3 | The existing **`component`** column (`isolated` / `cluster of N`) is **dropped** from the table. |

## Pinned terms / mechanical changes (not asked, no real ambiguity)

- **`status`**: render `item.status` raw (`todo`/`doing`/`blocked`/
  `awaiting-human`/`awaiting-approval`/`done`), no transformation — the
  field already exists on every row today, just wasn't rendered.
- **`tier`**: pure rename of the existing `goalTier` column header. Same
  values and rendering as today (`mvp`/`milestone`/`-` for absent) — no
  behavior change, just the displayed column label.

## Final column order

`id, status, stage, blocked-by, blocks, tier, title` — matches the item's
title verbatim, 7 columns, in that order.

## Scout evidence cited

- `plugins/fgOS/skills/triage/SKILL.md` (current table spec, step 3):
  today's 6 columns and their render rules.
- `src/state/impact.mjs` (`rankImpact`): row shape already returned by the
  verb; comment block explains why `blocks` counts the unified deps+parent
  graph rather than deps alone (a root item with only open children used
  to rank as zero impact before that fix).
- `src/state/graph-metrics.mjs:289-302` (`staleBlocked`): existing prior
  art for a `blockedBy` field — an array of unmet dep ids, deps-only scope.
  This item's D2 deliberately widens that prior art's scope to match
  `blocks`'s unified graph, since a parent item's real blocker (its open
  children) would otherwise never show up in its own `blocked-by` cell.
- `src/state/dep-graph.mjs:160-174` (`buildUnifiedEdges`): edge direction
  convention (`{from, to}` means "from depends on to") that D2's
  unified-graph computation must reuse rather than re-deriving.

## Canonical references

- `plugins/fgOS/skills/triage/SKILL.md` — the skill this item modifies.
- `src/state/impact.mjs` — the verb-side ranking this item's new column
  depends on.

## Outstanding questions deferred to planning

None outside implementation. `fgos-coding-planning` decides: whether
`blocked-by` is computed in `rankImpact` itself (extra fields on each row)
or derived client-side in the skill from raw `deps`/`parent` fields
(which the verb does not currently expose per-row either way), how deep a
`fgw/tsk-dus` scope this needs, and what the verify command looks like.
