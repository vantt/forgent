---
id: p-33ldeduuhm
title: Two hand-written frontmatter readers (one-door, priority low; needs OPC review)
status: proposed
priority: P3
area: packaging-distribution
created: 2026-11-21
---

# Why

`apps/fgos/src/wiring/uninstall.rs` (`frontmatter_source`) and `packages/distribution/rust/src/skill_stamp.rs` (`cut_frontmatter_body`) cut a leading `---` block with `strip_prefix`.

# Done when

Both read through the YAML door or one shared reader.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
