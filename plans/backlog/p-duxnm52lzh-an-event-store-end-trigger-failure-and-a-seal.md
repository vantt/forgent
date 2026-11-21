---
id: p-duxnm52lzh
title: An Event Store end-trigger failure and a seal child that cannot start are only partly traced
status: proposed
priority: P2
area: event-store
created: 2026-11-21
---

# Why

(1) `handSealsToChild` in `bin/fgos.mjs` ignores the spawn error of the detached seal child, so a seal child that cannot start leaves no record, while the publish child's spawn failure is recorded. (2) The invocation-fault log has no throttle: a trigger error that persists writes one `event-store-end-trigger` record per command, and each record resolves the writer identity through the host. Found by `lead:ES` reviewing HARDEN T3-04b part 2 (notes N2, N3; [ES plan](../plans/261018-0945-event-store-fgos-event-store/plan.md) hand-off table).

# Done when

A seal child that cannot start leaves a record like the publish child does; a repeated identical trigger failure writes at most one record per interval; one proof each, in `test/event-store/triggers.test.mjs`

# Notes

Migrated from the legacy backlog table. Original status: proposed.
