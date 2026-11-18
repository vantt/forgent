# Phase 4: graph crate and parity corpus

## Inputs

- `docs/platform/graph/spec.md` and `packages/graph/contracts/graph.v1.json` from phase 1.
- The behaviour to match: `src/state/graph-metrics.mjs` (`connectedComponents`, `criticalPath`, `detectCycles`, `computeSchedule`), `src/state/dep-graph.mjs`.
- The pkm cycle enumerator for reference only: `/home/vantt/projects/pkm/crates/pkm-core/src/query.rs:1144-1209`, `1776-1828`.

## Files it may write

`packages/graph/rust/**` only.

## Steps

1. Implement with no filesystem, clock, process, path or Work knowledge. Input and output types follow the contract file; unknown fields are refused by name.
2. Cycles: iterative strongly connected components, then the cycles inside each, every cycle rooted at its smallest id and the list in sorted order; dangling edges reported, never materialised as nodes.
3. Layers: topological layers by earliest possible layer; layering under exclusion pairs places nodes in the caller's priority order (default: input order, ties by id) and reports for each deferred node the exclusion that forced the delay.
4. Critical path (optional node weights, deterministic tie-break) and independent groups over ordering and exclusion edges.
5. A step cap on every enumeration, returning the result so far plus `truncated: {reason, limit}`.
6. Parity corpus under `packages/graph/rust/tests/`: real phase tables from `plans/*/plan.md` and one folded Work view, with outputs recorded from the JS code at this commit and a named list of intended differences (ordered cycle paths, exclusion layering). A test proves the recorded outputs regenerate byte for byte.
7. Property-style tests against a naive topological order and a naive cycle search on small graphs from a seeded generator in the test file; no new crate. Enforce the contract `limits` and refuse oversize input by name.

## Verify

`cargo test -p fgos-graph` and `cargo clippy -p fgos-graph -- -D warnings`, run alone with `-j4`.

## Rollback

Remove the crate contents back to the skeleton from phase 2.
