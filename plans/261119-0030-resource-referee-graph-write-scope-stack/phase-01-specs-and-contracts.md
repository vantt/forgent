# Phase 1: Specs, boundary rows and contracts

A new area gets a spec before code (L5 question 2). This phase writes three area specs, the data
contracts, and settles the facts the later phases depend on.

## Inputs

- `plan.md` of this plan (decisions 1 to 10) and `plans/reports/research-261118-1704-pkm-graph-algorithms-for-shared-overlap-core.md`.
- `packages/git/write-scope/src/lib.rs` (the path authority today) and `src/runner/dispatch/write-scope.mjs` (the JS port).
- `src/state/graph-metrics.mjs`, `dep-graph.mjs` (behaviour the graph package must match), `scripts/plan-contract-check.mjs`, `packages/supervision/rust/src/portfolio.rs`, `src/report/capability-plan-lint.mjs` (`pathsOverlap`).
- `src/workflow/case-admission.mjs` guards (to check what the rule catalog can express), `core/skills/_shared/plan-contract.md` section 4.
- `test/git/write-scope-parity.test.mjs` and `test/runner/write-scope.test.mjs` (the parity proof that already exists for the path rule).
- `docs/platform/governance.md#decision-scope-to-holder-table`, `docs/platform/component-boundary.md`, `packages/supervision/contracts/plan-vocabulary.v1.json` (shared-contract pattern).

## Files it may write

`docs/platform/write-scope/`, `docs/platform/graph/`, `docs/platform/resource-referee/` (each a `spec.md`), `docs/platform/component-boundary.md`, `packages/graph/contracts/graph.v1.json`, `packages/resource-referee/contracts/resource-referee.v1.json`, and this plan's `reports/`.

## Steps

1. Run the prior-art searches the repo requires (`git log -S` on `footprintOverlapAmong`, `computeSchedule`, `detectCycles`, `pathsOverlap`, `overlaps(` and the earlier names of each) and write what existed and why it moved into `reports/facts.md`.
2. Write the `write-scope` spec: grammar, the soundness contract of may-overlap, the set-level colliding-pairs function, why the package left `git/`, and the difference between the three meanings found today (equal-only, containment with glob prefix, regex glob), choosing one.
3. Write the `graph` spec and `graph.v1.json`: nodes, edge kinds with a registry (does the kind order or not), exclusion pairs, priority order, outputs (cycles in canonical rotation, layers with deferral evidence, critical path, groups, dangling references), the tie-break rules, the step cap and `truncated`, and the split between refusals (malformed input) and results.
4. Write the `resource-referee` spec and `resource-referee.v1.json`: claims, the closed catalog of checks with parameters (v1: no cycles, no dangling edges, claims declared, declared layers valid, alone-in-layer, maximum layer width), finding classes (blocking, advisory), stable finding codes, verdict derivation (`accept`, `accept-with-advice`, `reject`), and the rule that the package holds no default policy. A node that writes but declares no claims is a blocking finding. Check the five guards of `case-admission.mjs` and the rules of plan-contract section 4 against the catalog and list any it cannot express; a numeric-attribute check is out of v1 because no plan table carries a size or risk column.
   Add `limits` (nodes, edges, claims per node, path length, ruleset size) to `graph.v1.json` and `resource-referee.v1.json`; input beyond them is refused by name.
5. Decide with measured cost how Node calls the Rust packages (host verb or the existing native addon) and confirm the planner door's name against existing verbs. Write both into `reports/facts.md`; the Node decision is binding for phases 3 and 8. Specify `--policy <file>`, the structural default policy, and that a project's hot-file list is policy data.
6. Add the three packages and the moved `write-scope` to `docs/platform/component-boundary.md`. The reading map is updated in phase 9.

## Verify

`fgos convention check` passes on the new files; every statement about current code cites a file and line that exists; the catalog gap list is empty or each gap names its resolution.

## Rollback

Delete the files this phase created; nothing else reads them yet.
