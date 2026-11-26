---
id: p-os3gedpq4x
title: "Plans that share a path block each other from starting, even when the shared file is written only in a late phase or is generated; decide how shared paths should be handled (plan contract, priority high; source: owner via Miu, 2026-11-26 22:5x, restated 23:0x)"
status: proposed
priority: P1
area: plan-contract
created: 2026-11-26
---

# Why

The plan contract refuses `ready` while another `ready` or `running` plan shares a path, comparing whole-plan
footprints. So a plan holds every path of every phase from the day it starts until it is done, and a file written once
at the end, such as `CHANGELOG.md`, blocks everyone from the first day.

The owner's view, to be tested in the discussion and not yet settled: every plan works on its own branch and worktree, so
two plans touching the same file cannot step on each other while they work. The cost of a shared path shows up at
land, as a merge or rebase, and not at admission. The only real reason to wait is inside one plan: two phases of the
same plan that share a path must not run in parallel.

Prior art (read before design, not yet reasoned to the end): the footprint overlap check began in work-state as
advice between work items before dispatch, explicitly non-blocking (`footprintConflicts` and `footprintOverlap`,
`src/state/graph-metrics.mjs`; see `docs/distillery/deep-dives/parallel-decomposition-and-merge.md`). The plan contract
(commit `ab8ebdfd54`, `scripts/plan-contract-check.mjs`) made it a hard refusal at `ready`. This row asks whether
that hardening was intended, and what it was meant to prevent.

Seen on 2026-11-26 (evidence, not the only case):

- Plan `261126-0853-session-type-submits-enter` could not go `ready`. Its phase 1 touches only `pane_io.rs` and
  `typed_wake.rs`, which no other plan holds. It was blocked by the Keeper plan `261122-0056` (running) and by
  `261125-2041-gather-fgos-rules-to-one-owner` (running, worked on the other machine) through
  `apps/fgos/tests/supervision_verbs.rs`, `core/skills/**`, the generated skill surfaces and `CHANGELOG.md`, all of
  which only a later phase writes.
- The owner took `CHANGELOG.md` and `command-manifest.json` out of the Keeper footprint and back by hand, twice in
  one day, to let other plans run. Each change needed an owner order and a hand edit of the frontmatter and the phase
  rows, because the door that widens or narrows a running plan does not exist (`p-lfsc4czpgh`).

# Options to decide in the discussion

- **P1, drop the cross-plan block entirely** (the owner's view): plans run on their own branches, the conflict is met
  at land, only phases of one plan that share a path wait for each other.
- **P2, drop the block for generated and append-only files, and make it advice for hand-written source**, with each
  phase refreshing its base from main when it starts, so a conflict shows at the start of a phase and not at land.
  Miu leans to P2, on reasoning only.
- Measure first: how often and at what cost did a land conflict on hand-written source files cost rework in the
  land history. Without that number the choice is a guess.
- Read the earlier converged discussion `ds-izwfo6f267-parallel-decomposition-footprint-avoidance` (open, from
  2026-08-05) and `ds-mzyircswox-widen-a-running-plan-footprint` (paused) first, and say what is reused.

# Done when

The option chosen in the discussion fixes the exact wording.

- Two plans whose footprints overlap are both admitted and run on their own branches. The overlap is reported to the
  supervisor as advice (which plan lands first, which will meet the conflict), never as a refusal of `ready`.
- Phases of one plan that share a path never run in parallel: the plan contract checks that they sit in different
  waves or depend on each other, and the supervisor does not start them together.
- The conflict is met once, at land. Files that are generated or written by many plans (`CHANGELOG.md`, the command
  manifest, the mutation census, the generated skill surfaces) are regenerated or merged by the land door, not guarded
  by blocking plans from starting. Related: `p-avjhx3gxas`.
- The footprint still bounds what a unit may write (`write-outside-footprint`), so widening it for a running plan
  remains a separate matter (`p-lfsc4czpgh`). This row does not depend on that door.
- One test shows two plans that share a path are both `ready`, and that two phases of one plan that share a path in
  the same wave are refused.

# Open risk to check in the discussion

Whether the land door resolves a conflict in the hot generated files reliably today. If it does not, that gap is the
real cost of dropping the admission block, and it must be closed in the same change (L10), not left for later.

# Notes

Related: `p-lfsc4czpgh` (widening a running plan's footprint has no door; paused by the owner on 2026-11-26) and
`p-o4iniqvitl` (backlog index generated). The owner wants the stability and self-operation items to move first
without waiting for `p-lfsc4czpgh`; dropping the cross-plan block removes most of the cases that needed that door.
Needs a shaper discussion before a planner, because it changes the plan contract and the admission rule of the
supervisor.
