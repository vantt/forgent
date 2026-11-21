---
id: p-i2nsdjgwuz
title: A launch can wait up to about 90 s for a credential renewal before its agent starts
status: proposed
priority: P2
area: dispatch
created: 2026-11-21
---

# Why

`leaseAccountForAttempt` (`src/runner/dispatch/assignment-runner.mjs`) awaits refresh-ahead for every renewable login source of the leased account before the launch; when a token is inside its window it takes the account lock and runs a real provider CLI renewal (cap 90 s), and the other seats of a panel on that account wait on the lock. Unreproduced; found by the HARDEN T5 speed seat (S-6, [report](../plans/reports/council-261104-1840-harden-t5-seat-speed.md)), routed to the backlog by the [arbitration](../plans/reports/council-261104-1854-harden-t5-arbitration.md) §4. Behaviour change, so an owner question: renew in the background and launch with the current token, or keep renewing first.

# Done when

Measured on a real panel whose account token is in its window (time from lease to agent start per seat); owner answer recorded; if changed, a launch never waits on another seat's renewal and a token that expires mid-run is renewed by the existing path; one test of the chosen order

# Notes

Migrated from the legacy backlog table. Original status: proposed.
