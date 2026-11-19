# Phase 06c: runner config loader and run-facts judgements in the pure core

Wave 3. Depends on: 3. Effort 1.5d. Library only. New phase (V5, F6).

## Context

`loadRunnerConfigForDir` (`src/runner/dispatch/config.mjs:316-345` on `f031ab0c8`, file 779 lines; `runner-config-error.mjs` 49) does
more than read the file: retired-key refusal, `refuseGlobalRigorToTier`, `validateRunnerConfigShape` with origin
attribution, `withRunnerOrigins`, `normalizeConfigConfinement`. `src/config/facade.mjs:81` (`readConfig`) has none of these, so a
switch to the facade drops behaviour (V5, RUL104). S5 ported `validateRunnerConfigShape` to
`packages/execution/rust/src/runner_check.rs`. Callers needing the checked config after cutover: Workflow
(`src/workflow/{case-gate,runner,propose,case-start}.mjs`), Work (`bin/fgos-runner.mjs:25`,
`src/runner/{operation-choice,fanout-batch}.mjs`), `src/session-host/head-start.mjs:140-141`, `bin/fgos.mjs`, and the engine.

Workflow's dead-reservation sweep (`reservationDead`, `src/workflow/case-runtime.mjs:74-80`, under the advance hold) reads
`custodyHeld` (`src/runner/execution/custody-door.mjs:41`, a holder-lock holder list on `dispatch-cwd`) and
`unitRunFacts` (`src/runner/execution/unit-run-record.mjs:31-46`: `unit.json` fields plus `unitControllerHeld`, which is
`inspectRunControl` of the run control ledger, `src/run-supervisor/run-lock.mjs:309-318`). Both are reads of files,
lock state and process liveness; `judgeUnitRun` (`:71-85`) likewise. F6 needs their door fixed before phase 18 fixes
the record format (P15).

## Requirements

- `packages/execution/rust/src/runner_config/`: the whole `loadRunnerConfigForDir` composition as a pure function over
  the documents `fgos-config` reads (with their origins): retired keys, global-rigor refusal, `runner_check`,
  origins, confinement normalisation, and the `RunnerConfigError` codes. One copy: the engine (phase 13) and the addon
  (phase 20) both call it; the Node function and `config.mjs` are deleted in phase 21, the callers switch in 20.
- `packages/execution/rust/src/run_facts/`: pure judgements `unit_run_facts(record_bytes, control_inspection)`,
  `judge_unit_run(...)` and `custody_held(holders)` over facts the caller reads; byte-compatible with the Node outputs
  (the shape Workflow reads). The reads themselves are not here (pure crate): the addon `execution` namespace reads
  `unit.json` with `fgos-durable-file`, the control ledger through `fgos-run-supervisor` feature `lease` (phase 05),
  holders through `fgos-holder-lock` (phase 20 wires them).
- Golden vectors under `packages/execution/contracts/core-runner-config/` (config documents with origins -> checked
  config or error code, from the existing config fixtures; the attributed file path keeps the `<root>/.fgos` join that
  Node now takes from `fgosDirFromRoot`, `src/util/fgos-file-registry.mjs`, `691255ad0`) and `packages/execution/contracts/core-run-facts/` (record
  and ledger fixtures from the corpus -> facts), recorded by `test/golden-recorders/core-runner-config.recorder.mjs`;
  tests `packages/execution/rust/tests/core_runner_config.rs`.

## Steps

1. Commit the recorder; record vectors. 2. Red tests. 3. Port; reuse `runner_check` (no second validator). 4. Report.

## Validation

`cargo test -p fgos-execution --test core_runner_config`; clippy, msvc, aarch64-apple-darwin; no `std::fs` in the
new modules.

## Risk and rollback

Risk: an origin attribution or refusal message differs and a doctor or verb message changes. Vectors include every
refusal path of `config.mjs:316-345`. Rollback: revert.
