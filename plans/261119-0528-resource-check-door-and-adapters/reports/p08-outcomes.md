# Phase 8 outcomes (Work, plan-check and plan-lint adapters)

Input to the CHANGELOG text of phase 9 and to phase 10. Base: the base of this plan; old behaviour is the tree at that base, new is this phase's tree.

## Step 5: plan-check verdicts, new script against the second baseline

Runner: `plans/261119-0030-resource-referee-graph-write-scope-stack/reports/run-plan-check.mjs --all`, compared with `reports/plan-check-baseline-step0.txt` (same snapshot, 128 plans). Every difference:

| Plan | Old (baseline) | New | Why |
|---|---|---|---|
| `261118-0936-ops-metrics` | no overlap | error: phases 4 and 5 share wave 2 | `packages/observe/rust/tests/store_*.rs` and `query_*.rs`: two globs in one directory. The old rule cut at the first `*` and called them disjoint. This is the case the door exists to catch. |
| `261118-1045-project-supervisor` | no overlap | error: phases 6 and 10 share wave 2 | `packages/run-supervisor/rust/tests/lanes.rs` and `envelope_digest_vectors.rs` against `head_request*.rs`: a file and a glob in one directory. |
| `261119-0528-resource-check-door-and-adapters` (this plan) | no overlap | error: phases 8 and 7b share wave 2 | `test/cli/fgos-intake-*.test.mjs` (phase 8) against `test/cli/unknown-flag-rejection.test.mjs` (phase 7b): a glob and a file in one directory. See "Needs a write outside the scope" below. |
| `261118-1117-external-ui-integration-multica` | `no phase table with a footprint column` | that line is gone (its other errors, missing sections, stay) | A missing table is an error only at `ready` or `running` (mirrors the supervisor reader); the plan is not at either. |

Totals: `plans 128: under contract 15 (failing 1)` becomes `(failing 4)`. No other verdict changed; the legacy counts are identical. Other lanes' plans (`ops-metrics`, `project-supervisor`) are recorded here and in `close.md`, not fixed (plan A decision 30).

Rules that now differ in the script (each has an owning case in `test/scripts/plan-contract-check.test.mjs`): every `*` of a footprint cell is kept and only whole-entry backticks or links are unwrapped; a table that exists is read strictly for every status (several tables with a footprint column, no rows, a missing column, a wave that is not an integer from 1, a duplicate id); a footprint entry that does not canonicalize is an error at `ready` (phase cells and the frontmatter list); a truncated pair scan is an error; the overlap is the `write-scope` package's. Error texts are unchanged except the new ones.

## Step 7: before and after on Work footprints

Limit, stated plainly: the live Work history is not readable from this sandbox (`fgos` has no installation above the worktree, `fgos:dev` and `scripts/verify-fanout-overlap.mjs` stop at `git-floor-probe-failed: Read-only file system`), so the outcomes below are not from the owner's Work log. They run the old modules (`git show` of the base tree, imported from the scratchpad) and the new ones over: (a) 152 items whose footprints are the real phase footprints of every contract plan in `plans/`, as `todo` items (frontier) and as `awaiting-approval` items (merge readiness), and (b) a five-item hand-built view of containment. The numbers are reproducible with the same method; the Work-log run is for the owner's machine.

| Surface | Before | After |
|---|---|---|
| `fgos conflicts` / decompose gate (`footprintOverlapAmong` over the candidates) | 1194 conflicting pairs | 1660 pairs: 466 new, 0 lost (every old pair is still one) |
| `fgos schedule` (`computeSchedule`, frontier of the 152 items) | 26 waves, wave 0 holds 69 | 26 waves, wave 0 holds 59 |
| merge readiness, `ready` set (`mergeReadiness`) | 35 ready | 8 ready; 27 items leave `ready`, none enter |
| merge readiness, `conflicts` | 1194 | 1660 |
| merge readiness, `mergeSets` with reason footprint-overlap | 2 sets | 1 set (components merge as more pairs connect) |
| containment view: `src/state/` and `src/state/frontier.mjs`, `test/cli/fgos-*.test.mjs` and `test/cli/a.test.mjs`, `docs/x.md` | ready: all five, no conflicts, no sets | ready: `docs/x.md` only; conflicts `dir/file` and `glob/lit`; two merge sets |

Answers asked for by the step:

- **Can `fgos merge` merge something different?** Yes. `fgos merge` acts on the ready set, so it stops auto-merging items whose footprints contain one another or whose glob meets a literal or another glob (a directory and a file in it, `lib/fo*` and `lib/foo.mjs`). It never merges more than before: no item entered `ready` in the run above. This is the visible change of plan A decision 8, and the CHANGELOG names it.
- **Can the fan-out verifier's exit code change?** Yes, in one direction. `scripts/verify-fanout-overlap.mjs` keeps a child only if no sibling's footprint conflicts with it. The stricter rule excludes more children, so a history whose only proof pair had footprints that contained one another (so the old exact-string rule called them disjoint) now exits 1 (`FAIL`) where it exited 0. A history whose proof pair is truly disjoint still exits 0. The script itself is unchanged and not in this phase's write scope; it also now throws a named error instead of answering when a pair scan is truncated.
- **Decompose gate:** still advisory in the sense that it parks `need-human` and never writes children; it now also parks children that contain one another. Added case in `test/intake/plan.test.mjs`.

Parity evidence for the graph facts (seeded fuzz, 300 random views with `deps`, `parent`, `mergeAfter`, `targets`, dangling ids, cycles; old module against new): connected components, critical path, goal-scoped critical path, cycle sets (as sets) and the footprint-only schedule gave 0 differences. Intended differences: a cycle's members are listed in ascending byte order (the old order was the order Tarjan popped them); a graph with a cycle has no critical path and answers `{depth: 0, path: []}` (the old defensive guard returned an arbitrary partial chain; cycles are `detectCycles`' answer); a `footprint` entry that does not canonicalize, or is not a string, now conflicts that one item with every other candidate (before: compared as a normalized string); a truncated pair scan throws `footprint-scan-truncated`; a graph input the package refuses (oversize) throws `graph-refused`. A missing or empty footprint still means no claim.

## Retired proofs and their owners

- `pathsOverlap` unit cases in `test/report/capability-plan-lint.test.mjs` retire; the behaviour is owned by `packages/write-scope/src/lib.rs` (`scopes_overlap_compares_whole_scopes`, `colliding_pairs_agree_with_the_naive_oracle`). One wiring case replaces them and names the changed outcome (`src/*.mjs` against `src/sub/foo.mjs` now collides).
- The script's `overlaps`, `norm` and the lint's `globToRegex` were deleted with no export users; `longestChain`, the Tarjan body, the component BFS and the greedy wave loop in `graph-metrics.mjs` were deleted.

## Step 8: census entries this phase changed against its footprint

`packages/git/contracts/mutation-census.v1.json` keys by file hash. Changed hash: `scripts/plan-contract-check.mjs`, `src/report/capability-plan-lint.mjs`, `src/state/graph-metrics.mjs`. New file with no entry yet: `src/state/graph-adapter.mjs`. Unchanged: `src/state/graph-harness.mjs`, `src/state/store.mjs`, `src/intake/plan.mjs` (not edited). None of the edits adds a Git spawn; the census was not regenerated (the lead does that as the last commit).

## Door entry (step 6)

`docs/architecture-manifest.json`: the row "the footprint and write-scope overlap rule" (patterns `export function pathsOverlap`, `footprintOverlapAmong`, `fn overlaps(`, `writeScopesOverlap|literalsOverlap|globsMeet`, `fgos_write_scope::overlaps`). Allowed: the package, `land.rs`, the adapter surface and its importers (`graph-metrics`, `graph-harness`, `store`, `intake/plan`, `verify-fanout-overlap`), `case-admission`, `propose-classify`, `propose-validate`. Debt with `retiredBy`: the pinned JS port `src/runner/dispatch/write-scope.mjs` (holds `globsMeet`). The supervisor copy is already gone: with the row in place the door test lists no other definition. The adapter has its `domain` row.

## Needs a write outside the scope

`plans/261119-0528-resource-check-door-and-adapters/plan.md`: phase 8 and phase 7b share wave 2 and the new rule (correctly) finds `test/cli/fgos-intake-*.test.mjs` and `test/cli/unknown-flag-rejection.test.mjs` overlapping, so the plan's own check now fails. Fix: replace the glob in phase 8's footprint cell and in the frontmatter with the explicit files `test/cli/fgos-intake-2.test.mjs` to `fgos-intake-7.test.mjs` (the files this phase's write scope already names).
Also not written here: the Work spec sentence that `graph-metrics` now depends on the addon (plan A decision 18; `docs/platform/` is outside this scope).

## Test environment

Run through a preload that calls `ensureGitAddon()` (what `npm test` does). Green: `test/state/*`, `test/intake/*`, `test/cli/fgos-intake-*`, `test/cli/fgos-read-5`, `test/direct/fgos-merge` and `fgos-read`, `test/parity/read-parity`, `test/scripts/plan-contract-check`, `test/report/capability-plan-lint`, `test/cli/plan-lint`, `test/architecture` (80 of 80). Still failing in this sandbox for reasons unrelated to this phase: git-based cases of `cleanup-harness` (`checkMergeStillResolves`, `driftStatus`, `assessCleanupReadiness`, `blockedItemsNowResolvable`), the hot-lock foreign-pid-namespace case, and the census and one-door tests, which are expected to fail until the census is regenerated at the landing.
