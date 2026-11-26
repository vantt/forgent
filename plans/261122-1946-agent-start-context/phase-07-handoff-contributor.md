# Phase 7: The rotation handoff is the first contributor

The live door of ASC-D6. It also fixes the double delivery: today a Claude successor gets the handoff whole at
SessionStart (`fgos hook session-rotation --event session-start`, Claude rows only) and again through the ritual's
pointer to the file (`openingText`, `src/session-host/head-start.mjs:122-124`, until phase 5 moves it).

## Inputs

- `packages/session-host/rust/src/rotation/handoff.rs` (`session_start_context` line 190, `CONTEXT_LIMIT` 10,000
  characters at line 9) and `apps/fgos/src/wiring/session_rotation_hook.rs` (the call at line 340).
- `src/session-rotation/handoff-store.mjs` (`buildHandoff` line 66, `writeHandoff`, `readLatestHandoff`) and
  `src/session-rotation/rotate.mjs` (the call into `placeHead` at line 571).
- The `Contributor` port and the `start-contributors.v1.json` row schema, from phases 2 and 3.

## Footprint

`packages/session-host/rust/src/rotation/**`, `packages/session-host/rust/tests/**`,
`apps/fgos/src/wiring/session_rotation_hook.rs`, `apps/fgos/src/wiring/start_context/**`,
`packages/agent-start-context/contracts/start-contributors.v1.json`, `src/session-rotation/rotate.mjs`,
`src/session-rotation/handoff-store.mjs`, `test/session-rotation/rotate.test.mjs`,
`packages/agent-start-context/goldens/**` (the successor golden).

## Steps

1. Session-host (tier 3) implements `Contributor` for the handoff. It returns the handoff block when the facts show
   a rotation successor. Register it in `start-contributors.v1.json` with owner `session-host`, `when: {kind: [head]}`,
   a byte budget equal to today's `CONTEXT_LIMIT`, and a timeout.
2. The host wires the adapter in `apps/fgos/src/wiring/start_context/`.
3. Remove the separate handoff text in `session_rotation_hook.rs` and the ritual's pointer that delivers it a second
   time. Rotation passes the handoff only as a contributor input.
4. Update the successor golden so that it shows the handoff once. Add a test where the contributor fails and is left
   out and recorded.

## Verify

- `cargo test -p fgos-session-host -p fgos-agent-start-context` passes, and so does
  `node scripts/run-tests.mjs test/session-rotation/rotate.test.mjs`.
- The successor golden contains the handoff text exactly once.

## Rollback

Revert the commit. The SessionStart handoff text comes back with it.

## Result (2026-11-27, fg-server)

Done. `HandoffContributor` (`packages/session-host/rust/src/rotation/contributor.rs`) answers the latest handoff of
the lineage for a head whose `agentLifecycle` is `rotate`. Two choices differ from the steps above:

- The row's `when:` is `{sessionType: [head], agentLifecycle: [rotate]}`, because `kind` became `sessionType` in
  when-keys v2.
- Its budget is 40000 bytes, not 10000. The handoff is already cut to 10000 characters, and a Vietnamese handoff
  under that cut can exceed 10000 bytes, which would drop it.

The host door builds one adapter per registered row for each start, and closes over the session name from the
request's `session` payload, because the port passes facts only. The crate reads the rows from the embedded contract
(`registered_contributors`).

The SessionStart hook now prints only the "answer the rotation" instruction while a rotation waits for it, and never
the handoff. The ritual's first line points to the opening's last section and keeps the file path as a fallback.

The failed-contributor case keeps its owner in `compose_vectors.rs` (a failure and a timeout are left out and listed
in `dropped`). The door's wiring proof is in `apps/fgos/tests/start_context.rs`.

