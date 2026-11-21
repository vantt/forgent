---
id: p-sksopwqyto
title: A seat with no soft budget keeps the whole lane wait on its hard ceiling (run supervisor, priority low; follow-up of the lane-wait fix, main 2dbabb340)
status: proposed
priority: P3
area: run-supervisor
created: 2026-11-21
---

# Why

With `workerSlots.ceiling` armed, the launchers add `laneWaitSec` to the digest-sealed `hardCeiling`; the run supervisor gives back the unused wait only on `softAt`, so a seat with `timeoutMs` 0 (no soft deadline) can run up to 900 s past its hard budget even with a free lane.

# Done when

The hard ceiling counts only the lane wait really spent (an envelope field the gate re-anchors, or a hard budget the supervisor arms after taking the lane), proven for armed and unarmed pools.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
