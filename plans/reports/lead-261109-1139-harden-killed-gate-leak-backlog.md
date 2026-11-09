# HARDEN lead report: killed-gate leak and backlog checks (2026-11-09)

Landed a6bad7dfc..eb718ef6c on main.

## Killed-gate temp leak
- Cause confirmed: `runSelectedTests` blocks in `spawnSync`, so a Node signal handler in the launcher cannot run, and the `finally` is skipped when the launcher is killed. A `process.on('SIGTERM')` in the launcher would be deferred until the child ends, so it was not used.
- Fix: the per-file watchdog (`scripts/lib/test-file-watchdog.mjs`), already a sibling process, gets `--clean=<dirs>` (this run's temp dir and fixture root; empty under `FGOS_TEST_KEEP_TMP=1`). When the launcher is gone (poll sees the pid dead, or SIGINT/SIGHUP, or SIGTERM with a dead launcher) it runs `reapRunDirs`: SIGKILL any process whose `TMPDIR` or `FGOS_TEST_FIXTURE_ROOT` equals one of those dirs (read from `/proc/<pid>/environ`), then remove the dirs. The launcher's own SIGTERM stop of the watchdog still exits quietly.
- Re-raise: the launcher has no handler, so it dies by the default action and its exit status is the signal; the test asserts that.
- Scope: only dirs passed in and processes carrying exactly them; another run has its own dirs. The test keeps a neighbour `/var/tmp/fgos-test-fixtures-*` dir and asserts it survives.
- Startup sweep: none exists. Dir names are random `mkdtemp` names with no owner pid, so a safe "owner dead" sweep is not possible without a naming change; not added. The 1025 older dirs remain; deleting them is the owner's call.
- Proof: `test/scripts/run-tests.test.mjs`, one test per SIGTERM/SIGINT/SIGHUP (real child gate, real fixture test). Red before the fix (dirs remained), green after. Mutation census regenerated.
- Limit: SIGKILL of the launcher and watchdog together (group SIGKILL) still leaks; nothing can run then.

## Backlog
- p-7lbid77g4g: not closed. override-pin (`492d4ee59`) fixes only `pin-mismatch` for an already-staged release. `git-addon-missing` has no recovery path, and no test drives clone -> init -> setup. Row narrowed, status proposed.
- p-3c7681b8: done. No `src/` writer of `.fgos/coordination/sessions/` (one reader, `runtime-inspection.mjs`), directory absent in main, doctor row retired in `fd4336b11`, and run-tests fails any `.fgos` add/modify. No fix needed.
- p-djrgdijd2c: left open; row accurate (Worktree/Refs compaction reverted in `3a655a8b3`, still no housekeeping door; `git-retention-note.mjs` still the only trace).

## Gate
Focused run-tests, architecture, doc-health, citation-drift, census tests: 140 pass. One-door scan: 0 undeclared. Full `npm test`: 8681 tests, 1 fail (known V7n addendum), no run-tests ERROR lines.

## Notes
- Two commits lack the co-author trailer (pushed before the trailer rule was applied).
- Cargo not touched; no CHANGELOG line (test infrastructure only).
