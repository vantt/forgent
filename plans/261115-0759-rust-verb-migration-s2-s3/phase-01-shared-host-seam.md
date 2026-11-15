---
phase: 1
title: "Shared host seam: parity against the base release, ported verbs read only the shared parser, Event Store child faults"
status: pending
effort: 1.5d
wave: A
blockedBy: []
landsAfter: [0]
---

# Phase 01: Shared host seam

Three things every verb phase of both steps needs, done once so no verb phase edits `invocation_doors.rs`
or invents its own parity runner. Lands on `main` alone (a small series) before the S2 and S3 integration
branches are cut.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s23-p01`, worktree
`/home/vantt/projects/forgent-worktrees/rvm-s23-p01` from `origin/main`. Report slug `s23-p01-seam`.

## Context

- Parity lane in F0: `test/rust-host/verb-parity.test.mjs` ran `node:bin/fgos.mjs` against `bin:$FGOS_HOST_BIN`
  (`git show dba74b028^:test/rust-host/verb-parity.test.mjs`), created in `6c080baaa`, deleted in `dba74b028` with
  Node help. Kept on `main`: `loadParityTable(name, dir)` (`test/rust-host/harness.mjs:131`), `runParitySuite` (967),
  the modes `exact-bytes`, `semantic-json`, `semantic-json-or-exact-bytes`, `fs-delta`, `signal` (`compareResults` 476),
  the PATH shim with `node` shimmed (37-49), `parseEntry` (`node:`/`bin:`, 87).
- After a flip, Node refuses the verb (`bin/fgos.mjs:4066-4071`), so the comparison is the host against the
  **step's base release** (phase 00 F1 proves the recipe).
- How native verbs read a call today (`apps/fgos/src/routing.rs`): the sub-command is the first token after the verb
  that is not a flag (`sub_word`, 162); the unknown-flag check compares names up to `=` (`unknown_flag`, 296-328);
  `--dir` comes from `named_dir` (`invocation_doors.rs:404-414`: `--dir <p>` or `--dir=<p>`). Node reads
  `positional[0]` after `parseArgs` and has no `=` form (`src/cli/parse-args.mjs:8-27`). Both debts are recorded
  (`invocation_doors.rs:400-403`; the parse row's `cli_projector.rs` entry) pending Q2.
- Node records the failure of a detached seal or publish child as `event-store-child` (`bin/fgos.mjs:4134`); the
  host records nothing for a native verb's own failure.

## Requirements

1. **Parity against the base release.** A harness entry kind for a staged release: `parseEntry` accepts a release
   description (host binary plus its `FGOS_ACTIVE_RELEASE_PATH` and `FGOS_ACTIVE_MANIFEST_PATH`) and runs every case
   with that env, so entry A can be the step's base build and entry B `bin:$FGOS_HOST_BIN`. The description reaches a
   test through one `TEST_ENV_KEYS` entry in `scripts/run-tests.mjs` (126-131), `FGOS_PARITY_BASE`, naming a JSON file
   (never parsed from the environment as values). A recipe script is not added: the phase report and the harness
   header give the three commands (create the base worktree at the step base, stage it with `run-tests`, write the
   description file under `.fgos/runtime/tmp/`). `harness.test.mjs` self-tests the release entry with a scratch
   release directory (env reaches the child; a missing or malformed file is refused by name).
   The runner `test/rust-host/verb-parity.test.mjs` does **not** land on `main`: a runner with no table would be a
   test with no case. Each step lead adds it as the first commit of the step's integration branch (the F0 shape:
   `TABLES` list, `runParitySuite` per name, entry A from `FGOS_PARITY_BASE`, entry B `bin:$FGOS_HOST_BIN`, a missing
   one fails the test by name); each verb phase adds its table name; the step's close phase reruns every table and
   deletes the runner and the tables, so neither reaches `main`.
2. **Ported verbs read only the shared parser.** In `routing.rs`/`invocation_doors.rs`, one list, renamed from
   `LENIENT_ROOT_VERBS` to `PRE_DOOR_NATIVE_VERBS` (same eight names, same "never grows" comment and guard test),
   now the one place that says "this verb keeps its pre-door reading": root leniency (unchanged), and also the
   sub-command word (`sub_word`), `=`-name matching in `unknown_flag`, and `named_dir`. Every other native verb takes
   its sub-command from `parsed.positional[0]`, its flag names as the parser gives them (`--dir=/x` is the unknown
   flag `dir=/x`), and `--dir` from `parsed.flag("dir")` (a bare `--dir` is `true`: refused `dir-invalid` as Node's
   `resolveInvocationRoot` refuses it; 00 confirms Node's text). Unit cases in `routing.rs` and `invocation_doors.rs`
   with a fake non-pre-door route; the existing pre-door cases unchanged. Test renamed only where its title names the old list.
3. **Event Store child faults.** In `invocation_doors.rs`, a `Native` invocation whose call matches
   `event_store_child` and whose operation fails (non-zero exit from `run_native`) records one fault of class
   `event-store-child` in the resolved store, as Node does. `Doors::leave` gets the exit code. Unit case; no route uses
   it until 07.
4. **Envelope answer for ported verbs** (only if 00 F8 finds the host prints something else without `--json`): the
   presenter prints the pretty `fgos.v1` envelope for an operation whose descriptor says so, from one field of the
   operation descriptor, never a per-verb branch. Otherwise nothing here.

## Files

- Create: none (the runner is a step-branch commit, see requirement 1).
- Modify: `test/rust-host/harness.mjs` (release entry kind; header: how to stage a base), `test/rust-host/harness.test.mjs`,
  `scripts/run-tests.mjs` (one `TEST_ENV_KEYS` entry), `apps/fgos/src/routing.rs`, `apps/fgos/src/invocation_doors.rs`,
  `apps/fgos/src/main.rs` (pass the exit code to `leave`), `apps/fgos/src/cli_presenter.rs` and
  `packages/host-runtime/rust/src/contracts.rs` (requirement 4 only), census.
- Delete: none. Tests retired: none (the `LENIENT_ROOT_VERBS` guard test keeps its assertions under the new name).

## Steps

1. Wait for 00 F1 and F8 before 1 and 4; start 2 and 3 at once.
2. Requirement 2 with tests red first (a fake route proves the new reading), then the code.
3. Requirement 3.
4. Requirement 1; prove it with one throwaway table run against a base build (report only, not committed).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos --all-targets -- -D warnings`; `cargo test -p fgos`
- `cargo check -p fgos --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`
- `node scripts/run-tests.mjs test/rust-host/harness.test.mjs test/rust-host/help-routes.test.mjs test/cli/unknown-flag-rejection.test.mjs test/observe/invocation-fault-log.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
- `cargo test -p fgos --test mailbox_routes --test cli_tests` (pre-door verbs unchanged)

## Risk and rollback

- Renaming the list hides that it is debt (L x M): the comment and the guard test keep the words "never grows"; the `doors` row is unchanged.
- The release entry leaks the base env into entry B (L x H): env is per entry, proven by the self-test.
- Rollback: revert the phase; no verb depends on it until its flip.
