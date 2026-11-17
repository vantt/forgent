# Vector script made hermetic

## Cause
`scripts/executor-model-vectors.mjs` evaluated vectors in the caller's environment (PATH, HOME, HERDR_*, CLIs on PATH). The replay test runs under `scripts/run-tests.mjs`, whose `buildTestEnv` keeps only OS and toolchain variables. Recording or checking from a developer shell could therefore write or compare one machine's facts.

## Fix
- The script replaces its own process environment by `buildTestEnv(process.env)` (the one definition, exported by run-tests) and loads `test/helpers/process-tmp-root.mjs` as the test does, before any vector is evaluated, for both record and `--check`.
- New `--contract <file>` option (used by the test). The script header says how to re-record.

## Earlier "237 match" (phase 15)
Run from my plain shell with the old script, so it was not hermetic. The same vectors were replayed green by the test under run-tests. With this fix `--check` gives 238 matches (main carries one more vector) from a plain shell and with HERDR_* set.

## Test
`test/runner/dispatch/executor-model-vectors.test.mjs`: `--check` exits 0 from a dirty env (HERDR_* set, stub codex/pi/omp/agy on PATH) and exits non-zero, naming the vector, when an `expect` is changed.

## Gates
Vectors test, architecture, mutation census (regenerated), doc-health and decision-citation-drift green.

Status: DONE
