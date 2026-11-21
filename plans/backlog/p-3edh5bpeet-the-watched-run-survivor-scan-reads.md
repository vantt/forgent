---
id: p-3edh5bpeet
title: The watched-run survivor scan reads environments outside the process facts door (Process, priority low)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-14
---

# Why

`environment_marked` (`packages/process/rust/src/containment/linux.rs`) reads `/proc/<pid>/environ` itself to find processes carrying a run's watch token, a second environment reader beside `read_settled` in the facts door, so it misses the exec settle and any later fix of that door. Raised by OPC reviewing the watch-token fix, 2026-11-14.

# Done when

The survivor scan asks the facts door (`scan` with `env_keys = [WATCH_ENV]`) and filters the views by the token; no other module reads `/proc/<pid>/environ`; the containment proofs pass.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
