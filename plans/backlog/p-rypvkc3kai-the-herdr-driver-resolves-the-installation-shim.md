---
id: p-rypvkc3kai
title: The herdr driver resolves the installation shim path on its own (one door, priority low)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`packages/herdr-fgos-common/rust/src/fgos.rs` builds `<root>/.fgos/installation/bin/fgos` itself, while Node has one owner (`src/util/host-bin-path.mjs`). It is listed as debt on the doors row for the installation shim. A move onto the distribution crate would add a crate edge.

# Done when

One Rust owner of the shim path lives in a crate that both distribution and herdr-fgos-common already depend on (check the shared dependencies first, for example fgos-config's paths), fgos.rs uses it, its debt entry is gone, and Cargo.lock is unchanged.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
