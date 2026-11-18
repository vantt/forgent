# Phase 3: Store crate and use cases

## Inputs
- `plan.md` decisions QP-2..QP-8, QP-15..QP-19 and QP-22, plus the contracts from phase 1 and the mint kind from
  phase 2.
- The Event Store: `packages/event-store/rust/src/append.rs:177` (`append`), `read.rs:468` (`read`) and the registry,
  plus the consumer registry `packages/event-store/contracts/consumers.v1.json`.
- Identity's adapter over the store, as the pattern: `packages/identity/rust/src/shared.rs:61` (`EntryLog`) and
  wherever Identity wires `EntryLog` to the Event Store.
- The landed Observe write door: `packages/observe/rust/src/record/store/door.rs` (`RecordDoor::new(...).write`).
- Identity: `current_session` (`current.rs`), the directory roles (`directory.rs`) and `ancestry_cli`
  (`resolve.rs:214`), all as they stand after the session-verb plan.
- The architecture guard: `test/architecture.test.mjs` and `docs/architecture-manifest.json`.

## Footprint
- `packages/questions/rust/src/**`
- `packages/questions/rust/Cargo.toml`
- `packages/questions/rust/tests/store_*.rs`
- `packages/event-store/contracts/consumers.v1.json`
- `Cargo.toml` (members)
- `Cargo.lock`
- `docs/architecture-manifest.json`

## Steps
0. Re-grep every input. Adapt to a changed API behind one port. If a decision must change, stop with `NEEDS_CONTEXT`.
1. Create the crate `fgos-questions` with dependencies `fgos-event-store`, `fgos-observe`, `fgos-identity` (feature
   `directory`) and serde.
   - Add it to the workspace members and give it a layer entry in the architecture manifest. It sits above Event
     Store, Observe and Identity, and knows no host, CLI or gateway code.
   - Register consumer `questions` with its stream contract in `consumers.v1.json`.
2. Write `record.rs`, the four event payloads, and `pub const OBSERVE_KINDS` (`include_str!` of `observe-kinds.json`).
3. Write `store.rs`. It has a port `QuestionLog { append, read }` and an Event Store adapter on the Identity pattern,
   plus `fold()` → per-id state `{open | answered | acked | cancelled, conflicts}`, where the earliest `answeredAt`
   wins.
4. Write `caller.rs`. It is a port `CallerSource` that returns `{sessionId, handle, roles, persona, pane?, isAgent}`.
   - The Identity adapter gets `isAgent` from `ancestry_cli`.
   - The socket adapter takes the asker from a head envelope, and phase 8 supplies it.
   - No input sets the caller.
5. Write `refcheck.rs`. It checks the three `--ref` forms in the caller's checkout root, which is passed in, and
   returns `{value, branch, commit}`.
6. Write the shape check in `shape.rs`. It reads its limits from `questions-input.v1.json` (embedded), counts
   characters, and names the field and the rule on refusal.
7. Write `usecase.rs`:
   - `ask`;
   - `answer`, which applies the owner rule from QP-16 (`--via secretary` only for a caller with role
     `head:secretary*`);
   - `ack` and `cancel`, under the authority rules of QP-4;
   - `list` and `show`.
   After each append, the use case writes its event through `RecordDoor`, fail-open, with id `<qid>:<kind>`.
8. Write the tests `tests/store_*.rs` covering acceptance 1-3, over a temp repo with the Event Store initialised:
   - the fields of an ask, and every refusal;
   - each QP-19 rule;
   - answer-once;
   - the two-machine fold, using two writer ids;
   - the owner rule, with an agent ancestry fixture;
   - the ack and cancel authority (asker, same role, `answers:<id>`, migrated, stranger);
   - supersede;
   - the events and their attrs;
   - a failing Observe door.

## Verify
- `cargo test -p fgos-questions`
- `cargo clippy -p fgos-questions -- -D warnings`
- `test/architecture.test.mjs`, through the repo test runner

Pass condition: all three are green.

## Rollback
Revert the phase commit. No caller uses the crate yet.
