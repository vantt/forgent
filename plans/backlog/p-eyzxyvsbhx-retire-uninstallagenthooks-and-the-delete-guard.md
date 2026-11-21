---
id: p-eyzxyvsbhx
title: Retire `uninstallAgentHooks` and the delete-guard prefilter object when the mailbox freeze lifts (packaging, priority low)
status: proposed
priority: P3
area: packaging-distribution
created: 2026-11-21
---

# Why

`src/setup/agent-hooks.mjs` stays only because the frozen mailbox experiment file sets list it; `uninstallAgentHooks` (line 771) has no caller besides `test/setup/agent-hooks.test.mjs`, and the `deleteGuardPrefilter` object is read by that test and the Node delete guard until S1 moves the guard. The Rust packaging layer (`agent_hooks.rs`) owns hook removal.

# Done when

When MAIL lifts the freeze: `uninstallAgentHooks` and its vector test are deleted, the module keeps only what a live caller needs (or goes with the guard's move), the retired-names row of the doors table gains the name, and `architecture.test.mjs` passes.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
