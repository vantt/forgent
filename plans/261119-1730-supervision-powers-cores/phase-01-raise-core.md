# Phase 1: Raise a coordination event from a caller

## Inputs
`packages/supervision/rust/src/queue.rs` (`RaisedEvent`, `Queue::raise`, `valid_id`); `packages/supervision/rust/src/watcher.rs`
(`event_id`); `docs/platform/supervision/spec.md` sections 2 and 4; discussion decisions SP-D3, SP-D7.

## Files it may write
`packages/supervision/rust/src/queue.rs`, `packages/supervision/rust/tests/queue.rs`.

## Steps
1. Read how the watcher calls `raise` and what registers an event kind; keep one raise path for the watcher and a caller.
2. Add a caller-side constructor that builds a `RaisedEvent` from `kind`, `subject`, `reason`, `next_command` and the
   current instant, deriving `id` through `watcher::event_id` (never a second id rule). The kinds a caller may raise are
   `coordination-handoff`, `coordination-chore`, `coordination-help`, a closed list in this module; anything else is `bad-event`.
3. Make the folded view show `handled` closing a coordination event exactly like a watcher event (SP-D7: closed acts
   leave the view, stay in the Event Store).
4. Tests in `tests/queue.rs`: raise once, raise twice (`Duplicate`), unknown kind refused, handled event leaves the queue.

## Verify
`cargo test -p fgos-supervision --test queue` passes; `cargo clippy -p fgos-supervision -- -D warnings` clean.

## Rollback
Revert the phase's commit; nothing outside the crate calls the new constructor.
