---
phase: 3
title: "Hot record door in holder-lock (read, judge, clear)"
status: pending
effort: 2d
wave: B
step: S2
blockedBy: [0]
---

# Phase 03: Hot record door

`lock-status` reports hot mutex records and `lock fence state|porting-events` clears them; both move to Rust (04,
05). The record's reader, judge and clearer are Node today (`src/state/hot-lock.mjs:53-150`) and `withStateTx`
(380) uses them on every state write's reclaim path. One owner: the holder-lock crate (holder-lock spec §15 owns the
hot mutex and its contract `packages/holder-lock/contracts/hot-lock.v1.json`). Node's five functions become calls of
the addon; the record **writer** (taking the hot mutex inside `withStateTx`) stays Node until the Work step (S7),
visible as debt. No verb flips here.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s2-p03`. Report slug `s2-p03-hot-record`.

## Context

- Node: `hotPaths` :44, `judgeHotRecord` :53, `readHotRecord` :88, `unlinkRecordIfUnchanged` :109,
  `reclaimDeadHolder` :126, `clearHotRecord` :150, `withStateTx` :380 (`src/state/hot-lock.mjs`, 416 lines).
- Judge of a holder: process facts (`packages/process/rust/src/facts.rs:215` `judge`; addon `process.rs:27`).
- Clearing happens under the kernel lock `<resource>.reclaim.lock` and only while the record still holds the bytes
  that were read (holder-lock spec §17 item 5); holder-lock owns the kernel lock (`port.rs`).
- Callers of the five functions (00 F4 lists them all): `withStateTx`, `src/runner/lock-status.mjs` (15),
  `src/runner/lock-fence.mjs`, tests `test/state/hot-lock-tx.test.mjs`, `hot-lock-guard.test.mjs`,
  `hot-lock-multiprocess.test.mjs`, `test/holder-lock/windows-hot-lock.test.mjs`, `test/event-store/work-gate.test.mjs`.

## Requirements

1. `packages/holder-lock/rust/src/hot_record.rs`: `paths(fgos_dir, resource)`, `read(path) -> Option<HotRecord>`
   (raw bytes kept for the compare-and-clear), `judge(&HotRecord) -> Verdict` (alive / dead / unknown, the same
   rules as `judgeHotRecord`, through `fgos_process`), `reclaim_dead(fgos_dir, resource, observed)` and
   `clear(fgos_dir, resource, raw)` (under the reclaim kernel lock, unlink only if unchanged). A shared vector file
   `packages/holder-lock/contracts/hot-record-vectors.v1.json` (records and their verdict/outcome) read by the Rust
   unit tests and by the adapter's Node test.
2. Addon `packages/git/node-addon/src/holder_lock.rs`: entries for the five; `src/state/hot-lock.mjs` keeps every
   export name and shape, its five functions now call the addon; `withStateTx` and the record write stay as they are.
3. Measure `withStateTx` (00 F4's hot path) before and after on 1000 iterations; report the medians. A slowdown above
   5 % stops the phase for the step lead.
4. `doors` row "judge and clear a hot mutex record": patterns the Node definitions
   `export function (?:judgeHotRecord|readHotRecord|reclaimDeadHolder|clearHotRecord|unlinkRecordIfUnchanged)\b` and the
   record's marks in either language, `\.hot['"]` and `\.reclaim\.lock` (a bare `fn judge` is too common to be a
   pattern); allowed `packages/holder-lock/rust/src/hot_record.rs`,
   `packages/git/node-addon/src/holder_lock.rs` (reason: carries the door), `src/state/hot-lock.mjs` (reason: adapter
   plus the record writer of `withStateTx`); debt: none if 00 finds no other reader; `retiredBy: "S7: the Node
   writer moves with the Work state store"`. Narrow the patterns on the first run and say how in the report.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| a dead holder's record is reclaimed; an unreadable record is never cleared; clear only if unchanged | `hot-lock-tx.test.mjs`, `hot-lock-guard.test.mjs` cases on the judge | `hot_record.rs` unit tests + the vector file; the Node files keep only `withStateTx` behaviour (reentry, exec-under-lock) |
| multiprocess contention, Windows hot lock | `hot-lock-multiprocess.test.mjs`, `windows-hot-lock.test.mjs` | unchanged (they prove `withStateTx` across processes; now through the addon) |

## Files

- Create: `packages/holder-lock/rust/src/hot_record.rs`, `packages/holder-lock/contracts/hot-record-vectors.v1.json`.
- Modify: `packages/holder-lock/rust/src/lib.rs`, `packages/git/node-addon/src/holder_lock.rs`, `src/state/hot-lock.mjs`,
  `test/state/hot-lock-tx.test.mjs`, `test/state/hot-lock-guard.test.mjs`, `docs/architecture-manifest.json`, census;
  `packages/holder-lock/contracts/hot-lock.v1.json` only if 00 F4 finds a field undocumented.
- Delete: the five Node bodies (inside the file). Tests retired: the judge cases (names in the report).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-holder-lock -p fgos-node-addon --all-targets -- -D warnings`;
  `cargo test -p fgos-holder-lock`; msvc and darwin checks of both crates (the Windows judge path compiles)
- `node scripts/run-tests.mjs test/state/hot-lock-tx.test.mjs test/state/hot-lock-guard.test.mjs test/state/hot-lock-multiprocess.test.mjs test/holder-lock/windows-hot-lock.test.mjs test/event-store/work-gate.test.mjs test/runner/lock-status.test.mjs test/cli/fgos-lock-fence.test.mjs test/git/native-load.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`

## Risk and rollback

- A judge difference reclaims a live holder's record (L x H): the vector file holds every verdict of today's Node
  tests; multiprocess tests run unchanged.
- Addon cost on the state-write path (L x M): requirement 3's measurement and stop rule.
- Rollback: revert the phase; the record format is unchanged, so nothing on disk differs.
