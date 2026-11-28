---
id: p-bmrmckasdn
title: "Rename the supervision event queue to 'attention queue' and its events to 'attention items'; keep the name Event Store (supervision, priority low; source: owner decision D4 of ds-64l3h22msc, 2026-11-27 16:31)"
status: proposed
priority: P2
area: supervision
created: 2026-11-28
---

# Why

The owner decided on 2026-11-27 16:31 (D4 of discussion ds-64l3h22msc-gateway-cluster) to keep the name Event Store for the log store, and to rename the supervision event queue so that the two are not confused. The gateway-cluster shaper raised it as separate work (event ae993b34282b2832), because it is not part of the gateway design.

# Done when

Specs, skills, CLI help and output call the supervision queue the "attention queue" and its entries "attention items"; the Event Store keeps its name; no stale term remains in maintained docs.

# Notes

Filed by the supervisor from a coordination-help event. Decision record: plans/discussions/ds-64l3h22msc-gateway-cluster/DISCUSSION.md section 4.
