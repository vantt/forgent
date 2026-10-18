# Experiment E3 again, after the review fixes and the merge of main

Date: 2026-10-19 (Asia/Saigon). Branch `git/p01-publication-perf`. Code under test: `9e407f0b1` (review fixes `6656b06d1`, merge of `origin/main` `cf32dd33b`, clippy fix). Previous run: `plans/reports/experiment-261019-0018-git-e3-after-port-optimization.md` ("00:18 run", code `1d13db5bc`). Budgets: `plans/261018-0914-git-component-fgos-git/e3-budgets.md`, owner-set, not edited.

## Verdict first

**Not pushed.** The review fix for the holder-lock drain (finding M1 in `plans/reports/review-261019-0020-git-publication-port-optimization.md`) brings back a full `/proc` scan on every borrowed Git child and on every admission. That cancels most of the port optimization. No-op CAS goes from p95 2.4 to 175 ms, `writeBlob` existing from 1.9 to 36 ms, and changing CAS from 192 to 695 ms. Push, reconciliation and first Publication fail again. This is a performance regression, not the fsync floor. The fix was deliberate, for a correctness reason (a descriptor passed with SCM_RIGHTS to a process that already existed), so the trade-off is a design decision for the owner. A separate finding: rollback under a live writer still refuses with `git-wal-unreadable`, now for a different reason (a ledger temporary file, reproduced below).

The merge of `origin/main` is clean and adds no measurable cost: builds of `6656b06d1` (before the merge) and `9e407f0b1` (after) measure the same.

## Per budget line

The "00:18 run" column is the full harness run of the previous report. "Now" is the full `e3-bench.mjs run` on `9e407f0b1`: same sizes (`--samples 500 --pushSamples 100`), release build, ext4 (`/dev/nvme0n1p2`). The 1-minute load average was 18.7 at the start, while a compile was finishing; it dropped to 3.7 within three minutes and stayed at 1.4–1.9 for most of the run; it was 4.2 at the end. The early rows ran while the load was falling, and the interleaved A/B below rules out host load as the cause.

| Budget line | Budget | 00:18 run | Now | Verdict now |
|---|---|---|---|---|
| Addon load, first call | ≤ 30 ms | p95 5.06 | p95 7.26 | pass |
| `writeBlob` new | p95 ≤ 15 | 21.39 | **63.74** | **fail** |
| `writeBlob` existing | p95 ≤ 10 | 1.90 | **36.18** | **fail** (regression) |
| `compareAndSwap` no-op | p95 ≤ 15 | 2.39 | **174.68** | **fail** (regression) |
| `compareAndSwap` changing | p95 ≤ 60 / p99 ≤ 120 | 191.7 / 197.0 | **694.7 / 754.0** | **fail** |
| …at 320 retained | | 129.4 / 149.4 | 339.8 / 358.3 | |
| …at 1,000 retained | | 136.5 / 141.4 | 343.7 / 361.7 | retention still flat |
| Local push, no new objects | p95 ≤ 150 | 134.9 | **369.2** | **fail** (regression) |
| Local push, with objects | p95 ≤ 250 | 138.4 | **365.7** | **fail** (regression) |
| ScopedCommit, Land | 1.5x / 1.2x | not in phase 01 | not in phase 01 | not measurable |
| Git subprocesses per op | reported | census | census (below) | reported |
| WAL amplification per completed op | ≤ 32 KiB / ≤ 12 inodes | 4,123 B / 1 | 4,123 B / 1 | pass |
| Backlog scan, 10,000 pending | ≤ 300 ms, complete | p95 238.5 | p95 255.6, complete | pass |
| Reconcile 100 interrupted | ≤ 10 s | 5.58 s | **20.37 s** (203.7 ms/op) | **fail** (regression) |
| Rollback with live processes | C5 refused or completed, nothing lost | pass, 5 `git-wal-unreadable` of 34 | pass: 0 lost, tip = last receipt, WAL scan complete; 24 completed, 6 `git-wal-pending`, **2 `git-wal-unreadable`** of 32 | pass, still refuses for an unrelated race (below) |

Other numbers: first Publication in a fresh process took p50 198.5 ms (77.8 before). With the in-process Rust port, a changing CAS measured p50 300.9 ms on the host and 177.3 ms in a private PID namespace (113 / 116 before). The per-host cost that the optimization had removed is back. Reconciliation outcomes are the same as before (25 abandoned, 25 `RecoveryRequired`, 50 `effectObservedOnly`).

## Census per changing CAS

strace `-f` across three runs, counted between per-operation markers.

| Operation | Git children (execve) | fsync/fdatasync |
|---|---|---|
| CAS changing | 10, 8, 8 (00:18 run: 10, 8 on a ref seen before) | 20, 20, 20 (00:18 run: 20) |
| CAS no-op | 1 | 2 |
| `writeBlob` new / existing | 2,1,1 / 1 | 3 / 0 |
| push, with or without objects | 12, 12, 16 | 13, 13, 25 |

Git children and fsyncs did not change. The cost that came back is process-table reading, not I/O ordering.

## Cause: the full drain on every borrow

`packages/holder-lock/rust/src/port.rs` `finish_borrowed` now runs a second `end_leftovers(..., None)` (every process) after each borrowed child exits. `validate_quiescent` → `wait_unborrowed` now always uses `Reach::Everyone`. These are review fixes M1 and L6. They are correct for their threat: a holder that received the description over SCM_RIGHTS before the mark. But each one reads the descriptor table of every process on the host.

Interleaved A/B, in-process Rust port (`e3_fixture port`, n=60, two rounds alternating builds, load 4.0 → 1.7, 533 visible processes). Values are p50/p95 in ms.

| Build | CAS changing | CAS no-op | `writeBlob` existing | `writeBlob` new |
|---|---|---|---|---|
| `1d13db5bc` (00:18 run code) | 171.5/181.7, 171.6/183.6 | 7.0/9.2, 7.2/9.2 | 4.1/5.1, 4.6/5.2 | 15.2/16.8, 16.1/17.2 |
| `6656b06d1` (review fixes, before merge) | 303.2/332.4, 303.9/344.6 | 29.0/42.7, 28.8/43.2 | 14.5/23.4, 14.4/23.7 | 26.8/35.7, 28.9/37.3 |
| `9e407f0b1` (after merge) | 310.9/333.5, 302.7/339.4 | 28.9/42.9, 29.4/45.0 | 13.6/21.5, 12.7/22.7 | 28.1/35.8, 27.4/35.1 |

Under strace, ten iterations of the four port workloads open `/proc` entries 16,027 times on `1d13db5bc` and 473,601 times on `9e407f0b1`. The Node route is hit harder than the in-process port (no-op CAS 175 ms against 29 ms), which fits a scan whose cost grows with the descriptor tables it reads.

The phase-lead report recorded this cost knowingly ("Final full scans intentionally retain their cost"), but E3 had not run on it. Choosing between the M1 guarantee and these budgets needs an owner decision, for example: keep the full final drain only when the borrowed child could have passed descriptors (it cannot for the Git plumbing calls the port makes); find a cheaper proof that no older process holds the description; or accept the cost and revisit the budgets. None of these was attempted here.

## Rollback with a live writer: a different race remains

The refusals no longer come from compaction removing an operation directory mid-scan; review fix M5 covers that case. They come from the ledger pass of `Wal::scan` (`packages/git/rust/src/wal.rs`). Compaction installs the ledger entry through `self.install(&self.ledger, id, …)`, which first writes a `.durable-file-<pid>-<seq>.tmp` temporary in `fgos/git/compacted/`. The ledger pass calls `self.compacted(name)` on every directory entry. A temporary's name is not a valid operation id, so the entry gets an error, and `distribution::git_gate::check_wal` refuses with `git-wal-unreadable: incomplete or corrupt operation scan`. The operation-directory readers (`inspect`, `has_intent`) already skip these temporaries; the ledger pass does not.

Deterministic reproduction on the rollback fixture workspace with the release `fgctl`: a clean rollback completes. After `touch .git/fgos/git/compacted/.durable-file-999999-0.tmp`, the same rollback refuses with `git-wal-unreadable: incomplete or corrupt operation scan`. After removing the file, the rollback completes again. A rerun of only the rollback row, with every `fgctl` stderr logged, showed the same message on its one `git-wal-unreadable`. The refusal is in the safe direction (nothing is lost), but it makes a rollback under a live writer retry more often. A likely fix is to skip temporaries in the ledger pass the way the operation-directory readers do, plus a test. This is a C5 scan change and is not done here.

## Merge of `origin/main`

Two conflicts, both resolved keeping both sides:

- `packages/durable-file/rust/src/lib.rs`: main's creation-mode installs (`install_once_with_mode`, `replace_durably_with_mode`, a `mode` argument on the shared write path) sit alongside this branch's `install_ordered` and `sync_directories`. The extra argument pushed the private write path past clippy's limit of 7 parameters; `also_sync` and `alongside` are now grouped in one private `Ordered` value (`9e407f0b1`). Public signatures are unchanged.
- `CHANGELOG.md`: both Unreleased lines kept.

One semantic fix outside the conflicts: `materialize` in `packages/git/rust/src/publication.rs` reads the current tip only for outcomes that have no observed tip of their own. The new `ConfigApproved` outcome was added to that arm, matching main, where every outcome read the tip. Compaction and ledger v2 already handle `ConfigApproved` as terminal: `compaction_suffix`, the compact outcome code `"c"` and its validation all came from main and merged automatically. `wal-record.v1.schema.json` is main's version. The schema contract tests pass.

## Gates on the merged branch

- Rust, `cargo test --locked --no-fail-fast` on fgos-git, fgos-holder-lock, fgos-process, fgos-durable-file, fgos-event-store, fgos-distribution, fgos-run-supervisor and fgos-terminal-control, with `--test-threads=1 --nocapture`: 632 passed, 1 failed, 3 ignored, 94 targets. The one failure is the known `containment_terminal_gate_dies_with_a_killed_supervisor` (fgos-process). The output contains no `no-bwrap-pidns` skip, so the bwrap PID-namespace vectors ran. fgos-durable-file and fgos-git were run again after the clippy refactor: 75 passed, 0 failed.
- `cargo clippy --all-targets -- -D warnings` on the same crates: clean, after `9e407f0b1`.
- Windows: `rustup target add x86_64-pc-windows-msvc` succeeded. `cargo check --locked --target x86_64-pc-windows-msvc -p fgos-holder-lock -p fgos-process -p fgos-git` passed with two warnings, both older than this branch: an unused `common` in `wal.rs` `open_trusted` (from `8f167e7cd`) and an unused `ORPHAN_SETTLE` import in `windows_job.rs` (from `8ccabb113`).
- npm: `npm test` ran with `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`, a private `CARGO_TARGET_DIR` holding the release workspace build, and `FGOS_HOST_BIN` set to a debug host built from the branch. Result: 8,220 tests, 8,052 pass, 72 fail, 31 skipped. 66 of the failures were in `fgctl` and fence tests that expect `<worktree>/target/release/fgctl`. This worktree held a real `target` directory, so the usual symlink to the release payload was missing. The 11 affected files were rerun with that link in place: 97 tests, 95 pass, 2 fail, and both are known baselines (`fences-v1-tombstone` and the `holder-lock-checks` monitor/supervisor membership test). The full run's other failures are known baselines (`crash-matrix-adopt-resume` direct no-binding resume, `skill-wrappers`) or a known flake (`hot-lock-multiprocess` fast-path ratio 1.110, which passed on the rerun). No new failure.

## Reproduce

Build the release artifacts from `9e407f0b1` with `cargo build --release --locked -p fgos-node-addon --lib --example e3_fixture` and `-p fgctl`, then:

```bash
node scripts/git/e3-bench.mjs run --samples 500 --pushSamples 100 --root <fresh dir on ext4> \
  --addon <release>/libfgos_node_addon.so --fixture <release>/examples/e3_fixture --fgctl <release>/fgctl
```

For the A/B, build `e3_fixture` at each commit and run `e3_fixture port <state> <bare repo> 60 e3-writer`. The bare repo needs `fgos/events/locks` and a `.fgos/locks/activation.lock/TOMBSTONE` fence, as `prepareRepo` in the harness creates. Raw results are in `.fgos/runtime/e3-bench/full/results.json`, which is ignored scratch output and not committed.
