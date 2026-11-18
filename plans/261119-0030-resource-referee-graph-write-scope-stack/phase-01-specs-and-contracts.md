# Phase 1: Specs, boundary rows and contracts

A new area gets a spec before code (L5 question 2). This phase writes three area specs, the data
contracts, and settles the facts the later phases depend on. Step zero (decision 24) applies first.

## Inputs

- `plan.md` of this plan (decisions 1 to 25) and `plans/reports/research-261118-1704-pkm-graph-algorithms-for-shared-overlap-core.md`.
- `packages/git/write-scope/src/lib.rs` (the path authority today) and `src/runner/dispatch/write-scope.mjs` (the JS port).
- `src/state/graph-metrics.mjs`, `dep-graph.mjs` (behaviour the graph package must match), `scripts/plan-contract-check.mjs`, `packages/supervision/rust/src/portfolio.rs`, `src/report/capability-plan-lint.mjs` (`pathsOverlap`).
- `src/workflow/case-admission.mjs` guards (to check what the rule catalog can express), `core/skills/_shared/plan-contract.md` section 4.
- `test/git/write-scope-parity.test.mjs`, `test/runner/write-scope.test.mjs`, `src/native/door.mjs` (ABI list).
- `docs/platform/governance.md#decision-scope-to-holder-table`, `docs/platform/component-boundary.md`, `packages/supervision/contracts/plan-vocabulary.v1.json` (shared-contract pattern).

## Files it may write

`docs/platform/write-scope/`, `docs/platform/graph/`, `docs/platform/resource-referee/` (each a `spec.md`), `docs/platform/component-boundary.md`, `packages/graph/contracts/graph.v1.json`, `packages/resource-referee/contracts/resource-referee.v1.json`, and this plan's `reports/`.

## Steps

0. Refresh `base`, re-read the file and line facts this plan cites, re-run the plan check and the overlap measurement; stop if a cited fact moved.
1. Run the prior-art searches the repo requires (`git log -S` on `footprintOverlapAmong`, `computeSchedule`, `detectCycles`, `pathsOverlap`, `overlaps(` and the earlier names of each) and write what existed and why it moved into `reports/facts.md`. Search `test/` as well as `src`, `packages`, `apps`, `core` and `docs`.
2. Write the `write-scope` spec: grammar, the soundness contract of may-overlap stated as lexical (case folding, Unicode normalisation and symlinks are outside it, and a verdict carries that caveat), the set-level colliding-pairs function, why the package left `git/`, and the difference between the three meanings found today (equal-only, containment with glob prefix, regex glob), choosing one. State the error policy for an entry that does not canonicalize (decision 17).
3. Write the `graph` spec and `graph.v1.json`: nodes, edge kinds with a registry (does the kind order or not), exclusion pairs, priority order, outputs (one canonical cycle path per strongly connected component rooted at its smallest id, layers with deferral evidence, critical path, groups, dangling references), the tie-break rules, and the split between refusals (malformed input) and results. Say how the package `graph` differs from the Work verb `fgos graph`.
4. Write the `resource-referee` spec and `resource-referee.v1.json`: claims and the explicit `readOnly` marker, the closed catalog of checks with parameters (v1: no cycles, no dangling edges, claims declared, facts not truncated, declared layers valid, alone-in-layer, maximum layer width), the floor, finding classes (blocking, advisory), stable finding codes, verdict derivation (`accept`, `accept-with-advice`, `reject`), policy replace semantics with the verdict echoing the policy path and sha256, and the rule that the package holds no default policy. Check the five guards of `case-admission.mjs` and the rules of plan-contract section 4 against the catalog and list any it cannot express; a numeric-attribute check is out of v1 because no plan table carries a size or risk column.
5. Fix the numeric `limits` in both contracts (decision 7 gives the starting values), the pair-comparison cap and the emitted-pairs cap, and specify the shared input reader of decision 23.
6. Run the old and the new overlap rule over every current plan table and record any plan that flips; the plan-check rule is the same as the new one, so none is expected.
7. Record in `reports/facts.md` the names of decision 26 and re-confirm the door's name `fgos resource-check` against the verb tables, then add the three packages and the moved `write-scope` to `docs/platform/component-boundary.md`. The reading map is updated in phase 9.

## Verify

`fgos convention check` passes on the new files; every statement about current code cites a file and line that exists; the catalog gap list is empty or each gap names its resolution.

## Rollback

Delete the files this phase created; nothing else reads them yet.
