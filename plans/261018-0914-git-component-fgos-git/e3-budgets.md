# E3 budgets for the combined addon (owner input)

Status: **Owner-set on 2026-10-18** (owner: "đồng ý", 11:20 Asia/Saigon), numbers unchanged from the proposal. **Amended by the owner on 2026-10-19** (06:44 Asia/Saigon, Decision 1 of [the overnight brief](../reports/brief-261019-0410-overnight-git-and-event-store-decisions.md)): the changing-CAS line is set from the measured fsync floor of the signed WAL ordering (ten durable record installs per changing CAS, about 5-10 ms each on ext4 NVMe), and runs record their measurement condition (below). **Amended by the owner on 2026-10-20** (owner chose option 1 of [the Land budget brief](../reports/brief-261020-0653-land-latency-budget-decision.md)): Land keeps every safety property (isolated candidate worktree, pins, durable WAL barriers, R30 lock order, recovery fingerprints) and gets an absolute budget instead of the 1.2 × ratio, which measured 6.4-6.6 × after the spawn work (p95 about 1.43-1.46 s against 0.22 s; evidence [gate-261020-0653](../reports/gate-261020-0653-git-p06b-typed-perf-e3.md)). Operation-scoped containment (one contained domain per operation instead of one per Git child, about 0.4-0.5 s less) is an idea awaiting the owner's choice, not planned work. Spec §15 E3 requires the owner to write these budgets before any combined-addon measurement. Edit the numbers, change the status line to "Owner-set on <date>", and commit this file before phase 01 step 13 runs. No E3 verdict counts if this commit does not precede the run. **Amended by the owner on 2026-10-21** (15:53, option 1 of the ScopedCommit decision): the 1.5 × ratio is out of reach under the signed durability rules (per-step breakdown [debug-261021-1329](../reports/debug-261021-1329-scoped-commit-e3-breakdown.md): port 155 ms warm p50 against legacy 74 ms; with fsync disabled 71 ms; floor about 133 ms = 1.8 ×), so ScopedCommit gets an absolute budget and keeps every safety property; three fixes that need no spec change go first. Kept for later at the owner's request: option 2, spec-text changes that would reach about 1.5 × (one status read, fused config/format probe, no pin read in compaction, about 114 ms).

Starting points (proposals only): the DC baseline in Git spec §19 E3 row (warm tmpfs, one caller: one plumbing spawn p50 5.4-6.4 ms, p95 6.9-7.7 ms; `worktree add` p50 13.1 ms; one `update-ref --stdin` of 100 refs p50 12.0 ms; WAL record 4,096 allocated bytes; 10,000 records parsed in about 46 ms) and Event Store spec §17. All runs on ext4, not tmpfs.

| Workload (spec §15 split) | Metric | Proposed budget |
|---|---|---|
| Addon load, first call in a process | wall time | ≤ 30 ms |
| `writeBlob`, new object | p95 | ≤ 15 ms |
| `writeBlob`, existing object | p95 | ≤ 10 ms |
| `compareAndSwap`, no-op (ref already at next; WAL read only) | p95 | ≤ 15 ms |
| `compareAndSwap`, changing ref (Intent, pin, prepared, TargetAttempt, CAS, read-back, all fsyncs, receipt) | p95 / p99 | ≤ 150 ms / ≤ 250 ms (was ≤ 60 / ≤ 120; amended 2026-10-19) |
| Local transport push, one ref, no new objects | p95 | ≤ 150 ms, judged when the host's plain fsync probe is in its fast mode; slow-mode rounds are reported, not judged (owner 2026-10-22) |
| Local transport push, one ref, with objects | p95 | ≤ 250 ms, judged when the host's plain fsync probe is in its fast mode; slow-mode rounds are reported, not judged (owner 2026-10-22) |
| Full typed operation: ScopedCommit in a linked worktree | p95 | ≤ 250 ms on the owner's host class (ext4 NVMe, the measurement condition below); the ratio to today's `commitUnitWork` on the same fixture is reported, not budgeted (was ≤ 1.5 ×; amended 2026-10-21) |
| Full typed operation: Land (prepare + publish, verify excluded) | p95 | ≤ 1.6 s on the owner's host class (ext4 NVMe, the measurement condition below); the ratio to today's merge path on the same fixture is reported, not budgeted (was ≤ 1.2 ×; amended 2026-10-20) |
| Git subprocess count per typed operation | count | reported; no budget |
| WAL amplification per completed operation | allocated bytes / inodes | ≤ 32 KiB / ≤ 12 |
| Backlog scan of 10,000 pending records | time, completeness | ≤ 300 ms, `complete: true`. The unit is WAL records (owner 2026-10-22: 10,000 operations with one record each); larger chains are reported, not budgeted |
| Full reconciliation of 100 interrupted publications | time | ≤ 10 s |
| Rollback with live processes (P-RELEASE overlap) | outcome | refused by the C5 door or completed; zero lost or corrupt records |

**Measurement condition (2026-10-19).** Every E3 run records the host load average, the CPU frequency governor and the raw time of one `git` spawn next to its verdict. Spawn-bound lines (push, `writeBlob` new, reconciliation) are judged under the `performance` governor or with busy cores, as in the 2026-10-19 00:18 and 02:47 runs; an idle `powersave` host inflates one `git` spawn from about 1.4 ms to 5.5 ms for old and new code alike.

Failure of any budget, or of rollback with live processes, is the Q1 reversal trigger (spec §4): the plan stops and the owner decides.
