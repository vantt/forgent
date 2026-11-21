---
id: p-pcfbembv6e
title: "plan-contract-check and the supervisor's admission disagree on a waiting `ready` plan (supervision, priority medium; source: supervisor, 2026-11-20, plan 261119-1730-supervision-powers-doors)"
status: proposed
priority: P2
area: supervision
created: 2026-11-20
---

# Why

`admissible()` (`packages/supervision/rust/src/portfolio.rs`) treats `ready` as a waiting state: a ready plan whose `blockedBy` is not done, or whose footprint overlaps a `running` plan, is simply held until both clear. `activeOverlaps` in `scripts/plan-contract-check.mjs` counts every ready plan as active and reports its overlap with a running plan as an error, so an owner-approved plan that must wait either fails the check or has to sit at `draft`, where nothing ever promotes it.

# Done when

The check and admission share one rule: an overlap is an error only between plans that could run at the same time (two running plans, or a running plan and a ready plan admission would start); a ready plan held back by `blockedBy` or a running overlap passes; an owning test covers the held-back case.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
