---
phase: 7
title: "Parity lane"
status: pending
effort: 1.5d
wave: B
blockedBy: [0, 1]
landsAfter: [3]
---

# Phase 07: Parity lane

Each later flip proves "the host answers like Node did" with the existing differential harness,
from a per-verb case table, and CLI tests reach the right entry without each test file deciding.
Reuses `test/rust-host/harness.mjs`; builds no second harness.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p07 /home/vantt/projects/forgent-worktrees/rvm-f0-p07 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p07-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`.
- Report: `fgos convention path --kind report --type phase --slug f0-p07-parity --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context

- Harness: `test/rust-host/harness.mjs` (`parseEntry` 96, `resolveEntries` 138 from `FGOS_HARNESS_ENTRY_*`,
  `runDifferentialCase` 654, `generateCoverageFloorCases` 849, `runParitySuite` 983). Known gap at 20-29
  (MEDIUM-B): a `node:` entry sees grandchild spawns through `NODE_OPTIONS`, a `bin:` entry sees only the
  PATH shim (`git`, `npm`); flagged as a precondition for any write-verb comparison.
- `scripts/run-tests.mjs` passes only `TEST_ENV_KEYS` (126-131) and builds `FGOS_HOST_BIN` plus the staged
  manifest env (`buildTestEnv`, 155-180); `FGOS_HARNESS_ENTRY_*` does not reach a test (phase 00, U5).
- CLI test entry: `run(cwd, args, extraEnv)` in `test/cli/helpers/fgos-cli-harness.mjs:135-144` always
  spawns `node bin/fgos.mjs`. 122 test files reference `bin/fgos.mjs`; 55 use this helper. Only the helper changes here.
- Route data after phase 03: `route_kind` per selector and `native_subcommands` on partly native selectors
  (`packages/host-runtime/contracts/command-routes.json`).

## Requirements

1. Case tables: `test/rust-host/parity-cases/<table>.cases.mjs`, each exporting cases in the harness's
   existing case shape. A loader in `harness.mjs` returns a table by name; no new comparison code.
2. First table `help.cases.mjs`: for every selector, `<sel> --help`, `<sel> --help --json`, `<sel> -h`,
   `--help <sel>`, `-h <sel> --json`, each sub-verb's `<sel> <sub> --help --json`; plus refusals (unknown
   sub, unknown option, too many words, sub on a sub-less verb) and `--help --dir <x>`. All `exact-bytes`.
3. `test/rust-host/verb-parity.test.mjs` runs each table node-vs-host: entry A `node:bin/fgos.mjs`, entry B
   `bin:` + `process.env.FGOS_HOST_BIN` (passed by `run-tests`), no extra env. A missing `FGOS_HOST_BIN` fails
   the test by name. A table lives only while both sides serve its verb: the flip that deletes the Node side
   deletes the table, and with the last table this test file (phase 09 deletes both for help; S2's first
   phase brings the file back with its own table). The loader stays, proven by `harness.test.mjs`.
4. Close MEDIUM-B for future write tables: differential child-process evidence compares only what both
   entries can observe (the PATH shim log), and a harness self-test in `harness.test.mjs` proves a grandchild
   `git` spawned by either entry is seen the same way. Update the comment block at 20-29.
5. `run()` follows the route table: the host (`FGOS_HOST_BIN`, with the env `run-tests` gives) when any exact
   `--help`/`-h` token is present, the selector's `route_kind` is `native`, or its first positional is in
   `native_subcommands`; otherwise `node bin/fgos.mjs` as today. A host-bound call with no `FGOS_HOST_BIN`
   throws with a message naming `run-tests`. The routing data is read from the generated file, never restated.

## Files

- Create: `test/rust-host/parity-cases/help.cases.mjs`, `test/rust-host/verb-parity.test.mjs`.
- Modify: `test/rust-host/harness.mjs` (table loader, evidence symmetry, comment), `test/rust-host/harness.test.mjs`
  (self-tests: loader, symmetric grandchild evidence), `test/cli/helpers/fgos-cli-harness.mjs` (`run()` routing).
- Delete: none. Tests retired: none.
- Net size: about +220 tests/helpers.

## Steps

1. Table loader + help table; run `verb-parity.test.mjs` on the integration head (host still routes help to
   Node before phase 02 lands: both sides are Node, the table must pass; after 02 lands it is the real comparison).
2. Evidence symmetry + self-test.
3. `run()` routing; rebase on phase 03 before landing (it reads `native_subcommands`).
4. Run a sample of `run()` users: `test/cli/fgos-claim-2.test.mjs`, `test/cli/fgos-gateway.test.mjs` (they call `--help --json`).

## Gates

- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/rust-host/harness.test.mjs test/cli/fgos-claim-2.test.mjs test/cli/fgos-gateway.test.mjs test/cli/fgos-setup.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
- One-door scan count not above baseline (test files are census-counted per top-level directory).

## Risk and rollback

- `run()` routing that disagrees with the host (L x M): a wrong choice fails loudly (Node refuses a native
  verb; the host forwards a legacy one), never silently.
- Suite time: only help and native invocations move to the host (+~35 ms each); none of today's `run()` calls are native.
- Rollback: revert the phase.
