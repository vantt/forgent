---
id: p-yp3akvwsvx
title: "A Git-crate test fixture is not hermetic: the `invocation_root` lib tests fail while any ancestor of `TMPDIR` holds a `.fgos` (Git, priority low; needs OPC review, routed to OPC)"
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`/tmp/.fgos` or `/home/vantt/.fgos` left by other runs makes three `invocation_root` lib tests fail; they pass under `/dev/shm`.

# Done when

The fixtures root their temp trees in a directory with a guard (or set the pinned root), so the result does not depend on what an ancestor of `TMPDIR` holds.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
