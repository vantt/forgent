---
id: p-fjjefjpk22
title: "`dispatch explain` reads the family without a command, while `bind` uses the first cli invocation's command, so an entry with no `providerModel` reads as `claude` in explain (runner, priority low; source: `plans/261115-2328-execution-read-door/reports/phase-261117-1351-erd-p01-executor-model.md`, backlog candidate 3)"
status: proposed
priority: P3
area: runner
created: 2026-11-21
---

# Why

`dispatch explain` reads the family without a command, while `bind` uses the first cli invocation's command, so an entry with no `providerModel` reads as `claude` in explain (runner, priority low; source: `plans/261115-2328-execution-read-door/reports/phase-261117-1351-erd-p01-executor-model.md`, backlog candidate 3)

# Done when

`dispatch explain` and `bind` read the family through the same function with the same command; an entry with no `providerModel` shows the same family in both.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
