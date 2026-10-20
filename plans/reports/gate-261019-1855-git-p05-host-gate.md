# Git 05 host gate (git/p05-commit-sync)

Date: 2026-10-19, Asia/Saigon. Host fg-server2 (i7-13700 x24, ext4 on NVMe, `powersave` governor). This report records evidence only. No code was changed.

## Verdict for the deciding tip ee86ce20d

The run used ee86ce20d merged with origin/main aff81800e (scratch merge 1b88c848e). The only conflict was in CHANGELOG.md. It was resolved as a union in the scratch tree only.

| Check | Result |
|---|---|
| `cargo test --workspace` | **1044 pass / 0 fail** / 3 ignored |
| `cargo clippy --workspace --all-targets -D warnings` | clean |
| `npm test` (private state root, private host) | 8435 tests: 8260 pass, **78 fail**, 32 skipped, 65 todo. Every failure is classified below. **One failing file is introduced by Git 05.** |
| E3, changing CAS | p95/p99 **181.5 / 189.9 ms**. Fails p95 ≤ 150, passes p99 ≤ 250. Main measures the same: 181.0 / 187.5. |
| E3, `nodeLoanScopedCommit` | p95/p99 **2187.1 / 2221.9 ms**. Fails both budgets by about 14x. |
| E3, `nodeLoanScopedCommitAgedFloor` | p95/p99 **2220.5 / 2243.1 ms**. Fails both budgets. |
| E3, rollback with live processes | passes: 0 lost or mismatched receipts, tip matches the last receipt, 13 completed and 7 `git-wal-pending` |
| New test files carry the `process-tmp-root` import first | all 5 do |

## Node failures at ee86ce20d, classified

Each failing file was rerun alone on the Git 05 tree, and on origin/main where needed. The main side used its own scratch worktree and its own private cargo dir.

| File (failures in the suite) | Alone on Git 05 | Alone on main | Class | Evidence |
|---|---|---|---|---|
| `test/runner/execution/run-sync.test.mjs` (2) | fail 3/3 runs | pass 2/2 runs | **(a) introduced by Git 05** | Commit 0074f94ae removed `preCommitRefusal` from `commitStaged` in `src/runner/execution/commit-unit-work.mjs`. A pre-commit hook that refuses a sync merge commit now returns `reason: 'git-error'`, and `unit-sync.mjs` maps that to `execution-failure`. The test expects `hook-refused` → `policy-refusal`. A captured result shows `{"outcome":"execution-failure","refused":{"reason":"git-error","detail":"the clean merge of main could not be committed: not on a friday"}}`. Either the behaviour or the test must change. That is a reviewer or owner call. |
| `test/rust-host/fgctl-*.test.mjs`, 7 files (64) | pass, all 7 files | same failure as Git 05 with the gate env | (c) gate environment | The tests read `<checkout>/target/release/fgctl`, which a private `CARGO_TARGET_DIR` leaves absent. Once linked, they still fail because `FGOS_STATE_ROOT` (set for the gate) overrides the fixture's `FGOS_STATE_HOME`. With the binary linked and `FGOS_STATE_ROOT` unset, all 7 files pass on Git 05. |
| `test/holder-lock/fences-rust-locks.test.mjs` (4) | pass | pass, once the binary is present | (c) gate environment | same missing-fgctl cause |
| `test/runner/execution/run.test.mjs` (file-level) | fail (78 pass, file exit) | fail (same) | (b) pre-existing on main | No subtest fails, but the file exits non-zero. Likely cause (not proven): the test does `process.emit('SIGINT')` (line 1961), and since fa7d05f39 the `process-tmp-root` helper turns SIGINT into `process.exit(130)`. |
| `test/run-supervisor/cancel-registry.test.mjs` (file-level) | fail | fail | (b) pre-existing on main | same pattern: 5 of 5 subtests pass and the file exits non-zero. The test drives SIGINT/SIGTERM. |
| `test/holder-lock/fences-v1-tombstone.test.mjs` (1) | fail | fail | (b) pre-existing on main | `Cannot find package 'yaml'`, imported from a copy under the per-process temp root |
| `test/setup/skill-wrappers.test.mjs` (1) | fail | fail (2) | (c) scratch checkout | Generated `.claude/skills` and `.agents/skills` render output is git-ignored, so a fresh worktree does not have it. |
| `test/setup/run-supervisor-checks.test.mjs` (4) | pass | pass | (c) runner path length | In the suite, the nested `/tmp/fgos-test-run-*/fgos-tp-*/...` root leaves no room for a socket name within 100 bytes. Main's runner nests the same way, so this is very likely pre-existing. No full main suite was run to prove it. |
| `test/state/hot-lock-multiprocess.test.mjs` (1) | pass | pass | (c) flaky perf ratio | `fast path ratio 2.719 exceeds 1.10` under suite load. It passes alone on both trees. |

None of these matches B1-B7. The B6a failure seen on 44ea50358 (below) is fixed on main by 0d3aca692.

## E3: main against Git 05, back-to-back, same conditions

Both benches used prebuilt release artifacts (`--addon/--fixture/--fgctl`, and `--host` on Git 05), 200 samples, ext4, and no npm suite running on the host.

- Main (aff81800e) ran from 18:55 to 19:06. Load went from 1.16 to 5.65. Git spawn p50 was 5.07 ms at the start and 1.28 ms at the end.
- Git 05 (1b88c848e) ran from 19:06 to 19:35. Load went from 5.65 to 4.94. Git spawn p50 was 1.20 ms at the start and 5.13 ms at the end.
- The governor was `powersave` throughout.

| Row (ms, p50 / p95 / p99) | main | Git 05 | Budget |
|---|---|---|---|
| addon load + first call | 6.05 / 6.3 / 7.34 | 6.73 / 7.01 / 7.15 | ≤ 30 |
| writeBlob new | 17.07 / 18.26 / 18.38 | 16.77 / 18.21 / 18.74 | p95 ≤ 15, fails on both |
| writeBlob existing | 5.06 / 6.34 / 6.49 | 5.21 / 6.35 / 6.56 | p95 ≤ 10 |
| CAS no-op | 7.73 / 10.8 / 11.22 | 7.94 / 10.94 / 11.55 | p95 ≤ 15 |
| **CAS changing** | 170.74 / 180.97 / 187.5 | 171.3 / 181.51 / 189.88 | p95 ≤ 150 fails on both; p99 ≤ 250 passes |
| Rust port CAS changing (in process) | 164.37 / 172.71 / 174.13 | 163.76 / 173.44 / 177.05 | n/a |
| push, no objects | 242.56 / 261.74 / 275.57 | 243.37 / 264.11 / 272.86 | p95 ≤ 150, fails on both |
| push, with objects | 246.03 / 264.54 / 269.79 | 248.26 / 269.24 / 272.26 | p95 ≤ 250, fails on both |
| **nodeLoanScopedCommit changing** | (row not on main) | 2054.58 / 2187.14 / 2221.92 | p95 ≤ 150 / p99 ≤ 250, **fails** |
| nodeLoanScopedCommit preflight | n/a | 573.88 / 624.82 / 637.57 | n/a |
| **nodeLoanScopedCommitAgedFloor changing** | n/a | 2109.94 / 2220.5 / 2243.13 | **fails** |
| AgedFloor preflight | n/a | 593.6 / 632.5 / 642.37 | n/a |
| reconcile 100 interrupted | 15.4 s | 17.2 s | ≤ 10 s, fails on both |
| backlog scan of 10,000 (Rust) | p95 181.3, complete | p95 177.4, complete | ≤ 300 ms |
| WAL per operation | 4123 B, 1 inode | 4123 B, 1 inode | ≤ 32 KiB / 12 |
| rollback with live writer | 0 lost, tip OK | 0 lost, tip OK | passes |

The subprocess census is identical on both trees: changing CAS makes 8 execs and 20 fsyncs; push with objects makes 20/20/24 execs. **Git 05 does not move any publication line.** The p95 failures on changing CAS, push and reconcile are the host's fsync and spawn cost on an idle `powersave` machine. They appear on main too, as the 2026-10-19 00:18 and 02:47 reports describe.

### Why nodeLoanScopedCommit takes about 2.2 s

A probe ran the same ScopedCommit through the Node loan, using the final-tip release addon and host. Probe: `/home/vantt/.claude/jobs/e1505f04/tmp/gate-p05/probe/scoped-probe.mjs`.

- **There is no Rust-owned ScopedCommit row to compare against.** Calling the port without a loan is refused with `checkout-custody-required`, so custody must be lent.
- Over 40 samples the time is flat, about 2.1 s per commit (min 1914, max 2197) plus about 580 ms of preflight. It does not grow with sample count, and the aged floor adds about 50 ms.
- `strace -f` of 4 preflight+commit pairs shows 773 `bwrap` execs and 886 real `git` execs, about 193 contained Git calls per pair. They break down as follows:
  - 537 `git config --null --show-origin --list`, about 134 per pair
  - 105 each of `rev-parse --show-object-format` and `rev-parse --show-ref-format`, about 52 per pair together
  - only about 12 per pair doing real work: `diff`, `ls-files`, `add -A`, `write-tree`, `commit`, `update-ref`, `rev-list`, plus the hook
- There are no full-host `/proc` scans. All 2163 `/proc/N/stat` opens come from one thread and are per-child liveness checks, about 2 per spawn.

**Conclusion.** The 2.2 s is spawn count: about 190 sandboxed Git spawns at roughly 11-14 ms each. The config and format preflight is repeated around each Git call. The loan, the drain, the reach-floor scan and the commit+hook work are each a small share.

## Baselines on earlier tips (kept for reference)

| Tip | Rust | Clippy | Node | E3 notes |
|---|---|---|---|---|
| 44ea50358 + main 4b11868af..e04920bc6 | 1024 pass / 1 fail | clean | invalid: /tmp tmpfs hit ENOSPC partway through (4608 ENOSPC errors) | changing CAS p95/p99 179.3 / 182.7; rollback row errored because the harness manifest lacked the `nativeAddon` `git-wal-v1` capability (fixed later by 7797c468f) |
| c696892b9 + main | 1035 / 0 | clean | stopped when the tip moved | changing CAS 190.7 / 201.4; nodeLoanScopedCommit 2220.9 / 2267.9; rollback errored the same way |
| 0da5b7844 + main | 1040 / 0 | clean | not run | stopped while running |
| 159c165a8 + main | 1043 / 0 | clean | not run | stopped (replaced by ee86ce20d) |

On 44ea50358, `containment_terminal_gate_dies_with_a_killed_supervisor` failed deterministically, both alone and in the workspace run (`left: 37, right: 23`). That is B6a, which was pre-existing and is fixed by 0d3aca692 on main. The failing test also leaked its sandbox beat loop, `sh -c while :; do echo x >> beat` (two copies, from my runs). Both were stopped.

## Unresolved questions

1. Run-sync hook refusal: should a pre-commit hook that refuses a sync merge stay `hook-refused` / `policy-refusal` (restore the classification), or is `git-error` / `execution-failure` the intended new contract (update the test)?
2. nodeLoanScopedCommit: does the owner accept the about 190 contained spawns per commit as the cost of the dormant port, or should the config/format preflight be cached once per port or per loan before phase 07 wires it into production?
3. `run.test.mjs` and `cancel-registry.test.mjs` fail at file level on main as well. This most likely comes from the SIGINT-to-exit handler in `test/helpers/process-tmp-root.mjs` (fa7d05f39). It needs its own item.
