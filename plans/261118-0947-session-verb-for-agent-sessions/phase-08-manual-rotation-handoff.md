# Phase 8: A manual rotation says so and hands off real context

Backlog `p-ktnvgs2ozm`. Evidence: [debugger report](reports/debugger-261118-2130-miu-early-hard-rotation.md) §Q1, §Q2
(proven). Runs before the rename (owner priority 21:4x); depends on phase 7 (shares `src/session-host/**` and its tests).

## Inputs (read first)
- `bin/fgos.mjs` (`head rotate`, ~3462; sends `reason: 'manual'`; phase 5 renames it later), `src/session-host/head-request.mjs`
  (`rotateHead`, `stopFacts`), `src/session-rotation/rotate.mjs` (~262-273: `rotation: hard` for every non-soft reason,
  empty handoff), `src/session-rotation/handoff-store.mjs`.
- Contract `packages/session-host/contracts/rotation-files.v1.json`; Rust reader `packages/session-host/rust/src/**`
  (`handoff.rs`, `rotation/decide.rs` `reload_of`); `apps/fgos/src/wiring/session_rotation_hook.rs` if it reads the reason.
- `core/config-standard/sessionRotation.yaml` (`personas: {}`), `core/config-schema/sessionRotation.schema.yaml`.
- `docs/platform/session-host/spec.md` §8.8.

## Steps
1. The log, handoff and `latest.json` carry the real reason: `manual`, `soft` or `hard`; the contract and the Rust
   reader accept `manual` (every reader moves in this phase, L10).
2. A manual rotation hands off context: the executor reads the old head's last assistant message from its transcript
   (located via the head's protected session dir) and its open questions, plus the persona's portfolio; new reading code
   in Rust where it does not exist yet.
3. Config: `sessionRotation.personas.secretary.reload` lists the secretary's portfolio files (backlog, board, portfolio
   per the fgos-secretary skill) in the release standard, schema updated.
4. Tests: the reason case and the manual-handoff case at their owning layer; extend existing rotation tests.

## Verify
- Focused session-rotation/session-host Node tests; `cargo test -p` the session-host crate; clippy.
- A manual `fgos head rotate` on a test head writes `rotation: manual` and a handoff with the last message and portfolio.

## Rollback
`git revert`; old handoffs stay readable (the reader accepts both).
