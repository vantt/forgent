---
phase: 2
title: "Rust run scan, metrics coverage, hermetic invariant"
status: pending
priority: P1
effort: "1.25d"
dependencies: [1]
---

# Phase 2: Rust run scan, `metrics coverage`, hermetic invariant

## Overview

Make the run-result source follow the run definition from plan.md, expose how many run directories were seen, observed and skipped (and why) through a new `metrics coverage` subcommand, and replace the frozen smoke test with hermetic invariants tied to the shared fixture.

## Requirements

- Functional: `scan_runs(root) -> RunScan { runs, skipped, run_dirs_seen, recent_runs }` implements the rule: stop at `runs/`, no symlinks (`symlink_metadata`/file type), depth cap, `assignment.json` optional (role null), skip reasons `unparseable | no-run-id | no-timestamp | symlink | duplicate-run-id | depth | inline-record`.
- Functional: `RunResultSource::observations` uses `scan_runs`; the shared `ObservationSource` trait does **not** change (skip counts come from `metrics coverage`, not from the trait).
- Functional: `metrics coverage` prints `{ layoutRule: "v2", runDirsSeen, observed, skipped: {reason: n}, recentRuns }`, where `recentRuns` counts runs whose `result.json` changed in the last 60 s, and `observed + sum(skipped) == runDirsSeen`.
- Non-functional: reads the runs source only (no transcripts scan); cost measured, not assumed.

## Architecture

Same rule as phase 1, implemented once in `fgos_run_result`. The Rust test reads `test/fixtures/run-layout/expected.json` and must produce the same run set as the Node test (including the planted-in-outbox run being absent). The read contract `packages/run-result/contracts/run-result.read.v1.json` is corrected: assignment id may contain `/`, `assignment.json` optional, inline-record shape named as skipped. `metrics coverage` is registered where subcommands are listed: `packages/observe/rust/src/metrics_cli/mod.rs:14`, `src/cli/command-registry.mjs:66`, `docs/specs/observe.md` §4.

## Related Code Files

- Modify: `packages/run-result/rust/src/lib.rs` (:336-470), `packages/run-result/contracts/run-result.read.v1.json`, `packages/observe/rust/src/metrics_cli/mod.rs`, `src/cli/command-registry.mjs`, `docs/specs/observe.md`, `CHANGELOG.md`.
- Create: `packages/observe/rust/src/metrics_cli/coverage.rs`, `packages/run-result/rust/tests/layout_fixture.rs`.
- Replace: `packages/run-result/rust/tests/smoke_real_store.rs` (delete the `>= 1028` and `== 103` pins; no live-store assertion in cargo tests, live checking belongs to doctor).
- Check: `test/fixtures/observe/` goldens (`scripts/regenerate-observe-fixtures.mjs`, regenerate with the suite's real invocation, `git diff --stat` before staging).

## Implementation Steps

1. Prior-art: `git log -S"smoke_real_store"`; read what 1028/103 guarded.
2. Implement `scan_runs` and `metrics coverage`; keep `derive_legacy_outcome` untouched.
3. Fixture test from the shared `expected.json`; add the mutation check once (restrict the walker to depth 1, see the test fail, note it).
4. Measure the scan time on this repo's store; if over about one second, add an mtime-keyed cache; build nothing before measuring.
5. `cargo test -p fgos-run-result -p fgos-observe`; `cargo build -p fgos`; with `FGOS_HOST_BIN` check `metrics coverage` and `metrics runs --by=role --since=2026-10-05` here and from mdview.
6. Record before/after totals in `plans/reports/` (887 → N).

## Success Criteria

- [ ] `metrics runs --since=2026-10-01` > 0 and `--by=role` lists today's roles.
- [ ] `metrics coverage` accounting holds: `observed + skipped = runDirsSeen`; skip reasons present.
- [ ] Rust and Node produce the same run set from the shared fixture.
- [ ] No test pins an audit-time count; no cargo test depends on the live store.

## Risk Assessment

- All downstream numbers (harness scorecard, entropy, snapshots) change meaning; stored snapshots are not rewritten, phase 3 labels them pre-fix.
- Runs mid-write: `result.json` is written non-atomically while settling; `recentRuns` and the doctor tolerance cover it, tests do not touch live stores.
- Signal it broke: coverage accounting off or fixture sets differ; response: fix the walker, never loosen the comparison.
