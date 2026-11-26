---
id: p-tep6reiuef
title: "Shaper heads lose their request socket after many hours of work, and the cause is not known (session-host, priority high; source: owner via Miu, 2026-11-26 evening)"
status: proposed
priority: P1
area: session-host
created: 2026-11-26
---

# Why

The owner asks to investigate why shaper heads lose their request socket after hours of work. Seen on 2026-11-26: the shaper of ds-que32ftgg6-ready-plan-runs-unattended (pane w6:p2CH, generation 1) said its session had lost its request socket, so each edit of its DISCUSSION.md needed another session to land it, and it asked for a restart; the secretary's own stop of that head ended `stop-not-ended` twice. A head that lost its socket can neither land, raise, nor be stopped through the door, so it keeps working in a state where its writes stay in the main checkout (the rule against leaving edits there is then broken by the system, not by the head).

# Done when

A written diagnosis names the cause with evidence: when the socket disappears (time since start, event, memory or cgroup kill, a rotation, a release switch), which heads it hits (only shapers, or leads and the secretary too), and what a head sees. It proposes one cause-aligned fix, such as the supervisor re-creating the socket, a head noticing the loss and rotating itself, or a watcher event for a lost socket. No fix is built before the cause is proven.

# Notes

Start from two open rows: p-6htu2ae64o (run supervisors started by the watcher share the watcher's cgroup, so one OOM kill takes down several heads' sockets) and p-nyhaakrsvz (`session stop` cannot end a head whose socket is gone). Both may already hold the cause or the effect. Related: p-nl4upzcvyh (confined head requests failing). Owner order, 2026-11-26.
