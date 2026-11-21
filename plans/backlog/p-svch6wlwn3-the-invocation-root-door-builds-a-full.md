---
id: p-svch6wlwn3
title: The invocation root door builds a full `GitDriver` only to read topology (Git, priority low)
status: proposed
priority: P3
area: platform-foundations-half-done-on-branch-rust-verb-migration-program-s23-p01-gitdriver-topology-at-now-reads-the-disk-without-building-a-driver-so-a-root-read-no-longer-runs-the-floor-probe-or-creates-the-state-root-for-the-topology-step-opc-reviewed-2026-11-15-the-lazy-driver-for-the-rest-of-the-door-is-still-open
created: 2026-11-21
---

# Why

`read_repo_facts` (`packages/git/rust/src/invocation_root.rs`, via `GitDriver::topology_at`) goes through `GitDriver::new`, which runs the floor probe (a `bwrap` plus `/bin/true` pair, about 2 ms per native verb) and creates the state root. It needs only the disk-only `resolve_topology`. The same path makes `gate-bypass show` create the state root on first run. Needs `lead:OPC` review: it touches `fgos-git`.

# Done when

`topology_at` reads the disk-only topology without constructing the driver; no process is spawned for a store-less native verb outside a repository; `gate-bypass show` creates nothing; one proof owns it.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
