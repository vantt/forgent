---
id: p-t7lplkrfue
title: Retire `readGitStatus` and `recoverGitOperations` from the Git addon after a Rust test for "recovery keeps an operation for another writer" (Git, priority low; needs OPC review)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

After the native `init`, the addon's `readGitStatus` and `recoverGitOperations` have test callers only (worktree-recovery, commit-parent-death, merge-gate). The case "recovery keeps an operation owned by another writer" has no Rust-level test in `packages/git/rust/tests/incidents.rs`, so deleting the two entries would lose that proof.

# Done when

`incidents.rs` has a test for that case; the two addon entries, their facade wrappers and the Node tests that call them are deleted together.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
