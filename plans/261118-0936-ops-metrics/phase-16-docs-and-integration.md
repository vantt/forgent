# Phase 16 — Docs, backlog, doctor and integration gate

This is the final serial phase. It merges every branch and gates the combined tree.

## Inputs
- Every phase report.
- `docs/platform/observe/spec.md` and `docs/platform/observe/decisions/observe-component-architecture.md`.
- `docs/platform/governance.md#decision-scope-to-holder-table`.
- `docs/backlog.md` and `CHANGELOG.md`.
- `packages/distribution/contracts/doctor-registry.v1.json`. The observe rows today are `observe-dir-writable` and
  `observe-host-resolvable`, around lines 737-744.
- `apps/fgos/src/wiring/doctor/observe.rs`.

## Footprint
`docs/platform/observe/**`, `docs/backlog.md`, `CHANGELOG.md`, `packages/git/contracts/mutation-census.v1.json`
(regenerated), `packages/distribution/contracts/doctor-registry.v1.json`, `apps/fgos/src/wiring/doctor/observe.rs`.

## Steps
1. Merge the phase branches in wave order. Regenerate the mutation census and the command routes; never hand-merge
   them.
2. Spec:
   - Write the current state:
     - record contract v2;
     - shared names and the OTel version, with the alias rule;
     - declarations at the place of use and how they are loaded;
     - the query grammar and definition files;
     - the write door's fail-open rule and health counters;
     - the friction attrs.
   - Add a decision-history entry with the narrative of OM-D1..D14 and the rejected options.
3. Backlog:
   - Fold p-s5mliyp335, p-mvc3d54cda and p-7nqygnztum as done, and the measurement part of p-24dxhwq7zr.
   - Open new rows, minting each id with `fgos identity mint backlog`:
     - sources for driving measures 4, 5 and 6;
     - retire v1 `Observation`/`ObservationSource` once `WorkSource` moves;
     - move the case, eval, snapshot and invocation-faults stores onto the contract;
     - turn `metrics runs` and `metrics discussions` into query presets;
     - keep plan measures after run-dir pruning (a snapshot when a plan reaches `done`, linked to p-tslryr3buq);
     - OTLP ingestion from agent CLIs;
     - money and price tables (OM-D2).
4. Doctor: add one warn-only pointer row: "N rejected/errors since <ts>; run `fgos metrics query --kind
   fgos.observe.health`". Also show "friction store not migrated; run `fgos friction migrate --to-records`" while old
   shards remain. Neither row fails or repairs.
5. CHANGELOG `## [Unreleased]`: one user-visible line.
6. Gate on the combined tree:
   - `npm test` (read both the ERROR lines and the fail count);
   - `cargo test --workspace`;
   - `cargo clippy --workspace -- -D warnings`;
   - msvc and `aarch64-apple-darwin` compile checks;
   - `node scripts/plan-contract-check.mjs --plan plans/261118-0936-ops-metrics`.
7. After the gate passes, delete the old friction shards, which is the last step of the migration.

## Verify
- Every command in step 6 is green.
- Acceptance criteria 1–8 are checked one by one in the phase report.

## Rollback
Revert the merge commit. Old friction shards stay until this phase is green.
