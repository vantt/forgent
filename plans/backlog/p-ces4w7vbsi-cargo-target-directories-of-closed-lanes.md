---
id: p-ces4w7vbsi
title: "Cargo target directories of closed lanes outside any worktree have no reaping verb (packaging-distribution, priority medium; source: owner via Miu, 2026-11-20, root disk full)"
status: proposed
priority: P2
area: packaging-distribution
created: 2026-11-20
---

# Why

`/home/vantt/projects/forgent-worktrees` holds six `*-target` directories of closed lanes (about 20G) and the shared `devhost-target` (39G). They are not worktrees, so `fgos worktree remove` does not see them, and deleting them is left to hand-rolled commands, which the repo rules forbid.

# Done when

One verb lists the cargo target directories this project created, names the lane or worktree each belongs to and whether a process uses it, and removes those of closed lanes with `cargo clean --target-dir`; the shared dev host target is trimmed only when no build runs; an owning test covers a closed-lane target removed and a target in use refused.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
