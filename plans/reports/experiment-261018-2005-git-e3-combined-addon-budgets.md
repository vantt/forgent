# Experiment E3: combined addon against the owner-set budgets

Date: 2026-10-18 (Asia/Saigon). Checkout: `14c493177` (Git phase 01 Lanes A and B), branch `git/p01-e3-measure`.
Budgets: `plans/261018-0914-git-component-fgos-git/e3-budgets.md`, status "Owner-set on 2026-10-18", committed before this run and not edited.

## Verdict first: budgets FAIL, the Q1 reversal trigger is hit

Eight measured budget lines fail: `writeBlob` new and existing, `compareAndSwap` no-op and changing, local push with and without objects, and reconciliation of 100 interrupted publications. Under spec §4 and §15 E3 this is the **Q1 reversal trigger**. The plan stops at phase 01 step 13 and the owner decides. No budget was tuned and no number is hidden.

Rollback with live processes passes: the C5 door refused or completed every attempt, and no record was lost or corrupted.

The evidence points away from the topology. The same workloads run in-process on the Rust port, with no Node-API boundary, cost the same as the Node route (`compareAndSwap` p50 438 ms Rust against 471 ms Node). The cost comes from the Publication port itself on this host. Most of it is per-spawn work proportional to the number of processes on the host. The rest is 18 Git spawns and 47 `fsync` calls for each changing CAS. Even with that per-host term removed (private PID namespace), changing CAS is still about 2x its budget. A host-process route (topology b) would run the same port code, so on this evidence it would not pass either. Whether that changes the Q1 decision is the owner's call.

## Verdict table

n = measured samples after warm-up (20 to 50 warm-up calls per row). Percentiles are nearest-rank. Times are wall time in milliseconds, measured around the Node facade call (Node → `src/git` → combined addon → `fgos-git`) unless the row says otherwise.

| Budget line | Measured | Budget | Verdict |
|---|---|---|---|
| Addon load, first call in a process (`loadNativeAddon` incl. digest check, `dlopen`, `versions()`), 50 fresh processes | p50 3.65, p95 5.24, max 6.52 | ≤ 30 ms | **pass** |
| `writeBlob`, new object (1 KiB), n=500 | p50 33.0, p95 **42.8**, p99 48.5 | p95 ≤ 15 ms | **FAIL** |
| `writeBlob`, existing object, n=500 | p50 26.7, p95 **35.6**, p99 44.2 | p95 ≤ 10 ms | **FAIL** |
| `compareAndSwap` no-op (same operationId replayed after completion, ref already at next), n=300 | p50 122.3, p95 **156.5**, p99 172.3 | p95 ≤ 15 ms | **FAIL** |
| `compareAndSwap` changing ref (Intent, pin, prepared, TargetAttempt, CAS, read-back, fsyncs, receipt), n=300, 20→320 retained ops | p50 471.3, p95 **535.0**, p99 **562.7** | p95 ≤ 60 / p99 ≤ 120 ms | **FAIL** |
| Local transport push, one ref, no new objects (objects pre-seeded on the remote), n=100 | p50 359.7, p95 **404.9**, p99 424.7 | p95 ≤ 150 ms | **FAIL** |
| Local transport push, one ref, with objects, n=100 | p50 358.9, p95 **415.8**, p99 450.3 | p95 ≤ 250 ms | **FAIL** |
| Full typed operation: ScopedCommit in a linked worktree | not implemented in phase 01 (phase 05/06 operation) | ≤ 1.5 × `commitUnitWork` | **not measurable in phase 01** |
| Full typed operation: Land (prepare + publish) | not implemented in phase 01 (phase 05/06 operation) | ≤ 1.2 × merge path | **not measurable in phase 01** |
| Git subprocess count per operation | writeBlob 1; CAS no-op 4; CAS changing 18; push 19 (18 git + 1 sh); one Node→addon call per operation | reported; no budget | reported |
| WAL amplification per completed operation (Node route, as shipped; no compaction) | WAL 20,507 B / 5 inodes; WAL + operation pin 28,699 B / 7 inodes | ≤ 32 KiB / ≤ 12 | **pass** |
| Backlog scan, 10,000 pending records (one Intent record each), Node `inspectGit`, n=20 | p50 238.9, p95 255.8, p99 348.9; `complete: true`, 10,000 pending, 0 errors | ≤ 300 ms, `complete: true` | **pass** (p95; p99 above 300) |
| Full reconciliation of 100 interrupted publications (Node `recover`, one port per stream) | **26.7 s** total (267 ms per operation) | ≤ 10 s | **FAIL** |
| Rollback with live processes (P-RELEASE overlap) through real `fgctl` | 20 rollbacks under a live writer: 8 refused `git-wal-pending`, 12 completed (each followed by a forward activation); live payload without `git-wal-v1` refused `git-predecessor-writer-live` naming its pid; 20 receipts, 0 lost or mismatched, ref tip = last receipt, WAL scan complete, 0 pending, 0 errors | refused by C5 or completed; zero lost or corrupt records | **pass** |

## Environment

| Item | Value |
|---|---|
| Host | fg-server2, Intel Core i7-13700 (24 threads), governor `powersave`, 31 GiB RAM |
| Kernel | Linux 7.0.0-38-generic |
| Filesystem | `/dev/nvme0n1p2` ext4 `rw,relatime` (Samsung SSD 980 PRO 500GB), work root under the user's home (`.fgos/runtime/e3-bench/final`), not tmpfs; the harness refuses any filesystem other than ext4 (`findmnt`) |
| Git | 2.53.0 |
| Node | v24.22.0 |
| Rust | rustc 1.99.0; release profile (`cargo build --release --locked`) for the addon, `e3_fixture` and `fgctl` |
| Load | load average 8.4 / 9.8 / 8.3 during the run (other agent sessions on the host); 821 processes visible in `/proc` |

The host was not idle. The PID-namespace diagnostic below shows the failures are structural, not load noise: in that run every timing still fails except `writeBlob` new.

## Where the cost is (diagnostics, no budget)

**Node-API boundary is not the cost.** `e3_fixture port` runs the same workloads on `PublicationPort` in-process, with the same seal resource and authority binding as the addon, n=100:

| Workload | Node route p50 / p95 | Rust port in-process, host (821 processes) p50 / p95 | Rust port in-process, private PID namespace (`bwrap --unshare-pid --proc /proc`) p50 / p95 |
|---|---|---|---|
| writeBlob new | 33.0 / 42.8 | 32.0 / 44.2 | 13.6 / 14.6 |
| writeBlob existing | 26.7 / 35.6 | 25.8 / 30.3 | 8.6 / 10.6 |
| CAS no-op | 122.3 / 156.5 | 109.0 / 127.7 | 38.0 / 48.4 |
| CAS changing | 471.3 / 535.0 | 437.7 / 487.4 | 132.4 / 170.1 |

- **Host-size term.** Hiding the host's processes removes about 300 ms from each changing CAS, about 17 ms per Git spawn. The probable mechanism is in the code path, not proven by a profiler: perf is disallowed on this host (`perf_event_paranoid` = 4). Each Publication spawn is a holder-lock borrowed spawn. On Linux, ending it calls `drain_description` → `fgos_process::facts::lock_holders`, and admission calls `validate_quiescent`. Both walk every pid in `/proc` and read its fd table (`packages/process/rust/src/platform/linux.rs:64`, `packages/holder-lock/rust/src/driver/flock.rs:231-259`). A plain `ls -l /proc/*/fd` over the same host takes about 22 ms. So the cost grows with every process on the developer's machine.
- **Fixed term.** Even with only a few processes visible, changing CAS costs 132 ms p50 against 1.7 ms for today's Node writer shape (one `git update-ref` from `execFileSync`). That cost is 18 Git spawns plus 47 `fsync` calls, counted by strace on one traced CAS. The calls come from the port and from its Git children under `core.fsync=all`: WAL record install, directory and parent fsyncs, object and ref directory fsyncs. The port's own directory fsyncs took about 5 ms each on this device.
- **First Publication in a process:** 234 ms p50 / 275 ms p95 (Git floor probe, config preflight, seal acquire, first `readRef`). This is paid once per process on top of the 3.7 ms addon load.
- **Retention growth.** A completed CAS is never compacted on the Node route; `release_pin_and_compact` is reachable from Rust only. Admission (`admit_pending` → `Wal::active`) re-reads every retained chain on each CAS. Changing CAS p50 rose from 471 ms (20 to 320 retained) to 489 ms (320 retained) to 562 ms (1,000 retained), about +0.13 ms per retained operation. By code reading (not run), `Wal::active(100_000)` returns `RecoveryRequired` once 100,000 operation directories exist, so an uncompacted stream would stop publishing at that point.
- **Compaction (Rust door only)** shrinks a completed operation to 4,219 B and 1.01 inodes, and removes its pin. It costs 202 ms per operation on this host.
- **Backlog shape sensitivity.** With 10,000 pending operations at TargetAttempt (3 records each, 30,000 records), Node `inspectGit` is p95 415.6 ms and the Rust C5 scan (`Wal::scan`, what `fgctl` runs) is p95 320.8 ms. Both are above 300 ms. The budget line counts records, and the 10,000-record case passes; the owner may read it otherwise.
- **Reconciliation outcomes** (interruption points cycled, 25 each): `after-pin-cas` → abandoned before attempt; `before-target-cas` → `RecoveryRequired` (correctly never replayed, still pending afterwards); `after-target-cas` and `target-read-back` → `effectObservedOnly` receipt. 25 of 100 remain pending by design. 0 scan errors.
- **Backlog disk:** 10,000 Intent-only operations take 82.3 MB allocated in 20,002 inodes, 46.5 MB logical (`retainedBytes`). Oldest debt is reported (`backlog-00000`). The attempt shape takes 164.2 MB in 40,002 inodes.

### Subprocess census (strace `execve`, 3 runs each, between per-operation markers)

| Operation | execve per run | Git top-level | Node→addon calls |
|---|---|---|---|
| writeBlob new | 4, 1, 1 (first run includes the per-process config preflight `git var` calls) | same | 1 |
| writeBlob existing | 1 | 1 | 1 |
| compareAndSwap changing | 18: 7 `readRef` (each `symbolic-ref` + `for-each-ref`), `cat-file`, `rev-list --objects`, 2 `update-ref` | 18 | 1 |
| compareAndSwap no-op replay | 4 | 4 | 1 |
| pushRefs, with or without objects | 19 (18 git incl. transport helpers, 1 `sh`) | 18 | 1 |

## Comparison with the DC baseline (spec §19 E3 row)

| DC measurement (warm tmpfs, CLI) | This run (ext4, same metric where comparable) |
|---|---|
| One plumbing spawn p50 5.4-6.4 ms, p95 6.9-7.7 ms | Node `execFileSync git`: `hash-object -w` p50 2.9 / p95 6.6; `rev-parse` p50 1.4 / p95 1.7; `update-ref` CAS p50 1.7 / p95 2.6 (n=200 each). A raw spawn is not the problem on this host |
| 100 refs: 100 processes p50 334 ms; one `update-ref --stdin` p50 12.0 ms | Not repeated: Git never uses multi-ref transactions for a target (spec §4) |
| WAL model: one 914-byte record = 4,096 allocated bytes (~4.5x) | Completed CAS = 4 records + directory = 20,507 B / 5 inodes, plus pin 8,192 B / 2 inodes |
| 10,000 records read and parsed in ~46 ms | Rust `Wal::scan` of 10,000 Intent records p50 195.6 ms (per-operation directories, digest-chain validation); Node `inspectGit` p50 238.9 ms |

The DC baseline was a CLI baseline with no budget. Per §15, it is not combined-addon acceptance; it is context only.

## Method notes

- Each workload uses a fresh bare repository with the event-seal directory and the activation fence tombstone (except the rollback workspace, whose fence is placed by the real `fgctl` and checked to exist). A shared, trusted (0700) state root is used.
- The addon is staged as a release-shaped payload with a `nativeAddon` descriptor. It loads through `src/git/native.mjs`, so the digest, target and Node-API checks are in the path.
- Interrupted publications are produced by the port's own process-loss seam (`wal::FileSystem` checkpoint returning an error at a named boundary). Everything acknowledged before the boundary stays on disk. This is the same seam the phase 01 tests use; no product branch was added.
- The 10,000-record backlog is written by `Wal::begin`/`append` (the WAL's own install path) with a scan-only authority, because 10,000 real publications would take hours at the measured CAS cost.
- Push uses a pinned `RemoteGrant` to a local bare remote on the same ext4. "No new objects" pushes a commit already present on the remote under `refs/seed/*`.
- The rollback row starts a live writer from a WAL-capable fixture release's `bin/fgos.mjs`. It loops `writeBlob`/`writeTree`/`writeCommit`/`compareAndSwap` through the combined addon. Meanwhile the row runs `fgctl upgrade --from <release without git-wal-v1>` 20 times, each completed rollback followed by a forward activation. With the writer stopped, a live payload of the release without `git-wal-v1` is started and rollback is attempted again. Each receipt is then re-read with `recover`, which must return `thisInvocationWonCas` with the same `publishedOid`.
- In the full run, the row checked the unproven live payload while the writer was still live, so `git-wal-pending` refused it first. That ordering was fixed and the row re-run alone (`final-rollback`). The table reports the re-run; the full run's rollback result was otherwise identical in shape: 21 receipts, 0 lost, refusals or completions only.

## Reproduce

From the repository root, on ext4. Use a private Cargo output directory.

```bash
export CARGO_TARGET_DIR=$PWD/.fgos/runtime/phase-target   # any private directory; the harness honours it

# Full run. Compiles the release addon, the e3_fixture example and fgctl with
# cargo --release --locked, then writes results.json under the root.
node scripts/git/e3-bench.mjs run --samples 500 --pushSamples 100 \
  --root $PWD/.fgos/runtime/e3-bench/final

# Same run with prebuilt artifacts (what this report used):
T=$CARGO_TARGET_DIR/release
node scripts/git/e3-bench.mjs run --samples 500 --pushSamples 100 \
  --root $PWD/.fgos/runtime/e3-bench/final \
  --addon $T/libfgos_node_addon.so --fixture $T/examples/e3_fixture --fgctl $T/fgctl

# Rollback row alone:
node scripts/git/e3-bench.mjs rollback --root $PWD/.fgos/runtime/e3-bench/final-rollback \
  --addon $T/libfgos_node_addon.so --fgctl $T/fgctl
```

Defaults: `--casSamples 300`, `--growthTarget 1000`. The root must not exist. The private-PID-namespace diagnostic runs only when `bwrap` is on `PATH`. The subprocess census needs `strace`.

Harness: `scripts/git/e3-bench.mjs` (Node rows, census, rollback) and `packages/git/node-addon/examples/e3_fixture.rs` (fixtures Node cannot reach, Rust scan, in-process port diagnostic). Raw results of this run are in `.fgos/runtime/e3-bench/final/results.json` and `final-rollback`, which are ignored scratch outputs and not committed.

## Open questions for the owner

1. Q1: the trigger is hit. The evidence says a host-process route runs the same port and would fail the same lines. Reopen the topology, or keep topology (a) and treat this as a port-cost problem? The cost is the per-spawn `/proc` walk in borrowed spawns, the 18 spawns per CAS, and the 47 fsync calls per CAS.
2. Should budgets ever be judged in a controlled process population? The per-host term grows with the number of processes on the machine, which is part of the real environment of every user.
3. A Node-reachable compaction door for completed CAS operations is absent in phase 01. Its absence causes linear admission growth and, by code reading, a hard stop at 100,000 retained operations. Is that a phase 01 gap or planned for a later phase?
