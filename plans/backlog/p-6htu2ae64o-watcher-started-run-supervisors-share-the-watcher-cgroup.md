---
id: p-6htu2ae64o
title: "Head run supervisors started by the watcher live in the watcher unit's cgroup, so one OOM kill takes down several heads' request sockets (session-host, priority high; source: lead:SUPERVISOR, 2026-11-23)"
status: proposed
priority: P1
area: session-host
created: 2026-11-23
---

# Why

The watcher starts head run supervisors inside its own unit's cgroup. One OOM kill (seen at 09:17 and 11:10) took down the request sockets of several heads at once. Evidence: this morning's supervisor wake reports.

# Done when

A head's run supervisor does not share a failure domain with the watcher or with other heads; an OOM kill of one does not remove the others' sockets.

# Notes

Reported by lead:SUPERVISOR on 2026-11-23 and filed by the secretary on the owner's order. The cause is not proven by the secretary; evidence is in the reports named above.
