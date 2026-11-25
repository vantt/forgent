# Phase 3: Counts in the event reason and a bucket instant

Capability: `code:implement`

## Inputs

- `apps/fgos/src/wiring/supervision.rs`: `rows_of` and `rows_from` (about lines 1175-1230) and
  their unit tests (about line 2210).
- `core/watcher/README.md`, the "Row to event" table. Read only here; phase 4 updates it.
- `packages/observe/rust/src/query/exec.rs`: how a bucketed group appears in the answer row (the
  key that carries the bucket start, under `group` or on the row). Read only.

## Files this phase may write

- `apps/fgos/src/wiring/supervision.rs`

## Steps

1. Reason placeholders: in `rows_from`, replace each `{<agg name>}` in the template's `reason`
   (for example `{count}` or `{sum:fgos.main.commit.note}`) with the row's aggregate value,
   rendering integers without a fraction. A placeholder whose aggregate is absent or null is
   left as written. Text without placeholders is unchanged, so existing definitions behave the
   same.
2. Bucket instant: when the row's group carries a bucket start, use it as `ts` before the
   `min:ts`, `max:end`, `max:ts` fallbacks. No existing definition uses `bucket`, so their
   instants do not change.
3. Extend the existing `rows_of` unit test, the owning proof of the row mapping, with one row
   that has a bucket and a reason with two placeholders, and one placeholder whose aggregate is
   missing.

## Verify

```bash
cargo test -p fgos --lib rows_of
cargo test -p fgos-supervision --test definitions
```

Pass: both green. The existing definition fixtures' expected events are unchanged.

## Rollback

Revert the phase commit.
