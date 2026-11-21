---
id: p-3xlj2ihxxu
title: Keep a plan's measures after its run directories are pruned (observe, coding driving; priority low; linked to p-tslryr3buq)
status: proposed
priority: P3
area: observe
created: 2026-11-21
---

# Why

Run, unit and verify records are projected live from `.fgos/assignments`; once retention removes a finished plan's unit runs, its tokens, attempts and phase times disappear from `fgos metrics query`.

# Done when

When a plan reaches `done`, its measures are written once as records (deterministic ids) through the write door, ref'd to the plan, so the driving definitions still answer after pruning; a test removes the run directories of a fixture plan and gets the same answers.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
