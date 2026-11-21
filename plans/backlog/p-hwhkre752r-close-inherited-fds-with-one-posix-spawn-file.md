---
id: p-hwhkre752r
title: "Close inherited fds with one `posix_spawn_file_actions_addclosefrom_np` (glibc 2.34 or later) (process, priority low); source: HARDEN plan review `plans/reports/review-261118-1850-harden-plan-review.md` Q2 (owner 2026-11-18: move the Additions to backlog); origin: root plan section \"Additions waiting for the owner\", found 2026-10-24"
status: proposed
priority: P3
area: process
created: 2026-11-18
---

# Why

The close list is built from a `/dev/fd` walk before the spawn; a sibling thread that clears `FD_CLOEXEC` in between can leak an fd (OPC review of `3894ff956`).

# Done when

The fds are closed atomically with no fd walk; one owning proof.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
