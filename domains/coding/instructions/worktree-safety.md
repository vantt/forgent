---
id: coding-worktree-safety
kind: boundary
owner: coding
scope: domain
mode: append
appliesTo: ["*"]
specificity: 30
title: Coding Worktree Safety Boundaries
description: Worktree and git safety boundaries for coding-domain agents
---

# Coding Worktree Safety Boundaries

1. Never run a raw `git reset --hard` on the main checkout without a full `git status` first: the main checkout is the one working tree every session resolves against, and a reset silently discards another session's uncommitted work. Use `fgos main-checkout-reset --sha <sha> [--confirm]`; it prints the whole-repo status and refuses without `--confirm` when the tree is dirty (`docs/history/main-checkout-destructive-git-safety-net/CONTEXT.md`).
2. Never `git add -A` inside a linked worktree without checking `git status` first: a worktree keeps no `.fgos/` copy, so `-A` stages every `.fgos/` file as deleted and the merge would destroy the live event log. `.githooks/pre-commit` refuses such a commit; recover with `git restore --staged .fgos` (`docs/history/commit-time-fgos-deletion-guard/`).
3. Never `git stash` in the main checkout without checking what it swept up: the stash stack is shared by every session and worktree, and stashing `.fgos/events.jsonl` rolls the repository's `.fgos` state back for as long as the stash is held. No hook can refuse a stash, so stash selectively and recover by applying the stash by SHA, not popping it.
4. Never resolve a `.fgos/` merge conflict on a worker branch by committing a modified `.fgos/*` file: restore each such path to the branch's own prior content and drop it from the commit.
5. The main-checkout delete guard (`fgos hook main-checkout-delete-guard`) refuses `git clean -x`, `xargs rm`, `rm -r` of a checkout root or its runtime directories and `find -delete` there. It does not judge code an interpreter runs (`python -c`, `node -e`), `rsync --delete`, a glob `mv`, `shred` or a redirect over a file, nor a command it cannot read as text. Those stay your own care: delete named paths, assert the directory before any destructive step, and remove a worktree with `fgos worktree remove`.
