# Phase 4 — Query engine and named definitions

Layer 1, second half. Rust.

## Inputs
- DISCUSSION §6.0.1 (the query grammar and the operations the deferred definitions need).
- `docs/discussions/ops-metrics/DISCUSSION.md` §6 E (pace rows) and OM-D11 (question events).
- Phase 1 record and registry types.
- `packages/observe/rust/src/contract.rs` (`ObservationSource`, `Window`).
- `packages/observe/rust/src/time.rs` (instant parsing).

## Footprint
`packages/observe/rust/src/query/**`, `packages/observe/rust/src/metrics_cli/query.rs`,
`packages/observe/rust/src/metrics_cli/mod.rs`, `packages/observe/rust/src/lib.rs`,
`packages/observe/rust/tests/query_*.rs`, `test/fixtures/observe/query/**`.

## Steps
1. One query model, used by the Rust API and the CLI alike:
   - Filters: `kind` (one or many), `where` (`=`, `!=`, `in`, `exists`), `ref <kind>:<id>`, and `since`/`until`
     (absolute RFC3339, or relative such as `-30m` or `-7d`).
   - Grouping: `by <attr…>` and `bucket hour|day|week`.
   - Aggregates: `agg count | sum:<m> | p50:<m> | p90:<m> | min:<m> | max:<m> | max:ts | span:<sum of endTs-ts>`.
   - Joins: `join ref:<kind>` takes the measures of records sharing a ref, for example tokens of the sessions a tick
     references, or tokens of the runs of a plan.
2. Sources: stored records (phase 1 store) plus every `ObservationSource` that the composition root injects. Each
   source declares the kinds it projects, and the query reads only the sources whose kinds match.
3. Result envelope `fgos.v1`:
   - rows hold the group values, the bucket and the aggregates;
   - `insufficient: true` marks a group under the definition's minimum sample;
   - `coverage` counts the records that lack a grouped attr;
   - `unmeasured: <reason>` appears when a declared source produced nothing.
4. Named definition file `*.query.json`: `{name, query, minSample?, threshold?: {measure|agg, op, value | configKey},
   row?: {kind, reason, nextCommand}}`. Run it with `fgos metrics query --def <file>`. A threshold read from config
   goes through the config door.
5. Tests own the grammar.
   - Cover each operator once, including the relative window under a fixed clock and a join.
   - Using test-local declarations (no Observe source change), run:
     - `watcher-overdue`: the newest `fgos.watcher.tick` is older than k × `fgos.watcher.interval` while
       `fgos.plans.running > 0`;
     - `supervisor-idle-burn`: no plan running or ready, and the sessions of `fgos.supervisor.wake` spans spent
       tokens in the window (join through the session ref);
     - a wake trigger, `plan-became-ready`: `fgos.plan.status` records with status `ready` since a given instant;
     - an owner-wait definition: `question.answered.ts - question.asked.ts` joined by ref.

## Verify
`cargo test -p fgos-observe` is green, and `npm run fgos:dev -- metrics query --help` lists the grammar.

## Rollback
Revert the phase commit. The new verb disappears, and the existing verbs are unchanged.
