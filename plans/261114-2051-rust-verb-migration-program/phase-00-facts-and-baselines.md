---
phase: 0
title: "Facts and baselines"
status: pending
effort: 0.5d
wave: A
blockedBy: []
---

# Phase 00: Facts and baselines

Read-only. Answers the prior-art questions and the open facts the other F0 phases rely on, and records
the numbers F0's exit criteria compare against. Writes only its report.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p00 /home/vantt/projects/forgent-worktrees/rvm-f0-p00 origin/rust-verb-migration-program/f0`
  (the F0 lead creates the integration branch `rust-verb-migration-program/f0` from `origin/main` first).
  Assert the path is in `git worktree list` before any command in it.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p00-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`.
- Report: path from `fgos convention path --kind report --type phase --slug f0-p00-facts --plan 261114-2051-rust-verb-migration-program --json` (run from the main checkout). End with `Status / Summary / Concerns`.

## Context

- Research report: `git show origin/research/rust-verb-migration:plans/reports/research-261114-1142-rust-verb-migration-assessment.md`.
- Host: `apps/fgos/src/main.rs` (route table embed line 38, help to legacy 341-350, native kinds 73-80 and 282-287).
- Generator: `scripts/export-command-selectors.mjs`; registry `src/cli/command-registry.mjs` (`declared` line 101, `HELP_SELECTORS` line 80).
- Node doors in `bin/fgos.mjs` `main()` (4193-4321): `resolveInvocationRoot`, `admitStoreAccess` (`src/runner/worktree.mjs:547`), `runWithEventStoreLifecycle` (`src/event-store/maintenance.mjs`), `recordInvocationFault` (`src/observe/invocation-fault-log.mjs:89`).

## Tasks

1. **Prior art** (record commit, date, intent for each):
   - `git log -S'native_kinds' --oneline` (expect `4cde1feee`, the mailbox hook lane).
   - `git log -S'HELP_SELECTORS'` and `3a479738c` (help sent to the legacy-node payload on purpose, 2026-10-14).
   - `git log -S"mutatesStore: (positional"` and `-S'nativeOnly'`: when predicates and `nativeOnly` came in, and why.
   - `git log -S'admitStoreAccess'`, `-S'maintainEventStore'`, `-S'recordInvocationFault'` (tsk-5z0), `-S'resolve_target_root'`, `-S'parseArgs'`.
   - Any earlier Rust help renderer, store admission or lifecycle code: `git log --all -G'render_help|admit_store|seal_if_due\(' -- apps packages`.
   - Say for each: what existed, which change removed or moved it, intended or not.
2. **Open facts** (each answered with `file:line`):
   - U1: does any native Rust writer append Work events that need the Node seal coalescer (`src/event-store/seal-coalescing.mjs`) hand-off, or does Rust seal inline?
   - U2: what `prepareStore` (`src/event-store/native.mjs`) does beyond the addon, and which `fgos_event_store` calls give the same `maintenance` facts, `seal_if_due`, `seal_all` from `(cwd, trusted_main)`.
   - U3: the signal behind `currentDispatchDepth()` (`src/runner/dispatch/adapters.mjs`): env var name and format, so the host reads the same one.
   - U4: an existing Rust capped-JSONL append (0600, drop oldest half past 1 MiB, as `src/util/capped-jsonl-log.mjs`): search `packages/*/rust/src` (durable-file, observe `shard.rs`). Name it or say none.
   - U5: the exact way to run one harness case set node-vs-host through `scripts/run-tests.mjs` (it filters env to `TEST_ENV_KEYS`, so `FGOS_HARNESS_ENTRY_*` does not pass).
   - U6: does `fgos_config` expose `eventStore.seal.intervalSec`, `eventStore.sync.intervalSec` and the remote the way `src/event-store/config.mjs` `readEventStoreConfig` reads them?
   - U7: a store-free legacy invocation that still spawns Node, to replace `add --help` in `apps/fgos/tests/cli_tests.rs` (272, 513, 2355) once help is native (`workflow list` is the harness's choice).
   - U8: the root policies of `resolveInvocationRoot` (`src/runner/paths.mjs:145-182`: `caller-tree`, `main-checkout`,
     `main-checkout-only`, `strict-cwd`, the `found` flag, the Git ceiling, the home `.fgos` exclusion) against the host walk
     `cli_projector::resolve_target_root` (`apps/fgos/src/cli_projector.rs:17-58`): list every difference.
   - Also: does `scripts/explain-command-route.mjs` read the help selectors or `native_kinds`?
   - Also: every product and test file that runs `bin/fgos.mjs` (or `FGOS` from the CLI harness) with a help token:
     `rg -n "bin/fgos\.mjs|\bFGOS\b" test scripts src | rg -- "--help|'-h'"` plus the files phase 09 already names.
     List them with `file:line`; phase 09 moves each.
   - Also: the host's existing sync-due rule and detached child for the mailbox (`apps/fgos/src/wiring/mailbox_hook.rs:186-224`,
     `mailbox_sync.rs:179-198`, stamp file) against Node's `syncDue` (`src/event-store/maintenance.mjs:12-15`): same job or not, with evidence.
3. **Baselines** (numbers, commands, machine load at the time):
   - `node scripts/git-one-door-scan.mjs --root .` summary count.
   - Route counts from `packages/host-runtime/contracts/command-routes.json` (82 total, 74 legacy, 8 native, 2 help).
   - Median of 15 runs, through `npm run fgos:dev --` or the staged host: `fgos --help --json`, `fgos add --help`, `fgos config show --json`.
   - `cargo check -p fgos -p fgos-git -p fgos-observe -p fgos-event-store -p fgos-node-addon --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`: green or the existing failures (so later phases are not blamed).
   - SHA-256 of `node bin/fgos.mjs --help --json` stdout (phase 01 compares the generated manifest with it).

## Acceptance

- Report lists every prior-art answer and U1-U8 with `file:line`, plus the baseline numbers.
- Any fact that contradicts a later phase's design is sent to the F0 lead before wave B starts, with
  the phase and the line it changes.

## Files

Create: the report only. Modify/Delete: none. Net size: +1 report.

## Gates

None beyond the report (read-only). The scan and cargo checks above are the phase's own work.

## Risk and rollback

Low. Nothing to roll back.
