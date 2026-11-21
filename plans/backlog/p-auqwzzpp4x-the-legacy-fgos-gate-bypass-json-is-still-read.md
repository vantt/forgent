---
id: p-auqwzzpp4x
title: The legacy `.fgos/gate-bypass.json` is still read when the effective `gateBypass.level` comes from the standard alone
status: proposed
priority: P2
area: config
created: 2026-11-21
---

# Why

(`src/state/gate-bypass.mjs`, and the Rust work-state reader). The cutover kept it so a repository holding only that file keeps its level.

# Done when

Every repository holding only that file is migrated into config, the fallback is deleted in Node and Rust, and a test proves the config value alone decides.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
