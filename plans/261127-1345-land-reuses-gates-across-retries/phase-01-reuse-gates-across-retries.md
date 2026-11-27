# Phase 1: Gates are reused across a retry the trunk moved outside them

## Requirements

A retry after "remote moved" skips regenerate and the gates, and pushes with the gates the earlier attempt passed,
when every path the trunk moved since that attempt is outside every gate's `when`, outside `land.regenerate.when`,
and not a regenerated file. Otherwise the retry runs everything again, as before.

## Files

`packages/supervision/rust/src/land.rs` (`Attempt::RemoteMoved` carries the passed gates, `reusable`),
`packages/supervision/rust/tests/land.rs`.

## Validation

`cargo test -p fgos-supervision --test land`. The reuse case fails without the change, because the trunk-moving gate
would run on every try and exhaust the retries.

## Result (2026-11-27)

Done. Two cases in `tests/land.rs`:
- a trunk moved only outside the gate's `when` lands on the second try, with the gate run once;
- a trunk moved by a path the gate names runs it again and ends `land-retries-exhausted`.
