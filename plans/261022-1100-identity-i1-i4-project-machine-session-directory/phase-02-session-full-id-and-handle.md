---
phase: 2
title: "Session full id and session handle (rung I3a)"
status: pending
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 02: Session full id and handle (I3a)

## Goal
`fgos identity session --json` prints the session full id `<machine-id>/<local id>` and a handle `<cli>-<4 chars>@<machine-handle>` that never changes for the same session, so any agent can paste it into the board right away.

## Design
- **Local id:** `fgos_session_identity::resolve_current` unchanged (spec decision 1).
- **Which env variable won:** one additive public field `env_var: Option<&'static str>` on `WriterIdentity` in `packages/session-identity/rust/src/resolve.rs`, set where `env_identity` picks the value. This avoids copying the private `usable()` rule (red-team finding 10). It touches only `resolve.rs`, not T1 phase 6's `Cargo.toml` or `proc_tree.rs`; announced to HARDEN in the phase 01 board line. The field is not serialized into the `{id, source}` answer.
- **CLI part:** a constant set in the crate with its own test: `CLAUDE_CODE_SESSION_ID` gives `claude`, `CODEX_THREAD_ID` gives `codex`, an `FGOS_SESSION_ID` starting with `att-` gives `worker`, any other `FGOS_SESSION_ID` gives `fgos`, a pid id gives `shell`.
- **Suffix:** the first 4 characters of lowercase base32 of sha256(local id) (20 bits). A printed handle never changes; phase 04 refuses a second live session with the same handle instead of lengthening it, and `resolve` reports both full ids.
- **Pid ids:** local part `pid-<hash>` where the hash covers boot id, pid and start time from `fgos_process::facts::identity_of` (`facts.rs:285`, `ProcTuple.boot_id` at `:36`), so a reboot or a reused pid gives a new id. `fgos-process` becomes a dependency here.
- **Unresolved:** `source: unresolved` has no session id or handle: `identity session` exits 65 with reason `unresolved`; bare `fgos identity` returns `session: null`.
- **Bare `fgos identity`:** still `{id, source}`, plus optional `machine` and `session` objects. Contract `session-identity.resolve` goes to `1.1.0` with both new keys optional in both outcome branches (`packages/session-identity/contracts/session-identity.resolve.v1.json` and its golden stay where they are). A missing machine id gives `machine: null` and exit 0, never an error and never a mint. The bare verb writes nothing. Measure its cold start against the board's 10 ms gate (row 5.1) before and after, and record both numbers.
- **Convention kinds:** only the parts that fit one character class: `session-suffix` (first and rest `a-z2-7`, max 4). The `<cli>-<suffix>@<machine-handle>` composition is Identity's and tested once in `tests/session.rs`.

## Files
- Create: `packages/session-identity/rust/src/session.rs`, `tests/session.rs`.
- Modify: `packages/session-identity/rust/{Cargo.toml,src/lib.rs,src/provider.rs}`, `Cargo.lock`, `packages/session-identity/rust/src/resolve.rs` (additive field), `packages/session-identity/contracts/session-identity.{resolve,golden}.v1.json`, `packages/session-identity/rust/tests/golden.rs`, `packages/host-runtime/rust/src/catalog.rs` (contract `1.1.0`), `packages/convention/contracts/convention.{rules,golden}.v1.json`, `apps/fgos/src/cli_projector.rs`, `apps/fgos/tests/cli_tests.rs`, `docs/platform/identity/spec.md` section 4, `docs/platform/session-identity/spec.md` section 4, `CHANGELOG.md`.

## Verification
- `cargo test -p fgos-session-identity -p fgos-session-identity` (each env source gives its CLI; same id gives the same handle; pid id changes with boot id; unresolved gives no handle; bare answer with an empty state root returns `{id, source}`, `machine: null`, exit 0).
- `FGOS_SESSION_ID=a npm run fgos:dev -- identity session --json </dev/null` and the same with `b` print different handles; each run twice prints the same handle.
- `node scripts/run-tests.mjs test/util/session-identity.test.mjs test/setup/writer-identity-doctor-check.test.mjs` stays green; cold-start numbers in the phase report.

## Landing (phases 01-02 together)
- Land on main through the main door; stage and activate the release on all three machines; record machine handle, release and date per machine in the IDENT board row.
- Each machine runs `fgos doctor --fix`, then posts one board log line with the output of `fgos identity machine --json` and `fgos identity session --json` (the first machine roster). If two handles collide, one machine sets `--alias` before posting.
- Post an `IDENT` line to MAIL (`f2c6f8ce`) and HARDEN (`forgent-a8`): the handles exist, how to read them, the route owner moved, `session-identity.resolve` is `1.1.0` with optional fields.

## Risk and rollback
- The hook path (`.githooks/pre-commit:555`) and the doctor row read the bare answer; it keeps its required fields and never fails on a missing machine id, and a test owns that. Rollback: revert; this phase writes no state.
