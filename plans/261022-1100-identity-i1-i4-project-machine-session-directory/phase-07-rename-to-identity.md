---
phase: 7
title: "Rename the component to Identity"
status: pending
priority: P3
effort: "2h"
dependencies: [2]
---

# Phase 07: Rename to Identity

## Goal
One component under one name: `packages/session-identity` becomes `packages/identity`, crate `fgos-session-identity` becomes `fgos-identity`, and `docs/platform/session-identity/spec.md` is merged into `docs/platform/identity/spec.md` as its local-session section.

## Waits for
HARDEN T1 phase 6 landed (it edits this crate's `Cargo.toml`, `proc_tree.rs` and the addon door). Announce the rename on the board to HARDEN, MAIL and every lane that imports the crate before starting.

## Steps
1. `git mv packages/session-identity packages/identity`; rename the crate and every `use fgos_session_identity` (apps/fgos, observe, event-store, node addon, tests) in one commit (L10, no alias crate).
2. Move the Session Identity spec content into the Identity spec; leave no stub (the reading map and component-boundary row point to the Identity spec).
3. Update `docs/architecture-manifest.json`, `docs/platform/component-boundary.md`, `docs/specs/reading-map.md`, `command-routes.json` owner paths, CHANGELOG.

## Verification
- `cargo test --workspace` and `npm test` green (known reds on main excepted and named).
- `rg -n 'fgos_session_identity|fgos-session-identity|packages/session-identity' --glob '!plans/**' --glob '!CHANGELOG.md'` finds nothing.
