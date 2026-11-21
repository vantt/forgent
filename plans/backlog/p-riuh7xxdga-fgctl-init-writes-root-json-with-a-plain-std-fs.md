---
id: p-riuh7xxdga
title: "`fgctl init` writes `root.json` with a plain `std::fs::write` (one door, priority medium)"
status: proposed
priority: P2
area: platform-foundations
created: 2026-11-21
---

# Why

`packages/distribution/rust/src/init.rs:1588` writes `root.json` into the installation directory without Durable File, while `activation.json` beside it now goes through `fgos_durable_file`. Every resolution reads `root.json` (`lib.rs:251`), so a torn write breaks every `fgos` call in that project. Found by the reviewer of the activation-record fix.

# Done when

`root.json` is written through `fgos_durable_file` like `activation.json`, and the Rust fsync doors row allows no other writer in `init.rs`.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
