---
id: p-bck5j3zmu5
title: "plan-contract-check computes an optional phase wave from the phase dependencies instead of requiring a written wave (tooling; source: supervisor sweep of old worktrees, 2026-11-25)"
status: proposed
priority: P3
area: tooling
created: 2026-11-25
---

# Why

The phase table of a plan makes the `wave` column mandatory, and `scripts/plan-contract-check.mjs` refuses any phase whose wave is not an integer from 1. A planner has to work out the waves by hand, and a wrong hand count is only caught as a dependency error.

Unlanded work exists: commit `66c320a1d` (`feat(plans): compute optional phase waves in contract checks`, 2026-11-23) on the local branch `orchestration-skeleton/p12`, checked out in the worktree `forgent-worktrees/261122-0056-orchestration-skeleton-p12`. It lets a phase leave `wave` empty, computes the wave from `Depends on`, and reports a dependency cycle. It touches `scripts/plan-contract-check.mjs`, `core/skills/_shared/plan-contract.md` and `test/scripts/plan-contract-check.test.mjs`. The branch is not on `origin`, and main has no equivalent: its checker still treats the wave as required.

# Done when

A phase with an empty `wave` passes the contract check and gets a wave computed from its dependencies; a written wave is left untouched; a dependency cycle is reported by name. The existing test file owns the proof. The shared plan-contract text says the column is optional.

# Notes

Found while sweeping old worktrees. The commit has been unmerged for two days and main's checker has changed since (same-wave overlap rule, `dfb8cdb85`), so rebase the commit on main before reviewing it. Keep the worktree until this item is picked up or dropped.
