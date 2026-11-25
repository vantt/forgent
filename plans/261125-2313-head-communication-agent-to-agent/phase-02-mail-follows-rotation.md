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
`packages/mailbox/rust/store/tests/record_*.rs`, `apps/fgos/src/wiring/mailbox_verbs.rs`,
`apps/fgos/src/wiring/mailbox_hook.rs`, `apps/fgos/tests/mailbox_routes.rs`, `packages/mailbox/rust/store/src/verbs.rs`
(added 2026-11-26 so `inbox --claim` keeps one door in the store instead of a host copy; phase 5 writes it after).

Corrected 2026-11-26 after a first run proved the record cannot do this alone
(`reports/phase-02-blocker.md`): the host turns role mail and fixed-handle mail into the same
`Recipient::Key` (`apps/fgos/src/wiring/mailbox_verbs.rs:695-701`), and the hook drain gets no Identity fact of
who holds the role (`packages/mailbox/rust/store/src/hook/drain.rs:67-77`). The host wiring files join this phase;
phase 4 writes the same two host files afterwards, so they still have one writer at a time.
`apps/fgos/src/wiring/mailbox_identity.rs` is outside the plan footprint: call its public functions (`address`,
`identified`) and do not edit it; if an edit there is unavoidable, stop and report `needsWrites`.

## Steps

1. Find the owning proof of offering (`rg -n "offered" packages/mailbox/rust`), and extend it; do not add a second
   copy (design principle 8).
2. Write the failing case first: mail recorded for role R at generation N; the head rotates to N+1 (same role,
   new process); the drain of N+1 is offered the mail once; a second drain is offered nothing; N (if still alive
   during the handover) is not offered it again.
3. Identity stays the only authority on who holds a role (session-host spec §8.2: the predecessor keeps the role
   until the successor answers). Keep role-vs-handle addressing from the send through to the record, and pass
   Identity's role-holder fact to the drain through the existing hook boundary (`mailbox_hook.rs`). No mailbox-owned
   role registry.
4. Change the record so pending mail addressed to a role (not to a fixed handle) is matched to the role's live
   generation at drain time, and marked offered once. Mail addressed to one exact handle that is gone keeps
   today's notice.
5. Keep the snapshot schema compatible (older readers deny unknown fields), or bump it with a migration in the same change.

## Verify

`cargo test -p fgos-mailbox-core && cargo test -p fgos-mailbox --test record_snapshot && cargo test -p fgos --test
mailbox_routes`. Pass: the new case and every existing record test green; one wiring case in `mailbox_routes.rs` shows
role-addressed mail survives a handover and handle-addressed mail does not (cases stay in the core test).

## Rollback

The record is written as snapshot version 2 while no header carries a role, so reverting the phase commit is safe
until the first role-addressed mail is recorded; after that an older release refuses the v3 record (`Newer`), and a
rollback must first drain or drop role-addressed mail. Queued mail then goes back to staying with the old generation.
