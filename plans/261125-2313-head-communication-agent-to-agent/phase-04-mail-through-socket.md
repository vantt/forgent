# Phase 4: Mail through the request socket

Every head persona sends and reads its own mail through its request socket; the host writes the record and the
lock; every forwarded refusal carries its real code (discussion task `task-mail-through-socket`, §3 rows 5, 7, 14;
HC-D1). Capability: `code:implement`.

## Inputs

- Phase 1 report `reports/diagnose-confined-mail.md`: the cause to fix. If it puts the cause outside this footprint,
  stop and run `fgos supervisor raise --kind coordination-help` naming the file; do not widen the footprint.
- `packages/session-host/contracts/head-permissions.v1.json` and its `description`/`matching` prose.
- `packages/session-host/rust/src/forwarder.rs` (refusal mapping near line 509), `permissions.rs`.
- `packages/run-supervisor/rust/src/head_client.rs`, `head_request.rs`.
- `apps/fgos/src/wiring/mailbox_verbs.rs`, `mailbox_root.rs`, `mailbox_hook.rs`; `apps/fgos/tests/mailbox_routes.rs`.

## Footprint

`packages/session-host/contracts/head-permissions.v1.json`, `packages/session-host/rust/src/forwarder.rs`,
`packages/session-host/rust/src/permissions.rs`, `packages/session-host/rust/tests/forwarder.rs`,
`packages/session-host/rust/tests/permissions.rs`, `packages/run-supervisor/rust/src/head_client.rs`,
`packages/run-supervisor/rust/src/head_request.rs`, `apps/fgos/src/wiring/mailbox_root.rs`,
`apps/fgos/src/wiring/mailbox_hook.rs`, `apps/fgos/src/wiring/mailbox_verbs.rs`, `apps/fgos/tests/mailbox_routes.rs`.

## Steps

1. Add one `mailbox inbox` row (`allow`, not `read: true`, since `inbox --claim` changes the record) to the base `head` persona, so every persona inherits the read
   of its own inbox. Leave every `mailbox send` row as is (lead and planner `--to` limits stay). The host's inbox
   reads only the caller's own mail; confirm that from the envelope's identity, and add a case that `inbox` cannot
   name another head.
2. Fix the cause phase 1 named so a confined `send` and `inbox` are executed by the host (forward rows), which opens
   the record and lock; the confined process opens neither.
3. In `forwarder.rs`, make a host verb's own refusal code reach the caller in every printed form the host uses; a
   bare `host-failed` stays only for a host that died with no output, and then its message says so and names the
   exit. Extend the existing forwarder test with the case from phase 1.
4. Extend `permissions.rs` tests: each persona's `mailbox send` and `mailbox inbox` decision.
5. Extend `mailbox_routes.rs` with one confined send and read through the socket that returns the mail.

## Verify

`cargo test -p fgos-session-host --test permissions --test forwarder && cargo test -p fgos --test mailbox_routes`.
Pass: the new cases and every existing case green; no test asserts `host-failed` for a refusal that printed a code.

## Rollback

Revert the phase commit. The permission table is compiled into the crate, so the revert removes the rows.
