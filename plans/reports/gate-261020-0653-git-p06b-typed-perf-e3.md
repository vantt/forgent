# Gate: E3 for the typed-operation spawn reduction (fdb4fdf59)

Host E3, 2026-10-20 05:50–06:50 Asia/Saigon, interleaved main#1, branch#1, main#2, branch#2 (200 samples), `powersave`, no suite/cargo running, load 3.0–5.8, Git spawn p50 1.2–5.6 ms. Logs: /home/vantt/.claude/jobs/e1505f04/tmp/e3-p06b/ on the second machine.

| Row (p95 ms) | main#1 | branch#1 | main#2 | branch#2 |
|---|---|---|---|---|
| ScopedCommit legacy / port | 283.6 / 459.4 | 271.2 / 395.2 | 283.8 / 447.4 | 283.7 / 382.9 |
| **ScopedCommit ratio (≤1.5)** | 1.62 | **1.46** | 1.58 | **1.35** |
| Land legacy / port (prepare+publish) | 223.9 / 1929.1 | 216.2 / 1433.1 | 242.0 / 1882.7 | 227.6 / 1462.4 |
| Land prepare / publish (p50) | n/a | 770 / 598 | n/a | 769 / 608 |
| **Land ratio (≤1.2)** | 8.62 | **6.63** | 7.78 | **6.42** |
| CAS changing | 184.4 | 181.2 | 184.9 | 183.2 |
| push no-objects | 267.1 | 264.4 | 263.6 | 264.6 |
| reconcile 100 | 14.2 s | 12.7 s | 14.2 s | 12.3 s |
| nodeLoanScopedCommit changing | 349.4 | 299.6 | 360.7 | 296.0 |
| rollbackWithLiveProcesses | 0 lost, tip OK | 0 lost, tip OK* | 0 lost, tip OK | 0 lost, tip OK* |

\* Measured with main's identical rollback script against the branch artifacts: the branch bench's entry guard stopped writer children launched through a release shim (fixed in bbeed2178).

Census (branch): ScopedCommit 30 Git execs (8 preflight + 22 commit; main 37) vs legacy 12; Land prepare 52 + publish 48 = 100 (32 + 33 contained) vs legacy 23. CAS census unchanged (10/8/8).

Per-spawn cost (`git rev-parse HEAD`, 100 samples, interleaved): uncontained 3.1 ms, borrowed 3.7 ms, contained (bwrap pid namespace) 10.8 ms. Containment ≈ 0.5 s (37%) of Land; all spawns ≈ 0.82 s (60%); the rest is WAL, fsync barriers and locks. With free containment Land would still be ≈ 4.6×.

Verdict: ScopedCommit passes its budget; Land fails; publication rows unchanged; owner decision brief: brief-261020-0653-land-latency-budget-decision.md.
