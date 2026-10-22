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
- Directory: `<stateRoot>/identity/sessions/<suffix-hash>.json`, one file per session, user level so every project on the machine sees it (spec section 4 rule 2). Not `.fgos/sessions.json`, which is the worktree session registry (scout §10).
- Entry: full id, handle, CLI, project id (if any), clone path, start time, role aliases, and a liveness `fgos_process::facts::Record` of the **agent head**: the highest ancestor with a terminal that Session Identity's tree walk finds, captured with `identity_of`; never the transient `fgos` child. An env-id session with no terminal ancestor records `liveness: unknown`.
- **Registration is explicit only:** `fgos identity session --register` and `--role lead:<LANE> [--take]` (operation `identity.write`). The bare verb and `identity session` without flags never write (red-team finding 2), so hooks and workers add no entries.
- Every write prunes dead entries (bounded scan of the directory) and refuses past 512 entries with a message naming `list --prune`.
- Collision: a second live session whose handle equals a registered live handle is refused at `--register` with both full ids; handles never change.
- Resolve refusal codes match the mailbox's (`ambiguous`, `not-found`) so MAIL can adopt them. Convention kind `lane-id` (first `A-Z`, rest `A-Z0-9-`, max 16); `lead:` is a fixed prefix in the crate.

## Files
- Create: `packages/identity/rust/src/directory.rs`, `tests/directory.rs`.
- Modify: `packages/identity/rust/src/{lib.rs,provider.rs,session.rs}`, `packages/identity/contracts/identity.{read,write}.v1.json`, `packages/convention/contracts/convention.{rules,golden}.v1.json`, `apps/fgos/src/cli_projector.rs`, `apps/fgos/tests/cli_tests.rs`, `docs/platform/identity/spec.md` section 5, `CHANGELOG.md`.

## Verification
- `cargo test -p fgos-identity` (register; resolve one; ambiguous; not found; dead pruned on write; cap refused; role take; an env-id session is judged by its terminal ancestor, not the `fgos` child).
- Two live sessions on one machine register, then resolve each other by handle and by `lead:<LANE>`; the command pair and output go in the phase report.

## Risk and rollback
- The directory is per user, outside any repository; rollback removes `<stateRoot>/identity/` and reverts the commit.
