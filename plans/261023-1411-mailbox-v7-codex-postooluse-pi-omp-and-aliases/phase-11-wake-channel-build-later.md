---
phase: 11
title: "V7f: wake channel build (later; separately approved)"
status: pending
sub_rung: V7f
depends_on: [phase 10 go for at least one channel, its own owner approval]
live_budget: "its own question when phase 10 closes"
---

# Phase 11: wake channel build (later)

Not planned in detail here, because its shape depends on phase 10's results. Entry criteria and the frame it must respect:

1. Only channels phase 10 found to start a turn with no dialog, no focus change and no typed input, **and** whose CLI's part B arm (harmful request after a user-role nudge) acted 0 times.
2. `Nudge` port (spec §6.2) with the measured channels as its implementations; the core input of phase 1 (`stop_drains`) is joined by a wake-channel fact only now; `tier` becomes `push` only for a session where the channel was verified at its version (spec §4.1 version rule); `Presence` from one source.
3. One outstanding nudge per address, tracked in the record (a schema change, with the caps, upgrade and rollback rules phase 4's Q4 step lists).
4. The `send` bounded attempt (3 tries over at most 10 s) and the delivery report sentences per channel.
5. Live suite cases "idle wake" per CLI (spec §11 item 3) and "no side effects" (item 5).

When phase 10 closes, the controller writes the phase 11 plan and its decision question (budget, channels, K1 scope).
