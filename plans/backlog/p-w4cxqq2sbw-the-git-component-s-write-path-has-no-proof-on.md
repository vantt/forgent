---
id: p-w4cxqq2sbw
title: The Git component's write path has no proof on Windows (Git, priority medium)
status: done
priority: P2
area: git
created: 2026-11-12
---

# Why

The `wal::` lib tests and `packages/git/rust/tests/worktree.rs` are unix-gated and 28 of 29 `test/verbs` worktree node tests skip on win32, on `main` and on the Windows read-path branch alike (measured on windows-latest, 2026-11-12), so nothing proves a WAL open or a worktree create and remove there. Known gap behind it: caller-supplied path arguments (`worktree.rs` `worktree add <path>`, `worktree remove`, `move`, built from `fs::canonicalize`) still reach Git in the verbatim `\\?\D:\...` spelling, so Git would record it in the worktree's gitfile; the fix belongs in the driver's `text_path` door, which `worktree.rs` `text()` should call instead of a twin.

# Done when

Windows runs a WAL open and a worktree create and remove against the real driver in CI, and every path handed to a child Git has the plain spelling.

# Notes

Migrated from the legacy backlog table. Original status: done (plan 261121-1309-git-windows-custody, main 8651e7647).
