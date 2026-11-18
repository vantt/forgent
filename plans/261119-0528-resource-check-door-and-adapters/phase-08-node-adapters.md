# Phase 8: Work, plan-check and plan-lint adapters

> This phase belongs to the door plan `plans/261119-0528-resource-check-door-and-adapters`. Phases 1 to 7 and 7c are in plan A (`plans/261119-0030-resource-referee-graph-write-scope-stack`), whose decisions 1 to 31 apply.

## Inputs

- The addon bindings and ABI clauses of plan A (phase 7) and the recording of the old plan-check verdicts with its runner (plan A, phase 1, `reports/plan-check-verdicts.json` and `reports/run-plan-check.mjs`).
- `src/state/graph-metrics.mjs` (`criticalPath` and `goalScopedCriticalPath` both call the private `longestChain`), `src/state/graph-harness.mjs` (`mergeReadiness` calls `footprintOverlapAmong` at line 144 and `rankImpact` at line 151; `src/verbs/merge/merge.mjs` acts on the ready set), `src/state/store.mjs` (`footprintConflicts`, `computedSchedule`, `graphMetrics`), `src/state/impact.mjs`, `src/intake/plan.mjs` (decompose footprint gate, advisory), `scripts/plan-contract-check.mjs` (its `plain` strips `*`; it does not load the addon from a checkout), `src/report/capability-plan-lint.mjs`, `scripts/verify-fanout-overlap.mjs`, `src/runner/claim-liveness.mjs` (imports `STALE_DOING_DEFAULTS`).
- `docs/architecture-manifest.json` (layer rules, and the `door` entries such as `hot-lock` at lines 268-284), `test/architecture.test.mjs`, and `src/state/hot-lock.mjs:25` (the pattern for a domain module that goes through the kernel door).
- Owning tests: `test/state/graph-metrics.test.mjs`, `test/state/graph-harness.test.mjs`, `test/state/frontier.test.mjs`, `test/intake/plan.test.mjs`, `test/scripts/plan-contract-check.test.mjs`, `test/cli/fgos-read-5.test.mjs` (pins that `conflicts` is empty and the field absent for an item without a footprint), `test/cli/fgos-intake-*.test.mjs`, `test/verbs/merge/`. Tests that need the new addon build and point at it through `ensureGitAddon()` of `test/helpers/git-addon.mjs`.

## Files it may write

`src/state/graph-metrics.mjs`, `src/state/graph-harness.mjs`, `src/state/graph-adapter.mjs` (new), `src/state/store.mjs`, `src/intake/plan.mjs`, `src/report/capability-plan-lint.mjs`, `scripts/plan-contract-check.mjs`, `docs/architecture-manifest.json`, and the test files above. The verb descriptions in `command-registry.mjs` belong to phase 7b.

## Steps

0. Step zero of plan A decision 24. Record a second baseline: run the pre-swap plan-check script through plan A's runner over the same snapshot at this plan's base, so differences caused by other plans are not reported as rule changes.
1. Add `src/state/graph-adapter.mjs` in the `domain` layer: it maps a folded Work view to nodes, edges and claims, calls the packages in process through the kernel door `src/native/door.mjs` only, and maps the answers back to the existing return shapes (`{a, b, shared, suggestions}`, waves, cycles). A truncated answer or a refused oversize input throws a named error; nothing treats a partial answer as complete (plan A decision 7). A missing or empty Work footprint keeps meaning "no claim"; only an entry that does not canonicalize makes that one item conflict with everything (plan A decision 17). Add the adapter's row to `docs/architecture-manifest.json`. A missing namespace surfaces as the named error of plan A's phase 7, with no fallback.
2. The export names of `graph-metrics.mjs` stay and are the adapter surface (plan A decision 18); point `footprintOverlap`, `footprintOverlapAmong`, `computeSchedule`, `detectCycles`, `criticalPath`, `goalScopedCriticalPath` and `connectedComponents` at the adapter and delete their old bodies, `longestChain` included, in the same change. Work-status metrics (top unblock, stale-blocked, stale-doing, goal tiers) stay where they are. The decompose gate keeps calling `footprintOverlapAmong` and stays advisory.
3. Replace `overlaps` in the plan-check script and `pathsOverlap` in plan-lint with the packages. In the script: keep every `*` in a footprint cell and refuse a malformed table as plan A decision 31 says; add `ensureAddonForScript()` at the top, as `scripts/build-skill-wrappers.mjs:15,20` does, so the plain command loads the addon from a checkout; keep its error texts and "empty footprint is an error"; refuse a footprint entry that does not canonicalize at `ready`; error when the package returns `truncated`. Keep the plan-lint cycle message.
4. Move the recorded JS expectations: cases whose outcome changes (containment, glob) get their expected value updated and named in the test title; no case is deleted without naming the test that now owns it. One wiring case per adapter proves a malformed entry conflicts with everything for that item and a truncated answer fails closed; the owning tests are in plan A.
5. Compare the new plan-check verdicts with the second baseline of step 0 over the snapshot, not with the door; every difference is named and goes in the CHANGELOG text of phase 9.
6. Add a `door` entry for the overlap rule to `docs/architecture-manifest.json` (plan A decision 29): patterns for the known copy names, the pinned JS port and `globsMeet` allow-listed as debt with a `retiredBy`, so a new copy fails `test/architecture.test.mjs`.
7. Record before and after outcomes on real Work views of `fgos conflicts`, `fgos schedule`, the decompose gate, merge readiness (`mergeReadiness` ready set and `mergeSets`, with items whose footprints contain one another) and `verify-fanout-overlap.mjs`, and say whether the verifier's exit code or what `fgos merge` merges can change. Add the Work-side case of acceptance criterion 3 and a merge-readiness case in `test/state/graph-harness.test.mjs`.
8. List the census entries this phase changed against its footprint (plan A decision 14).

## Verify

The owning test files above, in this order, plus `node --test test/architecture.test.mjs`. `npm test` is read only to confirm that the only failures are `test/git/one-door.test.mjs` and `test/setup/git-mutation-census.test.mjs`, until the final landing. `footprintOverlapAmong` and `pathsOverlap` have no body outside the adapter surface; the call sites that remain are the importers named in plan A decision 18.

## Rollback

Revert the commit; the packages and the door stay and nothing else depends on this phase.
