# Phase 9: A head's requests act on its launch project, not its working checkout

Capability: `code:implement`.

Opened by the phase 6 live proof run 3 (`reports/live-proof.md`, section "Rerun on 31b1a9955c", defect E). The phase 8
fix works: the successor's Stop hook finds the rotation record and sends `session answered`. The answer is still
refused `no-rotation-pending`. `runHeadRequest` in `src/session-host/head-request.mjs` sets
`projectRoot = envelope.cwd`, and the attempt cwd is the working checkout, which for a shaper is its linked worktree
(`working_checkout()` in `apps/fgos/src/wiring/unit_run_host/session_attempt.rs`). So the answer, the stop trace of
the earlier generation and the land ticket are all read or written under the worktree's `.fgos`, not the project's.
The role never moves. Every save is refused `role-pending-rotation`, and the successor closes after 120 s.

## Inputs

- `packages/execution/rust/src/seat_session.rs` `head_of`: it copies the head's lineage from the launch environment
  (`FGOS_HEAD_PERSONA`, `FGOS_HEAD_NAME`, `FGOS_HEAD_GEN`) into the envelope's `session`. The envelope is written
  outside the sandbox and is digest-protected.
- `src/session-host/head-start.mjs` `placeHead`: since phase 8 it puts `FGOS_HEAD_PROJECT_ROOT` (absolute) in every
  head's launch env.
- `src/session-host/head-request.mjs` `runHeadRequest` (the `const projectRoot = envelope.cwd` line) and every verb
  that takes that `projectRoot`.
- `packages/run-supervisor/contracts/envelope.v3.json` (the `session` field text) and
  `packages/execution/contracts/transport-round/session-attempt.v1.json` (the `envs` vectors of `head_of`).
- Read only: `packages/run-supervisor/rust/src/head_request.rs`. Writes, `session save` and catch-up there use
  `cfg.cwd` correctly: a shaper writes and saves in its worktree. The release state and release tickets there also
  use `cfg.cwd`, but only the secretary and the supervisor release, and they run in the project root. Leave that file
  unchanged.

## Footprint

- `packages/execution/rust/src/seat_session.rs`
- `packages/execution/engine/tests/transport_round.rs`
- `packages/execution/contracts/transport-round/session-attempt.v1.json`
- `packages/run-supervisor/contracts/envelope.v3.json`
- `src/session-host/head-request.mjs`
- `test/session-host/head-request.test.mjs`

## Steps

1. `head_of` also reads `FGOS_HEAD_PROJECT_ROOT`. When the lineage is named and that variable holds an absolute path,
   the session block carries it as `projectRoot`. A launch that names no lineage still gets an empty map; a missing or
   relative root adds nothing. Add the cases to the `envs` vectors.
2. `envelope.v3.json`: the `session` field lists `projectRoot?`. It is the absolute project the head was started in,
   which differs from `cwd` when the head works in a linked worktree.
3. `runHeadRequest` sets `projectRoot = envelope.session.projectRoot ?? envelope.cwd`. Each verb then uses it:
   `session answered`, `session rotate`, `session start`, land, run, widen and their tickets, `request result`,
   `worktree create`, questions and metrics. Nothing else changes; writes and saves stay with the Rust side on `cwd`.
4. Tests:
   - In `head-request.test.mjs`, an envelope whose `cwd` is a linked worktree with its own `.fgos`, and whose
     `session.projectRoot` is the project, records `session answered` and a land ticket under the project's `.fgos`.
   - In the same file, an envelope without `session.projectRoot` keeps the `cwd` behaviour.
   - In `transport_round.rs`, the `head_of` vectors cover the new field.

## Verify

`node --test test/session-host/head-request.test.mjs` passes, and so does
`cargo test -p fgos-execution-engine --test transport_round` (the supervisor runs cargo). After that, the phase 6
live proof rotation step passes: the successor answers, holds the role, and its save is accepted.

## Rollback

Revert the phase's squash commit. A shaper's rotation then ends `no-answer` again.
