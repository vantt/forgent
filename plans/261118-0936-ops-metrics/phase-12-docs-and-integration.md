# Phase 12 — Docs, backlog and integration gate

The last serial phase. It merges every branch and gates the combined tree.

## Inputs
- Every phase report.
- `docs/platform/observe/spec.md` and `docs/platform/observe/decisions/observe-component-architecture.md`.
- `docs/platform/governance.md#decision-scope-to-holder-table`.
- `docs/backlog.md`.
- `CHANGELOG.md`.
- `packages/distribution/contracts/doctor-registry.v1.json`.

## Footprint
`docs/platform/observe/**`, `docs/backlog.md`, `CHANGELOG.md`,
`packages/git/contracts/mutation-census.v1.json` (regenerated), `packages/distribution/contracts/doctor-registry.v1.json`.

## Steps
1. Merge the phase branches in wave order. Regenerate the mutation census; never hand-merge it.
2. Spec:
   - Write the record contract v2, the registry and declarations at the place of use, the query grammar and the
     definition files, the write door's fail-open rule and health counters, and the friction attrs.
   - Add a decision-history entry with the narrative of OM-D1..D12 and the rejected options.
   - Record the shared names version (OTel GenAI) and the alias rule.
3. Backlog:
   - Fold p-s5mliyp335, p-mvc3d54cda and p-7nqygnztum as done. Fold the measurement part of p-24dxhwq7zr.
   - New rows, with ids from `fgos identity mint backlog`:
     - sources for driving measures 4, 5 and 6;
     - moving the case, eval, snapshot and invocation-faults stores onto the contract;
     - turning `metrics runs`, `discussions` and `friction rank` into query presets;
     - OTLP ingestion from agent CLIs;
     - money and price tables (OM-D2).
4. Doctor: add one read-only pointer row for write-door health ("N rejected/errors since <ts>, run `fgos metrics
   query --kind fgos.observe.health`"). It only warns.
5. Add a user-visible line to CHANGELOG `## [Unreleased]`.
6. Gate on the combined tree:
   - `npm test` (read both the ERROR lines and the fail count);
   - `cargo test --workspace`;
   - `cargo clippy --workspace -- -D warnings`;
   - the msvc and `aarch64-apple-darwin` compile checks;
   - `node scripts/plan-contract-check.mjs --plan plans/261118-0936-ops-metrics`.
7. After the gate passes, delete the old friction shards as the last step of the migration.

## Verify
Every command in step 6 is green, and the plan's acceptance criteria 1-8 are checked one by one in the phase report.

## Rollback
Revert the merge commit. Keep the old friction shards until this phase is green.
