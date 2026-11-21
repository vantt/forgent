---
id: p-xuazywhh56
title: "A settled discussion whose wake was lost is never planned (supervision, priority high; source: owner via Miu, 2026-11-20, discussion work-data-model)"
status: proposed
priority: P1
area: supervision
created: 2026-11-20
---

# Why

`discussion-settled` for work-data-model woke a supervisor at 2026-11-19 21:51 (outcome `started`), that supervisor stopped after its start ritual, and the event later left the queue without a planner start; the watcher does not raise it again, so the discussion sat unplanned for 8 hours until the supervisor started the planner by hand. Plans have a standing check (`plan-ready-waiting`); settled discussions have none.

# Done when

A settled discussion that no plan's `source` names and no live planner serves is reported on every full tick (a standing condition like `plan-ready-waiting`), and the supervisor starts its planner from that condition, not only from the one-shot event; an owning test settles a discussion, drops its event, and shows the next tick still starts the planner.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
