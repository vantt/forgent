# Phase 5 — Token parsers in Rust

New logic, so it goes in Rust (OM-D3). The Node file it replaces is retired in the same phase (L10).

## Inputs
- `reports/usage-survey.md` (phase 2).
- `src/runner/dispatch/usage-parsers.mjs` (the parsers being replaced) and its caller `settlement.mjs:806`.
- `packages/execution/rust/src/lib.rs` (the crate `fgos-execution`).
- The in-process door that already exposes `fgos-execution` to Node (find it with
  `rg -n 'fgos-execution|fgos_execution' src packages/*/node 2>/dev/null`). Use it if it exists; otherwise use
  `invokeHost`.

## Footprint
`packages/execution/rust/src/usage/**`, `packages/execution/rust/src/lib.rs`,
`packages/execution/rust/tests/usage_*.rs`, `src/runner/dispatch/settlement.mjs`,
`src/runner/dispatch/usage-parsers.mjs` (deleted), `test/runner/dispatch/usage-parsers.test.mjs` (retired).

## Steps
1. Add `usage::parse(cli, stdout, stderr, sessionRef) -> Usage`, with one module per CLI.
   - `Usage` holds the input, output, cache-read and cache-creation tokens, plus `source`.
   - When nothing is found it returns `reason: <named>` instead, and never a guessed zero.
   - For Claude, read the seat's own session transcript, or its JSON output, per the survey. This replaces the null
     stub (`usage-parsers.mjs:126`).
2. Settlement calls the Rust parser through the chosen door, bounded in time. A failure records
   `reason: parser-unavailable` and never changes the run outcome.
3. Delete `usage-parsers.mjs`. Retire its test, because its cases move to the Rust tests (principle 8: one owning
   proof).
4. Rust tests: one per CLI, using the survey's real samples as fixtures, plus a reason-when-absent case.

## Verify
- `cargo test -p fgos-execution` and `node scripts/run-tests.mjs test/runner/dispatch` are green.
- `rg -n usage-parsers src test` returns nothing.

## Rollback
Revert the phase commit, which restores the Node parsers.
