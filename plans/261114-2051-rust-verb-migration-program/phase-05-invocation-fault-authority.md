---
phase: 5
title: "Invocation-fault authority"
status: pending
effort: 1d
wave: B
blockedBy: [0]
---

# Phase 05: Invocation-fault authority

The malformed-call record (`.fgos/logs/invocation-faults.jsonl`) gets one owner in `fgos-observe`
(tier 3, Observe). This phase builds the Rust owner and its tests only. Phase 08 wires the host
(native lane and an internal route for Node); phase 10 turns Node into a client and retires its copy.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p05 /home/vantt/projects/forgent-worktrees/rvm-f0-p05 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p05-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock` (a new dependency edge means stop and ask).
- Report: `fgos convention path --kind report --type phase --slug f0-p05-fault --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context

- Node owner today: `src/observe/invocation-fault-log.mjs` (118 lines): `argvShape` (verb and sub by value,
  flag names, every other token by length), `resolveFaultLogPath` (the resolved store if it exists, else the
  main checkout's existing `.fgos`, else nowhere; never creates `.fgos/`), `recordInvocationFault` (never
  throws, returns the path or null; record `{ts, faultClass, verb, message, cwd, argv, writer | writerError}`),
  capped append `src/util/capped-jsonl-log.mjs` (0600, drop the oldest half past 1 MiB).
- Path: `src/state/fgos-file-registry.mjs:42` (`logs/invocation-faults.jsonl`).
- `fgos-observe` already depends on `fgos-identity`, `fgos-git`, `fgos-durable-file` (`packages/observe/rust/Cargo.toml`).
- Phase 00 answers U4 (an existing Rust capped append to reuse).
- Behaviour tests to port: `test/observe/invocation-fault-log.test.mjs` (16 cases).

## Requirements

1. `packages/observe/rust/src/invocation_fault.rs`: `argv_shape`, `log_path(fgos_dir, cwd)`, and
   `record(FaultInput) -> Option<PathBuf>` with the Node semantics above, including: never panics or
   returns an error to its caller, never creates `.fgos/`, records into the main checkout from a linked
   worktree, writes a whole line per record, 0600, cap and half-drop. Writer identity through `fgos-identity`;
   a failure to resolve it keeps the record with `writerError`.
2. A route entry `route_main(args: &[String]) -> i32` that reads one JSON request from stdin
   (`{fgosDir, cwd, verb, sub, faultClass, message, argv}`), records, prints the written path or nothing,
   and always exits 0. Phase 08 mounts it as `fgos internal invocation-fault`.
3. Reuse the capped-append primitive if U4 found one; otherwise implement it once in this module and say
   in the report that Node's `capped-jsonl-log.mjs` keeps two other readers (`src/observe/approve-fault-log.mjs`,
   `src/runner/dispatch/provider-capacity.mjs`) until S6a/S7 move them.
4. Record bytes are the same JSON shape Node writes (key order `ts, faultClass, verb, message, cwd, argv, writer[, writerError]`).

## Files

- Create: `packages/observe/rust/src/invocation_fault.rs` (+ unit tests porting the 16 Node cases that are
  about the record: argv shape, secrets by length, path choice, never create a store, linked worktree into
  main, cap and 0600, whole lines under concurrency, never into `events.jsonl`).
- Modify: `packages/observe/rust/src/lib.rs`.
- Delete: none. Tests retired: none here (phase 10 retires the Node copies, naming these tests as owners).
- Net size: Rust about +250 (half tests).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-observe --all-targets -- -D warnings`; `cargo test -p fgos-observe`
- `cargo check -p fgos-observe --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`
- `node scripts/run-tests.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs test/scripts/doc-health.test.mjs`
- One-door scan count not above baseline (resolving the main checkout goes through `fgos-git`, no Git spawn).

## Risk and rollback

- 0600 and atomic half-drop on Windows (M x M): follow the durable-file crate's Windows path; msvc check.
- Rollback: revert the phase (nothing calls it yet).
