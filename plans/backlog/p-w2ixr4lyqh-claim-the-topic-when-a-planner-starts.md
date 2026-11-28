---
id: p-w2ixr4lyqh
title: "Write the plan claim (host) when a settled discussion starts its planner, not only at execution, so another machine does not plan or admit the same topic (supervision, priority medium; source: owner chat 2026-11-27 15:49 via lead of plan 261127-1535)"
status: proposed
priority: P1
area: supervision
created: 2026-11-28
---

# Why

Plan 261127-1535 (plan claim: who and where) claims a plan only when it is admitted for execution. The owner asked on 2026-11-27 15:49 to extend the claim to planning: when `discussion-settled` starts the planner, the host claim must be written then. Otherwise a second machine can start a second planner or admit the same topic. It was outside 1535's approved criteria, so its lead raised it (event 4a65f62f3669e193).

# Done when

Starting the planner of a settled discussion writes the claim with the host; a second machine's supervisor refuses to start a planner or admit a plan for a topic that another host has claimed.

# Notes

Filed by the supervisor from a coordination-help event. It builds on the claim mechanism landed by plan 261127-1535.
