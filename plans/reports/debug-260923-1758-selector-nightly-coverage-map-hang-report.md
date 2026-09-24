# selector-nightly coverage-map hang — root cause and fix

Branch `fix/ci-test-hermeticity`, commit 7a1090ce. Found while gathering real CI evidence for the TI-04 baseline fix (`plans/reports/fix-report-260923-1454-shadow-pipeline-compare-mutate-gaps.md`); split out as its own item.

## Symptom

`workflow_dispatch` on main (run 35836963373, cc687d92, 08:24Z): step "Run coverage map generator" still `in_progress` after more than 3h, and never reached "Run mutation tests". The job had no `timeout-minutes`, so it would only stop at GitHub's 6h job cap.

## Root cause (measured, not inferred)

Method: run exactly what the script does (`node --test <file>` with a per-file `NODE_V8_COVERAGE`) for every file it collects. Environment: CI-like (empty HOME, clean PATH), pool of 8, 180s probe timeout per file.

1. **Infinite hang: `test/rust-host/fixtures/stdin-echo.mjs`.** `getFiles(test/)` collected every `.mjs`/`.js` under `test/`, not only suites: 396 files = 379 `*.test.mjs` + 17 fixtures, helpers and worker scripts. `stdin-echo.mjs` waits for stdin EOF. Under `node --test`, the file runs in a subprocess whose stdin pipe never closes, so it never exits. `execFileSync` had no timeout, so the step blocks forever.
2. **Even without the hang, it is too slow.** The per-file durations add up to about 126 min. Run serially as before, this alone exceeds 2h.
3. Under contention, 3 real suites reached the 180s probe limit: `fgos-return`, `fgos-merge`, `fgos-post-merge-4`. Run alone they take 37–84s and are all green. That is slowness under load, not a hang, so no test was changed.
4. Separate latent bug: the external `NODE_V8_COVERAGE` branch read an undefined `coverageDir`, which would throw a ReferenceError.

## Fix

- Collect only `*.test.mjs`, using `discoverTestFiles` from `run-tests.mjs` (the same set `npm test` runs). Helpers stay in the static import graph, but the static closure now starts from suites only.
- `collectPerFileCoverage`: a pool of `min(4, cpus)`, and each file limited to 5 min. An overrun kills the whole process group (test files spawn children), is recorded as `coverage-collection-timeout`, and collection moves on to the next file. Each file prints a progress line. The map JSON gets a `coverageCollection {durationMs, timedOut, failed}` field. The temp coverage directory is removed afterwards.
- An inherited `NODE_TEST_CONTEXT` is stripped. Otherwise a nested `node --test` reports to a parent that is not listening and exits without running anything (found while writing the test).
- Fixed the undefined `coverageDir`.
- `selector-nightly.yml`: job `timeout-minutes: 120` as a backstop only.
- Test `test/scripts/test-select-coverage-map.test.mjs`: a hanging file (with a grandchild) is killed and recorded while the other files continue; peak concurrency, measured from real timestamps, equals the limit.

## CI evidence

- Run 35852093620 (`workflow_dispatch`, branch `fix/ci-test-hermeticity`, 7a1090ce): **success, about 55 min total.**
  - "Run coverage map generator": **14.3 min** (11:01:27→11:15:45). Log: `Collecting coverage for 380 test files (concurrency 4, 300s per file)` → `finished in 13.9 min; 0 file(s) timed out`. On main, the same step had been stuck for more than 3h.
  - "Run mutation tests": **40.1 min** (11:15:45→11:55:49). "Upload ledger and coverage map": success.
- 6 files ended `test-failed` during collection, which is expected here, not a timeout: `rust-host/*` ×4 (the workflow does not build Rust), `scripts/fgos-shell-integration`, and `runner/loop` (138s). Output is suppressed, so the cause of the last two is not visible yet. `loop` is green locally in the CI-like environment.

## Found along the way (out of scope, separate items)

- **Mutation ledger gives false `confirmed-miss`:** all 3 mutants came out `confirmed-miss`. `classifyOneMutant` checks a baseline for the *related* tests only. The *full* suite in this job is always red for unrelated reasons (no Rust build, plus the `loop` failure), so any mutant that survives related is labelled "selector miss". The fix is either to give the full suite a baseline the same way, or to build Rust in the nightly job. Same family of bug as TI-04.
- `test (windows-latest)` in CI run 35836953124 (main) had been running for more than 4h: ci.yml has no `timeout-minutes` either.

## Unresolved questions

- The old runs still hung on main (nightly 35836963373, and the Windows job of 35836953124) hold runners until the 6h cap. Should they be cancelled?
- Should ci.yml's test jobs also get `timeout-minutes`?
