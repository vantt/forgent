---
id: p-265qfonr5w
title: Dropping the host recursion guard for a child that calls `fgos` itself is hand-written in six places (one-door, priority low; needs OPC review, owner HARDEN or one-door-debt)
status: proposed
priority: P3
area: platform-foundations
created: 2026-11-21
---

# Why

`src/setup/agent-hooks.mjs:90` (`delete env.FGOS_RUST_HOST_RECURSION_GUARD`), `src/event-store/maintenance.mjs:19` (the Node lifecycle wrapper's seal and publish children), the `FGOS_*` filter in `src/run-supervisor/direct-launch.mjs:140`, `packages/distribution/rust/src/uninstall.rs:392` (`env_remove`), and in the host the `GATEWAY_ENV_REMOVE` list of `apps/fgos/src/wiring/gateway_control.rs` and the `SYNC_CHILD_ENV_REMOVE` list of `apps/fgos/src/invocation_doors.rs` (both name `RECURSION_GUARD_VAR`; the removal itself is done by the process crate's detached spawn). Each repeats the variable name and the rule.

# Done when

One helper per side (or one exported name for the variable on the Node side) owns the rule, and a `doors` row on the literal makes a sixth copy fail; every caller above uses it and the hand-written removals are deleted.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
