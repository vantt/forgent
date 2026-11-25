# Phase 1: The trigger's error keeps the detail

Capability: `code:implement`.

## Inputs

- `plan.md` of this plan: "Facts" and "Decision".
- `packages/event-store/rust/src/errors.rs`: `Error` (display `"{code}: {detail}"`) and `io(operation, path)`.
- `packages/event-store/rust/src/lifecycle.rs:56-150`: `Outcome`, `code_of`, `maintain`.
- `packages/event-store/rust/src/resolve.rs:10-37`: `ResolveError::code`.
- `packages/event-store/rust/tests/lifecycle.rs`: the `World` fixture and the tests that pin bare codes.
- `test/event-store/triggers.test.mjs:200-232`, `test/event-store/lifecycle.test.mjs`.
- `docs/platform/event-store/spec.md` §16 and its dated clarifications near line 1236.

## Footprint

- `packages/event-store/rust/src/lifecycle.rs`
- `packages/event-store/rust/tests/lifecycle.rs`
- `packages/git/node-addon/src/event_store.rs` (doc comment of `maintain_event_store` only)
- `src/event-store/maintenance.mjs` (doc comment of `maintainEventStore` only, if it states "code")
- `test/event-store/triggers.test.mjs`, `test/event-store/lifecycle.test.mjs`
- `docs/platform/event-store/spec.md`

## Steps

1. In `lifecycle.rs`, replace `code_of` with one function (for example `describe`) that returns `error.to_string()`
   when `error.detail` is not empty and `error.code.to_string()` otherwise. Use it at every `fail(...)` site, including
   `ResolveError::Machine`. Leave `ResolveError::code()` for the other variants unchanged. Update the doc comment on
   `Outcome.error` to say: the code of the first step that failed, followed by `": "` and its detail when it has one.
2. Add one test to `packages/event-store/rust/tests/lifecycle.rs`, named for the behaviour (for example
   `a_trigger_io_failure_names_the_operation_and_the_path`): make a seal step fail on io in a way that does not depend
   on running as non-root (for example replace the stream's active file or its seal directory with a directory, as
   the World fixture allows), run the end trigger and assert the error starts with `event-store-io: `, contains
   `during ` and contains the failing path. Say in its doc comment why no existing test proves it (the existing ones
   only pin codes).
3. Move the existing bare-code assertions in that file to the new form: an exact string where the detail is known,
   else a code-led match. Do not drop an assertion.
4. Run the grep from the plan's risk list and move every other exact-code match on a trigger message (for example
   `triggers.test.mjs:218,230`) to `^<code>(: |$)`.
5. Update the two doc comments (addon, `maintenance.mjs`) where they say "the code".
6. Add one dated line under the event-store spec's clarifications: a trigger's error, and so the
   `event-store-start-trigger`/`event-store-end-trigger` fault message, is the code followed by its detail (for an io
   error: the kind, the operation and the path).
7. Before the focused Node tests, rebuild the host and addon as `scripts/run-tests.mjs:44` does
   (`cargo build --locked --release -p fgos -p fgctl -p fgos-node-addon`).

## Verify

```bash
cargo test -p fgos-event-store --test lifecycle
cargo test -p fgos-event-store --lib errors
node --test test/event-store/triggers.test.mjs test/event-store/lifecycle.test.mjs
```

Pass: all green; the new test fails on the old `code_of` (check by reverting step 1 locally once).

## Rollback

Revert this phase's commit; nothing else depends on the new text.
