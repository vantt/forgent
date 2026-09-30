# Historical Baseline Report: 2026-08-01 to 2026-09-29

Captured via:
`cargo run -p fgos -- metrics harness --since 2026-08-01 --until 2026-09-29 --dir .`
Sibling file: `baseline-2026-09.json`

## 10-Line Summary
1. Timeframe: August 1, 2026 00:00:00 UTC through September 29, 2026 23:59:59 UTC across workspace `forgentX`.
2. Total Work items evaluated (#1): 769 items delivered during the timeframe.
3. Item cycle time (add -> delivered): median (p50) = 2.69 hours; 90th percentile (p90) = 47.99 hours.
4. Active execution time (doing -> awaiting-approval): p50 = 0.11 hours (~6.6 mins); p90 = 0.46 hours (~27.6 mins).
5. Manual & automated gate interventions (#2): mean = 2.37 per item; 90th percentile (p90) = 5.0.
6. Execution runs evaluated: 1,028 total runs across 15+ executor and adapter configurations.
7. Run outcomes: 51 ok, 12 exec_failed, 31 verdict_fail, 4 inconclusive, 3 blocked, 2 policy_refused, 925 unclassified.
8. Agent coordination sessions: 293 evaluated (215 active); assignments p50 = 2.0, p90 = 8.0; duration p50 = 147s, p90 = 3052s.
9. Token consumption: 15.02 billion tokens aggregated across 418 sessions (14.84B cache reads, 148M cache creation).
10. Invocation faults: 257 total host faults recorded (129 store-missing, 105 unknown-verb, 16 init-in-worktree, 7 dir-invalid).
