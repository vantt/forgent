---
type: explanation
title: Tiny multi-file edits stay one item when split overhead exceeds the work
tags: [decompose, planning, footprint, lifecycle-cost]
source_capture_ids: [tsk-3j1, tsk-1xn]
authoritative_for: keeping a multi-file small-edit item unsplit because each child's worktree/merge-gate lifecycle overhead would exceed the actual edit work
---
# Tiny multi-file edits stay one item when split overhead exceeds the work

`docs/explanation/why-decompose-checks-footprint-overlap-before-creating-children.md`
already covers one reason a `planning`-stage session declines to split an
item into children: two or more proposed children would declare the same
file as footprint, a collision `footprintOverlapAmong` exists to prevent.

`tsk-3j1` — a docs task touching four small, *distinct* spec files
(`reading-map.md`, `system-overview.md`, `enduser-docs-authoring.md`,
`enduser-docs-index.md`), each needing only a handful of line-anchored
fixes to match the current stage vocabulary — hit the same "don't split"
conclusion for a different reason. There is no footprint collision here:
each file is a separate footprint, so `footprintOverlapAmong` would not
have flagged anything. The reason not to split was cost, not collision:

> "plan-tsk-3j1.md Shape section calls this one honest piece: four small
> spec files, one shared vocabulary axis, 12 line-anchored positions.
> Splitting further would create children editing two lines each, with
> lifecycle cost exceeding the work."
> — real `work.decision` capture, id `tsk-3j1`

## The distinction this draws

A `planning`-stage session weighing whether to split an item is really
weighing two independent questions, not one:

1. **Would the proposed children collide?** (footprint overlap — the
   automatic gate, and the thing a live session reasons about explicitly
   when it self-supplies a pass-through verdict)
2. **Is each proposed child's own lifecycle overhead — its own worktree,
   its own merge gate, its own review pass — proportionate to what that
   child would actually change?**

Question 1 has a mechanical answer (`footprintOverlapAmong`). Question 2
does not: it is a judgment call about whether per-child process cost is
worth paying for a handful of line edits, made the same way a person
reviewing the same split would reason about it — twelve line-anchored
positions across four files sharing one vocabulary axis reads as one
coherent unit of work, not four (or twelve) separate units each needing
its own full item lifecycle.

## A second instance, same axis

`tsk-1xn` — a sibling under the same milestone, touching three disjoint
Markdown files (a tutorial, `distribution-vision.md`, `backlog.md`) that
share one vocabulary map — reached the identical conclusion by the
identical reasoning:

> "plan-tsk-1xn.md step 4: one honest piece — three Markdown files,
> disjoint from every sibling's footprint, sharing one vocabulary map;
> splitting further would give three items too small to park
> independently and would not shrink any risk."
> — real `work.decision` capture, id `tsk-1xn`

"Too small to park independently" and "would not shrink any risk" name
the same cost/value judgment `tsk-3j1` reached — not a coincidence: both
items are children of the same `tsk-5eq` spec-docs-lifecycle-realignment
milestone, splitting the same underlying vocabulary-map work across
disjoint file sets, so the same "one shared axis, several small
positions" shape recurs by design, not by chance.

## Related

- `docs/explanation/why-decompose-checks-footprint-overlap-before-creating-children.md`
  — the footprint-collision half of "why not split"
- `docs/history/spec-docs-lifecycle-realignment/plan.md` — the shared
  vocabulary table and per-file plan this item and its siblings
  (`tsk-1uw`, `tsk-2t5`, `tsk-1xn`) executed against
