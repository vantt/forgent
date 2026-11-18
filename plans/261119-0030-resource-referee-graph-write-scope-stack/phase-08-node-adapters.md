# Phase 8: Work, plan-check and plan-lint adapters

## Inputs

- `reports/facts.md` and the addon bindings from phases 1 and 7; the loader `src/git/native.mjs`.
- `src/state/graph-metrics.mjs`, `graph-harness.mjs`, `store.mjs` (`footprintConflicts`, `computedSchedule`, `graphMetrics`), `src/intake/plan.mjs` (decompose footprint gate, advisory), `scripts/plan-contract-check.mjs`, `src/report/capability-plan-lint.mjs`.
- Consumers that must keep working unchanged: `src/state/impact.mjs` (`connectedComponents`) and `scripts/verify-fanout-overlap.mjs` (`footprintOverlapAmong`).
- Owning tests: `test/state/graph-metrics.test.mjs`, `test/state/frontier.test.mjs`, `test/intake/plan.test.mjs`, `test/scripts/plan-contract-check.test.mjs`, `test/cli/fgos-intake-*.test.mjs`.

## Files it may write

`src/state/graph-metrics.mjs`, `src/state/graph-harness.mjs`, `src/state/store.mjs`, `src/intake/plan.mjs`, `src/report/capability-plan-lint.mjs`, `src/cli/command-registry.mjs` (descriptions only), `src/git/native.mjs` (only if a new namespace needs loading), `scripts/plan-contract-check.mjs`, `test/state/**`, `test/scripts/**`, `test/intake/plan.test.mjs`.

## Steps

1. Add one small Work adapter that maps a folded Work view to nodes, edges and claims, calls the packages in process through the addon, and maps the answers back to the existing return shapes (`{a, b, shared, suggestions}`, waves, cycles). The export names of `graph-metrics.mjs` stay and are the adapter surface (decision 18), so `impact.mjs` and `verify-fanout-overlap.mjs` need no change. Work-status metrics (top unblock, stale-blocked, stale-doing, goal tiers) stay where they are.
2. Point `footprintOverlap`, `footprintOverlapAmong`, `computeSchedule`, `detectCycles`, `criticalPath` and `connectedComponents` at the adapter; delete their old bodies in the same change. The decompose gate keeps calling `footprintOverlapAmong` and stays advisory; state in the test which findings it now reports.
3. Replace `overlaps` in the plan-check script and `pathsOverlap` in plan-lint with the packages; keep their error texts, keep "empty footprint is an error" in the plan check, and keep the plan-lint cycle message.
4. Move the recorded JS expectations: cases whose outcome changes (containment, glob) get their expected value updated and named in the test title; no case is deleted without naming the test that now owns it. One named test per replaced copy proves that `**`, `.`, an empty entry and a malformed entry overlap everything (decision 17).
5. Add one parity case over the snapshot corpus of phase 4 comparing the door's verdict with the plan-check script's verdict for every table in it.
6. Add the one Work-side case from acceptance criterion 4.

## Verify

The owning test files above, in this order, then `npm test` only to read the result: `test/git/one-door.test.mjs` is expected red until phase 10 and is named as the only allowed failure. `rg "footprintOverlapAmong|pathsOverlap" src scripts` shows only the adapter surface, the decompose gate and `verify-fanout-overlap.mjs`.

## Rollback

Revert the commit; the packages and the door stay and nothing else depends on this phase.
