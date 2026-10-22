---
phase: 4
title: "Local directory, role aliases, resolve and list (rung I3b)"
status: pending
priority: P2
effort: "5h"
dependencies: [2, 3]
---

# Phase 04: Local directory, resolve and list (I3b)

## Goal
On one machine, `fgos identity resolve <handle|lead:<LANE>>` returns exactly one live session or fails with "ambiguous" or "not found" and the candidates; `fgos identity list` shows the sessions the machine knows.

## Design
- Directory file: `<stateRoot>/identity/sessions/<session-hash>.json`, one file per session, user level so every project on the machine sees it (spec section 4 rule 2). Not `.fgos/sessions.json`, which is the worktree session registry (scout §10). Each entry: full id, handle, CLI, project id, clone path, start time, a `fgos_process::facts::Record` for liveness, role aliases.
- Registration: the first identity read of a session writes its entry (`install_once`); `fgos identity session --role lead:<LANE>` adds a role alias, and taking a role from another live session needs `--take`.
- Liveness: `fgos_process::facts::judge_here(&Record)`; a dead entry is shown as dead and pruned by `fgos identity list --prune`.
- Collision: if two live entries share a handle, both are shown with 4 suffix characters (the handle grows, the id never changes).
- Resolve refusals mirror the mailbox codes (`ambiguous`, `not-found`) so MAIL can adopt them.
- Convention kind `role-alias` (`lead:` plus the board lane id alphabet).

## Files
- Create: `packages/identity/rust/src/directory.rs`, `tests/directory.rs`, `packages/identity/contracts/identity.resolve.v1.json`.
- Modify: `packages/identity/rust/src/{lib.rs,provider.rs,session.rs}`, `packages/identity/rust/Cargo.toml` (`fgos-process`), `packages/convention/contracts/convention.{rules,golden}.v1.json`, `apps/fgos/src/cli_projector.rs`, `apps/fgos/tests/cli_tests.rs`, `docs/platform/identity/spec.md` section 5, `CHANGELOG.md`.

## Verification
- `cargo test -p fgos-identity` (register, resolve one, ambiguous, not found, dead pruned, role take).
- Two live sessions on one machine resolve each other by handle and by `lead:<LANE>`: the command pair is written into the phase report.

## Risk and rollback
- The directory is per user, outside any repository; rollback removes `<stateRoot>/identity/` and reverts the commit.
