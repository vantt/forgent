---
id: p-6aljlkph2p
title: Move snapshots onto the record contract (observe, priority low; L10 rest of the ops-metrics plan)
status: proposed
priority: P3
area: observe
created: 2026-11-21
---

# Why

`fgos metrics snapshot` writes `observe.snapshot.v1` to `.fgos/observe/snapshots/`, outside the v2 write door and its health counters.

# Done when

Snapshots are a declared kind written through the record door; an explicit migration copies the old shards; readers use the records; the old writer and contract are deleted after the migration (L10).

# Notes

Migrated from the legacy backlog table. Original status: proposed.
