---
id: p-i3wtdpfeyk
title: "A confined `fgos session stop` drops `--wake-at`, `--plan` and `--phase` when it forwards to the host (session-host, priority P2; source: lead of plan 261122-0056 via the help queue, 2026-11-26; report `plans/261122-0056-orchestration-skeleton/reports/lead-261126-1653-wave-1-status.md`)"
status: proposed
priority: P2
area: session-host
created: 2026-11-26
---

# Why

`apps/fgos/src/routing.rs:781` forwards a confined head's `session stop` without the `--wake-at`, `--plan` and `--phase` flags. A confined head that stops a session to sleep loses the wake time and the plan binding, so the sleep record the Keeper reads (plan 261122-0056 phase 16) is incomplete when the stop comes through the socket.

# Done when

A confined `session stop` forwards every flag the unconfined verb accepts, and one wiring proof shows `--wake-at`, `--plan` and `--phase` reaching the host.

# Notes

Raised by the Keeper lead (plan 261122-0056) as out of its plan scope in help event 3ad2caf1cb1c3171; recorded by the supervisor.
