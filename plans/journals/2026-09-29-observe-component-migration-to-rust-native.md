---
title: Observe component migration to Rust native
date: 2026-09-29
summary: "Completed full migration of Observe component to Rust native with fgos metrics and fgos friction, 8 phases delivered in parallel with zero regressions."
---

# Observe component migration to Rust native

Completed full migration of Observe component to Rust native with fgos metrics and fgos friction, 8 phases delivered in parallel with zero regressions.


## Architectural Decisions Delivered

1. **Observe Component (`packages/observe/rust`)**:
   - Fully migrated to Rust native with zero Node dependencies for observation and friction storage.
   - Composition root (`apps/fgos`) wires observation sources without reverse coupling into `fgos-observe`.
2. **Single Path for Commands**:
   - Native subcommand routing for `fgos metrics` and `fgos friction` via Rust host.
   - Recursion guard relocated to `legacy-cli` route only; `FGOS_HOST_BIN` exported to Node child processes.
   - Node legacy CLI refuses native-only commands (`metrics`, `friction`) with exit 4.
3. **Substrate Entities as Primary Measurement Unit**:
   - Measurement based on Cases, Runs (`packages/run-result/rust`), Sessions (`packages/coordination-state/rust`), Transcripts, and Git commits.
   - Work is an optional intent layer source (`packages/work-state/rust/src/work_source.rs`).
4. **Unified Friction Store**:
   - Single Rust writer `fgos_observe::friction` with writer-sharded JSONL store under `.fgos/observe/friction/<writerId>.jsonl`.
   - Inter-process locking via O_CREAT | O_EXCL `.fgos/observe/.lock` with dead-holder detection and 30s TTL.
   - Lazy migration from historical `work.friction` records.
   - Node Work core migrated from `addFriction` to `recordFriction` / `resolveFriction` via `invokeHost`.
5. **Clean Elimination of Legacy Commands**:
   - `fgos faults` and `fgos dispatch-report` eliminated in Phase F4.
   - `fgos evolve` eliminated in Phase F5; candidate ranking replaced by `fgos friction rank` + `fgos submit`.
   - `fgos check` and `src/report/entropy.mjs` eliminated in Phase F7; replaced by `metrics outcomes`, `metrics entropy`, `metrics snapshot`.

## Deliverables & Test Verification

- **Crates Added**: `packages/observe/rust`, `packages/run-result/rust`, `packages/coordination-state/rust`.
- **Test Suites**:
  - `cargo test --workspace`: 209 unit and integration tests passing across 26 suites.
  - `node --test test/rust-host/command-routes.test.mjs`: 14 tests passing.
  - `node --test test/util/host-bin.test.mjs`: 5 tests passing (including 64 KB stdin round-trip).
  - `node --test test/setup/observe-doctor-checks.test.mjs`: 7 tests passing.
  - `node bin/fgos.mjs doctor`: `observe-dir-writable`, `observe-friction-migrated` (752 records), `observe-host-resolvable` all passing.
  - `cargo run -p fgos -- metrics harness --since 2026-09-01 --dir .`: runs in <5s with 887 runs, 293 sessions, work scorecard #1/#2, faults, and tokens.
> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
