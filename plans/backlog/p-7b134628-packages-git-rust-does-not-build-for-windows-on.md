---
id: p-7b134628
title: "`packages/git/rust` does not build for Windows on main"
status: done
priority: P2
area: 65060ec92-harden-opc-review-merge-ref-recovery-refuses-with-git-lockscope-unavailable-windows-off-unix-the-cwd-owner-check-raises-its-warning-when-no-uid-exists-msvc-and-darwin-all-targets-check-green-for-process-holder-lock-git-run-supervisor-20-windows-only-dead-code-warnings-left-in-fgos-git
created: 2026-10-24
---

# Why

`refs.rs:1073` calls `custody_lock_path`, which is Unix-only (`#[cfg(unix)]` at `refs.rs:1002`), and `worktree.rs:405` calls `libc::geteuid()` outside any `cfg(unix)` block while `libc` is a Unix-only dependency (`packages/git/rust/Cargo.toml`). Every Windows build of `apps/fgos`, `fgos-distribution` and `fgos-observe` therefore fails. Found 2026-10-24 by `cargo check -p fgos --target x86_64-pc-windows-msvc` (lane GIT).

# Done when

`cargo check -p fgos -p fgos-distribution -p fgos-observe --target x86_64-pc-windows-msvc` passes with no `cfg` shortcut that skips the checks: the custody lock and the euid read are either gated with a real non-Unix answer or moved behind the existing platform seam

# Notes

Migrated from the legacy backlog table. Original status: done.
