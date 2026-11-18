# Phase 8: Work, plan-check and plan-lint adapters

> This phase belongs to the door plan `plans/261119-0528-resource-check-door-and-adapters`. Phases 1 to 7 and 7c are in plan A (`plans/261119-0030-resource-referee-graph-write-scope-stack`), whose decisions 1 to 28 apply.

## Inputs

- The addon bindings and ABI clause from phase 7, the door from phase 7b, and the recorded evidence from phase 4.
- `src/state/graph-metrics.mjs`, `graph-harness.mjs`, `store.mjs` (`footprintConflicts`, `computedSchedule`, `graphMetrics`), `src/intake/plan.mjs` (decompose footprint gate, advisory), `scripts/plan-contract-check.mjs`, `src/report/capability-plan-lint.mjs`.
- Consumers that must keep working unchanged: `src/state/impact.mjs` (`connectedComponents`) and `scripts/verify-fanout-overlap.mjs` (`footprintOverlapAmong`).
- `docs/architecture-manifest.json` and `test/architecture.test.mjs` (layer rules), and `src/state/hot-lock.mjs:25` (the pattern for a domain module that goes through the kernel door).
- Owning tests: `test/state/graph-metrics.test.mjs`, `test/state/frontier.test.mjs`, `test/intake/plan.test.mjs`, `test/scripts/plan-contract-check.test.mjs`, `test/cli/fgos-intake-*.test.mjs`. Tests that need the new addon build and point at it through `ensureGitAddon()` of `test/helpers/git-addon.mjs`.

## Files it may write

`src/state/graph-metrics.mjs`, `src/state/graph-harness.mjs`, `src/state/graph-adapter.mjs` (new), `src/state/store.mjs`, `src/intake/plan.mjs`, `src/report/capability-plan-lint.mjs`, `scripts/plan-contract-check.mjs`, `docs/architecture-manifest.json`, `test/state/**`, `test/scripts/**`, `test/intake/plan.test.mjs`. The verb descriptions in `command-registry.mjs` belong to phase 7b.

## Steps

1. Add `src/state/graph-adapter.mjs` in the `domain` layer: it maps a folded Work view to nodes, edges and claims, calls the packages in process through the kernel door `src/native/door.mjs` only, and maps the answers back to the existing return shapes (`{a, b, shared, suggestions}`, waves, cycles). Add its row to `docs/architecture-manifest.json`. A missing namespace surfaces as the named error of phase 7, with no fallback.
2. The export names of `graph-metrics.mjs` stay and are the adapter surface (decision 18); point `footprintOverlap`, `footprintOverlapAmong`, `computeSchedule`, `detectCycles`, `criticalPath` and `connectedComponents` at the adapter and delete their old bodies in the same change. Work-status metrics (top unblock, stale-blocked, stale-doing, goal tiers) stay where they are. The decompose gate keeps calling `footprintOverlapAmong` and stays advisory.
3. Replace `overlaps` in the plan-check script and `pathsOverlap` in plan-lint with the packages; keep their error texts, keep "empty footprint is an error" in the plan check, make the plan check refuse a footprint entry that does not canonicalize at `ready` (decision 17), and keep the plan-lint cycle message.
4. Move the recorded JS expectations: cases whose outcome changes (containment, glob) get their expected value updated and named in the test title; no case is deleted without naming the test that now owns it. One wiring case per adapter proves a malformed entry conflicts with everything for that item; the owning test is in phase 3.
5. Compare the new verdicts with the old plan-check verdicts recorded in phase 4 over the snapshot, not with the door; every difference is named, and each goes in the CHANGELOG text of phase 9.
6. Record before and after outcomes of `fgos conflicts`, `schedule`, the decompose gate and `verify-fanout-overlap.mjs` on real Work views, and say whether the verifier's exit code can change. Add the Work-side case from acceptance criterion 4.
7. Run the census scan without `--write-census` and list the changed entries against this phase's footprint.

## Verify

The owning test files above, in this order, plus `node --test test/architecture.test.mjs`. `npm test` is read only to confirm the single allowed failure, `test/git/one-door.test.mjs`, until the final landing. `rg "footprintOverlapAmong|pathsOverlap" src scripts` shows only the adapter surface, the decompose gate and `verify-fanout-overlap.mjs`.

## Rollback

Revert the commit; the packages and the door stay and nothing else depends on this phase.
