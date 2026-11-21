---
id: p-w7xxmhttze
title: Move the eval journal onto the record contract (observe, priority low; L10 rest of the ops-metrics plan)
status: proposed
priority: P3
area: observe
created: 2026-11-21
---

# Why

`fgos metrics eval record|list` writes `observe.eval.v1` to `.fgos/observe/evals/` with its own uniqueness rule, outside the v2 write door, so eval scores cannot be joined to runs or plans with `fgos metrics query`.

# Done when

Eval scores are a declared kind written through the record door (deterministic id keeps `evalId` unique); an explicit migration copies the old shards; `metrics eval list` reads the records; the old writer and contract are deleted after the migration (L10).

# Notes

Migrated from the legacy backlog table. Original status: proposed.
