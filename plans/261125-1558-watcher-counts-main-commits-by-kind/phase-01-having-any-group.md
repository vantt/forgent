# Phase 1: An any group in a query having

Capability: `code:implement`

## Inputs

- `packages/observe/rust/src/query/model.rs`: `Having` (about line 319), `Filter` and its
  `Deserialize` impl (the `any` group pattern to mirror), and `Query.having`.
- `packages/observe/rust/src/query/exec.rs`: `passes_having` (about line 226) and the having
  validation loop (about line 307).
- `packages/observe/rust/tests/query_engine_test.rs`: the owning tests of the query engine.
- `docs/platform/observe/spec.md`: read only. Add nothing unless the query grammar is listed there; if it is, note the change in the report for phase 4. Phase 4 does not own that file, so leave it unchanged.

## Files this phase may write

- `packages/observe/rust/src/query/model.rs`
- `packages/observe/rust/src/query/exec.rs`
- `packages/observe/rust/tests/query_engine_test.rs`

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
5. Add one test to `query_engine_test.rs`: "a having any group passes a group when one branch
   holds". Two groups: one passes only branch A, one passes neither. Include a param operand
   inside a branch. Add one refusal case for an empty `any`. No existing test proves this,
   because `having` had no OR before.

## Verify

```bash
cargo test -p fgos-observe
```

Pass: all green, including `definition_test.rs` (existing definitions parse unchanged) and the
new test.

## Rollback

Revert the phase commit. No definition uses `any` in `having` until phase 4.
