---
type: explanation
source_capture_ids: [tsk-4vo]
framework: diataxis
mode: explanation
---

# Why herdr's dashboard lists became real tables, and why "in process" widened

`tsk-4vo` turned herdr's two dashboard panes (the work-items list and the
in-process list) from plain scrolling lists into real column tables with a
fixed header, and along the way widened what "in process" means and gave
it a concrete sort order. Both changes were locked decisions, not
incidental implementation choices — this is the reasoning behind them.

## Why "table with header" needed no custom sticky-header logic

The obvious-sounding request — a header row that stays visible while the
body scrolls — sounds like it needs bespoke rendering logic. It doesn't,
here: ratatui's `Table` widget already keeps its header row structurally
separate from the scrollable body as its own default behavior. Both panes
were rendering via the plain `List` widget before this item (one line per
row: `"[{goal_tier}] {id} — {title}"` for work items, `"{badge}{id} —
{title}"` for in-process) — switching the widget itself to `Table` is what
gets the sticky header, not a layer of logic bolted onto `List`. Naming
the widget explicitly in this item's pinned terms exists precisely to
close off building a custom sticky-header mechanism where the framework
already provides the property for free.

## Why the architecture needed nothing new

The item's own constraint — "build on tsk-3t9's ports/adapters, don't read
straight from underlying fgOS data" — turned out to already be satisfied
before any code changed. `App.refresh_from_fgos`/`refresh_pane_state`
already consumed data exclusively through the `WorkItemSource`/
`PaneRegistry` ports from `tsk-3t9`'s hexagonal-architecture work. And
fgOS's own `fgos list --all --json` output already carries both `status`
and `stage` per item — the two fields the widened in-process view needed
were already present in the data being parsed, just not yet extracted
into `DoingRow`. No new port, no new fgOS query shape — only the existing
row struct needed to carry more of what was already there.

## Why "in process" widened from `doing`-only to include `awaiting-approval`

The prior definition of "in process" (`docs/history/herdr-fgos-tui-plugin/
CONTEXT.md` D4) was `status: doing` only, and D4's own comment on
`DoingRow` said plainly: "always doing by definition, so no separate
status field is carried here." This item deliberately amends that scope
— `awaiting-approval` items join the list too — because an item sitting
in `awaiting-approval` is still genuinely "in flight" from a dashboard
reader's point of view (its work is done but it hasn't landed yet), not a
resolved state like `done`/`wontfix`. This is recorded explicitly as an
*amendment* to D4, not a silent override: D4's other half — "never
herdr's own `agent_status`" — stays locked exactly as it was; only the
fgOS-status filter set widened.

Because the view no longer maps to a single status by construction, the
row now has to carry `status` for real (D1's necessary consequence) —
the "always doing by definition" shortcut D4 relied on stopped being true
the moment the scope widened.

## Why the sort order is a two-tier scheme, not one flat rule

The item's own description gave a mixed status/stage example
("awaiting-approval > executing > doing > clarify/decompose") that reads
like a single flat ordering, but status and stage aren't the same axis —
an item can be `doing` at any stage. The locked resolution keeps them as
two tiers instead of forcing them into one list:

- **Tier A** — every `awaiting-approval` row, first. These are closest to
  actually landing; a dashboard reader scanning top-to-bottom sees "what's
  about to be done" before anything still in motion.
- **Tier B** — every `doing` row, sub-sorted by `stage` in pipeline order:
  `executing` first, `decompose` next, `clarify` last. Within "still being
  worked," the item closer to `compound-learn`/done sorts higher — the
  same "closer to landing sorts first" logic Tier A already applies, just
  reused one level down using `stage` instead of `status` as the ordering
  signal once `status` alone can no longer distinguish rows within Tier B.

The "work items" (not-yet-picked) list needed no equivalent redesign — its
existing triage/impact sort was already correct and is left untouched;
only the "in process" list's scope and ordering changed.

## What was deliberately left to implementation, not decided here

Two concrete choices were named and explicitly deferred rather than
silently decided: the exact `Table` column set per list (e.g. whether
`Goal Tier | ID | Title` is right for the work-items table, or something
else), and whether `awaiting-approval` rows get a visual marker distinct
from `doing` rows. Both are real design decisions, but ones tied to
concrete visual/implementation tradeoffs the planning step is better
positioned to make than a decision record locking scope and sort logic
upfront.
