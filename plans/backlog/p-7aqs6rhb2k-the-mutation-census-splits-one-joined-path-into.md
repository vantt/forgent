---
id: p-7aqs6rhb2k
title: The mutation census splits one joined path into fake binaries (Git one-door scan, priority low; owner approved 2026-11-15, routed to OPC)
status: proposed
priority: P3
area: git
created: 2026-11-15
---

# Why

At the `run_bounded` call in `packages/distribution/rust/src/agent_hooks.rs` (the shim spawn, S4 phase 01) the census resolver in `scripts/git-one-door-scan.mjs` records four binaries, `.fgos`, `bin`, `fgos` and `installation`, taken from the components of the shim path join, instead of one configured or shim binary. The census stays green, but its entries no longer name what actually runs.

# Done when

The resolver records one entry for a spawn whose program is a joined path (the shim), with a scan test that seeds such a call; the census regenerates with the four fake entries gone.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
