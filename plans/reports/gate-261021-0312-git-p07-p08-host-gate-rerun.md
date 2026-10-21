# Gate: host gate rerun for Git phases 07+08 (branch git/p07-switch @ 79e04c570)

Times Asia/Saigon (+07). Input: [previous gate](gate-261020-2329-git-p07-p08-host-gate.md) (876ea737f, NO-GO) and [u25 fixes](phase-lead-261021-0045-git-p07-u25-host-gate-fixes.md). Logs: `/home/vantt/.claude/jobs/e1505f04/tmp/p07-gate2/logs/`.

Baselines: branch `79e04c570` (detached `/var/tmp/fgos-p07gate2-br`). origin/main `68ded3a0a` (fetched; detached `/var/tmp/fgos-p07gate2-main`). The branch is **45 commits behind origin/main and does not contain it**, so this gate tests the pre-merge tree, not the merge result. Trees and private state/fixture roots removed at the end; no processes left.

Environment: host governor `powersave`, load 0.95-1.9 at start, 5.6 after the E3 smoke. Umask 002 for the main runs, 022 for the rerun checks. `bwrap-pidns` selected: the driver probe `/usr/bin/bwrap --unshare-user --unshare-pid --as-pid-1 --dev-bind / / --proc /proc -- /bin/true` returns 0 here, the same condition `pidns_usable()` checks.

## Results overview

| Check | Branch 79e04c570 | Main 68ded3a0a | Verdict |
|---|---|---|---|
| `npm test` (full) | 8763 tests: 8575 pass, **91 fail**, 32 skip, 65 todo. rc 13: unsettled TLA at `scripts/run-tests.mjs:681`, no `suite:` line (see Q1) | 8734 tests: 8635 pass, 2 fail, 32 skip, 65 todo. rc 1. `suite: 573 files, 8051 calls, 379 s` | **RED** |
| Failures classified | 91 branch-only (in 34 files); shared 0; flakes 0 at file level | 2 main-only, both flakes, pass solo (see below) | branch-only |
| Solo rerun, every failing file (34) + u25 host-gate list (61 files total), npm env | 34/34 failing files still fail alone (0 flaky). Solo failing count 91 = full-run count | n/a | deterministic |
| `cargo test --workspace --locked` | rc 101: 2 failures (see below) | not run | 1 umask (E-a), 1 flaky |
| `cargo clippy --workspace --all-targets -D warnings` | rc 0 | not run | PASS |
| `scripts/git-one-door-scan.mjs` | 0 undeclared sites; `configured-binary` 100 | n/a | PASS |
| doctor `git-mutation-one-door` (`checkMutationOneDoor`) | passed, 928 files | n/a | PASS (called directly, not via `fgos doctor`) |
| `test/git/scoped-commit.test.mjs` (R4) | 26/26 full run and solo | absent | **PASS** |
| `crash-matrix-adopt-resume` (R6) | solo: killed at 601 s (limit 600 s); 15 of 30 rows reported | solo: 119 s, 30/30 | **RED** |
| `test/setup/doctor-fresh-run.test.mjs` (expected red) | fails: `fgos init failed: fgos: git-addon-unavailable: addon not shipped on this channel until M10` | passes (solo and full) | red as expected |
| P-RELEASE `--skip-assets`, umask 002 | rc 1: PASS c5-git-gate, c5-activation-locks, c5-node-doctor-rows, v-pack-native-load, live-process-rollback; FAIL c5-fgctl-wal-gate; SKIP stale-npm | n/a | FAIL (E-a) |
| P-RELEASE `--skip-assets`, umask 022 | rc 0: all six PASS, stale-npm SKIP | n/a | **PASS** |
| E3 bench smoke (`run --samples 5`) | rc 0, all 15 rows produced data | n/a | ran; **not measurement** |

## Branch-only failures: cause

Classified by first error text, then by solo rerun (per-file solo counts sum to 91). Cause evidence per cluster:

| # | Cluster | Failing tests (solo) | Cause and evidence |
|---|---|---|---|
| A | **Dev manifest env reaches the host** (regression, R1b, not fixed) | 40 in 8 files: `fgctl-upgrade` 16, `fgctl-init` 6, `fgctl-init-download` 4, `fgctl-init-download-sources` 4, `fgctl-init-preflight-tail` 4, `fgctl-init-activation` 3, `fences-rust-locks` 2, `fences-stop-check` 1 | `scripts/run-tests.mjs:89` and `scripts/git-addon.mjs:17` export `FGOS_ACTIVE_MANIFEST_PATH` (dev shape: `entries`, `components`, `sourceDigest`, no `entry`). `apps/fgos/src/legacy_exec.rs:103` reads it on the legacy route, so `fgos init` fails with `failed to parse manifest ... missing field 'entry'`. **Reproduced** by hand with the staged host and both env vars. **Diagnostic** (manifest var unset after `ensureGitAddon`, not a gate verdict): `fgctl-upgrade` 18/18, `fgctl-init` 8/8, `fgctl-init-preflight-tail` 6/6, `fgctl-init-download-sources` 4/4 pass. Main does not export the variable. Trade-off: unsetting it makes the Node addon loader refuse (`fences-rust-locks` 4/4 then fails `addon not shipped`), so the two readers need one contract (see Q2). |
| B | **Fixture drift: no activation fence** | 14: `spawn-worker` 10, `run-case-admission` 2, `driver-rununit` 1, `work-path-case-admission` 1 | Errors `git-fence-missing` in the runner commit. Grep: the four files never call `activateGitFixture` (u25 added it to other files only). Test-side. |
| C | **Addon not shipped to a child or channel** (u25 decision pending, M10) | 6: `identity-before-lock` 3, `install-packaging` 1, `git-checks` 1, `doctor-fresh-run` 1 | `git-addon-unavailable: addon not shipped on this channel until M10`. `identity-before-lock` fails inside a child eval (`StoreError` from `worktree.mjs:409`) that has no addon manifest env. `doctor-fresh-run` is the expected red; main passes it solo and in full. |
| D | **Herdr pane / attempt-directory waits** | 13: `terminal-fallback` 4, `terminal-cutover` 3, `terminal-crash-matrix` 2, `resume-adopts` 2, `direct-crash-matrix` 1, `crash-matrix-adopt-resume` 1 | `timed out ... waiting for the brief typed at the pane` / `attempt directory` (120 s). A refused run never creates the attempt directory. Refusal reason not captured (test output hides child stderr). **Not isolated.** Main passes all of these. |
| F | **Host protocol 2 refused** | 3: `run-supervisor-checks` | `refused protocol 2 (host-version-mismatch)`. Not isolated; likely host and addon build skew in the checked env. |
| E | Other, not isolated | 15: `loop-rununit` 3, `domain-aware-stage-literals` 2, `harness` 2, `run-verb` 1, `runner-loop` 1, `dispatch-confinement-backend-p03` 1, `check-decision-citation-drift` 1, `active-release-drift-check` 1; spy/one-door asserts `event-store door` 1, `e2e-consumer-noncoding` 1, `runtime-coordination` 1 | Assertions on runner dispatch, spawn counts and drift baselines. Fail solo too. Owners need per-test traces; `harness` `HIGH-2` spy test records 21 git calls for one `node:` entry. |

Totals: A 40, B 14, C 6, D 13, F 3, E 15 = 91.

## Other branch cargo failures

- `apps/fgctl/tests/git_wal_activation_gate.rs` (`addon_admission_names_missing_payload_or_capability_and_preserves_activation`): `untrusted-driver-directory ... mode 0775` under umask 002 (E-a, same as the previous gate). Passes under umask 022 (P-RELEASE `c5-fgctl-wal-gate` PASS in the 022 run, same test).
- `packages/distribution` `store::tests::test_lock_exclusive_and_release` (`lock3.is_ok()`): failed once in the full cargo run. Passes alone under umask 002 and 022, and 10/10 reruns under 002. **Flaky, cause not isolated.** Test uses `/tmp/fgos_test_lock_<pid>`.

## Items from the brief

1. Trees: created and removed as above. No commits, no checkout in the main checkout or `.claude/worktrees/git-p07`. `git worktree list` shows the git-p07 entry unchanged.
2. Branch `npm test` run in full. Main run after, sequential. Failure classification and solo reruns as tabled above. Main's two failures: `a real zombie is dead to the judge` (`test/process/process-facts-vectors.test.mjs`, `absent` instead of zombie within the timeout) and the `hot-lock fast path` ratio (`test/state/hot-lock-multiprocess.test.mjs`, the known E-c flake). Both pass solo on main (36/36 and 5/5).
3. `cargo test --workspace --locked`: see above. `clippy --all-targets -D warnings`: rc 0. One-door scan: 0 sites. Doctor row: passed.
   - R4 `scoped-commit.test.mjs`: passes 26/26 (full and solo) on `bwrap-pidns`. The previous gate's 3/3 failure does not reproduce on this host.
   - R5 spy: no product git or hook spawn reported by the spy in the full run. The `HIGH-2` spy-count test is a separate branch-only failure (cluster E).
   - R6 `crash-matrix-adopt-resume`: reproduced. Solo 601.6 s, killed by the watchdog at 600 s. Only 15 of 30 rows reported: the first terminal row waits 120 s for an attempt directory, and the rows after it never ran. Main: 119 s, 30/30 pass. A diagnostic with the manifest variable unset was confounded: still 120 s on the first row, another row 480 s, file killed at 602 s. Cause not isolated.
   - Confined-worker and herdr files from the u25 list: `run/run-sync`, `workflow/*` (confined-nested-write, playbook-proposer, stale-approval, units-runner), `runner/operation-choice`, `runner/fanout-batch`, herdr-* (agent, claude-invocations, private-home-trust, provider-invocations, spawn-adapter) pass solo. Failing ones are in clusters B, D and E above. `e2e/pr-gate` passes solo.
   - `doctor-fresh-run`: exact message above. Main passes it.
4. P-RELEASE: umask 002 fails only `c5-fgctl-wal-gate` (E-a). Umask 022 passes all six non-skipped rows, rc 0. `live-process-rollback`: 74 live-writer receipts, 0 lost or mismatched, tip matches last receipt, WAL scan complete with 0 errors; the unproven live payload is refused with `git-predecessor-writer-live`.
5. E3 smoke only: `node scripts/git/e3-bench.mjs run --samples 5` on branch, rc 0. All rows produced data: scopedCommit, land, addonLoad, nodeLoanScopedCommit (+AgedFloor), rawSpawnBaseline, writeBlob, compareAndSwap (+RetentionGrowth), walAmplification (+AfterRustCompaction), rustPortInProcess, push, subprocessCensus, backlog-intent, backlog-attempt, reconciliation, rollbackWithLiveProcesses. Governor `powersave` (load 1.8-2.0 at start, 5.6 at end). **Numbers are not budget evidence.** Four rows show `errors:0` / `complete:true` only (no errors).

## Critical issues

1. **Cluster A (40 tests).** The dev manifest env is exported into every test and read by the host legacy route. This is R1b, which u25 left as a host-side question in `apps/fgos` (outside its scope). Blocks the branch.
2. **Cluster B (14 tests).** Four runner test files never activate the git fence. Test-side fix.
3. **Cluster D (13 tests) and R6.** Herdr-pane and attempt-directory waits (120 s each) push `crash-matrix-adopt-resume` past its 600 s limit. Cause not isolated.
4. **Suite exit 13 with no suite report** on the branch run. Not reproduced in isolation (see Q1).
5. Branch is 45 commits behind origin/main; any merge needs a fresh gate on the merged tree.

## Recommendations

1. Pick one contract for the dev addon manifest: either the host accepts the dev shape (`entries`, no `entry`), or the dev manifest gains `entry`. Do not export the variable to the legacy host route until it parses (decision for the owner; see Q2).
2. Add `activateGitFixture` to `test/runner/spawn-worker`, `run-case-admission`, `driver-rununit`, `work-path-case-admission`.
3. Capture the refused run's stderr in the terminal crash-matrix fixture (keep the fixture root on failure) and find why the attempt directory never appears.
4. Make `run-tests.mjs` print the suite report even when the import is slow, or await the report import earlier, so an unsettled TLA cannot end the run silently.
5. Rerun the full branch suite after merging origin/main (`68ded3a0a`), then this gate's cluster list again.
6. Fix `apps/fgctl/tests/git_wal_activation_gate.rs` to create its state dir at 0700 (E-a), and check the `store.rs` lock test for its `/tmp` pid-path race.

## Verdict

**NO-GO** for merging `git/p07-switch` to main and for landing.

Reasons: 91 deterministic branch-only npm failures in 34 files (solo reruns reproduce all 34). Cluster A alone is 40 tests and is a branch regression (manifest env), still open. R6 reproduces. Doctor-fresh-run is red on the branch and green on main. The suite exit 13 leaves the branch run without a suite report. The branch also lacks origin/main.

Resolved since the previous gate: R4 (scoped-commit passes on `bwrap-pidns`), R5 (no spy violation in the full run), R7 (P-RELEASE passes under umask 022; the 002 failure is E-a), census 0 sites, doctor one-door pass, clippy clean.

## Unresolved questions

1. Why did the branch `npm test` exit 13 at the unsettled top-level await at `scripts/run-tests.mjs:681` (`await import('./test-proof-inventory.mjs')`), before any suite line? The import settles in isolation and under the npm-equivalent env. One occurrence, in the full run only.
2. Contract for the dev addon manifest: the Node addon loader needs `FGOS_ACTIVE_MANIFEST_PATH`; the host legacy route parses it as a release manifest and needs `entry`. Which side changes? Trade-off needs owner choice.
3. Cause of the 120 s attempt-directory waits (cluster D) and the 600 s file kill (R6). The refused run's stderr is not captured by the test output.
4. Cause of the `store.rs` lock test failure in the full cargo run (flaky, passes 10/10 solo).
5. Cause of `run-supervisor-checks` host protocol 2 refusal (`host-version-mismatch`).
6. Whether main has the same spy-visible spawn sites that u25 recorded for the branch (main has no spy, so unverified; not part of this gate).

Status: DONE_WITH_CONCERNS
Summary: Gate rerun on 79e04c570 is NO-GO: 91 deterministic branch-only npm failures in 34 files, dominated by a manifest-env regression (40 tests). R4, R5, R7 and the doctor one-door row pass; R6 still reproduces; the branch run exited 13 without a suite report.
Concerns/Blockers: Branch lacks origin/main (68ded3a0a), so a merged-tree gate is required. Herdr and crash-matrix causes are not isolated. P-RELEASE fails only under umask 002 (E-a).
