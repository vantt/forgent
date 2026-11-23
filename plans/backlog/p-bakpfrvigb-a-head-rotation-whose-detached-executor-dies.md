---
id: p-bakpfrvigb
title: "A head rotation whose detached executor dies after starting the successor leaves the successor running and `rotation.json` behind (session-host, priority medium; source: review of the rotation executor, 2026-11-18)"
status: done
priority: P2
area: session-host
created: 2026-11-18
---

# Why

The executor started by `head rotate` places the successor, then waits for its answer. If that process dies in between, nothing ends the successor or removes the pending rotation; a late `head answered` can still move the role while `placement.json` names the old head. No recovery path and no `fgos doctor` pointer row cover it.

# Done when

A pending rotation whose executor is gone is found and resolved through the session-rotation component's own verb: Identity is asked who holds the role, and the rotation is either completed (placement follows the role holder, old head ended) or abandoned (successor ended, record removed); doctor carries one read-only pointer row.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
