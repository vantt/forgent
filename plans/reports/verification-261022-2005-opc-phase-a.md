# Verification: OPC Phase A (containment fixes inside today's shape)

Commit `58ca24f0c` (worktree `/home/vantt/projects/forgent-worktrees/opc-phase-a`, branch `opc/phase-a`). Baseline: `plans/reports/research-261022-1341-opc-phase-a-baseline.md` at `984e24d2c`. Measured 2026-10-22 20:07-21:58 Asia/Saigon. Measurements by the speed seat; acceptance map, line count and open items by the lead (session `forgent-35`). No product file edited; `.fgos/config.json` was already present (not skip-worktree any more, identical to HEAD), so no restore was needed.

**Tóm tắt cho owner.**
- **Đã land đủ năm việc của Phase A** (A1–A5); mọi cổng xanh:
  - `cargo test --workspace` và `npm test`;
  - E4 26/26 trên cả hai driver Linux;
  - build Windows, clippy `-D warnings` và census một cửa.
- **Hai tiêu chí chưa có bằng chứng đủ:**
  - AC1: mỗi lệnh con đã nhanh hơn trên harness (−1,4 ms), nhưng nhiễu của máy lớn hơn hiệu ứng nên không thấy được ở mức thao tác đầu-cuối;
  - AC6 / E1: phần cắt điện thật cần root và `replay-log`; bản truy vết thứ tự fsync không cần root thì sạch.
- Hai câu hỏi cho owner ở mục "Open items".

## Acceptance map (plan `plans/261022-1335-opc-phase-a-containment-fixes/plan.md`)

| AC | Status | Evidence |
|---|---|---|
| AC1 no fixed sleep; about −1.4 ms per contained child | **Code done; gain shown only in the harness** | `driver.rs` wait is a pidfd poll with a 10 ms overflow check (no sleep). Harness: poll − blocking wait = +1.3 / +1.5 ms per child (council speed seat §3, n=300–500, interleaved). End-to-end E3/suite deltas are below the host's noise floor (§E3 below); no product-level A/B was built |
| AC2 refused `kill_all` → `containment-unproven` within a bound | Met | crate tests `a_timed_out_contained_call_whose_domain_cannot_be_emptied_returns_containment_unproven_without_waiting` and `a_contained_call_whose_root_exited_but_whose_domain_cannot_be_emptied_returns_containment_unproven` (`packages/git/rust/src/driver.rs`) |
| AC3 mount refusal named; doctor names driver and reason | Met | `containment_bwrap.rs::a_refused_mount_is_named_in_the_containment_error` (asserts `containment-mount-refused`); `test/setup/run-supervisor-checks.test.mjs` mount-reason case; `doctor process-containment` passes on release `a424fc0f` |
| AC4 pgroup contained read never plain success past a marked escapee | Met | `driver.rs::submodule_filter_escapee_reported_as_containment_unproven_on_best_effort_containment`; `environment_marked` p50 2.31 ms, p95 3.69 ms (gate 5 ms) |
| AC5 one conformance suite, 4 drivers, quirks as properties, net test lines ≤ 0, CI on `packages/process/**` | Met except the line target (accepted by TEST) | `tests/containment_conformance.rs` (bodies T, R, F, L, A, D, G); TEST approval 10-22. Lines: `git diff --numstat 96bc3fb1b -- packages/process/rust/tests` = net +30. Breakdown: HARDEN T1's carried red test and fixture about +18, phase 02 assertion +4, phase 04 itself −12 before clippy, about +8 after the named-field tables clippy required. No proof dropped; TEST accepted the overrun |
| AC6 E1 held, E4 held, E3 within budget, npm and cargo green, before/after recorded | **Partly**: E4, npm, cargo, before/after met; E1 order trace only; E3 rows not comparable to budget on this host state | §E1, §E4, §E3 below; baseline `research-261022-1341-opc-phase-a-baseline.md` |

Also found and fixed while proving: the `linux-pgroup` `ESRCH` flake (driver), a `linux-gate` record kill answering before teardown (driver), a Windows build break (OPC's own, fixed `50034f0c9`), two census sites OPC's A3 reshape hid (`508e55ef6`). Impact analysis: inactive (0 providers).

## Open items (owner)

1. **AC1 proof.** Options: (a) accept AC1 on the harness measurement plus the code (no fixed sleep remains), cost 0; (b) build a product A/B (base addon vs tip addon, same harness), about 1 h of a Sonnet agent plus a quiet window. Recommendation: (a), because the mechanism is measured and the end-to-end effect (≈ 1–4 % of an operation) is below what this host can resolve anyway.
2. **E1 power-cut run.** Needs root: `sudo env "PATH=$PATH" scripts/git/e1-power-cut.sh --work /var/tmp/fgos-e1 --replay-log <replay-log> --user vantt` with xfstests' `replay-log` installed. Phase A changed no fsync or WAL path (only spawn waiting and test files), so the risk to E1 is low. Options: (a) owner runs it (`! sudo …` in this session) or on the owner machine at the next landing; (b) accept the order trace for Phase A. Recommendation: (b) for Phase A, and run the device E1 at the next Git-durability change.

## Headline

1. **Per-child A1 gain is not resolvable at the E3 and suite level.** Expected: ScopedCommit about -11 ms, Land about -76 ms, suite census x 1.4 ms. Observed: port-minus-legacy deltas move by tens of ms in both directions between rounds (legacy control drifts by up to 2x between rounds), so the expected effect sits below the noise floor of every end-to-end row. The code is in (`driver.rs:1233-1262`: pidfd wake plus bounded `OVERFLOW_CHECK` step instead of `sleep(2ms)`), and the unchanged micro harness confirms the host is in the same speed state as the baseline, so a direct per-child A/B would be the only sharp proof; I did not build one (see Method, "not done").
2. **`npm test` is now green on exit code in run 1** (exit 0, 0 failing, no run-tests ERROR line); baseline runs exited 1 on a leaked temp dir every time. Run 2 failed one unrelated test (a state-lock race).
3. **E4: 26 of 26 pass on both drivers** (`bwrap-pidns` with 302 contained git children; `linux-pgroup` with 0).
4. **E1: the device part could not run** (needs root and `replay-log`); the unprivileged order trace passes with 0 violations.

## Measurements

### Suite wall time (`npm test`, `cargo test --workspace --no-fail-fast`)

Same commands as baseline: `CARGO_TARGET_DIR=~/.cache/opc-a-npm-target npm test` (release artifacts pre-built at the tip, so no compile inside the timed run) and `CARGO_TARGET_DIR=~/.cache/opc-a-cargo cargo test --workspace --no-fail-fast` (same warm directory, rebuilt incrementally by `--no-run` before timing).

| run | baseline (984e24d2c) | after (58ca24f0c) | ratio | notes |
|---|---|---|---|---|
| npm test, run A | 464.0 s, exit 1, 2 failing | **431.2 s**, exit 0, 0 failing, no ERROR line | 0.93 | |
| npm test, run B | 469.3 s, exit 1, 0 failing | **411.5 s**, exit 1, 1 failing, no ERROR line | 0.88 | failing: `test/state/hot-lock-multiprocess.test.mjs:78` "cleanup schedule: a second process cannot enter while the first cleaner holds the reclaim lock…" (`r2-in-BEFORE-r1`, a timing race in the state lock, unrelated to git containment). Exit 1 is that failure alone. |
| cargo test --workspace --no-fail-fast | 560.5 s, exit 0, 1259 passed | **588.3 s**, exit 0, 1309 passed, 0 failed | 1.05 | 50 more tests than baseline |

Not attributable to A1: the suite itself changed between the two commits (baseline 601 files / 8193 `test()` calls; after 594 files / 8068, per the run-tests summary line), and the host differed (see Method). The observed npm delta (-33 to -58 s) is far larger than the A1 estimate below (about 6 s of wall at an assumed concurrency of 24), so it must come from the other changes and from drift, not from A1. The leak-check ERROR (`fgos-direct-repo-*: 1`) of every baseline run no longer appears.

### Contained-git census of one `npm test` run (strace, same parser)

Method as baseline (`strace -f -qq -s 4096 -e trace=execve,clone,clone3,fork,vfork`, 21:26-21:44, log on `/dev/shm`). Caveat: under strace the run-tests per-file limit killed `test/runner/loop.test.mjs` and `test/runner/provider-credential-renewal.test.mjs` (600 s each), 11 tests failed, and the killed `loop.test.mjs` produced 5,486 contained children (baseline 2,033), so the totals below are shown with and without that file. The leftover `fgos-loop-test-*` temp dirs of the killed files were reported by run-tests (33 each); none remained afterwards.

| class | baseline | after | after without loop.test.mjs |
|---|---|---|---|
| contained (bwrap running git) | 92,845 | 98,089 | **92,603** (baseline without it: 90,812; +2.0%) |
| bwrap probe (one per process) | 5,171 | 5,275 | n/a |
| bwrap running something else | 4,034 | 4,170 | n/a |
| driver-direct git (borrowed) | 18,871 | 20,759 | n/a |
| plain top-level git | 79,256 | 87,815 | n/a |
| files with a contained child | 314 of 601 | 309 of 594 | n/a |
| `runner/worktree-admin-multiprocess.test.mjs` | 376 contained, 51 borrowed, 63 plain | **623** contained, 90 borrowed, 54 plain | n/a |

Top 10 after: loop.test.mjs 5,486 (strace-inflated), run-provider-failover 3,481, runner/merge 3,404, cli/fgos-merge 3,359, run.test.mjs 3,293, runner/worktree 2,896, workflow-runner 2,715, loop-rununit 2,460, cli/fgos-return 2,242, event-store/migrate 2,192. Census shows the contained count did not fall: phase A removes per-child latency, not children. R2 (worktree-admin-multiprocess) is not improved (376 to 623), as expected since A does not target it.

A1 estimate on the after census (estimate, not a measurement): 98,089 x 1.4 ms = about 137 s of summed child wait (92,603 x 1.4 = 130 s without the killed file, equal to the baseline estimate); wall effect is that sum divided by the unmeasured suite concurrency C (about 6 s at C = 24).

### Micro rows (harness unchanged, control)

Same `bench.c`, n = 300 per row, interleaved, `git rev-parse HEAD`, gated. The harness measures `posix_spawn`, bwrap, and its own 2 ms-poll versus blocking wait; it does not call the product, so these rows are a control for host drift, not a measure of A1.

| row (p50 / p95 ms) | baseline batch 1 | baseline batch 2 | after batch 1 (20:19) | after batch 2 (20:58) |
|---|---|---|---|---|
| plain | 1.60 / 3.55 | 1.82 / 3.72 | 1.61 / 3.74 | 1.65 / 3.70 |
| bwrap production argv | 4.72 / 9.76 | 5.55 / 10.68 | 5.18 / 10.33 | 4.76 / 10.04 |
| plain + 2 ms poll | 2.23 / 4.60 | 2.27 / 4.67 | 2.26 / 4.63 | 2.25 / 4.62 |
| bwrap + 2 ms poll | 6.34 / 10.82 | 6.40 / 10.87 | 6.37 / 10.87 | 6.35 / 10.82 |
| anchor child (n = 1000) | 1.57 / 4.00 | 0.86 / 2.52 | 1.18 / 3.09 | 0.74 / 0.96 |
| plain interleaved with anchor | 1.40 / 3.61 | 0.75 / 2.26 | 1.03 / 2.62 | 0.65 / 0.84 |
| anchor open / close | 2.81 / 0.40 | 1.75 / 0.24 | 2.29 / 0.30 | 1.57 / 0.20 |

Paired deltas, bwrap minus plain: baseline +3.1 / +3.7 ms; after +3.6 / +3.1 ms. Poll on a bwrap child (bwrap+poll minus bwrap): baseline +1.6 / +0.85; after +1.2 / +1.6. The host is in the same speed state as at baseline (plain 1.6-1.8 ms in both), so ratios and absolutes are comparable here. The blocking-wait rows are the harness's own and unchanged by A1; the product-side effect is in the E3 rows below.

Paired fsync probe: the per-batch probe in the master script ran on `/dev/shm` by mistake and printed 0.00 ms, so it is void. Probes on ext4 (`~/.cache`), run after the batches: 7.77 / 8.12 and 7.79 / 8.03 (p50 / p95, `fs 100`), i.e. the slow mode of this NVMe at that moment; E3's own fsync probe (which is on ext4 and is the one that classifies push rows) read fast in all after-rounds (5.26 to 5.38 ms) and fast in baseline round 1, slow in baseline round 2. No micro row writes, so fsync does not enter them.

### `environment_marked` cost (a)

Scratch crate outside the repo (`/dev/shm/opc-p05/envmark`, depends on the worktree's `fgos-process` by path, release build, `CARGO_TARGET_DIR=~/.cache/opc-p05-envmark`): 50 calls of `fgos_process::containment::environment_marked("FGOS_P05_NO_SUCH_MARK","x")` (no match, so it reads every `/proc/<pid>/environ`), 512 processes on the host: **p50 2.31 ms, p95 3.69 ms** (second run p50 2.30, p95 4.59, min 2.27). About 4.5 µs per process.

## E3

`node scripts/git/e3-bench.mjs run`, two rounds, same options as baseline (typed samples 30, push n = 100), artifacts at the tip in `~/.cache/opc-a-npm-target/release`, roots on ext4 under `~/.cache/opc-p05-e3`. Round 1 20:20-20:38, round 2 21:06-21:25. All four after-rounds' fsync class fast (5.26/5.38 and 5.29/5.36).

| row (p50 / p95 ms) | baseline r1 | baseline r2 | after r1 | after r2 |
|---|---|---|---|---|
| ScopedCommit legacy (control) | 89.1 / 234.2 | 219.6 / 266.4 | 84.3 / 112.4 | 95.4 / 106.7 |
| ScopedCommit port | 303.3 / 467.8 | 371.3 / 391.7 | 324.2 / 394.5 | 336.0 / 351.4 |
| port minus legacy (p50) | +214.2 | +151.7 | +239.9 | +240.6 |
| Land legacy (control) | 920.9 / 1696.4 | 1549.3 / 1634.7 | 1223.8 / 1404.2 | 1410.1 / 1503.4 |
| Land port | 816.8 / 1295.1 | 1206.2 / 1261.0 | 1021.2 / 1119.0 | 1146.2 / 1191.1 |
| Land prepare / publish (port, p50) | 530.2 / 294.2 | n/a | 648.4 / 347.3 | 719.6 / 430.3 |
| port minus legacy (p50) | -104.1 | -343.1 | -202.6 | -263.9 |
| port / legacy (Land p50) | 0.887 | 0.779 | 0.834 | 0.813 |
| push with objects (p50 / p95) | 169.4 / 300.9 | 308.7 / 331.0 | 254.2 / 271.1 | 256.9 / 270.4 |
| push without objects (p50 / p95) | 162.7 / 277.1 | 304.0 / 325.6 | 248.8 / 270.1 | 251.6 / 267.8 |
| push verdict | failed (fast) | not judged (slow) | failed (fast) | failed (fast) |

Reading (ratios and interleaved deltas, not absolutes):
- ScopedCommit: expected port-minus-legacy -11 ms; observed +26 / +89 ms worse than the baseline rounds. The legacy control's own baseline p50 jumped 89 to 220 ms between baseline rounds, so a 10 ms effect cannot be seen; no improvement is demonstrated.
- Land: expected -76 ms on the port rows; port-minus-legacy goes from -104/-343 to -203/-264, mean -224 vs -234 (no change). Port/legacy 0.887/0.779 to 0.834/0.813 (mean 0.833 in both). The same flat result as ScopedCommit.
- Push: after rounds are judgeable (fast fsync) and fail the budgets (p95 about 270 ms against 250 with objects, against 150 without), where baseline round 1 failed too (300.9 / 277.1). The after p95s are 10% lower than baseline round 1 (271 vs 301; 270 vs 277), within round-to-round variation.
- Absolute levels (ScopedCommit port 324-336 ms, Land port 1.0-1.1 s, push p95 270 ms) are still 2-3x the clean rerun of 22 October 00:05 (186 ms, about 0.5 s, 146 ms), the same slow state the baseline reported; none of these rows is a pass/fail verdict. Round-1 baseline started while HARDEN was winding down; after round 1 overlapped a short `cargo test` from another session (`work-es-target`, observed at 20:29) and a 28% `node --test` before it; round 2 ran with no other process above 5% CPU at its gates.

## E1

Requested: rerun of Publication and ScopedCommit per `verification-261021-2336-git-e1-publication-and-scoped-commit.md`.

**Blocked, exact causes** (the device part `scripts/git/e1-power-cut.sh` is root-only):
1. `sudo -n true` answers "interactive authentication is required": no passwordless root here, so no loop device, `dmsetup`, mount or `unshare --mount` (the script re-execs itself under root in a private mount namespace; unprivileged `unshare -r` also fails: "write failed /proc/self/uid_map: Operation not permitted").
2. xfstests' `replay-log` is not installed (`which replay-log` empty; `--replay-log` would also be needed).
3. Present but unusable without root: `dm_log_writes` and `dm_snapshot` are loaded, `/dev/loop-control` exists, `dmsetup` and `losetup` are installed; no `/var/tmp/fgos-e1` work dir from an earlier run on this machine.

**What I ran instead (no root):** the unprivileged half of the same script, `node scripts/git/e1-power-cut.mjs trace --root <fresh ext4 dir> --kind <kind> --addon <tip addon> --host <tip fgos>` (strace of fgos-git's own syscalls, checked against the section 10 order rules, including the rules added after the earlier E1 findings). Filesystem reported `ext4`.

| Kind | records | fsyncs | ref renames | order violations |
|---|---|---|---|---|
| Publication | 48 | 387 | 28 | **0** |
| ScopedCommit | 48 | 454 | 17 | **0** |

ScopedCommit's 454 fsyncs equals the 454 in the earlier power-cut report. Publication's 387 differs from that report's 880 because the trace mode and the device run use different operation plans; I did not reconcile them. This is order evidence only: it is not a power-cut replay, so the "held" verdict of the earlier E1 is neither reproduced nor refuted. Someone with sudo and `replay-log` on the second machine must run `sudo env "PATH=$PATH" scripts/git/e1-power-cut.sh --work /var/tmp/fgos-e1 --replay-log <replay-log> --user vantt` at the tip.

## E4

`test/git/scoped-commit.test.mjs` through `node --test` with `FGOS_HOST_BIN=$HOME/.cache/opc-a-npm-target/release/fgos` (host built from the worktree) and `CARGO_TARGET_DIR` set (the test's `ensureGitAddon` stages the addon). Both runs under `strace -f -e trace=execve` to prove which driver ran.

| driver | how selected | tests | pass | fail | skipped | proof |
|---|---|---|---|---|---|---|
| `bwrap-pidns` | unconfined shell of this host (bwrap 0.11.1 works) | 26 | **26** | 0 | 0 | 302 `bwrap … -- /usr/bin/git` execs, 2 probe execs |
| `linux-pgroup` | the same test run inside an outer `bwrap --dev-bind / / --proc /proc --`, so the inner bwrap cannot build a namespace (nested bwrap fails on this host: "No permissions to create a new namespace") and the probe falls back | 26 | **26** | 0 | 0 | 0 bwrap-wrapped git execs, 2 failed probe attempts |

The E4 test "ScopedCommit never reports plain success while a setsid hook child without the borrowed descriptor survives" passes on both (on pgroup it reports `containment-unproven` or drains the child; both outcomes are accepted by its assertion). No env switch exists to force a driver; the outer-bwrap method uses only the host's behaviour and is what a confined session sees (Git spec section 15 E4 note).

## Method

Commands and scripts: `/dev/shm/opc-p05/master.sh` (sequence: micro 1, E3 round 1, npm A, cargo no-fail-fast, micro 2, npm B, E3 round 2, census), `warm.sh`, `census-parse.py` (copy of the baseline parser, path changed), `e4.sh`, `envmark/`; the harness is the baseline's `.fgos/runtime/tmp/opc-a/{bench,fs,anchor}` unchanged. All logs and outputs on `/dev/shm/opc-p05/` (volatile; none written under the repo's `.fgos`; E3 stages its temporary addon under `.fgos/runtime/e3-bench`, removed at exit, as in the baseline). `PATH` included `$HOME/.cargo/bin`.

Gate before every timed step: no `cargo (test|build)`, `rustc`, `run-tests.mjs` or `e3-bench` process (pgrep) and load1 < 2, up to 60 minutes. Gate readings (load1): micro 1 1.95, E3 r1 1.93, npm A 1.88, cargo 1.99, micro 2 0.91, npm B 0.93, E3 r2 1.98, census 1.87. Values just under 2 are residue of my own preceding run. The gate does not see the per-file `node --test` children of another session's run (they carry no `run-tests` in argv): a 28% `node --test` and, at 20:29 during E3 round 1, another session's `cargo test` (`work-es-target/debug/deps/safe_restore`) were observed; nothing else above 5% CPU at later gates. HARDEN and TEST were declared quiet by the lead before the start, though early load readings (49 at 20:07) came from other worktrees' `fgos` and `run-tests` activity, which the gate waited out until 20:19:52.

Sample counts: micro n = 300 per row (anchor child 1000, open/close 100), 2 batches; npm 2 runs; cargo 1 run; E3 2 rounds (typed 30, push 100); census 1 run; envmark 50 calls x 2; E4 1 run per driver.

Not done: (1) a direct per-child A/B of the base and tip addons (the only way to see A1's roughly 1.4 ms per child below E3 noise); I did not build the base addon from `984e24d2c` in a second worktree within the time box. (2) The E1 device run (blocked, above). (3) The fsync-paired micro probe on ext4 inside each batch (the in-script probe was on tmpfs and is void).

Cleanup: no process of mine left running; census strace log (about 0.6 GB) and other logs remain on `/dev/shm/opc-p05/` for the lead; cargo targets reused under `~/.cache/opc-a-*`, scratch targets `~/.cache/opc-p05-*`.

```text
Status: DONE_WITH_CONCERNS
Summary: After-measurements at 58ca24f0c recorded: npm test 431/412 s (baseline 464/469), cargo no-fail-fast green, E4 26/26 on both bwrap-pidns and linux-pgroup, environment_marked 2.3 ms, order trace clean; the per-child A1 gain is below the noise of the E3 and suite rows and is not demonstrated end to end.
Concerns/Blockers: E1 power-cut run blocked (no passwordless sudo, no replay-log), only the unprivileged order trace passed; E3 absolutes are still 2-3x the clean rerun and ScopedCommit/Land port-minus-legacy deltas show no improvement; the strace census run hit two per-file timeouts (loop.test.mjs inflated); npm run B had one unrelated state-lock race failure.
```

## Key numbers

| item | baseline | after |
|---|---|---|
| npm test wall | 464.0 s, 469.3 s | 431.2 s (exit 0), 411.5 s (1 unrelated failing test) |
| cargo test --workspace --no-fail-fast | 560.5 s, 1259 passed | 588.3 s, 1309 passed, 0 failed |
| contained git children per suite run | 92,845 | 98,089 (92,603 without the strace-killed loop.test.mjs) |
| worktree-admin-multiprocess contained | 376 | 623 |
| micro bwrap minus plain (p50) | +3.1 / +3.7 ms | +3.6 / +3.1 ms (control, host state unchanged) |
| E3 ScopedCommit port-minus-legacy p50 | +214 / +152 ms | +240 / +241 ms (expected -11) |
| E3 Land port-minus-legacy p50 | -104 / -343 ms | -203 / -264 ms (expected -76) |
| E3 push p95 with / without objects | 301 / 277 ms (r1), 331 / 326 (r2, slow fsync) | 271 / 270, 270 / 268 ms (fsync fast) |
| environment_marked | n/a | p50 2.31 ms, p95 3.69 ms (512 procs) |
| E4 scoped-commit.test.mjs | n/a | 26/26 on bwrap-pidns (302 contained) and on linux-pgroup (0 contained) |
| E1 order trace (no root) | held (device run, 880 / 454 fsyncs) | 0 violations, 387 / 454 fsyncs; device run blocked |
