# Phase 10 — Attention detections as definitions

The detection logic is the generic query engine (Rust). The Node view only wires the definitions to it (OM-D3, OM-D10).

## Inputs
- DISCUSSION §6 E, OM-D7, OM-D10.
- `src/runner/dispatch/attention-view.mjs` (82 lines): rows assume `runId` (:79 sort), and its contract is
  `attention-view` v1. Only `src/verbs/dispatch/inspect.mjs:57` may import it.
- Phase 4 (definition files and `--def`) and phase 8 (`fgos.head.state`, `fgos.plan.status`,
  `fgos.plan.activity`).
- Phase 6 (`fgos.run.attempt` with a plan ref).
- The config door: `core/config-standard/*.yaml` with `core/config-schema/*.schema.yaml`.

## Footprint
`src/runner/dispatch/attention-view.mjs`, `src/verbs/dispatch/inspect.mjs`, `core/attention/**`,
`core/config-standard/attention.yaml`, `core/config-schema/attention.schema.yaml`,
`test/runner/dispatch/attention-view*.test.mjs`.

## Steps
1. Add the config key `attention.planNoProgressMinutes`, default 60, with its schema (OM-D7).
2. Definitions, one file each under `core/attention/definitions/`:
   - `head-gone`: a placed head or lead whose `fgos.head.state` is `gone` and not retired.
   - `plan-no-progress`: a plan whose newest `fgos.plan.status` is `running`, with no `fgos.plan.activity` and no
     `fgos.run.attempt` referencing it within `attention.planNoProgressMinutes`.
3. Attention view contract v2:
   - A row's `runId` becomes optional, and it gains `subject`.
   - Sorting is by instant, then subject.
   - The view loads every definition in `core/attention/definitions/`, runs each through the phase-4 door in one host
     call, and appends the rows.
   - A definition the supervisor plan adds later (pace) is picked up without a code change.
   - The supervisor plan's watcher runs the same definition files on its own timer through `fgos metrics query
     --def`; the actions it takes per row kind are its own (config), never this view's.
   - Run-derived rows stay as they are.
4. Tests extend the owning attention-view test file:
   - Fixture records give one `head-gone` row and one `plan-no-progress` row.
   - A test-local third definition directory shows that an added definition appears with no code change.

## Verify
- `node scripts/run-tests.mjs test/runner/dispatch/attention-view.test.mjs` is green.
- Live: `npm run fgos:dev -- dispatch inspect --attention --since -1d`.

## Rollback
Revert the phase commit, which brings back view contract v1.
