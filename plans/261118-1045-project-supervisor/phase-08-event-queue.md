# Phase 8 — Event queue in the Event Store

The watcher raises an event once; the supervisor drains it. The queue is Event Store truth (PS-9), so a crash, a second
machine or a restart never loses or doubles an event. Rust, in `fgos-supervision`.

## Inputs
- Dependencies are already in the crate (phase 3 declares `fgos-event-store` and the test-support dev-dependency).
- Step 0: re-grep every name below. Phase 3 declares the contract and the consumer row; if its type names differ from
  the ones here, use phase 3's and stop with `NEEDS_CONTEXT` only if the shape differs (not just the spelling).
- `packages/supervision/contracts/event-streams.v1.json` and the `supervision` row in
  `packages/event-store/contracts/consumers.v1.json` (phase 3). Template: the `mailbox` row at
  `consumers.v1.json:22-25` and `packages/mailbox/contracts/event-streams.v1.json` (types, `scope: project`,
  `sealOnWrite: false`).
- Event Store door: `packages/event-store/rust/src/append.rs:34-50` (`EventInput`, `AppendRequest`, `held_ranks`),
  `:177` (`append`); `read.rs:51` (`ReadRequest`), `:468` (`read`); `layout.rs:20` (stream ids: `project` is valid);
  `registry.rs` (`Registry::shipped`, embeds every consumer contract).
- Spec: `docs/platform/event-store/spec.md`; the lock ranks in `packages/holder-lock/contracts/lock-registry.v1.json`
  (which rank an append may hold).

## Footprint
`packages/supervision/rust/src/queue.rs`, `packages/supervision/rust/tests/queue.rs`.
(`lib.rs` already declares `mod queue` from phase 3; do not edit it.)

## Steps
0. Re-grep inputs; confirm `mod queue;` is in `packages/supervision/rust/src/lib.rs` and the two event types exist.
1. Event types (from phase 3): `supervision.event-raised` `{id, kind, ref, ts, reason, nextCommand}` and
   `supervision.event-handled` `{id, by}`. Stream `project`. `id` is a deterministic 16-hex string the watcher builds
   from `kind`, `subject` and the row's state-change instant `ts` (phase 11 step 2.6), so the same row raised twice has
   the same id; `ref` carries the subject.
2. `queue.rs` public surface (one door, no other module touches the stream):
   - `Queue::open(layout, machine, writer) -> Result<Queue, QueueError>`.
   - `raise(&self, RaisedEvent) -> Result<Raised, QueueError>`; `Raised` is `New` or `Duplicate`. It folds the stream
     first and appends only when the id is not already raised.
   - `unhandled(&self) -> Result<Vec<RaisedEvent>, QueueError>`: raised minus handled, ordered by `ts` then `id`.
   - `mark_handled(&self, ids: &[String], by: &str) -> Result<usize, QueueError>`: idempotent (already handled is
     skipped, not an error); an id never raised refuses `event-unknown`.
   - `unhandled_count(&self) -> Result<usize, QueueError>` for `supervisor done` (phase 12).
3. Fold rule: the set of `event-raised` ids (first one wins its body) minus the set of `event-handled` ids, across
   every machine's mirror, so two machines raising the same id show one event and a handle on either closes it.
4. Errors are `QueueError { code, detail }`: `event-unknown`, `store-unavailable` (the Event Store refused or could not
   be read; never turned into "empty"), `bad-event` (empty `kind`/`ref`, an `id` that is not 16 hex).
5. No compaction, no cache file: the stream is small and read whole each call (pace rows are never raised, PS-22, so it
   grows one row per real event). If a measure later says otherwise, that is a new item, not this phase. Across machines
   a handle reaches the peer at its next Event Store sync (spec note).
6. Tests in `tests/queue.rs`, one behaviour each, over a temp-dir Event Store:
   - the same id raised twice yields one unhandled event and `Raised::Duplicate` the second time;
   - `mark_handled` removes it from `unhandled` and a second call is a no-op;
   - an id never raised refuses `event-unknown`;
   - two machine mirrors (use the Event Store test support to write a peer mirror) raising one id show one event,
     and a handle written on the peer closes it here;
   - an unreadable store gives `store-unavailable`, not an empty list.

## Verify
- `cargo test -p fgos-supervision --test queue` passes.
- `cargo clippy -p fgos-supervision -- -D warnings` is clean.
- `rg -n "event-raised|event-handled" packages apps src` shows the contract, `queue.rs` and its test only.

## Rollback
Revert the phase commit. The crate stays inert (the queue has no caller until phases 11 and 12), so no data is left
behind that anything reads.
