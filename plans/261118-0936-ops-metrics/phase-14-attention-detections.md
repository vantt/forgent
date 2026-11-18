# Phase 14 — Attention detections as definitions

The detection logic is the query engine, in Rust. The Node view only wires it (OM-D3, OM-D10). The supervisor plan's
watcher runs the same definition files on its own timer. The actions it takes per row kind belong to the watcher,
never to this view (OM-D1).

## Inputs
- DISCUSSION §6 E, OM-D7, OM-D10.
- `src/runner/dispatch/attention-view.mjs` (82 lines; rows assume `runId`, sort at :79; contract `attention-view` v1).
  Only `src/verbs/dispatch/inspect.mjs:57` may import it.
- The owning test is `test/runner/dispatch-runtime-inspect.test.mjs` (around :306).
- Phase 7 (`--def`, config parameters), phase 8 (`fgos.run.attempt`) and phase 11 (`fgos.head.state`,
  `fgos.plan.status`, `fgos.plan.activity`).
- The existing config section: `core/config-standard/dispatch.yaml`, `core/config-schema/dispatch.schema.yaml` and the
  config golden fixtures `packages/config/contracts/fixtures/*`. `dispatch` is already in
  `packages/config/rust/src/bundle.rs`, so no new section is needed.

## Footprint
`src/runner/dispatch/attention-view.mjs`, `src/verbs/dispatch/inspect.mjs`, `core/attention/**`,
`core/config-standard/dispatch.yaml`, `core/config-schema/dispatch.schema.yaml`, `packages/config/contracts/fixtures/**`,
`test/runner/dispatch-runtime-inspect.test.mjs`.

## Steps
1. Add the config key `dispatch.attention.planNoProgressMinutes`, default 60 (OM-D7), with its schema. Regenerate or
   extend the golden fixtures.
2. Add definitions under `core/attention/definitions/`:
   - `head-gone`: the latest `fgos.head.state` per head is `gone`.
   - `plan-no-progress`: the latest `fgos.plan.status` is `running`, with no `fgos.plan.activity` or
     `fgos.run.attempt` on the plan ref within `params.minutes ← dispatch.attention.planNoProgressMinutes`.
3. Attention view contract v2:
   - `runId` becomes optional and `subject` is added. Rows sort by instant, then subject.
   - The view runs every file in `core/attention/definitions/` with one `fgos metrics query --def <dir>` host call, and
     appends the rows.
   - Run-derived rows are unchanged.
   - A definition added later, such as pace, is picked up with no code change.
4. Tests extend `dispatch-runtime-inspect.test.mjs`:
   - fixture records give one `head-gone` row and one `plan-no-progress` row;
   - a test-local extra definition appears with no code change.

## Verify
- `node scripts/run-tests.mjs test/runner/dispatch-runtime-inspect.test.mjs` passes.
- `cargo test -p fgos-config` passes.
- Live: `npm run fgos:dev -- dispatch inspect --attention --since -1d`.

## Rollback
Revert the phase commit. This restores view contract v1 and removes the key.
