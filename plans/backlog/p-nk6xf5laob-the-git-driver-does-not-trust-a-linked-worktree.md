---
id: p-nk6xf5laob
title: The Git driver does not trust a linked worktree on Windows, or on Linux with `worktree.useRelativePaths` (Git, priority high; routed to OPC)
status: done
priority: P1
area: git
created: 2026-11-21
---

# Why

`topology_on_disk` (`packages/git/rust/src/driver.rs` ~535-540) compares a canonical `\\?\D:\...` path with the raw backlink `D:/...` from `gitdir`, so a linked worktree is `untrusted-worktree` on Windows; with `worktree.useRelativePaths` the relative backlink is never joined to the admin directory or canonicalised, so Linux fails the same way. Tests that need a linked worktree (`release_rows`, `workspace`) are gated on Unix because of it.

# Done when

Backlinks are resolved against the admin directory and compared in one spelling; the two gated tests run on Windows.

# Notes

Migrated from the legacy backlog table. Original status: done (plan 261121-1309-git-windows-custody, main 8651e7647).
