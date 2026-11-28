# Phase 3: Counts in the event reason and a bucket instant

Capability: `code:implement`

## Inputs

- `apps/fgos/src/wiring/supervision.rs`: `rows_of` and `rows_from` (about lines 1541-1595),
  the doc comment above `rows_of` (it lists the instant order), and their unit test (the
  `rows_of` case near line 4063).
- `core/watcher/README.md`, the "Row to event" table. Read only here; phase 4 updates it.
- `packages/observe/rust/src/query/exec.rs` (about line 599): a bucketed answer row carries its
  bucket start as a row-level `bucket` field (RFC 3339), not inside `group`. Read only.

## Files this phase may write

- `apps/fgos/src/wiring/supervision.rs`

## Steps

1. Reason placeholders: in `rows_from`, replace each `{<agg name>}` in the template's `reason`
   (for example `{count}` or `{sum:fgos.main.commit.note}`) with the row's aggregate value,
   rendering integers without a fraction. A placeholder whose aggregate is absent or null is
   left as written. Text without placeholders is unchanged, so existing definitions behave the
   same.
2. Bucket instant: when the answer row has a `bucket`, use it as `ts` before the `min:ts`,
   `max:end`, `max:ts` fallbacks, and say so in the `rows_of` doc comment. No existing
   definition uses `bucket`, so their instants do not change. Pace rows (`pace_rows_of`) go
   through the same function and are only counted, so the change is harmless there.
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
