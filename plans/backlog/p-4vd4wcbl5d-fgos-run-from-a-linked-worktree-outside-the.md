---
id: p-4vd4wcbl5d
title: "`fgos` run from a linked worktree outside the main checkout cannot find its installation (packaging-distribution, priority medium; seen 2026-11-19)"
status: proposed
priority: P2
area: packaging-distribution
created: 2026-11-19
---

# Why

The shim launcher walks up from `$PWD` for `.fgos/installation` (`packages/distribution/rust/src/launcher.sh` line 6, `launcher-cmd.txt` line 60), so in `forgent-worktrees/<wt>` it fails `no .fgos/installation found above <worktree>`, while the main checkout works.

# Done when

The launcher resolves the activation of a linked worktree through its main checkout (git common dir) when none is found above `$PWD`, on Linux, macOS and Windows; proven by a launcher test from a linked worktree outside the main checkout.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
