---
id: p-w26qcthj37
title: "The Git one-door census scan cannot run inside the seat sandbox, because the Git floor probe cannot write its verdict (git, priority medium; source: `plans/261117-1430-portfolio-driving-draft/reports/trial-261117-1705-solo-driving-trial.md`)"
status: proposed
priority: P2
area: git
created: 2026-11-17
---

# Why

On 2026-11-17 the solo seat of the pathfold integration phase could run neither `node scripts/git-one-door-scan.mjs --write-census` nor the seed check: the floor probe writes a machine-wide verdict (see `p-ez232qhrbo`), which the sandbox forbids. HARDEN ran both outside. Routed to the Git lane (`lead:OPC`), which owns `fgos-git` and the floor probe.

# Done when

The census scan and the seed check run to an end inside a seat sandbox; a live seat run or a test proves it.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
