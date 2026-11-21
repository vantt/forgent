---
id: p-ojh4dcf6f2
title: The Git Inspect port reports no skip-worktree flag, so an effective-instruction-set write onto a skip-worktree path cannot refuse
status: proposed
priority: P2
area: git
created: 2026-11-21
---

# Why

`trackedPaths` is plain `ls-files --cached`; `src/setup/instruction-projections.mjs` therefore writes `.fgos/instructions/effective/repo.json` (skip-worktree in every linked worktree) without knowing. `fgos worktree remove` now accepts the byte-identical write-back, so nothing strands, but a differing write is invisible at the writer. No port verb was added (a new capability, outside hardening). OPC decides whether the port should carry the flag.

# Done when

The Inspect port lists the skip-worktree flag per tracked path, and the projection writer refuses a skip-worktree target whose bytes differ from the index; or OPC records that the remove-side check is enough and closes this.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
