---
id: p-vcoaluq6ix
title: The Git one-door scan hashes every rendered skill file, so each skill edit churns the census twice
status: proposed
priority: P2
area: git
created: 2026-11-21
---

# Why

66 of the 133 skill hashes in `packages/git/contracts/mutation-census.v1.json` are renders under `.agents/skills/**` of sources the scan already reads; every skill text edit regenerates them and every rebase conflicts on them (the landing of the skill render needed the take-theirs-and-regenerate loop on each commit). OPC owns the scan.

# Done when

The scan skips the generated `.agents/skills/**` tree (the sources under `core/skills` and `domains/*/skills` stay scanned); `node scripts/git-one-door-scan.mjs --root .` still reports 0 undeclared; the census hash count for skills halves.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
