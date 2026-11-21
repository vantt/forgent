# Phase 2: Head verbs through the request socket

Capability: `code:implement`.

Closes `p-ndortdckid` (code half), `p-vquz26ibnn` item (2), and the grant half of item (c).

## Inputs

- `src/session-host/head-grants.mjs`: `HEAD_VERBS`, `GRANTS`, `LEAD_VERBS` (the one source of grants).
- `src/session-host/head-request-client.mjs` (verb constants), `src/session-host/head-request.mjs`
  (`runHeadRequest` switch; `metricsRecordVerb` and `hostCall` as the pattern for a verb the host performs).
- `apps/fgos/src/routing.rs`, `confined_head_call` (maps a confined CLI call to a socket verb and its args).
- `packages/run-supervisor/contracts/head-request.v1.json`, `verbs` (the documented verb surface).
- `fgos friction record --help` and `fgos config patch --help` for the flags the host owns.
- `packages/observe/rust/src/friction.rs` and `src/observe/friction-client.mjs` for today's fail-open rule.
- Owner decisions 2026-11-21 17:39: `config patch` joins the supervisor grant; heads record friction themselves through the
  socket, the supervisor does not collect it for them.

## Footprint

`src/session-host/head-grants.mjs`, `src/session-host/head-request.mjs`, `src/session-host/head-request-client.mjs`,
`test/session-host/head-grants.test.mjs`, `test/session-host/head-request.test.mjs`, `apps/fgos/src/routing.rs`,
`packages/run-supervisor/contracts/head-request.v1.json`, `docs/platform/session-host/spec.md`.

## Steps

1. Grants: add `friction record` to `HEAD_VERBS`, so every head (secretary, supervisor, shaper, planner and lead through
   `LEAD_VERBS`) holds it. Add `config patch` to the supervisor row only. Add `supervisor raise` to `LEAD_VERBS`.
2. Route: in `head-request.mjs` add two verbs. `friction record` checks its args with `exactKeys` against the flags the
   host takes and runs `fgos friction record ... --json` through `hostCall`, outside the sandbox. `config patch` does the
   same for `fgos config patch`. The host's own validation stays the authority; the route re-checks only shape and
   bounds, because the args come from the sandbox. `supervisor raise` needs no route change.
3. Transport: in `routing.rs`, map `("friction", Some("record"))` and `("config", Some("patch"))` to their socket verbs
   when a head socket is present, carrying their flags as args. Keep every other mapping unchanged.
4. Contract: add both verbs to `head-request.v1.json` `verbs` with their args, and note the lead's `supervisor raise`.
5. Fail-open: a confined `friction record` that the socket refuses or that fails returns its code and exits non-zero, as
   the unconfined verb does today; nothing retries.
6. Tests: extend the owning tests. `head-grants.test.mjs` covers the new grant lines. `head-request.test.mjs` covers each
   new verb: it runs the host with the expected argv, and bad args are refused `bad-args`. The `routing.rs` unit tests
   cover the two new mappings. Add one test that a confined head records a friction that `friction list` then shows (the
   row's done-when). Use the existing fake socket server of `head-request.test.mjs`; do not add a second harness.
7. Docs: `docs/platform/session-host/spec.md`, the head grants section, names the three new verbs and who holds them.

## Verify

`node scripts/run-tests.mjs test/session-host/head-grants.test.mjs test/session-host/head-request.test.mjs` and
`cargo test -p fgos --lib routing` pass. A `verb-not-granted` reply names `friction record` as granted for a planner.

## Rollback

Revert the phase commit. The grant table, the route and the mapping return together.
