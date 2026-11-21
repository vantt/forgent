---
id: p-nqftk5hypy
title: Landing gates run branch code unconfined as the owner (supervision, priority medium; plan 261118-1045 decision PS-19, option b)
status: proposed
priority: P2
area: supervision
created: 2026-11-21
---

# Why

`fgos land` runs `land.gates` with `sh -c` in the candidate worktree outside any sandbox; the trust boundary is review plus gate commands from the trusted main checkout config.

# Done when

Gates run inside a sandbox that can still run Node tests and Cargo, so a branch that was not reviewed cannot act as the owner during a land.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
