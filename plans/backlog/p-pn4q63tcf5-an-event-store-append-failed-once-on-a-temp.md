---
id: p-pn4q63tcf5
title: An event-store append failed once on a temp sweep in a questions head test (event store, priority low; seen 2026-11-19)
status: proposed
priority: P3
area: event-store
created: 2026-11-19
---

# Why

`apps/fgos/tests/questions_head.rs` `only_the_secretary_answers...` failed 1 of 4 runs with `event-store-append-failed ... NotFound (during sweep_temps of .../.git/fgos/events)`; not reproduced in 8 single runs and 48 parallel runs (main and branch).

# Done when

A cause named for the sweep race (or the test's temp layout) and a fix with a proof that two appends sweeping the same events dir never fail NotFound.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
