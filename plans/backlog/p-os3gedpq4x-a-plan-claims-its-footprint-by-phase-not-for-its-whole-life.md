---
id: p-os3gedpq4x
title: A plan claims its footprint by phase, not for its whole life, so plans can interleave and a last-phase file such as CHANGELOG.md blocks nobody until that phase runs (plan contract, priority high; source: owner via Miu, 2026-11-26 22:5x)
status: proposed
priority: P1
area: plan-contract
created: 2026-11-26
---

# Why

The plan contract refuses `ready` while another `ready` or `running` plan shares a path, and it compares whole-plan
footprints. A plan therefore holds every path of every phase from the day it starts until it is done. The owner's
words: the footprint is locked for the whole plan, but it should be locked by stage, so that plans interleave and
several plans can be freed early. `CHANGELOG.md` is written last, in the final phase, yet it blocks everyone from
the first day.

Seen on 2026-11-26 (evidence, not the only case):

- Plan `261126-0853-session-type-submits-enter` could not go `ready`. Its phase 1 touches only `pane_io.rs` and
  `typed_wake.rs`, which no other plan holds. It was blocked by the Keeper plan `261122-0056` (running) and by
  `261125-2041-gather-fgos-rules-to-one-owner` (running, lead ended, paused by the owner) through
  `apps/fgos/tests/supervision_verbs.rs`, `core/skills/**`, the generated skill surfaces and `CHANGELOG.md`, all of
  which only a later phase writes.
- The owner took `CHANGELOG.md` and `command-manifest.json` out of the Keeper footprint and back by hand, twice in
  one day, to let other plans run. Each change needed an owner order and a hand edit of the frontmatter and the phase
  rows, because the door that widens or narrows a running plan does not exist (`p-lfsc4czpgh`).

# Done when

- The overlap check compares the paths of the phases that are `ready` or `running`, not the whole-plan footprint. A
  path that only a later phase writes does not block anyone until that phase becomes ready.
- A phase holds its paths from `ready` until `done` and releases them then, so two plans whose phases touch the same
  file in different waves can run in turn without an owner order.
- Files written once at the end (`CHANGELOG.md`, generated skill surfaces, specs) are claimed only by the phase that
  writes them.
- The plan footprint is derived from its phases, or checked against them, so the frontmatter list and the phase rows
  cannot drift apart. This does not depend on `p-lfsc4czpgh`: it must work without the widening door.
- One test shows two plans sharing a path in different phases are both admitted, and that the second waits only when
  its phase reaches that path while the first still holds it.

# Notes

Related: `p-lfsc4czpgh` (widening a running plan's footprint has no door; paused by the owner on 2026-11-26) and
`p-o4iniqvitl` (backlog index generated). This row is the reason the owner wants the stability and self-operation
items to move first without waiting for `p-lfsc4czpgh`: phase-level claims remove most of the cases that needed that
door. Needs a shaper discussion before a planner, because it changes the plan contract and the admission rule of the
supervisor.
