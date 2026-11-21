---
id: p-mxscp3uijh
title: Seat Binding declares `fgos-host-runtime` and never uses it, so every pure crate that depends on it pulls tokio (seat binding, priority low; needs OPC review)
status: proposed
priority: P3
area: seat-binding
created: 2026-11-21
---

# Why

`packages/seat-binding/rust/Cargo.toml:8` has carried the dependency since the crate was created (`dc65c1049`); no source file of the crate names it. The new pure `fgos-execution` crate reaches tokio only through this edge.

# Done when

The dependency is removed from `fgos-seat-binding`, `cargo tree -p fgos-execution` shows no tokio, and `cargo test -p fgos-seat-binding -p fgos-execution` passes.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
