# Phase 8: Work, plan-check and plan-lint adapters

> This phase belongs to the door plan `plans/261119-0528-resource-check-door-and-adapters`. Phases 1 to 7 and 7c are in plan A (`plans/261119-0030-resource-referee-graph-write-scope-stack`), whose decisions 1 to 29 apply.

## Inputs

- The addon bindings and ABI clauses of plan A (phase 7) and the recording of the old plan-check verdicts (plan A, phase 1, `reports/plan-check-verdicts.json`).
- `src/state/graph-metrics.mjs`, `graph-harness.mjs`, `store.mjs` (`footprintConflicts`, `computedSchedule`, `graphMetrics`), `src/intake/plan.mjs` (decompose footprint gate, advisory), `scripts/plan-contract-check.mjs`, `src/report/capability-plan-lint.mjs`.
- Consumers that must keep working unchanged: `src/state/impact.mjs` (`connectedComponents`) and `scripts/verify-fanout-overlap.mjs` (`footprintOverlapAmong`).
- `docs/architecture-manifest.json` (layer rules, and the `door` entries such as `hot-lock` at lines 268-284) and `test/architecture.test.mjs`, and `src/state/hot-lock.mjs:25` (the pattern for a domain module that goes through the kernel door).
- Owning tests: `test/state/graph-metrics.test.mjs`, `test/state/frontier.test.mjs`, `test/intake/plan.test.mjs`, `test/scripts/plan-contract-check.test.mjs`, `test/cli/fgos-intake-*.test.mjs`. Tests that need the new addon build and point at it through `ensureGitAddon()` of `test/helpers/git-addon.mjs`.

## Files it may write

`src/state/graph-metrics.mjs`, `src/state/graph-harness.mjs`, `src/state/graph-adapter.mjs` (new), `src/state/store.mjs`, `src/intake/plan.mjs`, `src/report/capability-plan-lint.mjs`, `scripts/plan-contract-check.mjs`, `docs/architecture-manifest.json`, `test/state/**`, `test/scripts/**`, `test/intake/plan.test.mjs`. The verb descriptions in `command-registry.mjs` belong to phase 7b.

## Steps

1. Add `src/state/graph-adapter.mjs` in the `domain` layer: it maps a folded Work view to nodes, edges and claims, calls the packages in process through the kernel door `src/native/door.mjs` only, and maps the answers back to the existing return shapes (`{a, b, shared, suggestions}`, waves, cycles). A truncated answer throws; nothing treats a partial answer as complete (plan A decision 7). Add the adapter's row to `docs/architecture-manifest.json`. A missing namespace surfaces as the named error of plan A's phase 7, with no fallback.
2. The export names of `graph-metrics.mjs` stay and are the adapter surface (plan A decision 18); point `footprintOverlap`, `footprintOverlapAmong`, `computeSchedule`, `detectCycles`, `criticalPath` and `connectedComponents` at the adapter and delete their old bodies in the same change. Work-status metrics (top unblock, stale-blocked, stale-doing, goal tiers) stay where they are. The decompose gate keeps calling `footprintOverlapAmong` and stays advisory.
3. Replace `overlaps` in the plan-check script and `pathsOverlap` in plan-lint with the packages; keep their error texts, keep "empty footprint is an error" in the plan check, make the plan check refuse a footprint entry that does not canonicalize at `ready`, make it error when the package returns `truncated`, and keep the plan-lint cycle message.
4. Move the recorded JS expectations: cases whose outcome changes (containment, glob) get their expected value updated and named in the test title; no case is deleted without naming the test that now owns it. One wiring case per adapter proves a malformed entry conflicts with everything for that item and a truncated answer fails closed; the owning tests are in plan A.
5. Compare the new plan-check verdicts with the old verdicts recorded in plan A's phase 1 over the snapshot, not with the door; every difference is named and goes in the CHANGELOG text of phase 9.
6. Add a `door` entry for the overlap rule to `docs/architecture-manifest.json` (decision 29): patterns for the known copy names, the pinned JS port and `globsMeet` allow-listed as debt with a `retiredBy`, so a new copy fails `test/architecture.test.mjs`.
7. Record before and after outcomes of `fgos conflicts`, `schedule`, the decompose gate and `verify-fanout-overlap.mjs` on real Work views, and say whether the verifier's exit code can change. Add the Work-side case of acceptance criterion 3.
8. List the census entries this phase changed against its footprint (plan A decision 14).

## Verify

The owning test files above, in this order, plus `node --test test/architecture.test.mjs`. `npm test` is read only to confirm that the only failures are `test/git/one-door.test.mjs` and `test/setup/git-mutation-census.test.mjs`, until the final landing. `rg "footprintOverlapAmong|pathsOverlap" src scripts` shows only the adapter surface, the decompose gate and `verify-fanout-overlap.mjs`.

## Rollback

Revert the commit; the packages and the door stay and nothing else depends on this phase.
