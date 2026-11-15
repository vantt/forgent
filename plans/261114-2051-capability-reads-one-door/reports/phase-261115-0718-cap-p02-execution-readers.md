# Execution readers moved to the capability port

Moved three readers to `capability-config.mjs`: `verifyCommandOf` uses `capabilityVerifyOf`, `legacyCheckers` uses `ownMinCheckersOf`, `snapshotRunnerConfig` uses `catalogOf(cfg) || {}` (same value as before, so record and hash are unchanged). Removed the three debt entries (`legacy-seat-read.mjs`, `loops/verify.mjs`, `run.mjs`) from the `read runner.capabilities` row in `docs/architecture-manifest.json`; the three files now match no pattern of that row.

## Files
- `src/runner/execution/loops/verify.mjs`, `legacy-seat-read.mjs`, `run.mjs`, `docs/architecture-manifest.json`
- Approved file outside the list (big lead, forgent-6a): `test/state/domain-registry-compiled.test.mjs`. Its copy list gained `src/runner/execution/capability-config.mjs` and `src/runner/rigor.mjs`, because `legacy-seat-read.mjs` now imports the port, which imports `rigor.mjs`. No assertion changed.

## Gates
Phase gate list green (11 test files, `architecture.test.mjs` doors check included; the registry test failed once before the copy-list fix, then passed). `check-decision-citation-drift`: no new findings. `doc-health`: Rust host binary unavailable here, not run. `git-one-door-scan`: 0 undeclared sites. `rg capabilities` in the three files: only a message string and the `capabilities:` key of the recorded object.

## CHANGELOG
None (no user-visible change).

## Lessons
A module copied into a bare directory by a test (`domain-registry-compiled`) breaks silently when a pure leaf gains an import; grep tests that copy source lists, not just tests that import the file.
