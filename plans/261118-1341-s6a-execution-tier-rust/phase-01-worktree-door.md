# Phase 01: one worktree door in Rust

Wave 1. Depends on: S5 on `main` only (no phase dependency; P6). Lands on `main` on its own; unblocks plan 0947.
Effort 2.5d.

## Context

Three doors make checkouts today: `session start` (Rust, `apps/fgos/src/wiring/session.rs:352-398`, detached, never
provisions), Node `fgos worktree create` (`src/verbs/worktree/create.mjs:6-16`, provisions through
`src/runner/worktree.mjs:268`), Node `createWorktree` and friends (`src/runner/worktree.mjs:852,1213,1330,1366`). All
sit on `GitDriver` (`packages/git/rust/src/worktree.rs:689,705,983`). D1: `fgos worktree` becomes the one door. D2:
`create` provisions by default; `--bare` makes a checkout with no provisioning. Git spec `:81`, `:177`, `:551`, `:553`,
G-032, G-100: Git create ends at registration and `.fgos` strip; provisioning is Execution, outside every Git lock.
P1: the engine is the new crate `fgos-checkout` at `packages/execution/checkout`.

This phase builds the create/provision/remove/resync part and the verbs; phase 04 adds leftovers, orphan reclaim, the
claim/dispatch/verify creators and the Node wrappers.

## Requirements

- Crate `fgos-checkout` (`packages/execution/checkout/{Cargo.toml,src/lib.rs,src/create.rs,src/provision.rs,src/remove.rs,src/resync.rs,tests/*.rs}`),
  deps per phase-lead rules. API: `create(request) -> Created` (branch or detached, base, `provision: Provision::Full|None`),
  `provision(path, repo_root, state_root, disposable)`, `remove(path, delivered_to, discard_ignored)` with set-aside of
  recorded bytes, `resync(repo_root, worktree, branch)`.
- Provisioning ports `provisionDependencies` (`worktree.mjs:115`), `runWorktreeSetupCommands` (`:147`, `FGOS_REPO_ROOT`
  set to the main checkout, commands read through `fgos-config` `worktreeSetup.commands`, spawned through the
  `fgos-process` bounded-child door), `provisionSkillRoots` (`:185`), the record (`:219-290`, same path and JSON shape,
  so a checkout Node provisioned is removable by Rust) and set-aside (`:291-392`).
- No Git lock is held while dependency install or setup commands run.
- Failing setup command fails the verb and leaves the created checkout in place (spec `:177`).
- Host verbs (native routes): `fgos worktree create <path> [--branch <name> | --detach] [--base <ref>] [--bare] [--json]`,
  `fgos worktree remove <path> --delivered-to <ref> [--discard-ignored] [--json]`, `fgos resync-worktree [--dir]
  [--path] [--branch]`. Name, argv and envelope fields unchanged (1045 P10 forwards `worktree create`); `--bare` is new.
  Help text of `--bare`: "make the checkout without provisioning (no dependency install, setup commands or skill roots)".
- Deleted in this change: `src/verbs/worktree/**`, the `worktree` and `resync-worktree` arms of `bin/fgos.mjs`, their
  registry entries' `legacy` handling. `src/runner/worktree.mjs` is not edited here (not in this footprint, and Work
  callers still use it): its `resyncWorktree`/`resyncClaimWorktree`, `provisionWorktree`, `removeProvisioned` bodies
  go in phase 04 (the only outside caller of `resyncWorktree`, `bin/fgos.mjs:3540`, is deleted here).
- CHANGELOG `## [Unreleased]`: "`fgos worktree create --bare` makes a checkout without provisioning; `fgos worktree`
  and `fgos resync-worktree` run in the Rust host."
- Git spec `:177` paragraph updated: the verb is native, `--bare`, the provisioning owner is `fgos-checkout`.

## Files

Footprint in the plan table. New: `packages/execution/checkout/**`, `apps/fgos/src/wiring/worktree.rs`. Edited: root
`Cargo.toml`, `apps/fgos/Cargo.toml`, `apps/fgos/src/{main,routing,cli_projector}.rs`, `wiring/mod.rs`,
`packages/host-runtime/rust/src/catalog.rs`, `src/cli/command-registry.mjs`, `bin/fgos.mjs`,
`docs/architecture-manifest.json` (layer entries of the deleted files), `docs/platform/git/spec.md`, `CHANGELOG.md`.
Regenerated: routes, manifest, census, `Cargo.lock`, suite baseline.

## Steps

1. Red: crate tests on real temp repos for create (branch, detached, base forms), provision (deps, setup command
   env and failure, skill roots, record), `--bare` (no record, nothing placed), remove (set-aside, put back on refusal,
   record deleted), resync, "no Git lock held during setup" (hold-probe from the setup command), and reading a record
   written by the Node `provisionWorktree` (fixture produced by running the Node code once, committed as data).
2. Red: `cli_tests.rs` cases: argv shapes of `create`/`remove`/`resync-worktree`; "a detached checkout without
   provisioning is created and removed through the worktree verb" (the session-style flow: `create <tmp path> --bare`,
   then `remove <path> --delivered-to HEAD`), with a failing `node` on `PATH`.
3. Port the code; wire host verbs; flip routes native; regenerate routes.
4. Delete the Node verb files and arms; retire `test/verbs/worktree-create.test.mjs` and `worktree-remove.test.mjs`
   cases to the Rust owners (report table).
5. Docs and CHANGELOG; gates; OPC MERGE to `main`; build, stage, activate; board line naming plan 0947 unblocked.

## Validation

`cargo test -p fgos-checkout`; `cargo test -p fgos --test cli_tests worktree`; `node scripts/run-tests.mjs
test/rust-host/command-routes.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`; route rows
`worktree`, `resync-worktree` are `native`; `rg -n "createWorktreeUseCase|removeWorktreeUseCase" src bin` empty;
lead-rules gates.

## Risk

- Record format drift makes Node-provisioned checkouts unremovable: step 1 fixture.
- 1045 P10 forwards argv: argv cases in step 2 assert the exact old spellings.
- Windows: setup commands through the process door; `cargo check --target x86_64-pc-windows-msvc`.

## Rollback

Revert the series on `main`, rebuild and reactivate. If plan 0947 phase 3 already deleted `session.rs`, revert 0947
phase 3 first (session checkouts need a door).
