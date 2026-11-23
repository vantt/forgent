---
id: p-erwx4t7gl6
title: "The land door for `plans/` does not run the plan check, and the secretary cannot run it (session-host, priority high; source: owner via Miu, 2026-11-20)"
status: done
priority: P1
area: session-host
created: 2026-11-20
---

# Why

The secretary set two plans to `ready` and landed them with `fgos land --paths` without any check, because the plan contract check needs a cargo build and the secretary's sandbox is read-only. A wrong plan status is then found only when a supervisor or lead takes the plan.

# Done when

The land door runs the plan contract check on any landed path under `plans/` before it commits, and refuses with the findings named; an owning test lands a plan with a bad status and shows the door refuses and main is unchanged.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
