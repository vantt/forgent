# P00 — Current-Tree Baseline And Profile

**Status:** accepted. 3 valid green full-suite samples + 1 separate valid green profile retained on the exact current implementation SHA.

## Environment (all runs)

- SHA: `a5c29f6ea936454962ebf9b5749a8a4113ced8a0` (branch `immediate-test-feedback-reduction`, worktree `.claude/worktrees/immediate-test-feedback-reduction`)
- Node: v24.18.0, linux/x64, 16 CPUs
- Command: `node scripts/run-tests.mjs` (default `node --test` concurrency, i.e. 16), wrapped by `/usr/bin/time -v` via `scripts/test-timing.mjs sample`/`profile`
- Measurement tool: GNU `time -v`. CPU numbers are **process-tree CPU** (wait4 rusage over the whole reaped subtree), not a single-process number — same convention as the inherited P02 baseline (`plans/260915-0455-test-suite-feedback-cost/reports/green-baseline.md`)
- Rust release binaries and Node deps were already staged in this worktree (inherited from prior work on this branch); no rebuild was needed for these runs
- Working tree was clean (`git status --porcelain` empty) before and after every sample, confirmed by `isGitClean`

## Tooling fix required before valid samples (P00 scope)

`scripts/test-timing.mjs`'s `isGitClean`/`runOneSample` rejected samples as dirty for legitimate in-tree artifact output (the samples' own `--log-dir` under `plans/.../reports/artifacts/`, plus the `?? node_modules` / `?? target` build-artifact symlink entries under load). Fixed with an `allowedPrefixes` parameter so a sample's own log directory and its parent `artifacts/` dir are excluded from the dirty check, and ambient git-identity/timing hardening for the coordination R5 hard-budgets test that the profile/sample runs exercise. Covered by 36 focused tests in `test/scripts/test-timing.test.mjs` (all green) before any sample was trusted. No product behavior changed; commits already on this branch: `376c1172`, `106110be`, `f8b50d7e`, `a5c29f6e`.

## Three green full-suite samples

| Sample | Status | Wall (s) | User (s) | System (s) | Max RSS (KB) | Load (1/5/15m) at start | Tests / Pass / Fail / Skip |
|---|---|---|---|---|---|---|---|
| 1 | 0 (green) | 453.00 | 2616.07 | 1165.55 | 266388 | not captured (summary.json not persisted by the in-progress run that produced this sample; stdout/stderr logs retained and cross-checked) | 7104 / 7095 / 0 / 9 |
| 2 (discarded, see below) | 1 (red) | 523.79 | 2468.03 | 653.12 | 264308 | 1.84 / 5.4 / 6.71 | 7104 / 7094 / 1 / 9 |
| 2 (retained) | 0 (green) | 404.03 | 2382.17 | 621.64 | 264020 | 10.95 / 23.11 / 18.09 | 7104 / 7095 / 0 / 9 |
| 3 | 0 (green) | 398.66 | 2371.44 | 619.21 | 264892 | 5.38 / 16.25 / 17.56 | 7104 / 7095 / 0 / 9 |

- **Wall median (3 retained valid samples: 453.00, 404.03, 398.66): 404.03s** (min 398.66, max 453.00)
- **User median: 2382.17s** (min 2371.44, max 2616.07)
- **System median: 621.64s** (min 619.21, max 1165.55)
- Every retained sample: clean git snapshot before AND after, status 0, no interruption. Sample 1's higher wall/system time (453s vs ~400s for 2/3) is consistent with it running earliest in the session before ambient load rose (later samples ran under higher 5m/15m loadavg — 16-23 range — yet were *faster*, indicating the spread here is dominated by run-to-run variance in this 16-way concurrent suite, not simple load correlation).

**Discarded invalid sample (evidence retained, not folded into the median):** the first sample-2 attempt exited 1 — one failing test, `test/runner/herdr-spawn-adapter.test.mjs`: "a herdr that stops answering does not turn a live round into an idle timeout" (`AssertionError: expected 'timed-out-ceiling', got 'timed-out-idle'`), a timer race between an idle-timeout and a ceiling-timeout path under full 16-way suite contention. Verified as a pre-existing ambient-load flake, not a regression from this track: (a) that file is untouched by this branch's diff against `main`; (b) re-run in isolation 3× immediately after was green all three times (`node --test test/runner/herdr-spawn-adapter.test.mjs`, pass 35/35 each run). Raw artifacts preserved at `reports/artifacts/sample-2-invalid-1/` (`stdout.log`, `stderr.log`, `summary.json`). Per the P00 rollback rule, invalid samples are discarded and not corrected in place — a fresh sample-2 was captured instead, which came back green.

**Adversarial checks satisfied:** no invalid/interrupted/dirty sample folded into the median (`summarizeSamples` throws on any invalid sample — covered by `test/scripts/test-timing.test.mjs`); no benchmark run overlapped another (each sample/profile run was started only after the previous one's background process had fully completed, confirmed via task-completion notification before the next `node scripts/test-timing.mjs` invocation); `/usr/bin/time -v`'s CPU scope is explicitly labeled process-tree, never overstated as single-process; a competing full-suite/benchmark process check (`ps aux` + `uptime`) was run immediately before the first sample and showed none running.

## Separate profile (JUnit reporter)

One additional run with `--test-reporter=junit`, status 0 (green), wall 400.21s (not folded into the 3-sample median above — the reporter adds its own overhead), load 5.42/14.88/17.32 at start. Raw JUnit XML (7188 `<testcase>` entries) retained at `reports/artifacts/profile/junit.xml`; raw stdout/stderr and `summary.json` also retained.

**Top 10 slowest individual tests:**

1. 42.46s — `test/rust-host/fgctl-init.test.mjs` — "R11 & R1-R8, R10: fgctl init in a fresh git project publishes shims, root.json, activation.json, and passes preflight/tail"
2. 29.20s — `test/rust-host/fgctl-init.test.mjs` — "Item 1: Concurrent fgctl init invocations against pre-staged pinned workspace observe activation-lock refusal (exactly one winner)"
3. 27.67s — `test/rust-host/fgctl-init.test.mjs` — "Item 3: Idempotent re-run skips stage_release entirely (does not contend for install.lock)"
4. 25.22s — `test/rust-host/fgctl-init.test.mjs` — "Item 6: Stale activation.json.tmp.* files left from crash are cleaned up on fgctl init"
5. 24.02s — `test/rust-host/fgctl-init.test.mjs` — "P7: Atomic activation publish ensures valid activation.json without partial tmp artifacts"
6. 23.68s — `test/cli/fgos-setup.test.mjs` — "setup inside a .fgos/-less linked worktree still succeeds (setup never touches .fgos/, exempt from the guard)"
7. 23.06s — `test/rust-host/fgctl-init.test.mjs` — "Item 4: Live-PID lock whose ts is older than DEFAULT_TTL_MS is treated as free"
8. 23.04s — `test/rust-host/fgctl-init.test.mjs` — "Item 2: Pinned workspace reconciles with matching --from source when unstaged, and re-stages when it drifts"
9. 22.13s — `test/rust-host/fgctl-init.test.mjs` — "Item 1 (HIGH): activation.lock orphaned by a killed process (dead pid) is reclaimed"
10. 17.68s — `test/rust-host/harness.test.mjs` — "R5: Node-against-Node passes all coverage-floor cases"

**Top 15 slowest files** (summed test time):

| File | Total (s) | Tests |
|---|---|---|
| test/rust-host/fgctl-init.test.mjs | 218.42 | 20 |
| test/cli/fgos-merge.test.mjs | 119.85 | 59 |
| test/cli/fgos-return.test.mjs | 96.09 | 44 |
| test/rust-host/fgctl-upgrade.test.mjs | 78.40 | 15 |
| test/cli/fgos-merge-2.test.mjs | 68.84 | 30 |
| test/cli/fgos-edit.test.mjs | 63.35 | 29 |
| test/runner/loop.test.mjs | 58.61 | 92 |
| test/runner/coordination-driver-authorization.test.mjs | 58.01 | 70 |
| test/cli/fgos-edit-3.test.mjs | 57.15 | 19 |
| test/cli/fgos-setup.test.mjs | 49.47 | 17 |
| test/cli/fgos-read-2.test.mjs | 46.89 | 21 |
| test/cli/fgos-stage.test.mjs | 46.34 | 18 |
| test/runner/dispatch.test.mjs | 45.83 | 322 |

**Directory totals** (all buckets):

| Directory | Total (s) | Tests |
|---|---|---|
| cli | 1718.39 | 868 |
| runner | 671.05 | 2932 |
| rust-host | 346.30 | 100 |
| verbs | 169.96 | 219 |
| e2e | 105.39 | 57 |
| setup | 103.21 | 595 |
| state | 66.69 | 1189 |
| report | 43.70 | 136 |
| scripts | 26.44 | 253 |
| skills | 10.42 | 14 |
| intake | 5.75 | 173 |
| install | 0.63 | 17 |
| util | 0.52 | 38 |
| (test root) | 0.44 | 14 |
| evolve | 0.30 | 35 |
| docs | 0.06 | 10 |
| config | 0.03 | 21 |

## Comparison to P02 (cross-snapshot orientation only, not direct attribution)

The inherited P02 baseline (`plans/260915-0455-test-suite-feedback-cost/reports/green-baseline.md`, SHA `22c003db2...`) measured wall median 342.70s over 6547 JUnit testcases / 7 suites/directories-of-note listed. This current-tree baseline measures wall median 404.03s over 7104 tests (7188 JUnit `<testcase>` entries) across 27 suites and 17 top-level test directories. The +61.33s median and +557-test delta reflect real suite growth since P02 (new coordination, dispatch, and CLI test files), not a regression on unchanged tests — no per-test comparison is claimed here. `cli/` remains the dominant directory by wall time (1718.39s here vs 1512.56s in P02, both ~28-32% of total profiled time), and `test/rust-host/fgctl-init.test.mjs` is now the single most expensive file (218.42s, up from P02's `test/report/enduser-index.test.mjs` at 195.46s) — both are directly relevant candidates for P01's hotspot review.

## Candidate cost-class annotations (orientation for P01, not a P01 decision)

- **`test/rust-host/fgctl-init.test.mjs` (218.42s, 20 tests):** Rust/package boundary — exercises real `fgctl init`/activation/lock behavior against staged release artifacts; likely legitimate boundary cost, not fixture-only. Needs P01's own trace before any change.
- **`test/cli/fgos-merge.test.mjs` / `fgos-merge-2.test.mjs` / `fgos-return.test.mjs` / `fgos-edit.test.mjs` / `fgos-edit-3.test.mjs` / `fgos-setup.test.mjs` / `fgos-read-2.test.mjs` / `fgos-stage.test.mjs` (top `cli/` files, 49-120s each):** fixture construction + real Git — same CLI-harness family already partially audited by the inherited `cli-harness-responsibility-audit.md`; candidates for P02's fast-fixture re-audit, not necessarily P01 hotspot removal.
- **`test/runner/loop.test.mjs`, `coordination-driver-authorization.test.mjs`, `dispatch.test.mjs` (45-59s, high test counts):** concurrency/timing — large suites with many fast tests; total cost is execution-count driven, not a single slow outlier, so unlikely P01 candidates (P01 is capped at 3 independent hotspot candidates and excludes broad-count files without a specific accidental-cost trace).
- **`test/runner/herdr-spawn-adapter.test.mjs`:** unknown/flake-risk — not a cost candidate, but flagged as a known ambient-load-sensitive timer race (see discarded-sample note above) for awareness by later phases; no action taken on it in this track (out of P00/P01 scope, not touched by this branch).

## Raw artifacts retained

`plans/260920-immediate-test-feedback-reduction/reports/artifacts/`:
- `sample-1/{stdout.log,stderr.log}` — first valid sample (summary.json not separately persisted; full counts/timings cross-checked from the logs above)
- `sample-2/{stdout.log,stderr.log,summary.json}` — second, retained valid sample
- `sample-2-invalid-1/{stdout.log,stderr.log,summary.json}` — discarded invalid attempt, retained as flake evidence
- `sample-3/{stdout.log,stderr.log,summary.json}` — third valid sample
- `profile/{stdout.log,stderr.log,summary.json,junit.xml}` — separate profile run, raw JUnit (7188 testcases)

## Acceptance

- [x] Three valid green samples and one separate valid green profile.
- [x] No overlapping benchmark (sequential, one background run at a time, verified via completion notifications).
- [x] No dirty or failed run folded into the median (one failed run discarded and documented instead).
- [x] Top candidates above are based on this run's current data, not the inherited P02 snapshot.

## Impact analysis

`impact-analysis: inactive` — `fgos tool query --capability impact-analysis --status present` returned zero registered providers in this worktree (no `.gitnexus/run.cjs` present either); per `CLAUDE.md`'s capability gate this is Inactive, not a gap, so GitNexus impact/detect-changes evidence is skipped for this phase's commit. This phase changed no functions/classes/methods (report + raw log artifacts only); the tooling-fix commits already on this branch predate this report.

**Correction (P01):** this note conflated fgOS's own dispatch-executor capability registry with this session's own `mcp__gitnexus__*` tools, which are live and unrelated to that registry — see `hotspot-leak-removal.md`'s "Impact analysis" section for a confirmed, working `mcp__gitnexus__impact` call. No factual claim above changes (this phase still edited no existing symbols), but later phases should query the live MCP tools directly rather than reusing this "inactive" framing.

## Handoff

P00A (proof/duplication inventory) and P01 (hotspot removal, max 3 candidates) reproduce this exact command (`node scripts/test-timing.mjs sample`/`profile`) against their own before/after state on this same machine, and register a minimum effect threshold greater than the observed noise above (wall range 398.66-453.00s across the 3 samples, ~12% spread dominated by run-to-run/ambient-load variance, not measurement error) before mutating anything, per ITR-D09/ITR-D12 and the plan's Measurement Contract.
