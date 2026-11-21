---
id: p-zs23zde4mh
title: "Remove the three reverse dependencies of T0 to T2 and gather the 35 `.fgos` lookups behind the invocation-root door (HARDEN foundation, priority high; source: HARDEN plan review Q3, owner 2026-11-18 chose a and set priority high)"
status: done
priority: P1
area: architecture
created: 2026-11-18
---

# Why

The architecture manifest keeps three `tierExceptions` from T0, T1 and T2 up to Work or T2, and the single-door criterion for `.fgos` lookup is unmet (35 files after recount; the review counted 36 on an older base). Their reasons all say they move down with the Work batch, which is deferred.

# Done when

One small plan for the foundation, using the invocation-root door and leaf that already exist, no new mechanism: the three exceptions are deleted, the `.fgos` lookups go through the one door, the architecture test and the manifest agree; no Work layer change.

# Notes

Migrated from the legacy backlog table. Original status: done (plan `plans/261118-2048-foundation-reverse-deps-and-fgos-root-door/plan.md`, report `plans/261118-2048-foundation-reverse-deps-and-fgos-root-door/reports/integration.md`).
