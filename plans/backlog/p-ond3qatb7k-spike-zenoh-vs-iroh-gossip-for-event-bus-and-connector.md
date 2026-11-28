---
id: p-ond3qatb7k
title: "Spike: compare Zenoh and iroh-gossip for the event bus and the cross-machine connector, measured between fg-server and fg-server2 (gateway-cluster, priority medium; source: owner approval 2026-11-27 18:17 via ds-64l3h22msc shaper)"
status: proposed
priority: P1
area: gateway
created: 2026-11-28
---

# Why

The gateway-cluster design (ds-64l3h22msc) needs an event bus and a connector between machines. The owner approved a spike on 2026-11-27 18:17 to compare Zenoh and iroh-gossip before the design picks one. A shaper cannot run code, so it raised the job (event 43194a5c3682229a).

# Done when

A report under plans/reports/ compares both libraries on the same measured cases, run in a linked worktree with Tailscale access to both fg-server and fg-server2, and gives a recommendation that the gateway-cluster discussion can settle.

# Notes

The shaper said the brief is the anchor task-spike-bus-connector in section 7 of the DISCUSSION.md. On main at 2026-11-28 08:04 section 7 is still empty ("Not yet; filled once §6 holds"), so the brief must come from the shaper before the spike starts. Filed by the supervisor from a coordination-help event.
