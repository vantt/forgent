# Phase 17 — Query grammar for the supervisor's definitions

The plan's outcome says a detection the supervisor plan adds is one more declaration and definition file, with no
Observe code change (OM-D10, OM-D11). Writing its watcher definitions (plan 261118-1045, phase 13) found eight gaps in
the phase 5/7 grammar. Two of them (a parameter as the `k` factor, `--since/--until` with `--def`) were already meant
to work. This phase closes all eight. Rust.

## Inputs
- `plans/261118-1045-project-supervisor/reports/request-261118-1521-observe-grammar-for-watcher.md`: the eight
  features, their semantics and examples. It is the spec for this phase.
- Phases 5 and 7: `packages/observe/rust/src/query/**`, `definition/**`, `metrics_cli/query.rs`.

## Footprint
`packages/observe/rust/src/query/**`, `packages/observe/rust/src/definition/**`,
`packages/observe/rust/src/metrics_cli/query.rs`, `packages/observe/rust/tests/query_*.rs`,
`packages/observe/rust/tests/definition_*.rs`, `test/fixtures/observe/query/**`.

## Steps
1. Item 7 first, as its own commit: `--since`/`--until` with `--def` set each definition's window; land it alone.
2. Items 1-6 and 8, each to the request file's semantics: `prefix` op (`--where field^=text`); `any` branches;
   anti-join `anchor: "after"`; definition `window: "own"`; `k` from a param (an unset config key answers
   `unmeasured: config-unset: <key>`); `without.latest`; `max:end` and `min:ts`.
3. The query model stays serializable; every new form round-trips.
4. Tests at the lowest layer, one per feature, using the request file's examples; no Observe source names a consumer
   kind (`rg -n 'watcher\.tick|supervisor\.wake|question\.asked' packages/observe/rust/src` stays empty).

## Verify
- `cargo test -p fgos-observe -p fgos` passes.
- `fgos metrics query --def <dir> --since <ts> --now <ts>` runs a directory of definitions over a window.

## Rollback
Revert the phase commits.
