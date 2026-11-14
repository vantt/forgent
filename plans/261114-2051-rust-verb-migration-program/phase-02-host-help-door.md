---
phase: 2
title: "Host help door"
status: pending
effort: 2d
wave: B
blockedBy: [0, 1]
landsAfter: [10]
---

# Phase 02: Host help door

The host answers every help form from the embedded manifest, byte-identical to today's Node output,
with no Node process. Node's help code stays until phase 09 (it is unreachable through the host after
this phase, and the help case table compares the two).

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p02 /home/vantt/projects/forgent-worktrees/rvm-f0-p02 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p02-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`.
- Report: `fgos convention path --kind report --type phase --slug f0-p02-help --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context

- Node renderer to port, all in `bin/fgos.mjs`: `renderParameterLines` (~3846), `renderFlagLines` (~3858),
  `renderGuide` (~3874), `renderHelpText` (3890-3926), `refuseHelp` (3934), `printVerbHelp` (3941-3961),
  `handleHelp` (3965-3992, accepts and ignores `--dir`), `handleVerbHelp` (3999-4006); `formatDeprecation`
  in `src/cli/deprecation.mjs`. Help is never wrapped in `fgos.v1`; a refusal is one stderr line, exit 4, nothing on stdout.
- Host today: help tokens go to legacy (`apps/fgos/src/main.rs:341-350`); `--help`/`-h` are route
  selectors (`main.rs:265-276`); a native hook kind with a help token falls to legacy (`main.rs:278-287`).
- The manifest file is `packages/host-runtime/contracts/command-manifest.json` (phase 01).
- Rules to keep: an unlisted selector still fails closed with exit 4 before any help (R3, `refuse_unknown_verb`);
  "any exact `--help`/`-h` token after the selector is help, even as a flag value" (`main.rs:67-71`, `bin/fgos.mjs:4227-4231`);
  `hook` keeps raw argv but its help is the manifest door (`bin/fgos.mjs:4196-4200`).

## Requirements

1. `apps/fgos/src/help.rs`: embeds the manifest with `include_str!`, parses it once, and renders text and
   JSON exactly as the Node functions above do (same line order, labels, `DEPRECATED —` and Compatibility
   section, guide sections, default notes). The JSON forms print the manifest bytes or one entry
   (narrowed to one sub-verb) with the same serializer settings Node uses (2-space, key order as in the file).
1b. Help words come from `fgos_host_runtime::cli_args::parse_args` (phase 10), as Node takes them from `parseArgs`:
   `[flags.help when it is a string, ...positional]` without `-h` (`bin/fgos.mjs:3999-4006`); top-level help filters
   `--dir`, `--json` and help tokens as `handleHelp` does (3965-3992). Develop against phase 10's branch; land after it.
2. `main.rs`: a first token `--help`/`-h` is answered by `help.rs` before the route lookup; for a listed
   selector, any exact help token after it is answered by `help.rs` for every route kind, including `hook`
   and native kinds. Delete the legacy help routing branch (341-350) and the help fall-through comment at 278-281.
3. Exit codes and stderr text of every refusal match Node byte for byte.
4. No behaviour change outside help.

## Files

- Create: `apps/fgos/src/help.rs` (renderer + unit tests: every manifest entry renders; top-level text;
  JSON whole/one/narrowed; refusals: unknown verb, unknown option, too many words, sub on a sub-less verb,
  unknown sub; `--dir` accepted; deprecated string and structured metadata; positional-only vs mixed
  parameters; guided verb sections).
- Modify: `apps/fgos/src/main.rs` (`mod help;` and the two dispatch points; delete legacy help routing),
  `apps/fgos/tests/cli_tests.rs` (the `add --help` cases at 272, 513, 2355 probe the legacy lane: switch
  them to the store-free legacy invocation phase 00 named, U7), `apps/fgos/tests/mailbox_routes.rs`
  (the case at 283-299 "help for the native kind reaches legacy" becomes "help for the native kind is
  answered by the host and starts no legacy payload").
- Also in `cli_tests.rs`: one test, reusing the PATH `node` wrapper spy already in that file (255-262), that runs every
  help form (top level text and JSON, `<verb> --help`, `-h`, `<verb> <sub> --help --json`, `hook mailbox --help`, a native
  verb, a legacy verb) and asserts zero `node` starts. This is the proof that help needs no Node.
- Delete: none.
- Tests retired: none (Node help tests still pass: the direct Node channel still renders help until phase 09).
- Net size: about +450 Rust (half tests), -15 in `main.rs`.

## Steps

1. Port the renderer with unit tests that read the real embedded manifest; use phase 00's U7 answer for the cli_tests swap.
2. Wire `main.rs`.
3. Prove parity: run the harness coverage floor node-vs-host for the help cases (`coverage-help-*`, exact bytes) using the method phase 00 recorded (U5); record pass counts in the report. The full help table (all forms) runs in phase 08 once phase 07's table exists.
4. Measure `fgos --help --json` through the staged host (15 runs, median) and compare with phase 00.

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos --all-targets -- -D warnings`; `cargo test -p fgos`
- `cargo check -p fgos --target x86_64-pc-windows-msvc`; `cargo check -p fgos --target aarch64-apple-darwin`
- `node scripts/run-tests.mjs test/rust-host/help-routes.test.mjs test/rust-host/harness.test.mjs test/cli/first-run-guide.test.mjs test/cli/exit-code-table.test.mjs test/rust-host/envelope-contract.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
  (`first-run-guide` and `exit-code-table` read `main.rs` text).
- `node scripts/git-one-door-scan.mjs --root .` count not above baseline; regenerate the census.

## Risk and rollback

- Byte drift in the text renderer (M x H): unit tests over every manifest entry plus the node-vs-host help cases.
- Help token inside a value (`--title --help`) or a flag value before the sub-verb (`session --dir /x start --help`): keep the exact-token rule and take words from `parse_args`; unit test both.
- Rollback: revert the phase; help returns to the legacy door.
