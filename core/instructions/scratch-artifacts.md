---
id: scratch-artifacts
kind: boundary
owner: core
scope: repo
mode: append
specificity: 10
title: Scratch Artifacts
description: Keep draft scripts, logs, patches and dumps out of the repository root; the pre-commit hook owns the root-file allowlist
lifecycle: live
valid_from: 2026-11-26
related:
  - "[[coding-worktree-safety]]"
---

# Scratch Artifacts

Keep draft scripts, logs, patches and dumps out of the repository root. Use
`.fgos/runtime/tmp/`, falling back to `${TMPDIR:-/tmp}/fgos-work/`.
`.githooks/pre-commit` owns the single root-file allowlist and refuses new root
files outside it, including linked worktrees. Legitimate root additions require
an allowlist change in a separate commit, landed on main before the addition.
The hook runs only when wired via `npm run setup:hooks`; `fgos doctor` checks
that wiring with `main-checkout-hook-wired`. `MERGE_HEAD` skips the root
guard, and the `.fgos` deletion and worker guards accept only a staged entry
equal to the merge parent's where that parent changed it since the merge base;
no other data-loss guard is skipped.
