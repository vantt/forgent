---
id: p-wo7rsefi7n
title: The Git WAL has its own looser copy of the Durable File temp-name rule (one door, priority low)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`packages/git/rust/src/wal.rs:2766` `is_durable_temporary` matches only the `.durable-file-` prefix and `.tmp` suffix, where the crate's rule is exact. Deleting matching files is safe (the snapshot GC at :1421 is gated on age, references and digest names); the looser match only tolerates a stray name the exact rule would report as unknown evidence. Tightening turns a tolerated stray into a hard corrupt verdict, which is a WAL recovery behaviour change and needs the Git reviewer (OPC) when picked up.

# Done when

`fgos_durable_file` exports its temp-name predicate, the WAL uses it, and the changed recovery verdict is reviewed and named in the CHANGELOG.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
