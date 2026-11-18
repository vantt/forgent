# Phase 01: one worktree door in Rust

Wave 1. No phase dependency. Lands on `main` only together with phase 02, as one series (F1: no window with two
provisioning doors). Effort 3d.

## Context

Three doors make checkouts today: `session start` (Rust, `apps/fgos/src/wiring/session.rs:352-398`, detached, never
provisions), Node `fgos worktree create` (`src/verbs/worktree/create.mjs:6-16`, provisions through
`src/runner/worktree.mjs:268`), Node `createWorktree` and friends (`src/runner/worktree.mjs:852,1213,1330,1366`). All
sit on `GitDriver` (`packages/git/rust/src/worktree.rs:689,705,983`). D1: `fgos worktree` becomes the one door. D2:
`create` provisions by default; `--bare` makes a checkout with no provisioning. Git spec `:81`, `:177`, `:551`, `:553`,
G-032, G-100: Git create ends at registration and `.fgos` strip; provisioning is Execution, outside every Git lock.
P1: the engine is the new crate `fgos-checkout` at `packages/execution/checkout`. Prior art: S2 phase 06
(`plans/261115-0759-rust-verb-migration-s2-s3/phase-06-worktree.md:31-33,44-52`) planned the same provisioning port and
listed the exit codes and parity cases; it never landed (S23-Q1 moved `worktree` to S6a).

This phase builds create/provision/remove/resync and the verbs; phase 02 adds leftovers, orphan reclaim, the
claim/dispatch/verify creators and the Node wrappers, and deletes the Node provisioning code.

## Requirements

- Crate `fgos-checkout` (`packages/execution/checkout/{Cargo.toml,src/lib.rs,src/create.rs,src/provision.rs,src/remove.rs,src/resync.rs,src/record.rs,tests/*.rs}`),
  deps per [phase-lead-rules.md](phase-lead-rules.md). API: `create(request) -> Created` (branch or detached, base,
  `provision: Provision::Full|None`), `provision(path, repo_root, state_root, disposable)`,
  `remove(path, delivered_to, discard_ignored)` with set-aside of recorded bytes, `resync(repo_root, worktree, branch)`.
- Provisioning ports `provisionDependencies` (`worktree.mjs:115`), `runWorktreeSetupCommands` (`:147`, `FGOS_REPO_ROOT`
  set to the main checkout, commands read through `fgos-config` `worktreeSetup.commands`, spawned through the
  `fgos-process` bounded-child door), `provisionSkillRoots` (`:185`), the record (`:219-290`, same path and JSON shape)
  and set-aside (`:291-402`).
- Record key and identity (F2): the record file name ports `realpathOrSelf` exactly (`worktree.mjs:429-437`: realpath,
  `\\?\` prefix strip at `:440`, `path.normalize`), never Rust's raw `canonicalize`; `identity {dev, ino}` is written and
  compared as Node did (`:282`, `:291-297`): the values Node's `fs.statSync` reports on that OS, rounded to f64 the way a
  JS number rounds them. Vectors include an inode above 2^53 and a `\\?\` path. A record written by Rust is read by
  Node `readProvisioningRecord` and the reverse, both proven while both exist (phase 02 deletes the Node reader in the
  same series).
- No Git lock is held while dependency install or setup commands run.
- Failing setup command fails the verb and leaves the created checkout in place (spec `:177`).
- npm (V20): no doctor row. The Node payload already runs `npm ci|install` only when the checkout's `package.json` has
  dependencies (`worktree.mjs:115-146`), with no row today; the runtime dependency is unchanged, only its caller moves.
  A failed install surfaces as the verb error, as today. No config key added.
- Host verbs (native routes): `fgos worktree create <path> [--branch <name> | --detach] [--base <ref>] [--bare] [--json]`,
  `fgos worktree remove <path> --delivered-to <ref> [--discard-ignored] [--json]`, `fgos resync-worktree [--dir]
  [--path] [--branch]`. Name, argv, envelope fields and exit codes unchanged (1045 P10 forwards `worktree create`);
  `--bare` is new. Help text of `--bare`: "make the checkout without provisioning (no dependency install, setup
  commands or skill roots)".
- Exit codes (F11, from the S2 list): 4 for arity, missing sub, bare `--branch`, missing `--delivered-to`; 1 for
  `--branch` with `--detach`, an undeliverable ref, an unregistered path and port refusals unless the error carries a
  category; the flag-before-positional mis-parse `--discard-ignored ../w` behaves as Node does (Node reads `../w` as
  the flag's value). Each is a `cli_tests.rs` case with exact exit code and envelope fields.
- Parity against the base release (F11, S2 D1 method): before the Node arm is deleted, the same cases run once against
  the activated base release and once against the dev host; the output table goes in the phase report. The parity
  table file never lands on `main`.
- Deleted in this change: `src/verbs/worktree/**`, the `worktree` and `resync-worktree` arms of `bin/fgos.mjs`, the
  `resyncWorktree` name in the `bin/fgos.mjs:92` import (V9), their registry entries' `legacy` handling, the manifest
  layer entries `docs/architecture-manifest.json:1326-1328`. `test/e2e/resync-worktree-bare-invocation.test.mjs` runs
  `bin/fgos.mjs resync-worktree` directly (`:11-26`); its behaviour ("bare `resync-worktree` from inside a linked
  worktree resolves the main checkout") moves to a `cli_tests.rs` case and the file is deleted (V9).
  `src/runner/worktree.mjs` is not edited here; phase 02 deletes its provisioning and resync bodies.
- CHANGELOG `## [Unreleased]`: "`fgos worktree create --bare` makes a checkout without provisioning; `fgos worktree`
  and `fgos resync-worktree` run in the Rust host."
- Git spec `:177` paragraph updated: the verb is native, `--bare`, the provisioning owner is `fgos-checkout`.

## Files

Footprint in the plan table. New: `packages/execution/checkout/**`, `apps/fgos/src/wiring/worktree.rs`. Edited: root
`Cargo.toml`, `apps/fgos/Cargo.toml`, `apps/fgos/src/{main,routing,cli_projector}.rs`, `wiring/mod.rs`,
`packages/host-runtime/rust/src/catalog.rs`, `src/cli/command-registry.mjs`, `bin/fgos.mjs`,
`docs/architecture-manifest.json` (layer entries of the deleted files), `docs/platform/git/spec.md`, `CHANGELOG.md`.
Deleted: `src/verbs/worktree/**`, `test/verbs/worktree-create.test.mjs`, `test/verbs/worktree-remove.test.mjs`,
`test/e2e/resync-worktree-bare-invocation.test.mjs`. Regenerated: routes, manifest, census, `Cargo.lock`, suite baseline.

## Steps

1. Red: crate tests on real temp repos for create (branch, detached, base forms), provision (deps, setup command env
   and failure, skill roots, record), `--bare` (no record, nothing placed), remove (set-aside, put back on refusal,
   record deleted), resync, "no Git lock held during setup" (hold-probe from the setup command), the record key and
   identity vectors (F2), and reading a record written by the Node `provisionWorktree` (fixture produced by running
   the Node code once, committed as data).
2. Red: `cli_tests.rs` cases: argv shapes and exit codes of `create`/`remove`/`resync-worktree` (F11 list); bare
   `resync-worktree` inside a linked worktree (V9); "a detached checkout without provisioning is created and removed
   through the worktree verb" (`create <tmp path> --bare`, then `remove <path> --delivered-to HEAD`), with a failing
   `node` on `PATH`. The cli cases assert argv mapping and envelopes only; outcomes are owned by the crate tests.
3. Parity run against the base release (report table).
4. Port the code; wire host verbs; flip routes native; regenerate routes.
5. Delete the Node verb files, arms and the e2e file; retire `test/verbs/worktree-*.test.mjs` cases to the Rust
   owners (report table "retired test -> owner now").
6. Docs and CHANGELOG; gates. Hand the branch to phase 02 (it bases on this branch); this phase does not land alone.

## Validation

`cargo test -p fgos-checkout`; `cargo test -p fgos --test cli_tests worktree`; `node scripts/run-tests.mjs
test/rust-host/command-routes.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`; route rows
`worktree`, `resync-worktree` are `native`; `rg -n "createWorktreeUseCase|removeWorktreeUseCase" src bin` empty;
`ls test/e2e/resync-worktree-bare-invocation.test.mjs` fails; lead-rules gates.

## Risk

- Record format or key drift makes Node-provisioned checkouts unremovable: step 1 fixture and F2 vectors.
- Windows remove is unproven until a Windows test run exists (CI runs only `cargo check` for msvc); the F2 vectors
  cover the key and identity arithmetic, not a real NTFS volume. Stated in the report.
- 1045 P10 forwards argv: argv cases in step 2 assert the exact old spellings.

## Rollback

Reverted with phase 02 as one series (see plan.md).
