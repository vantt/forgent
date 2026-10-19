# Git 06 preflight-reuse host gate (git/p06-land-restore)

Date: 2026-10-19 22:34 to 2026-10-20 00:40, Asia/Saigon. Host fg-server2 (i7-13700 x24, ext4 on NVMe, `powersave` governor throughout). Evidence only; no code changed by the gate.

Deciding tip: 0f155b35a (ScopedCommit/Sync read config and storage-format facts once per operation, recheck config file stamps before each child; 5f29974d2 plus review fix b52ae87c5). Baseline: origin/main c67c1d7d1 for E3 (no Rust change between it and the later main tips), e019f3551 for the suite baseline.

## Verdict

| Check | Result |
|---|---|
| E3 `nodeLoanScopedCommit` changing, p95 / p99 | **2147.7 / 2194.1 ms (main) → 348.7 / 361.2 and 344.4 / 349.6 ms (0f155b35a)**, about 6x faster. Still above the 150 / 250 ms budget. |
| E3 `nodeLoanScopedCommitAgedFloor` changing, p95 / p99 | 2219.8 / 2256.0 → 351.1 / 360.4 and 357.1 / 363.7 ms |
| Scoped-census git execs per preflight + commit | **213 → 37** (9 preflight + 28 commit), same on 5f29974d2 and 0f155b35a |
| Changing CAS, push, writeBlob, rollback | no regression against main (table below); CAS exec census unchanged at 10/8/8 |
| `cargo test --workspace` (0f155b35a merged with origin/main e019f3551) | 1053 pass / 0 fail / 3 ignored |
| `cargo clippy --workspace --all-targets -D warnings` | clean |
| `npm test` on the merge | 8526 tests, 6 fail. The same 6 fail on main e019f3551 alone. **Nothing introduced.** After merging a53ceebfe (docs and `.fgos/config.json` only) the run gives the same 6 plus the known flaky `hot-lock-multiprocess` ratio, which also failed on main. |

## E3, back to back, same method

Each tree ran `node scripts/git/e3-bench.mjs run --samples 200` with prebuilt release artifacts (`--addon --fixture --fgctl --host`) from a private Cargo dir, a fresh root, ext4, and no npm suite running. Order: main, 5f29974d2, 0f155b35a, main, 0f155b35a. Load stayed between 3.4 and 6.2. Git spawn p50 moved between 1.2 and 5.4 ms across runs, for both trees.

| Row, ms p50 / p95 / p99 | main #1 | 5f29974d2 | 0f155b35a #1 | main #2 | 0f155b35a #2 | Budget |
|---|---|---|---|---|---|---|
| CAS changing | 168.2 / 180.9 / 186.3 | 168.3 / 178.9 / 185.8 | 169.2 / 180.1 / 187.1 | 170.5 / 180.8 / 185.1 | 170.6 / 181.4 / 185.4 | p95 ≤ 150 fails on all; p99 ≤ 250 passes |
| CAS no-op | 7.7 / 11.2 / 11.8 | 7.5 / 11.4 / 12.6 | 7.4 / 11.3 / 13.7 | 7.7 / 11.1 / 11.6 | 7.9 / 11.1 / 11.4 | p95 ≤ 15 |
| push, no objects | 244.9 / 268.4 / 270.2 | 244.7 / 262.1 / 267.5 | 244.3 / 265.2 / 272.0 | 244.5 / 260.2 / 261.8 | 245.4 / 268.1 / 271.5 | p95 ≤ 150 fails on all |
| push, with objects | 249.1 / 268.7 / 281.5 | 249.1 / 269.7 / 274.0 | 247.4 / 269.2 / 273.9 | 251.6 / 267.8 / 273.0 | 252.5 / 272.5 / 279.0 | p95 ≤ 250 fails on all |
| reconcile 100 interrupted | 16.6 s | 11.7 s | 13.1 s | 17.0 s | 14.1 s | ≤ 10 s fails on all |
| nodeLoanScopedCommit changing | 749.4 / 2147.7 / 2194.1 | 320.5 / 345.5 / 352.3 | 322.3 / 348.7 / 361.2 | 1999.1 / 2165.4 / 2193.0 | 327.9 / 344.4 / 349.6 | p95 ≤ 150 / p99 ≤ 250 fails |
| nodeLoanScopedCommit preflight | 192.3 / 610.4 / 633.1 | 84.0 / 93.6 / 97.5 | 84.1 / 93.6 / 96.4 | 570.7 / 621.2 / 637.3 | 83.8 / 93.6 / 97.0 | n/a |
| AgedFloor changing | 2091.4 / 2219.8 / 2256.0 | 323.9 / 350.2 / 358.2 | 323.6 / 351.1 / 360.4 | 2084.6 / 2217.8 / 2245.3 | 333.8 / 357.1 / 363.7 | fails |
| writeBlob new | 16.9 / 18.3 / 18.8 | 17.1 / 18.6 / 19.7 | 16.6 / 18.2 / 18.7 | 16.5 / 18.1 / 18.4 | 16.7 / 18.2 / 18.8 | p95 ≤ 15 fails on all |
| rollback with live processes | 0 lost, tip OK | 0 lost, tip OK | 0 lost, tip OK | 0 lost, tip OK | 0 lost, tip OK | passes |

`scoped-census` (0f155b35a and 5f29974d2): preflight runs `config --null` once, `rev-parse --show-object-format` and `--show-ref-format` once each, plus 6 checkout reads. Commit runs config/format twice each (before and after hooks) plus the real work (`diff`, `ls-files`, `add -A`, `write-tree`, `commit`, `rev-list`, `show-ref`). Main has no `scoped-census` mode; its 213 comes from the branch's own measurement and the 2026-10-19 strace (about 193 contained calls per pair).

What is left of the ScopedCommit time: 37 contained spawns at about 9-11 ms each (preflight 84 ms for 9, commit about 320 ms for 28). The changing-CAS, push and reconcile p95 failures are the same host fsync and spawn cost already recorded for main in [the Git 05 gate](gate-261019-1855-git-p05-host-gate.md).

## npm test failures, classified

The first suite run had 72 extra failures in `fgctl-*`, `release-*`, `fences-rust-locks` and `active-release-drift-check`. The cause was the gate environment: the release addon was missing from the private Cargo dir. After `cargo build --locked --release --workspace`, they all pass. Both trees then ran the full suite under the same environment: private Cargo dir linked as `target`, `FGOS_HOST_BIN` set to the debug host, and `FGOS_STATE_ROOT` and session ids unset.

| File | merge | main e019f3551 | Class |
|---|---|---|---|
| `test/holder-lock/fences-v1-tombstone.test.mjs` (1) | fail | fail | pre-existing on main (`Cannot find package 'yaml'` from a temp copy) |
| `test/setup/run-supervisor-checks.test.mjs` (4) | fail | fail | pre-existing on main (socket path length under the nested suite temp root) |
| `test/setup/skill-wrappers.test.mjs` (1) | fail | fail | env: a fresh worktree has no git-ignored `.claude/skills` render |
| `test/state/hot-lock-multiprocess.test.mjs` (1) | fail once (after a53ceebfe) | fail | flaky perf ratio |

No `test/workflow/*` file failed on either tree.
