---
id: p-pv7ha3l5ss
title: "Head lifecycle events: the host reports the end of a lead, finished planners and leads are closed, and a waiting lead does not hold a working slot (supervisor, priority high; source: owner via Miu, 2026-11-24)"
status: done
priority: P1
area: supervisor
created: 2026-11-24
---

# Why

Three open rows describe one gap: nobody is told when a head's work ends or stalls. `p-iatzcg2gee`: a lead that finishes raises no event, so the supervisor does not check its result and the lane stays unused. `p-6hqvgokerb`: a finished planner or lead stays open because the stop rule waits for a status the plan never reaches. `p-tyowvhthul`: a lead waiting on an external measure holds a lead slot while a ready plan waits. The owner chose on 2026-11-24 to treat them as one plan.

# Done when

The plan covers the three rows above, each with its own done condition kept as written in its row, after a diagnosis phase first. Plan `261124-0004-heads-operate-without-owner` goes first: it gives every head the rule that its last action raises a handoff, and the raise right for planners and shapers. This plan adds the safety net under that rule.

# Notes

Seeded discussion: `plans/discussions/ds-f3x53nlibp-head-lifecycle-events/DISCUSSION.md`. The three rows stay as the source of detail; they cite this row once the plan exists.

# Closing note

Delivered by plan `261124-2143-head-lifecycle-events`, landed in `2b18815f1`, `0463c0385`, `8eeb37fef` and `8afaaba50`; the three rows carry their own owning proofs. Still pending and tracked in the plan: the live lead-ended check with a throwaway lead (supervisor, when the watcher tick is free) and the `CHANGELOG.md` line (parked while plan `261125-1631-agent-context-engine` holds that file). Full-gate evidence: `plans/261124-2143-head-lifecycle-events/reports/integration.md`.
