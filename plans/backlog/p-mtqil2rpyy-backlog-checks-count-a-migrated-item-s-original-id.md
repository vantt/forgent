---
id: p-mtqil2rpyy
title: "Backlog checks count a migrated item's Original id for duplicate and reconciliation checks (scripts, priority P2; source: owner confirmation 2026-11-23, reported by forgent-claude-a3)"
status: proposed
priority: P2
area: scripts
created: 2026-11-23
---

# Why

Unlanded work sits in the worktree `work-data-model-p05k`: `scripts/check-backlog-reconciliation.mjs` and `scripts/identity-ids-unique.mjs` add a `parseBacklogItem` fallback and count the line `Original id: X.` of migrated items, so duplicate and reconciliation checks see them. `test/scripts/doc-health.test.mjs` covers it. The patch is `forgent-worktrees/patches/original-id-handling.patch`.

# Done when

The patch is landed on main through the normal route, and `doc-health.test.mjs` is the one owning proof of the behavior.

# Notes

Owner decision 2026-11-23 07:00, relayed by the sending session and confirmed by the owner to the secretary at 07:10.
