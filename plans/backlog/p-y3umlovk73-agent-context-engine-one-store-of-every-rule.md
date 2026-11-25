---
id: p-y3umlovk73
title: "Agent Context Engine: the one store of every rule in the system, without duplicates or conflicts"
status: proposed
priority: P1
area: instructions
created: 2026-11-25
---

# Why

The owner's definition (2026-11-25, ACE-D1 in [ds-e26zcar63f](../discussions/ds-e26zcar63f-agent-context-engine/DISCUSSION.md)): ACE is the one place that organizes, stores and manages every rule in the system and keeps them free of duplicates and conflicts. Today only a small core exists: the Node instruction registry inside packaging-distribution, which manages 7 rule files, catches duplicates by id only and conflicts only when an author declares them. Most fgOS rules live outside it. ASC (`p-25q7tz6jtt`) selects from ACE at agent start; packaging-distribution writes files through ASC (ACE-D2).

# Done when

Every fgOS-owned rule lives in ACE with one owner; ACE refuses a rule that duplicates or conflicts with another by content, not only by id; ASC is ACE's only reader for selection; the component has its own spec and authority row.

# Notes

The ordering against ASC and whether ACE splits out of packaging-distribution are open in the discussion (P1, P3).
