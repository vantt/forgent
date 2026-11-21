---
id: p-2ti4sg4kph
title: "Tests and `build:skills` run in a linked worktree silently skip every projection under `.fgos` (tests, git, priority medium; source: shaper report on `p-vxmrnkpykj`, 2026-11-19)"
status: proposed
priority: P2
area: tests
created: 2026-11-19
---

# Why

fgOS-created worktrees set skip-worktree on every tracked `.fgos` file (`packages/git/rust/src/worktree.rs:938`), so `test/setup/instruction-projections.test.mjs` passes falsely there and a regenerated `.fgos/instructions/effective/repo.json` is not seen by git.

# Done when

A projection under `.fgos` that is stale fails the test in a linked worktree and a regenerated one is committable from it; one owning proof. Two directions to choose between: the test reads the index (`git show :path`) or the file moves out of `.fgos`.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
