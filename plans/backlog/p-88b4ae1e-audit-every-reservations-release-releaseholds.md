---
id: p-88b4ae1e
title: Audit every reservations release / releaseHolds call site for the same missing-session-filter gap xw
status: proposed
priority: P2
area: general
created: 2026-11-21
---

# Why

Audit every reservations release / releaseHolds call site for the same missing-session-filter gap xwh-3 fixed at one call site

# Done when

Every call site that scopes a cross-worktree hold release derives and passes session (or documents why it legitimately cannot), not just cell -- confirmed via code read across the whole .bee/bin tree, not just handleReservationsRelease

# Notes

Migrated from the legacy backlog table. Original status: proposed.
