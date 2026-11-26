---
id: p-c34xgdfike
title: "A lead cannot delete its plan's merged phase branches, so every plan leaves stale branches behind (git, priority P3; source: lead of plan 261122-0056 via the help queue, 2026-11-26; report `plans/261122-0056-orchestration-skeleton/reports/lead-261126-1653-wave-1-status.md`; same pattern as owner question q-pkvxdfpg3n for plan 261122-2108)"
status: proposed
priority: P3
area: git
created: 2026-11-26
---

# Why

The lead's sandbox cannot delete refs, and no other door deletes a phase branch after its land. Plan 261122-0056 already carries stale merged branches `orchestration-skeleton/p01`, `p03` and `p10`; plan 261122-2108 left 21 branches and needed an owner question to clean them. Each closed plan adds more, and each cleanup becomes an owner question.

# Done when

A landed phase branch is deleted by the land door (or by plan close) when it is fully merged, and a branch with commits not on main is reported instead of deleted; no owner question is needed for merged branches.

# Notes

Raised by the Keeper lead (plan 261122-0056) as out of its plan scope in help event 3ad2caf1cb1c3171; recorded by the supervisor.
