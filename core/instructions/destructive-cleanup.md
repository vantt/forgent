---
id: destructive-cleanup
kind: boundary
owner: core
scope: repo
mode: append
specificity: 10
title: Destructive Cleanup
description: Never hand-roll deletion of ignored or untracked files; use fgos worktree remove or git -C on a registered linked worktree
lifecycle: live
valid_from: 2026-11-26
related:
  - "[[coding-worktree-safety]]"
---

# Destructive Cleanup

Never hand-roll deletion of ignored or untracked files or directories (`git status --ignored | xargs rm`, `git clean -x`, `rm -rf` on a computed list).
Use `fgos worktree remove --discard-ignored`, or `git -C "$W"` after asserting `$W` is a registered linked worktree (`git worktree list`).
Never chain a destructive step after `cd` with `;` or `&&` from a failed create; the main checkout holds the active release and run history.
If the main checkout lost ignored paths, follow `docs/how-to/recover-main-checkout-after-ignored-files-wipe.md`.
