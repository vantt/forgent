# P02 - Green Baseline And Profile

**Status:** accepted. 3 valid green full-suite samples + 1 separate valid green profile retained. R1-R5 hold.

## Environment (all runs)

- SHA: `22c003db230627e6e72ebd9757ee6e16ed2ce565` (track branch `test-suite-feedback-cost--p02`, includes P00+P01 and a sync of `main` through commit `45569ac3`, which is now released to `main` as `2c56eed8`)
- Node: v24.18.0, linux/x64, 16 CPUs
- Command: `node scripts/run-tests.mjs` (default `node --test` concurrency, i.e. 16), wrapped by `/usr/bin/time -v` for user/system CPU + peak RSS
- Measurement tool: GNU `time -v`. CPU numbers are **process-tree CPU** (wait4 rusage over the whole reaped subtree), not a single-process number — this repo's own retained convention (see the historical `plans/reports/artifacts/260915-npm-test-baseline-224f0803/time-v.log`)
- `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` set by `run-tests.mjs` itself in every sample

## Three green full-suite samples (R1/R2/R5)

| Sample | Env | Status | Wall (s) | User (s) | System (s) | Load (1/5/15m) at start |
|---|---|---|---|---|---|---|
| 1 | agent-session (inherited `CLAUDE_CODE_SESSION_ID`) | 0 (green) | 335.22 | 2508.37 | 587.32 | 0.83 / 0.73 / 0.74 |
| 2 | ordinary shell (`env -u CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID`) | 0 (green) | 384.76 | 2803.47 | 1087.81 | 3.42 / 8.43 / 4.89 |
| 3 | agent-session (inherited `CLAUDE_CODE_SESSION_ID`) | 0 (green) | 342.70 | 2523.33 | 588.15 | 4.43 / 12.60 / 8.87 |

- **Wall median: 342.70s** (min 335.22, max 384.76)
- **User median: 2523.33s** (min 2508.37, max 2803.47)
- **System median: 588.15s** (min 587.32, max 1087.81)
- Every sample: clean git snapshot before AND after (isolated worktree, checked via `isGitClean`), status 0, no interruption. Sample 2's higher wall/system time correlates with its higher ambient load (5m/15m loadavg 8.43/4.89) at capture time — noted, not corrected for, per the Measurement Contract's "record ... load" requirement rather than silently normalizing it away.
- R5 (hermeticity across environments): satisfied — samples 1 and 3 ran under an inherited `CLAUDE_CODE_SESSION_ID` (agent session), sample 2 under neither session var set (ordinary shell). All three green, confirming P00's fix holds under real full-suite load, not just the single focused test.

**Adversarial checks satisfied:** no invalid/interrupted/dirty sample folded into the median (`summarizeSamples` throws on any invalid sample — verified in `test/scripts/test-timing.test.mjs`); no benchmark overlapped another (each sample run started only after the previous one, and only after any unrelated full-suite run I had started for a different purpose — checkpoint-1, the pre-release check — had fully finished); `/usr/bin/time -v`'s CPU scope is explicitly labeled process-tree, never overstated as single-process.

**Environment note (evidence, not estimate):** earlier same-day attempts at this same cell were repeatedly killed by an OOM-protection watchdog while OTHER, unrelated Claude Code/Codex agent sessions on this shared machine were concurrently running their own heavy work (confirmed via `ps`; not fixable by reducing this cell's own `--test-concurrency`, tried 16→4→2, all killed). The three retained samples above were all captured later, once ambient load had genuinely dropped (loadavg 0.7-12.6 range) — this baseline reflects a real, reproducible low-contention window on this machine, not a synthetic one.

## Separate profile (R3/R6)

One additional run with `--test-reporter=junit`, status 0 (green), wall 341.22s (not folded into the 3-sample median above — the reporter adds its own overhead). Raw JUnit XML (6547 testcases) retained at
`reports/artifacts/260915-npm-test-baseline-p02/profile/junit.xml`.

**Top 5 slowest files** (summed test time):

| File | Total (s) | Tests |
|---|---|---|
| test/report/enduser-index.test.mjs | 195.46 | 20 |
| test/rust-host/fgctl-init.test.mjs | 189.66 | 20 |
| test/cli/fgos-merge.test.mjs | 137.45 | 57 |
| test/cli/fgos-return.test.mjs | 101.44 | 44 |
| test/cli/fgos-merge-2.test.mjs | 75.99 | 30 |

**Directory totals** (top 5 of `test/*`):

| Directory | Total (s) | Tests |
|---|---|---|
| cli | 1512.56 | 855 |
| runner | 505.71 | 2500 |
| rust-host | 281.87 | 100 |
| report | 223.46 | 136 |
| verbs | 151.87 | 217 |

**Top 5 slowest individual tests:**

1. 89.11s — `test/report/enduser-index.test.mjs` — "fgos docs-index writes repo/docs/enduser-docs-index.json with the real..."
2. 48.04s — `test/report/enduser-index.test.mjs` — "fgos docs-index is idempotent — re-running yields the same entries..."
3. 33.64s — `test/rust-host/fgctl-init.test.mjs` — "R11 & R1-R8, R10: fgctl init in a fresh git project publishes shims..."
4. 32.87s — `test/report/enduser-index.test.mjs` — "fgos docs-index tolerates a missing quadrant dir..."
5. 25.60s — `test/rust-host/fgctl-init.test.mjs` — "Item 1: Concurrent fgctl init invocations against pre-staged pinned..."

No timing threshold is enforced here (R6) — this data is descriptive orientation for P03-P07's own pilots, each of which registers its own threshold against this baseline per the Measurement Contract. Notably, `test/report/enduser-index.test.mjs` (docs-index) is the single most expensive file — directly relevant to P03's own target; `cli/` is the dominant directory by a wide margin (1512s of ~5460s total, ~28%) — directly relevant to P07's harness-responsibility audit.

## Raw artifacts retained

`reports/artifacts/260915-npm-test-baseline-p02/`:
- `sample{1,2,3}-*.json` — full sample records (env, git-clean before/after, GNU-time-parsed fields)
- `sample{1,2,3}-*/stderr.log` — raw `/usr/bin/time -v` output per sample
- `profile.json` — profile record + summary (topTests/topFiles/directoryTotals)
- `profile/junit.xml` — raw per-test JUnit XML (6547 testcases)
- `profile/stderr.log` — raw `/usr/bin/time -v` output for the profile run

## Handoff

P03-P06 pilots reproduce this exact command (`node scripts/test-timing.mjs sample` / `profile`) against their own before/after state, on this same machine, and register a minimum effect threshold **greater than the observed noise above** (wall range 335-384s across the 3 samples, ~15% spread — driven by ambient load, not measurement error) before mutating anything, per the Measurement Contract.
