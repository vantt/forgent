---
id: p-xyod5s5h6r
title: "Replace phase 4 of plan 261119-1615-secretary-capabilities (session-host, priority medium); source: p-mc25x5pfi6, `docs/discussions/work-data-model/DISCUSSION.md` §7 `#task-1615-phase4`"
status: done
priority: P2
area: session-host
created: 2026-11-21
---

# Why

Withdraw the add-rows; `session write` creates one item file; the grants move from `docs/backlog.md` to `plans/backlog*` and from `docs/discussions` to `plans/discussions`.

# Done when

The phase test in `apps/fgos/tests/session_write_publish.rs` passes.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
