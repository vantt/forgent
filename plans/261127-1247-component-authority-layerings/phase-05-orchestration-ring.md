# Phase 5: Orchestration ring and folded guards

Declare `orchestration-ring` (CAS-D11) with a value on every component, check it with
`order-downward` plus a cross-check against `stack`, and fold the hand-written layering guards
into the layerings that own them (CAS-D5).

## Inputs

- DISCUSSION §3 rows 15, 22, 23; CAS-D11, CAS-D13.
- The `meaning` of each row in `components.yaml` (for example `work-driver`, `supervision`).
- `test/architecture.test.mjs`: "tầng thấp không import Dispatch" (275-288) and the A4 guards
  (912-1060: `a4GuardedFiles`, `WORK_LAYER_MODULES`, `findWorkLayerReach`).

## Files this phase may write

`packages/component-authority/model/layers.yaml`, `packages/component-authority/model/components.yaml`,
`test/architecture.test.mjs`, and the rendered docs listed in plan.md (regenerated only).

## Steps

1. Add the `orchestration-ring` layering row: values `surface`, `strategic`, `activation`,
   `domain`, `workflow`, `execution`, `foundation`, each with the meaning of DISCUSSION §3 row 23
   (the product names Work, Workflow, Execution go in the meanings); rules `[order-downward]`;
   granularity `component`; source `declared`; `distinctFrom` naming `stack`.
2. Give every component a value from its meaning, never from its tier. Where tier and ring
   disagree (`work-driver`, `supervision`), write the reason into the row's `reason` when it is
   not obvious. Use `exceptions` where a directory sits in another ring (for example
   `src/runner/dispatch/`, `src/runner/execution/`, if they are not subcomponents).
3. Cross-check test: for any two components, ring above with stack below (or the reverse) is a
   wrong declaration; one fixture proves the check catches it.
4. Fold the guards. The "lower tiers do not import Dispatch" test is owned by `stack`
   `order-downward`; give `src/run-supervisor/steps/` its stack value through `exceptions` if
   its carve-out is still needed. The A4 Work-layer reach guard and the "zero imports from
   state/ or workflow/" guard are owned by `orchestration-ring` `order-downward` (execution and
   workflow never reach strategic or activation). Delete `WORK_LAYER_MODULES`, the `lower` list
   and their tests; keep the A4 domain and step literal guard, which is not a layering rule.
   Move the A4 fixture cases (dynamic import, `require`, one-hop re-export, absolute path,
   `file:` URL) onto the `order-downward` fixture so no behaviour loses its proof.
5. Regenerate the views.

## Verify

`node --test test/architecture.test.mjs`, `cargo test -p component-authority` and
`npm run fgos:dev -- authority render --check` pass.
`rg -n "WORK_LAYER_MODULES" test/architecture.test.mjs` prints nothing.

## Rollback

Revert the phase commits; the old guards come back with them.
