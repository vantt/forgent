---
id: p-radcgp44uv
title: Driving measure 5 (plan defects found by validation) has no source (observe, coding driving; priority low; the owner chose one row per unmeasured driving measure)
status: proposed
priority: P3
area: observe
created: 2026-11-21
---

# Why

The definition `m5-plan-defects.query.json` requires `fgos.plan.defect.found`, which no producer emits, so the measure answers `unmeasured`. The plan validation step finds defects but leaves no record of them.

# Done when

The plan validation step declares `fgos.plan.defect.found` where it is used and writes one record per defect through the write door, ref'd to the plan; the m5 definition answers rows on a fixture plan; no Observe source file changes.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
