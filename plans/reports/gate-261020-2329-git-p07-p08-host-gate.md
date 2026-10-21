# Gate: host gate for Git phases 07+08 (branch git/p07-switch @ 876ea737f)

Times are +07 (Asia/Saigon offset). The host has no `Asia/Saigon` zoneinfo, so `TZ=Asia/Saigon` falls back to UTC; the host clock is +07. Runs: branch and main suites 2026-10-20 23:30 to 2026-10-21 00:02; E3 2026-10-21 00:09 to 00:33.

Baseline: origin/main = d59fca840 (fetched). Branch 876ea737f contains fe6992580 (the earlier main merge) but NOT current origin/main (40 commits ahead, 11 behind). Trees: detached `/var/tmp/fgos-p07gate-br` (876ea737f) and `/var/tmp/fgos-p07gate-main` (d59fca840). Private `FGOS_STATE_ROOT` and `FGOS_TEST_FIXTURE_ROOT` per tree, mode 700, on ext4. Logs: `/home/vantt/.claude/jobs/e1505f04/tmp/p07-gate/logs/`. Umask was 002 for the whole run (see E-a).

## Results overview

| Check | Branch 876ea737f | Main d59fca840 | Verdict |
|---|---|---|---|
| `cargo test --workspace --no-fail-fast` | 1213 pass / 1 fail / 11 ignored (fail: `fgctl git_wal_activation_gate`) | 1192 pass / 1 fail / 11 ignored (fail: `fgos-process spawn_mapped`, ETXTBSY) | both env/flake, see E-a, E-b |
| `cargo clippy --workspace --all-targets -D warnings` | rc 0, clean | not run | PASS |
| `npm test` | 8753 tests: 8316 pass, **340 fail**, 32 skip, 65 todo; rc 13; run aborted at spy check; **no `suite:` line** | 8732 tests: 8634 pass, 1 fail (flake), rc 1; `suite: 573 files, 8049 test() calls, 349 s wall` | **RED** |
| Doctor `checkMutationOneDoor` | `passed: true` (827 files) | n/a | PASS |
| `scripts/git-one-door-scan.mjs` | 0 undeclared sites | n/a | PASS (static), but spy finds a runtime site, see R5 |
| Host node tests (3 files, direct run) | 10/18 pass with FGOS_HOST_BIN; 1/20 without | n/a | not npm-equivalent, see E-d |
| `internal_lock_routes` | pass | n/a | PASS |
| `containment_bwrap` | pass | n/a | PASS |
| `test/git/scoped-commit.test.mjs` | 25/26; **deterministic fail** (3 of 3 runs) | test absent on main | **RED** (R4) |
| P-RELEASE (`--skip-assets`) | PASS 3, FAIL 3, SKIP 1 | n/a | **RED** (R7, E-a, E-d) |
| E3 A/B | **no rows**: both branch runs exit 1 at `land-legacy` | 2 runs complete | **NOT MEASURED** (R3) |

npm test classification by test title (C-locale diff of failing titles): **340 branch-only, 0 shared**. The one main-only title (`fast path: uncontended acquire and release ... 10%`, ratio 1.123) passed on the branch (193 ms). Shared count is 0.

Containment driver: not confirmed (see unresolved Q3). Host has `/usr/bin/bwrap` and unprivileged user namespaces enabled, so bwrap is available.

## Regressions (branch-only)

- **R1, `.so` loaded as a module (71 npm failures plus host and P-RELEASE). Root cause confirmed.** `scripts/build-rust-distribution.mjs:370` builds its pre-stage descriptor from `basename(addonLibrary)` = `libfgos_node_addon.so`. `src/git/native.mjs:68` then calls `require()` on it. Node parses an unknown extension as JS, so this fails with `SyntaxError: Invalid or unexpected token`, wrapped as `git-addon-unavailable: Invalid or unexpected token`. Verified with a direct `require` of the built `.so`. Failing test: `placeFences tombstones the three old paths, install once for the machine, and a second run changes nothing` (`test/holder-lock/fences-rust-locks.test.mjs:69`). Main passes it (`✔`). The staged name is `libexec/native/fgos.node` (line 395), so the pre-stage descriptor is inconsistent with it.
- **R2, numeric PID passed where the napi addon expects `String` (about 135 npm failures). Origin not isolated.** Message: `Failed to convert JavaScript value 'Number 2483467 ' into rust type 'String'`. Example: `e2e pr-gate (a) runner item full loop: add -> runner dispatch -> awaiting-approval ...` (`test/e2e/pr-gate.test.mjs:243`), `--once failed ... fgos-runner: Failed to convert JavaScript value 'Number 2483467 '...`. The number equals the host Claude process PID in my session, which suggests the process-ancestry path (`ownPidChain`, `src/holder-lock/fences.mjs:424`). The JS call site and the Rust napi signature were not traced. Also 8 `Undefined` variants.
- **R3, the baseline Land path needs a shipped addon.** Branch E3 `land-legacy` fails with `git-addon-unavailable: addon not shipped on this channel until M10` through `src/runner/merge.mjs:1128` (`landRunnerItem`) -> `src/runner/worktree.mjs:397` (`detectTrunk`) -> `src/git/inspect.mjs:12` -> `src/git/native.mjs:40`. In a dev checkout there is no release payload descriptor, so the runner merge path cannot run. Main's legacy path runs. Blocks E3 on the branch; likely a major contributor to the npm failures.
- **R4, ScopedCommit escapee containment.** `test/git/scoped-commit.test.mjs:113`: `ScopedCommit never reports plain success while a setsid hook child without the borrowed descriptor survives`. Message: `escapee 214092 is S and the operation reported {"status":"committed", ...}`. Reproduced 3 of 3 (npm, direct, rerun). New branch test (absent on main).
- **R5, raw product `git commit` spawn caught by the spy.** npm exits rc 13 with `product code started git or a hook outside the fgos-git driver: src/holder-lock/index.mjs:552: git ... commit -q -m land (19x)` and `:570 ... -m orphaned (2x)`. The static one-door scan reports 0 sites, so it misses this path (generic holder-lock spawn with a git argv from callers). Because the spy aborted run-tests, the suite line is missing.
- **R6, file timeout.** `test/run-supervisor/crash-matrix-adopt-resume.test.mjs` killed at 603 s (limit 600 s). Main finishes the whole suite in 378 s. Cause not isolated. Also leftover temp trees on the branch run (`fgos-cm-*` 9, `fgos-direct-repo-*` 14, `fgos-direct-state-*` 14, `fgos-direct-tmp-*` 14, `fgos-tp-*` 1).
- **R7, P-RELEASE script defect.** `scripts/git/p-release-checks.sh:43` runs `e3-bench.mjs rollback --root "$WORK/rollback"` without `--addon` and `--fgctl`, so the path becomes `.../undefined` (ENOENT). Rollback row not run. Script is branch-only.
- **R8, `c5-node-doctor-rows`** (P-RELEASE) and the other direct host runs: fails as `addon not shipped` when run outside npm. Under npm the same test `an unused controller fence does not turn a channel without activation red` passes (`✔`). Environmental invocation, see E-d.

Other branch npm failures (not individually classified, 33 `Expected values to be strictly equal` plus `timed out waiting for the brief typed at the pane` x4, `git worktree add failed` x3, `--once should still exit 0 for a parked item` x3): downstream of R1-R3 or host state, unproven.

## Environmental (not regressions)

- **E-a, umask 002.** `fgctl git_wal_activation_gate` (`addon_admission_names_missing_payload_or_capability_and_preserves_activation`): `untrusted-driver-directory ... mode 0775`. Test creates `/tmp/fgctl-addon-m10-*` with the process umask. Passes under `umask 022` (rerun rc 0). P-RELEASE `c5-fgctl-wal-gate` is the same test.
- **E-b, flake.** Main `spawn_mapped::path_lookup_skips_directories...`: `spawn: Text file busy` (ETXTBSY). Passes on rerun.
- **E-c, flake.** Main `hot-lock-multiprocess` fast-path ratio 1.123 vs 1.10. Branch run passed at 193 ms. Matches the known flake in the earlier gate report.
- **E-d, invocation.** Direct `node --test` runs lack npm's `FGOS_HOST_BIN` (npm sets it from its ensured host). With `target/release/fgos` set: holder-lock 8/18 fail; git-checks 1/10 fail (`addon not shipped`). Not npm-equivalent; npm result is the authority.
- **E-e, host state.** `worktree-cwd-unreadable` warnings for host processes (systemd, ssh-agent, MainThread).

## Performance (E3)

Branch: no rows (R3). Main only, 2 runs, 200 samples each, host `powersave`, load 1.6-6.3, raw `git` spawn about 3.2-3.3 ms.

| Row (budget) | main-1 | main-2 | Verdict on main |
|---|---|---|---|
| Land port p95 (<=1.6 s absolute) | 554 ms (p50 522) | 1270 ms (p50 1170) | PASS both; run 2 near limit |
| ScopedCommit port/legacy p95 ratio (<=1.5) | 2.11 (legacy 86.9, port 183.6) | 1.53 (legacy 255.5, port 390.4) | FAIL both (ratio read as port/legacy within each tree) |
| CAS changing p95/p99 (<=150/<=250) | 117 / 120 | 184 / 189 | PASS |
| CAS no-op p95 (<=15) | 2.6 | 11.4 | PASS |
| writeBlob new p95 (<=15) | 12.5 | 18.5 | PASS / FAIL (run 2) |
| writeBlob existing p95 (<=10) | 1.4 | 5.9 | PASS |
| Push, one ref, no objects p95 (<=150) | 269 | 265 | **FAIL both** |
| Push, one ref, with objects p95 (<=250) | 280 | 269 | **FAIL both** |
| Addon first call p95 (<=30 ms) | 8.6 | 8.5 | PASS |
| WAL per op (<=32 KiB, <=12 inodes) | 4123 B, 1 inode | same | PASS |
| Backlog scan 10,000 records (<=300 ms, complete) | 184 ms, complete | 182 ms, complete | PASS (3-record variant 302-311 ms, informational) |
| Reconciliation 100 (<=10 s) | 8.5 s (25 still pending) | 8.2 s (25 pending) | PASS on time; pending count noted |
| Rollback with live processes (zero lost) | 0 lost, tip ok | 0 lost, tip ok | PASS (main only) |

Verdict: E3 **NOT MEASURED** on the branch. Main itself breaches the push budgets in both runs and the ScopedCommit ratio in both. Governor was `powersave`, so the owner's measurement condition is not met. Spawn-bound rows (push, writeBlob new) need a rerun under a stable governor before any verdict. Legacy timings differ 3x between main runs (ScopedCommit legacy p50 71 vs 222 ms), so noise is large.

## Build and doctor

- Clippy: clean (rc 0).
- Doctor `checkMutationOneDoor`: `{"passed":true,"message":"no Git writer outside the fgos-git driver (827 files scanned, payload digest d694974f6219)"}`.
- Cargo totals above; the branch run had 0 build failures.

## Critical issues

1. R1 and R3: the branch's native loader path is broken for dev checkouts and for the distribution build. This blocks E3 and produces most of the npm red.
2. R2: numeric PID in a napi `String` argument. Origin unconfirmed.
3. R4 and R5: the containment proof is red, and the one-door dynamic spy finds a product git spawn that the static scan misses.

## Recommendations

1. Pass the staged `.node` name (not the cdylib basename) into `nativeAddonComponent` at `build-rust-distribution.mjs:370`, or stage before the inspect call. Add a regression test that the descriptor loads.
2. Trace the PID -> napi `String` conversion (JS call site plus Rust signature) and add a test that exercises it on a real host pid.
3. Investigate the R4 escapee case under both containment drivers; confirm the driver selected on this host.
4. Route the `src/holder-lock/index.mjs:552/570` git spawns through the typed port, or classify them, then make the static scan see generic borrow argv.
5. Give the runner merge path a dev-checkout route (or a staged-release fixture) so E3 `land-legacy` can run on the branch.
6. Fix `p-release-checks.sh:43` to pass `--addon` and `--fgctl`.
7. Rerun E3 with the `performance` governor (or busy cores) on the branch and main, with the same load.

## Status

Status: BLOCKED

GO/NO-GO: **NO-GO** for merging git/p07-switch to main and for landing. Reasons: 340 branch-only npm failures, R4 red, R5 spy violation, E3 unmeasured on the branch, P-RELEASE 3 FAIL.

Regressions (summary): R1 `placeFences tombstones the three old paths...` (`test/holder-lock/fences-rust-locks.test.mjs:69`) fails with `git-addon-unavailable: Invalid or unexpected token` from `require()` of the `.so` in `build-rust-distribution.mjs:370`, which also drives 71 npm failures; R2 about 135 npm failures from `Failed to convert JavaScript value 'Number 2483467 ' into rust type 'String'` (e.g. `e2e pr-gate (a) runner item full loop ...`); R3 E3 `land-legacy` fails with `git-addon-unavailable: addon not shipped on this channel until M10` (`src/runner/worktree.mjs:397`); R4 `ScopedCommit never reports plain success while a setsid hook child without the borrowed descriptor survives` (`test/git/scoped-commit.test.mjs:113`) fails with `escapee ... is S and the operation reported status committed` (3 of 3 runs); R5 spy rc 13: product `git commit` at `src/holder-lock/index.mjs:552` (19x) and `:570` (2x); R6 `crash-matrix-adopt-resume.test.mjs` killed at 603 s; R7 P-RELEASE `live-process-rollback` (`p-release-checks.sh:43`) runs without `--addon`/`--fgctl`. Environmental and flaky, not counted: E-a fgctl umask (passes at 022), E-b and E-c main-only flakes.

## Unresolved questions

1. Origin of the numeric PID passed as a napi `String` (R2): which JS call and which Rust signature. Not traced.
2. Does main also contain the holder-lock spawn sites the spy flags (R5)? Main has no spy, so this is unverified.
3. Which containment driver (`linux-pgroup` or `bwrap-pidns`) this host selects for the R4 test. bwrap and userns are available; selection not confirmed.
4. The 33 `Expected values to be strictly equal` failures and the others not classified: downstream of R1-R3, or independent?
5. Push budgets breached on main (p95 265-280 ms vs 150/250) under `powersave`: owner decision whether it is a host-condition artifact or a real budget breach.
6. Branch is 11 commits behind origin/main (d59fca840); the gate ran on the requested baseline, not on a merged tree.
7. Not run: P-RELEASE asset build and external-consumer install (`--skip-assets`), and the stale-npm protocol check (no `--stale-fgos`).
