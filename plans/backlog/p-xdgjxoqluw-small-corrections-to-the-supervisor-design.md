---
id: p-xdgjxoqluw
title: "Small corrections to the supervisor design (supervisor, priority medium; source: `docs/discussions/supervisor-review/DISCUSSION.md` §7 T0)"
status: proposed
priority: P2
area: supervisor
created: 2026-11-21
---

# Why

F1: the lead skill row `land-conflict-aborted` says rebase, it must say merge the trunk into the branch. F2: `core/agents/supervisor.yaml` still describes the per-plan role. F3: the spec header and the plan status are stale. F4: an `event-store-end-trigger` fault is logged when the verb succeeds. G7: enabling the watcher must not wake the supervisor. Can go at any time.

# Done when

F1-F4 and G7 are fixed; `npm test` passes for the touched skills (render check) plus the owning test for F4 and G7.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
