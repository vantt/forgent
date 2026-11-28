# Phase 1: An any group in a query having

Capability: `code:implement`

## Inputs

- `packages/observe/rust/src/query/model.rs`: `Having` (about line 319), `Filter` (about line
  220) and its `Deserialize` impl (about line 231, the `any` group pattern to mirror), and
  `Query.having` (about line 453).
- `packages/observe/rust/src/query/exec.rs`: `passes_having` (about line 226), the having
  validation loop (about line 307) and its call (about line 581).
- `packages/observe/rust/src/metrics_cli/query.rs`: the `--having` flag reads JSON into
  `query.having` (about line 196) and its test compares `query.having` (about line 453). These
  are the only readers of `Query.having` outside `query/`.
- `packages/observe/rust/tests/query_engine_test.rs`: the owning tests of the query engine;
  one test indexes `q.having[0].rhs` (about line 762).
- `docs/platform/observe/spec.md`: the query grammar, the `having` line (about line 144).

## Files this phase may write

- `packages/observe/rust/src/query/model.rs`
- `packages/observe/rust/src/query/exec.rs`
- `packages/observe/rust/src/metrics_cli/query.rs`
- `packages/observe/rust/tests/query_engine_test.rs`
- `docs/platform/observe/spec.md`

## Steps

1. Make one `having` list entry either a `Having` condition or `{"any": [[<having>...], ...]}`.
   Mirror `Filter`: an object whose only key is `any` is a group, and any other object is read
   as a `Having`, so a malformed condition keeps its own field error. Groups nest.
2. Refuse an `any` with no branch, or a branch with no entry, with the same error wording
   `where` uses.
3. `passes_having`: the list passes when every entry holds, and an `any` holds when every entry
   of at least one branch holds. An operand with no value still fails its test.
4. Move every place that walks `query.having` (validation of params and agg names, and the
   needed-aggregates collection) to walk into the groups, so a param or agg used only inside a
   branch is still resolved and computed.
5. Keep the `--having` flag and its test in `metrics_cli/query.rs` compiling and green; a flag
   value may now be an `any` group too. Adjust the existing `having[0].rhs` test only as far as
   the new element type needs, asserting the same thing.
6. In `docs/platform/observe/spec.md`, extend the `having` line with the `any` group, in the
   same words the `where` line uses for its group.
7. Add one test to `query_engine_test.rs`: "a having any group passes a group when one branch
   holds". Two groups: one passes only branch A, one passes neither. Include a param operand
   inside a branch. Add one refusal case for an empty `any`. No existing test proves this,
   because `having` had no OR before.

## Verify

```bash
cargo test -p fgos-observe
```

Pass: all green, including `definition_test.rs` (existing definitions parse unchanged), the
`metrics_cli` query flag test and the new test.

## Rollback

Revert the phase commit. No definition uses `any` in `having` until phase 4.
