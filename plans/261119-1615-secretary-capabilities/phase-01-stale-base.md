# Phase 1: Session write refuses a stale base

## Context
Backlog p-vwaujnak4j: Miu's whole-file `session write` of docs/backlog.md was built from an older copy and would have
deleted two newer rows. WIP commit 6cd8d63ab (branch `origin/sv/fix-write-stale-base`, by lead:SUPERVISION) already adds
an optional `base` arg, the `path_oid` port, `write-base-stale`, the fallback compare against the pre-catch-up OID, the
CLI `--base` flag (default: blob OID of the on-disk file) and test stubs. It is unfinished and untested.

## Requirements
1. Start the phase branch from 6cd8d63ab rebased on origin/main; finish, do not restart.
2. Route (`packages/run-supervisor/rust/src/head_request.rs` `write_and_publish`): expected OID = request `base`, else the
   OID read before catch-up; after catch-up and `path_clean`, a differing current OID is refused `write-base-stale`
   with both OIDs in the detail. A malformed `base` (not a 40/64-hex OID) is refused as a bad argument.
3. Route test (`packages/run-supervisor/rust/tests/head_request.rs`): a commit to the file lands between the client's
   read and the write; the write is refused `write-base-stale` and the file keeps the newer commit. Also: matching base
   passes; absent base + move during catch-up refused.
4. CLI: `fgos session write <path> [--base <oid>]`; with no `--base` the CLI hashes the on-disk target. Registry entry
   (`src/cli/command-registry.mjs`) and `test/cli/session-verb.test.mjs` cover the flag.
5. Contract `packages/run-supervisor/contracts/head-request.v1.json` gains `base` and `write-base-stale`;
   docs/platform/session-host/spec.md names them.
6. fgos-secretary skill step 2: record `git hash-object docs/backlog.md` (or `fgos`-equivalent) at copy time and pass it
   as `--base`; on `write-base-stale` re-copy, redo the edit, write again. Rebuild render surfaces (`npm run build:skills`).
7. CHANGELOG `[Unreleased]` line: handed to the supervisor (CHANGELOG.md is outside this plan's footprint).

## Validation
`cargo test -p fgos-run-supervisor` (crate name per Cargo.toml), `cargo test -p fgos --test session_write_publish`,
`node scripts/run-tests.mjs test/cli/session-verb.test.mjs`; clippy -D warnings; census regenerate; msvc check.

## Rollback
Revert the landing commit; old clients without `base` keep working (field optional).
