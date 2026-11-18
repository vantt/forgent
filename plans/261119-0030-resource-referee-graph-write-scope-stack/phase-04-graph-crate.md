# Phase 4: graph crate

## Inputs

- `docs/platform/graph/spec.md` and `packages/graph/contracts/graph.v1.json` from phase 1.
- The behaviour to match: `src/state/graph-metrics.mjs` (`connectedComponents`, `criticalPath`, `detectCycles`, `computeSchedule`), `src/state/dep-graph.mjs`, and the cases of `test/state/graph-metrics.test.mjs`.

## Files it may write

`docs/platform/graph/` (decision history only) and `packages/graph/rust/**`.

## Steps

1. Implement with no filesystem, clock, process, path or Work knowledge. Input and output types follow the contract file; unknown fields are refused by name, and input beyond the contract `limits` is refused by name (per-item limits as item-level findings).
2. Cycles: strongly connected components (iterative), and for each non-trivial component one canonical shortest cycle through its smallest id, found by breadth-first search with ties broken by the smaller next id, together with the component's members and induced edges; dangling edges reported, never materialised as nodes. Add the bounded query `cycle_through(id)` (decision 27). Every step is linear, so there is no step cap here.
3. Layers: topological layers by earliest possible layer; layering under exclusion pairs places nodes in the caller's priority order (default: input order, ties by id) and reports for each deferred node the exclusion that forced the delay.
4. Critical path (unweighted; ties broken by declaration order, the first strict maximum, as `src/state/graph-metrics.mjs:151` does) and independent groups over ordering and exclusion edges.
5. Port the cases of `test/state/graph-metrics.test.mjs` as Rust cases and list every intended difference by name (single canonical cycle path, exclusion layering). The plan-check verdict comparison is not done here: `graph` has no path rule, and the verdicts were recorded in phase 1.
6. Tests against a naive topological order and a naive cycle search on small graphs, using a small seeded generator in the test file; no new crate.
7. List the census entries this phase changed against its footprint, and record the settled decision in the `graph` spec's decision history.

## Verify

`cargo test -p fgos-graph` and `cargo clippy -p fgos-graph -- -D warnings`, as the only cargo job on the machine, with `-j4`.

## Rollback

Remove the crate contents back to the skeleton from phase 2.
