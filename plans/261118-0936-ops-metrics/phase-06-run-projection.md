# Phase 6 — Run and unit projections

## Inputs
- Phase 1 (record and registry), phase 3 (the new summary fields) and phase 4 (query).
- `packages/run-result/rust/src/lib.rs:696-754` (`run_observation`) and `packages/run-result/rust/src/unit_summary.rs`.
- `apps/fgos/src/wiring/metrics_sources.rs`.
- DISCUSSION §6.0.1 (the example `fgos.run.attempt` record).

## Footprint
`packages/run-result/rust/**`, `packages/run-result/contracts/observe-kinds.json`,
`apps/fgos/src/wiring/metrics_sources.rs`.

## Steps
1. Declare the run-result kinds in `packages/run-result/contracts/observe-kinds.json` (OM-D12):
   - `fgos.run.attempt` is a span with:
     - refs to `plan` and `phase`;
     - attrs `gen_ai.provider.name`, `gen_ai.request.model`, `fgos.account.id`, `fgos.executor.id`, `fgos.persona`,
       `fgos.outcome`, `fgos.failure.code`, `fgos.fallback`, `fgos.seat.id` (seat/round/attempt key) and `fgos.seat.role`.
       The supervisor plan's `lane-freed` trigger reads the span's `endTs`, the machine in `origin.host` and the plan
       ref (a lane is a live worker seat counted per machine; a lane id, if one is minted later, is that plan's own attr);
     - measures for tokens and `fgos.duration`.
   - `fgos.unit.settled` is a span with attrs `fgos.workflow`, `fgos.pattern`, `fgos.outcome` and
     `fgos.infrastructure`, and measures `fgos.attempts` and `fgos.seats`.
   - Every record gets a deterministic id from the unit run id plus the seat/round/attempt, and `basis: derived`.
2. Project both kinds from the unit summaries and run results the crate already scans. Copy facts only; recompute
   nothing that Execution owns (spec § "Unit summaries — writer-owned contract").
3. Register the projection in `metrics_sources.rs` as a source of those kinds.
4. `metrics runs` and `metrics discussions` keep their output. Their new dimensions come from `metrics query`.
   Turning these verbs into presets is left as a backlog row (phase 12).
5. Tests in the crate: a fixture unit summary with each new field projects one record with the expected
   attrs/measures/refs, and a summary without the fields projects records that lack them (counted by `coverage`).

## Verify
- `cargo test -p fgos-run-result -p fgos-observe` is green.
- Against the main checkout: `npm run fgos:dev -- metrics query --kind fgos.run.attempt --since -2d --by
  gen_ai.provider.name --agg count --dir /home/vantt/projects/forgent` returns rows.

## Rollback
Revert the phase commit.
