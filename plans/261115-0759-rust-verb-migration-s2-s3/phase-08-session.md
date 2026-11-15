---
phase: 8
title: "`session start|end|list|gc` native"
status: completed
effort: 3d
wave: B
step: S3
blockedBy: [0]
flipAfter: [1]
---

# Phase 08: `session` native

Per-session checkouts (a detached-HEAD linked worktree whose `.fgos` is a symlink to the main store, recorded in
`.fgos/sessions.json` under the `sessions` kernel lock) move to the host. The registry is runner state, not a Git
fact (Git spec: Git "owns neither business approval nor Work lifecycle, claim/state transaction",
`docs/platform/git/spec.md:66`; "no consumer imports", 70), so its owner is a host module,
`apps/fgos/src/wiring/session.rs`, over the lower doors (Git Worktree port, holder-lock `sessions` lock, Durable
File, the host's Event Store trigger). Node's three readers keep `listSessions`, now a client of the host verb over
`invokeHost` (`src/util/host-bin.mjs:52`), the pattern `src/convention/convention-client.mjs:21` and
`src/observe/friction-client.mjs:39` already use: one reader, no addon entry. S6a moves the module into the Execution
crate if one exists then (decision history entry).

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s3-p08`. Report slug `s3-p08-session`.

## Context

- Registry `src/cli/command-registry.mjs:2189-2234`: `start [--item <id>]`, `end <session-id> [--force]`, `list`, `gc`;
  `store: 'none'`, `mutatesStore: ['start', 'end', 'gc']`.
- Arm `bin/fgos.mjs:3546-3572`: root `process.cwd()` (`--dir` ignored: keep, parity); `SessionError` -> exit 4;
  `end` warnings also printed with `console.warn`; `list` returns the raw registry array.
- `src/runner/session.mjs` (516 lines): `SESSIONS_FILE` :44, `sessionSummary` :73, `acquireSessionsLock` :125,
  `writeRegistry` :164-167 (`writeFileSync`, not atomic), `createSession` :231 (takes and releases the `sessions` lock
  around `addWorktreeSync`, `src/runner/repo-locks.mjs:105`), `endSession` :336 (shutdown seal
  `maintainEventStore(..., { shutdown: true })` :387, outside the lock), `listSessions` :392, `reclaimOrphanedSessions` :417.
- Readers that stay Node until S7: `src/verbs/merge/approve.mjs:232`, `src/runner/merge.mjs:1033`,
  `src/state/postland-drift.mjs:57`, and the `return` arm (`bin/fgos.mjs:3253`) (`listSessions`, reading registry fields). Lock ranks: `sessions` 80 (a leaf),
  `main-checkout` 50; the host child takes only `sessions`, so a merge that holds `main-checkout` while it asks is safe.
- A second Rust reader exists: `packages/identity/rust/src/resolve.rs:2, 22` reads `<fgos_dir>/sessions.json` read-only
  to confirm an env session id.
- CLI contract users: `apps/fgos-gateway/src/gateway.rs:1091, 1115` (`fgos session start|end --json` through
  `fgos_command`, parsing `data`); the CLI test harness (`test/cli/helpers/fgos-cli-harness.mjs:28`, re-exported at 1200).
- Store admission refuses `session start|end|gc` from a frozen linked worktree (rows in
  `test/rust-host/fixtures/store-declaration-vectors.json`; `store_admission.rs`).

## Requirements

1. `apps/fgos/src/wiring/session.rs`: `start`, `end`, `list`, `gc` with Node's rules (detached worktree through the Git
   Worktree port under `worktree-admin`; `.fgos` symlink, never a copy; nesting refusal; divergence check and retained
   ref on `end`; orphan reclaim on `gc`); the registry read and written under the holder-lock `sessions` lock, written
   through Durable File (D10 edge; atomic; same JSON shape, so an older release and the identity reader read it). The
   nesting refusal of `start` and the self-mount guard of `gc` use the **caller's** directory (Node's `process.cwd()`,
   `session.mjs:255-259, 437-441`), never the root the doors resolved. For `end`, the shutdown seal through the host's
   one trigger door `invocation_doors::EventStoreLifecycle::trigger` with `Policy { shutdown: true, .. }` only (`end`
   false, so no publish child starts; `packages/event-store/rust/src/lifecycle.rs:35-41`), outside the `sessions` lock,
   also when `end` fails (Node's `finally`), never a second `maintain` call site. The registry row shape is added to the
   identity contract that already names the file (`packages/identity/contracts/identity.writer.v1.json:26`), with rows
   (registry documents, the `list` answer, the summary, the `sessionId` the identity reader takes) read by this module's
   tests and by `packages/identity/rust` tests; no second contract file.
2. `src/runner/session.mjs` shrinks to `listSessions(repoRoot)` = `invokeHost(['session', 'list'], { dir: repoRoot })`
   (and `sessionSummary` only if 00 F10 finds a reader); everything else goes.
3. Host: operations `session.start|end|gc` (write) and `session.list` (read), projector from `cli_args`;
   `NATIVE_SUBCOMMANDS`; annotation `{ owner_path: "apps/fgos" }`; `native: true`; `end` warnings to stderr.
4. Test helpers: `fgos-cli-harness.mjs` re-exports `createSession`/`endSession` (1200) and about 30 test files use
   them (`rg -l "createSession|endSession" test`: 33 files on `e6b78d1d1`); the harness keeps both names and
   signatures, implemented over the host verb (`run(['session', 'start', ...])`, which `cliEntryFor` routes to the host
   once the verb is native), so those files do not change. `test/setup/checks.test.mjs:33, 287` imports from the
   harness instead of `session.mjs`.
5. Parity `session.cases.mjs` (fresh repo per entry, `fs-delta` on the repo and its `.fgos`): start with and without
   `--item`, bare `--item`; start from inside a session worktree and from a subdirectory of one (refused); list; end
   clean; end without an id; end with a diverged session (retained ref, warning) and `--force`; gc with an orphan; gc run
   from inside a live session worktree (the session survives); end of an unknown id; missing/unknown sub;
   `--dir <other project>` from a subdirectory; from a frozen worktree (admission refusal). A test asserts `end`
   starts no `events sync` child.
6. `cargo test -p fgos-gateway` green, and one gateway case (existing, or added to the gateway's own tests if 00 F10
   finds none) drives `POST /v1/sessions` against the real host and shows the parsed `data` unchanged.
7. Delete: the arm; the import at `bin/fgos.mjs:109` narrows to `listSessions` (the `return` arm still calls it,
   `bin/fgos.mjs:3253`), so the `ARM_STATIC_IMPORTS` line (`test/architecture.test.mjs:1697`) stays; the Node writer code, the `test/runner/session.test.mjs` cases whose behaviour moved (18; names and owners in the
   report; one `listSessions` client case stays).
8. `doors` row "per-session checkout registry": patterns `sessions\.json` (string literal), `\bSESSIONS_FILE\b`,
   `export function (?:createSession|endSession|reclaimOrphanedSessions)\b`; allowed `apps/fgos/src/wiring/session.rs`,
   `packages/identity/rust/src/resolve.rs` (reason: read-only confirmation of an env session id; same vector file),
   `src/cli/command-registry.mjs` (reason: description text), `src/util/session-identity.mjs` and
   `src/runner/worktree.mjs` only if their matches are comments (the check drops comments; otherwise reasons).

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| create / end / list / gc, locking, divergence, `.fgos` symlink, nesting (18) | `test/runner/session.test.mjs` | `wiring/session.rs` tests (temp repos, real Git) + the contract rows; one Node client case stays |
| identity confirms an env id from the registry | identity tests | unchanged + the shared vector rows |
| store admission of session shapes | vector rows + `store_admission.rs` | unchanged |
| gateway sessions route | `apps/fgos-gateway` tests | unchanged + requirement 6 |

## Files

- Create: `apps/fgos/src/wiring/session.rs`, `session.cases.mjs` (deleted by 12).
- Modify: `apps/fgos/src/wiring/mod.rs`, `apps/fgos/Cargo.toml` (D10, if first), `apps/fgos/tests/cli_tests.rs` (one
  case), `packages/identity/contracts/identity.writer.v1.json`, host files per the recipe, `src/runner/session.mjs`, `bin/fgos.mjs`,
  `test/cli/helpers/fgos-cli-harness.mjs`, `test/setup/checks.test.mjs`, `test/runner/session.test.mjs`,
  `packages/identity/rust` tests (read the vector file), `test/architecture.test.mjs`, `docs/architecture-manifest.json`, census.
- Delete: none whole (the module shrinks to the client).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos -p fgos-identity -p fgos-gateway --all-targets -- -D warnings`;
  `cargo test -p fgos -p fgos-identity -p fgos-gateway`; msvc and darwin checks (symlinks on Windows: Node's behaviour, 00 F10)
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/runner/session.test.mjs test/setup/checks.test.mjs test/cli/fgos-disconnected-worktree-guard.test.mjs test/direct/merge-gate.test.mjs test/rust-host/command-routes.test.mjs test/cli/subcommand-flag-drift.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
  plus every test using the harness's session helpers (`rg -l "createSession|endSession" test`) and the merge,
  approve and postland-drift tests (`rg -l "listSessions|detectPostLandDrift" test`).

## Risk and rollback

- Node readers see a different registry shape (M x H): `list` answers the raw registry as today; vector file; client test.
- A merge now spawns the host for `listSessions` (L x M): one spawn per Land (about 10-30 ms); the host takes only the `sessions` leaf lock.
- Gateway REST sessions break (M x H): requirement 6.
- Rollback: revert the phase; the registry format is unchanged.
