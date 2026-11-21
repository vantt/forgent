---
id: p-bb89e653
title: resolveHoldTopology ignores its own root argument, always resolves holder from process.cwd() -- cand
status: proposed
priority: P2
area: general
created: 2026-11-21
---

# Why

resolveHoldTopology ignores its own root argument, always resolves holder from process.cwd() -- candidate mechanism for cross-worktree holder collisions

# Done when

resolveHoldTopology(root) resolves holder identity from the passed root, not unconditionally process.cwd() -- fixes every caller of the function, not just reservations release; a regression test proves a call with root != process.cwd() resolves the correct worktree-specific holder

# Notes

Migrated from the legacy backlog table. Original status: proposed.
