---
phase: 3
title: "Hot record door in holder-lock (read, compare-and-clear)"
status: completed
effort: 2d
wave: B
step: S2
blockedBy: [0]
---

# Phase 03: Hot record door

`lock-status` reports hot mutex records and `lock fence state|porting-events` clears them; both move to Rust (04, 05).
The record's reader and its compare-and-clear are Node today (`src/state/hot-lock.mjs:88-150`) and `withStateTx` (380)
reaches them only under contention (`tryLinkRecord` first, 198-209). One owner (D5): the holder-lock crate, whose spec
§15 owns the hot mutex and its contract `packages/holder-lock/contracts/hot-lock.v1.json`. Node's read, reclaim and
clear call the addon; the record **writer** (taking the hot mutex in `withStateTx`) stays Node until the Work step (S7),
visible as debt. No verb flips here.

Why this is decided here and not asked like S23-Q1: the record and its contract belong to a lower layer (holder-lock),
and moving them puts Work's code on a lower owner (bottom-up); S23-Q1's modules belong to Execution, a layer above the
verbs that would pull them down early.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s2-p03`. Report slug `s2-p03-hot-record`.

## Context

- Node: `hotPaths` :44 (record path built as `` `${resource}.hot` ``), `judgeHotRecord` :53 (already just the process
  door's `judge`), `readHotRecord` :88 (reads as UTF-8), `unlinkRecordIfUnchanged` :109, `reclaimDeadHolder` :126,
  `clearHotRecord` :150, `withStateTx` :380 (`src/state/hot-lock.mjs`, 416 lines).
- Rust: process facts `judge` (`packages/process/rust/src/facts.rs:215`); holder-lock `acquire` by path (`port.rs`);
  the registry `LockScope` refuses `hot-mutex` rows (`packages/holder-lock/rust/src/scope.rs:131-135`), so the reclaim
  lock is taken by its path, not through the scope.
- Contract and its test: `hot-lock.v1.json`, `test/holder-lock/hot-lock-contract.test.mjs`.
- Callers (00 F4 completes the list): `withStateTx`, `src/runner/lock-status.mjs` (until 04), `src/runner/lock-fence.mjs`
  (until 05); tests `test/state/hot-lock-tx.test.mjs`, `hot-lock-guard.test.mjs`, `hot-lock-multiprocess.test.mjs`,
  `test/holder-lock/windows-hot-lock.test.mjs`, `test/event-store/work-gate.test.mjs`.

## Requirements

1. `packages/holder-lock/rust/src/hot_record.rs`: record and reclaim-lock paths from the contract;
   `read(fgos_dir, resource) -> Read { Missing | Unreadable { token } | Ok { record, token } }` where `token` is the
   record's bytes (opaque to callers); `reclaim_dead(fgos_dir, resource, token)` and `clear(fgos_dir, resource, token)`
   (under the reclaim kernel lock, unlink only if the bytes are unchanged; the judge through `fgos_process`). The vector
   rows go into `hot-lock.v1.json` (extend it; no second contract file): records, their verdicts and the clear outcome,
   including a record that is not valid UTF-8 (a torn write) and one that changed between read and clear.
2. Addon `packages/git/node-addon/src/holder_lock.rs`: entries for read, reclaim and clear; the token crosses as a
   `Buffer`, never a JS string (a torn record must compare equal to itself). `src/state/hot-lock.mjs` keeps every export
   name; `readHotRecord`, `unlinkRecordIfUnchanged`, `reclaimDeadHolder`, `clearHotRecord` become calls of those entries;
   `judgeHotRecord` stays the process door's `judge`; `withStateTx` and the record write are unchanged.
3. Measure the **contended** path (two processes taking `state`, 200 rounds; 00 F4's baseline) before and after; report
   the medians. A slowdown above 5 % stops the phase for the step lead.
4. `doors` row "read and clear a hot mutex record": patterns the Node definitions
   `export function (?:readHotRecord|reclaimDeadHolder|clearHotRecord|unlinkRecordIfUnchanged)\b` and the reclaim lock's
   name `\.reclaim\.lock` (narrowed on the first run; the `.hot` name is built by a template literal, so it is not a
   pattern); allowed `packages/holder-lock/rust/src/hot_record.rs`, `packages/git/node-addon/src/holder_lock.rs` (reason:
   carries the door), `src/state/hot-lock.mjs` (reason: client plus the record writer of `withStateTx`); debt
   `src/runner/lock-status.mjs` (reason: lists the reclaim lock files until `lock-status` moves; removed by its port);
   `retiredBy: "S7: the Node writer moves with the Work state store"`. Negative case in the report.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| a dead holder's record is reclaimed; an unreadable record is never cleared; clear only if unchanged | judge cases of `hot-lock-tx.test.mjs`, `hot-lock-guard.test.mjs` | `hot_record.rs` unit tests + the contract rows; the Node files keep only `withStateTx` behaviour (reentry, exec-under-lock, contention) |
| the contract's paths and fields | `test/holder-lock/hot-lock-contract.test.mjs` | unchanged, now also reads the new rows |
| multiprocess contention, Windows hot lock | `hot-lock-multiprocess.test.mjs`, `windows-hot-lock.test.mjs` | unchanged (now through the addon) |

## Files

- Create: `packages/holder-lock/rust/src/hot_record.rs`.
- Modify: `packages/holder-lock/rust/src/lib.rs`, `packages/holder-lock/contracts/hot-lock.v1.json`,
  `packages/git/node-addon/src/holder_lock.rs`, `src/state/hot-lock.mjs`, `test/state/hot-lock-tx.test.mjs`,
  `test/state/hot-lock-guard.test.mjs`, `test/holder-lock/hot-lock-contract.test.mjs`, `docs/architecture-manifest.json`, census.
- Delete: the four Node bodies (inside the file). Tests retired: the judge cases (names in the report).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-holder-lock -p fgos-node-addon --all-targets -- -D warnings`;
  `cargo test -p fgos-holder-lock`; msvc and darwin checks of both crates
- `node scripts/run-tests.mjs test/holder-lock/hot-lock-contract.test.mjs test/state/hot-lock-tx.test.mjs test/state/hot-lock-guard.test.mjs test/state/hot-lock-multiprocess.test.mjs test/holder-lock/windows-hot-lock.test.mjs test/event-store/work-gate.test.mjs test/runner/lock-status.test.mjs test/cli/fgos-lock-fence.test.mjs test/git/native-load.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`

## Risk and rollback

- A clear that never matches (torn record) wedges reclaim (M x H): bytes as an opaque token; the invalid-UTF-8 row.
- A verdict difference reclaims a live holder's record (L x H): the judge is unchanged (process door); multiprocess tests run unchanged.
- Rollback: revert the phase; the record format is unchanged.
