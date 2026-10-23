---
phase: 0
title: "Rename the component to Identity"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 00: Rename to Identity (first, before any new code)

## Goal
One component under one name: `packages/session-identity` becomes `packages/identity`, crate `fgos-session-identity` becomes `fgos-identity`, and `docs/platform/session-identity/spec.md` is merged into `docs/platform/identity/spec.md` as its local-session section.

## Why first
The owner chose one component named Identity that mints every kind of id (spec section 10, 2026-10-22 11:32). No branch has edited the crate (checked 13:08 on every `origin/harden/*` branch: no commit under `packages/session-identity` or `src/util/session-identity.mjs`), so renaming now is one mechanical commit; renaming after phases 01-07 and HARDEN T1 phase 6 would move far more lines and force HARDEN to rebase over it. Post the rename on the board to HARDEN (T1 phase 6 paths change), MAIL and every lane importing the crate before starting; land it fast.

## What is renamed
- Package `packages/session-identity` to `packages/identity`; crate `fgos-session-identity` to `fgos-identity`; every `use fgos_session_identity` (apps/fgos, observe, node addon, tests).
- Operation id `session-identity.resolve` to `identity.writer` and its contract files `session-identity.{resolve,golden}.v1.json` to `identity.writer.{v1,golden.v1}.json` (about 25 references in 14 files, among them `catalog.rs`, `command-routes.json`, `command-route-annotations.json`, `cli_projector.rs`, `src/runner/dispatch/execution-contract.mjs`, `src/util/session-identity.mjs`, `docs/platform/git/spec.md`). Not `identity.resolve`, which would collide with the new `fgos identity resolve <handle>`.
- `docs/platform/session-identity/spec.md` merged into `docs/platform/identity/spec.md` as its local-session section; no stub left.

## What is not renamed
- The doctor row `writer-identity-resolvable`: it names what it checks.
- The Node facade file `src/util/session-identity.mjs` and its functions: HARDEN T1 phase 6 rewrites that file; its new name is HARDEN's call in that phase, announced on the board.

## Steps
1. `git mv packages/session-identity packages/identity`; rename the crate and every `use fgos_session_identity` (apps/fgos, observe, event-store, node addon, tests) in one commit (L10, no alias crate).
2. Move the Session Identity spec content into the Identity spec; leave no stub (the reading map and component-boundary row point to the Identity spec).
3. Update `docs/architecture-manifest.json`, `docs/platform/component-boundary.md`, `docs/specs/reading-map.md`, `command-routes.json` owner paths, CHANGELOG.

## Verification
- `cargo test --workspace` and `npm test` green (known reds on main excepted and named).
- `rg -n 'fgos_session_identity|fgos-session-identity|packages/session-identity' --glob '!plans/**' --glob '!CHANGELOG.md'` finds nothing.
