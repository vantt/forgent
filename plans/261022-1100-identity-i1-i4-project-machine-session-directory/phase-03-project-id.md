---
phase: 3
title: "Project id (rung I1)"
status: pending
priority: P2
effort: "3h"
dependencies: [1]
---

# Phase 03: Project id (I1)

## Goal
Every repository using fgOS carries one project id in the tracked file `.fgos/project.json`, the same in every clone on every machine; `fgos identity project --json` prints it; a fork keeps it until `fgos identity project --new`.

## Facts (scout §4; red-team finding 3)
- `.fgos/project.json` is not ignored, is not blocked by the pre-commit root allowlist, and needs no change to `.gitattributes` or the strip rules (barrier F10).
- Linked worktrees have no `.fgos/` (ADR0020, `src/runner/worktree.mjs:730-776`), and worker branches cannot commit under `.fgos/` (`.githooks/pre-commit:222-246`).
- Three machines each have their own clone; an automatic mint on each would give three ids before the first push.

## Design
- File: `{"v":1,"projectId":"<32 hex>","handle":"<slug>","createdAt":"<iso>"}`. Id: `fgos_session_identity::text::random_hex128`. Handle: Convention kind `project-handle` (first `a-z`, rest `a-z0-9-`, max 40), defaulting to `slug(<folder name>)` at mint time only (spec section 4 rule 1: a name may seed a handle, never the id).
- **No automatic mint.** `fgos identity project --init [--handle <h>]` (operation `identity.write`) mints only on the main checkout and refuses when the file already exists, when run in a linked worktree, or when the remote's default branch already tracks `.fgos/project.json` (`git ls-tree` on the fetched remote ref through the Git component); it prints the commit command. `--new` re-mints on purpose (fork split, spec decision 3).
- Doctor check `identity-project-id`: pass when present and valid on the main checkout; warn when absent with "run `fgos identity project --init` once on one machine, commit, pull elsewhere"; there is no fix.
- Read path: `fgos_session_identity::project(repo)` resolves the trusted main root first (as `packages/distribution/rust/src/workspace.rs:28` does), so a call from a worktree reads the main checkout's file.
- This repository: the IDENT lead runs `--init` once on `fg-server` and commits `.fgos/project.json` on main by pathspec before the release lands; the other machines get it by pull.

## Files
- Create: `packages/session-identity/rust/src/project.rs`, `tests/project.rs`.
- Modify: `packages/session-identity/rust/{Cargo.toml,src/lib.rs,src/provider.rs}` (dep on the Git component for the trusted main root and remote ref read), `Cargo.lock`, `packages/session-identity/contracts/identity.{read,write}.v1.json`, `src/setup/identity-checks.mjs`, `src/setup/registrations.mjs`, `test/setup/identity-checks.test.mjs`, `test/setup/checks.test.mjs`, `packages/convention/contracts/convention.{rules,golden}.v1.json`, `apps/fgos/src/cli_projector.rs`, `apps/fgos/tests/cli_tests.rs`, `docs/platform/identity/spec.md`, `docs/platform/event-store/spec.md` (inventory of tracked `.fgos` files, line 565), `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`, `docs/specs/distribution.md` row 7, `CHANGELOG.md`.

## Verification
- `cargo test -p fgos-session-identity` (init once; refuse when present, in a worktree, and when the remote already tracks the file; `--new` changes the id; a worktree read returns the main file).
- `node scripts/run-tests.mjs test/setup/identity-checks.test.mjs test/setup/checks.test.mjs`
- Two temp clones of one bare repo: `--init` and push in the first; `--init` in the second after `git fetch` refuses; after pull both print the same id.

## Risk and rollback
- Nothing is minted without an explicit command, so no project gets a surprise tracked file. Rollback: revert, and delete the file by a commit.
