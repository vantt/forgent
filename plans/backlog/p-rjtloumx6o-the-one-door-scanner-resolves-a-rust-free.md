---
id: p-rjtloumx6o
title: The one-door scanner resolves a Rust free variable by any `let` of that name in the file (git census, priority low; found by the worktree door plan 2026-11-18)
status: proposed
priority: P3
area: git
created: 2026-11-18
---

# Why

`scripts/git-one-door-scan.mjs` could not see that `bin` in `cli_tests.rs` `fgos_bin()` comes from `if let Ok(bin)`, searched the file and took an unrelated `let bin = sandbox.join("bin")`, so 49 census rows silently vanished until the local was renamed. A census can lose rows without any warning.

# Done when

The scanner resolves a binding in its own scope (or refuses, listing the site as unresolved) and a seeded case proves an unrelated same-named `let` elsewhere in the file changes nothing.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
