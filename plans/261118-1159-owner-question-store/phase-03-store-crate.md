# Phase 3: Store crate and use cases

## Inputs
- `plan.md` decisions QP-2..QP-8, QP-15..QP-19 and QP-22, plus the contracts from phase 1 and the mint kind from
  phase 2.
- The Event Store: `packages/event-store/rust/src/append.rs:177` (`append`), `read.rs:468` (`read`) and the registry,
  plus the consumer registry `packages/event-store/contracts/consumers.v1.json`.
- Identity's adapter over the store, as the pattern: `packages/identity/rust/src/shared.rs:61` (`EntryLog`) and
  wherever Identity wires `EntryLog` to the Event Store.
- Observe record sources: the `RecordSource` trait (`packages/observe/rust/src/record/`), and ops-metrics' run
  projection as the example of a source owned outside Observe.
- Identity: `current_session` (`current.rs`), the directory roles (`directory.rs`) and `agent_in_ancestry`
  (phase 2), all as they stand after the session-verb plan.
- The host's Event Store adapter `StoreLogDoor::open_stream` (`apps/fgos/src/wiring/identity_log.rs:56`). The host
  wires it in phase 4; this crate only defines the port.
- The architecture guard: `test/architecture.test.mjs` and `docs/architecture-manifest.json`.

## Footprint
- `packages/questions/rust/src/**`
- `packages/questions/rust/Cargo.toml`
- `packages/questions/rust/tests/store_*.rs`
- `packages/event-store/contracts/consumers.v1.json`
- `package.json` (`files`, so the new stream contract ships and `consumers.test.mjs` passes)
- `Cargo.toml` (members)
- `Cargo.lock`
- `docs/architecture-manifest.json`

## Steps
0. Re-grep every input. Adapt to a changed API behind one port. If a decision must change, stop with `NEEDS_CONTEXT`.
1. Create the crate `fgos-questions` with dependencies `fgos-observe` (for the `RecordSource` trait), `fgos-identity`
   (feature `directory`) and serde. It does not depend on `fgos-event-store`, because the store is reached only
   through the port.
   - Add it to the workspace members and give it a layer entry in the architecture manifest. It sits above Event
     Store, Observe and Identity, and knows no host, CLI or gateway code.
   - Register consumer `questions` with its stream contract and `cachePath: .fgos/cache/questions.json` in
     `consumers.v1.json`.
   - Add the contract path to `package.json` `files`.
2. Write `record.rs`, the four event payloads, and `pub const OBSERVE_KINDS` (`include_str!` of `observe-kinds.json`).
3. Write `store.rs`. It has a port `QuestionLog { append, read }` (no adapter in this crate; tests use an in-memory
   log plus one test that runs over a real Event Store in a temp repo, through a test-only adapter in `tests/`), plus
   `fold()`, which keeps the first answer in the store's reader order → per-id state `{open | answered | acked | cancelled, conflicts}`, where the earliest `answeredAt`
   wins.
4. Write `caller.rs`. It is a port `CallerSource` that returns `{sessionId, handle, roles, persona, pane?, isAgent}`.
   - The Identity adapter gets `isAgent` from `agent_in_ancestry`, and gets the machine id.
   - The socket adapter takes the asker from a head envelope, and phase 8 supplies it.
   - No input sets the caller.
5. Write `refcheck.rs`. It checks the three `--ref` forms in the caller's checkout root, which is passed in, and
   returns `{value, branch, commit}`.
6. Write the shape check in `shape.rs`. It reads its limits from `questions-input.v1.json` (embedded), counts
   characters, and names the field and the rule on refusal.
7. Write `usecase.rs`:
   - `ask`;
   - `answer`, which applies the owner rule from QP-16 (`--source secretary` only for a caller with role
     `head:secretary*`, and `--source gateway:<c>` only for a non-agent caller);
   - `ack` and `cancel`, under the authority rules of QP-4;
   - `list` and `show`.
   - After every write, and after every read of the stream, rewrite the view `.fgos/cache/questions.json` (QP-23)
     with a durable replace.
   - On a non-Linux target, refuse with `event-store-unsupported-platform` before doing anything.
8. Write `source.rs`: a `RecordSource` that projects the fold into `fgos.question.*` records, one record per event,
   with id `<qid>:<kind>` and the OQ-D6 attrs plus `asker.machine` (QP-8).
9. Write the tests `tests/store_*.rs` covering acceptance 1-3, over a temp repo with the Event Store initialised:
   - the fields of an ask, and every refusal;
   - each QP-19 rule;
   - answer-once;
   - the two-machine fold, using two writer ids;
   - the owner rule, with an agent ancestry fixture;
   - the ack and cancel authority (asker, same `head:` role, any head for a migrated question or a non-head asker,
     stranger);
   - the view written after a write;
   - the record source over a fold;
   - supersede;
   - the events and their attrs;
   - the platform refusal (`cfg`-gated).

## Verify
- `cargo test -p fgos-questions`
- `cargo clippy -p fgos-questions -- -D warnings`
- `test/architecture.test.mjs`, through the repo test runner

Pass condition: all three are green.

## Rollback
Revert the phase commit. No caller uses the crate yet.
