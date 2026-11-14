---
phase: 10
title: "Node fault-record client"
status: pending
effort: 0.5d
wave: D
blockedBy: [8]
---

# Phase 10: Node fault-record client

Node stops writing invocation-fault records itself and asks the host's `fgos internal invocation-fault`
route (phase 08), whose owner is `fgos_observe::invocation_fault` (phase 05). One writer of the log.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p10 /home/vantt/projects/forgent-worktrees/rvm-f0-p10 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p10-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`.
- Report: `fgos convention path --kind report --type phase --slug f0-p10-fault-client --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context

- `src/observe/invocation-fault-log.mjs` exports `argvShape`, `resolveFaultLogPath`, `recordInvocationFault`.
  Readers of `recordInvocationFault`: `bin/fgos.mjs` (4271, 4299), `src/observe/friction-client.mjs:10`.
  Check `rg -n "argvShape|resolveFaultLogPath" src bin test scripts` for other readers before deleting.
- Host call door: `invokeHost` in `src/util/host-bin.mjs` (used by `friction-client.mjs:9`).
- `FGOS_FILE.INVOCATION_FAULTS` (`src/state/fgos-file-registry.mjs:29, 42`); `test/state/fgos-logs-bucket.test.mjs:24` lists the file name.

## Requirements

1. `recordInvocationFault` keeps its signature and contract (never throws; returns the written path or null)
   and sends one request to `fgos internal invocation-fault` through `invokeHost` (stdin JSON as phase 05
   defines). No host: returns null (the same as "nowhere to write"); this is a failure path, so one spawn is fine.
2. Delete `argvShape` and `resolveFaultLogPath` from Node if no other reader remains; delete the
   `INVOCATION_FAULTS` registry entry only if nothing in Node resolves that path any more (keep the logs-bucket
   test's file-name fact: point it at the Rust owner's constant or keep the name list as data).
3. `src/util/capped-jsonl-log.mjs` stays (two other readers); say so in the report.

## Files

- Modify: `src/observe/invocation-fault-log.mjs`, `test/observe/invocation-fault-log.test.mjs`,
  `src/state/fgos-file-registry.mjs` and `test/state/fgos-logs-bucket.test.mjs` (only per requirement 2).
- Delete: none.
- Tests retired: in `test/observe/invocation-fault-log.test.mjs`, the record-content cases (argv shape,
  secrets by length, cap and 0600, whole lines under concurrency, linked worktree into main, no store created,
  never into `events.jsonl`). New owner: `packages/observe/rust/src/invocation_fault.rs` unit tests (phase 05).
  Kept as CLI wiring: "an unknown verb is recorded…", "a verb's own refusal is never recorded", "the fault is
  announced on stderr only when a record landed", "the fault log is gitignored", and the approve-log case (Node owner).
- Net size: Node about -80 (module and tests).

## Gates

- `node scripts/run-tests.mjs test/observe/invocation-fault-log.test.mjs test/observe/friction-client.test.mjs test/state/fgos-logs-bucket.test.mjs test/cli/fgos-disconnected-worktree-guard.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
  (drop a file that does not exist; also every hit of `rg -l "invocation-faults|recordInvocationFault" test`).
- One-door scan count not above baseline.

## Risk and rollback

- Fault records lost when the host is absent (L x L): the direct Node channel without a host is already
  unsupported for state writes (AGENTS.md "Legacy-Node CLI Ownership Boundary"); records were best-effort.
- Rollback: revert the phase.
