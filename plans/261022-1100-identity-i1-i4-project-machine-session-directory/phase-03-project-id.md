---
phase: 3
title: "Project id (rung I1)"
status: pending
priority: P2
effort: "3h"
dependencies: []
---

# Phase 03: Project id (I1)

## Goal
Every repository using fgOS carries one project id in a tracked file, the same in every clone on every machine; `fgos identity project --json` prints it; a fork keeps it until `fgos identity project --new`.

## Facts (scout report §4)
- `.fgos/project.json` is not ignored, is not blocked by the pre-commit root allowlist (the check ignores paths with `/`), and needs no change to `.gitattributes` or the strip rules (barrier F10).
- Linked worktrees have no `.fgos/` (ADR0020, `src/runner/worktree.mjs:730-776`), and worker branches cannot commit under `.fgos/` (`.githooks/pre-commit:222-246`). So the file is written only from the main checkout and read through the main checkout's `.fgos` (`getMainFgosDir`, `src/state/runtime-coordination.mjs:23`; Rust: the trusted main root used by `packages/distribution/rust/src/workspace.rs:28`).
- Precedent for a tracked pin written by setup: `.fgos/distribution.json` (`packages/distribution/rust/src/init.rs:38`).

## Design
- File `.fgos/project.json`: `{"v":1,"projectId":"<32 hex>","handle":"<slug>","createdAt":"<iso>"}`. Id: 128 random bits. Handle: a Convention `project-handle` identifier, defaulting to the repository folder name reduced to the identifier alphabet at mint time only (rule 1 of spec section 4: a name may seed a handle, never the id).
- Mint: setup fix `identity-project-id` on the main checkout when the file is absent; never rewrites an existing file. `fgos identity project --new [--handle <h>]` re-mints on purpose (fork split, spec decision 3) and prints the commit to make.
- Doctor: check `identity-project-id` (present, valid, read from the main checkout). The doctor warning "two remotes publish one project id" needs the shared directory and lands in phase 05.
- Read path: `fgos_identity::project(repo)` resolves the trusted main root first, so a call from a worktree reads the main checkout's file.

## Files
- Create: `packages/identity/rust/src/project.rs`, `tests/project.rs`, `packages/identity/contracts/identity.project.v1.json`.
- Modify: `packages/identity/rust/src/{lib.rs,provider.rs}`, `src/setup/identity-checks.mjs`, `src/setup/registrations.mjs`, `test/setup/identity-checks.test.mjs`, `packages/convention/contracts/convention.{rules,golden}.v1.json`, `apps/fgos/src/cli_projector.rs`, `apps/fgos/tests/cli_tests.rs`, `docs/platform/identity/spec.md`, `docs/platform/event-store/spec.md` (inventory of tracked `.fgos` files, its line 565), `docs/specs/distribution.md` row 7, `CHANGELOG.md`.
- This repository: commit the minted `.fgos/project.json` on main by explicit pathspec.

## Verification
- `cargo test -p fgos-identity` (mint once; never overwrite; `--new` changes the id; worktree call reads the main file).
- `node scripts/run-tests.mjs test/setup/identity-checks.test.mjs`
- `npm run fgos:dev -- doctor --fix </dev/null` on a fresh clone in a temp dir mints the file; `git -C <clone> status --short` shows only `.fgos/project.json`; a second clone of the same commit prints the same id.

## Risk and rollback
- A tracked file appears in projects using fgOS after their next setup. It is small and harmless; rollback deletes it with a revert. The fix never runs in a worktree, so no worker branch can trip the pre-commit guard.
