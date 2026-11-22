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

## Added 2026-11-22 12:28 (owner-approved via lead:SUPERVISOR): `config patch` held to the project file by the host

The route-side guard for the supervisor's `config patch` was removed in review: it copied the host's key-to-file
resolution and could be bypassed (bracket-quoted paths, the patch file swapped between two reads, symlinks). The owner
approved the recommended answer to `q-va5vu7zeza` at 12:28: the host gains a `--project-only` flag on `config patch`, and
the confined route always passes it. `config patch` stays out of the supervisor grant until the flag has landed.

Footprint addition (landed by the supervisor, since a lead's paths land refuses a footprint change):
`packages/config/rust/src/provider.rs`, `packages/config/rust/src/provider/unix_verbs.rs`,
`packages/config/contracts/fixtures/scope.v1.json`, `packages/config/rust/tests/golden_scope.rs`,
`apps/fgos/src/cli_projector.rs`, `packages/host-runtime/contracts/command-manifest.json`, `docs/platform/config/spec.md`.

8. Host flag: `fgos config patch <file> --project-only` refuses, before any write and with the file byte-identical, when
   any edit's target (`target_of`, the one resolution) is not the project config file (a `global-only` key, an accounts
   key, or `--global`), with one refusal code named in the scope fixture. Without the flag nothing changes.
9. Owning proof: rows in `packages/config/contracts/fixtures/scope.v1.json` read by `golden_scope.rs`: a project key
   passes, a global-only key and an accounts key are refused, `--project-only --global` is refused. One parse test in
   `cli_projector.rs` for the flag. The manifest and `docs/platform/config/spec.md` name the flag.
10. After 8 lands: `config patch` joins the supervisor row of `GRANTS`; the route (`head-request.mjs`) runs the host's
    `config patch <file> --project-only --json` through `hostCall`, checking only arg shape; `routing.rs` maps
    `("config", Some("patch"))`; contract and session-host spec name it; tests as in step 6. The host is the only
    authority for which file a key lives in.

Owner answer `q-eyb5i7m7wq` (2026-11-22): the supervisor lands the seven-path widen. Landed in `9a30bd755`; steps 8-10
run on a fresh branch cut at the trunk tip.
