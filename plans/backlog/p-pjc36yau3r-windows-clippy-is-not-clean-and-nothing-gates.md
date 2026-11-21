---
id: p-pjc36yau3r
title: Windows clippy is not clean and nothing gates it (CI, priority low)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`cargo clippy -D warnings` for `x86_64-pc-windows-msvc` fails in `packages/process/rust/src/windows_job.rs` and `windows_spawn.rs`, and the msvc check warns `unused_mut` at `packages/distribution/rust/src/fetch.rs:316`. CI runs Windows tests but not Windows clippy, so new warnings land unseen.

# Done when

Windows clippy is clean on the touched crates and a CI job gates it, or the decision not to gate it is recorded.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
