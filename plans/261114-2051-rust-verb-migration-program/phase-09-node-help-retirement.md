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
(phase 08's report). The Node channel keeps answering help by forwarding to the host, so the shell
integration's Node tiers (`scripts/fgos-shell-integration.sh`, tiers 1-3) and the doctor probe that runs
`fgos --help` (`src/setup/registrations.mjs:467-472`, `src/setup/shell-rc.mjs:122`) keep working. Every
help test moves to its one owner.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p09 /home/vantt/projects/forgent-worktrees/rvm-f0-p09 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p09-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`. Also run every test that imports or reads a file you change.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; this phase deletes two test files and about 200 lines of `bin/fgos.mjs`: list them. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`.
- Report: `fgos convention path --kind report --type phase --slug f0-p09-node-help --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Entry check

Phase 08's report shows the help table node-vs-host green with case counts. If not, stop.

## Requirements

1. `bin/fgos.mjs`: delete `renderParameterLines`, `renderFlagLines`, `renderGuide`, `renderHelpText`, `refuseHelp`,
   `printVerbHelp`, `handleHelp`, `handleVerbHelp`, the `formatDeprecation` import and any `publicManifest` use, and the
   help branches in `main()` (4196-4212, 4227-4231) and in `handleHook` (4159-4164). In their place one forwarder: a help
   token (same exact-token rule) runs the host found by `resolveHostBin` (`src/util/host-bin.mjs:16`) with the same argv,
   stdio inherited, `FGOS_RUST_HOST_RECURSION_GUARD` removed from its env, and exits with its code; with no host it exits 4
   with one stderr line pointing to the installed `fgos` and to `npm run fgos:dev -- <verb> --help`. It renders nothing.
2. Delete `src/cli/deprecation.mjs` and its row in `docs/architecture-manifest.json` (225); drop it from
   `ARM_STATIC_IMPORTS` in `test/architecture.test.mjs` (1757). Keep `publicManifest()` in the registry (the generator reads it).
3. `doors`: remove `bin/fgos.mjs` from the "verb manifest projection" row's `allowed`; add a retired-names row
   (`\brenderHelpText\b`, `\bhandleVerbHelp\b`, `\bpublicManifestEntries\b`, `\bformatDeprecation\b`; allowed none).
4. `scripts/test-proof-inventory.mjs` `cliCost` (646-662) times `node bin/fgos.mjs --help`; point it at the host
   (`FGOS_HOST_BIN`) so it measures help, not a forwarder hop; `test/scripts/test-proof-inventory.test.mjs:240` keeps passing.
5. Move each help test to its owner, by behaviour:

| Test today | New owner |
|---|---|
| `test/cli/fgos-help.test.mjs` (whole file): per-verb help exits 0 and prints its block; guided sections; `run --help` exit codes; setup under Compatibility | `apps/fgos/src/help.rs` unit tests (every manifest entry); `init --help` writes nothing → `test/rust-host/help-routes.test.mjs` "without running the verb" |
| `test/cli/fgos-verb-help-json.test.mjs` (whole file): JSON forms, `-h` = `--help`, refusals, narrowed sub | `help.rs` unit tests |
| same file: "help never runs the verb", "help accepts `--dir` through the shell function" | `help-routes.test.mjs` (one case each, through the installed host) |
| same file: "multi-sub-verb entries carry subcommands matching the sub enum", "run and workflow entries say which door" | `test/cli/fgos-manifest.test.mjs` (registry data) |
| `fgos-manifest.test.mjs`: "`--help --json` parses to the manifest matching the registry", "not wrapped in fgos.v1" | generator drift case in `test/rust-host/command-routes.test.mjs` + `help.rs` |
| `fgos-manifest.test.mjs`: "`--help` prints every verb", "setup deprecated rendered", "deprecated help text…", "`formatDeprecation`…", "renders submit's positional", "renders move's mixed args" | `help.rs` unit tests |
| `help-routes.test.mjs`: "byte-identical to the Node payload" | "byte-identical to the generated manifest file" |
| `test/rust-host/harness.mjs` `coverage-help-*` floor cases, `test/rust-host/parity-cases/help.cases.mjs`, `test/rust-host/verb-parity.test.mjs` | `help.rs` + `help-routes.test.mjs` (the Node side no longer exists; the table loader stays, proven in `harness.test.mjs`) |
| `fgos-claim-2.test.mjs` (233, 301, 357), `fgos-gateway.test.mjs` (72), `dispatch-operability.test.mjs` (109, 123), `run-verb.test.mjs` (89, 268), `rust-host/internal-routes.test.mjs` (47), and every further file phase 00 listed (for example `test/cli/command-registry.test.mjs`, `test/rust-host/release-tree.test.mjs:267-300`) | read `packages/host-runtime/contracts/command-manifest.json` (the lowest layer that holds it) or go through `run()`, which reaches the host |
| (new) the forwarder | one case in `help-routes.test.mjs`: `node bin/fgos.mjs --help --json` with a host equals the host's bytes; without one it exits 4 with the pointer |

6. `test/suite-baseline.json` rows of the two deleted files (29, 63) go in the same commit.

## Files

- Modify: `bin/fgos.mjs`, `docs/architecture-manifest.json`, `test/architecture.test.mjs`, `scripts/test-proof-inventory.mjs`,
  `test/cli/fgos-manifest.test.mjs`, `test/rust-host/help-routes.test.mjs`, `test/rust-host/harness.mjs`,
  `test/rust-host/harness.test.mjs`, `test/rust-host/command-routes.test.mjs`, `test/cli/fgos-claim-2.test.mjs`,
  `test/cli/fgos-gateway.test.mjs`, `test/cli/dispatch-operability.test.mjs`, `test/cli/run-verb.test.mjs`,
  `test/rust-host/internal-routes.test.mjs`, the further files phase 00 listed, `apps/fgos/src/help.rs` (only to add a case a
  retired Node test covered that it lacks), `test/suite-baseline.json`.
- Delete: `src/cli/deprecation.mjs`, `test/cli/fgos-help.test.mjs`, `test/cli/fgos-verb-help-json.test.mjs`,
  `test/rust-host/parity-cases/help.cases.mjs`, `test/rust-host/verb-parity.test.mjs`.
- Net size: about -650 (Node help ~200, two test files ~350, cases), +30 forwarder, small Rust test additions.

## Gates

- `cargo test -p fgos` (if `help.rs` changed) with fmt/clippy.
- `node scripts/run-tests.mjs test/cli/fgos-manifest.test.mjs test/rust-host/help-routes.test.mjs test/rust-host/harness.test.mjs test/rust-host/command-routes.test.mjs test/cli/fgos-claim-2.test.mjs test/cli/fgos-gateway.test.mjs test/cli/dispatch-operability.test.mjs test/cli/run-verb.test.mjs test/rust-host/internal-routes.test.mjs test/scripts/test-proof-inventory.test.mjs test/setup/checks-doctor-config.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs` plus the files phase 00 listed.
- One-door scan count not above baseline.

## Risk and rollback

- A deleted test held a case no owner has (M x M): the table is the checklist; each row's new owner runs and is named in the commit body.
- The forwarder loops (host -> Node -> host) (L x H): the host answers help itself and never forwards help to Node; the forwarder strips the recursion guard only for its own child; a test runs it through the host.
- Rollback: revert the phase (Node help returns; host still serves help).
