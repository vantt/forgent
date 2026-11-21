---
id: p-io2gcpqudb
title: Read-only Git calls can recreate a removed state root (Git, priority medium; needs OPC review, routed to OPC)
status: proposed
priority: P2
area: platform-foundations
created: 2026-11-21
---

# Why

`GitDriver::open_at` (`packages/git/rust/src/driver.rs:344`) and `trusted_root_at` (`:355`) and `incidents::open` (`packages/git/rust/src/incidents.rs`, used by `fgos git status`, found in review of the S2 git phase) still call `GitDriver::new` on `state_root()`, which creates an absent root, as does the host doctor (`apps/fgos/src/wiring/doctor/git.rs:104` and `event_store.rs:76`, through `GitDriver::new`). Phase 00 of the S2/S3 plan saw `config show --dir` and `identity project --dir` bring a removed state root back (`friction list --dir` did not). The root door itself no longer does (it reads topology from disk), so these are the remaining creators.

# Done when

A read-only call (`config show`, `identity project`, any read verb) never creates a removed state root: those reads use the disk-only topology or a driver constructor that refuses an absent root, with a test per caller that removes the root first and checks it stays absent.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
