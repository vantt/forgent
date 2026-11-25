---
id: p-7vhbq46shs
title: "Retire session.verbs in the execution engine, make fgos can-i answer outside a head, and pay the 4 remaining door-row allowance lines (session-host/execution, priority high; source: owner answer q-ulx4nkztpq, 2026-11-25 10:59)"
status: proposed
priority: P1
area: session-host
created: 2026-11-25
---

# Why

Phase 2 of plan `261124-0004-heads-operate-without-owner` lands as is, with its step 9 recorded as partly met, because the owner chose the follow-up item on q-ulx4nkztpq. Behaviour is correct today: the in-scope reader fills `session.verbs` from the new table. But the leftovers below are outside that plan's footprint and need their own work.

# Done when

- The execution engine no longer writes or gates on `session.verbs`: `packages/execution/engine/src/transport_round/session_attempt.rs` and `packages/execution/engine/tests/transport_round.rs`.
- `fgos can-i` outside a head session gives a real answer, not the "unknown verb" reply from `bin/fgos.mjs`.
- Step 9's rg check of that plan finds no allowance lines in the door rows. Today it finds 4: head-start's seam import; `bind` and `readAccountStateOverlay`, which have no door; and head-request's three imports, which have no seam-row entry.

# Notes

Details: `plans/261124-0004-heads-operate-without-owner/phase-02-argv-window.md`, section "Owner answer q-ulx4nkztpq". The worker's report is in unit run `unit-run-1795576677937-017b4e0f`. Raised to the supervisor by the plan's lead, because a lead cannot write the backlog.
