---
id: p-fsg6aolefe
title: "Agent confinement moves to Rust in one pass: the role's own work runs inside the cage, a peers head keeps its own pid namespace, and the Node confinement files are ported, not patched (agent-confinement, priority high; source: owner via the manual supervisor, 2026-11-24)"
status: proposed
priority: P1
area: agent-confinement
created: 2026-11-24
---

# Why

Phases 4 and 5 of plan `261124-0004-heads-operate-without-owner` would edit Node confinement files (`src/runner/dispatch/confinement/**`) that plan `261122-2108-delete-dead-node-execution-closure` is about to delete or shrink, and that the Node-to-Rust port inventory (`plans/discussions/ds-wham5txfkv-node-rust-port-inventory/DISCUSSION.md`) lists for porting. Editing Node and then porting writes the same change twice, and the two plans overlap on the same files. The owner chose to split: 0004 keeps phases 1, 2, 3, 6 and 7, and this item takes phases 4 and 5 written once in Rust.

# Done when

A new plan exists, blocked by `261122-2108-delete-dead-node-execution-closure`, that: loosens the cage so a role's own work runs inside it (including `npm test` and `cargo test --workspace`, the old PC-D7 rule); gives a peers head its own pid namespace; ports `workspace-paths.mjs`, `resources.mjs` and `drivers/bwrap.mjs` to Rust; and pays the authority debt of `bwrap.mjs`. Plan 0004 no longer touches `src/runner/dispatch/confinement/**` or `test/runner/dispatch-confinement-*.test.mjs`.

# Notes

Seeded discussion: `plans/discussions/ds-4qpcunq7n7-confinement-to-rust/DISCUSSION.md`. Runs after 2108 so the port learns which Node code is still alive.
