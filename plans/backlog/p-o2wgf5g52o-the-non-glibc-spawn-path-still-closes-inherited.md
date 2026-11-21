---
id: p-o2wgf5g52o
title: The non-glibc spawn path still closes inherited descriptors from a parent-side snapshot (Process, priority low)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-14
---

# Why

`spawn_mapped` on glibc Linux now has the child close every non-slot descriptor itself (posix_spawn `addclose` gaps plus `addclosefrom_np`), but the `Command` fallback used on macOS and musl still lists inheritable descriptors in the parent and closes that list in the child, so a descriptor another thread opens without close-on-exec between the listing and exec still reaches the program. Neither target is published today (packaging spec, release targets). Found fixing the spawn_mapped detached-child flake, 2026-11-14 (OPC).

# Done when

macOS spawns with posix_spawn and `POSIX_SPAWN_CLOEXEC_DEFAULT`, keeping slots with `adddup2` and stdio with `addinherit_np`; musl/Linux closes in `pre_exec` with one `syscall(SYS_close_range, above, u32::MAX, 0)` plus the gap closes (kernel 5.9 or later); never a close loop up to RLIMIT_NOFILE; the spawn_mapped proofs pass on both.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
