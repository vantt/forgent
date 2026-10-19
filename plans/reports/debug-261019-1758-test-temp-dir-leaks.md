# Test temp-dir leaks into /tmp (tmpfs)

Date: 2026-10-19. Session `ac420727`.

## Symptom
/tmp (16G tmpfs) held >16k `fgos-*` dirs (4.7G): `fgos-cli-*` 4979, `fgos-dispatch-test-*` 1222, `fgos-merge-test-repo-*` 526, `fgos-asgn-dispatch-test-*`, `fgos-unknown-flag-*`, `fgos-store-learning-*`, `fgos-worktree-test-*`, ... plus ENOSPC for an agent run. All dirs dated 2026-10-19.

## Cause
- `scripts/run-tests.mjs` already gives the suite a private TMPDIR (`fgos-test-run-*`, removed at the end, since d8dcaa5cb). Through that door nothing reaches /tmp.
- The leak is every file run directly (`node --test <file>`, the common agent path): no runner, TMPDIR is /tmp, and 360 test files plus helpers call `mkdtemp(os.tmpdir())` with no `t.after`/`finally` cleanup. Largest per-dir: `fgos-cli-*` from `test/cli/helpers/fgos-cli-harness.mjs` (`rawTmpCwd`, never cleaned, plus a cached template root); the ~209M ones are a HOME-style dir holding `.claude/plugins/marketplaces` written by a setup verb run with cwd as HOME.
- Per prefix group: harness-created (`fgos-cli-`, `-cli-wt-`, `-wt-`), per-test `mkdtemp` without cleanup (`dispatch.test`, `merge.test`, `unknown-flag-rejection`, `store-learning`, `worktree-*`, `resolve-*`, `asgn-*`), children writing under inherited TMPDIR (`fgos-confinement*`), killed runner `fgos-test-run-*` (only a SIGKILLed runner leaves one).
- Baseline measurement (5 files run directly, private TMPDIR): 463 leftover dirs, 34M. After fix: 0.

## Fix (one shared door)
- `test/helpers/process-tmp-root.mjs`: on import, TMPDIR/TMP/TEMP point at a fresh `fgos-tp-*` dir; removed on exit and on SIGINT/SIGTERM/SIGHUP. Covers this process and every child that inherits env. `FGOS_KEEP_TEST_FIXTURES=1` keeps it (existing switch). `fixture-dir.mjs` imports it.
- Every `test/**/*.test.mjs` imports it first (one line each, 528 files). Chosen over editing call sites: dirs made inside helpers and by `src/` code are covered too.
- `scripts/run-tests.mjs`: before removing the run dir (and the /var/tmp fixture root) it counts `fgos-*` entries left directly in them and fails the run naming prefixes (`leftoverTempPrefixes`). A new test file that forgets the import, or a killed file, is reported instead of silently filling /tmp.
- Why not only the runner check: it cannot reach direct runs. Why not only a private TMPDIR: already exists and does not cover direct runs. Process-level root covers both; the runner check is the enforcement.

## Proof
See commit message / program board line. Full suite on this tree: 8355 tests, 78 fail; failures are the baseline set plus tests needing `target/release/fgctl` (not built in a fresh worktree); the non-fgctl failing files fail identically on a clean origin/main checkout. No temp-leftover error from the runner; no new `fgos-*` dirs from this run in /tmp.
