---
id: p-lkzx3oygy4
title: "Integration phase and dormant switch in the plan contract (supervisor, priority medium; source: supervisor-review §7 T5, §6 steps 8-10)"
status: proposed
priority: P2
area: supervisor
created: 2026-11-21
---

# Why

`core/skills/_shared/plan-contract.md` requires an integration phase in which a dormant switch is removed, and `plan-contract-check` checks it; the close check in code refuses a plan whose switch is still present or whose dormant code is unfinished. Independent of the others.

# Done when

`plan-contract-check` tests plus a close-check test.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
