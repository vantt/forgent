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

1. Never run a raw `git reset --hard` on the main checkout without a full `git status` first.
2. Never `git add -A` inside a linked worktree without checking `git status` first to avoid staging `.fgos/` deletion.
3. Never `git stash` in the main checkout without checking what it swept up.
4. Never resolve a `.fgos/` merge conflict on a worker branch by committing a modified `.fgos/*` file.
