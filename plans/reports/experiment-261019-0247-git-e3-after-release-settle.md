# Experiment E3 again, after the holder-lock release settle

Date: 2026-10-19 (Asia/Saigon). Branch `git/p01-publication-perf`. Code under test: `e7114da1d` (release settle `c9c378839`, app-test caller migration `fd1fafec2`, merge of `origin/main` at `cb05c993f`, which changed no Rust). Budgets: `plans/261018-0914-git-component-fgos-git/e3-budgets.md`, owner-set, not edited. Previous runs: `plans/reports/experiment-261019-0018-git-e3-after-port-optimization.md` ("00:18 run", code `1d13db5bc`) and `plans/reports/experiment-261019-0052-git-e3-after-review-fixes.md` ("00:52 run", code `9e407f0b1`).

## Verdict first

The release settle removes the full-host `/proc` scan that the 00:52 run measured, and the numbers are back to the 00:18 code. An interleaved A/B of the 00:18 code against this head, with the same harness and the same host state, gives the same numbers on every budget line (below). When the host keeps some cores busy, as it did during the 00:18 run, the only failing line is changing CAS: p95 115.1 ms, which is over the 60 ms budget because of the fsync floor; p99 116.8 ms is within its 120 ms budget. Rollback under a live writer no longer refuses with `git-wal-unreadable`: 0 of 33 and 0 of 34 attempts.

The host itself changed between runs. One raw `git rev-parse` spawn took p50 1.37 ms during the 00:18 run, at load 19, and takes 5.5 ms now on an idle host. With 8 of 24 cores kept busy it takes 1.40 ms again. The CPU governor is `powersave` (`balance_performance`), so idle cores wake slowly. Each Git child pays this cost. On an idle host, push, reconciliation and `writeBlob` new therefore fail for the 00:18 code and for this head alike. The 00:18 numbers were measured on busy cores.

## Per budget line

- **00:18** and **00:52**: the full harness runs of the two previous reports.
- **Now, quiet**: the full `e3-bench.mjs run` on `e7114da1d` with the same sizes (`--samples 500 --pushSamples 100`), a release build and ext4 (`/dev/nvme0n1p2`). The 1-minute load average was 0.7 at the start, 1.3 to 2.5 for most of the run and 9.1 at its peak near the end.
- **Now, warm cores**: the same full run with eight `sh` busy loops started by this run. The load average was 3.9 at the start and peaked at 16.7 near the end, while another session also used the host. This is the condition that matches the 00:18 run.

| Budget line | Budget | 00:18 run | 00:52 run | Now, quiet | Now, warm cores | Verdict now |
|---|---|---|---|---|---|---|
| Addon load, first call | ≤ 30 ms | p95 5.06 | p95 7.26 | p95 3.97 | p95 5.16 | pass |
| `writeBlob` new | p95 ≤ 15 | 21.39 | 63.74 | 18.23 | **12.07** | pass on warm cores; fails on an idle host (two Git spawns) |
| `writeBlob` existing | p95 ≤ 10 | 1.90 | 36.18 | 6.11 | 1.33 | pass |
| `compareAndSwap` no-op | p95 ≤ 15 | 2.39 | 174.68 | 10.86 | 2.49 | pass |
| `compareAndSwap` changing | p95 ≤ 60 / p99 ≤ 120 | 191.7 / 197.0 | 694.7 / 754.0 | 182.7 / 190.6 | **115.1 / 116.8** | **fail** at p95 (fsync floor); p99 passes on warm cores |
| …at 320 retained | | 129.4 / 149.4 | 339.8 / 358.3 | 186.7 / 190.6 | 116.5 / 118.2 | |
| …at 1,000 retained | | 136.5 / 141.4 | 343.7 / 361.7 | 194.1 / 195.8 | 124.6 / 127.4 | retention stays flat |
| Local push, no new objects | p95 ≤ 150 | 134.9 | 369.2 | 215.9 | **136.0** | pass on warm cores; fails on an idle host |
| Local push, with objects | p95 ≤ 250 | 138.4 | 365.7 | 223.7 | 139.5 | pass |
| ScopedCommit, Land | 1.5x / 1.2x | not in phase 01 | not in phase 01 | not in phase 01 | not in phase 01 | not measurable |
| Git subprocesses per op | reported | census | census | census (below) | census | reported |
| WAL amplification per completed op | ≤ 32 KiB / ≤ 12 inodes | 4,123 B / 1 | 4,123 B / 1 | 4,123 B / 1 | 4,123 B / 1 | pass |
| Backlog scan, 10,000 pending | ≤ 300 ms, complete | p95 238.5 | p95 255.6 | **p95 257.1**, complete | p95 449.6, complete | pass on the quiet host; the busy loops slow this metadata scan (see below) |
| Reconcile 100 interrupted | ≤ 10 s | 5.58 s | 20.37 s | 16.23 s | **6.85 s** | pass on warm cores; fails on an idle host |
| Rollback with live processes | C5 refused or completed, nothing lost | 5 `git-wal-unreadable` of 34 | 2 `git-wal-unreadable` of 32 | 0 lost, tip = last receipt, scan complete; 26 completed, 7 `git-wal-pending`, **0 `git-wal-unreadable`** | 28 completed, 6 `git-wal-pending`, 0 `git-wal-unreadable` | pass |

Other numbers on warm cores: first Publication p50 43.4 ms (00:18: 77.8). In-process Rust port: changing CAS p50 110.3 ms on the host and 113.4 ms in a private PID namespace (00:18: 113.1 and 116). The per-host cost is still gone. Reconciliation outcomes have not changed: 25 abandoned, 25 `RecoveryRequired` and 50 `effectObservedOnly`.

## Code A/B against the 00:18 code

The harness was run four times, alternating the `1d13db5bc` addon and fixture with this head (`--samples 100 --pushSamples 100`, current harness and current `fgctl`). The host was idle, with load 1.9 to 5.2 from other sessions. Values are p50/p95 in ms.

| Build, round | `writeBlob` new | existing | CAS changing | CAS no-op | push objects | push none | first Publication | reconcile | port CAS |
|---|---|---|---|---|---|---|---|---|---|
| `1d13db5bc`, r1 | 17.1/18.0 | 4.7/6.1 | 182.2/194.8 | 6.9/10.3 | 205.7/221.6 | 199.9/216.5 | 62.9/86.6 | 15.14 s | 174.3/181.6 |
| head, r1 | 17.2/18.0 | 4.7/6.2 | 169.9/182.0 | 7.8/10.7 | 207.8/223.4 | 203.1/217.0 | 100.6/114.2 | 16.87 s | 165.5/172.8 |
| `1d13db5bc`, r2 | 16.9/18.1 | 5.0/6.1 | 181.9/194.2 | 7.1/9.5 | 206.3/223.5 | 202.9/214.5 | 63.9/89.7 | 14.77 s | 172.3/182.1 |
| head, r2 | 17.2/18.4 | 4.6/6.3 | 169.1/183.1 | 7.8/10.7 | 206.0/223.3 | 202.1/215.2 | 97.0/109.8 | 16.47 s | 164.0/171.9 |

The two builds measure the same on every budget line, and changing CAS is about 12 ms faster on this head. Two differences remain, and neither comes from the release settle:

- **First Publication +35 ms, reconciliation +1.6 s (about 10 %).** Under strace, one fresh-process first Publication runs three more contained Git calls on this head (`git var GIT_CONFIG_SYSTEM`, `git var GIT_CONFIG_GLOBAL`, `git config --list`, each in its own bwrap): 10 bwrap children against 7. These are the config preflight calls that the 00:18 code ran on the first `writeBlob` (that `writeBlob` drops from 4 to 2 children). The review fixes (`6656b06d1`) moved them into Publication construction, where they bind the floor verdict. Reconciliation opens one Publication per operation, so it pays them 100 times. No budget line covers first Publication, and reconciliation stays within budget on warm cores.
- **Raw spawn cost.** `rawSpawnBaseline` is p50 5.4 to 6.1 ms in every A/B run for both builds, against 1.37 to 1.62 ms in the 00:18 run. A direct probe confirms the cause: 200 `git rev-parse` spawns take p50 5.68 ms idle, 1.40 ms with eight busy loops and 5.64 ms idle again.

## Backlog scan on warm cores

The backlog line rose from 257 to 450 ms in the warm run. `e3_fixture scan` was rerun on that run's two 10,000-operation repos, alternating builds, each pair twice. Values are p95 in ms; `old` is `1d13db5bc`.

| Condition | intent, old | intent, head | attempt, old | attempt, head |
|---|---|---|---|---|
| idle | 202.5, 187.6 | 187.6, 185.0 | 313.0, 312.6 | 292.8, 300.5 |
| 8 busy loops | 401.4, 419.7 | 389.0, 386.7 | 668.6, 683.8 | 643.9, 625.7 |

The busy loops double the scan time for both builds. Head is about 5 % faster. The quiet full run (p95 257.1 ms, complete) is the valid reading for this line. Its spawn-bound lines need busy cores and this line needs idle ones, so no single host condition gives the best value for every line.

## Census per operation

strace `-f` over the harness `census` mode (three rounds), counted between the per-operation markers. Columns: execve per round, fsync/fdatasync per round, `/proc` opens per round. The 00:18 code ran with the same strace, so its `/proc` opens are directly comparable. The 00:52 code measured about 47,000 `/proc` opens per ten port iterations (00:52 report).

| Operation | Git children | fsync | `/proc` opens, head | `/proc` opens, `1d13db5bc` |
|---|---|---|---|---|
| CAS changing | 10, 8, 8 | 20, 20, 20 | 218, 248, 306 | 194, 248, 302 |
| CAS no-op | 1, 1, 1 | 2, 2, 2 | 109, 151, 193 | 98, 136, 174 |
| `writeBlob` new | 2, 1, 1 | 3, 3, 3 | 28, 18, 18 | 40, 16, 16 |
| `writeBlob` existing | 1, 1, 1 | 0, 0, 0 | 18, 18, 18 | 16, 16, 16 |
| push with objects | 12, 12, 16 | 13, 13, 25 | 169, 211, 381 | 153, 195, 345 |
| push without objects | 12, 12, 16 | 13, 13, 25 | 190, 232, 381 | 172, 210, 345 |

Zero `/proc/<pid>/fd` readlinks in both builds. The 00:52 regression came from those full-host descriptor scans, and they are gone. The per-round growth of `/proc` opens in CAS and push is present in both builds, so it is older than this branch. Git children and fsyncs match the 00:52 census. The 2 fsyncs on a no-op CAS also appeared at 00:52, and `1d13db5bc` makes 0 there.

## Rollback with a live writer

Both full runs: 0 lost or mismatched receipts, the tip matches the last receipt, and the WAL scan is complete with 0 errors. Every refusal is `git-wal-pending` (7 of 33, then 6 of 34). The ledger-temporary race recorded at 00:52 no longer reaches `git-wal-unreadable` after `c9c378839`.

## Gates on `e7114da1d`

- **Rust:** `cargo test --locked --no-fail-fast -- --test-threads=1 --nocapture` on fgos-git, fgos-holder-lock, fgos-process, fgos-durable-file, fgos-event-store, fgos-distribution, fgos-observe, fgos-run-supervisor, fgos-terminal-control and fgos (the app) gave 781 passed, 1 failed and 3 ignored across 126 targets. The one failure is the known `containment_terminal_gate_dies_with_a_killed_supervisor` in fgos-process. `internal_lock_routes` passed 14 of 14. The output contains no `no-bwrap-pidns` skip, and `nested_pidns_recipient_is_killed_at_release`, `nested_pidns_recipient_is_killed_by_drop` and `containment_select_prefers_bwrap_pidns_when_user_namespaces_work` ran and passed.
- **Clippy:** `cargo clippy --all-targets -- -D warnings` on the same crates is clean.
- **Windows:** `cargo check --locked --target x86_64-pc-windows-msvc --all-targets -p fgos-holder-lock -p fgos-process -p fgos-git -p fgos` passed, which covers the migrated `windows_borrow` and `windows_predecessor_stress` tests. It printed only older warnings: unused `common` in `wal.rs`, unused `ORPHAN_SETTLE`, and unused variables or fields in `cli_tests` and run-supervisor.
- **npm:** `npm test` ran with `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`, a private `CARGO_TARGET_DIR` holding the release workspace build, `<worktree>/target` linked to it, and `FGOS_HOST_BIN` set to a debug host built from the branch. Result: 8,219 tests, 8,119 passed, 4 failed, 31 skipped and 65 todo. All four failures are known baselines: `fences-v1-tombstone` (the `yaml` package is missing in the fixture), the `crash-matrix-adopt-resume` direct no-binding resume, `holder-lock-checks` monitor/supervisor membership and `skill-wrappers`. There is no new failure, and the `hot-lock-multiprocess` ratio was 1.081.

## Reproduce

Build `-p fgos-node-addon --lib --example e3_fixture` and `-p fgctl` in release mode from `e7114da1d`, then run:

```bash
node scripts/git/e3-bench.mjs run --samples 500 --pushSamples 100 --root <fresh dir on ext4> \
  --addon <release>/libfgos_node_addon.so --fixture <release>/examples/e3_fixture --fgctl <release>/fgctl
```

For the warm-core condition, keep eight `sh -c 'while :; do :; done'` loops running during the run. For the `/proc` census, run the harness `census` mode under `strace -f -e trace=execve,fsync,fdatasync,openat,readlinkat,access` and count between the `nonexistent-e3-marker` lines. Raw results are in `.fgos/runtime/e3-bench/{full,warm,ab-*}/results.json`, which are ignored scratch output and not committed.

## Concerns for the owner

1. Every E3 verdict on a spawn-bound line depends on the host CPU power state. With the `powersave` governor, the same build fails push, reconciliation and `writeBlob` new on an idle host and passes them with busy cores. A future E3 should record `rawSpawnBaseline` next to each verdict, or fix the governor during the run.
2. Changing CAS still fails at p95 because of the fsync floor, as at 00:18. The options in the 00:18 report all change the contract.
3. Reconciliation and first Publication pay three contained config-preflight Git calls per Publication opened. This change came with the review fixes and is not part of the release settle.
