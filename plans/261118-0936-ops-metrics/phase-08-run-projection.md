# Phase 8 — Run, unit and verify projections

## Inputs
- Phases 1, 3, 5 and 6.
- `packages/run-result/rust/src/lib.rs:696-754` (`run_observation`), `unit_summary.rs`.
- `packages/run-result/contracts/unit-summary.read.v3.json:50-63` (the `verify` block).
- `apps/fgos/src/wiring/metrics_sources.rs` and `observe_declarations.rs` (phase 1).

## Footprint
`packages/run-result/rust/src/lib.rs`, `packages/run-result/rust/src/unit_summary.rs`,
`packages/run-result/rust/src/projection/**`, `packages/run-result/rust/observe-kinds.json`,
`packages/run-result/rust/tests/projection_*.rs`, `apps/fgos/src/wiring/metrics_sources.rs`,
`apps/fgos/src/wiring/observe_declarations.rs`.

## Steps
1. Declare the run kinds in `observe-kinds.json` (OM-D12). The crate embeds the file and lists it in
   `observe_declarations.rs`.
   - `fgos.run.attempt`: a span from start to settle.
     - refs: `plan`, `phase`.
     - attrs: `gen_ai.provider.name`, `gen_ai.request.model`, `fgos.account.id`, `fgos.executor.id`, `fgos.persona`,
       `fgos.seat.id`, `fgos.seat.role`, `fgos.outcome`, `fgos.failure.code`, `fgos.fallback`.
     - measures: tokens, `fgos.duration`.
     - `origin.host` is the machine. The supervisor plan's `lane-freed` reads `endTs`, `origin.host` and the plan
       ref.
   - `fgos.unit.settled`: a span.
     - attrs: `fgos.workflow`, `fgos.pattern`, `fgos.outcome`, `fgos.infrastructure`.
     - measures: `fgos.attempts`, `fgos.seats`.
     - refs: plan, phase.
   - `fgos.unit.verify`: a span.
     - attrs: `fgos.verify.outcome`, `fgos.verify.how`, `fgos.verify.round`.
     - measure: `fgos.duration`.
     - ref: the unit and plan/phase.
     - Driving measure 7 and the re-check part of measure 2 need it.
   - Every record has a deterministic id (unit run id + seat/round/attempt) and `basis: derived`.
2. Implement a `RecordSource` that projects those kinds from the summaries and results the crate already scans.
   Facts are copied only; nothing that Execution owns is recomputed. Register it in `metrics_sources.rs`.
3. Move `RunResultSource` off v1 `Observation`. Before this phase lands, `metrics runs` and `metrics discussions` are
   read once over the main checkout. After it, both must give identical output.
4. Tests in the crate:
   - a fixture summary with every new field projects the expected records;
   - a summary without the new fields projects records that lack them, counted by `coverage`.

## Verify
- `cargo test -p fgos-run-result -p fgos-observe -p fgos` passes.
- Live: `npm run fgos:dev -- metrics query --kind fgos.run.attempt --since -2d --by gen_ai.provider.name --agg count --dir /home/vantt/projects/forgent`.

## Rollback
Revert the phase commit.
