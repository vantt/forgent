# Verification: Git E3 clean rerun

Date: 2026-10-21, 23:40 to 00:05 (Asia/Saigon). Command: `node scripts/git/e3-bench.mjs run`, two rounds.

Host: second machine (fg-server2), i7-13700 ×24, 31 GiB, Samsung 980 PRO, ext4, kernel 7.0.0-38, git 2.53.0, node 24.22.0, rustc 1.99.0, governor `performance`.

Code and build: main `a46a1c57a`. It includes T0 and the ScopedCommit object-durability fixes. Release build.

Budgets: [e3-budgets.md](../261018-0914-git-component-fgos-git/e3-budgets.md).

Raw JSON is in `/home/vantt/.claude/jobs/e1505f04/tmp/e3-perf/e3-{1,2}.json`.

**Measurement condition.** TEST and HARDEN paused all heavy work for the window. Each round started only when the 1-minute load was below 2.5:
- round 1 started at load 1.74 and ended at 5.3;
- round 2 started at 2.21 and ended at 6.3.

This is the calm run that the [13:23 verification](verification-261021-1323-git-e3-performance-governor.md) asked for. That earlier run measured push and the backlog scan under a load of up to 25.

## Verdicts

| Workload | Budget | Round 1 | Round 2 | Verdict |
|---|---|---|---|---|
| Addon load + first call | ≤ 30 ms | 9.05 | 9.07 | pass |
| writeBlob new | p95 ≤ 15 ms | 12.22 | 12.14 | pass |
| writeBlob existing | p95 ≤ 10 ms | 1.23 | 1.22 | pass |
| CAS no-op | p95 ≤ 15 ms | 2.32 | 2.18 | pass |
| CAS changing | p95/p99 ≤ 150/250 ms | 114.9/125.1 | 114.7/116.9 | pass |
| Push, no objects | p95 ≤ 150 ms | **193.4** | 145.7 | **unsettled**: fails round 1, passes round 2 |
| Push, with objects | p95 ≤ 250 ms | 196.9 | 149.8 | pass |
| ScopedCommit (linked worktree) | p95 ≤ 250 ms absolute (amended 2026-10-21) | 185.7 | 183.5 | pass |
| Land (prepare + publish) | p95 ≤ 1.6 s | 0.51 s | 0.49 s | pass; ratio to legacy is 0.86 / 0.85 |
| WAL amplification | ≤ 32 KiB / ≤ 12 inodes | 4.0 KiB / 1 | 4.0 KiB / 1 | pass |
| Backlog scan, 10,000 records, 1 record per operation | ≤ 300 ms, complete | Rust 180.7, Node 205.8 | Rust 181.8, Node 206.3 | pass |
| Backlog scan, 10,000 operations × 3 records (30,000 records) | not covered by the budget text | Rust 303.0, Node 342.9 | Rust 305.7, Node 345.2 | reported; see question 2 |
| Reconciliation, 100 interrupted | ≤ 10 s | 1.39 s | 1.40 s | pass |
| Rollback with live processes | refused or completed, 0 lost | 0 lost, tip matches, scan complete | same | pass |

**ScopedCommit ratio (reported, not budgeted):** port p95 is 2.34× legacy in round 1 and 2.50× in round 2. Legacy p95 is 79 and 73 ms. The bench still prints `passed:false` because its check uses the old 1.5× rule. The budget has been absolute since 2026-10-21, so the bench verdict line is stale. It should be changed to judge the absolute budget.

**Node-loan ScopedCommit (the dispatch-cwd path):**
- changing: p95 152.7 / 152.1 ms;
- aged-floor (1,500 short processes): 163.3 / 165.0 ms.

## Open for the owner

1. **Push without objects (p95 ≤ 150 ms).** The two calm rounds disagree: 193 ms and 146 ms, both at a similar load. Push with objects follows the same pattern (197 vs 150). So the difference is something that changes between rounds, not the transfer of objects. Per spec §4, a failed budget stops the plan for an owner decision. The 13:23 run also failed this row, under load.
2. **The backlog budget unit.** The budget says "10,000 pending records", and that fixture passes. The 3-record-chain fixture (10,000 operations, 30,000 records) takes 303–345 ms. Does the budget mean records (pass) or operations (fail by up to 15 %)?

## Resolution (2026-10-22)

**Push.** The cause is the host NVMe. Its fsync latency switches between two modes, about 5.2 ms and about 7.5 ms per plain fsync, and a push without objects does 13 fsyncs. The investigation is in [the push variance debug report](debug-261022-0012-git-e3-push-variance.md).

The owner chose on 2026-10-22 to judge push only when the disk is in its fast mode. The bench now pairs each push row with a plain fsync probe. It judges the 150 ms and 250 ms budgets only on rounds where the probe reads fast; slow rounds are reported and marked `not-judged: fsync-slow` (main `4428f2a90`). Under that rule the fast-mode p95 of push without objects is about 146 ms, so it **passes**.

**Backlog.** The unit is records (owner, 2026-10-22), so this row **passes** too.

Every E3 row now passes on the owner's host class.
