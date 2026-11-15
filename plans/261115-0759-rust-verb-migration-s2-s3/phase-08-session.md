---
phase: 8
title: "`session start|end|list|gc` native"
status: pending
effort: 3d
wave: B
step: S3
blockedBy: [0]
flipAfter: [1]
---

# Phase 08: `session` native

Per-session checkouts (a detached-HEAD linked worktree whose `.fgos` is a symlink to the main store, recorded in
`.fgos/sessions.json` under the `sessions` kernel lock) move to Rust. The registry gets one owner in `fgos-git`
(the crate whose Worktree port creates the checkout and whose admission already recognises a session worktree,
`packages/git/rust/src/store_admission.rs:166`); Node's three readers keep `listSessions`, now an addon call. The
host composes the shutdown seal (the Event Store depends on `fgos-git`, so `fgos-git` cannot call it).

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s3-p08`. Report slug `s3-p08-session`.

## Context

- Registry `src/cli/command-registry.mjs:2189-2234`: `start [--item <id>]`, `end <session-id> [--force]`, `list`, `gc`;
  `store: 'none'`, `mutatesStore: ['start', 'end', 'gc']`.
- Arm `bin/fgos.mjs:3546-3572`: root `process.cwd()` (`--dir` ignored: keep, parity); `SessionError` -> exit 4;
  `end` warnings also printed with `console.warn`; `list` returns the raw registry array.
- `src/runner/session.mjs` (516 lines): `SESSIONS_FILE` :44, `sessionSummary` :73, `acquireSessionsLock` :125,
  `writeRegistry` :164-167 (`writeFileSync`, not atomic), `createSession` :231, `endSession` :336 (shutdown seal
  `maintainEventStore(..., { shutdown: true })` :387, outside the lock), `listSessions` :392, `reclaimOrphanedSessions` :417.
- Readers that stay Node until S7: `src/verbs/merge/approve.mjs:57`, `src/runner/merge.mjs:47`,
  `src/state/postland-drift.mjs:9` (`listSessions`, reading registry fields).
- CLI contract users: `apps/fgos-gateway/src/gateway.rs:1091, 1115` (`fgos session start|end --json` through
  `fgos_command`, parsing `data`); test helpers `test/cli/helpers/fgos-cli-harness.mjs:28` and
  `test/setup/checks.test.mjs:33` import `createSession`/`endSession`.
- Store admission refuses `session start|end|gc` from a frozen linked worktree (vector rows exist,
  `test/rust-host/fixtures/store-declaration-vectors.json`; `store_admission.rs` "store-mutating verb that needs no store").

## Requirements

1. `packages/git/rust/src/session_checkout.rs`: `start`, `end`, `list`, `gc` with Node's rules (detached worktree via
   the Worktree port under `worktree-admin`; `.fgos` symlink, never a copy; divergence check and retained ref on `end`;
   orphan reclaim on `gc`), the registry read and written under the holder-lock `sessions` lock, written through Durable
   File (atomic; same JSON shape, so an older release reads it). A vector file
   `test/rust-host/fixtures/session-registry-vectors.json` (registry documents and the summary each yields) read by the
   Rust tests and by the Node adapter test, unless 00 F10 finds an existing contract to extend.
2. Addon `packages/git/node-addon/src/session.rs` (new file, one `mod` line in the addon `lib.rs`): `listSessions`;
   `src/runner/session.mjs` keeps `listSessions` (and `sessionSummary` if 00 F10 finds a reader) as addon calls and
   loses everything else; `SessionError` stays only if a reader catches it.
3. Host: operations `git.session.start|end|gc` (write) and `git.session.list` (read), provider in
   `apps/fgos/src/wiring/session.rs` which runs the crate call, then, for `end`, the shutdown maintain through
   `fgos_event_store::lifecycle` (`Policy { end: true, shutdown: true }` or the crate's equivalent; 00 F10 checks the
   policy fields) outside the `sessions` lock, as Node; `end` warnings to stderr; projector from `cli_args`;
   `NATIVE_SUBCOMMANDS`; annotation; `native: true`.
4. Test helpers: `fgos-cli-harness.mjs` re-exports `createSession`/`endSession` (1200) and about 30 test files use
   them through it (`rg -l "createSession|endSession" test`, 33 files on `e6b78d1d1`); the harness keeps both names
   and signatures, implemented over the host verb (`run(['session', 'start', ...])`, which `cliEntryFor` routes to the
   host once the verb is native), so those files do not change. `test/setup/checks.test.mjs:33, 287` does the same
   through the harness. No Node copy of the writer survives for tests.
5. Parity `session.cases.mjs` (fresh repo per entry, `fs-delta` on the repo and its `.fgos`): start with and without
   `--item`; list; end clean; end with a diverged session (retained ref, warning) and `--force`; gc with an orphan;
   end of an unknown id; missing/unknown sub; from a frozen worktree (admission refusal).
6. `cargo test -p fgos-gateway` green, and one gateway case (existing, or added to the gateway's own tests if none
   exists, 00 F10) that drives `POST /v1/sessions` against the real host shows the parsed `data` unchanged.
7. Delete: the arm, the `createSession|endSession|reclaimOrphanedSessions|sessionSummary` import (`bin/fgos.mjs:109`)
   and its `ARM_STATIC_IMPORTS` line (`test/architecture.test.mjs:1697`), the Node writer code, `test/runner/session.test.mjs`
   cases now owned in Rust (18; names in the report; the adapter keeps one case).
8. `doors` row "session checkout registry": patterns `sessions\.json`, `\bSESSIONS_FILE\b`,
   `export function (?:createSession|endSession|reclaimOrphanedSessions)\b`; allowed `session_checkout.rs`,
   `packages/git/node-addon/src/session.rs` (reason: carries the door), `src/runner/session.mjs` (reason: adapter for
   three Node readers); `retiredBy: "S7: the Node readers move with merge, approve and postland drift"`.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| create / end / list / gc, locking, divergence, `.fgos` symlink (18) | `test/runner/session.test.mjs` | `session_checkout.rs` tests (temp repos, real Git) + registry vectors; one adapter case stays |
| store admission of session shapes | vector rows + `store_admission.rs` | unchanged |
| gateway sessions route | `apps/fgos-gateway` tests | unchanged + requirement 6 |

## Files

- Create: `packages/git/rust/src/session_checkout.rs`, `packages/git/node-addon/src/session.rs`,
  `apps/fgos/src/wiring/session.rs`, `test/rust-host/fixtures/session-registry-vectors.json` (per requirement 1), `session.cases.mjs` (deleted by 12).
- Modify: `packages/git/rust/src/lib.rs`, `packages/git/node-addon/src/lib.rs`, `apps/fgos/src/wiring/mod.rs`, host
  files per the recipe, `src/runner/session.mjs`, `bin/fgos.mjs`, `test/cli/helpers/fgos-cli-harness.mjs`,
  `test/setup/checks.test.mjs`, `test/runner/session.test.mjs`, `test/architecture.test.mjs`,
  `docs/architecture-manifest.json`, census.
- Delete: none whole (the module shrinks to the adapter).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-git -p fgos-node-addon -p fgos -p fgos-gateway --all-targets -- -D warnings`;
  `cargo test -p fgos-git -p fgos -p fgos-gateway`; msvc and darwin checks (symlinks on Windows: Node's behaviour, 00 F10)
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/runner/session.test.mjs test/setup/checks.test.mjs test/cli/fgos-disconnected-worktree-guard.test.mjs test/direct/merge-gate.test.mjs test/rust-host/command-routes.test.mjs test/cli/subcommand-flag-drift.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
  plus every test using the CLI harness's session helper (`rg -l "startSession|createSession" test`), and the merge,
  approve and postland-drift tests (`rg -l "listSessions" test`).

## Risk and rollback

- Node readers see a different registry shape (M x H): same JSON, vector file, adapter test.
- Gateway REST sessions break (M x H): requirement 6.
- Rollback: revert the phase; the registry format is unchanged.
