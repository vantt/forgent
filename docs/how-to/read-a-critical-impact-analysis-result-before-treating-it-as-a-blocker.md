---
type: how-to
title: How to read a CRITICAL impact-analysis result before treating it as a real blocker
tags: []
timestamp: 2026-08-10T11:10:00.000Z
source_capture_ids: [tsk-2x9]
---
# How to read a CRITICAL impact-analysis result before treating it as a real blocker

Use this when GitNexus's `impact({target, direction: "upstream"})` returns
`risk: CRITICAL` or `HIGH` for a symbol you're about to change, and the
impacted-symbol count looks alarming relative to how small the change
actually is.

## The mistake this guards against

A high impacted-symbol count from `impact` can be a graph-shape artifact
— transitive reach through one shared entrypoint — rather than 9 real
behavioral couplings to your change. Treating the raw count as the risk
verdict, without reading *why* each symbol was flagged, either scares off
a genuinely safe change or (worse) hides which of the flagged symbols
actually matter.

## Steps

1. Run `impact` on the exact symbol you're changing, `direction:
   "upstream"`, and read the full result — not just the `risk` label and
   count:

   ```
   impact({target: "draw_detail_modal", direction: "upstream"})
   ```

2. **Group the impacted symbols by how they actually reach your target.**
   `tsk-2x9`'s real result: `draw_detail_modal` is called by `draw()`
   (depth 1); `draw()` is in turn called by several unrelated
   snapshot-style `#[test]` functions (depth 2) simply because they render
   a full frame. Those tests reach your target transitively through one
   shared render entrypoint — they don't assert anything about it.

3. **Separate "reaches your target" from "asserts on your target."** Of 9
   impacted symbols in the real case, only 2
   (`detail_modal_renders_pick_and_discover_buttons`,
   `discover_button_disabled_when_stage_not_clarify`) actually asserted on
   the function's output — and even those used substring/cell-color
   checks, not an exact full-buffer match. The other 7 were transitive
   reach with zero real coupling to the change.

4. **Check whether your change can actually break the assertions that do
   exist**, not just whether they touch the same render path. Here, the
   button row asserted on sat in a fixed-size layout slot
   (`Constraint::Length(3)`) while the new content only grew a separate
   `Constraint::Min(0)` slot above it — structurally unable to shift or
   truncate the asserted button row.

5. **Still honor `CLAUDE.md`'s MUST-warn rule literally** — a CRITICAL/HIGH
   result gets surfaced to the user plainly, even after this reading
   proves the real risk is low. Report both: the raw verdict, and the
   graph-shape explanation for why it reads lower once traced. Never
   silently downgrade the warning by omitting it.

## Why this matters

`impact`'s upstream count answers "how many symbols transitively reach
this one," not "how many symbols actually depend on this one's
behavior." A shared entrypoint (a `draw()` that every UI test happens to
call) inflates the first number without changing the second. Reading the
actual call shape — depth, and whether each caller genuinely asserts on
your target's output — is what turns a scary-looking CRITICAL count into
an accurately-scoped risk map, without ever skipping the mandatory
warning itself.

## Related

- `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` — the
  `impact` tool's own usage guide.
- `docs/history/herdr-task-detail-modal-fields/plan.md` — the full plan
  this example is drawn from.
