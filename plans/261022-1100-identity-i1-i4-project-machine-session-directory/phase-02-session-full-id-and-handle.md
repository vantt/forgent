---
phase: 2
title: "Session full id and session handle (rung I3a)"
status: pending
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 02: Session full id and handle (I3a)

## Goal
`fgos identity session --json` prints the session full id `<machine-id>/<local id>` and a handle `<cli>-<3 chars>@<machine-handle>` that is the same every time the same session asks, so any agent can paste it into the board right away.

## Design
- Local id: `fgos_session_identity::resolve_current` unchanged (spec decision 1; T1 phase 6 changes only how Node calls it).
- CLI part from the source of the local id: `CLAUDE_CODE_SESSION_ID` gives `claude`, `CODEX_THREAD_ID` gives `codex`, an `FGOS_SESSION_ID` starting with `att-` gives `worker`, any other `FGOS_SESSION_ID` gives `fgos`, a pid id gives `shell`. Session Identity returns which variable won, so this needs one additive field in its `WriterIdentity` (`env_var`) — a crate change; it is additive and coordinated with HARDEN through the board, or, if HARDEN asks to wait, derived inside the identity crate by re-reading the env order (`ENV_ORDER` is public).
- Chars: the first 3 characters of base32(sha256(local id)), lowercase. Deterministic, no state, no directory. 32768 values per CLI per machine; collisions among live sessions are handled in phase 04 by lengthening to 4.
- Full id: `<machine-id>/<local id>`; for a pid id the local part is `pid-<pid>-<start time>` from `fgos_process::facts::identity_of`, so a reused pid gives a new id.
- Bare `fgos identity` keeps `{id, source}` and adds `machine` and `session` objects (additive; the Node parser in `src/util/session-identity.mjs:60-67` reads only `id` and `source`). Contract `session-identity.resolve.v1.json` gets the additive fields under the identity crate's contract; goldens extended.
- Convention kinds: `cli-name` (fixed set: claude, codex, agy, pi, omp, worker, fgos, shell) and `session-suffix` (first/rest `a-z2-7`, max 4).

## Files
- Modify: `packages/identity/rust/src/{lib.rs,provider.rs}`, create `packages/identity/rust/src/session.rs` and `tests/session.rs`, `packages/identity/contracts/identity.session.v1.json`, `packages/convention/contracts/convention.{rules,golden}.v1.json`, `apps/fgos/src/cli_projector.rs`, `apps/fgos/tests/cli_tests.rs`, `docs/platform/identity/spec.md` section 4, `CHANGELOG.md`. Possibly `packages/session-identity/rust/src/resolve.rs` (one additive field), only after the board note to HARDEN.

## Verification
- `cargo test -p fgos-identity` (vectors: each env source gives the expected CLI and a stable handle; pid id includes start time).
- Two live sessions on one machine: `FGOS_SESSION_ID=a npm run fgos:dev -- identity session --json </dev/null` and the same with `b` print different handles; running each twice prints the same handle.
- `node scripts/run-tests.mjs test/util/session-identity.test.mjs test/setup/writer-identity-doctor-check.test.mjs` stays green.

## Landing (phases 01-02 together)
- Land on main through the main door, stage and activate the release on all three machines; record machine handle, release and date per machine in the IDENT board row.
- Each machine posts one board log line with the output of `fgos identity machine --json` and `fgos identity session --json` (the first machine roster).
- Post an `IDENT` line to MAIL (`f2c6f8ce`) and HARDEN (`forgent-a8`): the handles exist, how to read them, and that the `identity` route owner moved.

## Risk and rollback
- A changed `identity` answer could break the doctor row `writer-identity-resolvable`; the additive-field rule and its test guard it. Rollback: revert; no state is written by this phase.
