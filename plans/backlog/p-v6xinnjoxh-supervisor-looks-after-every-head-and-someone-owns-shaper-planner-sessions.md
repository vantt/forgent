---
id: p-v6xinnjoxh
title: "The supervisor looks after every head session, and someone owns shaper and planner sessions once they finish (supervisor, priority P1; source: owner order to the secretary, 2026-11-23)"
status: proposed
priority: P1
area: supervisor
created: 2026-11-23
---

# Why

The owner observed that the supervisor, once woken, only looks after the plan's lead sessions and does nothing for the shaper and planner sessions. The secretary cannot cover this: her grant has no `session read` or `session type`, so she cannot see or unstick them. Today a person acting as the supervisor does it by hand.

# Done when

1. Every session called a head (an independent session) has one named owner that watches it, reads it on site, types into it when it is stuck, and stops or replaces it when idle or finished. The supervisor owns all of them, shaper and planner included, not only leads.
2. The owner's second question is answered in a spec: when a shaper or planner finishes its work, who closes it (hands its output on, stops the session, frees its seat), so none is left idle and holding a slot.
3. The supervisor's grant and procedure carry this, and a check shows an idle planner or shaper is noticed and handled without the owner asking.

# Notes

Owner words, 2026-11-23: the supervisor must look after everything called a head (independent sessions); who looks after shaper and planner when they are done. A help event for the supervisor was raised the same day (`6d77715587ea6b76`) as a one-off.
