---
id: p-gao5iqcu7j
title: A remote need-ack notice names the recipient by an unregistered label, not its handle (mailbox, priority low)
status: proposed
priority: P3
area: mailbox
created: 2026-11-21
---

# Why

After `send --need-ack` to a head on another machine (need-ack P5), the ack notice shows the recipient as a label the receiving side never registered, so a reader cannot tell which head it was. Found by MAIL and agreed separate by the reviewer (OPC).

# Done when

`AckWatch` and `Notice` carry an optional serde-default `to_label`, the same additive pattern as `to_machine`; the notice names the recipient's handle; older records without the field still read.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
