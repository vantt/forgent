---
id: p-imgwkzc7zs
title: "Land clearing skip-worktree and restoring tracked `.fgos` from the target has no owning test (git; source: lead of plan 261126-0853, 2026-11-26)"
status: proposed
priority: P2
area: git
created: 2026-11-26
---

# Why

`packages/git/rust/src/land.rs:578-605` clears skip-worktree and restores tracked `.fgos` files from the land target.
No test owns this behaviour. Its owning file, `packages/git/rust/tests/land.rs`, was outside plan 261126-0853's
footprint, so that plan could not add one. Evidence: `plans/261126-0853-config-set-refuses-stripped-project-file/reports/commit-proofs.md`.

# Done when

One owning test in `packages/git/rust/tests/land.rs` shows that a land clears skip-worktree on tracked `.fgos` files
and restores them from the target.
