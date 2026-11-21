---
id: p-o4uzgelsb5
title: Move the case journal onto the record contract (observe, priority low; L10 rest of the ops-metrics plan)
status: proposed
priority: P3
area: observe
created: 2026-11-21
---

# Why

`fgos metrics case` writes its own `observe.case.v1` shape to `.fgos/observe/cases/`, outside the v2 write door, its registry and its health counters, so cases cannot be queried with `fgos metrics query`.

# Done when

Case open and close are declared kinds written through the record door; an explicit, idempotent migration copies the old shards; `metrics case` reads the records; the old writer and contract are deleted once the migration has run (L10).

# Notes

Migrated from the legacy backlog table. Original status: proposed.
