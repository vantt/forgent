# Phase 4 — Write door and health counters

Layer 1 write side, with the layer 2 safety rule: the write door is fail-open and bounded in time. Rust.

## Inputs
- Phase 1 types and loader.
- `packages/observe/rust/src/shard.rs` and `store_lock.rs`; `docs/platform/observe/spec.md` §3 (store root, lock,
  torn-tail rules).
- D-ADR0037 "best-effort side channel" (`docs/platform/observe/decisions/observe-component-architecture.md`).
- Research lesson 2 (the skillstation recorder, `internal/telemetry/recorder.go:92-125`) and lesson 4 (deterministic
  ids).

## Footprint
`packages/observe/rust/src/record/store/**`, `packages/observe/rust/src/record/mod.rs`,
`packages/observe/rust/tests/store_*.rs`.

## Steps
1. `record::write(&Record)` validates the record against the merged registry and appends it through the shard door
   into `.fgos/observe/records/<writerId>.jsonl`, under the same lock and root rules as the other stores.
2. Fail-open and bounded: a write never returns an error that changes the caller's outcome. Each writer keeps its
   counters in `.fgos/observe/records/health/<writerId>.json`: `accepted`, `written`, `rejected`, `errors` and
   `lastError`. The health is also exposed as a `RecordSource` of kind `fgos.observe.health`.
3. Ids: a writer may pass a deterministic `id`, and a duplicate is accepted and ignored, so replay is idempotent.
   Without an id, the door makes a random one.
4. Reading the store is a `RecordSource` with a time window.
5. Tests:
   - a write, then a read in the same window;
   - a duplicate id;
   - a refused record raises the counter and does not error;
   - a write while another process holds the lock returns within the bound, with the counter raised;
   - a torn tail is healed.

## Verify
`cargo test -p fgos-observe` is green.

## Rollback
Revert the phase commit.

## Carried from the phase 1 review
- A malformed or colliding file under `.fgos/observe/kinds` fails the whole registry load today
  (`record/registry/discover.rs`, `merge.rs`). The write door must stay fail-open: a registry load failure is counted
  and the write is dropped or rejected, never raised to the caller (§6.0.1).
- `validate.rs` accepts a `detail` without a redaction stamp. The write door refuses or redacts an unstamped `detail`.
