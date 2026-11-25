---
id: p-cg4w6nn5l6
title: Event-store io errors drop the path and the operation, so a CI-only `NotFound` cannot be traced (event store, priority medium)
status: done
priority: P2
area: event-store
created: 2026-11-15
---

# Why

`errors::io` (`packages/event-store/rust/src/errors.rs:35`) keeps only the io kind and message; about 40 call sites map through it. On main run 43683728551 (75a69a800, 2026-11-15) two tests failed at the first state write after `init` in a fresh temp repo with `event-store-io: NotFound ... (os error 2)`: the fixture-marketing "blocked" e2e case and `decision-index --check`. The same tests passed in the next run and in 20 parallel CI-emulated local runs; that runner was about 4x slower than usual. Unproven guess: a race with a detached `events seal` child.

# Done when

An event-store io error names the operation and the path; the `decision-index` test prints the child's stderr on failure; if the flake recurs, its cause is proven from the log and fixed at the source.

# Notes

Migrated from the legacy backlog table. Original status: proposed.

# Update 2026-11-25 (supervisor)

This is why the 2740 `event-store-end-trigger: event-store-io` faults in `.fgos/logs/invocation-faults.jsonl` carry no path and no operation: the message is only `event-store-io`. 21 of them hit the `land` verb after 14:35 today. The disk reached 100% at about 14:08, so `No space left on device` is one candidate cause, but the fault log cannot confirm it. Fix this row first: with the path and the operation in the error the other row (`p-duxnm52lzh`) becomes traceable.
