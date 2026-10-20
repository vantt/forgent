# Git 06 host gate (git/p06-land-restore)

Date: 2026-10-20 03:32 to 05:30, Asia/Saigon. Host fg-server2 (i7-13700 x24, ext4 on NVMe, `powersave` governor throughout). This report records evidence. The only code change during the gate was the E3 benchmark fixture fix b38d7fe0f, which the coordinator asked for.

Trees:

- **Full gate:** 3f3abcab3 merged with origin/main 0e0c0f101 (scratch merge 12776b242). The only conflict was in CHANGELOG.md, resolved as a union.
- **Delta and E3:** b38d7fe0f merged with origin/main f1a2c9341 (scratch merge 41a21352b). b38d7fe0f is ab0fd6c9b plus the bench fixture fix. The CHANGELOG conflict was resolved as a union.
- **Baseline:** origin/main 0e0c0f101. Between 0e0c0f101 and f1a2c9341, nothing changes under `*.rs`, `packages/`, `src/git`, `src/holder-lock`, `merge.mjs` or `commit-unit-work.mjs`. The main E3 runs therefore also serve as the baseline for the f1a2c9341 merge.

Each tree used a private Cargo dir, symlinked as `target`. The release workspace, `e3_fixture` and the debug host were built for each tree. The suites ran with `FGOS_HOST_BIN` set to that tree's release `fgos`, and with `FGOS_STATE_ROOT` and the session ids unset.

## Verdict

| Check | Result |
|---|---|
| E3 paired **ScopedCommit** p95 ratio (budget ≤ 1.5) | **1.64 and 1.59. Fails.** Port 474 / 457 ms, `commitUnitWork` 289 / 286 ms. |
| E3 paired **Land** p95 ratio (budget ≤ 1.2) | **8.34 and 8.38. Fails by about 7x.** Port prepare+publish 1899 / 1870 ms (p50 about 1.75-1.80 s). Legacy `mergeRootIntoMainCas` 228 / 223 ms. |
| E3, other rows | Same as main within noise (table below). Scoped-census is 37 (9 preflight + 28 commit) on main, on the 3f3abcab3 merge and on the b38d7fe0f merge. |
| `cargo test --workspace` on the 3f3abcab3 merge | 1119 pass / **3 fail** / 9 ignored. All 3 are fixed on the final tip (see below). |
| `cargo clippy --workspace --all-targets -D warnings` on the 3f3abcab3 merge | clean |
| Delta: `cargo test` of fgos-git, fgos-holder-lock, fgos-process and fgos-node-addon on the b38d7fe0f merge | **362 pass / 0 fail** / 9 ignored. Clippy is clean for the same crates. |
| bwrap `--as-pid-1` namespace-init deadline test | It **ran** on this host both times, with no UNVERIFIED line. On 3f3abcab3 it failed (bwrap option bug). On the final tip, with `--ignored`, it **passes**. |
| `recovery_matrix` on the final tip | 8 of 8 runs clean (5 with default threads, 3 serial) |
| `npm test` on the 3f3abcab3 merge | 8634 tests, 8530 pass, **7 fail**. **1 is introduced** (`safe-restore.test.mjs`). The other 6 also fail on main. 0 `fgos-*` temp dirs were left behind. |
| `npm test` on main 0e0c0f101 | 8597 tests, 8494 pass, 6 fail, the same 6 as earlier gates. 0 `fgos-*` temp dirs were left behind. |
| Delta Node run (`test/git/*`, `test/runner/github-adapter*`, `test/holder-lock/*`, `test/architecture`) | 321 tests, 299 pass, 2 fail: `safe-restore` (introduced) and `fences-v1-tombstone` (also fails on main) |

## Rust failures on 3f3abcab3, and their status on the final tip

| Test | Cause | Status |
|---|---|---|
| `fgos-holder-lock` `borrow_io::real_read_tree_deadline_as_namespace_init_cleans_its_native_lock` | The bwrap probe succeeds on this host (bubblewrap 0.11.1, `bwrap --unshare-pid --as-pid-1 ... true` exits 0), so the test ran rather than printing UNVERIFIED. It then failed deterministically: the test passed `--preserve-fds 1`, which bwrap does not have. bwrap exited 1 with `bwrap: Unknown option --preserve-fds` before Git started, so `run_borrowed_io` returned `Ok(exit 1)` and `unwrap_err` panicked. | Fixed in e9dfc23de, which drops the flag. The test moved to `packages/git/rust/tests/borrow_deadline.rs` and is `#[ignore]`d. `cargo test -p fgos-git --test borrow_deadline -- --ignored --nocapture` passes on the final tip. It checks that `/proc/1/comm` is `git` inside the namespace and that no `.git/index.lock` remains. |
| `fgos-git` `recovery_matrix::ref_and_transfer_post_attempt_recovery` | `git-driver-io: No child processes (os error 10)` from `GitDriver::resolve_repo` (`tests/support/land.rs:68`). The ptrace tracer in `recovery_matrix_all_payload_kinds` called `waitpid(-1, __WALL)` in the shared test process and reaped Git children of sibling tests. | Test harness only. Fixed in ab0fd6c9b, which runs the tracer in its own process. 8 of 8 clean runs on the final tip. |
| `fgos-git` `recovery_matrix::ref_checkout_recovery_requires_quiescent_clean_custody_and_no_native_lock` | same ECHILD cause | same fix |

## E3, back to back

Every run used `node scripts/git/e3-bench.mjs run --samples 200` with prebuilt release artifacts (`--addon --fixture --fgctl --host`) on a fresh root on ext4. The paired rows use the bench's default of 30 typed samples.

Run order and conditions:

- main#1 03:47-03:59
- main#2 03:59-04:11
- final#1 04:13-04:29
- main#3 04:29-04:43
- final#2 04:43-04:59

Load stayed between 1.9 and 7.1. Git spawn p50 was 1.3-5.6 ms. No npm suite ran during these windows, with two exceptions:

- From about 04:10 to 04:11, the tail of main#2 overlapped an accidental suite start that was stopped, so main#3 was added.
- At the end of main#1, one external `cargo` process (not mine) was running.

| Row, ms p50 / p95 / p99 | main#1 | main#2 | final#1 | main#3 | final#2 | Budget |
|---|---|---|---|---|---|---|
| **ScopedCommit legacy / port p95 (ratio)** | n/a | n/a | 288.9 / 474.5 (**1.64**) | n/a | 286.4 / 456.6 (**1.59**) | ratio ≤ 1.5 |
| **Land legacy / port p95 (ratio)** | n/a | n/a | 227.8 / 1899.1 (**8.34**) | n/a | 223.3 / 1870.5 (**8.38**) | ratio ≤ 1.2 |
| CAS changing | 165.5 / 182.1 / 187.0 | 170.9 / 185.2 / 191.6 | 170.9 / 181.3 / 186.2 | 172.0 / 181.9 / 188.1 | 172.8 / 182.9 / 188.1 | p95 ≤ 150 fails on all; p99 ≤ 250 passes |
| CAS no-op | 2.8 / 9.0 / 12.2 | 7.5 / 12.6 / 13.6 | 7.5 / 11.2 / 11.5 | 7.7 / 11.3 / 11.7 | 7.4 / 11.2 / 11.7 | p95 ≤ 15 |
| push, no objects | 223.5 / 256.8 / 262.4 | 247.4 / 267.3 / 270.6 | 247.9 / 266.8 / 269.5 | 244.9 / 263.9 / 269.6 | 250.0 / 262.1 / 266.2 | p95 ≤ 150 fails on all |
| push, with objects | 231.5 / 255.8 / 263.4 | 245.2 / 269.8 / 276.6 | 254.2 / 273.2 / 276.6 | 249.9 / 267.9 / 278.0 | 251.4 / 272.5 / 285.5 | p95 ≤ 250 fails on all |
| reconcile 100 interrupted | 6.6 s | 14.2 s | 14.0 s | 14.1 s | 14.6 s | ≤ 10 s fails, except main#1 |
| nodeLoanScopedCommit changing | 317.5 / 341.3 / 357.0 | 202.3 / 255.0 / 280.8 | 337.4 / 358.9 / 364.2 | 327.0 / 347.4 / 353.7 | 329.0 / 348.6 / 358.2 | p95 ≤ 150 / p99 ≤ 250 fails |
| nodeLoanScopedCommit preflight | 82.8 / 94.4 / 98.4 | 47.3 / 67.6 / 75.4 | 89.3 / 98.7 / 100.6 | 84.3 / 92.8 / 96.3 | 85.1 / 95.8 / 97.9 | n/a |
| nodeLoanScopedCommitAgedFloor changing | 270.1 / 341.9 / 353.8 | 304.4 / 350.1 / 360.0 | 341.6 / 369.5 / 377.1 | 334.4 / 358.8 / 367.8 | 333.2 / 358.9 / 370.3 | fails |
| writeBlob new | 16.6 / 19.0 / 19.5 | 16.7 / 18.9 / 19.6 | 16.8 / 18.4 / 19.1 | 17.1 / 18.4 / 18.7 | 17.2 / 18.7 / 30.9 | p95 ≤ 15 fails on all |
| WAL per op | 4123 B, 1 inode | same | same | same | same | ≤ 32 KiB / 12 |
| CAS changing execs (census) | 10/8/8 | 10/8/8 | 10/8/8 | 10/8/8 | 10/8/8 | reported |
| rollbackWithLiveProcesses | 0 lost, tip OK (14 completed, 6 wal-pending) | same | 0 lost, tip OK (11 completed, 9 wal-pending) | 0 lost, tip OK (14 / 6) | 0 lost, tip OK (11 / 9) | passes |

Reading the table:

- The branch moves no main-path row: CAS, push, reconcile, writeBlob, WAL and the node-loan rows match main within run-to-run noise.
- main#1's reconcile figure of 6.6 s and main#2's low nodeLoan figures are single-run outliers. Main#3 matches the branch.
- The two paired rows exist only on the branch. Both fail their budgets on both runs.
  - ScopedCommit (preflight + commit through the port) costs about 1.6x today's `commitUnitWork`.
  - Land costs about 8.4x the legacy merge path.
  - The bench records Land prepare and publish only as a sum, so this gate cannot say which half dominates. A per-phase split or a spawn census of one port Land is the next measurement.

## Bench fixture fix (b38d7fe0f)

The first branch E3 run (3f3abcab3 merge) aborted before any row was measured:

```
StoreError: git rev-parse main failed in ".../typed-land-legacy-0": unknown revision
```

`typedOperationRows` created its fixtures with `--initial-branch=trunk`. The legacy `mergeRootIntoMainCas` resolves its target with `detectTrunk()` (`src/runner/worktree.mjs`), which tries origin/HEAD, then main, then master, and falls back to `main`. At the coordinator's request, b38d7fe0f changes only `scripts/git/e3-bench.mjs`:

- typed fixtures init with `main`
- they check out `main`
- the port Land destination is `refs/heads/main`

`merge.mjs` and `worktree.mjs` are unchanged. `node --check` passes, and a `--typedSamples 2` smoke run completed both paired rows. The commit is on git/p06-land-restore and is not pushed.

## npm test failures, classified

| File (failures) | 3f3abcab3 merge | main 0e0c0f101 | b38d7fe0f delta | Class |
|---|---|---|---|---|
| `test/git/safe-restore.test.mjs` (1) | fail | file not on main | fail, also 2/2 alone | **Introduced, deterministic.** Line 52 expects `/native-state/` for an external `.git/index.lock`. `apply` now refuses with `recovery-required` `native-index-lock-unowned: inspect with repairNativeIndexLock; follow Git spec §11 ...`. 7e2fd6d90 changed `restore.rs` and updated the Rust `tests/safe_restore.rs`, but not this Node test. The lock bytes are still preserved, so this looks like a stale expectation, not a behaviour regression. |
| `test/holder-lock/fences-v1-tombstone.test.mjs` (1) | fail | fail | fail | Pre-existing on main: `Cannot find package 'yaml'` from a temp copy |
| `test/setup/run-supervisor-checks.test.mjs` (4) | fail | fail | not run | Pre-existing on main: socket path length under the nested suite temp root |
| `test/setup/skill-wrappers.test.mjs` (1) | fail | fail | not run | Environment: a fresh worktree lacks the git-ignored `.claude/skills` render |

Also seen: one `run-tests: ERROR: test suite leaked ... .fgos/runtime/dev-host/run-*/fgos(.node.*.tmp)` line in the merge log. It was printed by a nested `run-tests.mjs` self-test ("spawned for real, runs ... the real full suite over a tiny fixture tree"). That self-test snapshotted the real checkout's `.fgos` while a concurrent `rust-host/dev-host` test had its run dir in flight. The outer runner reported no leak, the dir was empty afterwards, and the self-test passed. I classify it as timing noise, not a failure. It did not appear on main in this run.

## Housekeeping

- The two benches that ran on the first merge tree aborted on the fixture bug. Their roots are removed.
- At about 04:10, killing the first orchestrator let it start the merge npm suite early. I stopped that suite and its orphaned fixture processes. The `fgos-test-run-*` root it left was removed, and the full suite was rerun later on its own.
- Scratch worktrees, private Cargo dirs and processes were removed or stopped after the gate. Logs are kept under `/home/vantt/.claude/jobs/e1505f04/tmp/gate-p06b/`.

## After the gate

The coordinator settled the `native-index-lock-unowned` refusal as the intended behaviour from 7e2fd6d90. a2e4dba08 updates `test/git/safe-restore.test.mjs` to expect `code: recovery-required` with a cause starting `native-index-lock-unowned:`. The byte-preservation assertions are unchanged. Run alone, the file now passes 4/4. That leaves no introduced Node failure.

The coordinator also decided to land Git 06 with both E3 paired budgets failing. A performance unit is required before phase 07.

## Unresolved questions

1. Land port p95 is about 8.4x the legacy merge path. Does prepare or publish dominate? A per-phase split and a spawn census are needed for the performance unit.
2. ScopedCommit port p95 is about 1.6x, against a 1.5x budget. Should the performance unit fix it together with Land?
