# Phase 6 — Token parsers in Rust

New logic, written in Rust (OM-D3). The Node parsers retire in the same phase (L10).

## Inputs
- `reports/usage-survey.md` (phase 2).
- `src/runner/dispatch/usage-parsers.mjs` and its caller `settlement.mjs:806`.
- The in-process addon door:
  - `packages/git/node-addon/src/run_result.rs` (namespace `runResult`, which already wraps `fgos-run-result`);
  - `src/native/door.mjs:33-35` (`combinedAbiMatches` checks the `runResult` version).
- The places that name the old file:
  - `test/runner/usage-parsers.test.mjs`;
  - `test/runner/run-result-source-scan.test.mjs:134`;
  - `test/suite-baseline.json:378`;
  - `docs/architecture-manifest.json:1380`, which is checked by `test/architecture.test.mjs:47-48`.

## Footprint
`packages/run-result/rust/src/usage/**`, `packages/run-result/rust/src/lib.rs`,
`packages/run-result/rust/tests/usage_*.rs`, `packages/git/node-addon/src/run_result.rs`, `src/native/door.mjs`,
`src/runner/dispatch/settlement.mjs`, `src/runner/dispatch/usage-parsers.mjs` (deleted),
`test/runner/usage-parsers.test.mjs` (retired), `test/runner/run-result-source-scan.test.mjs`,
`test/suite-baseline.json`, `docs/architecture-manifest.json`.

## Steps
1. Add `fgos_run_result::usage::parse(cli, stdout, stderr, session_ref) -> Usage`, with one module per CLI.
   - It returns tokens: input, output, cache-read and cache-creation, plus their `source`.
   - When nothing is found it returns `reason: <named>`, never a guessed zero.
   - For Claude, it reads the seat's own transcript or its JSON output, as the survey describes.
   - Usage belongs to the run result, which is why it sits in this crate.
2. Expose it as `runResult.parseUsage` in the addon. Bump the `runResult` ABI version and its check in `door.mjs`.
   Settlement calls it through the door. A failure records `reason: parser-unavailable` and never changes the run
   outcome.
3. Delete `usage-parsers.mjs`.
   - Its test cases move to the Rust tests (principle 8), so retire `test/runner/usage-parsers.test.mjs`.
   - Remove the old file from the suite baseline and from the architecture manifest.
   - Point `run-result-source-scan.test.mjs:134` at the new door.
4. Rust tests: one per CLI, using the survey's real samples, plus a reason-when-absent case.

## Verify
- `cargo test -p fgos-run-result` passes.
- `node scripts/run-tests.mjs test/runner/assignment-runresult.test.mjs test/runner/run-result-source-scan.test.mjs test/architecture.test.mjs` passes.
- `rg -n usage-parsers src test docs/architecture-manifest.json` returns nothing.

## Rollback
Revert the phase commit.
