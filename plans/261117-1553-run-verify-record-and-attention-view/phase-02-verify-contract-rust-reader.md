# Phase 2: Verify in the unit-summary contract and the Rust reader

## Inputs (read first)
- `plan.md` "Decision taken" (shape) and the owner question 1 (default: v3, `verify` optional).
- `packages/run-result/contracts/unit-summary.read.v3.json` (draft-07 schema; `infrastructure`, `refused` are the model).
- `packages/run-result/rust/src/unit_summary.rs` (`valid_summary`, `infrastructure_facts`, `refused_seat`).
- `packages/run-result/rust/tests/unit_summary.rs` and `packages/run-result/contracts/fixtures/README.md`.

## Files this phase may write
`packages/run-result/contracts/unit-summary.read.v3.json`, `packages/run-result/rust/src/unit_summary.rs`,
`packages/run-result/rust/tests/unit_summary.rs`. Also regenerates the census file in its commit (hot file).

## Steps
1. Schema: add optional property `verify` to the v3 definition: either `{ran:false, reason:string}` or
   `{ran:true, command:string, outcome: enum[pass,findings,timeout,not-run], exit: integer|null, passed:boolean, durationMs:integer>=0, how:string, outputDigest:string}`.
   Do not add it to `required`. Say in its description that an absent key means "not recorded" (never a pass).
2. Rust: add `verify_facts(value)` returning true when the key is absent, or is one of the two shapes; call it from
   `valid_summary`. A malformed `verify` makes the summary `invalid-contract`, like a malformed `refused`.
3. Rust tests (extend the file that owns summary validity; do not copy cases): a summary with each shape reads; one with
   `verify: {ran:true}` missing `passed` is `invalid-contract`; an existing v3 and v2 fixture without `verify` still reads.
4. Regenerate the census.

## Verify
- `cargo test -p run-result` passes.
- `node --test test/runner/run-result-v3-reader.test.mjs` passes (Node reader of the same contract).
- `node scripts/git-one-door-scan.mjs --write-census` leaves `git diff --stat` showing only the census digest change.

## Rollback
`git revert` the phase commit. A summary already written with `verify` stays valid to the reverted reader because it
ignores keys it does not name.
