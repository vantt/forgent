---
authoritative_for: fgOS submit skill's deps candidate confirm ambiguous direction, silent deadlock from wrong-direction deps, blocked-by vs superseded-by confirm choice, self-caught during tsk-3me creation
---

# `deps` only ever means "blocked by" — but the submit skill's own confirm step never said so

`tsk-2tmk` closed a real ambiguity in `/fgOS:submit`'s own dependency-
candidate confirmation step: it only ever asked "use this item as a
dependency?" — never which *direction* the relationship actually runs. A
new item can genuinely be **blocked by** an old item (`deps: [old-id]`,
correct when the new item truly can't finish until the old one does), or
the old item can merely be a **reference the new item will supersede** —
a relationship that should never become a `deps` entry in either
direction.

## Caught live, self-inflicted, before it caused real harm

The item's own description is a first-person account: while creating
`tsk-3me` (a redesign consolidating content from `tsk-1am` and `tsk-13r`),
`deps: [tsk-1am, tsk-13r]` was attached — but those two items were
actually **stuck**, waiting on `tsk-3me` itself to resolve them. Deps in
that direction meant `tsk-3me` could never become "ready" until two
items that could not finish without `tsk-3me` finished first — a silent
deadlock, with no error raised anywhere, since the engine doesn't
validate whether a `deps` direction is logically sound; it trusts the
caller. Caught and self-corrected before it caused a real stuck state,
but noted directly: easy to miss if not watched for closely, since
nothing in the system would have surfaced it.

## What shipped — a direction choice, not just a yes/no

`/fgOS:submit`'s Step 2 now runs two parallel heuristics against a
candidate match: the existing **dependency heuristic** (a clear,
textually-grounded match — same subsystem/file/feature/bug named in
both), and a new **consolidation heuristic** (keywords like `redesign`,
`consolidate`, `gộp`, `gom`, `thay-thế` in the new submission's own
text). Whichever matches produces a **direction hint** —
`blocked-by`, `superseded-by`, or no hint if neither is confident.

Step 3's confirmation now offers four choices instead of three:
**confirm-as-blocked-by** (attaches the candidate as a real `deps`
entry — the new item cannot finish until the candidate does),
**mark-as-superseded-by** (marks the *existing* candidate item with
`supersededBy` pointing at the new item once created — the new item
consolidates or replaces the candidate; never blocks the new item),
**edit** (a different id/direction the user provides explicitly), or
**reject** (no relationship at all). A produced direction hint
pre-selects the shown default; no hint means asking directly with no
default. The hard requirement carries over unchanged: never auto-attach
a dependency or auto-mark a superseded item without this explicit
per-turn response.

## Scope held to the skill layer

Verified by the item's own `verify` command asserting no `src/` files
changed — this is a documentation/skill-instruction fix only, adding the
`mark-as-superseded-by` vocabulary and wiring to `submit/SKILL.md`'s
steps 2/3/5/6, not an engine-level `deps`-direction validator. The engine
itself still trusts the caller; this closes the ambiguity at the point
where a caller (human or agent) decides the direction, not by adding a
new runtime check.
