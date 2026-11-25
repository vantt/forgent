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

# Update 2026-11-25 (supervisor)

The trace stays partial because `p-cg4w6nn5l6` drops the path and the operation. The failure fires at the end of every verb (`questions`, `supervisor`, `watcher`, `land`), 2740 times in the fault log, and nothing shows it blocking a verb. A disk-full window on 2026-11-25 around 14:08 may explain the recent ones but not the count from 2026-11-24. Raise to P1 only after `p-cg4w6nn5l6` lands and the first real cause is read.
