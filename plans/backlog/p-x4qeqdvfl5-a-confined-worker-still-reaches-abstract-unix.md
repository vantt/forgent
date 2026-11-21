---
id: p-x4qeqdvfl5
title: A confined worker still reaches abstract unix sockets and localhost services
status: proposed
priority: P2
area: agent-confinement
created: 2026-11-06
---

# Why

bwrap shares the host network namespace, so a worker under a read-only policy can connect to abstract sockets (seen on fg-server2: `@/tmp/.X11-unix/X1048`, `X1049`) and to services listening on the host (mdview `0.0.0.0:7700`, skillstation `:7420`); egress is open too. Path masks cannot cover an abstract socket or a TCP port. Found by the HARDEN T5 red-team seat (P-2, [report](../plans/reports/council-261104-1840-harden-t5-seat-redteam.md)), addition A6 of the T5 [arbitration](../plans/reports/council-261104-1854-harden-t5-arbitration.md); owner 2026-11-06: record it as its own item, outside T5.

# Done when

A worker under a policy whose capability needs no egress beyond its provider runs in its own network namespace: no abstract socket or localhost service of the host is reachable, and the provider endpoint still is (how is the design question: a proxy, a pasta/slirp link or an allow list); policies that need egress keep it; the owning proof runs a real bwrap worker that tries an abstract socket and a localhost port and is refused; the confinement spec threat list names what remains reachable

# Notes

Migrated from the legacy backlog table. Original status: proposed.
