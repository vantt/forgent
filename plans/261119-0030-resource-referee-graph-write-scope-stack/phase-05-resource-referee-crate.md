# Phase 5: resource-referee crate

## Inputs

- `docs/platform/resource-referee/spec.md` and `packages/resource-referee/contracts/resource-referee.v1.json` from phase 1, including the floor and the list of rules the catalog must express.
- The graph output types from phase 4 and the set-level function from phase 3.
- The rules in `core/skills/_shared/plan-contract.md` section 4 and the guards in `src/workflow/case-admission.mjs` (read only, as the source of what real policies look like).

## Files it may write

`docs/platform/resource-referee/` (decision history only) and `packages/resource-referee/rust/**`.

## Steps

1. Implement the evaluator: facts (graph output, node attributes, claims) plus a ruleset (data) in, findings plus a verdict out. No filesystem, no clock, no default ruleset.
2. Implement the closed catalog with parameters, one function per check: no cycles, no dangling edges, claims declared (a node with neither `claims` nor `readOnly: true`, or an empty footprint, is blocking), facts not truncated (`facts-truncated`), declared layers valid (every node later than its dependencies, no exclusion pair in one layer), alone-in-layer (selected by a claim matching a path pattern, or by a node attribute), maximum layer width. Path matching goes through `write-scope`. No numeric-attribute check in v1.
3. Apply the floor always: no cycles, no dangling edges, claims declared and facts not truncated run whether or not the ruleset names them. A ruleset replaces the default policy; the verdict carries the policy path and sha256 it was given.
4. Every finding has a stable code, a class (blocking or advisory), the node ids and the evidence. The verdict derives only from classes: any blocking finding gives `reject`, only advisory gives `accept-with-advice`, none gives `accept`.
5. Refuse a ruleset that names an unknown check or an unknown parameter, and any input beyond the contract `limits`, by name, before evaluating anything.
6. One owning test per check, plus a test that every blocking code is produced by some case and one that a truncated input never yields `accept`. No test copies another crate's cases.
7. Run the census scan without `--write-census`, list the changed entries against this phase's footprint, and record the settled decision in the `resource-referee` spec's decision history.

## Verify

`cargo test -p fgos-resource-referee` and `cargo clippy -p fgos-resource-referee -- -D warnings`.

## Rollback

Remove the crate contents back to the skeleton from phase 2.
