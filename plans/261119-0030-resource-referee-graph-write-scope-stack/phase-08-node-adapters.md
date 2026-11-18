# Phase 8: Work, plan-check and plan-lint adapters

## Inputs

- `reports/facts.md` from phase 1, which names the way Node calls the Rust packages, and the door from phase 7.
- `src/state/graph-metrics.mjs`, `graph-harness.mjs`, `store.mjs` (`footprintConflicts`, `computedSchedule`, `graphMetrics`), `src/intake/plan.mjs` (decompose footprint gate), `scripts/plan-contract-check.mjs`, `src/report/capability-plan-lint.mjs`.
- Owning tests: `test/state/*graph*`, `test/state/frontier.test.mjs`, `test/scripts/plan-contract-check.test.mjs`, `test/cli/fgos-intake-*.test.mjs`.

## Files it may write

`src/state/graph-metrics.mjs`, `src/state/graph-harness.mjs`, `src/state/store.mjs`, `src/intake/plan.mjs`, `src/report/capability-plan-lint.mjs`, `src/cli/command-registry.mjs` (descriptions only), `scripts/plan-contract-check.mjs`, `test/state/**`, `test/scripts/**`.

## Steps

1. Add one small Work adapter that maps a folded Work view to nodes, edges and claims and maps the packages' answers back to the existing return shapes (`{a, b, shared, suggestions}`, waves, cycles). Work-status metrics (top unblock, stale-blocked, stale-doing, goal tiers) stay where they are.
2. Point `footprintOverlap`, `footprintOverlapAmong`, `computeSchedule`, `detectCycles`, `criticalPath` and `connectedComponents` at the adapter; delete their old bodies in the same change. The decompose gate keeps calling `footprintOverlapAmong`.
3. Replace `overlaps` in the plan-check script and `pathsOverlap` in plan-lint with the packages; keep their error texts, keep "empty footprint is an error" in the plan check, and keep the plan-lint cycle message.
4. Move the recorded JS expectations: cases whose outcome changes (containment, glob) get their expected value updated and named in the test title; no case is deleted without naming the test that now owns it.
5. Add the one Work-side case from acceptance criterion 4.

## Verify

The owning test files above first, then `npm test` alone (no cargo at the same time). `rg "footprintOverlapAmong|function overlaps|pathsOverlap" src scripts` shows only the adapters and the decompose gate.

## Rollback

Revert the commit; the packages and the door stay and nothing else depends on this phase.
