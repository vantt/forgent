---
id: p-aq4i5usrzn
title: Turn `metrics runs` and `metrics discussions` into presets of `fgos metrics query` (observe, priority low)
status: proposed
priority: P3
area: observe
created: 2026-11-21
---

# Why

Both verbs compute their own groups over the v1 run observations while the same facts are `fgos.run.settled`, `fgos.run.attempt` and `fgos.unit.settled` records the query engine already groups, so two code paths answer one question.

# Done when

Each verb runs a named definition through the query engine and keeps its output contract (or the contract changes with every caller in one change); its own aggregation code is deleted; one test per preset at the definition layer.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
