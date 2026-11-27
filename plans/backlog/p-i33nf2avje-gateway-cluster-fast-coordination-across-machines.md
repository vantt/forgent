---
id: p-i33nf2avje
title: "Restore the gateway, split it into components, and join gateways of many machines into one cluster that carries coordination events fast (gateway, priority high; source: owner, 2026-11-27)"
status: proposed
priority: P1
area: gateway
created: 2026-11-27
---

# Why

The gateway is not running, and coordination between machines (mailbox, events, plan/task admission) is too slow and
can overlap. Owner, 2026-11-27: gateways of different machines should join one cluster, coordinate many projects
across machines, and first carry coordination data fast between machines; plan files stay the truth, coordination
events may travel ahead of them.

# Done when

The discussion `ds-64l3h22msc-gateway-cluster` is settled, and its plan is done.

# Notes

Discussion: `plans/discussions/ds-64l3h22msc-gateway-cluster/DISCUSSION.md`.
