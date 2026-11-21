---
id: p-asahmbn2zs
title: Driving measure 4 (scope fidelity) has no source (observe, coding driving; priority low; the owner chose one row per unmeasured driving measure)
status: proposed
priority: P3
area: observe
created: 2026-11-21
---

# Why

The definition `domains/coding/observe/definitions/m4-scope-fidelity.query.json` requires `fgos.plan.scope.checked`, which no producer emits, so the measure answers `unmeasured` with that reason. Nothing records whether a finished plan changed only what its footprint and outcome named.

# Done when

A producer owned by the coding driving layer (where a plan's footprint is checked at landing) declares `fgos.plan.scope.checked` in its own `observe/kinds` file and writes it through the Observe write door, ref'd to the plan and phase; the m4 definition then answers rows on a fixture plan in its owning test; no Observe source file changes.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
