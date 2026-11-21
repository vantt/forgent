---
id: p-uqanurjt42
title: "A Busy refusal at publish leaves the head's written file uncommitted (session-host, priority high; source: lead:SECRETARY-CAPS review of plan 261119-1615 phase 6, 2026-11-19)"
status: proposed
priority: P1
area: session-host
created: 2026-11-19
---

# Why

When `fgos session write` has written the granted file and the publish step is then refused as Busy, the file stays written but uncommitted in the main checkout. Every later session write is refused `write-path-dirty` until a person cleans it by hand, so the secretary loses its write door.

# Done when

A publish-side Busy refusal is retried like the catch-up, or the route restores the file it wrote when publish is refused; an owning test drives a Busy publish and shows the next session write succeeds.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
