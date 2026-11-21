---
id: p-msgissf743
title: Tests leave their temp dirs in /tmp (tests, priority medium)
status: proposed
priority: P2
area: tests
created: 2026-11-19
---

# Why

On 2026-11-19 /tmp (tmpfs, 1M inodes) reached 95% inodes; cargo tests failed with ENOSPC. 48,013 top-level `/tmp/fgos-*` dirs older than 24 h (about 450k inodes) were test leftovers, most numerous prefixes `fgos-fh`, `fgos-gateway-control`, `fgos-identity-signing`, `fgos-identity-shared`, `fgos-gt`, `fgos-identity-directory`, `fgos-ingest-*`; the supervisor removed them (back to 52%).

# Done when

Each leaking test (Rust tempdir not dropped, Node fixture without cleanup, or a killed run) is found by prefix and fixed to remove its dir on every exit path; the test launcher reports leftover `fgos-*` dirs after a run, as it already does for worktree leaks.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
