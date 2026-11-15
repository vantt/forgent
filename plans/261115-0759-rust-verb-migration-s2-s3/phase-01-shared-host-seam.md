---
phase: 1
title: "Shared host seam: parity entry, parser-only reading, categorised refusal, child faults, no state root from a root read"
status: completed
effort: 2.5d
wave: A
blockedBy: []
landsAfter: [0]
---

# Phase 01: Shared host seam

Five things every verb phase of both steps needs, done once so no verb phase edits `invocation_doors.rs`, the
root door or the presenter's error path, and none invents its own parity runner. Lands on `main` alone (a small
series) before the S2 and S3 integration branches are cut. Plan decisions D1-D4.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s23-p01`, worktree
`/home/vantt/projects/forgent-worktrees/rvm-s23-p01` from `origin/main`. Report slug `s23-p01-seam`.

## Context

- Parity lane in F0: `test/rust-host/verb-parity.test.mjs` ran `node:bin/fgos.mjs` against `bin:$FGOS_HOST_BIN`
  (`git show dba74b028^:test/rust-host/verb-parity.test.mjs`), created in `6c080baaa`, deleted in `dba74b028`. Kept on
  `main`: `loadParityTable(name, dir)` (`test/rust-host/harness.mjs:131`), `runParitySuite` (967), the modes
  `exact-bytes`, `semantic-json`, `semantic-json-or-exact-bytes`, `fs-delta`, `signal` (`compareResults` 476), the PATH
  shim with `node` shimmed (37-49), `parseEntry` (`node:`/`bin:`, 87). After a flip Node refuses the verb
  (`bin/fgos.mjs:4068-4071`), so the comparison is the host against the **step's base release** (00 F1).
- How native verbs read a call (`apps/fgos/src/routing.rs`): the sub-command is the token right after the verb when it
  is not a flag (`sub_word`, 162-170); the unknown-flag check compares names up to `=` (`unknown_flag`, 296-328, the cut
  at 307); `--dir` comes from `named_dir` (`invocation_doors.rs:404-414`). Node reads `positional[0]` after `parseArgs`
  and has no `=` form (`src/cli/parse-args.mjs:8-27`).
- `LENIENT_ROOT_VERBS` (`invocation_doors.rs:26-35`); its guard test (781-809) checks only that listed verbs are native
  with store `none`, so a new store-less native verb could be added silently.
- Refusals: `present_error` prints `fgos: error: <msg>` and exits 1 for every provider error
  (`apps/fgos/src/cli_presenter.rs:57-76`); a projector `Err(String)` exits "unexpected" (`main.rs:357-363`); only
  `fgos_identity::Refusal` sets its own code. Node exits per category (`packages/host-runtime/contracts/exit-codes.v1.json`).
- Node records a failed detached seal or publish child as `event-store-child` with the error's message
  (`bin/fgos.mjs:4128-4136`); the host records nothing for a native verb's own failure, and `Doors::leave`
  (`invocation_doors.rs:358-369`) gets only the entered state.
- Root facts: `read_repo_facts` (`packages/git/rust/src/invocation_root.rs:98-108`) -> `GitDriver::topology_at`
  (`packages/git/rust/src/driver.rs:359-365`) -> `GitDriver::new` (266-273) creates an absent state root;
  `GitDriver::new_if_root_exists` (277-283) does not; `resolve_topology` (495-) reads the disk only (00 F15 confirms).

## Requirements

1. **Parity against the base release (D1).** A harness entry kind for a staged release: `parseEntry` accepts a release
   description (host binary plus its `FGOS_ACTIVE_RELEASE_PATH` and `FGOS_ACTIVE_MANIFEST_PATH`) and runs every case
   with that env, so entry A can be the step's base build and entry B `bin:$FGOS_HOST_BIN`. The description reaches a
   test as `FGOS_TEST_PARITY_BASE` (a JSON file path; the `FGOS_TEST_` prefix already passes `run-tests`,
   `scripts/run-tests.mjs:145-151`, so `run-tests.mjs` is not edited). The harness header gives the recipe: a linked
   worktree at the step base, staged with `run-tests` under its own `CARGO_TARGET_DIR` (`rvm-<step>-base-target`),
   the description file under `.fgos/runtime/tmp/`. `harness.test.mjs` self-tests the release entry with a scratch
   release directory (env reaches the child, never entry B; a missing or malformed file is refused by name).
   The runner `test/rust-host/verb-parity.test.mjs` does **not** land on `main` (a runner with no table is a test with
   no case): each step lead adds it as the first commit of the step's integration branch (F0's shape: `TABLES`,
   `runParitySuite` per name, a missing `FGOS_TEST_PARITY_BASE` or `FGOS_HOST_BIN` fails by name); the close phase
   deletes it with the tables.
2. **Ported verbs read only the shared parser (D2).** Rename `LENIENT_ROOT_VERBS` to `PRE_DOOR_NATIVE_VERBS` (same eight
   names, "never grows" comment kept) and make it the one place that says "this verb keeps its pre-door reading": root
   leniency (unchanged), the sub-command word (`sub_word`), the `=` cut in `unknown_flag`, and `named_dir`. Every other
   native verb takes its sub-command from `parsed.positional[0]`, its flag names as the parser gives them (`--dir=/x` is
   the unknown flag `dir=/x`), and `--dir` from `parsed.flag("dir")` (a bare `--dir` is refused as Node refuses it; 00
   pins Node's text). The guard test asserts the exact set of eight names. Unit cases in `routing.rs` and
   `invocation_doors.rs` with a fake non-pre-door route; existing pre-door cases unchanged.
3. **Categorised refusal (D3).** One outcome in the host runtime contract (`packages/host-runtime/rust/src/contracts.rs`):
   a refusal with a category from `exit-codes.v1.json` and a message; `run_native` and the presenter print
   `fgos: <message>` and exit with the category's code through `fgos_host_runtime::exit_codes`; a projector refusal uses
   the same outcome (no more "unexpected" for a malformed request). One generic path, no per-verb branch; no fault
   record (a verb's own refusal is not a malformed call, as in Node). Unit cases for each category; today's native
   verbs unchanged (they do not use it).
4. **Event Store child faults (D9 groundwork).** `Doors::leave` gets the outcome (exit code and refusal message); a
   `Native` invocation whose call matches `event_store_child` and that fails records one fault of class
   `event-store-child` with that message in the resolved store, as Node does. Unit case; no route uses it until 07.
   `doors` row "classify a failed Event Store child": pattern `event-store-child`; allowed `apps/fgos/src/invocation_doors.rs`;
   debt `bin/fgos.mjs` (reason: the Node branch that classifies a Node-run child, deleted by the `events` port).
5. **No state root from a root read (D4).** `read_repo_facts` never creates the state root: it builds the driver with
   `GitDriver::new_if_root_exists` and, with no root, reads the topology without a driver (if 00 F15 shows the
   topology read needs none) or answers a typed `state-root-gone` that the host maps, for a call matching
   `event_store_child`, to Node's `{ skipped: "state root gone" }`. Both CLIs get it (the addon calls the same function).
   Unit case in `invocation_root.rs` (root removed, read, root still absent). Needed before 07 flips `events`.

## Files

- Create: none (the runner is a step-branch commit, requirement 1).
- Modify: `test/rust-host/harness.mjs`, `test/rust-host/harness.test.mjs`, `apps/fgos/src/routing.rs`,
  `apps/fgos/src/invocation_doors.rs`, `apps/fgos/src/main.rs`, `apps/fgos/src/cli_presenter.rs`,
  `apps/fgos/src/cli_projector.rs` (projector errors through the refusal), `packages/host-runtime/rust/src/contracts.rs`,
  `packages/git/rust/src/invocation_root.rs`, `packages/git/rust/src/driver.rs`, `docs/architecture-manifest.json`
  (the child-fault row), census.
- Delete: none. Tests retired: none (the guard test keeps its assertions, gains the exact set).

## Steps

1. Requirements 2, 3 and 5 at once (tests red first); 4 after 3.
2. Requirement 1 after 00 F1; prove it with one throwaway table run against a base build (report only, not committed).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos -p fgos-host-runtime -p fgos-git -p fgos-node-addon --all-targets -- -D warnings`;
  `cargo test -p fgos -p fgos-host-runtime -p fgos-git`
- `cargo check -p fgos -p fgos-git -p fgos-node-addon --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`
- `node scripts/run-tests.mjs test/rust-host/harness.test.mjs test/rust-host/help-routes.test.mjs test/rust-host/envelope-contract.test.mjs test/cli/exit-code-table.test.mjs test/cli/unknown-flag-rejection.test.mjs test/observe/invocation-fault-log.test.mjs test/event-store/background-seal.test.mjs test/event-store/triggers.test.mjs test/runner/paths.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
- `cargo test -p fgos --test mailbox_routes --test cli_tests` (pre-door verbs unchanged)

## Risk and rollback

- Renaming the list hides that it is debt (L x M): the comment says "never grows", the test pins the exact set.
- The release entry leaks the base env into entry B (L x H): env is per entry, proven by the self-test.
- The refusal outcome changes a pre-F0 native verb's exit (L x M): none of them uses it; their tests run in the gates.
- A topology read without a driver misses a containment rule (L x H): 00 F15 decides; if any rule needs the driver,
  the typed `state-root-gone` answer is used instead.
- Rollback: revert the phase; no verb depends on it until its flip.
