# Phase 3: Store crate and use cases

## Inputs
- `plan.md`, decisions QP-2..QP-8 and QP-15..QP-18. The contracts from phase 1. The mint kind from phase 2.
- The Observe shard door: `packages/observe/rust/src/shard.rs` (:75, :149, :194, :206, :279) and
  `store_lock.rs:43`.
- The landed write door, `record::write`, from ops-metrics phase 4. Read its real signature.
- Identity: `current_session` (`packages/identity/rust/src/current.rs`) and the directory roles (`directory.rs`), as
  they stand after the session-verb plan.
- The architecture guard: `test/architecture.test.mjs` and `docs/architecture-manifest.json`.

## Footprint
- `packages/questions/rust/src/**`
- `packages/questions/rust/Cargo.toml`
- `packages/questions/rust/tests/store_*.rs`
- `Cargo.toml` (members)
- `Cargo.lock`
- `docs/architecture-manifest.json`

## Steps
0. Re-grep every input. If the write door or Identity API differs from the plan, adapt behind one function. If a
   decision itself must change, stop with `NEEDS_CONTEXT`.
1. Create the crate `fgos-questions` with the dependencies `fgos-observe`, `fgos-identity` (feature `directory`) and
   serde. Add it to the root `Cargo.toml` members, and add a layer entry to the architecture manifest. The crate sits
   above observe and identity and knows no host, CLI or gateway code.
2. Write `record.rs`, the four record kinds from the phase 1 schema, with `include_str!` of `observe-kinds.json`
   exposed as `pub const OBSERVE_KINDS`.
3. Write `store.rs`. It calls `acquire_store_lock`, `append_lines(root, "questions", …)` and
   `read_store(root, "questions", …)`, and it has a `fold()` that produces a per-id state: open, answered, acked or
   cancelled. When several `answered` records exist for one id, the earliest `answeredAt` wins and the rest are kept
   as `conflicts`.
4. Write `asker.rs`. It is a port `AskerSource` with an Identity adapter: `{sessionId, handle, roles, persona from
   head:<p>, pane?}`. When the asker cannot be resolved it returns `asker-unresolved`. No input sets the asker.
5. Write `refcheck.rs`, which implements the three `--ref` forms of QP-7 against the main checkout root.
6. Write the use cases in `usecase.rs`:
   - `ask(input, ref, flags)`: validate the parts and the shape rules (QP-5, QP-17 and QP-19, with the limits read
     from the input contract), mint an id, append `asked`. With `--supersedes`,
     append `cancelled` for the old question under the same lock.
   - `answer(id, option?, text?, via?)`: check that the caller is the owner (QP-16), check that the question is open,
     and append `answered`.
   - `ack(id)` and `cancel(id, reason)`: only the asker or a successor (`--for <id>`) may call them.
   - `list(filter)` and `show(id)`.
   - Each write is followed by an event through the write door: fail-open, with deterministic id
     `<question id>:<kind>` (QP-8). Events go out after the store append and outside the store lock, so that an
     Observe failure never undoes a recorded question.
7. Write the tests in `tests/store_*.rs`, covering acceptance 1-3, over a temp main root:
   - the fields of a recorded ask;
   - each refusal by name, plus one `question-unclear` case for each QP-19 rule;
   - answer once and the conflict fold;
   - the owner rule;
   - the ack/cancel rule;
   - supersede;
   - events written with their attrs;
   - a held Observe lock that still leaves the question recorded.

## Verify
- `cargo test -p fgos-questions`
- `cargo clippy -p fgos-questions -- -D warnings`
- `node --test test/architecture.test.mjs`, through the repo test runner.

Pass condition: all three commands are green.

## Rollback
Revert the phase commit. Nothing outside the new crate calls it yet.
