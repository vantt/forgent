---
phase: 5
title: "Invocation-fault record: Rust writer, shared contract"
status: pending
effort: 1d
wave: B
blockedBy: [0]
---

# Phase 05: Invocation-fault record: Rust writer, shared contract

The host's native lane must record malformed calls into `.fgos/logs/invocation-faults.jsonl` the way
Node does. One writer cannot serve both processes: Node must record a fault when the host itself is
unreachable (`src/observe/friction-client.mjs:36-50` records `friction-write-failed` after `invokeHost`
fails), and the host must record its own without spawning Node. So the record is a **twin**: a Rust
writer in `fgos-observe` (tier 3) and the existing Node writer, held to one contract by one vector file
read by both languages, with a `doors` row (phase 08) allowing exactly these two files until S7.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p05 /home/vantt/projects/forgent-worktrees/rvm-f0-p05 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p05-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`. Also run every test that imports or reads a file you change.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock` (a new dependency edge means stop and ask).
- Report: `fgos convention path --kind report --type phase --slug f0-p05-fault --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context

- Node writer: `src/observe/invocation-fault-log.mjs` (118 lines): `argvShape` (verb and sub by value, flag names,
  every other token by length), `resolveFaultLogPath` (63-77: the resolved store if it exists, else the main checkout's
  existing `.fgos`, else nowhere; never creates `.fgos/`), `recordInvocationFault` (89: never throws, returns the path or
  null; record `{ts, faultClass, verb, message, cwd, argv, writer | writerError}`), capped append
  `src/util/capped-jsonl-log.mjs` (0600, drop the oldest half past 1 MiB). Path `src/state/fgos-file-registry.mjs:42`.
- The unknown-flag message carries the whole token (`apps/fgos/src/main.rs:107-110`; Node `src/cli/flag-check.mjs:45-52`),
  so `--key=secret` reaches `message`. The Rust writer must not repeat this (the Node leak is a separate item, plan.md).
- `fgos-observe` already depends on `fgos-identity`, `fgos-git`, `fgos-durable-file`. Phase 00 U4 names any Rust capped append to reuse.
- Node behaviour tests: `test/observe/invocation-fault-log.test.mjs` (16 cases).

## Requirements

1. `packages/observe/rust/src/invocation_fault.rs`: `argv_shape`, `log_path(fgos_dir, cwd)` and
   `record(FaultInput) -> Option<PathBuf>` with the Node semantics above: never panics or errors to its caller, never
   creates `.fgos/`, records into the main checkout from a linked worktree, whole lines, 0600, cap and half-drop, writer
   identity through `fgos-identity` (failure kept as `writerError`). Same key order as Node.
2. `message` is stored with any `--name=value` token reduced to `--name=<len>` (the argv rule), so the Rust record never
   holds an argument value.
3. `test/rust-host/fixtures/invocation-fault-vectors.json`: rows `{argv, sub, expectedArgvShape}` and path-choice rows
   (store present; store absent with a main checkout; linked worktree; outside a repository). The Rust unit tests and
   `test/observe/invocation-fault-log.test.mjs` both read it; the Node test's own argv-shape cases become rows.
4. Reuse the capped-append primitive if U4 found one; otherwise implement it once in this module.
5. No route, no Node client change, no caller switch here (phase 08 calls `record` in process).

## Files

- Create: `packages/observe/rust/src/invocation_fault.rs`, `test/rust-host/fixtures/invocation-fault-vectors.json`.
- Modify: `packages/observe/rust/src/lib.rs`, `test/observe/invocation-fault-log.test.mjs` (argv-shape and path cases read
  the vector file), `src/observe/invocation-fault-log.mjs` (only if a vector row shows Node disagrees; fix Node, never the row).
- Delete: none. Tests retired: the Node argv-shape cases move into vector rows (same file, one owner: the vector table).
- Net size: Rust about +250 (half tests), Node tests about -20.

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-observe --all-targets -- -D warnings`; `cargo test -p fgos-observe`
- `cargo check -p fgos-observe --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`
- `node scripts/run-tests.mjs test/observe/invocation-fault-log.test.mjs test/observe/friction-client.test.mjs test/state/fgos-logs-bucket.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
- One-door scan count not above baseline (main-checkout lookup through `fgos-git`, no Git spawn).

## Risk and rollback

- 0600 and atomic half-drop on Windows (M x M): follow the durable-file crate's Windows path; msvc check.
- The twins drift later (M x M): the vector file plus phase 08's `doors` row allowing only these two writers.
- Rollback: revert the phase (nothing calls the Rust writer yet).
