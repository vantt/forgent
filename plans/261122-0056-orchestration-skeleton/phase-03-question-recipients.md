# Phase 3: Question recipients, notifier port, verified answers

Decisions: OS-D16 (one door for asking any person; recipient `to`; answers from outside come in through the raise
door and are verified), OS-D20 port 1.

## Inputs

- `packages/questions/contracts/questions-input.v1.json`, `question-event-payloads.v1.json`, `refusals.v1.json`.
- `packages/questions/rust/src/` (`shape.rs`, `record.rs`, `usecase.rs`, `lib.rs`).
- `docs/platform/questions/spec.md`; `docs/platform/identity/spec.md` (roles are never person names).
- Discussion §3 4k (the analysis behind OS-D16).

## Footprint

`packages/questions/contracts/questions-input.v1.json`, `packages/questions/contracts/question-event-payloads.v1.json`,
`packages/questions/contracts/refusals.v1.json`, `packages/questions/rust/src/shape.rs`,
`packages/questions/rust/src/record.rs`, `packages/questions/rust/src/usecase.rs`,
`packages/questions/rust/src/notifier.rs` (new), `packages/questions/rust/src/lib.rs`,
`packages/questions/rust/tests/store_usecases.rs`, `packages/questions/rust/tests/recipients.rs` (new), `packages/questions/contracts/question-event-streams.v1.json`, `packages/questions/rust/src/store.rs`, `apps/fgos/src/wiring/questions.rs`.
(Widened by owner answer q-lg7eqpld4j.)

## Steps

1. Add optional `to` to the ask input and the `questions.asked` payload: absent means the owner; otherwise
   `{ "kind": "role", "ref": "<role>" }` or `{ "kind": "party", "ref": "<scheme>:<id>" }` (for example
   `customer:<account-id>`). A person's name is refused (`recipient-invalid`), by the same rule Identity uses.
2. Add a notifier port (`notifier.rs`): `deliver(question) -> Result<DeliveryRef, Refusal>`. One adapter in this
   phase: the owner mailbox (today's behavior moved behind the port). A recipient with no registered channel adapter
   records `questions.delivery-pending` with reason `channel-unavailable`, visible in `fgos questions list`; it never
   fails the ask.
3. Add the use case `answer_external(question_id, answerer, payload, channel)`: accept only when the question is open,
   its `to` is a `party` or `role`, and the answerer the channel vouches for equals `to`; otherwise refuse with
   `answerer-mismatch` or `question-not-open`. Accepted answers append `questions.answered` with the answer marked as
   untrusted data and the channel recorded. Signature checking belongs to the channel adapter at the gateway (phase 2);
   this use case trusts only what the adapter attests.
4. `fgos questions answer` (the owner's path) stays as is.

## Verify

`cargo test -p fgos-questions --test recipients --test store_usecases`. Pass: ask with `to` role and party; ask with a
name refused; external answer by the right party becomes `questions.answered`; wrong party refused with
`answerer-mismatch`; answering a closed question refused; a party with no channel records `delivery-pending`. Existing
store tests stay green.

## Rollback

Revert the phase commit. `to` is optional, so questions already in the store fold unchanged.
