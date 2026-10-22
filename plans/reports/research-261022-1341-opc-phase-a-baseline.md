# OPC Phase A baseline (phase 00)

Commit: `984e24d2c` (worktree `/home/vantt/projects/forgent-worktrees/opc-phase-a`, branch `opc/phase-a`). Measured 2026-10-22 13:44-15:55 Asia/Saigon, same host as the council (24 cores, bwrap 0.11.1 selected as `bwrap-pidns`, git 2.53.0, NVMe fsync floor 5.3 ms). No repository file edited except this report; one local file restored, see item 0.2.

## 0. Read first

1. **Noise.** The window was quiet in the sense of no other `cargo`/`rustc`/`run-tests`/`e3-bench` process (gate script checked before every timed run, load1 < 2 each time; readings in section 6). But this host was about 1.8x slower per spawn than at the council measurement (plain `git rev-parse` 1.6-1.8 ms here vs 0.9 ms then). Absolute numbers are therefore not comparable with the council report; compare only paired deltas and ratios within this report. Phase 05 must be measured in the same style (interleaved, same gate) and compared as ratios.
2. **A fresh worktree is not a valid `npm test` baseline until `.fgos/config.json` exists.** The file is tracked but marked skip-worktree (`git ls-files -v` shows `S`), and it is absent in a new linked worktree. In suite run 1 the tests then wrote a 1,191-byte stub in its place and 79 tests failed (config-dependent provider/executor tests, `Cannot read properties of undefined (reading 'glm')`). I restored the committed bytes with `git show HEAD:.fgos/config.json > .fgos/config.json` before run 2 (a skip-worktree file, invisible to git status; byte-identical to HEAD). Runs 2 and 3 are the baseline; run 1 is reported as the artifact it is. Phase 05 must do the same restore in its own worktree, or its failures will look like regressions.
3. **My own first logs lived under `.fgos/`** and tripped the suite's store-leak check (`Modified: .fgos/runtime/tmp/opc-a/out/npm-1.log`). From run 2 on, all logs went to `/dev/shm/opc-a-out/`, so that line is absent in runs 2 and 3.

## 1. Suite wall time

All `npm test` runs: `CARGO_TARGET_DIR=~/.cache/opc-a-npm-target npm test` (release artifacts built once beforehand, so no compile time is inside the timed run). All `cargo test` runs: `CARGO_TARGET_DIR=~/.cache/opc-a-cargo cargo test --workspace`, a separate directory, warmed once by `cargo test --workspace --no-run` (13:42-13:43, not timed, not counted).

| run | start | wall | exit | pass / fail / skipped | run-tests ERROR lines |
|---|---|---|---|---|---|
| npm 1 (artifact: no `.fgos/config.json`) | 14:17:19 | 446.5 s (suite line 426 s) | 1 | 8672 / 79 / 31 | temp dirs left behind (`fgos-direct-repo-*: 1`); store leak (`+ .fgos/config.json` added by a test; `* npm-1.log` my own log) |
| **npm 2** | 14:29:47 | **464.0 s** (suite line 456 s) | 1 | 8749 / 2 / 31 | temp dirs left behind (`fgos-direct-repo-*: 1`) |
| **npm 3** | 14:55:05 | **469.3 s** (suite line 461 s) | 1 | 8751 / 0 / 31 | temp dirs left behind (`fgos-direct-repo-*: 1`) |
| cargo 1 | 14:40:58 | 5.9 s | 101 | stopped at first failing crate | n/a |
| cargo 2 | 14:41:09 | 468.9 s | 101 | 897 passed, 1 failed, stopped at first failing crate | n/a |
| cargo no-fail-fast | 15:50:03 | 560.5 s | 0 | 1259 passed / 0 failed | n/a |

Reading:
- **`npm test` baseline: 464-469 s wall (runs 2-3), exit 1 in all three.** The exit 1 in runs 2 and 3 comes from the leak check alone (run 3 has 0 failing tests): every run leaves one `fgos-direct-repo-*` temp dir. Origin is the run-supervisor direct harness (`test/run-supervisor/support/direct-harness.mjs`): a harness leak, independent of containment. Reported, not fixed.
- Run 2 failed two tests that depend on spawning a shell-script stand-in host: `test/seat-binding/client.test.mjs` "a host that does not know the route throws host-version-mismatch" and "the row fails on a host that has no seat-binding route" (the spawn reported `failed to run` instead of the expected version-mismatch code). They passed in run 3, so they are load- or race-sensitive. Reported, not fixed.
- **`cargo test --workspace` as written stops at the first failing crate**, so runs 1 and 2 are not full-suite wall times. Run 1 failed `fgos-distribution` `store::tests::test_lock_exclusive_and_release` (`lock3.is_ok()`, `packages/distribution/rust/src/store.rs:344`) after 5.9 s; run 2 passed that test and failed `fgos-process` `containment_pgroup::a_hundred_fast_exits_are_normal_spawns` (`containment_pgroup.rs:139`: `is_empty` returned `Unknown`, expected `Empty`) after 469 s, with 144 test binaries reported and 897 tests passed. The second failure is directly relevant to the pgroup work: `LinuxPgroup::is_empty` is not reliable under load for a `/bin/true` child. The no-fail-fast run (exit 0, all green) gives the full wall: neither failure recurred, so both are load/race flakes.

## 2. Contained-git census of one `npm test` run (strace)

Method: `strace -f -qq -s 4096 -e trace=execve,clone,clone3,fork,vfork -o /dev/shm/opc-a-census.strace npm test` (15:04:30-15:25:47, 541 MB log on tmpfs, deleted after parsing is not required but the log is volatile). Parser: `.fgos/runtime/tmp/opc-a/census-parse.py`. Each exec is attributed to the `test/*.test.mjs` file that appears in the argv of its nearest ancestor `node` process. The suite itself exited 1 in this run (same leak line), traced run pass count not separately analysed.

Definitions: **contained** = `bwrap` exec whose payload is git (`bwrap … -- /usr/bin/git`); **borrowed** = top-level git exec with the driver's argv prefix (`--no-replace-objects` or `core.fsmonitor=false`) that is not under a bwrap; **plain** = other top-level git exec (tests, scripts, legacy Node paths); git started by git (`pack-objects`, `upload-pack`, ...) is counted apart. This split of "borrowed" from "plain" is by argv prefix, not by tracing the borrow call, so treat the two as indicative.

| class | count |
|---|---|
| bwrap execs running git (contained) | **92,845** |
| bwrap probe (`bwrap … /bin/true`), one per process | 5,171 |
| bwrap execs running something other than git | 4,034 |
| driver-direct git, not under bwrap (borrowed) | 18,871 |
| plain top-level git | 79,256 |
| git started by git | 6,002 |
| test files with at least one contained child | 314 of 601 |

Top 10 test files by contained count:

| bwrap | borrowed | plain | file |
|---|---|---|---|
| 3,135 | 225 | 800 | runner/execution/run-provider-failover.test.mjs |
| 2,896 | 770 | 2,183 | runner/worktree.test.mjs |
| 2,730 | 271 | 2,131 | runner/execution/run.test.mjs |
| 2,715 | 300 | 659 | workflow/workflow-runner.test.mjs |
| 2,687 | 892 | 3,144 | runner/merge.test.mjs |
| 2,663 | 414 | 2,276 | cli/fgos-merge.test.mjs |
| 2,344 | 168 | 1,838 | cli/fgos-return.test.mjs |
| 2,192 | 682 | 853 | event-store/migrate.test.mjs |
| 2,033 | 509 | 298 | runner/loop.test.mjs |
| 2,020 | 584 | 309 | workflow/units-runner.test.mjs |

The required R2 row: `runner/worktree-admin-multiprocess.test.mjs` has **376 contained**, 51 borrowed, 63 plain (not in the top 10).

Read: 92,845 contained children in one suite run, i.e. about 11 per test() call on average; 5,171 processes each paid the probe.

## 3. Micro rows (harness copied from the speed seat, `.fgos/runtime/tmp/opc-a/bench.c`)

`git rev-parse HEAD` in a one-commit repo, interleaved (one of each variant per round), n = 300 per row, `posix_spawn`, wall from spawn to `waitpid`. Two batches, each gated (no cargo/rustc/run-tests, load1 < 2).

| row (p50 / p95, ms) | batch 1, 13:56:53, load1 1.29 | batch 2, 14:28:41, load1 1.98 |
|---|---|---|
| plain | 1.60 / 3.55 | 1.82 / 3.72 |
| setsid (pgroup-like) | 1.64 / 3.70 | 1.85 / 3.79 |
| bwrap, production argv | 4.72 / 9.76 | 5.55 / 10.68 |
| plain + 2 ms sleep poll | 2.23 / 4.60 | 2.27 / 4.67 |
| bwrap + 2 ms sleep poll | 6.34 / 10.82 | 6.40 / 10.87 |
| anchor child (n = 1000) | 1.57 / 4.00 | 0.86 / 2.52 |
| plain interleaved with anchor (n = 1000) | 1.40 / 3.61 | 0.75 / 2.26 |
| anchor open (n = 100) | 2.81 / 7.73 | 1.75 / 5.42 |
| anchor close (n = 100) | 0.40 / 1.13 | 0.24 / 0.62 |

Paired deltas: bwrap minus plain +3.1 (batch 1) and +3.7 (batch 2) ms; poll adds +0.6 / +0.45 to a plain child (the quantum hides most of the cost for a 1.6 ms child) and +1.6 / +0.85 to a bwrap child; anchor child minus plain +0.17 / +0.11.

Fsync pairing: probe `fs 100` (write 1 byte + `fsync`) before and after batch 2: 5.29 / 5.44 then 5.32 / 10.64 (p50 / p95; the second probe shows slow-mode samples). Batch 1 has no fsync probe (the probe binary was not built yet when it ran). No micro row writes, so fsync is context, not a correction.

## 4. E3 rows (`scripts/git/e3-bench.mjs run`, default samples, two rounds)

Artifacts at HEAD from `~/.cache/opc-a-npm-target/release`; round 1 13:57-14:15, round 2 15:26-15:47. `typedSamples` 30 (paired legacy/port interleaved inside the tool), push n = 100 with its own fsync classification.

| row (ms) | round 1 | round 2 | owner budget / clean-rerun reference |
|---|---|---|---|
| ScopedCommit legacy p50 / p95 | 89.1 / 234.2 | 219.6 / 266.4 | absolute p95 250 |
| ScopedCommit port p50 / p95 | 303.3 / 467.8 (fails budget) | 371.3 / 391.7 (fails budget) | clean rerun p95 185.7 |
| Land legacy p50 / p95 | 920.9 / 1696.4 | 1549.3 / 1634.7 | Land budget p95 1600; clean rerun 0.51 s |
| Land port p50 / p95 | 816.8 / 1295.1 (pass) | 1206.2 / 1261.0 (pass) | clean rerun 0.49-0.51 s |
| push with objects p50 / p95 | 169.4 / 300.9 (failed) | 308.7 / 331.0 (not judged) | budget p95 250 |
| push without objects p50 / p95 | 162.7 / 277.1 (failed) | 304.0 / 325.6 (not judged) | budget p95 150 |
| push fsync class | fsync-fast (5.69 / 5.28) | fsync-slow (5.19 / 7.66) | judged only when fast |

These E3 numbers do not reproduce the clean rerun (ScopedCommit port p95 was 186 ms, Land 0.5 s, push 146 ms): everything is 2-3x slower in both rounds, round 2 additionally in fsync-slow mode, and round 1 started while the HARDEN window was just closing (13:57, quiet declared 13:58). I do not treat any E3 row here as a baseline for a pass/fail judgement. Use them only as the unit for a ratio in phase 05 (same method, interleaved, same gate), and consider re-running E3 once the host is back at its 0.9 ms plain-spawn state; I did not re-run because the round already cost 18-21 minutes and rounds 1 and 2 agree on the verdict (not representative). Raw JSON: `.fgos/runtime/tmp/opc-a/out/e3-1.json` and `e3-2.json`.

## 5. Expected gain from A1 (estimate, not a measurement)

A1 = replacing the 2 ms poll in the contained branch with a wake/bounded wait. Inputs: 92,845 contained children per suite run (section 2) and the brief's 1.4 ms per child (measured here: +0.85 to +1.6 on a bwrap child, +0.45 to +0.6 on a plain child, so 1.4 is the upper-middle of the range for the bwrap path).

- Aggregate saved child time: 92,845 x 1.4 ms = **about 130 s** of summed child-wait time across the whole suite (range 79-149 s with 0.85-1.6 ms).
- Wall effect: the suite runs test files concurrently, so the wall gain is that sum divided by the effective concurrency C, which I did not measure. At C = 24 it would be about 5 s of a 464 s run (about 1%); at C = 8 about 16 s (3.5%). It is therefore not a headline suite speed-up; per-operation gains (Land, ScopedCommit) are where it shows (council report section 6).
- The probe: 5,171 processes x 2.8 ms ≈ 14.5 s of summed time, not touched by A1.
- Contained children are all Inspect reads (council census); this baseline did not re-split by policy in the suite.

## 6. Method (reproduce)

Scripts under `/home/vantt/projects/forgent-worktrees/opc-phase-a/.fgos/runtime/tmp/opc-a/`: `master.sh` (first sequence, killed after run 1), `master2.sh` (sequence actually used: micro 2, npm 2, cargo 1, cargo 2, npm 3, census, E3 round 2), `chain.sh` (no-fail-fast cargo run), `mk.sh` (gcc), `bench.c`, `anchor.c`, `fs.c`, `census-parse.py`, `warm.sh`/`warm2.sh` (the two builds). The gate in every script waits until `pgrep -fa "cargo (test|build)|rustc |run-tests.mjs|e3-bench"` finds nothing and `/proc/loadavg` load1 < 2 (up to 50 minutes, never hit the timeout). Order of the first sequence: micro 1, E3 round 1, npm 1 (cargo 1 never started in it); master2 then ran the rest with logs on `/dev/shm`. Logs: `/dev/shm/opc-a-out/*` (volatile) and copies under `.fgos/runtime/tmp/opc-a/out/` (`master2.log`, micro, E3 JSON, census result, `npm-census.log`).

Gate readings (load1 at gate open): micro 1 1.29; E3 round 1 1.69; npm 1 1.90; micro 2 1.98; npm 2 1.97; cargo 1 1.97; cargo 2 1.97; npm 3 1.84; census 1.96; E3 round 2 1.98. Load before the window: 28.8 at 13:07 (council time), 54-73 at 13:41-13:44 (HARDEN full verify), 1.5 at 13:53. Values just under 2 are residue of my own preceding run; no other cargo/rustc/run-tests process was running at any gate open. Processes owned by other sessions at gate time: only desktop/claude (3-8% CPU).

Sample counts: micro 300 per row (anchor child 1000, open/close 100); suite 3 npm runs, 2 cargo runs plus 1 no-fail-fast; E3 2 rounds (typed 30, push 100); census 1 run.

Cleanup: no process of mine remains (checked at the end); `/dev/shm` census log and cargo targets under `~/.cache/opc-a-*` kept for the follow-up phase.

## 7. Findings for the phases that follow

- **High.** `.fgos/config.json` is skip-worktree and missing in new worktrees: 79 false failures and a store-leak line. Phase 05 (and any verification in `opc-phase-a`) must restore it before measuring (item 0.2).
- **Medium.** `fgos-process` `a_hundred_fast_exits_are_normal_spawns` fails when `LinuxPgroup::is_empty` returns `Unknown` right after a `/bin/true` child exits (`containment_pgroup.rs:139`), seen once in two cargo runs. Directly relevant to the pgroup escapee-watch phase; a flaky proof today.
- **Medium.** `fgos-distribution` `test_lock_exclusive_and_release` failed once (`store.rs:344`), not seen in run 2.
- **Low.** One `fgos-direct-repo-*` temp dir left per `npm test` run (`test/run-supervisor/support/direct-harness.mjs`), which makes `npm test` exit 1 on a green suite (run 3).
- **Low.** Two seat-binding client tests race (spawn of a shell-script stand-in host), failed in run 2 only.

```text
Status: DONE_WITH_CONCERNS
Summary: Baseline recorded at 984e24d2c: npm test 464-469 s (exit 1 from a temp-dir leak, not failing tests), cargo test as written stops at the first flaky failure so a no-fail-fast full run is added, census shows 92,845 contained git children per suite run with worktree-admin-multiprocess at 376.
Concerns/Blockers: Host ran about 1.8x slower per spawn than at the council measurement and E3 rows do not reproduce the clean rerun, so E3 and absolute micro numbers are usable only as ratios; fresh worktree lacks the skip-worktree .fgos/config.json (restored from HEAD for runs 2-3).
```

## Key numbers

| item | value |
|---|---|
| npm test wall (runs 2, 3; run 1 invalid) | 464.0 s, 469.3 s; exit 1 each (temp-dir leak); 2 and 0 failing tests |
| cargo test --workspace as written | 5.9 s and 468.9 s (stopped at first failing crate); full no-fail-fast: 560.5 s |
| contained git children per suite run | 92,845 (314 of 601 files); probes 5,171; borrowed 18,871; plain 79,256 |
| worktree-admin-multiprocess | 376 contained, 51 borrowed, 63 plain |
| micro: bwrap minus plain | +3.1 / +3.7 ms (this host state); poll on bwrap child +1.6 / +0.85 |
| micro: anchor child minus plain | +0.17 / +0.11 ms; open 1.75-2.81, close 0.24-0.40 |
| E3 ScopedCommit port p95 | 467.8 / 391.7 ms (not representative; clean rerun 185.7) |
| E3 Land port p95 | 1295 / 1261 ms (clean rerun ~500) |
| A1 expected gain (estimate) | 92,845 x 1.4 ms ≈ 130 s summed; about 5 s wall at concurrency 24 |
