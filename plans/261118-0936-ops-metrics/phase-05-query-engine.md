# Phase 5 — Query engine

Layer 1, read side. Rust. The grammar must express every detection planned or deferred so far without a code change
(OM-D10, OM-D11).

## Inputs
- DISCUSSION §6.0.1 (the grammar), §6 E (the detections and the triggers).
- Phase 1 (`RecordSource`, the registry) and `packages/observe/rust/src/time.rs`.

## Footprint
`packages/observe/rust/src/query/**`, `packages/observe/rust/src/lib.rs`, `packages/observe/rust/tests/query_*.rs`,
`test/fixtures/observe/query/**`.

## Steps
1. The query model:
   - **Filters:** `kind` (one or many); `where` (`=`, `!=`, `in`, `exists`, numeric `<`/`>`); `ref <kind>:<id>`;
     `since`/`until`, absolute RFC3339 or relative such as `-30m`.
   - **Grouping:** `by <attr…>`; `bucket hour|day|week`; `latest-per <subject|ref kind>`, which keeps the newest record
     per key, for example the current state of each head or plan.
   - **Aggregates:** `agg count | sum:<m> | p50:<m> | p90:<m> | min:<m> | max:<m> | max:ts | age:ts | span`.
   - **Group filter (having):** compares an aggregate with a constant, with a parameter (filled by the caller, phase
     7), or with k × another aggregate or measure. The k × form is what `watcher-overdue` needs.
   - **Joins:** `join ref:<kind>`, which pulls in measures of records sharing a ref (for example tokens of the
     sessions a wake references). `without <kind> on ref:<kind> within <window>` is an anti-join, for example a plan
     with no activity or run in N minutes.
2. Sources: every `RecordSource` that the caller passes in. Each source declares its kinds, and only matching sources
   are read.
3. Result rows hold: the group values, the bucket and the aggregates; `insufficient` when a group is under the minimum
   sample; `coverage`, the count of records missing a grouped attr; and `unmeasured: <reason>` when a required kind is
   undeclared or has no source.
4. Tests run each operator once on a fixed clock. Using test-local declarations and in-memory sources, they also run
   these as plain queries, with no code named after them:
   - `head-gone`: the latest head state is `gone`, and the head is not retired;
   - `plan-no-progress`: the latest plan status is `running`, with no `fgos.plan.activity` and no `fgos.run.attempt`
     ref within N;
   - `lane-freed`: attempt spans that ended since a given time, by `origin.host`;
   - `plan-became-ready`;
   - `watcher-overdue`: `age:ts` of the newest tick is more than k × `fgos.watcher.interval` while
     `fgos.plans.running > 0`;
   - `supervisor-idle-burn`: wake sessions spent tokens while no plan is ready or running (a join);
   - owner wait: answered.ts − asked.ts, joined by question ref.

## Verify
`cargo test -p fgos-observe` is green.

## Rollback
Revert the phase commit.
