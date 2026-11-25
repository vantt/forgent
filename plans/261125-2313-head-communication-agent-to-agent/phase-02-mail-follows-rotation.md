# Phase 2: Queued mail follows a rotation

Mail queued for a head's old generation is offered to its successor exactly once (discussion task
`task-mail-follows-rotation`, backlog `p-bifjfd5rix`). Capability: `code:implement`.

## Inputs

- `plans/backlog/p-bifjfd5rix-mail-queued-for-a-head-s-old-generation-is-never-offered.md` (mail
  `6c641a476c514265`, notice `ack-not-offered`).
- `docs/platform/agent-mailbox/spec.md` §5.1 (address, per-process generation), §5.2 (states), §6.4 (record).
- `packages/mailbox/rust/core/src/registry.rs`, `state.rs`, `policy.rs`; `packages/mailbox/rust/store/src/record/`
  (`snapshot.rs`), `packages/mailbox/rust/store/src/hook/drain.rs`.
- `docs/platform/session-host/spec.md` (read only) for how a rotation names its successor (role stays, generation
  changes).

## Footprint

`packages/mailbox/rust/core/src/**`, `packages/mailbox/rust/core/tests/**`,
`packages/mailbox/rust/store/src/record/**`, `packages/mailbox/rust/store/src/hook/**`,
`packages/mailbox/rust/store/tests/record_*.rs`.

## Steps

1. Find the owning proof of offering (`rg -n "offered" packages/mailbox/rust`), and extend it; do not add a second
   copy (design principle 8).
2. Write the failing case first: mail recorded for role R at generation N; the head rotates to N+1 (same role,
   new process); the drain of N+1 is offered the mail once; a second drain is offered nothing; N (if still alive
   during the handover) is not offered it again.
3. Change the record so pending mail addressed to a role (not to a fixed handle) is matched to the role's live
   generation at drain time, and marked offered once. Mail addressed to one exact handle that is gone keeps
   today's notice.
4. Keep the snapshot schema compatible, or bump it with a migration in the same change.

## Verify

`cargo test -p fgos-mailbox-core && cargo test -p fgos-mailbox --test record_snapshot`. Pass: the new case and every
existing record test green.

## Rollback

Revert the phase commit; queued mail goes back to staying with the old generation.
