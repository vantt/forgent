---
id: p-kum6n4k3wf
title: The git floor probe needs a writable state root and its key flips between callers (git, priority medium; live run of plan 261118-1045, 2026-11-19)
status: proposed
priority: P2
area: git
created: 2026-11-19
---

# Why

The driver caches its floor verdict in `<state root>/git-floor-verdict.json` keyed on exact PATH, HOME, git binary and config stamps (`packages/git/rust/src/driver.rs` ~:1471-1539); a confined head (scratch HOME, read-only state root) misses the key and `probe_floor` fails `EROFS` creating its temp dir, so every event-store open fails inside a sandbox; unconfined callers with different PATHs rewrite the record back and forth.

# Done when

The probe runs in a writable temp dir, the key holds only what changes git's floor (binary, version, config stamps), and a confined process with a read-only state root opens the event store; proven by a driver test.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
