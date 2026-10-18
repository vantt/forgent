# Experiment E3 again, after optimizing the Publication port

Date: 2026-10-18/19 (Asia/Saigon). Branch `git/p01-publication-perf` from `b54842799`. Code under test: commits `cbf9b3feb`..`1d13db5bc` (the full run recorded `checkoutHead` `f07a23445` with the last two commits' changes in the working tree; the code was identical to `1d13db5bc`).
Budgets: `plans/261018-0914-git-component-fgos-git/e3-budgets.md`, owner-set, not edited. Previous run: `plans/reports/experiment-261018-2005-git-e3-combined-addon-budgets.md`.
Owner decision (2026-10-18 22:23): keep Q1 (one combined N-API addon), keep the budgets, optimize the port.

## Verdict first

Ten of the eleven measurable lines pass. **`compareAndSwap` changing still fails** (p95 about 120 ms on a quiet host, about 190 ms while other sessions load the disk; budget 60 ms). The rest is irreducible fsync cost on this device, under the spec's ordering, plus the per-operation compaction the plan requires (rule 12a). `writeBlob` new passes on a quiet host (p95 12.3 ms) and fails while the host disk is busy (p95 21.4 ms in the full run): its two required journal commits double from about 5 to about 10 ms each under load. No guarantee was relaxed and no budget was touched.

## Before and after, per budget line

"Before" is the previous report (full run, load 8-10). "After, full run" is the full `e3-bench.mjs run` of this lane (same n, release build, ext4); load average was 19-20 while the early rows (`writeBlob`, `compareAndSwap` changing) ran and 7 by the end. "After, quiet" is an interleaved Node-route A/B run at load 7-11 (`mini.mjs` below, n=60, same machine, base and new builds alternated); its base runs measured CAS changing p50 302-436 ms, matching "before".

| Budget line | Budget | Before | After, full run | After, quiet | Verdict |
|---|---|---|---|---|---|
| Addon load, first call | ≤ 30 ms | p95 5.24 | p95 5.06 | | pass |
| `writeBlob` new | p95 ≤ 15 | 42.8 | **21.39** | 12.3 / 12.8 | pass when the disk is quiet, **fail** under load (two serial journal commits) |
| `writeBlob` existing | p95 ≤ 10 | 35.6 | 1.90 | 1.4 / 1.5 | pass |
| `compareAndSwap` no-op | p95 ≤ 15 | 156.5 | 2.39 | 2.4 / 2.5 | pass |
| `compareAndSwap` changing | p95 ≤ 60 / p99 ≤ 120 | 535.0 / 562.7 | **191.7 / 197.0** (320→1000 retained: 129.4 / 149.4, 136.5 / 141.4) | **118.2 / 120.5**, 121.6 / 124.4 | **fail** |
| Local push, no new objects | p95 ≤ 150 | 404.9 | 134.9 | | pass |
| Local push, with objects | p95 ≤ 250 | 415.8 | 138.4 | | pass |
| ScopedCommit, Land | 1.5x / 1.2x | not in phase 01 | not in phase 01 | | not measurable |
| Git subprocesses per op | reported | see census | see census | | reported |
| WAL amplification per completed op | ≤ 32 KiB / ≤ 12 inodes | 28,699 B / 7 | 4,123 B / 1 inode (WAL), 0 pin | | pass |
| Backlog scan, 10,000 pending | ≤ 300 ms, complete | p95 255.8 | p95 238.5, complete | | pass |
| Reconcile 100 interrupted | ≤ 10 s | 26.7 s | 5.58 s (55.8 ms/op) | | pass |
| Rollback with live processes | C5 refused or completed, nothing lost | pass | 0 lost, tip = last receipt; 26 completed, 3 `git-wal-pending`, 5 `git-wal-unreadable` | | pass |

Retention no longer grows: changing CAS at 320 retained p50 121.7, at 1,000 p50 127.3 (before: 489 → 562). Only the four newest terminal chains of a ref stay whole; older ones are compacted (`walInodesPerOp` 1, no pins left).

First Publication in a fresh process: p50 77.8 ms (before 234 ms).

In-process Rust port (no Node-API), same full run, load ~7: CAS changing p50 113.1 / p95 115.8, no-op 2.05, `writeBlob` existing 1.13, new 11.87 (p95). The private-PID-namespace diagnostic now matches the host (116 vs 113 p50): the per-host term is gone.

## Census: Git children and fsync calls per operation

strace `-f`, three runs, between per-operation markers (`subprocessCensus`, now also counting `fsync`/`fdatasync`; concurrent fsyncs count once each).

| Operation | execve before | execve after | fsync before | fsync after |
|---|---|---|---|---|
| `writeBlob` new | 4, 1, 1 | 4, 1, 1 | 11 | 3 |
| `writeBlob` existing | 1 | 1 | 10 | 0 |
| CAS changing | 18 | 10 (8 on a ref seen before) | 47 | 20 |
| CAS no-op | 4 | 1 | 30 | 0 |
| push, with or without objects | 19 | 12 (16 when it compacts) | 41 | 13 (25 when it compacts) |

The first `writeBlob` of a process still runs the three config preflight calls (`git var` x2, `git config --list`), as before.

## What changed, per cost item

1. **Per-spawn `/proc` walk (holder-lock).** A handle now keeps a *creation mark* (last allocated pid and boot-clock ticks), taken before its description is opened and moved forward by every drain or quiescence check that proves no other process holds it. A description is only ever copied across fork, so every other holder was created after the mark; the drain reads only those processes, found by probing pids in allocation order after the mark (or, when the mark is older than `pid_max / 4,000,000` s or the pid range cannot be read, by start time over every process). A check that cannot prove the domain empty leaves the mark in place, so the same leaked holder is found again. Same kill, wait and refusal rules as before; `lock-fd --drain-child` (a description of unknown history) still reads every process. Borrowed children now start through `posix_spawn` with the same descriptor map (fork of a large Node process cost about 3 ms per child), and the I/O loop wakes on pipe activity and the child's pidfd instead of 1 ms sleeps. Borrow of `/usr/bin/true`: 5.3 → 0.4 ms. The kernel flock probe the task suggested is not usable: the holder keeps its own description locked across borrows, so a probe on a second description always fails and says nothing about who else shares the first; no kernel interface exposes a description's reference count.
2. **Git children per CAS (18 → 8-10).** `read_ref` lists first and runs `symbolic-ref` only for an unlisted name (a dangling symbolic ref is never listed, so it is still found); a ref expected absent (operation pin) is probed with `show-ref --exists`; the candidate check is one `rev-list --objects --missing=error <oid>^{commit} --not <expected>` (falls back to the old type read and walk on any failure, so refusals keep their answers); the target CAS reuses the TargetAttempt read as its preflight; receipts read the tip only for outcomes that report it; a push reads its ref once. Pin and target stay single-ref no-deref exact-old CAS in separate Git calls with read-back; nothing was merged into an `update-ref --stdin` transaction, and no interactive session was added (the borrow API returns only finished children).
3. **fsync (47 → 20 per CAS).** Every record still does file fsync, no-overwrite install, directory fsync; record zero also fsyncs the parent of its new operation directory. Removed only repeats with no write in between: the second directory fsync after each record install, the ledger directory re-sync, the operation directory fsync at creation (record zero's install syncs it and its parent before the record is acknowledged), the WAL skeleton directories on every open (once per process per directory, keyed by device, inode and birth time), object directories already made durable by this process for the same loose file (device and inode checked). Directory chains are fsynced concurrently, and a ref's chain is fsynced alongside the next record's own file sync, with that record's name installed only after both finished: the two share one journal commit and the record still never exists before the ref is durable. A known operation id no longer writes and syncs a doomed record-zero temporary.
4. **Compaction on the normal path.** Admission of each publication compacts the ref's terminal chains beyond the four most recently changed (pin released with its own record and read-back, ledger entry, directory removed), following plan rule 12a ("inside a later Publication call"). Admission therefore reads at most a handful of chains, and the 100,000-directory stop is out of reach. Replaying a compacted id with the same request returns its receipt from the ledger; a different request is refused. `release_pin_and_compact` on an already compacted id returns its ledger entry; `recover` of a compacted id refuses with `operation-compacted` (the ledger keeps the binding and outcome, not the expected value a full receipt names).
5. **First Publication (234 → 78 ms).** The Git floor probe (about fourteen contained Git calls, each in its own bwrap pid namespace) now records its verdict in the driver's state root, keyed by the Git binary's identity, the floor contract digest, `HOME`/`XDG_CONFIG_HOME` and the identities of the config files the probes' Git can read; any change re-probes. The WAL skeleton fsync memo also removes the eight directory fsyncs of the first open.
6. **Reconciliation (26.7 → 5.6 s).** Same fixes; no recovery rule changed. Outcomes are as before: 25 abandoned before attempt, 25 `RecoveryRequired` (never replayed, still pending), 50 `effectObservedOnly`.

## Why CAS changing still fails

A changing CAS has ten serial journal commits that the spec orders: Intent (file, then directory and parent), the pin's own `update-ref` lock fsync (Git), the pin's directory chain together with the Prepared file, Prepared directory, TargetAttempt file, TargetAttempt directory, the target's lock fsync (Git), the target's chain together with the Outcome file, Outcome directory. One commit on this Samsung 980 PRO is about 5.2 ms when the disk is idle and about 10 ms while other sessions write (measured with a plain write+fsync loop). That is 52 ms of fsync on a quiet disk before any Git child runs. Compaction of the previous operation adds eight more commits (PinReleaseAttempt file and directory, pin chain with the PinReleased file, PinReleased directory, ledger file and directory, operation directory, operations directory) and three Git children. So about 120 ms is the floor on this device with compaction on every publication, and about 70 ms without it, against a 60 ms p95.

Options that would close the gap all change the contract, so none was taken: deferring the Prepared record's directory fsync into the TargetAttempt write (5 ms), batching compaction every N publications (amortized, but a spike that breaks p99), or dropping durability the spec requires.

## Changes to the harness

- `subprocessCensus` also counts `fsync`/`fdatasync` per operation.
- The rollback row reads each receipt back by replaying its exact request (`compareAndSwap` with the same id, expected and next) instead of `recover`, because ids older than the four newest are now compacted. A lost or mismatched receipt still counts against the row.

## Tests

`cargo test --locked --no-fail-fast -p fgos-git -p fgos-holder-lock -p fgos-durable-file -p fgos-node-addon -p fgos-event-store -p fgos-distribution -p fgctl -- --test-threads=1`: 328 passed, 0 failed. `cargo clippy ... --all-targets -D warnings` on those crates and `fgos-process`: clean. `fgos-process`: 70 passed, 1 failed (`containment_terminal_gate_dies_with_a_killed_supervisor`, fails the same way on `b54842799`). Node `node --test test/holder-lock/*.test.mjs test/git/*.test.mjs` with `FGOS_HOST_BIN` set to a host built from this branch: 109 pass, 5 fail, 20 skipped; the five failures (fence placement tests) also fail with a host built from `b54842799`.

New tests: escapee started after an earlier proven drain is still killed; a refused admission keeps finding the same leaked holder; processes created since a mark exclude thread ids and the caller; a later start time than the mark; mapped spawn (slot and nothing else, environment, cwd, group, stdin, exit code, missing program, low slot); ordered install (barrier before the name, alongside failure leaves only the temporary); WAL directories synced once per process and re-synced when recreated; bounded retained chains with compacted ids still bound and replayable; floor record reused only for the same key and a consistent verdict, never through a symlink.

`seal_cas_race` exposed one regression during the work: a concurrent store's pin deletion pruned a directory between listing a ref chain and the concurrent fsync. A pruned directory in a ref chain is now skipped (its removal is made durable by its parent, which is in the chain); 40 consecutive runs passed afterwards.

## Concerns for the owner

1. `compareAndSwap` changing fails by the fsync floor of this device (above). Q1 stays valid: the in-process Rust port measures the same as the Node route.
2. Rollback under a live writer now sometimes refuses with `git-wal-unreadable` (5 of 34 attempts): `fgctl`'s C5 scan saw an operation directory disappear while the live writer compacted it. It is a refusal, never a lost record, but it makes rollback under a live writer retry more often. Making the scan tolerate a directory compacted mid-scan would be a C5 change; not done here.
3. `recover` of a compacted id now refuses (`operation-compacted`); the full receipt comes from replaying the same request. No production caller uses `recover` yet.
4. The pid-order fast path of the drain trusts that fewer than `pid_max` pids can be allocated within `pid_max / 4,000,000` seconds (about one second at the default `pid_max`); past that window the drain reads every process by start time.
5. New persistent state: `git-floor-verdict.json` in the driver's state root, an optional record (missing or different means probe again). It is not registered as a doctor check.

## Reproduce

```bash
export CARGO_TARGET_DIR=$PWD/.fgos/runtime/phase-target
T=$CARGO_TARGET_DIR/release
node scripts/git/e3-bench.mjs run --samples 500 --pushSamples 100 \
  --root $PWD/.fgos/runtime/e3-bench/after \
  --addon $T/libfgos_node_addon.so --fixture $T/examples/e3_fixture --fgctl $T/fgctl
```

Artifacts compiled with `cargo build --release --locked -p fgos-node-addon --lib --example e3_fixture` and `-p fgctl`. Raw results: `.fgos/runtime/e3-bench/after/results.json` (ignored scratch output, not committed). The quiet A/B used a small Node script that stages the addon like the harness and times `writeBlob` new/existing (n=60 each after 30 warm-up) and changing/no-op CAS (after 10 warm-up) through `src/git/index.mjs`, alternating a build of `b54842799` and of this branch; it is not committed.
