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

## Facts re-checked on main after phase 7b (lead, 2026-11-18)
- `bin/fgos.mjs` `head rotate` 3402-3416 (`reason: 'manual'` at 3416); `head-request.mjs` `rotateHead` 44-48, handler
  `exactKeys(['persona','name','reason','stopFacts'])` 98-100.
- `rotate.mjs`: `ROTATION_REASONS` already has `manual` (35), `STOP_FACT_KEYS` (44); the bug is
  `rotate: reason === 'soft' ? 'soft' : 'hard'` (264); `rotation.json` already records the real reason (273).
- `handoff-store.mjs`: `buildHandoff` (49) writes `- rotation:`, gates last-message/pending-question on `hard` (52);
  `latest.json` pointer (70) is read by `head-start.mjs:143`.
- Contract field is `rotate` (`rotation-files.v1.json:7` "soft | hard", :12, :38 "no pending-question source"); the Rust
  reader `handoff.rs:70,103-105` takes a free string (only its test reads it); the hook sends only soft/hard.
- No code locates a head's transcript from the executor; only the hook gets `transcript_path`; `measure.rs:111`
  parses transcripts. No open-question source exists (the owner-question store, plan 261118-1159, waits on this plan).
- Schema already allows `personas.<name>.reload`; standard has `personas: {}`.

**Lead decision (scope, 2026-11-18):** "open questions" are carried by the old head's last assistant message (the
secretary batches its open questions there by its skill); a structured pending-question source arrives with the
owner-question store, not here.

## Steps
1. The log, handoff and `latest.json` carry the real reason: `manual`, `soft` or `hard`; the contract and the Rust
   reader accept `manual` (every reader moves in this phase, L10).
2. A manual rotation hands off context: a new Rust reader (reusing `measure.rs` transcript parsing) locates the old
   head's transcript (from its run/protected session dir) and returns its last assistant message; Node `rotate.mjs`
   passes it as `stopFacts.lastAssistantMessage`, plus the persona's portfolio. The handoff shows the last message for
   `manual` as for `hard`.
3. Config: `sessionRotation.personas.secretary.reload` lists the secretary's portfolio files (backlog, board, portfolio
   per the fgos-secretary skill) in the release standard, schema updated.
4. Tests: the reason case and the manual-handoff case at their owning layer; extend existing rotation tests.

## Verify
- Focused session-rotation/session-host Node tests; `cargo test -p` the session-host crate; clippy.
- A manual `fgos head rotate` on a test head writes `rotation: manual` and a handoff with the last message and portfolio.

## Rollback
`git revert`; old handoffs stay readable (the reader accepts both).
