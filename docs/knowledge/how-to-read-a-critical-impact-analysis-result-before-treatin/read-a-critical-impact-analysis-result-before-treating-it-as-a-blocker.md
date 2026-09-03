---
type: how-to
title: How to read a CRITICAL impact-analysis result before treating it as a real blocker
tags: []
timestamp: 2026-08-10T11:10:00.000Z
source_capture_ids: [tsk-2x9, tsk-5lr]
framework: diataxis
mode: how-to
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

## Alternative: design around the flagged symbol, then re-check what you actually edit

Sometimes the CRITICAL result isn't a graph-shape artifact — it's genuinely
about a high-blast-radius symbol (a shared trait, a widely-implemented
interface) that your change doesn't actually need to touch. In that case,
the fix isn't reading the count more carefully — it's choosing an
implementation shape that routes around the flagged symbol entirely, then
verifying the *real* edit target separately.

`tsk-5lr` (capping herdr-plugin's `fg:workers-N` tabs and adding a fixed
`fg:operation` tab) hit this: the natural-looking fix was adding a "no
room" variant to the `PaneOrchestrator` trait's return type.

> `impact({target: "PaneOrchestrator", direction: "upstream"})` returned
> **CRITICAL** risk — 15 impacted symbols, 4 direct trait implementers, ...
> and 6 UI-interaction tests.
> — real `plan.md`, `docs/history/herdr-operation-tab-layout/plan.md`

Reading the existing error-propagation path showed the signal could reach
the screen with zero trait changes at all: `find_agents_tab_with_room`
already returns `Result<_, LayoutError>`, and every caller up the chain
already propagates that `Err` as-is. Adding one new `LayoutError` variant
inside the function actually being edited was enough — never touching
`PaneOrchestrator`:

> "the CRITICAL blast radius on `PaneOrchestrator` is avoided entirely by
> never touching it. `impact()` on `find_agents_tab_with_room` itself (the
> function this plan actually edits) confirmed **LOW** risk, 5 impacted
> symbols, no direct test breakage at depth 1."
> — real `plan.md`, `docs/history/herdr-operation-tab-layout/plan.md`

The same pattern repeated for the plan's second piece: `impact()` on
`ensure_cockpit_tab` (the existing precedent function being mirrored) came
back LOW, 1 impacted symbol — confirming the new eager-startup function
being added alongside it wasn't stepping into a high-risk surface either.

The general move: when `impact` flags a *related* high-level symbol
(a trait, an interface, a shared type) as CRITICAL, check whether your
plan can avoid that symbol's own surface entirely — then run `impact`
again on the function your diff actually edits to confirm the real risk,
rather than either accepting the trait-level CRITICAL as your change's own
risk or assuming a lower-level edit is automatically safe without
re-checking it.

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
  the first example is drawn from.
- `docs/history/herdr-operation-tab-layout/plan.md` — the full plan the
  "design around the flagged symbol" example is drawn from.
