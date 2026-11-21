---
id: p-wzpwaigt6j
title: "`fgos version` spawns Git to read the product HEAD (Packaging, priority low)"
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`packages/distribution/rust/src/lib.rs:191` reads the product HEAD through the Git component, which spawns about 13 `git` and `bwrap` processes inside a repository. It predates the host foundations step. A verb that prints a version needs no repository process.

# Done when

A read-only method on `fgos_git` returns the HEAD from disk; `version` spawns nothing; the process count in the latency report drops to zero for `version`.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
