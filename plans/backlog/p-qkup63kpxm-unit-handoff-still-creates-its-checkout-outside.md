---
id: p-qkup63kpxm
title: Unit handoff still creates its checkout outside the checkout door (execution, priority medium; found by the worktree door plan 2026-11-18)
status: proposed
priority: P2
area: execution
created: 2026-11-18
---

# Why

`src/workflow/unit-handoff.mjs:343` calls `createWorktreeCheckoutSync` from `src/runner/repo-locks.mjs`; it is a debt entry of the doors row "make, provision and remove a checkout". After it moves, `repo-locks.mjs` `addWorktreeSync`/`addWorktree` have no caller: delete them, their multiprocess tests and the local `WORKTREE_ADMIN` copy in `src/runner/worktree.mjs` in the same change (L10). Report `plans/261118-1455-s6a-worktree-door/reports/p02-work-checkout-wrappers.md`.

# Done when

Unit handoff creates through `fgos-checkout`; the debt entry and the dead helpers are gone; `test/architecture.test.mjs` green.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
