# Mailbox: seeing what was sent and whether the other side took it

Date: 2026-11-04. Author: lead:MAIL. Owner approved the goal on 11-04 15:55 ("duyệt"); this is the shape for OPC to review before code.

## Problem

A person watching two machines cannot tell what a session sent, nor whether the other side took it. `fgos mailbox send` prints one line; the receiver shows only a nudge line; `fgos mailbox status` says "N waiting for the receiver's fetch", which also counts mail that already reached the receiver but was not yet offered to a session.

## Facts the shared log can give (spec stays frozen, no new event type)

- A send is a signed `MESSAGE_SENT` event of the sender's machine: id, recipient, body, sentAt.
- The receiving machine writes a signed `MESSAGE_SETTLED` only when the message was offered to a session or refused (`offered` / `refused` + reason), with its own time `at`.
- There is no signed event for "reached the other machine". That fact cannot be shown without a new event; not proposed here.

## Proposal

1. `fgos mailbox status`: replace "waiting for the receiver's fetch" by "no answer yet from the receiving machine" (same count, honest name). `--json` keeps its field names and adds nothing.
2. New read-only verb `fgos mailbox sent [--follow] [--json]`: one line per send of the last 24 hours, newest last: sent time, recipient handle, first 60 characters of the body, state (`no answer yet`, `offered at <time>`, `refused <reason>`) and the seconds between send and answer. Incoming mail from other machines is listed the same way with the time this machine first saw it. `--follow` repeats the read every 5 s and prints only a new or changed line, until interrupted.
3. No write, no Git call, no process call: it reads the same fold `sent_summary` already reads (`apps/fgos/src/wiring/mailbox_remote.rs`). The verb is added to the mailbox surface list and the command registry.

## Not proposed

- A receipt for arrival on the other machine (needs a new signed event; spec change).
- Any change to wake, delivery or limits.

## Tests

The fold with a send, an offered settlement, a refused settlement and an unanswered send; `--follow` printing a line once and again after a change; the status text.

## Question for review

Is reading the existing fold from a new verb acceptable, and is the new status wording acceptable given scripts may match the old text (`src/setup/mailbox-limits.mjs:55` builds a similar doctor line and `test/setup/registrations.test.mjs:1283` asserts it; both would be changed together in the same commit)?
