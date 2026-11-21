---
id: p-vtalldv5zn
title: Git door call `walk_changes` for plan history (git, observe; priority medium)
status: done
priority: P2
area: observe
created: 2026-11-21
---

# Why

The plan sources (`apps/fgos/src/wiring/observe_sources/plan_history.rs`) walk every commit and diff `plan.md` front matter through the Git component door; a query over `fgos.plan.status` or `fgos.plan.activity` takes 30-80 s on this repository, longer than the watcher's 60 s active interval, so definitions over them keep short windows.

# Done when

The Git component offers one door call that returns the commits changing a path set since a point (`walk_changes`), the plan sources use it, and a `fgos.plan.*` query over the default attention window finishes in well under the watcher interval on this repository, measured and recorded in the row.

# Notes

Migrated from the legacy backlog table. Original status: done (sv/p14a: walk_changes; plan.status query 21.8 s -> 5.1 s on this repository, records equal).
