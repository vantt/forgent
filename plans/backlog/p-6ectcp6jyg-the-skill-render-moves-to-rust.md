---
id: p-6ectcp6jyg
title: "The skill assembly render (`src/setup/skill-wrappers.mjs`) moves to Rust, so the door row `skill-generated-stamp` has an owner (distribution, priority high; source: owner via the manual supervisor, 2026-11-24)"
status: proposed
priority: P1
area: packaging-distribution
created: 2026-11-24
---

# Why

The door row `skill-generated-stamp` (severity high) says "the render moves to Rust (no step owns that: the render is repository tooling)". The stamp and owned-name rule live twice: `packages/distribution/rust/src/skill_stamp.rs` and `src/setup/skill-wrappers.mjs`, tied only by the vectors of `skill-stamp.v1.json`.

# Done when

The render is written in Rust over the existing `skill_stamp.rs`, the Node twin and its callers (`src/setup/registrations.mjs`) are gone, and the row's `retiredBy` names this item and then the row is removed.

# Notes

Fast path: do not wait for phase 0 of `261124-1026-harden-next-round`. Needs a discussion or a planner first.
