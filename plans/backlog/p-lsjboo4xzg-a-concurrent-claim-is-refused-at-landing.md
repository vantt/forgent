---
id: p-lsjboo4xzg
title: "A concurrent claim is refused at landing (supervisor, priority medium); source: p-mc25x5pfi6, `docs/discussions/work-data-model/DISCUSSION.md` §7 `#task-claim-test`"
status: done
priority: P2
area: supervisor
created: 2026-11-21
---

# Why

A test where two writers set `status: running` and a `lead:` on one plan; the second landing is refused. A cross-machine supervisor lock is not planned unless this test or real multi-machine supervision shows a gap.

# Done when

The new test in the land/supervision suite passes.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
