# Phase 02: wake from another machine

## Context
After phase 01 the receiver's sync child ingests verified remote mail but marks it `wake: false` always (remote mail never wakes).

## Requirements
- A remote message may carry the sender's wake permission in the signed event (`wake: true`); the signed bytes change only by adding that field to the payload's domain version, with older readers refusing the new version rather than ignoring the field.
- The sync child nudges only when: the machine key is `confirmed`, the sender session is verified, the head is idle and its tier is `push`, and a wake-specific cap per verified sender (separate budget, smaller than the mail cap) is not spent. Otherwise the mail is recorded as today.
- The nudge line is the fixed text of phase 01; the body never travels with it.
- The settlement event reports `offered` with whether a nudge was sent, so the sender's `fgos mailbox status` can say "woke" or "waiting for next tool call".

## Files
`apps/fgos/src/wiring/{mailbox_ingest.rs,mailbox_sync.rs,mailbox_remote.rs}`, `packages/mailbox/contracts/remote.v1.json` (new version), core `remote.rs` wake cap, `packages/mailbox/rust/core/src/{policy.rs,counters.rs}`, tests in `apps/fgos/tests/mailbox_routes.rs`.

## Validation
Two-machine test on one bare remote (idle Codex head woken once; a machine with an unconfirmed key never wakes; a flood from one sender stops at the wake cap and mail still lands); then the live proof between fg-server and fg-server2 recorded under `plans/reports/`.

## Risk and rollback
A machine whose key is confirmed can start turns on another machine: the new attack surface, bounded by the cap and the fixed line. Rollback: wake key off; mail delivery unaffected.
