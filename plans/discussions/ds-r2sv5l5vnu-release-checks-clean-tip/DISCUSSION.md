---
id: ds-r2sv5l5vnu
title: "Release checks run on a clean checkout of the tip they release"
status: settled
source:
  - p-sqppgb2jhq
created: 2026-11-27
---

discussion: settled

# Release checks run on a clean checkout of the tip they release

## Hand-off to the planner

- **Outcome:**
  - `fgos release run` makes a detached worktree at the trunk tip it read, through the worktree door.
  - It runs every recipe `check` with that worktree as its working directory.
  - It removes the worktree when the checks end, whether they pass or fail.
  - `apply`, `probe` and `rollback` keep running where they run today.
  - The release then proves exactly the commit it records as released.
- **Where:**
  - The release door, `packages/session-host/rust/src/release.rs`: the loop over `recipe.checks` and its `ports.run`.
  - Its ports: one port that makes and removes the check checkout.
  - `packages/session-host/rust/tests/release.rs`: one owning test.
  - The release section of the owning spec.
  - Reuse the worktree door (`fgos worktree create --detach --base <tip>`, then `fgos worktree remove --delivered-to <tip> --discard-ignored`). Add nothing beside it (L10).
- **Decided (owner, 2026-11-27, chat to lead:SUPERVISOR):**
  - This is a product mechanism, not a local workaround.
  - Priority P0.
  - It runs first among the release-path fixes.
- **Evidence:**
  - On 2026-11-27, four release runs failed `checks-failed` on causes that live only in the main checkout (backlog p-sqppgb2jhq).
  - The same suite, run in a clean worktree of the same commit, passed. The only failures there came from environment files that a fresh worktree lacks: `.fgos/project.json` and the skip-worktree effective `rules.json`.
- **For the planner to settle inside the frame:**
  - How the check checkout gets the files that a fresh worktree lacks today (`.fgos/project.json` and the skip-worktree effective rules), so the start-context tests pass there.
  - Where the checkout lives: under the worktree root, and removed afterwards.
  - That a failed removal is reported, not fatal.
- **Non-goals:**
  - Changing what the recipe runs.
  - Changing apply, probe or rollback.
  - The `/tmp` inode limit. It gets its own backlog row if it recurs.
