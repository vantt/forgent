---
id: p-xpeg4jshiu
title: A ready plan waits up to the idle interval before the watcher sees it (supervision, priority medium; live run of plan 261118-1045, 2026-11-19)
status: proposed
priority: P2
area: supervision
created: 2026-11-19
---

# Why

With no `watcher-active` row the tick exits early until `watcher.idleIntervalSec` (900 s) passed, so a plan landed `ready` on a quiet project is raised up to 15 minutes later (live run: landed 11:49, raised 12:03).

# Done when

A plan or discussion status commit on the trunk makes the next tick a full one (or counts as activity for `watcher-active`), proven by a watcher test; the idle interval still holds when nothing changed.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
