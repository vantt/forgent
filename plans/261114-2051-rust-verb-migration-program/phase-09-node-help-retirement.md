---
phase: 9
title: "Node help retirement"
status: pending
effort: 1.5d
wave: D
blockedBy: [7, 8]
---

# Phase 09: Node help retirement

Delete the Node help renderer, now that the host serves help and the help table proved byte parity
(phase 08's report). Every help test moves to its one owner: the registry data tests (Node), the Rust
renderer unit tests (`help.rs`), and one wiring file through the installed host (`help-routes.test.mjs`).

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p09 /home/vantt/projects/forgent-worktrees/rvm-f0-p09 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p09-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion (this phase deletes two test files and ~200 lines of `bin/fgos.mjs`: list them). Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`.
- Report: `fgos convention path --kind report --type phase --slug f0-p09-node-help --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Entry check

Phase 08's report shows the help table node-vs-host green with case counts. If not, stop.

## Requirements

1. `bin/fgos.mjs`: delete `publicManifestEntries`, `renderParameterLines`, `renderFlagLines`, `renderGuide`,
   `renderHelpText`, `refuseHelp`, `printVerbHelp`, `handleHelp`, `handleVerbHelp`, the `formatDeprecation`
   import and the help branches in `main()` (4196-4212, 4227-4231) and in `handleHook` (4160-4166). A help
   token on the direct Node channel exits 4 with one stderr line pointing to the installed `fgos` and to
   `npm run fgos:dev -- <verb> --help` (same style as the native-verb refusal). The Node fallback window
   (host spec §6, 30 days from 2026-09-18) has passed, so the direct channel losing help is in scope.
2. Delete `src/cli/deprecation.mjs` (no reader left). Keep `publicManifest()` in the registry (the generator reads it).
3. Move each help test to its owner, by behaviour:

| Test today | New owner |
|---|---|
| `test/cli/fgos-help.test.mjs` (whole file): per-verb help exits 0 and prints its block; guided sections; `run --help` exit codes; setup under Compatibility | `apps/fgos/src/help.rs` unit tests (every manifest entry); `init --help` writes nothing → `test/rust-host/help-routes.test.mjs` "without running the verb" |
| `test/cli/fgos-verb-help-json.test.mjs` (whole file): JSON forms, `-h` = `--help`, refusals, narrowed sub | `help.rs` unit tests |
| same file: "help never runs the verb", "help accepts `--dir` through the shell function" | `help-routes.test.mjs` (one case each, through the installed host) |
| same file: "multi-sub-verb entries carry subcommands matching the sub enum", "run and workflow entries say which door" | `test/cli/fgos-manifest.test.mjs` (registry data) |
| `test/cli/fgos-manifest.test.mjs`: "`--help --json` parses to the manifest matching the registry", "not wrapped in fgos.v1" | generator drift case in `test/rust-host/command-routes.test.mjs` (the file is the manifest) + `help.rs` |
| `fgos-manifest.test.mjs`: "`--help` prints every verb", "setup deprecated rendered", "deprecated help text…", "`formatDeprecation`…", "renders submit's positional", "renders move's mixed args" | `help.rs` unit tests |
| `help-routes.test.mjs`: "byte-identical to the Node payload" | becomes "byte-identical to the generated manifest file" |
| `test/rust-host/harness.mjs` `coverage-help-*` floor cases, `test/rust-host/parity-cases/help.cases.mjs`, the help table in `verb-parity.test.mjs` | `help.rs` + `help-routes.test.mjs` (the Node side no longer exists) |
| `fgos-claim-2.test.mjs` (233, 301, 357), `fgos-gateway.test.mjs` (72), `dispatch-operability.test.mjs` (109, 123), `run-verb.test.mjs` (89, 268), `rust-host/internal-routes.test.mjs` (47) read registry content through help | read `packages/host-runtime/contracts/command-manifest.json` (lowest layer that holds it) or call `run()`, which reaches the host |

4. Check `test/suite-baseline.json` and `test/scripts/test-proof-inventory.test.mjs` for entries naming
   the deleted test files; update them in the same commit if they do.

## Files

- Modify: `bin/fgos.mjs`, `test/cli/fgos-manifest.test.mjs`, `test/rust-host/help-routes.test.mjs`,
  `test/rust-host/harness.mjs`, `test/rust-host/harness.test.mjs`,
  `test/rust-host/command-routes.test.mjs`, `test/cli/fgos-claim-2.test.mjs`, `test/cli/fgos-gateway.test.mjs`,
  `test/cli/dispatch-operability.test.mjs`, `test/cli/run-verb.test.mjs`, `test/rust-host/internal-routes.test.mjs`,
  `apps/fgos/src/help.rs` (only to add any case a retired Node test covered that it lacks), `test/suite-baseline.json` (if needed).
- Delete: `src/cli/deprecation.mjs`, `test/cli/fgos-help.test.mjs`, `test/cli/fgos-verb-help-json.test.mjs`,
  `test/rust-host/parity-cases/help.cases.mjs`, `test/rust-host/verb-parity.test.mjs` (its last table is gone).
- Net size: about -650 (Node help ~200, two test files ~350, cases), + small Rust test additions.

## Gates

- `cargo test -p fgos` (if `help.rs` changed) with fmt/clippy.
- `node scripts/run-tests.mjs test/cli/fgos-manifest.test.mjs test/rust-host/help-routes.test.mjs test/rust-host/harness.test.mjs test/rust-host/command-routes.test.mjs test/cli/fgos-claim-2.test.mjs test/cli/fgos-gateway.test.mjs test/cli/dispatch-operability.test.mjs test/cli/run-verb.test.mjs test/rust-host/internal-routes.test.mjs test/scripts/test-proof-inventory.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
- `rg -n "deprecation.mjs|fgos-help.test|fgos-verb-help-json" docs test scripts src` returns nothing outside history records.
- One-door scan count not above baseline.

## Risk and rollback

- A deleted test held a case no owner has (M x M): the table above is the checklist; each row's new owner is
  run and named in the commit body.
- Rollback: revert the phase (Node help returns; host still serves help).
