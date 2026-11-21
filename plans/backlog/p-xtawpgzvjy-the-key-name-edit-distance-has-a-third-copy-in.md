---
id: p-xtawpgzvjy
title: The key-name edit distance has a third copy in the config schema
status: proposed
priority: P2
area: packaging-distribution
created: 2026-11-21
---

# Why

`fgos-distribution::suggest` is now the one did-you-mean for `fgctl` and `fgos` verbs and flags, but `packages/config/rust/src/schema.rs` (`distance`, used for unknown-key suggestions) keeps its own case-insensitive copy because `fgos-config` does not depend on `fgos-distribution` and a config key is not a command. Move the pair to the lowest crate both can depend on (or give `suggest` a case-insensitive form) and delete the copy.

# Done when

Config suggests keys through the same function as the command line; one edit-distance in the Rust tree.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
