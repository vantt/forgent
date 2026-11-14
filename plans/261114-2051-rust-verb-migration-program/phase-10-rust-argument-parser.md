---
phase: 10
title: "Rust argument parser, shared contract"
status: pending
effort: 1d
wave: B
blockedBy: [0]
---

# Phase 10: Rust argument parser, shared contract

The host must read an invocation the way Node's `parseArgs` does wherever both judge the same call:
help words (phase 02), the store declarations (`'<sub> --<flag>'` shapes, phase 03/08), and the
`--dir` that drives root and admission (phase 08). Rust has no such parser today
(`apps/fgos/src/main.rs:91-94` reads `cli_args.get(1)`). This phase adds one, in the lowest Rust layer
the host already depends on, and proves it equal to Node's with one vector file read by both.
It is a twin by necessity while both CLIs run; Node's copy retires with the last Node verb (S7).

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p10 /home/vantt/projects/forgent-worktrees/rvm-f0-p10 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p10-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`. Also run every test that imports or reads a file you change.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`.
- Report: `fgos convention path --kind report --type phase --slug f0-p10-argv --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context

- Node: `src/cli/parse-args.mjs:8-27` (`--k=v`, `--k v` takes the next token unless it starts with `--`, a bare `--k`
  is `true`, `-h` handling, positionals in order). Readers: `bin/fgos.mjs` `main()` (4225) and the verbs.
- No Node test owns `parseArgs` today (`rg -l parse-args.mjs test` finds only `test/architecture.test.mjs` and `test/cli/fgos-workflow-propose.test.mjs`).
- `packages/host-runtime/rust` is a library `apps/fgos` already depends on (`apps/fgos/Cargo.toml`); its `lib.rs` is 25 lines and no other F0 phase edits it.

## Requirements

1. `packages/host-runtime/rust/src/cli_args.rs`: `parse_args(&[OsString]) -> ParsedArgs { flags: ordered map name -> Bool(true) | Str(String), positional: Vec<String> }`
   with exactly Node's rules, including repeated flags (last wins, as Node), `--` handling as Node does, and non-UTF-8 tokens
   refused by name.
2. `test/rust-host/fixtures/parse-args-vectors.json`: rows `{argv, flags, positional}` covering: flag before the sub-verb
   (`--dir /x start`, `--json start`), `=` forms, a valued flag whose value looks like a sub-verb, `--help <word>`, `-h`,
   `--opportunistic`, `--opportunistic=false`, `--opportunistic x`, `--action` as a value, trailing `--dir`, empty `--dir=`.
3. `test/cli/parse-args-vectors.test.mjs` (new: no test owns `parseArgs` today) runs every row through Node's `parseArgs`;
   a Rust unit test in `cli_args.rs` runs the same file. Both name the row on failure.
4. No caller switches here (phase 02 and 08 use it). `pub` items in a library are not dead code.

## Files

- Create: `packages/host-runtime/rust/src/cli_args.rs`, `test/rust-host/fixtures/parse-args-vectors.json`, `test/cli/parse-args-vectors.test.mjs`.
- Modify: `packages/host-runtime/rust/src/lib.rs`.
- Delete: none. Tests retired: none. Net size: about +200 (vectors and tests half).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-host-runtime --all-targets -- -D warnings`; `cargo test -p fgos-host-runtime`
- `cargo check -p fgos-host-runtime --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`
- `node scripts/run-tests.mjs test/cli/parse-args-vectors.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`

## Risk and rollback

- A Node quirk not covered by a row (M x M): every row phase 02, 03 and 08 rely on is listed above; they add rows, never a second parser.
- Rollback: revert the phase.
