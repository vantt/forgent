---
id: p-btxvtb34u3
title: "`fgos answer` from the confined secretary head fails EROFS opening `.fgos/locks/.hot.tmp-*` (agent confinement, priority high; source: secretary via the supervision queue, 2026-11-21)"
status: proposed
priority: P1
area: agent-confinement
created: 2026-11-21
---

# Why

On release 7aeee9e1 the secretary's grant verbs (supervisor plans/queue, slots, session stop) work, but recording an answer to a parked question writes a temp file under `.fgos/locks/`, which the bwrap launcher mounts read-only, so the secretary cannot record owner answers and the owner or another session must relay by hand. `fgos mailbox send` from the same sandbox is untested. Related: p-zgbqe2bpig (grants for writes and mail), p-kum6n4k3wf (a read-only state root breaks a temp-dir write).

# Done when

A confined head whose role records owner answers can run `fgos answer` (its write goes through the head's request route or its grant covers the lock dir), and mailbox send is proven from the same sandbox; an owning test runs both from a confined head with a read-only `.fgos`.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
